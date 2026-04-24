'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Eye,
  ArrowUpRight,
  Users,
  FolderKanban,
  UserCheck,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const revenueData = [
  { month: 'Jan', revenue: 4200, users: 1200 },
  { month: 'Feb', revenue: 5800, users: 1400 },
  { month: 'Mar', revenue: 5200, users: 1350 },
  { month: 'Apr', revenue: 7800, users: 1800 },
  { month: 'May', revenue: 6900, users: 1650 },
  { month: 'Jun', revenue: 9200, users: 2100 },
  { month: 'Jul', revenue: 8100, users: 1950 },
  { month: 'Aug', revenue: 10500, users: 2400 },
  { month: 'Sep', revenue: 9800, users: 2200 },
  { month: 'Oct', revenue: 11200, users: 2600 },
  { month: 'Nov', revenue: 12400, users: 2800 },
  { month: 'Dec', revenue: 13800, users: 3100 },
]

const activityBreakdown = [
  { name: 'Mon', tasks: 24, meetings: 8, reviews: 12 },
  { name: 'Tue', tasks: 32, meetings: 5, reviews: 18 },
  { name: 'Wed', tasks: 28, meetings: 12, reviews: 8 },
  { name: 'Thu', tasks: 36, meetings: 6, reviews: 22 },
  { name: 'Fri', tasks: 20, meetings: 10, reviews: 14 },
  { name: 'Sat', tasks: 8, meetings: 2, reviews: 4 },
  { name: 'Sun', tasks: 5, meetings: 1, reviews: 2 },
]

interface DashboardData {
  totalProjects: number
  activeTasks: number
  teamMembers: number
  totalCustomers: number
  completionRate: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: string | number; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-xl">
        <p className="text-xs font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function AnalyticsView() {
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setDashData({
            totalProjects: data.totalProjects ?? 0,
            activeTasks: data.activeTasks ?? 0,
            teamMembers: data.teamMembers ?? 0,
            totalCustomers: data.totalCustomers ?? 0,
            completionRate: data.completionRate ?? 0,
          })
        }
      })
      .catch(() => { setError('Failed to load data') })
      .finally(() => setLoading(false))
  }, [])

  const metrics = [
    {
      label: 'Total Projects',
      value: loading ? '...' : String(dashData?.totalProjects ?? 0),
      change: '+3 this month',
      trend: 'up' as const,
      icon: FolderKanban,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Active Tasks',
      value: loading ? '...' : String(dashData?.activeTasks ?? 0),
      change: '+18 this week',
      trend: 'up' as const,
      icon: Activity,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Team Members',
      value: loading ? '...' : String(dashData?.teamMembers ?? 0),
      change: '+2 joined',
      trend: 'up' as const,
      icon: Users,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
    },
    {
      label: 'Customers',
      value: loading ? '...' : String(dashData?.totalCustomers ?? 0),
      change: '+5 this month',
      trend: 'up' as const,
      icon: UserCheck,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: 'Completion Rate',
      value: loading ? '...' : `${dashData?.completionRate ?? 0}%`,
      change: '+5% from last',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Total Revenue',
      value: '$124,563',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Page Views',
      value: '847.2K',
      change: '+8.2%',
      trend: 'up' as const,
      icon: Eye,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Growth Rate',
      value: '24.3%',
      change: '+3.1%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Track your performance and growth metrics</p>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div variants={itemVariants}>
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        </motion.div>
      )}

      {/* Metrics Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        {metrics.slice(0, 4).map((metric) => {
          const Icon = metric.icon
          return (
            <Card
              key={metric.label}
              className="group border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-2 ${metric.bg}`}>
                    <Icon className={`h-4 w-4 md:h-5 md:w-5 ${metric.color}`} />
                  </div>
                  <Badge
                    variant="secondary"
                    className={`gap-1 text-[10px] px-1.5 py-0.5 ${
                      metric.trend === 'up'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-amber-400/10 text-amber-400'
                    }`}
                  >
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {metric.change}
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Revenue Overview
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue & user growth</p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +12.5%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF0099" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF0099" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF0099" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF0099" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: '#8B8B9E', fontSize: 11 }}
                      axisLine={{ stroke: '#2A2A35' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#8B8B9E', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#FF0099"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                      name="Revenue ($)"
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#FF0099"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#usersGradient)"
                      name="Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Breakdown */}
        <motion.div variants={itemVariants}>
          <Card className="border-border bg-card h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Activity Breakdown
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Weekly tasks, meetings & reviews</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                  <ArrowUpRight className="mr-1 h-3 w-3" />
                  Details
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityBreakdown} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#8B8B9E', fontSize: 11 }}
                      axisLine={{ stroke: '#2A2A35' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#8B8B9E', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="tasks" fill="#FF0099" radius={[4, 4, 0, 0]} name="Tasks" />
                    <Bar dataKey="meetings" fill="#FF0099" radius={[4, 4, 0, 0]} name="Meetings" />
                    <Bar dataKey="reviews" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional metrics row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 lg:grid-cols-4 mt-6">
        {metrics.slice(4).map((metric) => {
          const Icon = metric.icon
          return (
            <Card
              key={metric.label}
              className="group border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-2 ${metric.bg}`}>
                    <Icon className={`h-4 w-4 md:h-5 md:w-5 ${metric.color}`} />
                  </div>
                  <Badge
                    variant="secondary"
                    className={`gap-1 text-[10px] px-1.5 py-0.5 ${
                      metric.trend === 'up'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-amber-400/10 text-amber-400'
                    }`}
                  >
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {metric.change}
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
