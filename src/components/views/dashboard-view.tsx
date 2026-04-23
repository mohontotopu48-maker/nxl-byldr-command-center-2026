'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FolderKanban,
  ListTodo,
  Users,
  TrendingUp,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Plus,
  UserPlus,
  FileBarChart,
  Save,
  PenLine,
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

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                             */
/* ═══════════════════════════════════════════════════════════════ */

interface AlertData {
  active: boolean
  message: string
}

interface SetupStep {
  id: string
  stepNumber: number
  title: string
  description: string | null
  phase: string
  status: 'completed' | 'in_progress' | 'pending'
  completedAt: string | null
}

interface DashboardStats {
  totalProjects: number
  activeTasks: number
  teamMembers: number
  totalCustomers: number
  completionRate: number
}

const defaultStats: DashboardStats = {
  totalProjects: 0,
  activeTasks: 0,
  teamMembers: 0,
  totalCustomers: 0,
  completionRate: 0,
}

const recentActivity = [
  { id: 1, user: 'Sarah Chen', initials: 'SC', action: 'completed task', target: 'Homepage Redesign', time: '2 min ago', icon: CheckCircle2, color: 'text-primary' },
  { id: 2, user: 'Alex Rivera', initials: 'AR', action: 'completed task', target: 'API Integration', time: '15 min ago', icon: CheckCircle2, color: 'text-primary' },
  { id: 3, user: 'Jordan Lee', initials: 'JL', action: 'started', target: 'feature/auth-flow', time: '1 hour ago', icon: Clock, color: 'text-amber-400' },
  { id: 4, user: 'Morgan Kim', initials: 'MK', action: 'completed task', target: 'Database Schema Update', time: '2 hours ago', icon: CheckCircle2, color: 'text-primary' },
  { id: 5, user: 'Taylor Brooks', initials: 'TB', action: 'completed task', target: 'Performance Optimization', time: '4 hours ago', icon: CheckCircle2, color: 'text-primary' },
]

const quickActions = [
  { label: 'New Project', icon: Plus, description: 'Start a new project' },
  { label: 'Add Member', icon: UserPlus, description: 'Invite team members' },
  { label: 'View Reports', icon: FileBarChart, description: 'Check analytics' },
]

