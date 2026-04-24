import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/contact — list all contact messages (admin view)
// Supports ?status=unread|read|replied filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const customerEmail = searchParams.get('customerEmail')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (customerEmail) where.customerEmail = customerEmail

    const messages = await db.contactMessage.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Contact message list error:', error)
    return NextResponse.json({ error: 'Failed to fetch contact messages' }, { status: 500 })
  }
}

// POST /api/contact — customer sends a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerName, customerEmail, subject, message, priority } = body

    // Validate all required fields
    if (!customerName || !customerEmail || !subject || !message) {
      return NextResponse.json(
        { error: 'customerName, customerEmail, subject, and message are required' },
        { status: 400 }
      )
    }

    // Input length limits
    if (typeof customerName !== 'string' || customerName.trim().length > 200) {
      return NextResponse.json({ error: 'Name too long (max 200 characters)' }, { status: 400 })
    }
    if (typeof subject !== 'string' || subject.trim().length > 200) {
      return NextResponse.json({ error: 'Subject too long (max 200 characters)' }, { status: 400 })
    }
    if (typeof message !== 'string' || message.trim().length > 10000) {
      return NextResponse.json({ error: 'Message too long (max 10000 characters)' }, { status: 400 })
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const contactMessage = await db.contactMessage.create({
      data: {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        priority: priority || 'normal',
        status: 'unread',
        assignedTo: 'both',
      },
    })

    return NextResponse.json(contactMessage, { status: 201 })
  } catch (error) {
    console.error('Contact message create error:', error)
    return NextResponse.json({ error: 'Failed to create contact message' }, { status: 500 })
  }
}
