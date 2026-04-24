import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// GET /api/contact — list all contact messages (admin view)
// Supports ?status=new|in_progress|replied|closed|spam filter
export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerEmail = searchParams.get('customerEmail')

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (customerEmail) where.customerEmail = customerEmail

    const whereClause = Object.keys(where).length > 0 ? where : undefined

    const [total, messages] = await Promise.all([
      db.contactMessage.count({ where: whereClause }),
      db.contactMessage.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      data: messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Contact message list error:', error)
    return NextResponse.json({ error: 'Failed to fetch contact messages' }, { status: 500 })
  }
}

// POST /api/contact — customer sends a new message (public, rate-limited)
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = rateLimit(`contact-form:${ip}`, { limit: 5, windowMs: 60000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many messages. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
      })
    }

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

    const validPriorities = ['low', 'normal', 'high', 'urgent']
    const validPriority = validPriorities.includes(priority) ? priority : 'normal'

    const contactMessage = await db.contactMessage.create({
      data: {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        priority: validPriority,
        status: 'new',
        assignedTo: 'both',
      },
    })

    return NextResponse.json(contactMessage, { status: 201 })
  } catch (error) {
    console.error('Contact message create error:', error)
    return NextResponse.json({ error: 'Failed to create contact message' }, { status: 500 })
  }
}
