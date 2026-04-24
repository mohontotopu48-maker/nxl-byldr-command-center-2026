import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (category) {
      where.category = category
    }

    const metrics = await db.metric.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
    })

    return NextResponse.json(metrics)
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
