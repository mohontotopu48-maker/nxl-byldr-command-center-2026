'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Route,
  LayoutDashboard,
  Mail,
  Send,
  LogOut,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Zap,
  BarChart3,
  User,
  Phone,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiFetch } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { BRAND, VSUAL_LOGO } from '@/lib/constants'
import { toast } from 'sonner'

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                             */
/* ═══════════════════════════════════════════════════════════════ */

interface CustomerPortalProps {
  auth: { name: string; email: string; role: string }
  onLogout: () => void
}

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

interface ContactMessage {
  id: string
  customerName: string
  customerEmail: string
  subject: string
  message: string
  priority: string
  status: string
  assignedTo: string
  reply?: string | null
  repliedAt?: string | null
  createdAt: string
  updatedAt: string
}

type TabId = 'dashboard' | 'my-journey' | 'contact-us' | 'my-profile'

/* ═══════════════════════════════════════════════════════════════ */
/*  Constants & Helpers                                               */
/* ═══════════════════════════════════════════════════════════════ */

const PHASES = [
  { id: 'handover', label: 'Phase 1', title: 'The Handover', desc: 'Gathering your business info', steps: [1, 2, 3] },
  { id: 'game_plan', label: 'Phase 2', title: 'The Game Plan', desc: 'Planning your lead strategy', steps: [4, 5, 6] },
  { id: 'technical', label: 'Phase 3', title: 'Technical Foundation', desc: 'Building your ads & CRM', steps: [7, 8, 9, 10, 11] },
  { id: 'live', label: 'Phase 4', title: 'Live & Running', desc: 'Getting you live', steps: [12, 13] },
]

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-journey', label: 'My Journey', icon: Route },
  { id: 'contact-us', label: 'Contact Us', icon: Mail },
  { id: 'my-profile', label: 'My Profile', icon: User },
]

const SAL_GEO_CONTACT = [
  { name: 'Sal', email: 'info.vsualdm@gmail.com', role: 'Master Admin · Operations' },
  { name: 'Geo', email: 'geovsualdm@gmail.com', role: 'Master Admin · Strategy' },
] as const

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Project Update',
  'Urgent Issue',
  'Feedback',
  'Other',
] as const

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal', color: 'text-muted-foreground' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400' },
  { value: 'urgent', label: 'Urgent', color: 'text-primary' },
] as const

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
} as const

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
} as const

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getPhaseLabel(phaseId: string) {
  return PHASES.find((p) => p.id === phaseId)?.title ?? phaseId
}

function getPhaseProgress(steps: SetupStep[], phaseId: string) {
  const phaseSteps = steps.filter((s) => s.phase === phaseId)
  const done = phaseSteps.filter((s) => s.status === 'completed').length
  return { done, total: phaseSteps.length }
}

function getCompletionPercent(journey: ClientJourney) {
  if (!journey.totalSteps) return 0
  return Math.round((journey.completedSteps / journey.totalSteps) * 100)
}

function getStatusLightClass(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-primary shadow-md shadow-primary/30'
    case 'in_progress':
      return 'bg-amber-400 shadow-md shadow-amber-400/30 animate-pulse'
    default:
      return 'bg-muted-foreground/20'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'in_progress':
      return 'In Progress'
    default:
      return 'Pending'
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTimeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr)
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Component                                                   */
/* ═══════════════════════════════════════════════════════════════ */

