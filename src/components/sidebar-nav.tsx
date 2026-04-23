'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCheck,
  Route,
  BarChart3,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'

export type NavView = 'dashboard' | 'projects' | 'team' | 'customers' | 'client-journey' | 'messages' | 'analytics' | 'settings' | 'masters-plan'

interface SidebarNavProps {
  activeView: NavView
  onViewChange: (view: NavView) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

const navItems: { id: NavView; label: string; icon: React.ElementType; special?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'customers', label: 'Customers', icon: UserCheck },
  { id: 'client-journey', label: 'Client Journey', icon: Route },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'masters-plan', label: 'Masters Plan Zone', icon: Zap, special: true },
  { id: 'settings', label: 'Settings', icon: Settings },
]

function SidebarContent({
  activeView,
  onViewChange,
  collapsed,
  onToggleCollapse,
}: SidebarNavProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <img
            src="https://i.ibb.co.com/mV5xXLnB/VSUAL.png"
            alt="VSUAL"
            className="h-6 w-6 object-contain"
          />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="overflow-hidden"
          >
            <h1 className="text-sm font-bold tracking-wide text-foreground">
              VSUAL
            </h1>
            <p className="text-[11px] font-semibold text-primary tracking-wider uppercase">NXL BYLDR</p>
          </motion.div>
        )}
      </div>

      <Separator className="bg-border" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <TooltipProvider delayDuration={0}>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id
              const Icon = item.icon

              if (collapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <li>
                        <button
                          onClick={() => onViewChange(item.id)}
                          className={cn(
                            'flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                              : item.special
                                ? 'text-primary hover:bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </button>
                      </li>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onViewChange(item.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : item.special
                          ? 'text-primary hover:bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/60"
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </TooltipProvider>
      </nav>

      {/* Collapse Toggle */}
      <div className="hidden px-3 pb-2 md:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>

      <Separator className="bg-border" />

      {/* Footer */}
      <div className="flex items-center gap-3 px-4 py-4">
        <img
          src="https://i.ibb.co.com/2R1C5xG/image.png"
          alt="CA Logo"
          className="h-7 w-7 shrink-0 object-contain rounded"
        />
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[10px] font-bold tracking-wider text-primary/70 uppercase">
              Command Center
            </p>
            <p className="text-[11px] font-semibold text-foreground">
              Powered by <span className="text-primary font-bold">VSUAL</span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export function SidebarNav({
  activeView,
  onViewChange,
  collapsed = false,
  onToggleCollapse,
  className,
}: SidebarNavProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'hidden md:flex h-screen flex-col border-r border-border bg-sidebar shrink-0 overflow-hidden',
          className
        )}
      >
        <SidebarContent
          activeView={activeView}
          onViewChange={onViewChange}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-3 left-3 z-50 bg-card/80 backdrop-blur-sm border border-border"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] p-0 bg-sidebar border-border">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent
            activeView={activeView}
            onViewChange={onViewChange}
            collapsed={false}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
