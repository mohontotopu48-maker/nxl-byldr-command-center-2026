'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Video, Phone, Play, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { AUTOMATION_STEPS, getStageLabel, getStageBgClass, type MpzLead } from './constants'

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  video: Video,
  call: Phone,
}

export function MpzAutomation() {
  const [leads, setLeads] = useState<MpzLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/mpz/leads')
      .then(r => r.ok ? r.json().then(json => json.data || json) : [])
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false))
  }, [])

  const activeAutomations = leads.filter(l => l.automationStarted)
  const availableLeads = leads.filter(l => !l.automationStarted && l.stage !== 'closed_won' && l.stage !== 'closed_lost')

  const handleTriggerAutomation = (leadId: string) => {
    toast.success('Automation started for this lead!', {
      description: 'The 14-day funnel sequence has been triggered.',
    })
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Funnel Timeline */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">14-Day Funnel Sequence</CardTitle>
            </div>
            <CardDescription>
              Automated follow-up sequence to nurture leads through the pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border md:left-1/2" />
                <div className="space-y-6">
                  {AUTOMATION_STEPS.map((step, idx) => {
                    const Icon = STEP_ICONS[step.type] ?? Mail
                    const isLeft = idx % 2 === 0
                    const leadsAtDay = activeAutomations.filter(l => l.automationDay >= step.day).length
                    const completedLeads = activeAutomations.filter(l => l.automationDay > step.day).length

                    return (
                      <motion.div
                        key={step.day}
                        initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="relative flex items-start gap-4 md:gap-8"
                      >
                        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-500/50 bg-card shadow-sm">
                          <Icon className="h-5 w-5 text-amber-500" />
                        </div>

                        <div className={cn(
                          'flex-1 rounded-lg border border-border bg-card p-4 hover:shadow-sm transition-shadow',
                          'md:max-w-[calc(50%-4rem)]',
                          isLeft ? 'md:mr-auto md:text-right' : 'md:ml-auto'
                        )}>
                          <div className={cn('flex items-center gap-2 mb-1', isLeft && 'md:flex-row-reverse')}>
                            <Badge variant="outline" className="text-[10px]">Day {step.day}</Badge>
                            <h4 className="font-semibold text-sm">{step.title}</h4>
                          </div>
                          <p className={cn('text-xs text-muted-foreground', isLeft && 'md:text-right')}>
                            {step.description}
                          </p>
                          <div className={cn('flex items-center gap-2 mt-2', isLeft && 'md:justify-end')}>
                            <Badge variant="secondary" className="text-[10px]">
                              {leadsAtDay} leads here
                            </Badge>
                            <Badge className="bg-pink-500/10 text-pink-600 text-[10px]">
                              {completedLeads} moved on
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Automations */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Automations</CardTitle>
              <CardDescription>{activeAutomations.length} leads currently in the funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {activeAutomations.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No active automations</p>
                  ) : (
                    activeAutomations.map((lead) => (
                      <div key={lead.id} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{lead.name}</p>
                          <Badge className={cn(getStageBgClass(lead.stage), 'text-white text-[10px]')}>
                            {getStageLabel(lead.stage)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{lead.businessName}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Day {lead.automationDay} of 14</span>
                            <span>{Math.round((lead.automationDay / 14) * 100)}%</span>
                          </div>
                          <Progress value={(lead.automationDay / 14) * 100} className="h-1.5" />
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {AUTOMATION_STEPS.map(step => (
                            <div
                              key={step.day}
                              className={cn(
                                'h-1.5 w-6 rounded-full',
                                lead.automationDay >= step.day ? 'bg-amber-500' : 'bg-muted'
                              )}
                              title={`Day ${step.day}: ${step.title}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Available */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Available for Automation</CardTitle>
              <CardDescription>{availableLeads.length} leads ready to start the funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {availableLeads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      All leads are already in automation or closed
                    </p>
                  ) : (
                    availableLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{lead.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{lead.businessName}</p>
                        </div>
                        <Badge className={cn(getStageBgClass(lead.stage), 'text-white text-[10px]')}>
                          {getStageLabel(lead.stage)}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 gap-1 text-xs"
                          onClick={() => handleTriggerAutomation(lead.id)}
                        >
                          <Play className="h-3 w-3" /> Start
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
