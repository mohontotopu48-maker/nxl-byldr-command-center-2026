import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params
    const body = await request.json()
    const { stage } = body

    if (!stage) {
      return NextResponse.json({ error: 'Stage is required' }, { status: 400 })
    }

    const validStages = ['new_lead', 'mockup_needed', 'mockup_sent', 'engaged', 'video_sent', 'proof_stage', 'hot_lead', 'call_scheduled', 'closed_won', 'closed_lost', 'retention']
    if (!validStages.includes(stage)) {
      return NextResponse.json({ error: 'Invalid stage. Must be one of: ' + validStages.join(', ') }, { status: 400 })
    }

    const currentLead = await db.mpzLead.findUnique({ where: { id } })
    if (!currentLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const previousStage = currentLead.stage

    const lead = await db.$transaction(async (tx) => {
      const updated = await tx.mpzLead.update({
        where: { id },
        data: { stage },
        include: { tasks: true, activities: true },
      })

      await tx.mpzActivity.create({
        data: {
          type: 'stage_change',
          message: `${updated.name} moved from "${previousStage}" to "${stage}"`,
          leadId: id,
        },
      })

      return updated
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('PUT /api/mpz/leads/[id]/stage error:', error)
    return NextResponse.json({ error: 'Failed to change stage' }, { status: 500 })
  }
}
