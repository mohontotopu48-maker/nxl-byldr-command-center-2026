'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  PenLine,
  Save,
  TrendingUp,
  Users,
  Route,
  Sparkles,
  Zap,
  ChevronRight,
  Mail,
  Building2,
  Eye,
  BrainCircuit,
  MessageSquareText,
  Play,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                             */
/* ═══════════════════════════════════════════════════════════════ */

interface AlertData {
  active: boolean
  message: string
  priority?: string
}

interface SetupStep {
  id: string
  stepNumber: number
  title: string
  description?: string | null
  phase: string
  status: 'completed' | 'in_progress' | 'pending'
  completedAt?: string | null
}

interface JourneyCustomer {
  id: string
  name: string
  email: string
  company?: string | null
  status?: string
  plan?: string
}

interface JourneyAlert {
  id?: string
  active: boolean
  message: string
  priority: string
}

interface ClientJourney {
  id: string
  customerId: string
  currentPhase: string
  overallStatus: string
  completedSteps: number
  totalSteps: number
  createdAt: string
  updatedAt: string
  customer: JourneyCustomer
  setupSteps: SetupStep[]
  alerts: JourneyAlert[]
}

interface DashboardStats {
  totalCustomers: number
  activeTasks: number
  teamMembers: number
  totalProjects: number
  completionRate: number
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants & Helpers                                               */
/* ═══════════════════════════════════════════════════════════════ */

const PHASES = [
  { id: 'discovery', label: 'Phase 1', title: 'The Handover', desc: 'Gathering your business info', steps: [1, 2, 3] },
  { id: 'strategy', label: 'Phase 2', title: 'The Game Plan', desc: 'Planning your lead strategy', steps: [4, 5, 6] },
  { id: 'delivery', label: 'Phase 3', title: 'Technical Foundation', desc: 'Building your ads & CRM', steps: [7, 8, 9, 10, 11] },
  { id: 'launch', label: 'Phase 4', title: 'Live & Running', desc: 'Getting you live', steps: [12, 13] },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
} as const

function getAuth() {
  if (typeof window === 'undefined') return null
  try {
    const a = localStorage.getItem('vsual_auth')
    if (a) return JSON.parse(a) as { name: string; email: string; role: string; loggedIn?: boolean }
  } catch { /* empty */ }
  return null
}

function checkIsAdmin(auth: ReturnType<typeof getAuth>) {
  if (!auth) return false
  return auth.role === 'master_admin' || MASTER_ADMIN_EMAILS.includes(auth.email?.toLowerCase() as typeof MASTER_ADMIN_EMAILS[number])
}

function getPhaseLabel(phaseId: string) {
  return PHASES.find(p => p.id === phaseId)?.title ?? phaseId
}

function getPhaseIndex(phaseId: string) {
  return PHASES.findIndex(p => p.id === phaseId)
}

function getPhaseProgress(steps: SetupStep[], phaseId: string) {
  const phaseSteps = steps.filter(s => s.phase === phaseId)
  const done = phaseSteps.filter(s => s.status === 'completed').length
  return { done, total: phaseSteps.length }
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getCompletionPercent(journey: ClientJourney) {
  if (!journey.totalSteps) return 0
  return Math.round((journey.completedSteps / journey.totalSteps) * 100)
}

function getStatusLightClass(status: string) {
  switch (status) {
    case 'completed': return 'bg-primary shadow-md shadow-primary/30'
    case 'in_progress': return 'bg-amber-400 shadow-md shadow-amber-400/30 animate-pulse'
    default: return 'bg-muted-foreground/20'
  }
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Dashboard — routes to Admin or Client view                  */
/* ═══════════════════════════════════════════════════════════════ */

export function DashboardView() {
  const [auth, setAuth] = useState<ReturnType<typeof getAuth> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setAuth(getAuth())
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isAdmin = checkIsAdmin(auth)

  return isAdmin ? <AdminDashboard auth={auth} /> : <ClientDashboard auth={auth} />
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Admin Dashboard                                                  */
/* ═══════════════════════════════════════════════════════════════ */

function AdminDashboard({ auth }: { auth: ReturnType<typeof getAuth> | null }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [journeys, setJourneys] = useState<ClientJourney[]>([])
  const [loading, setLoading] = useState(true)
  const [alertData, setAlertData] = useState<AlertData>({ active: false, message: 'All Systems Go — Project on Schedule.' })

  // Alert edit dialog
  const [alertEditOpen, setAlertEditOpen] = useState(false)
  const [alertEditActive, setAlertEditActive] = useState(false)
  const [alertEditMessage, setAlertEditMessage] = useState('')
  const [alertSaving, setAlertSaving] = useState(false)

  // Journey detail dialog
  const [selectedJourney, setSelectedJourney] = useState<ClientJourney | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Fetch all data on mount
  const fetchAll = useCallback(async () => {
    try {
      const [dashRes, journeyRes, alertRes] = await Promise.all([
        apiFetch('/api/dashboard'),
        apiFetch('/api/journey'),
        apiFetch('/api/alert-bar'),
      ])
      if (dashRes.ok) setStats(await dashRes.json())
      if (journeyRes.ok) {
        const json = await journeyRes.json()
        const arr = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
        setJourneys(arr)
      }
      if (alertRes.ok) {
        const data = await alertRes.json()
        setAlertData(data)
      }
    } catch { toast.error('Failed to load dashboard data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Save global alert
  const handleSaveAlert = async () => {
    setAlertSaving(true)
    try {
      const res = await apiFetch('/api/alert-bar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: alertEditActive, message: alertEditMessage }),
      })
      if (res.ok) {
        const data = await res.json()
        setAlertData(data)
        setAlertEditOpen(false)
        toast.success('Global alert updated')
      }
    } catch { toast.error('Failed to update alert') }
    finally { setAlertSaving(false) }
  }

  // Open journey detail
  const openJourneyDetail = (journey: ClientJourney) => {
    setSelectedJourney(journey)
    setDetailOpen(true)
  }

  // Refresh journeys after detail changes
  const refreshJourneys = useCallback(async () => {
    try {
      const res = await apiFetch('/api/journey')
      if (res.ok) {
        const json = await res.json()
        const arr = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
        setJourneys(arr)
      }
    } catch { toast.error('Failed to refresh journeys') }
  }, [])

  // Derived stats
  const activeJourneys = journeys.filter(j => j.overallStatus === 'active' || j.overallStatus === 'in_progress').length
  const avgCompletion = journeys.length > 0
    ? Math.round(journeys.reduce((sum, j) => sum + getCompletionPercent(j), 0) / journeys.length)
    : 0
  const totalCompletedSteps = journeys.reduce((sum, j) => sum + j.completedSteps, 0)
  const journeysWithAlerts = journeys.filter(j => j.alerts.length > 0 && j.alerts[0].active).length

  const userName = auth?.name || 'Admin'

  const statCards = [
    { label: 'Total Clients', value: stats?.totalCustomers ?? '...', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active Journeys', value: loading ? '...' : String(activeJourneys), icon: Route, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Avg Completion', value: loading ? '...' : `${avgCompletion}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Steps Completed', value: loading ? '...' : String(totalCompletedSteps), icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Alerts Active', value: loading ? '...' : String(journeysWithAlerts), icon: AlertCircle, color: 'text-primary', bg: 'bg-primary/10' },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 p-4 md:p-6">

      {/* ═══ GLOBAL ACTION BAR ═══ */}
      <motion.div variants={itemVariants}>
        <div
          className={`relative flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
            alertData.active
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
              : 'bg-muted/50 text-muted-foreground border border-border'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {alertData.active
              ? <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
              : <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            }
            <span className="text-sm font-medium truncate">{alertData.message}</span>
          </div>
          <Button
            variant={alertData.active ? 'ghost' : 'outline'}
            size="sm"
            onClick={() => { setAlertEditActive(alertData.active); setAlertEditMessage(alertData.message); setAlertEditOpen(true) }}
            className={`shrink-0 h-7 text-xs ${alertData.active ? 'text-primary-foreground hover:bg-primary-foreground/20' : 'border-border text-muted-foreground'}`}
          >
            <PenLine className="h-3 w-3 mr-1" />Edit
          </Button>
        </div>
      </motion.div>

      {/* ═══ WELCOME BANNER ═══ */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-border bg-card">
          <div className="relative h-40 md:h-48">
            <img src="/dashboard-banner.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="absolute top-3 right-3 md:top-5 md:right-5 opacity-[0.07] pointer-events-none">
              <img src="/vsual-brand-cover.jpg" alt="" className="h-28 w-28 md:h-36 md:w-36 object-contain" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/85 to-[#0B0B0F]/30" />
            <div className="absolute inset-0 flex items-center px-6 md:px-8">
              <div className="max-w-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Welcome back,</p>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">{userName}</h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Client Journey Command Center — track every build, manage alerts, automate progress.
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/60 tracking-wider uppercase">
                  VSUAL NXL BYLDR Command Center
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ═══ STATS CARDS ═══ */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="group border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* ═══ CLIENT JOURNEY PIPELINE ═══ */}
      <motion.div variants={itemVariants}>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  Client Journey Pipeline
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  {journeys.length} client{journeys.length !== 1 ? 's' : ''} tracked across 4 phases · 13-step onboarding
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAll()}
                className="border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30"
              >
                <Zap className="h-3 w-3 mr-1" />Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading journeys...</span>
              </div>
            ) : journeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Route className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No client journeys yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Create a journey from the Customers page.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {journeys.map((journey, index) => (
                  <JourneyPipelineCard
                    key={journey.id}
                    journey={journey}
                    index={index}
                    onClick={() => openJourneyDetail(journey)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ HOW TO USE ═══ */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <HowToUseDialog />
      </motion.div>

      {/* ═══ EDIT GLOBAL ALERT DIALOG ═══ */}
      <Dialog open={alertEditOpen} onOpenChange={setAlertEditOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Global Alert</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update the top alert bar visible to all users.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAlertEditActive(false)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${!alertEditActive ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
              >
                <CheckCircle2 className="h-4 w-4" />All Clear
              </button>
              <button
                onClick={() => setAlertEditActive(true)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${alertEditActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}
              >
                <AlertTriangle className="h-4 w-4" />Action Required
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-foreground font-medium">Alert Message</label>
              <input
                type="text"
                value={alertEditMessage}
                onChange={(e) => setAlertEditMessage(e.target.value)}
                placeholder={alertEditActive ? 'ACTION REQUIRED: e.g., We need your OTP code for Facebook' : 'All Systems Go — Project on Schedule.'}
                className="h-11 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAlertEditOpen(false)} className="flex-1 border-border">Cancel</Button>
              <Button onClick={handleSaveAlert} disabled={alertSaving} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                {alertSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Update</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ JOURNEY DETAIL DIALOG ═══ */}
      {selectedJourney && (
        <JourneyDetailDialog
          journey={selectedJourney}
          open={detailOpen}
          onOpenChange={(open) => { setDetailOpen(open); if (!open) setSelectedJourney(null) }}
          onRefresh={refreshJourneys}
        />
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Journey Pipeline Card (admin grid item)                         */
/* ═══════════════════════════════════════════════════════════════ */

function JourneyPipelineCard({ journey, index, onClick }: { journey: ClientJourney; index: number; onClick: () => void }) {
  const pct = getCompletionPercent(journey)
  const phaseIndex = getPhaseIndex(journey.currentPhase)
  const hasActiveAlert = journey.alerts.length > 0 && journey.alerts[0].active

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group"
    >
      {/* Avatar + Name */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
          {getInitials(journey.customer.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground truncate">{journey.customer.name}</span>
          {hasActiveAlert && (
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {journey.customer.company && (
            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{journey.customer.company}</span>
          )}
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{journey.customer.email}</span>
        </div>
      </div>

      {/* Phase Badge */}
      <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
        <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 ${phaseIndex === 3 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {getPhaseLabel(journey.currentPhase)}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {journey.completedSteps}/{journey.totalSteps} steps
        </span>
      </div>

      {/* Progress bar */}
      <div className="hidden sm:block w-32 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Progress</span>
          <span className={`text-xs font-bold ${pct === 100 ? 'text-primary' : 'text-foreground'}`}>{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, delay: index * 0.04 }}
          />
        </div>
      </div>

      {/* Completion badge */}
      <Badge className={`shrink-0 text-[11px] font-bold px-2.5 py-1 ${
        pct === 100
          ? 'bg-primary text-primary-foreground'
          : pct >= 50
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
      }`}>
        {pct === 100 ? 'Complete' : `${pct}%`}
      </Badge>

      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 hidden sm:block" />
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Journey Detail Dialog (admin)                                   */
/* ═══════════════════════════════════════════════════════════════ */

function JourneyDetailDialog({ journey, open, onOpenChange, onRefresh }: {
  journey: ClientJourney
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
}) {
  const [steps, setSteps] = useState<SetupStep[]>(journey.setupSteps)
  const [alertActive, setAlertActive] = useState(journey.alerts[0]?.active ?? false)
  const [alertMessage, setAlertMessage] = useState(journey.alerts[0]?.message ?? 'All Systems Go — Project on Schedule.')
  const [alertSaving, setAlertSaving] = useState(false)
  const [stepSaving, setStepSaving] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState('')

  const pct = getCompletionPercent(journey)

  // Toggle step status
  const handleStepToggle = async (step: SetupStep) => {
    const nextStatus = step.status === 'completed' ? 'pending' : step.status === 'in_progress' ? 'completed' : 'in_progress'
    setStepSaving(step.id)
    try {
      const res = await apiFetch(`/api/journey/${journey.id}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: step.id, status: nextStatus }),
      })
      if (res.ok) {
        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, status: nextStatus as SetupStep['status'], completedAt: nextStatus === 'completed' ? new Date().toISOString() : null } : s))
        toast.success(`Step ${step.stepNumber} → ${nextStatus.replace('_', ' ')}`)
        onRefresh()
      }
    } catch { toast.error('Failed to update step') }
    finally { setStepSaving(null) }
  }

  // Save alert
  const handleSaveAlert = async () => {
    setAlertSaving(true)
    try {
      const res = await apiFetch(`/api/journey/${journey.id}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: alertActive, message: alertMessage, priority: alertActive ? 'urgent' : 'normal' }),
      })
      if (res.ok) {
        toast.success('Client alert updated')
        onRefresh()
      }
    } catch { toast.error('Failed to save alert') }
    finally { setAlertSaving(false) }
  }

  // AI automation
  const handleAiAction = async (action: string) => {
    setAiLoading(action)
    setAiResponse('')
    try {
      const res = await apiFetch(`/api/journey/${journey.id}/automate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiResponse(data.response || 'Done')
        toast.success('AI automation complete')
        onRefresh()
        // Also refresh steps if auto_advance
        if (action === 'generate_alert') {
          const jRes = await apiFetch(`/api/journey/${journey.id}`)
          if (jRes.ok) {
            const jData = await jRes.json()
            setSteps(jData.setupSteps || steps)
            if (data.alertMessage) setAlertMessage(data.alertMessage)
            if (data.alertActive !== undefined) setAlertActive(data.alertActive)
          }
        }
      } else {
        toast.error('AI automation failed')
      }
    } catch { toast.error('AI request failed') }
    finally { setAiLoading(null) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {getInitials(journey.customer.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-foreground text-lg">{journey.customer.name}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                {journey.customer.company} · {journey.customer.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Phase Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Phase Progress</span>
              <Badge className={`text-xs font-bold ${pct === 100 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                {pct}% Complete
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:flex sm:gap-1.5">
              {PHASES.map((phase, i) => {
                const { done, total } = getPhaseProgress(steps, phase.id)
                const isActive = phase.id === journey.currentPhase
                const isComplete = total > 0 && done === total
                return (
                  <div key={phase.id} className={`rounded-lg p-2.5 border transition-all ${
                    isComplete ? 'border-primary/30 bg-primary/5' : isActive ? 'border-amber-400/40 bg-amber-400/5' : 'border-border bg-muted/30'
                  }`}>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{phase.label}</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{phase.title}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${isComplete ? 'bg-primary' : isActive ? 'bg-amber-400' : 'bg-muted-foreground/30'}`}
                          style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{done}/{total}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 13 Steps */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">13-Step Setup Progress</h4>
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
              {steps.map((step) => {
                const isCompleted = step.status === 'completed'
                const isInProgress = step.status === 'in_progress'
                return (
                  <div key={step.id} className={`flex items-center gap-3 rounded-lg p-2.5 transition-colors ${isCompleted ? 'bg-primary/5' : ''}`}>
                    <button
                      onClick={() => handleStepToggle(step)}
                      disabled={stepSaving === step.id}
                      className={`relative shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-all ${getStatusLightClass(step.status)} ${stepSaving === step.id ? 'opacity-50' : 'cursor-pointer hover:scale-110'}`}
                      title="Click to cycle status"
                    >
                      {stepSaving === step.id ? <Loader2 className="h-3 w-3 animate-spin text-foreground" /> : null}
                      {isCompleted && stepSaving !== step.id && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                      {isInProgress && stepSaving !== step.id && <Clock className="h-3 w-3 text-amber-950" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Step {step.stepNumber}</span>
                      <p className={`text-xs font-medium ${isCompleted ? 'text-primary' : 'text-foreground'}`}>{step.title}</p>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                      isCompleted ? 'text-primary' : isInProgress ? 'text-amber-400' : 'text-muted-foreground/50'
                    }`}>
                      {isCompleted ? 'Done' : isInProgress ? 'Active' : 'Pending'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alert Management */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />Client Alert
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setAlertActive(false)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${!alertActive ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
              >
                <CheckCircle2 className="h-3 w-3" />All Clear
              </button>
              <button
                onClick={() => setAlertActive(true)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${alertActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}
              >
                <AlertTriangle className="h-3 w-3" />Action Required
              </button>
            </div>
            <input
              type="text"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              className="h-10 w-full border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              placeholder="Alert message for this client..."
            />
            <Button onClick={handleSaveAlert} disabled={alertSaving} size="sm" className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
              {alertSaving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Save className="mr-1.5 h-3 w-3" />}
              Save Alert
            </Button>
          </div>

          {/* AI Automation */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />AI Automation
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAiAction('suggest_next')}
                disabled={aiLoading !== null}
                className="border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 h-9"
              >
                {aiLoading === 'suggest_next' ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <BrainCircuit className="mr-1.5 h-3 w-3" />}
                Suggest Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAiAction('generate_alert')}
                disabled={aiLoading !== null}
                className="border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 h-9"
              >
                {aiLoading === 'generate_alert' ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <MessageSquareText className="mr-1.5 h-3 w-3" />}
                AI Generate Alert
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAiAction('auto_advance_confirm')}
                disabled={aiLoading !== null}
                className="border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 h-9"
              >
                {aiLoading === 'auto_advance_confirm' ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Play className="mr-1.5 h-3 w-3" />}
                Auto Advance
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAiAction('progress_summary')}
                disabled={aiLoading !== null}
                className="border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 h-9"
              >
                {aiLoading === 'progress_summary' ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <BarChart3 className="mr-1.5 h-3 w-3" />}
                Progress Summary
              </Button>
            </div>
            {aiResponse && (
              <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">{aiResponse}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Client Dashboard (read-only)                                    */
/* ═══════════════════════════════════════════════════════════════ */

function ClientDashboard({ auth }: { auth: ReturnType<typeof getAuth> | null }) {
  const [loading, setLoading] = useState(true)
  const [journey, setJourney] = useState<ClientJourney | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [alertData, setAlertData] = useState<AlertData>({ active: false, message: 'All Systems Go — Project on Schedule.' })

  const userName = auth?.name || 'User'

  // Fetch journey by matching email from the journey list
  useEffect(() => {
    async function fetchJourney() {
      try {
        const res = await apiFetch('/api/journey')
        if (res.ok) {
          const json = await res.json()
          const journeys: ClientJourney[] = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : [])
          const myJourney = journeys.find(j => j.customer.email?.toLowerCase() === auth?.email?.toLowerCase())
          if (myJourney) {
            setJourney(myJourney)
            if (myJourney.alerts.length > 0) {
              setAlertData({ active: myJourney.alerts[0].active, message: myJourney.alerts[0].message, priority: myJourney.alerts[0].priority })
            }
          } else {
            setNotFound(true)
          }
        }
      } catch { toast.error('Failed to load journey data') }
      finally { setLoading(false) }
    }
    fetchJourney()
  }, [auth?.email])

  const steps = journey?.setupSteps || []
  const completedCount = steps.filter(s => s.status === 'completed').length
  const inProgressCount = steps.filter(s => s.status === 'in_progress').length
  const pct = journey ? getCompletionPercent(journey) : 0

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 p-4 md:p-6">

      {/* ═══ ACTION BAR ═══ */}
      <motion.div variants={itemVariants}>
        <div
          className={`relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
            alertData.active
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
              : 'bg-muted/50 text-muted-foreground border border-border'
          }`}
        >
          {alertData.active
            ? <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
            : <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          }
          <span className="text-sm font-medium truncate">{alertData.message}</span>
        </div>
      </motion.div>

      {/* ═══ WELCOME BANNER ═══ */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-border bg-card">
          <div className="relative h-40 md:h-44">
            <img src="/dashboard-banner.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/80 to-[#0B0B0F]/30" />
            <div className="absolute inset-0 flex items-center px-6 md:px-8">
              <div className="max-w-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Welcome back,</p>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">{userName}</h1>
                <p className="mt-2 text-sm text-muted-foreground">Your NXL BYLDR Command Center.</p>
                <p className="mt-1 text-[11px] text-muted-foreground/60 tracking-wider uppercase">
                  VSUAL NXL BYLDR Command Center
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading your journey...</span>
        </div>
      ) : notFound ? (
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Route className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No journey found for your account.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Contact your VSUAL project manager to get started.</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : journey ? (
        <>
          {/* ═══ 4 PHASES OVERVIEW ═══ */}
          <motion.div variants={itemVariants}>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">Your 4 Phases</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      {completedCount} of 13 steps completed
                      {inProgressCount > 0 && <span className="text-amber-400 ml-1">· {inProgressCount} in progress</span>}
                    </CardDescription>
                  </div>
                  <Badge className={`text-xs font-bold px-2.5 py-1 ${pct === 100 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                    {pct}%
                  </Badge>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  {PHASES.map((phase, i) => {
                    const { done, total } = getPhaseProgress(steps, phase.id)
                    const isActive = phase.id === journey.currentPhase
                    const isComplete = total > 0 && done === total
                    return (
                      <div key={phase.id} className={`rounded-xl border p-4 transition-all ${
                        isComplete ? 'border-primary/30 bg-primary/5' : isActive ? 'border-amber-400/30 bg-amber-400/5' : 'border-border bg-muted/20'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            isComplete ? 'bg-primary/20 text-primary' : isActive ? 'bg-amber-400/20 text-amber-400' : 'bg-muted text-muted-foreground'
                          }`}>
                            {isComplete ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold ${isComplete ? 'text-primary' : isActive ? 'text-amber-400' : 'text-foreground'}`}>
                              {phase.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{phase.desc}</p>
                            {total > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                                  <div className={`h-full rounded-full ${isComplete ? 'bg-primary' : isActive ? 'bg-amber-400' : 'bg-muted-foreground/30'}`}
                                    style={{ width: `${(done / total) * 100}%` }} />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground">{done}/{total}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ═══ 13-STEP SETUP PROGRESS (read-only) ═══ */}
          <motion.div variants={itemVariants}>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground">13-Step Setup Progress</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Read-only · Your build status at a glance</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {steps.map((step) => {
                    const phaseInfo = PHASES.find(p => p.id === step.phase)
                    const isCompleted = step.status === 'completed'
                    const isInProgress = step.status === 'in_progress'
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${isCompleted ? 'bg-primary/5' : ''}`}
                      >
                        {/* Status Light */}
                        <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${getStatusLightClass(step.status)}`}>
                          {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                          {isInProgress && <Clock className="h-3.5 w-3.5 text-amber-950" />}
                        </div>
                        {/* Step info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Step {step.stepNumber}</span>
                            {phaseInfo && (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground">
                                {phaseInfo.title}
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm font-medium mt-0.5 ${isCompleted ? 'text-primary' : 'text-foreground'}`}>
                            {step.title}
                          </p>
                        </div>
                        {/* Status label */}
                        <span className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                          isCompleted ? 'text-primary' : isInProgress ? 'text-amber-400' : 'text-muted-foreground/50'
                        }`}>
                          {isCompleted ? 'Done' : isInProgress ? 'In Progress' : 'Pending'}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ═══ HOW TO USE ═══ */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <HowToUseDialog />
          </motion.div>
        </>
      ) : null}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  ClientJourneyView — re-export for sidebar nav                   */
/* ═══════════════════════════════════════════════════════════════ */

export function ClientJourneyView() {
  return <DashboardView />
}

/* ═══════════════════════════════════════════════════════════════ */
/*  How To Use Dialog                                                */
/* ═══════════════════════════════════════════════════════════════ */

function HowToUseDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 border border-border/50 text-sm">
        <Info className="h-3.5 w-3.5" />
        How to use this Command Center
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg">How to use your VSUAL NXL BYLDR Command Center</DialogTitle>
            <DialogDescription className="text-muted-foreground">Your growth, marketing & AI automation hub — get the status of your build in 5 seconds.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />Status Lights — Setup Progress
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary shrink-0" />
                  <span><strong className="text-primary">Magenta</strong> — We&apos;ve finished that part of the build.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span><strong className="text-amber-400">Pulsing Amber</strong> — We&apos;re currently working on this step.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-muted-foreground/20 shrink-0" />
                  <span><strong className="text-muted-foreground">Grey</strong> — We haven&apos;t reached that stage yet.</span>
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />Action Bar
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Check the bar at the top of your dashboard. If it&apos;s <strong className="text-primary">Magenta</strong>, we need a quick &quot;OK&quot; or a code from you.
                If it&apos;s clear and says <strong className="text-foreground">&quot;All Systems Go,&quot;</strong> you&apos;re all set.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />Your Role
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Check this once a day. If the top bar says &quot;All Systems Go,&quot; you&apos;re all set.
                If it asks for an action, please handle it quickly so we can keep your lead machine moving.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">4 Phases of Your Build</h4>
              <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                <li><strong className="text-foreground">The Handover</strong> — Gathering your business info</li>
                <li><strong className="text-foreground">The Game Plan</strong> — Planning your lead strategy</li>
                <li><strong className="text-foreground">Technical Foundation</strong> — Building your ads and CRM sync</li>
                <li><strong className="text-foreground">Live &amp; Running</strong> — Getting you on job sites</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
