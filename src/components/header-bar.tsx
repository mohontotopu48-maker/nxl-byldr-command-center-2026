'use client'

import { useState } from 'react'
import { Search, Bell, Moon, Sun } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import type { NavView } from '@/components/sidebar-nav'

interface HeaderBarProps {
  activeView: NavView
  onLogout?: () => void
  isAdmin?: boolean
}

const viewTitles: Record<NavView, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  team: 'Team',
  customers: 'Customers',
  'client-journey': 'Client Journey',
  analytics: 'Analytics',
  settings: 'Settings',
  'masters-plan': 'Masters Plan Zone',
}

export function HeaderBar({ activeView, onLogout, isAdmin }: HeaderBarProps) {
  const { theme, setTheme } = useTheme()

  const getStoredUser = () => {
    if (typeof window === 'undefined') return { name: 'User', email: '' }
    try {
      const auth = localStorage.getItem('vsual_auth')
      if (auth) {
        const p = JSON.parse(auth)
        return { name: p.name || 'User', email: p.email || '' }
      }
    } catch {}
    return { name: 'User', email: '' }
  }

  const storedUser = getStoredUser()
  const [userName, setUserName] = useState(storedUser.name)
  const [userEmail, setUserEmail] = useState(storedUser.email)

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      {/* Mobile padding for hamburger */}
      <div className="w-10 md:hidden" />

      {/* Title */}
      <div className="hidden md:block">
        <h2 className="text-lg font-semibold text-foreground">
          {viewTitles[activeView]}
        </h2>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search anything..."
          className="h-9 bg-card border-border pl-9 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-25" />
                <Badge className="relative h-4 w-4 items-center justify-center rounded-full p-0 text-[10px] font-bold bg-primary text-primary-foreground border-0">
                  3
                </Badge>
              </span>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-card border-border">
            <DropdownMenuLabel className="text-foreground">
              Notifications
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 text-foreground focus:bg-accent">
              <span className="text-sm font-medium">New project assigned</span>
              <span className="text-xs text-muted-foreground">2 minutes ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 text-foreground focus:bg-accent">
              <span className="text-sm font-medium">Team member joined</span>
              <span className="text-xs text-muted-foreground">1 hour ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 text-foreground focus:bg-accent">
              <span className="text-sm font-medium">Task completed</span>
              <span className="text-xs text-muted-foreground">3 hours ago</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 gap-2 rounded-full pl-1 pr-3 hover:bg-accent"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-foreground lg:inline">
                {userName}
              </span>
              {isAdmin && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0 hidden lg:inline-flex">
                  MASTER ADMIN
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuLabel className="text-foreground">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span>{userName}</span>
                  {isAdmin && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                      MASTER ADMIN
                    </Badge>
                  )}
                </div>
                {userEmail && (
                  <span className="text-xs text-muted-foreground font-normal">{userEmail}</span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-foreground focus:bg-accent cursor-pointer">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground focus:bg-accent cursor-pointer">
              Preferences
            </DropdownMenuItem>
            <DropdownMenuItem className="text-foreground focus:bg-accent cursor-pointer">
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              onClick={() => {
                localStorage.removeItem('vsual_auth')
                onLogout?.()
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
