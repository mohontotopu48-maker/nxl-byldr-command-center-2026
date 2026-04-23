import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default 13 setup steps per PDF specification
const DEFAULT_STEPS = [
  { stepNumber: 1, title: 'Business Information Gathered', phase: 'handover', status: 'pending' },
  { stepNumber: 2, title: 'Access Credentials Received', phase: 'handover', status: 'pending' },
  { stepNumber: 3, title: 'Brand Assets & Logo Collected', phase: 'handover', status: 'pending' },
  { stepNumber: 4, title: 'Target Audience Defined', phase: 'game_plan', status: 'pending' },
  { stepNumber: 5, title: 'Service Areas Mapped', phase: 'game_plan', status: 'pending' },
  { stepNumber: 6, title: 'Competitor Analysis Complete', phase: 'game_plan', status: 'pending' },
  { stepNumber: 7, title: 'Google Business Profile Optimized', phase: 'technical', status: 'pending' },
  { stepNumber: 8, title: 'Facebook Business Page Created', phase: 'technical', status: 'pending' },
  { stepNumber: 9, title: 'Ad Account Setup & Verification', phase: 'technical', status: 'pending' },
  { stepNumber: 10, title: 'CRM & Lead Tracking Installed', phase: 'technical', status: 'pending' },
  { stepNumber: 11, title: 'Landing Page Built', phase: 'technical', status: 'pending' },
  { stepNumber: 12, title: 'Ad Campaigns Launched', phase: 'live', status: 'pending' },
  { stepNumber: 13, title: 'Lead Machine Running', phase: 'live', status: 'pending' },
]

// GET /api/journey — list all journeys (admin view)
export async function GET() {
  try {
    const journeys = await db.clientJourney.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true, company: true, status: true, plan: true } },
        setupSteps: { orderBy: { stepNumber: 'asc' } },
        alerts: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
    return NextResponse.json(journeys)
  } catch (error) {
    console.error('Journey list error:', error)
    return NextResponse.json({ error: 'Failed to fetch journeys' }, { status: 500 })
  }
}

// POST /api/journey — create a new journey for a customer
export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
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
        currentPhase: 'handover',
        overallStatus: 'in_progress',
        completedSteps: 0,
        totalSteps: 13,
        setupSteps: {
          create: DEFAULT_STEPS.map((s) => ({
            stepNumber: s.stepNumber,
            title: s.title,
            phase: s.phase,
            status: s.status,
          })),
        },
        alerts: {
          create: {
            active: false,
            message: 'All Systems Go — Project on Schedule.',
            priority: 'normal',
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
