'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { PIPELINE_STAGES, getTimeAgo, getStageLabel, getStageBgClass, type MpzLead } from './constants'

interface MpzPipelineProps {
  onSelectLead: (lead: MpzLead) => void
}

export function MpzPipeline({ onSelectLead }: MpzPipelineProps) {
  const [leads, setLeads] = useState<MpzLead[]>([])
  const [loading, setLoading] = useState(true)
  const [movingLead, setMovingLead] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/mpz/leads')
      if (!res.ok) return
      const data = await res.json()
      setLeads(data)
    } catch {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const handleMoveLead = async (lead: MpzLead, newStage: string) => {
    if (lead.stage === newStage) return
    setMovingLead(lead.id)
    try {
      const res = await fetch(`/api/mpz/leads/${lead.id}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      const updated = await res.json()
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: newStage, updatedAt: updated.updatedAt } : l))
    } catch {
      // ignore
    } finally {
      setMovingLead(null)
    }
  }

  const getLeadsByStage = (stageKey: string) => leads.filter(l => l.stage === stageKey)

  const getNextStage = (stageKey: string): string | null => {
    const idx = PIPELINE_STAGES.findIndex(s => s.key === stageKey)
    if (idx < 0 || idx >= PIPELINE_STAGES.length - 1) return null
    return PIPELINE_STAGES[idx + 1].key
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map(s => (
            <div key={s.key} className="flex-shrink-0 w-[280px]">
              <Skeleton className="h-8 w-32 mb-3" />
              <Skeleton className="h-28 w-full mb-2" />
              <Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col p-4 md:p-6">
      <ScrollArea className="flex-1">
        <div className="flex gap-4 pb-4 min-h-full">
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = getLeadsByStage(stage.key)
            return (
              <div
                key={stage.key}
                className="flex-shrink-0 w-[260px] md:w-[280px] flex flex-col rounded-xl bg-muted/30"
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 p-3 pb-2">
                  <div className={cn('h-2.5 w-2.5 rounded-full', stage.bgClass)} />
                  <h3 className="text-sm font-semibold flex-1">{stage.label}</h3>
                  <Badge variant="secondary" className="h-5 min-w-[22px] justify-center text-[10px]">
                    {stageLeads.length}
                  </Badge>
                </div>

                {/* Column Body */}
                <ScrollArea className="flex-1 max-h-[calc(100vh-16rem)] px-2 pb-2">
                  <div className="space-y-2">
                    {stageLeads.map(lead => {
                      const isHot = lead.stage === 'hot_lead'
                      const isMoving = movingLead === lead.id
                      const nextStage = getNextStage(lead.stage)
                      return (
                        <motion.div
                          key={lead.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div
                            className={cn(
                              'cursor-pointer rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-all relative',
                              isHot && 'border-red-500/50 shadow-red-500/10 shadow-md',
                              isMoving && 'opacity-50'
                            )}
                            onClick={() => onSelectLead(lead)}
                          >
                            {isHot && (
                              <span className="absolute -top-1 -right-1 text-base">🔥</span>
                            )}
                            <p className="font-medium text-sm truncate">{lead.name}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.businessName}</p>

                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px] font-normal">
                                {lead.serviceType}
                              </Badge>
                              {lead.mockupReady && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                  Mockup
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {getTimeAgo(lead.createdAt)}
                              </div>
                              <Badge variant="secondary" className="text-[10px]">
                                {lead.assignedTo}
                              </Badge>
                            </div>

                            {/* Advance button */}
                            {nextStage && (
                              <button
                                className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[10px] py-1 rounded-b-lg opacity-0 hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveLead(lead, nextStage)
                                }}
                              >
                                → {getStageLabel(nextStage)}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                    {stageLeads.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground rounded-lg border border-dashed border-border">
                        No leads
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
