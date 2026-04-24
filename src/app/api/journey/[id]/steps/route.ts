import type { ClientSetupStep } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'

// PUT /api/journey/[id]/steps — update a specific setup step status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id: journeyId } = await params
    const { stepId, status } = await request.json()

    if (!stepId || !status) {
      return NextResponse.json({ error: 'stepId and status required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'in_progress', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Use: pending, in_progress, completed' }, { status: 400 })
    }

    // Verify the step belongs to this journey
    const existingStep = await db.clientSetupStep.findUnique({ where: { id: stepId } })
    if (!existingStep || existingStep.journeyId !== journeyId) {
      return NextResponse.json({ error: 'Step not found or does not belong to this journey' }, { status: 404 })
    }

    // Update the step
    const step = await db.clientSetupStep.update({
      where: { id: stepId },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : null,
      },
    })

    // Recalculate completed steps and determine current phase
    const allSteps = await db.clientSetupStep.findMany({
      where: { journeyId },
      orderBy: { stepNumber: 'asc' },
    })

    const completedCount = allSteps.filter((s) => s.status === 'completed').length
    const phases: Array<'discovery' | 'strategy' | 'delivery' | 'launch' | 'growth'> = ['discovery', 'strategy', 'delivery', 'launch', 'growth']

    // Determine current phase based on first non-completed step
    let currentPhase: 'discovery' | 'strategy' | 'delivery' | 'launch' | 'growth' = 'discovery'
    for (const phase of phases) {
      const phaseSteps = allSteps.filter((s) => s.phase === phase)
      const phasePending = phaseSteps.some((s) => s.status !== 'completed')
      if (phasePending) {
        currentPhase = phase
        break
      }
    }

    // Determine overall status
    const allCompleted = completedCount === allSteps.length
    const anyInProgress = allSteps.some((s) => s.status === 'in_progress')
    const overallStatus: 'active' | 'completed' | 'paused' | 'on_hold' = allCompleted ? 'completed' : anyInProgress ? 'active' : 'active'

    // Update journey
    await db.clientJourney.update({
      where: { id: journeyId },
      data: {
        completedSteps: completedCount,
        currentPhase,
        overallStatus,
      },
    })

    // Log automation
    await db.automationLog.create({
      data: {
        journeyId,
        action: `Step "${step.title}" updated to ${status}`,
        triggeredBy: 'manual',
      },
    })

    return NextResponse.json({ step, completedSteps: completedCount, totalSteps: allSteps.length, currentPhase, overallStatus })
  } catch (error) {
    console.error('Step update error:', error)
    return NextResponse.json({ error: 'Failed to update step' }, { status: 500 })
  }
}

// POST /api/journey/[id]/steps/bulk — bulk update multiple steps
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id: journeyId } = await params
    const { updates, triggeredBy } = await request.json()

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'updates array required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'in_progress', 'completed']
    const results: ClientSetupStep[] = []
    for (const { stepId, status } of updates) {
      if (!validStatuses.includes(status)) continue
      const existingStep = await db.clientSetupStep.findUnique({ where: { id: stepId } })
      if (!existingStep || existingStep.journeyId !== journeyId) continue
      const step = await db.clientSetupStep.update({
        where: { id: stepId },
        data: {
          status,
          completedAt: status === 'completed' ? new Date() : null,
        },
      })
      results.push(step)
    }

    // Recalculate
    const allSteps = await db.clientSetupStep.findMany({
      where: { journeyId },
      orderBy: { stepNumber: 'asc' },
    })
    const completedCount = allSteps.filter((s) => s.status === 'completed').length
    const allCompleted = completedCount === allSteps.length
    const phases: Array<'discovery' | 'strategy' | 'delivery' | 'launch' | 'growth'> = ['discovery', 'strategy', 'delivery', 'launch', 'growth']
    let currentPhase: 'discovery' | 'strategy' | 'delivery' | 'launch' | 'growth' = 'discovery'
    for (const phase of phases) {
      const phaseSteps = allSteps.filter((s) => s.phase === phase)
      if (phaseSteps.some((s) => s.status !== 'completed')) {
        currentPhase = phase
        break
      }
    }

    await db.clientJourney.update({
      where: { id: journeyId },
      data: {
        completedSteps: completedCount,
        currentPhase,
        overallStatus: (allCompleted ? 'completed' : 'active') as 'active' | 'completed' | 'paused' | 'on_hold',
      },
    })

    await db.automationLog.create({
      data: {
        journeyId,
        action: `Bulk update: ${updates.length} step(s) updated via ${triggeredBy || 'manual'}`,
        triggeredBy: triggeredBy || 'manual',
      },
    })

    return NextResponse.json({ results, completedSteps: completedCount, currentPhase })
  } catch (error) {
    console.error('Bulk step update error:', error)
    return NextResponse.json({ error: 'Failed to bulk update steps' }, { status: 500 })
  }
}
