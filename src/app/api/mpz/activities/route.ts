import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
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
