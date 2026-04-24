import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memActivities } from '@/lib/in-memory-store'

export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    if (shouldUseMemory()) {
      const activities = memActivities.getAll(limit)
      return NextResponse.json({
        data: activities,
        pagination: { page, limit, total: activities.length, totalPages: Math.ceil(activities.length / limit) },
      })
    }

    const [total, activities] = await Promise.all([
      db.activity.count(),
      db.activity.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      data: activities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { type, message, userId, metadata } = body

    if (!type || typeof type !== 'string' || type.trim().length === 0) {
      return NextResponse.json(
        { error: 'Activity type is required' },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Activity message is required' },
        { status: 400 }
      )
    }

    if (shouldUseMemory()) {
      const activity = memActivities.create({ type, message, userId, metadata })
      return NextResponse.json(activity, { status: 201 })
    }

    const activity = await db.activity.create({
      data: {
        type: type.trim(),
        message: message.trim(),
        userId: userId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
