import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memCustomers } from '@/lib/in-memory-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

    if (shouldUseMemory()) {
      const customer = memCustomers.findById(id)
      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(customer)
    }

    const customer = await db.customer.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, company: true, phone: true,
        status: true, plan: true, revenue: true, notes: true, createdAt: true, updatedAt: true,
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, company, phone, status, plan, revenue, notes } = body

    // Validate inputs
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    const validStatuses = ['active', 'inactive']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const validPlans = ['free', 'pro', 'enterprise']
    if (plan && !validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
        { status: 400 }
      )
    }

    if (revenue !== undefined && typeof revenue !== 'number') {
      return NextResponse.json(
        { error: 'Revenue must be a number' },
        { status: 400 }
      )
    }

    // In-memory path FIRST — before any DB calls
    if (shouldUseMemory()) {
      const existing = memCustomers.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
      // Check duplicate email
      if (email) {
        const dup = memCustomers.findByEmail(email.trim().toLowerCase())
        if (dup && dup.id !== id) {
          return NextResponse.json({ error: 'A customer with this email already exists' }, { status: 400 })
        }
      }
      const updateData: Record<string, unknown> = {}
      if (name !== undefined) updateData.name = name.trim()
      if (email !== undefined) updateData.email = email.trim().toLowerCase()
      if (company !== undefined) updateData.company = company ?? null
      if (phone !== undefined) updateData.phone = phone ?? null
      if (status !== undefined) updateData.status = status
      if (plan !== undefined) updateData.plan = plan
      if (revenue !== undefined) updateData.revenue = revenue
      if (notes !== undefined) updateData.notes = notes ?? null
      const customer = memCustomers.update(id, updateData)
      return NextResponse.json(customer)
    }

    // DB path
    const existingCustomer = await db.customer.findUnique({ where: { id } })
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (email) {
      const duplicateEmail = await db.customer.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          NOT: { id },
        },
      })
      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'A customer with this email already exists' },
          { status: 400 }
        )
      }
    }

    const customer = await db.customer.update({
      where: { id },
      select: {
        id: true, name: true, email: true, company: true, phone: true,
        status: true, plan: true, revenue: true, notes: true, createdAt: true, updatedAt: true,
      },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(company !== undefined && { company: company ?? null }),
        ...(phone !== undefined && { phone: phone ?? null }),
        ...(status !== undefined && { status }),
        ...(plan !== undefined && { plan }),
        ...(revenue !== undefined && { revenue }),
        ...(notes !== undefined && { notes: notes ?? null }),
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

    // In-memory path FIRST — before any DB calls
    if (shouldUseMemory()) {
      const existing = memCustomers.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
      memCustomers.delete(id)
      return NextResponse.json({ message: 'Customer deleted successfully' })
    }

    const existingCustomer = await db.customer.findUnique({ where: { id } })
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    await db.customer.delete({ where: { id } })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
