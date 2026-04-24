import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memAlertBar } from '@/lib/in-memory-store'

// GET /api/alert-bar — return current alert status (auth required)
export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    if (shouldUseMemory()) {
      const alert = memAlertBar.get()
      return NextResponse.json({ active: alert.active, message: alert.message })
    }

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

// POST /api/alert-bar — update alert status (auth required)
export async function POST(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { active, message } = await request.json()

    // Validate inputs
    if (message && typeof message === 'string' && message.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 characters)' }, { status: 400 })
    }

    if (shouldUseMemory()) {
      const alert = memAlertBar.set({ active: active ?? false, message: message || 'All Systems Go — Machine is on Schedule.' })
      return NextResponse.json({ active: alert.active, message: alert.message })
    }

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
