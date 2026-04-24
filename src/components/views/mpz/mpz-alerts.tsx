'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, AlertTriangle, Clock, CheckCircle2, TrendingDown, Bell, Phone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { getStageLabel, getStageBgClass, isOverdue, PRIORITY_COLORS, type MpzLead, type MpzTask } from './constants'

interface MpzAlertsProps {
  onSelectLead: (lead: MpzLead) => void
}

export function MpzAlerts({ onSelectLead }: MpzAlertsProps) {
  const [leads, setLeads] = useState<MpzLead[]>([])
  const [tasks, setTasks] = useState<MpzTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch('/api/mpz/leads').then(r => r.ok ? r.json() : []),
      apiFetch('/api/mpz/tasks').then(r => r.ok ? r.json() : []),
    ])
      .then(([l, t]) => { setLeads(l); setTasks(t) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hotLeads = leads.filter(l => l.stage === 'hot_lead')
  const stuckLeads = leads.filter(l => {
    if (l.stage === 'closed_won' || l.stage === 'closed_lost') return false
    const updated = new Date(l.updatedAt)
    const daysSinceUpdate = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUpdate > 3
  })
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate))
  const urgentTasks = tasks.filter(t => t.status !== 'completed' && t.priority === 'urgent')

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Summary Bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-6 p-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <span className="font-semibold">Alert Summary</span>
            </div>
            <div className="flex gap-4 flex-wrap">
              <Badge variant="destructive" className="gap-1 text-sm py-1">
                <Flame className="h-3.5 w-3.5" /> {hotLeads.length} Hot Leads
              </Badge>
              <Badge variant="secondary" className="gap-1 text-sm py-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {stuckLeads.length} Stuck Leads
              </Badge>
              <Badge variant="secondary" className="gap-1 text-sm py-1">
                <Clock className="h-3.5 w-3.5" /> {overdueTasks.length} Overdue Tasks
              </Badge>
              <Badge variant="secondary" className="gap-1 text-sm py-1">
                <Flame className="h-3.5 w-3.5" /> {urgentTasks.length} Urgent Tasks
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hot Lead Alerts */}
      {hotLeads.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <Flame className="h-5 w-5" /> Hot Lead Alerts
              </CardTitle>
              <CardDescription>These leads are ready to be closed — act now!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {hotLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="cursor-pointer rounded-lg border border-red-500/30 bg-card p-4 hover:shadow-md transition-all"
                    onClick={() => onSelectLead(lead)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{lead.businessName}</p>
                      </div>
                      <span className="text-xl">🔥</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-red-500 text-white text-[10px]">{getStageLabel(lead.stage)}</Badge>
                      <Badge variant="outline" className="text-[10px]">{lead.serviceType}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Assigned to: <span className="font-medium text-foreground">{lead.assignedTo}</span>
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 w-full gap-1 bg-red-600 hover:bg-red-700 text-white text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectLead(lead)
                        toast.info(`Call ${lead.name} now!`, { description: lead.phone })
                      }}
                    >
                      <Phone className="h-3 w-3" /> Schedule Call
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stuck Leads */}
      {stuckLeads.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Stuck Lead Notifications
              </CardTitle>
              <CardDescription>Leads that haven&apos;t been updated in 3+ days</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {stuckLeads.map((lead) => {
                    const updated = new Date(lead.updatedAt)
                    const daysSince = Math.floor((Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <div
                        key={lead.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={() => onSelectLead(lead)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.businessName}</p>
                        </div>
                        <Badge className={cn(getStageBgClass(lead.stage), 'text-white text-[10px]')}>
                          {getStageLabel(lead.stage)}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {daysSince}d stuck
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-orange-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" /> Overdue Task Warnings
              </CardTitle>
              <CardDescription>Tasks past their due date that need attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <Badge className={cn(PRIORITY_COLORS[task.priority], 'text-[10px]')}>
                      {task.priority}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {task.assignedTo}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Daily Report */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-5 w-5" /> Daily Report Summary
            </CardTitle>
            <CardDescription>Today&apos;s performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold">{leads.length}</p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{hotLeads.length}</p>
                <p className="text-xs text-muted-foreground">Hot Leads</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">{overdueTasks.length}</p>
                <p className="text-xs text-muted-foreground">Overdue Tasks</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-bold text-pink-500">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Empty State */}
      {hotLeads.length === 0 && stuckLeads.length === 0 && overdueTasks.length === 0 && urgentTasks.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle2 className="h-16 w-16 text-pink-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">All Clear! 🎉</h3>
          <p className="text-muted-foreground mt-1">No alerts right now. Everything is running smoothly.</p>
        </div>
      )}
    </div>
  )
}
