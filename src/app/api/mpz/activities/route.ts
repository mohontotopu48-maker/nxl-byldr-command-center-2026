import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memMpzActivities } from '@/lib/in-memory-store'

export async function GET(request: Request) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    if (shouldUseMemory()) {
      const activities = memMpzActivities.getAll(50)
      return NextResponse.json(activities.data)
    }

    const activities = await db.mpzActivity.findMany({
      include: { lead: { select: { id: true, name: true, businessName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(activities)
  } catch (error) {
    console.error('GET /api/mpz/activities error:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}
