import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'
import { requireMasterAdmin } from '@/lib/auth-guard'

export async function POST(request: NextRequest) {
  // Only master admins can register new team members
  const auth = requireMasterAdmin(request)
  if (!auth.authorized) return auth.response

  try {
    const { name, email, password } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existing = await db.teamMember.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({
        message: 'User already exists',
        isNew: false,
      })
    }

    // Check if it's a master admin email
    const isMasterAdmin = MASTER_ADMIN_EMAILS.includes(normalizedEmail as typeof MASTER_ADMIN_EMAILS[number])
    const role = isMasterAdmin ? 'master_admin' : 'member'

    // Hash the password
    const passwordHash = await hash(password, 10)

    const user = await db.teamMember.create({
      data: {
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: passwordHash,
        role,
        status: 'active',
      },
    })

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isNew: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
