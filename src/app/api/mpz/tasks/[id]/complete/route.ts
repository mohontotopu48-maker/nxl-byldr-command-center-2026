import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memMpzTasks, memMpzActivities } from '@/lib/in-memory-store'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

    if (shouldUseMemory()) {
      const currentTask = memMpzTasks.findById(id)
      if (!currentTask) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      const ct = currentTask as Record<string, unknown>
      const leadContext = ct.lead ? ` for ${ct.lead}` : ''
      memMpzActivities.create({
        type: 'task_completed',
        message: `Task "${ct.title}" completed by ${ct.assignedTo}${leadContext}`,
        leadId: ct.leadId as string,
      })
      const task = memMpzTasks.complete(id)
      return NextResponse.json(task)
    }

    const currentTask = await db.mpzTask.findUnique({
      where: { id },
      include: { lead: true },
    })

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = await db.$transaction(async (tx) => {
      const updated = await tx.mpzTask.update({
        where: { id },
        data: { status: 'completed' },
        include: { lead: true },
      })

      const leadContext = currentTask.lead
        ? ` for ${currentTask.lead.name}`
        : ''
      await tx.mpzActivity.create({
        data: {
          type: 'task_completed',
          message: `Task "${currentTask.title}" completed by ${currentTask.assignedTo}${leadContext}`,
          leadId: currentTask.leadId,
        },
      })

      return updated
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('PUT /api/mpz/tasks/[id]/complete error:', error)
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 })
  }
}
