'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Kanban, Users, ListChecks,
  Zap, AlertTriangle, Plus, Sprout,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MpzDashboard } from './mpz/mpz-dashboard'
import { MpzPipeline } from './mpz/mpz-pipeline'
import { MpzLeads } from './mpz/mpz-leads'
import { MpzTasks } from './mpz/mpz-tasks'
import { MpzAutomation } from './mpz/mpz-automation'
import { MpzAlerts } from './mpz/mpz-alerts'
import { MpzLeadDetail } from './mpz/mpz-lead-detail'
import { MpzNewLead } from './mpz/mpz-new-lead'
import { type MpzLead } from './mpz/constants'

type TabId = 'dashboard' | 'pipeline' | 'leads' | 'tasks' | 'automation' | 'alerts'

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', icon: Kanban },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
]

export function MastersPlanZone() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [selectedLead, setSelectedLead] = useState<MpzLead | null>(null)
  const [leadDetailOpen, setLeadDetailOpen] = useState(false)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSelectLead = (lead: MpzLead) => {
    setSelectedLead(lead)
    setLeadDetailOpen(true)
  }

  const handleLeadUpdated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/mpz/seed', { method: 'POST' })
      if (!res.ok) {
        toast.error('Failed to seed data')
        return
      }
      const data = await res.json()
      toast.success(`Seeded ${data.leads} leads, ${data.tasks} tasks, ${data.activities} activities`)
      setRefreshTrigger(prev => prev + 1)
    } catch {
      toast.error('Failed to seed data')
    }
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide">Masters Plan Zone</h1>
              <p className="text-[11px] text-muted-foreground">Lead Management & Automation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleSeed}
            >
              <Sprout className="h-3.5 w-3.5" /> Seed Data
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setNewLeadOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> New Lead
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 md:px-6">
          <div className="flex gap-1 overflow-x-auto pb-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap relative',
                    isActive
                      ? 'bg-card text-foreground border border-border border-b-transparent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="mpzTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && (
            <MpzDashboard onSelectLead={handleSelectLead} onTabChange={(tab) => setActiveTab(tab as TabId)} />
          )}
          {activeTab === 'pipeline' && (
            <MpzPipeline onSelectLead={handleSelectLead} />
          )}
          {activeTab === 'leads' && (
            <MpzLeads onSelectLead={handleSelectLead} refreshTrigger={refreshTrigger} />
          )}
          {activeTab === 'tasks' && (
            <MpzTasks key={refreshTrigger} />
          )}
          {activeTab === 'automation' && (
            <MpzAutomation />
          )}
          {activeTab === 'alerts' && (
            <MpzAlerts onSelectLead={handleSelectLead} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Lead Detail Sheet */}
      <MpzLeadDetail
        lead={selectedLead}
        open={leadDetailOpen}
        onClose={() => setLeadDetailOpen(false)}
        onUpdated={handleLeadUpdated}
      />

      {/* New Lead Dialog */}
      <MpzNewLead
        open={newLeadOpen}
        onClose={() => setNewLeadOpen(false)}
        onCreated={handleLeadUpdated}
      />
    </div>
  )
}
