import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      where.status = status
    }

    const [total, tasks] = await Promise.all([
      db.task.count({ where: Object.keys(where).length > 0 ? where : undefined }),
      db.task.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignee: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      data: tasks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { title, description, status, priority, projectId, assigneeId, dueDate } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      )
    }

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const projectExists = await db.project.findUnique({ where: { id: projectId } })
    if (!projectExists) {
      return NextResponse.json(
        { error: 'Referenced project not found' },
        { status: 400 }
      )
    }

    if (assigneeId) {
      const memberExists = await db.teamMember.findUnique({ where: { id: assigneeId } })
      if (!memberExists) {
        return NextResponse.json(
          { error: 'Referenced team member not found' },
          { status: 400 }
        )
      }
    }

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

    const task = await db.task.create({
      data: {
        title: title.trim(),
        description: description ?? null,
        status: status ?? 'pending',
        priority: priority ?? 'medium',
        projectId,
        assigneeId: assigneeId ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
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

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
