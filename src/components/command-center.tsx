'use client'

import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SidebarNav, type NavView } from '@/components/sidebar-nav'
import { HeaderBar } from '@/components/header-bar'
import { DashboardView, ClientJourneyView } from '@/components/views/dashboard-view'
import { ProjectsView } from '@/components/views/projects-view'
import { TeamView } from '@/components/views/team-view'
import { CustomersView } from '@/components/views/customers-view'
import { AnalyticsView } from '@/components/views/analytics-view'
import { SettingsView } from '@/components/views/settings-view'
import { MastersPlanZone } from '@/components/views/masters-plan-zone'
import { AiChat } from '@/components/ai-chat'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'

const viewComponents: Record<NavView, React.ComponentType> = {
  dashboard: DashboardView,
  projects: ProjectsView,
  team: TeamView,
  customers: CustomersView,
  'client-journey': ClientJourneyView,
  analytics: AnalyticsView,
  'masters-plan': MastersPlanZone,
  settings: SettingsView,
}

const pageVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
}

interface CommandCenterProps {
  onLogout?: () => void
}

export function CommandCenter({ onLogout }: CommandCenterProps) {
  const [activeView, setActiveView] = useState<NavView>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const getStoredAuth = (): { name: string; email: string; role: string } | null => {
    if (typeof window === 'undefined') return null
    try {
      const auth = localStorage.getItem('vsual_auth')
      if (auth) return JSON.parse(auth)
    } catch {}
    return null
  }

  const storedAuth = getStoredAuth()
  const [userRole, setUserRole] = useState<string | null>(storedAuth?.role || null)

  const isAdmin = userRole === 'master_admin' || MASTER_ADMIN_EMAILS.includes(storedAuth?.email?.toLowerCase() as typeof MASTER_ADMIN_EMAILS[number])

  const ActiveComponent = viewComponents[activeView]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <SidebarNav
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <HeaderBar activeView={activeView} onLogout={onLogout} isAdmin={isAdmin} />

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="min-h-full"
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </div>

      {/* AI Chat Widget */}
      <AiChat />
    </div>
  )
}
