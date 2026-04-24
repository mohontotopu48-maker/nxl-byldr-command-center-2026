import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memTasks, memProjects } from '@/lib/in-memory-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

    if (shouldUseMemory()) {
      const task = memTasks.findById(id)
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(task)
    }

    const task = await db.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
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
    const { title, description, status, priority, projectId, assigneeId, dueDate } = body

    // Validate inputs
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    // In-memory path FIRST — before any DB calls
    if (shouldUseMemory()) {
      const existing = memTasks.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      // Validate project exists
      if (projectId) {
        const proj = memProjects.findById(projectId)
        if (!proj) {
          return NextResponse.json({ error: 'Referenced project not found' }, { status: 400 })
        }
      }
      const updateData: Record<string, unknown> = {}
      if (title !== undefined) updateData.title = title.trim()
      if (description !== undefined) updateData.description = description ?? null
      if (status !== undefined) updateData.status = status
      if (priority !== undefined) updateData.priority = priority
      if (projectId !== undefined) updateData.projectId = projectId
      if (assigneeId !== undefined) updateData.assigneeId = assigneeId ?? null
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
      const task = memTasks.update(id, updateData)
      return NextResponse.json(task)
    }

    // DB path
    const existingTask = await db.task.findUnique({ where: { id } })
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (projectId) {
      const projectExists = await db.project.findUnique({ where: { id: projectId } })
      if (!projectExists) {
        return NextResponse.json(
          { error: 'Referenced project not found' },
          { status: 400 }
        )
      }
    }

    if (assigneeId !== undefined && assigneeId !== null) {
      const memberExists = await db.teamMember.findUnique({ where: { id: assigneeId } })
      if (!memberExists) {
        return NextResponse.json(
          { error: 'Referenced team member not found' },
          { status: 400 }
        )
      }
    }

    const task = await db.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description ?? null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(projectId !== undefined && { projectId }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId ?? null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
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
      const existing = memTasks.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      memTasks.delete(id)
      return NextResponse.json({ message: 'Task deleted successfully' })
    }

    const existingTask = await db.task.findUnique({ where: { id } })
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    await db.task.delete({ where: { id } })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
