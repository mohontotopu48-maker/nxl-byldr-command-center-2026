import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memDashboard } from '@/lib/in-memory-store'

export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response
  try {
    if (shouldUseMemory()) {
      const stats = memDashboard.getStats()
      return NextResponse.json(stats)
    }

    const [
      totalProjects,
      activeTasks,
      allTasks,
      doneTasks,
      teamMembers,
      totalCustomers,
      recentActivity,
      projectsByStatusRaw,
    ] = await Promise.all([
      db.project.count(),
      db.task.count({ where: { status: 'in_progress' } }),
      db.task.count(),
      db.task.count({ where: { status: 'completed' } }),
      db.teamMember.count(),
      db.customer.count(),
      db.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.project.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ])

    const completionRate = allTasks > 0
      ? Math.round((doneTasks / allTasks) * 100)
      : 0

    const projectsByStatus = projectsByStatusRaw.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {})

    return NextResponse.json({
      totalProjects,
      activeTasks,
      teamMembers,
      totalCustomers,
      completionRate,
      recentActivity,
      projectsByStatus,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
