import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memMpzLeads, memMpzTasks, memMpzActivities } from '@/lib/in-memory-store'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

    if (shouldUseMemory()) {
      const lead = memMpzLeads.findById(id)
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      const VALID_CURRENT_STAGES = ['new_lead', 'mockup_needed']
      if (!VALID_CURRENT_STAGES.includes((lead as Record<string, unknown>).stage as string)) {
        return NextResponse.json(
          { error: `Cannot mark mockup ready — lead is at "${(lead as Record<string, unknown>).stage}", expected one of: ${VALID_CURRENT_STAGES.join(', ')}` },
          { status: 400 }
        )
      }
      const updatedLead = memMpzLeads.update(id, { mockupReady: true, stage: 'mockup_sent' })
      memMpzTasks.create({
        title: 'Start 14-day funnel',
        description: `Begin 14-day automation funnel for ${lead.name} (${lead.businessName})`,
        status: 'pending',
        priority: 'high',
        assignedTo: (lead as Record<string, unknown>).assignedTo as string || 'Geo',
        leadId: id,
      })
      memMpzActivities.create({
        type: 'mockup_ready',
        message: `Mockup marked as ready for ${lead.name}. Automation started, 14-day funnel task assigned.`,
        leadId: id,
      })
      return NextResponse.json(updatedLead)
    }

    const lead = await db.mpzLead.findUnique({ where: { id } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Validate stage transition — only allow from new_lead or mockup_needed
    const VALID_CURRENT_STAGES = ['new_lead', 'mockup_needed']
    if (!VALID_CURRENT_STAGES.includes(lead.stage)) {
      return NextResponse.json(
        { error: `Cannot mark mockup ready — lead is at "${lead.stage}", expected one of: ${VALID_CURRENT_STAGES.join(', ')}` },
        { status: 400 }
      )
    }

    let updatedLead

    await db.$transaction(async (tx) => {
      updatedLead = await tx.mpzLead.update({
        where: { id },
        data: { mockupReady: true, stage: 'mockup_sent', automationStarted: true, automationDay: 1 },
        include: { tasks: true, activities: true },
      })

      await tx.mpzTask.create({
        data: {
          title: 'Start 14-day funnel',
          description: `Begin 14-day automation funnel for ${lead.name} (${lead.businessName})`,
          status: 'pending',
          priority: 'high',
          assignedTo: lead.assignedTo || 'Geo',
          leadId: id,
        },
      })

      await tx.mpzActivity.create({
        data: {
          type: 'mockup_ready',
          message: `Mockup marked as ready for ${lead.name}. Automation started, 14-day funnel task assigned.`,
          leadId: id,
        },
      })
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('PUT /api/mpz/leads/[id]/mockup-ready error:', error)
    return NextResponse.json({ error: 'Failed to mark mockup ready' }, { status: 500 })
  }
}
