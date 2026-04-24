import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// GET /api/setup-steps — return all 13 steps ordered by stepNumber (auth required)
export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const steps = await db.setupStep.findMany({ orderBy: { stepNumber: 'asc' } })

    // If no steps exist, initialize the default 13 steps
    if (steps.length === 0) {
      const defaults = [
        { stepNumber: 1, title: 'Business Information Gathered', phase: 'discovery', status: 'completed' },
        { stepNumber: 2, title: 'Access Credentials Received', phase: 'discovery', status: 'completed' },
        { stepNumber: 3, title: 'Brand Assets & Logo Collected', phase: 'discovery', status: 'in_progress' },
        { stepNumber: 4, title: 'Target Audience Defined', phase: 'strategy', status: 'pending' },
        { stepNumber: 5, title: 'Service Areas Mapped', phase: 'strategy', status: 'pending' },
        { stepNumber: 6, title: 'Competitor Analysis Complete', phase: 'strategy', status: 'pending' },
        { stepNumber: 7, title: 'Google Business Profile Optimized', phase: 'delivery', status: 'pending' },
        { stepNumber: 8, title: 'Facebook Business Page Created', phase: 'delivery', status: 'pending' },
        { stepNumber: 9, title: 'Ad Account Setup & Verification', phase: 'delivery', status: 'pending' },
        { stepNumber: 10, title: 'CRM & Lead Tracking Installed', phase: 'delivery', status: 'pending' },
        { stepNumber: 11, title: 'Landing Page Built', phase: 'delivery', status: 'pending' },
        { stepNumber: 12, title: 'Ad Campaigns Launched', phase: 'launch', status: 'pending' },
        { stepNumber: 13, title: 'Lead Machine Running', phase: 'launch', status: 'pending' },
      ] as Array<{ stepNumber: number; title: string; phase: 'discovery' | 'strategy' | 'delivery' | 'launch' | 'growth'; status: string }>

      try {
        await db.setupStep.createMany({ data: defaults, skipDuplicates: true })
      } catch {
        // Another concurrent request already inserted — ignore
      }
      const allSteps = await db.setupStep.findMany({ orderBy: { stepNumber: 'asc' } })
      return NextResponse.json(allSteps)
    }

    return NextResponse.json(steps)
  } catch (error) {
    console.error('Setup steps error:', error)
    return NextResponse.json({ error: 'Failed to fetch setup steps' }, { status: 500 })
  }
}

// POST /api/setup-steps — update step status
export async function POST(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  const ip = getClientIp(request)
  const rl = rateLimit(`setup-steps:${ip}`, { limit: 30, windowMs: 60000 })
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
    })
  }

  try {
    const { stepId, status } = await request.json()

    if (!stepId || !status) {
      return NextResponse.json({ error: 'stepId and status required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'in_progress', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const step = await db.setupStep.update({
      where: { id: stepId },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : null,
      },
    })

    return NextResponse.json(step)
  } catch (error) {
    console.error('Setup step update error:', error)
    return NextResponse.json({ error: 'Failed to update step' }, { status: 500 })
  }
}
