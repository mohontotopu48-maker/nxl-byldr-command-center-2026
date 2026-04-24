import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memJourneys, memCustomers } from '@/lib/in-memory-store'

// Default 13 setup steps per PDF specification
const DEFAULT_STEPS = [
  { stepNumber: 1, title: 'Business Information Gathered', phase: 'discovery', status: 'pending' },
  { stepNumber: 2, title: 'Access Credentials Received', phase: 'discovery', status: 'pending' },
  { stepNumber: 3, title: 'Brand Assets & Logo Collected', phase: 'discovery', status: 'pending' },
  { stepNumber: 4, title: 'Target Audience Defined', phase: 'strategy', status: 'pending' },
  { stepNumber: 5, title: 'Service Areas Mapped', phase: 'strategy', status: 'pending' },
  { stepNumber: 6, title: 'Competitor Analysis Complete', phase: 'strategy', status: 'pending' },
  { stepNumber: 7, title: 'Google Business Profile Optimized', phase: 'delivery', status: 'pending' },
  { stepNumber: 8, title: 'Facebook Business Page Created', phase: 'delivery', status: 'pending' },
  { stepNumber: 9, title: 'Ad Account Setup & Verification', phase: 'delivery', status: 'pending' },
  { stepNumber: 10, title: 'CRM & Lead Tracking Installed', phase: 'delivery', status: 'pending' },
  { stepNumber: 11, title: 'Landing Page Built', phase: 'delivery', status: 'pending' },
  { stepNumber: 12, title: 'Ad Campaigns Launched', phase: 'launch', status: 'pending' },
  { stepNumber: 13, title: 'Lead Machine Running', phase: 'launch', status: 'pending' },
]

// GET /api/journey — list all journeys (admin view)
export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    if (shouldUseMemory()) {
      const { data, total } = memJourneys.getAll(skip, limit)
      return NextResponse.json({
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    }

    const [total, journeys] = await Promise.all([
      db.clientJourney.count(),
      db.clientJourney.findMany({
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true, company: true, status: true, plan: true } },
          setupSteps: { orderBy: { stepNumber: 'asc' } },
          alerts: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
    ])

    return NextResponse.json({
      data: journeys,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Journey list error:', error)
    return NextResponse.json({ error: 'Failed to fetch journeys' }, { status: 500 })
  }
}

// POST /api/journey — create a new journey for a customer
export async function POST(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }

    if (shouldUseMemory()) {
      const customer = memCustomers.findById(customerId)
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
      try {
        const journey = memJourneys.create(customerId)
        return NextResponse.json(journey)
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('already exists')) {
          return NextResponse.json({ error: 'Journey already exists for this customer' }, { status: 409 })
        }
        throw err
      }
    }

    // Check if customer exists
    const customer = await db.customer.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check if journey already exists
    const existing = await db.clientJourney.findUnique({ where: { id: customerId } })
    if (existing) {
      return NextResponse.json({ error: 'Journey already exists for this customer' }, { status: 409 })
    }

    // Create journey with default 13 steps
    const journey = await db.clientJourney.create({
      data: {
        id: customerId,
        customerId,
        currentPhase: 'discovery',
        overallStatus: 'active',
        completedSteps: 0,
        totalSteps: 13,
        setupSteps: {
          create: DEFAULT_STEPS.map((s) => ({
            stepNumber: s.stepNumber,
            title: s.title,
            phase: s.phase as 'discovery' | 'strategy' | 'delivery' | 'launch' | 'growth',
            status: s.status as 'pending' | 'in_progress' | 'completed' | 'skipped',
          })),
        },
        alerts: {
          create: {
            active: false,
            message: 'All Systems Go — Project on Schedule.',
            priority: 'medium',
          },
        },
      },
      include: {
        setupSteps: { orderBy: { stepNumber: 'asc' } },
        alerts: true,
      },
    })

    return NextResponse.json(journey)
  } catch (error) {
    console.error('Journey create error:', error)
    return NextResponse.json({ error: 'Failed to create journey' }, { status: 500 })
  }
}
