import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memMpzLeads } from '@/lib/in-memory-store'

export async function GET(
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
      return NextResponse.json(lead)
    }

    const lead = await db.mpzLead.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('GET /api/mpz/leads/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params
    const body = await request.json()
    const { stage, assignedTo, mockupReady, automationStarted, automationDay, notes } = body

    // Validate stage if provided
    const VALID_STAGES = ['new_lead', 'mockup_needed', 'mockup_sent', 'engaged', 'video_sent', 'proof_stage', 'hot_lead', 'call_scheduled', 'closed_won', 'closed_lost', 'retention']
    if (stage !== undefined && !VALID_STAGES.includes(stage)) {
      return NextResponse.json({ error: 'Invalid stage value' }, { status: 400 })
    }

    // Validate automationDay bounds
    if (automationDay !== undefined && (typeof automationDay !== 'number' || automationDay < 0 || automationDay > 14)) {
      return NextResponse.json({ error: 'automationDay must be between 0 and 14' }, { status: 400 })
    }

    // In-memory path FIRST — before any DB calls
    if (shouldUseMemory()) {
      const existing = memMpzLeads.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      const updateData: Record<string, unknown> = {}
      if (stage !== undefined) updateData.stage = stage
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo
      if (mockupReady !== undefined) updateData.mockupReady = mockupReady
      if (notes !== undefined) updateData.notes = notes
      const lead = memMpzLeads.update(id, updateData)
      return NextResponse.json(lead)
    }

    // DB path
    const existing = await db.mpzLead.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const lead = await db.mpzLead.update({
      where: { id },
      data: {
        ...(stage !== undefined && { stage }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(mockupReady !== undefined && { mockupReady }),
        ...(automationStarted !== undefined && { automationStarted }),
        ...(automationDay !== undefined && { automationDay }),
        ...(notes !== undefined && { notes }),
      },
      include: { tasks: true, activities: true },
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('PUT /api/mpz/leads/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

    // In-memory path FIRST — before any DB calls
    if (shouldUseMemory()) {
      const existing = memMpzLeads.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      memMpzLeads.delete(id)
      return NextResponse.json({ success: true })
    }

    const existing = await db.mpzLead.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    await db.mpzLead.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/mpz/leads/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
