import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existing = await db.teamMember.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      return NextResponse.json({
        id: existing.id,
        name: existing.name,
        email: existing.email,
        role: existing.role,
        isNew: false,
      })
    }

    // Check if it's a master admin email
    const MASTER_ADMINS = ['info.vsualdm@gmail.com', 'geovsualdm@gmail.com']
    const isMasterAdmin = MASTER_ADMINS.includes(normalizedEmail)
    const role = isMasterAdmin ? 'master_admin' : 'member'

    const user = await db.teamMember.create({
      data: {
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: password || '',
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
