import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memCustomers } from '@/lib/in-memory-store'

export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    if (shouldUseMemory()) {
      const { data, total } = memCustomers.getAll(skip, limit)
      return NextResponse.json({
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    }

    const [total, customers] = await Promise.all([
      db.customer.count(),
      db.customer.findMany({
        select: {
          id: true, name: true, email: true, company: true, phone: true,
          status: true, plan: true, revenue: true, notes: true, createdAt: true, updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      data: customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { name, email, company, phone, plan, status, password } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const validPlans = ['free', 'pro', 'enterprise']
    const validStatuses = ['active', 'inactive']

    if (shouldUseMemory()) {
      try {
        const rawPassword = password || ('customer_' + Math.random().toString(36).slice(2, 10))
        const customer = memCustomers.create({
          name, email,
          password: rawPassword,
          company: company || undefined,
          phone: phone || undefined,
          plan: (validPlans.includes(plan) ? plan : 'free'),
          status: (validStatuses.includes(status) ? status : 'active'),
        })
        return NextResponse.json(customer, { status: 201 })
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('already exists')) {
          return NextResponse.json(
            { error: 'A customer with this email already exists' },
            { status: 400 }
          )
        }
        throw err
      }
    }

    const existing = await db.customer.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) {
      return NextResponse.json(
        { error: 'A customer with this email already exists' },
        { status: 400 }
      )
    }

    // Hash the password (use provided or generate a random one)
    const rawPassword = password || ('customer_' + Math.random().toString(36).slice(2, 10))
    const passwordHash = await hash(rawPassword, 10)

    const customer = await db.customer.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: passwordHash,
        company: (company && company.trim()) || null,
        phone: (phone && phone.trim()) || null,
        plan: (validPlans.includes(plan) ? plan : 'free'),
        status: (validStatuses.includes(status) ? status : 'active'),
        revenue: 0,
      },
      select: {
        id: true, name: true, email: true, company: true, phone: true,
        status: true, plan: true, revenue: true, notes: true, createdAt: true, updatedAt: true,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
