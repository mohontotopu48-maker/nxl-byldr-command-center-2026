import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memMetrics } from '@/lib/in-memory-store'

export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (category) {
      where.category = category
    }

    const whereClause = Object.keys(where).length > 0 ? where : undefined

    if (shouldUseMemory()) {
      let metrics = memMetrics.getAll()
      if (category) {
        metrics = metrics.filter((m: Record<string, unknown>) => m.category === category)
      }
      return NextResponse.json({
        data: metrics,
        pagination: { page, limit, total: metrics.length, totalPages: Math.ceil(metrics.length / limit) },
      })
    }

    const [total, metrics] = await Promise.all([
      db.metric.count({ where: whereClause }),
      db.metric.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { recordedAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      data: metrics,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { name, value, unit, category, recordedAt } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Metric name is required' },
        { status: 400 }
      )
    }

    if (value === undefined || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Metric value is required and must be a number' },
        { status: 400 }
      )
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return NextResponse.json(
        { error: 'Metric category is required' },
        { status: 400 }
      )
    }

    if (shouldUseMemory()) {
      const metric = memMetrics.create({ name, value, unit, category })
      return NextResponse.json(metric, { status: 201 })
    }

    const metric = await db.metric.create({
      data: {
        name: name.trim(),
        value,
        unit: unit ?? null,
        category: category.trim(),
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    })

    return NextResponse.json(metric, { status: 201 })
  } catch (error) {
    console.error('Error creating metric:', error)
    return NextResponse.json(
      { error: 'Failed to create metric' },
      { status: 500 }
    )
  }
}
