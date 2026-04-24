import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'
import { isDbAvailable, db } from '@/lib/db'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = rateLimit(`login:${ip}`, { limit: 10, windowMs: 60000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
      })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // ═══ MASTER ADMIN FALLBACK (works even without DATABASE_URL) ═══
    if (MASTER_ADMIN_EMAILS.includes(normalizedEmail as typeof MASTER_ADMIN_EMAILS[number])) {
      const storedHash = process.env.MASTER_ADMIN_PASSWORD_HASH
        || (process.env.NODE_ENV === 'production' ? null : '$2b$10$U4wggkt6Poq81imvkTXlBuUjHSD9TqPYJBUi6FHLojoZwZ/7lJAsi')
      if (!storedHash) {
        return NextResponse.json({ error: 'Service unavailable. Contact administrator.' }, { status: 503 })
      }
      const isValid = await compare(password, storedHash)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
      }
      return NextResponse.json({
        user: {
          id: `admin-${normalizedEmail}`,
          name: normalizedEmail.split('@')[0],
          email: normalizedEmail,
          role: 'master_admin',
        },
      })
    }

    // ═══ DATABASE LOOKUP (for regular team members) ═══
    if (!isDbAvailable()) {
      return NextResponse.json({ error: 'Service temporarily unavailable. Database is not configured.' }, { status: 503 })
    }

    const user = await db.teamMember.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // Check password — only bcrypt hashes are accepted
    if (user.password && user.password.length > 0 && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      const isValid = await compare(password, user.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // Determine role
    const role = user.role === 'master_admin' || MASTER_ADMIN_EMAILS.includes(user.email as typeof MASTER_ADMIN_EMAILS[number])
      ? 'master_admin'
      : user.role

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
