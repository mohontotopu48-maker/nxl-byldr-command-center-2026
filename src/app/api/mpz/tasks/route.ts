import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    const [total, tasks] = await Promise.all([
      db.mpzTask.count(),
      db.mpzTask.findMany({
        include: { lead: true },
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
    console.error('GET /api/mpz/tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { title, description, status, priority, assignedTo, leadId, dueDate } = body

    if (!title || !assignedTo) {
      return NextResponse.json(
        { error: 'Missing required fields: title, assignedTo' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'in_progress', 'completed', 'blocked']
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (priority !== undefined && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    const task = await db.mpzTask.create({
      data: {
        title,
        description: description ?? null,
        status: status ?? 'pending',
        priority: priority ?? 'medium',
        assignedTo,
        leadId: leadId ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: { lead: true },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('POST /api/mpz/tasks error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
