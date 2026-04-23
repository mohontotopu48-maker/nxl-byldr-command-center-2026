import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, company, phone } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Block master admin emails from registering as customers
    if (MASTER_ADMIN_EMAILS.includes(normalizedEmail as typeof MASTER_ADMIN_EMAILS[number])) {
      return NextResponse.json({ error: 'This email is reserved for admin use.' }, { status: 403 })
    }

    // Check if customer already exists
    const existingCustomer = await db.customer.findUnique({ where: { email: normalizedEmail } })
    if (existingCustomer) {
      return NextResponse.json({ error: 'A customer account with this email already exists.' }, { status: 409 })
    }

    // Create the customer
    const customer = await db.customer.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password,
        company: company?.trim() || null,
        phone: phone?.trim() || null,
        status: 'active',
        plan: 'free',
        revenue: 0,
      },
    })

    return NextResponse.json(
      {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: 'customer',
        plan: customer.plan,
        isNew: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Customer registration error:', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
