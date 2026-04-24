import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { hash } from 'bcryptjs'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'
import { addInMemoryCustomer, getFallbackCustomer, isFallbackCustomer } from '@/lib/customer-store'

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

    // Check if already exists in fallback store
    if (isFallbackCustomer(normalizedEmail)) {
      return NextResponse.json({ error: 'A customer account with this email already exists.' }, { status: 409 })
    }

    // Hash the password
    const passwordHash = await hash(password, 10)

    // ═══ DATABASE PATH (when DATABASE_URL is configured) ═══
    if (isDbAvailable()) {
      try {
        const existingCustomer = await db.customer.findUnique({ where: { email: normalizedEmail } })
        if (existingCustomer) {
          return NextResponse.json({ error: 'A customer account with this email already exists.' }, { status: 409 })
        }

        const customer = await db.customer.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            password: passwordHash,
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
      } catch (dbError) {
        console.error('DB registration failed, falling back to in-memory:', dbError)
        // Fall through to in-memory fallback
      }
    }

    // ═══ IN-MEMORY FALLBACK (when DATABASE_URL is not configured) ═══
    // Double-check not already in memory
    if (getFallbackCustomer(normalizedEmail)) {
      return NextResponse.json({ error: 'A customer account with this email already exists.' }, { status: 409 })
    }

    const customerId = `customer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const customerData = {
      id: customerId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      company: company?.trim() || null,
      phone: phone?.trim() || null,
      status: 'active' as const,
      plan: 'free' as const,
      revenue: 0,
      createdAt: new Date(),
    }

    addInMemoryCustomer(customerData)

    return NextResponse.json(
      {
        id: customerId,
        name: customerData.name,
        email: customerData.email,
        role: 'customer',
        plan: customerData.plan,
        isNew: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Customer registration error:', error)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
