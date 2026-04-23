import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MASTER_ADMINS = ['info.vsualdm@gmail.com', 'geovsualdm@gmail.com']

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    // Find user by email
    const user = await db.teamMember.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // Check password
    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    // Determine role
    const role = user.role === 'master_admin' || MASTER_ADMINS.includes(user.email)
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