const phases = [
  { id: 'handover', label: 'Phase 1', title: 'The Handover', desc: 'Gathering your business info' },
  { id: 'game_plan', label: 'Phase 2', title: 'The Game Plan', desc: 'Planning your lead strategy' },
  { id: 'technical', label: 'Phase 3', title: 'Technical Foundation', desc: 'Building your ads and CRM sync' },
  { id: 'live', label: 'Phase 4', title: 'Live & Running', desc: 'Getting you on job sites' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Component                                                        */
/* ═══════════════════════════════════════════════════════════════ */

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('User')
  const [alertData, setAlertData] = useState<AlertData>({ active: false, message: 'All Systems Go — Machine is on Schedule.' })
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([])
  const [stepsLoading, setStepsLoading] = useState(true)

  // Edit alert dialog
  const [alertEditOpen, setAlertEditOpen] = useState(false)
  const [alertEditActive, setAlertEditActive] = useState(false)
  const [alertEditMessage, setAlertEditMessage] = useState('')
  const [alertSaving, setAlertSaving] = useState(false)

  useEffect(() => {
    try { const a = localStorage.getItem('vsual_auth'); if (a) { const p = JSON.parse(a); setUserName(p.name || 'User') } } catch {}
  }, [])

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard')
        if (res.ok) {
          const data = await res.json()
          setStats({
            totalProjects: data.totalProjects ?? 0,
            activeTasks: data.activeTasks ?? 0,
            teamMembers: data.teamMembers ?? 0,
            totalCustomers: data.totalCustomers ?? 0,
            completionRate: data.completionRate ?? 0,
          })
        }
      } catch {} finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  // Fetch alert bar
  useEffect(() => {
    fetch('/api/alert-bar').then(r => r.json()).then(data => setAlertData(data)).catch(() => {})
  }, [])

  // Fetch setup steps
  useEffect(() => {
    fetch('/api/setup-steps')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSetupSteps(data) })
      .catch(() => {})
      .finally(() => setStepsLoading(false))
  }, [])

  const handleSaveAlert = async () => {
    setAlertSaving(true)
    try {
      const res = await fetch('/api/alert-bar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: alertEditActive, message: alertEditMessage }),
      })
      if (res.ok) {
        const data = await res.json()
        setAlertData(data)
        setAlertEditOpen(false)
        toast.success('Alert updated!')
      }
    } catch { toast.error('Failed to update alert') }
    finally { setAlertSaving(false) }
  }

  const handleStepToggle = async (step: SetupStep) => {
    const nextStatus = step.status === 'completed' ? 'pending' : step.status === 'in_progress' ? 'completed' : 'in_progress'
    try {
      const res = await fetch('/api/setup-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: step.id, status: nextStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSetupSteps(prev => prev.map(s => s.id === updated.id ? updated : s))
      }
    } catch { toast.error('Failed to update step') }
  }

  const completedCount = setupSteps.filter(s => s.status === 'completed').length
  const inProgressCount = setupSteps.filter(s => s.status === 'in_progress').length

  const statCards = [
    { label: 'Total Projects', value: String(stats.totalProjects), change: '+3 this month', icon: FolderKanban, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active Tasks', value: String(stats.activeTasks), change: '+18 this week', icon: ListTodo, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Team Members', value: String(stats.teamMembers), change: '+2 joined', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Customers', value: String(stats.totalCustomers), change: '+5 this month', icon: UserCheck, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Completion Rate', value: `${stats.completionRate}%`, change: '+5% from last', icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  ]

  const storedAuth = typeof window !== 'undefined' ? (() => { try { const a = localStorage.getItem('vsual_auth'); if (a) return JSON.parse(a); } catch {} return null })() : null
  const isAdmin = storedAuth?.role === 'master_admin' || ['info.vsualdm@gmail.com', 'geovsualdm@gmail.com'].includes(storedAuth?.email || '')

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 p-4 md:p-6">

      {/* ═══ ACTION REQUIRED TOP BAR ═══ */}
      <motion.div variants={itemVariants}>
        <div
          className={`relative flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
            alertData.active
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
              : 'bg-muted/50 text-muted-foreground border border-border'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {alertData.active ? (
              <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
            )}
            <span className="text-sm font-medium truncate">{alertData.message}</span>
          </div>
          {isAdmin && (
            <Button
              variant={alertData.active ? 'ghost' : 'outline'}
              size="sm"
              onClick={() => { setAlertEditActive(alertData.active); setAlertEditMessage(alertData.message); setAlertEditOpen(true) }}
              className={`shrink-0 h-7 text-xs ${alertData.active ? 'text-primary-foreground hover:bg-primary-foreground/20' : 'border-border text-muted-foreground'}`}
            >
              <PenLine className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </motion.div>

      {/* ═══ WELCOME BANNER ═══ */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-border bg-card">
          <div className="relative h-36 md:h-44">
            <img src="https://i.ibb.co.com/qYGkWhTC/vsualdm-left-top-icon-bk-nw-ht.jpg" alt="Welcome Banner" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-transparent" />
            <div className="absolute inset-0 flex items-center px-6 md:px-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                  Welcome back, <span className="text-primary">{userName}</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">Your central hub for tracking project status and lead activity.</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ═══ STATS CARDS ═══ */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="group border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-2 ${stat.bg}`}><Icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} /></div>
                  <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 hidden sm:flex">
                    <TrendingUp className="h-2.5 w-2.5" />{stat.change}
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">{loading ? '...' : stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ═══ SETUP PROGRESS (13 Steps) ═══ */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    Setup Progress
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    {completedCount} of 13 steps completed
                    {inProgressCount > 0 && <span className="text-amber-400 ml-1">· {inProgressCount} in progress</span>}
                  </CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary text-xs font-semibold">
                  {setupSteps.length > 0 ? Math.round((completedCount / 13) * 100) : 0}%
                </Badge>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${setupSteps.length > 0 ? (completedCount / 13) * 100 : 0}%` }} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {setupSteps.length === 0 && !stepsLoading && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No setup steps configured yet.</p>
                )}
                {setupSteps.map((step) => {
                  const phaseInfo = phases.find(p => p.id === step.phase)
                  const isCompleted = step.status === 'completed'
                  const isInProgress = step.status === 'in_progress'

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-3 rounded-lg p-3 transition-colors group ${isCompleted ? 'bg-primary/5' : ''}`}
                    >
                      {/* Status Light */}
                      <button
                        onClick={() => isAdmin && handleStepToggle(step)}
                        className={`relative shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-primary shadow-md shadow-primary/30'
                            : isInProgress
                            ? 'bg-amber-400 shadow-md shadow-amber-400/30 animate-pulse'
                            : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'
                        }`}
                        title={isAdmin ? 'Click to cycle: pending → in_progress → completed' : ''}
                      >
                        {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                        {isInProgress && <Clock className="h-3.5 w-3.5 text-amber-950" />}
                      </button>

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

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="space-y-6">
          {/* 4 Phases */}
          <motion.div variants={itemVariants}>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground">4 Phases</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Your build roadmap</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {phases.map((phase, i) => {
                    const phaseSteps = setupSteps.filter(s => s.phase === phase.id)
                    const done = phaseSteps.filter(s => s.status === 'completed').length
                    const total = phaseSteps.length
                    const allDone = total > 0 && done === total

                    return (
                      <div key={phase.id} className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          allDone ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${allDone ? 'text-primary' : 'text-foreground'}`}>{phase.title}</p>
                          <p className="text-[11px] text-muted-foreground">{phase.desc}</p>
                          {total > 0 && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="h-1 flex-1 max-w-[100px] rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${(done / total) * 100}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{done}/{total}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <Card className="border-border bg-card">
              <CardContent className="p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                    View All<ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {recentActivity.slice(0, 4).map((activity, index) => {
                    const Icon = activity.icon
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="bg-secondary text-[10px] font-medium text-muted-foreground">{activity.initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-foreground">
                            <span className="font-medium">{activity.user}</span>{' '}
                            <span className="text-muted-foreground">{activity.action}</span>{' '}
                            <span className="font-medium">{activity.target}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">{activity.time}</p>
                        </div>
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${activity.color}`} />
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="border-border bg-card">
              <CardContent className="p-4 md:p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h3>
                <div className="space-y-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <button key={action.label} className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/30 hover:bg-accent group">
                        <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors"><Icon className="h-4 w-4 text-primary" /></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ═══ EDIT ALERT DIALOG ═══ */}
      <Dialog open={alertEditOpen} onOpenChange={setAlertEditOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Alert Bar</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update the top alert bar message for all users.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAlertEditActive(false)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${!alertEditActive ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
              >
                <CheckCircle2 className="h-4 w-4" />
                All Clear
              </button>
              <button
                onClick={() => setAlertEditActive(true)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${alertEditActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}
              >
                <AlertTriangle className="h-4 w-4" />
                Action Required
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-foreground font-medium">Alert Message</label>
              <input
                type="text"
                value={alertEditMessage}
                onChange={(e) => setAlertEditMessage(e.target.value)}
                placeholder={alertEditActive ? 'ACTION REQUIRED: e.g., We need your OTP code for Facebook' : 'All Systems Go — Machine is on Schedule.'}
                className="h-11 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAlertEditOpen(false)} className="flex-1 border-border">Cancel</Button>
              <Button onClick={handleSaveAlert} disabled={alertSaving} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                {alertSaving ? <><Save className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Update Alert</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ HOW TO USE DIALOG ═══ */}
      <HowToUseDialog />
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  How To Use Dialog (shared)                                      */
/* ═══════════════════════════════════════════════════════════════ */

function HowToUseDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.div variants={itemVariants} className="flex justify-center">
        <Button variant="ghost" onClick={() => setOpen(true)}
          className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5 border border-border/50 text-sm">
          <Info className="h-3.5 w-3.5" />
          How to use this Command Center
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg">How to use your VSUAL Business OS</DialogTitle>
            <DialogDescription className="text-muted-foreground">Your central hub — get the status of your build in 5 seconds.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Status Lights — Setup Progress</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary shrink-0" />
                  <span><strong className="text-primary">Magenta</strong> — We&apos;ve finished that part of the build.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span><strong className="text-amber-400">Pulsing</strong> — We&apos;re currently working on this step.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span><strong className="text-muted-foreground">Grey</strong> — We haven&apos;t reached that stage yet.</span>
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Action Bar</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Check the bar at the top of your dashboard. If it&apos;s <strong className="text-primary">Magenta</strong>, we need a quick &quot;OK&quot; or a code from you.
                If it&apos;s clear and says <strong className="text-foreground">&quot;All Systems Go,&quot;</strong> you&apos;re all set.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Your Role</h4>
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
