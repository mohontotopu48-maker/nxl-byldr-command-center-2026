import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { compare } from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    // Find customer by email (not admin TeamMember)
    const customer = await db.customer.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!customer || !customer.password || !customer.password.startsWith('$2b')) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    // Check password — only bcrypt hashes are accepted
    if (customer.password && customer.password.length > 0 && (customer.password.startsWith('$2a$') || customer.password.startsWith('$2b$'))) {
      const isValid = await compare(password, customer.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
      }
    } else {
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
