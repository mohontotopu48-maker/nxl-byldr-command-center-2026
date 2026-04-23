import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const lead = await db.mpzLead.findUnique({ where: { id } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const updatedLead = await db.mpzLead.update({
      where: { id },
      data: {
        mockupReady: true,
        stage: 'mockup_sent',
        automationStarted: true,
      },
      include: { tasks: true, activities: true },
    })

    await db.mpzTask.create({
      data: {
        title: 'Start 14-day funnel',
        description: `Begin 14-day automation funnel for ${lead.name} (${lead.businessName})`,
        status: 'pending',
        priority: 'high',
        assignedTo: 'Geo',
        leadId: id,
      },
    })

    await db.mpzActivity.create({
      data: {
        type: 'mockup_ready',
        message: `Mockup marked as ready for ${lead.name}. Automation started, 14-day funnel task assigned to Geo.`,
        leadId: id,
      },
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('PUT /api/mpz/leads/[id]/mockup-ready error:', error)
    return NextResponse.json({ error: 'Failed to mark mockup ready' }, { status: 500 })
  }
}
