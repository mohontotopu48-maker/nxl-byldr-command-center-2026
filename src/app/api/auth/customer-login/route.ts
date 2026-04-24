import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { compare } from 'bcryptjs'
import { getFallbackCustomer } from '@/lib/customer-store'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rl = rateLimit(`customer-login:${ip}`, { limit: 10, windowMs: 60000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
      })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // ═══ HARDCODED / IN-MEMORY CUSTOMER FALLBACK (works without DATABASE_URL) ═══
    const fallbackCustomer = getFallbackCustomer(normalizedEmail)
    if (fallbackCustomer) {
      const isValid = await compare(password, fallbackCustomer.passwordHash)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
      }
      if (fallbackCustomer.status === 'inactive') {
        return NextResponse.json({ error: 'Your account has been deactivated. Please contact support.' }, { status: 403 })
      }
      return NextResponse.json({
        user: {
          id: fallbackCustomer.id,
          name: fallbackCustomer.name,
          email: fallbackCustomer.email,
          company: fallbackCustomer.company,
          phone: fallbackCustomer.phone,
          role: 'customer',
          plan: fallbackCustomer.plan,
        },
      })
    }

    // ═══ DATABASE LOOKUP (when DATABASE_URL is configured) ═══
    if (!isDbAvailable()) {
      return NextResponse.json({ error: 'Service temporarily unavailable. Database is not configured.' }, { status: 503 })
    }

    const customer = await db.customer.findUnique({
      where: { email: normalizedEmail },
    })

    if (!customer || !customer.password || (!customer.password.startsWith('$2a$') && !customer.password.startsWith('$2b$'))) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const isValid = await compare(password, customer.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // Check status
    if (customer.status === 'inactive') {
      return NextResponse.json({ error: 'Your account has been deactivated. Please contact support.' }, { status: 403 })
    }

    return NextResponse.json({
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        company: customer.company,
        phone: customer.phone,
        role: 'customer',
        plan: customer.plan,
      },
    })
  } catch (error) {
    console.error('Customer login error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
