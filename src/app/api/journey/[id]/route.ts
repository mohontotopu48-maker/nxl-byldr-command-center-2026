import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/journey/[id] — get single journey with full details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const journey = await db.clientJourney.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true, company: true, phone: true, status: true, plan: true, revenue: true, notes: true } },
        setupSteps: { orderBy: { stepNumber: 'asc' } },
        alerts: { orderBy: { createdAt: 'desc' } },
        automationLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 })
    }

    return NextResponse.json(journey)
  } catch (error) {
    console.error('Journey fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch journey' }, { status: 500 })
  }
}

// PATCH /api/journey/[id] — update journey metadata (phase, status, notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { currentPhase, overallStatus, notes } = body

    const VALID_PHASES = ['handover', 'game_plan', 'technical', 'live']
    const VALID_STATUSES = ['in_progress', 'completed', 'on_hold', 'cancelled']

    if (currentPhase !== undefined && !VALID_PHASES.includes(currentPhase)) {
      return NextResponse.json(
        { error: `Invalid phase. Must be one of: ${VALID_PHASES.join(', ')}` },
        { status: 400 }
      )
    }

    if (overallStatus !== undefined && !VALID_STATUSES.includes(overallStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    if (notes !== undefined && typeof notes === 'string' && notes.length > 10000) {
      return NextResponse.json(
        { error: 'Notes must be 10000 characters or less' },
        { status: 400 }
      )
    }

    const journey = await db.clientJourney.update({
      where: { id },
      data: {
        ...(currentPhase !== undefined && { currentPhase }),
        ...(overallStatus !== undefined && { overallStatus }),
        ...(notes !== undefined && { notes }),
      },
    })

    return NextResponse.json(journey)
  } catch (error) {
    console.error('Journey update error:', error)
    return NextResponse.json({ error: 'Failed to update journey' }, { status: 500 })
  }
}

// DELETE /api/journey/[id] — delete a journey
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.clientJourney.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Journey delete error:', error)
    return NextResponse.json({ error: 'Failed to delete journey' }, { status: 500 })
  }
}
