import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'

export async function GET(request: Request) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const [
      totalLeads,
      newLeads,
      hotLeadCount,
      pendingTasks,
      urgentTasks,
      activeAutomations,
      recentActivities,
      leadsByStageData,
      allLeads,
    ] = await Promise.all([
      db.mpzLead.count(),
      db.mpzLead.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.mpzLead.count({ where: { stage: 'hot_lead' } }),
      db.mpzTask.count({ where: { status: 'pending' } }),
      db.mpzTask.count({ where: { priority: 'urgent', status: { not: 'completed' } } }),
      db.mpzLead.count({ where: { automationStarted: true } }),
      db.mpzActivity.findMany({
        include: { lead: { select: { id: true, name: true, businessName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.mpzLead.groupBy({
        by: ['stage'],
        _count: { stage: true },
      }),
      db.mpzLead.findMany({
        where: { stage: { notIn: ['closed_won', 'closed_lost'] } },
      }),
    ])

    const leadsByStage: Record<string, number> = {}
    for (const item of leadsByStageData) {
      leadsByStage[item.stage] = item._count.stage
    }

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const stuckLeads = allLeads.filter(
      (lead) => new Date(lead.updatedAt) < threeDaysAgo
    )

    const closedWonCount = leadsByStage['closed_won'] ?? 0
    const conversionRate = totalLeads > 0 ? closedWonCount / totalLeads : 0

    return NextResponse.json({
      totalLeads,
      newLeads,
      hotLeads: hotLeadCount,
      leadsByStage,
      pendingTasks,
      urgentTasks,
      activeAutomations,
      stuckLeads,
      recentActivities,
      conversionRate,
    })
  } catch (error) {
    console.error('GET /api/mpz/dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
