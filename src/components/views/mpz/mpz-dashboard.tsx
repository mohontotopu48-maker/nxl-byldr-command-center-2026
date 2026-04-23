'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, Flame, Zap, TrendingUp, ArrowRight, Activity, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getStageLabel, getStageBgClass, getTimeAgo, PIPELINE_STAGES, type DashboardStats, type MpzLead } from './constants'

interface MpzDashboardProps {
  onSelectLead: (lead: MpzLead) => void
  onTabChange: (tab: string) => void
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

export function MpzDashboard({ onSelectLead, onTabChange }: MpzDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/mpz/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else {
        setStats({
          totalLeads: 0, newLeads: 0, hotLeads: 0,
          leadsByStage: {}, pendingTasks: 0, urgentTasks: 0,
          activeAutomations: 0, stuckLeads: [], recentActivities: [],
          conversionRate: 0,
        })
      }
    } catch {
      setStats({
        totalLeads: 0, newLeads: 0, hotLeads: 0,
        leadsByStage: {}, pendingTasks: 0, urgentTasks: 0,
        activeAutomations: 0, stuckLeads: [], recentActivities: [],
        conversionRate: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const chartData = PIPELINE_STAGES
    .filter(s => stats?.leadsByStage[s.key])
    .map(s => ({
      name: s.label,
      stage: s.key,
      count: stats?.leadsByStage[s.key] || 0,
      color: s.color,
    }))

  const kpiCards = [
    { title: 'Total Leads', value: stats?.totalLeads ?? 0, icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    { title: 'Hot Leads', value: stats?.hotLeads ?? 0, icon: Flame, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { title: 'Active Automations', value: stats?.activeAutomations ?? 0, icon: Zap, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { title: 'Conversion Rate', value: stats?.conversionRate != null ? `${Math.round(stats.conversionRate * 100)}%` : '—', icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((kpi, i) => (
          <motion.div key={kpi.title} {...fadeIn} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold md:text-3xl">{kpi.value}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${kpi.bgColor}`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline Distribution */}
        <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pipeline Distribution</CardTitle>
              <CardDescription>Leads across all pipeline stages</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <div className="space-y-2.5">
                  {chartData.map((item) => (
                    <div key={item.stage} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{item.name}</span>
                      <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max((item.count / (stats?.totalLeads || 1)) * 100, item.count > 0 ? 8 : 0)}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                          className="h-full rounded"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-6 text-right">{item.count}</span>
                    </div>
                  ))}
                  {chartData.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No pipeline data yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Task Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <Badge variant="secondary">{stats?.pendingTasks ?? '—'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Urgent</span>
                <Badge className="bg-red-500 text-white">{stats?.urgentTasks ?? '—'}</Badge>
              </div>
              <Button variant="ghost" className="w-full justify-between" onClick={() => onTabChange('tasks')}>
                View all tasks <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => onTabChange('pipeline')}>
                <Activity className="h-4 w-4" /> View Pipeline
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => onTabChange('automation')}>
                <Zap className="h-4 w-4" /> Manage Automations
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => onTabChange('alerts')}>
                <AlertTriangle className="h-4 w-4" /> View Alerts
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activities */}
      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : stats?.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {stats.recentActivities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-0.5 rounded-full bg-muted p-1.5">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{getTimeAgo(activity.createdAt)}</p>
                    </div>
                    {activity.leadId && (
                      <Badge variant="outline" className="text-[10px] shrink-0">{activity.type}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activities</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stuck Leads */}
      {stats?.stuckLeads && stats.stuckLeads.length > 0 && (
        <motion.div {...fadeIn} transition={{ delay: 0.35 }}>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Stuck Leads
              </CardTitle>
              <CardDescription>Leads that haven&apos;t moved in a while</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stats.stuckLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="cursor-pointer rounded-lg border border-border bg-card p-3 hover:shadow-md transition-all"
                    onClick={() => onSelectLead(lead)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                      <Badge className={`${getStageBgClass(lead.stage)} text-white text-[10px]`}>
                        {getStageLabel(lead.stage)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{lead.businessName}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
