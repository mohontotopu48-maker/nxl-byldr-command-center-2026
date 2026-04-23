import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/alert-bar — return current alert status
export async function GET() {
  try {
    let alert = await db.alertBar.findFirst({ orderBy: { createdAt: 'desc' } })
    
    if (!alert) {
      alert = await db.alertBar.create({
        data: { active: false, message: 'All Systems Go — Machine is on Schedule.' },
      })
    }
    
    return NextResponse.json({ active: alert.active, message: alert.message })
  } catch (error) {
    console.error('Alert bar error:', error)
    return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 })
  }
}

// POST /api/alert-bar — update alert status
export async function POST(request: NextRequest) {
  try {
    const { active, message } = await request.json()
    
    // Update all existing alerts to inactive, then create/update
    await db.alertBar.deleteMany({})
    
    const alert = await db.alertBar.create({
      data: {
        active: active ?? false,
        message: message || 'All Systems Go — Machine is on Schedule.',
      },
    })
    
    return NextResponse.json({ active: alert.active, message: alert.message })
  } catch (error) {
    console.error('Alert bar update error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}
