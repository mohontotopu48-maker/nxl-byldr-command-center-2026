import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'

// GET /api/journey/[id]/alert — get current alert for a journey
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

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
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id: journeyId } = await params
    const { active, message, priority, triggeredBy } = await request.json()

    // Validate inputs
    if (active !== undefined && typeof active !== 'boolean') {
      return NextResponse.json({ error: 'active must be a boolean' }, { status: 400 })
    }
    if (message !== undefined && (typeof message !== 'string' || message.length > 500)) {
      return NextResponse.json({ error: 'message must be a string under 500 characters' }, { status: 400 })
    }
    const validPriorities = ['low', 'normal', 'medium', 'high', 'urgent']
    const validPriority = priority && validPriorities.includes(priority) ? priority : 'normal'

    // Atomic: delete old + create new + log
    const alert = await db.$transaction(async (tx) => {
      await tx.clientAlert.deleteMany({ where: { journeyId } })
      const created = await tx.clientAlert.create({
        data: {
          journeyId,
          active: active ?? false,
          message: message || 'All Systems Go — Project on Schedule.',
          priority: validPriority,
        },
      })
      await tx.automationLog.create({
        data: {
          journeyId,
          action: active ? `Alert activated: "${message}"` : 'Alert cleared — All Systems Go',
          triggeredBy: triggeredBy || 'manual',
        },
      })
      return created
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Client alert update error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}
