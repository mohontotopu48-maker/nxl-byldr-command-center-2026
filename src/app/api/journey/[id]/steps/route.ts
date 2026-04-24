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

    // Update the step and recalculate journey — atomic transaction
    const result = await db.$transaction(async (tx) => {
      const step = await tx.clientSetupStep.update({
        where: { id: stepId },
        data: {
          status,
          completedAt: status === 'completed' ? new Date() : null,
        },
      })

      const allSteps = await tx.clientSetupStep.findMany({
        where: { journeyId },
        orderBy: { stepNumber: 'asc' },
      })

      const completedCount = allSteps.filter((s) => s.status === 'completed').length
      const phases: Array<'discovery' | 'strategy' | 'delivery' | 'launch' | 'growth'> = ['discovery', 'strategy', 'delivery', 'launch', 'growth']

      let currentPhase: 'discovery' | 'strategy' | 'delivery' | 'launch' | 'growth' = 'discovery'
      for (const phase of phases) {
        const phaseSteps = allSteps.filter((s) => s.phase === phase)
        if (phaseSteps.some((s) => s.status !== 'completed')) {
          currentPhase = phase
          break
        }
      }

      const allCompleted = completedCount === allSteps.length
      const anyInProgress = allSteps.some((s) => s.status === 'in_progress')
      const overallStatus: 'active' | 'completed' | 'paused' | 'on_hold' = allCompleted ? 'completed' : anyInProgress ? 'active' : 'active'

      await tx.clientJourney.update({
        where: { id: journeyId },
        data: { completedSteps: completedCount, currentPhase, overallStatus },
      })

      await tx.automationLog.create({
        data: { journeyId, action: `Step "${step.title}" updated to ${status}`, triggeredBy: 'manual' },
      })

      return { step, completedSteps: completedCount, totalSteps: allSteps.length, currentPhase, overallStatus }
    })

    return NextResponse.json(result)
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

    if (updates.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 updates per request' }, { status: 400 })
    }

    const validStatuses = ['pending', 'in_progress', 'completed']
    const results: ClientSetupStep[] = []
    let completedCount = 0
    let currentPhase: 'discovery' | 'strategy' | 'delivery' | 'launch' | 'growth' = 'discovery'

    await db.$transaction(async (tx) => {
      for (const { stepId, status } of updates) {
        if (!validStatuses.includes(status)) continue
        const existingStep = await tx.clientSetupStep.findUnique({ where: { id: stepId } })
        if (!existingStep || existingStep.journeyId !== journeyId) continue
        const step = await tx.clientSetupStep.update({
          where: { id: stepId },
          data: { status, completedAt: status === 'completed' ? new Date() : null },
        })
        results.push(step)
      }

      const allSteps = await tx.clientSetupStep.findMany({ where: { journeyId }, orderBy: { stepNumber: 'asc' } })
      completedCount = allSteps.filter((s) => s.status === 'completed').length
      const allCompleted = completedCount === allSteps.length
      const phases: Array<'discovery' | 'strategy' | 'delivery' | 'launch' | 'growth'> = ['discovery', 'strategy', 'delivery', 'launch', 'growth']
      for (const phase of phases) {
        if (allSteps.filter((s) => s.phase === phase).some((s) => s.status !== 'completed')) {
          currentPhase = phase
          break
        }
      }

      await tx.clientJourney.update({
        where: { id: journeyId },
        data: { completedSteps: completedCount, currentPhase, overallStatus: (allCompleted ? 'completed' : 'active') as 'active' | 'completed' | 'paused' | 'on_hold' },
      })

      await tx.automationLog.create({
        data: { journeyId, action: `Bulk update: ${updates.length} step(s) updated via ${triggeredBy || 'manual'}`, triggeredBy: triggeredBy || 'manual' },
      })
    })

    return NextResponse.json({ results, completedSteps: completedCount, currentPhase })
  } catch (error) {
    console.error('Bulk step update error:', error)
    return NextResponse.json({ error: 'Failed to bulk update steps' }, { status: 500 })
  }
}
