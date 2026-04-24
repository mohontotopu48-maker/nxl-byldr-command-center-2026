import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'

export async function GET(request: Request) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const tasks = await db.mpzTask.findMany({
      include: { lead: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tasks)
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