export function CustomerPortal({ auth, onLogout }: CustomerPortalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <img
              src={VSUAL_LOGO}
              alt="VSUAL"
              className="h-7 w-auto object-contain"
            />
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <span className="hidden text-sm font-semibold text-foreground sm:block">
              Customer Portal
            </span>
          </div>

          {/* Center: Nav Tabs */}
          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all whitespace-nowrap shrink-0',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 rounded-lg bg-primary/10"
                      style={{ zIndex: -1 }}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right: User */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {getInitials(auth.name)}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[120px] truncate text-sm text-foreground">
                {auth.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <DashboardTab auth={auth} />
              </motion.div>
            )}
            {activeTab === 'my-journey' && (
              <motion.div
                key="my-journey"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <MyJourneyTab auth={auth} />
              </motion.div>
            )}
            {activeTab === 'contact-us' && (
              <motion.div
                key="contact-us"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <ContactUsTab auth={auth} onSwitchToProfile={() => setActiveTab('my-profile')} />
              </motion.div>
            )}
            {activeTab === 'my-profile' && (
              <motion.div
                key="my-profile"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <MyProfileTab auth={auth} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Sticky Footer */}
      <footer className="border-t border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-center px-4">
          <p className="text-xs text-muted-foreground">
            Powered by {BRAND.poweredBy} — {BRAND.taglineText}
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Dashboard Tab                                                    */
/* ═══════════════════════════════════════════════════════════════ */

function DashboardTab({ auth }: { auth: { name: string; email: string; role: string } }) {
  const [loading, setLoading] = useState(true)
  const [journey, setJourney] = useState<ClientJourney | null>(null)
  const [alertData, setAlertData] = useState<AlertData>({
    active: false,
    message: 'All Systems Go — Machine is on Schedule.',
  })

  const fetchAll = useCallback(async () => {
    try {
      const [journeyRes, alertRes] = await Promise.all([
        apiFetch('/api/journey'),
        apiFetch('/api/alert-bar'),
      ])

      if (journeyRes.ok) {
        const data = await journeyRes.json()
        const journeys: ClientJourney[] = Array.isArray(data) ? data : []
        const myJourney = journeys.find(
          (j) => j.customer.email?.toLowerCase() === auth.email?.toLowerCase()
        )
        if (myJourney) {
          setJourney(myJourney)
          if (myJourney.alerts.length > 0) {
            setAlertData({
              active: myJourney.alerts[0].active,
              message: myJourney.alerts[0].message,
              priority: myJourney.alerts[0].priority,
            })
          }
        }
      }

      if (alertRes.ok) {
        const data = await alertRes.json()
        setAlertData(data)
      }
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [auth.email])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const steps = journey?.setupSteps || []
  const completedCount = steps.filter((s) => s.status === 'completed').length
  const pct = journey ? getCompletionPercent(journey) : 0
  const activeAlerts = journey
    ? journey.alerts.filter((a) => a.active).length
    : alertData.active
      ? 1
      : 0

  const statCards = [
    {
      label: 'My Phase',
      value: loading
        ? '...'
        : journey
          ? getPhaseLabel(journey.currentPhase)
          : 'N/A',
      icon: Route,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Progress',
      value: loading ? '...' : journey ? `${pct}%` : '0%',
      icon: BarChart3,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Steps Done',
      value: loading
        ? '...'
        : journey
          ? `${completedCount}/${journey.totalSteps}`
          : '—',
      icon: CheckCircle2,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Alerts',
      value: loading ? '...' : String(activeAlerts),
      icon: AlertTriangle,
      color: activeAlerts > 0 ? 'text-primary' : 'text-primary',
      bg: 'bg-primary/10',
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Alert Bar */}
      <motion.div variants={itemVariants}>
        <div
          className={cn(
            'relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300',
            alertData.active
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
              : 'bg-muted/50 text-muted-foreground border border-border'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {alertData.active ? (
              <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            )}
            <span className="text-sm font-medium truncate">
              {alertData.message}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Welcome Banner */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-border bg-card">
          <div className="relative h-40 md:h-48">
            <img
              src="/dashboard-banner.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F] via-[#0B0B0F]/80 to-[#0B0B0F]/30" />
            <div className="absolute inset-0 flex items-center px-6 md:px-8">
              <div className="max-w-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Welcome back,
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                  {auth.name}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  VSUAL NXL BYLDR Customer Portal — track your project journey,
                  view progress, and stay connected with your team.
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/60 tracking-wider uppercase">
                  {BRAND.fullName}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.label}
              className="group border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn('rounded-lg p-2', stat.bg)}>
                    <Icon className={cn('h-4 w-4', stat.color)} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Quick Phase Overview */}
      {!loading && journey && (
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Route className="h-4 w-4 text-primary" />
                Phase Overview
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Your project progress across 4 build phases
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PHASES.map((phase) => {
                  const { done, total } = getPhaseProgress(steps, phase.id)
                  const isActive = phase.id === journey.currentPhase
                  const isComplete = total > 0 && done === total

                  return (
                    <div
                      key={phase.id}
                      className={cn(
                        'rounded-xl border p-3 transition-all',
                        isComplete
                          ? 'border-primary/30 bg-primary/5'
                          : isActive
                            ? 'border-amber-400/40 bg-amber-400/5'
                            : 'border-border bg-muted/30'
                      )}
                    >
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        {phase.label}
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                        {phase.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {phase.desc}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={cn(
                              'h-full rounded-full',
                              isComplete
                                ? 'bg-primary'
                                : isActive
                                  ? 'bg-amber-400'
                                  : 'bg-muted-foreground/30'
                            )}
                            initial={{ width: 0 }}
                            animate={{
                              width:
                                total > 0 ? `${(done / total) * 100}%` : '0%',
                            }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {done}/{total}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!loading && !journey && (
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Route className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No journey found for your account.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Contact your VSUAL project manager to get started.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  My Journey Tab                                                   */
/* ═══════════════════════════════════════════════════════════════ */

function MyJourneyTab({ auth }: { auth: { name: string; email: string; role: string } }) {
  const [loading, setLoading] = useState(true)
  const [journey, setJourney] = useState<ClientJourney | null>(null)

  const fetchJourney = useCallback(async () => {
    try {
      const res = await apiFetch('/api/journey')
      if (res.ok) {
        const data = await res.json()
        const journeys: ClientJourney[] = Array.isArray(data) ? data : []
        const myJourney = journeys.find(
          (j) => j.customer.email?.toLowerCase() === auth.email?.toLowerCase()
        )
        if (myJourney) {
          setJourney(myJourney)
        }
      }
    } catch {
      toast.error('Failed to load journey data')
    } finally {
      setLoading(false)
    }
  }, [auth.email])

  useEffect(() => {
    fetchJourney()
  }, [fetchJourney])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading your journey...
        </span>
      </div>
    )
  }

  if (!journey) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Route className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-base font-medium text-foreground">
              No journey assigned yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please contact your project manager to get started.
            </p>
            <Button
              variant="outline"
              className="mt-4 border-border text-muted-foreground hover:text-primary hover:border-primary/30"
              onClick={() => {
                /* navigate to contact tab would require lifting state, so just show toast */
                toast.info('Go to the Contact Us tab to reach your project manager.')
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Project Manager
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const steps = journey.setupSteps
  const pct = getCompletionPercent(journey)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">My Journey</h2>
            <p className="text-sm text-muted-foreground">
              Track your 13-step NXL BYLDR setup progress
            </p>
          </div>
          <Badge
            className={cn(
              'text-sm font-bold px-3 py-1',
              pct === 100
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/10 text-primary'
            )}
          >
            {pct === 100 ? 'Complete' : `${pct}% Complete`}
          </Badge>
        </div>
      </motion.div>

      {/* Overall Progress Bar */}
      <motion.div variants={itemVariants}>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[11px] text-muted-foreground">
            {journey.completedSteps} of {journey.totalSteps} steps completed
          </span>
          <span className="text-[11px] text-muted-foreground">
            Currently: {getPhaseLabel(journey.currentPhase)}
          </span>
        </div>
      </motion.div>

      {/* 4 Phase Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {PHASES.map((phase) => {
          const { done, total } = getPhaseProgress(steps, phase.id)
          const isActive = phase.id === journey.currentPhase
          const isComplete = total > 0 && done === total
          const phasePct = total > 0 ? Math.round((done / total) * 100) : 0

          return (
            <Card
              key={phase.id}
              className={cn(
                'border-border bg-card transition-all',
                isComplete && 'border-primary/30',
                isActive && !isComplete && 'border-amber-400/40'
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[10px] px-2 py-0.5',
                      isComplete
                        ? 'bg-primary/10 text-primary'
                        : isActive
                          ? 'bg-amber-400/10 text-amber-400'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {phase.label}
                  </Badge>
                  {isComplete && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  {isActive && !isComplete && (
                    <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
                  )}
                </div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  {phase.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {phase.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        isComplete
                          ? 'bg-primary'
                          : isActive
                            ? 'bg-amber-400'
                            : 'bg-muted-foreground/30'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${phasePct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground shrink-0">
                    {done}/{total}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* 13 Steps List */}
      <motion.div variants={itemVariants}>
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              13-Step Setup Progress
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Status lights: Magenta = completed · Pulsing amber = in progress · Grey = pending
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1.5">
              {steps.map((step) => {
                const isCompleted = step.status === 'completed'
                const isInProgress = step.status === 'in_progress'
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.stepNumber * 0.03, duration: 0.25 }}
                    className={cn(
                      'flex items-center gap-3 rounded-lg p-3 transition-colors',
                      isCompleted ? 'bg-primary/5' : ''
                    )}
                  >
                    {/* Status Light */}
                    <div
                      className={cn(
                        'relative shrink-0 h-6 w-6 rounded-full flex items-center justify-center transition-all',
                        getStatusLightClass(step.status)
                      )}
                    >
                      {isCompleted && (
                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                      )}
                      {isInProgress && (
                        <Clock className="h-3 w-3 text-amber-950" />
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        Step {step.stepNumber}
                      </span>
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isCompleted ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {step.title}
                      </p>
                    </div>

                    {/* Status Label */}
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider shrink-0',
                        isCompleted
                          ? 'text-primary'
                          : isInProgress
                            ? 'text-amber-400'
                            : 'text-muted-foreground/50'
                      )}
                    >
                      {getStatusLabel(step.status)}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Contact Us Tab                                                   */
/* ═══════════════════════════════════════════════════════════════ */

function ContactUsTab({ auth, onSwitchToProfile }: { auth: { name: string; email: string; role: string }; onSwitchToProfile?: () => void }) {
  // Form state
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [sending, setSending] = useState(false)

  // Messages state
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/contact?customerEmail=${encodeURIComponent(auth.email)}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }, [auth.email])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Send message
  const handleSend = async () => {
    if (!subject || !message.trim()) {
      toast.error('Please fill in the subject and message.')
      return
    }

    setSending(true)
    try {
      const res = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: auth.name,
          customerEmail: auth.email,
          subject,
          message: message.trim(),
          priority,
        }),
      })

      if (res.ok) {
        toast.success('Message sent successfully! Sal & Geo will get back to you soon.')
        setSubject('')
        setMessage('')
        setPriority('normal')
        fetchMessages()
      } else {
        toast.error('Failed to send message. Please try again.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-foreground">Contact Us</h2>
        <p className="text-sm text-muted-foreground">
          Send a message to Sal & Geo — your VSUAL project managers
        </p>
      </motion.div>

      {/* Sal & Geo Team Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Your VSUAL Project Team
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Your messages go directly to both Sal & Geo — co-founders of VSUAL NXL BYLDR
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SAL_GEO_CONTACT.map((person) => (
                <a
                  key={person.email}
                  href={`mailto:${person.email}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-3 transition-all hover:border-primary/40 hover:bg-primary/5 group"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {person.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{person.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{person.email}</p>
                    <p className="text-[10px] text-primary font-medium">{person.role}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Form */}
      <motion.div variants={itemVariants}>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Send a Message
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Messages go directly to the master admin team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name & Email Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name" className="text-foreground text-sm">
                  Name
                </Label>
                <Input
                  id="contact-name"
                  value={auth.name}
                  disabled
                  className="border-border bg-muted/30 text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-foreground text-sm">
                  Email
                </Label>
                <Input
                  id="contact-email"
                  value={auth.email}
                  disabled
                  className="border-border bg-muted/30 text-muted-foreground"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="contact-subject" className="text-foreground text-sm">
                Subject
              </Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-full border-border">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {SUBJECT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Priority</Label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all',
                      priority === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    {opt.value === 'urgent' && (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                    {opt.value === 'medium' && (
                      <Zap className="h-3.5 w-3.5" />
                    )}
                    {opt.value === 'normal' && (
                      <MessageSquare className="h-3.5 w-3.5" />
                    )}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="contact-message" className="text-foreground text-sm">
                Message
              </Label>
              <Textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={5}
                className="border-border bg-background resize-none"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleSend}
              disabled={sending || !subject || !message.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* Recent Messages */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Your Recent Messages
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {messages.length} message{messages.length !== 1 ? 's' : ''} sent
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMessages}
            className="text-muted-foreground hover:text-primary"
          >
            <Zap className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        {loadingMessages ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading messages...
            </span>
          </div>
        ) : messages.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No messages yet.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Send your first message using the form above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.25 }}
              >
                <Card className="border-border bg-card transition-all hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-foreground">
                            {msg.subject}
                          </span>
                          {/* Priority badge */}
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] px-2 py-0.5',
                              msg.priority === 'urgent'
                                ? 'bg-primary/10 text-primary'
                                : msg.priority === 'medium'
                                  ? 'bg-amber-400/10 text-amber-400'
                                  : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {msg.priority}
                          </Badge>
                          {/* Status badge */}
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] px-2 py-0.5',
                              msg.status === 'unread'
                                ? 'bg-primary text-primary-foreground'
                                : msg.reply
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {msg.reply ? 'Replied' : 'Unread'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {msg.message}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatTimeAgo(msg.createdAt)}
                      </span>
                    </div>

                    {/* Reply */}
                    {msg.reply && (
                      <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-bold text-primary uppercase">
                            Reply from VSUAL
                          </span>
                          {msg.repliedAt && (
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {formatTimeAgo(msg.repliedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">
                          {msg.reply}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  My Profile Tab                                                  */
/* ═══════════════════════════════════════════════════════════════ */

interface CustomerProfile {
  id: string
  name: string
  email: string
  company?: string | null
  phone?: string | null
  status: string
  plan: string
  revenue: number
  notes?: string | null
  createdAt: string
  updatedAt: string
}

function MyProfileTab({ auth }: { auth: { name: string; email: string; role: string } }) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiFetch('/api/customers')
      if (res.ok) {
        const json = await res.json()
        const customers: CustomerProfile[] = Array.isArray(json) ? json : []
        const me = customers.find(
          (c) => c.email?.toLowerCase() === auth.email?.toLowerCase()
        )
        if (me) setProfile(me)
      }
    } catch {
      // Use auth data as fallback
    } finally {
      setLoading(false)
    }
  }, [auth.email])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading profile...</span>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-foreground">My Profile</h2>
        <p className="text-sm text-muted-foreground">
          View your account details and subscription information
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {getInitials(auth.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-foreground">{auth.name}</h3>
                <p className="text-sm text-muted-foreground">{auth.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
                  <Badge className="bg-primary/10 text-primary text-xs">
                    {profile?.plan?.toUpperCase() || 'FREE'} Plan
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-500">
                    {profile?.status || 'Active'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Details */}
      <motion.div variants={itemVariants}>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {profile?.name || auth.name}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {auth.email}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Company</Label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {profile?.company || 'Not set'}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {profile?.phone || 'Not set'}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Member Since</Label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Last Updated</Label>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                  {profile?.updatedAt ? formatDate(profile.updatedAt) : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* VSUAL Support Team */}
      <motion.div variants={itemVariants}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              VSUAL NXL BYLDR Support Team
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Need help? Reach out to your dedicated project managers
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SAL_GEO_CONTACT.map((person) => (
                <a
                  key={person.email}
                  href={`mailto:${person.email}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-3 transition-all hover:border-primary/40 hover:bg-primary/5 group"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {person.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{person.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{person.email}</p>
                    <p className="text-[10px] text-primary font-medium">{person.role}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
