import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { compare } from 'bcryptjs'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'

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
