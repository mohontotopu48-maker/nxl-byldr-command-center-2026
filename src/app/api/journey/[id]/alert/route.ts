import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/journey/[id]/alert — get current alert for a journey
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const alert = await db.clientAlert.findFirst({
      where: { journeyId: id },
      orderBy: { createdAt: 'desc' },
    })

    if (!alert) {
      return NextResponse.json({ active: false, message: 'All Systems Go — Project on Schedule.' })
    }

    return NextResponse.json({ id: alert.id, active: alert.active, message: alert.message, priority: alert.priority })
  } catch (error) {
    console.error('Client alert fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 })
  }
}

// POST /api/journey/[id]/alert — update or create alert for a journey
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: journeyId } = await params
    const { active, message, priority, triggeredBy } = await request.json()

    // Delete old alerts for this journey
    await db.clientAlert.deleteMany({ where: { journeyId } })

    // Create new alert
    const alert = await db.clientAlert.create({
      data: {
        journeyId,
        active: active ?? false,
        message: message || 'All Systems Go — Project on Schedule.',
        priority: priority || 'normal',
      },
    })

    // Log the action
    await db.automationLog.create({
      data: {
        journeyId,
        action: active ? `Alert activated: "${message}"` : 'Alert cleared — All Systems Go',
        triggeredBy: triggeredBy || 'manual',
      },
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Client alert update error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}
