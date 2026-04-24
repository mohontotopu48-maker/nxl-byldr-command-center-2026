import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memMpzTasks } from '@/lib/in-memory-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

    if (shouldUseMemory()) {
      const task = memMpzTasks.findById(id)
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      return NextResponse.json(task)
    }

    const task = await db.mpzTask.findUnique({
      where: { id },
      include: { lead: true },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('GET /api/mpz/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
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
    const { title, description, status, priority, assignedTo, leadId, dueDate } = body

    // Validate status if provided
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (priority !== undefined && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    // In-memory path FIRST — before any DB calls
    if (shouldUseMemory()) {
      const existing = memMpzTasks.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      const updateData: Record<string, unknown> = {}
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (status !== undefined) updateData.status = status
      if (priority !== undefined) updateData.priority = priority
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo
      if (leadId !== undefined) updateData.leadId = leadId
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate).toISOString() : null
      const task = memMpzTasks.update(id, updateData)
      return NextResponse.json(task)
    }

    // DB path
    const existingTask = await db.mpzTask.findUnique({ where: { id } })
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = await db.mpzTask.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(leadId !== undefined && { leadId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: { lead: true },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('PUT /api/mpz/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
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
      const existing = memMpzTasks.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      memMpzTasks.delete(id)
      return NextResponse.json({ success: true })
    }

    const existing = await db.mpzTask.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    await db.mpzTask.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/mpz/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
