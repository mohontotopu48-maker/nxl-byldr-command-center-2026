'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Bell,
  Palette,
  Shield,
  Trash2,
  Save,
  Camera,
  Moon,
  Sun,
  Loader2,
  Mail,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function SettingsView() {
  const getStoredAuth = (): { name: string; email: string; role: string } | null => {
    if (typeof window === 'undefined') return null
    try {
      const auth = localStorage.getItem('vsual_auth')
      if (auth) return JSON.parse(auth)
    } catch {}
    return null
  }

  const storedAuth = getStoredAuth()
  const [authInfo, setAuthInfo] = useState<{ name: string; email: string; role: string } | null>(
    storedAuth ? { name: storedAuth.name || '', email: storedAuth.email || '', role: storedAuth.role || 'member' } : null
  )

  const isMasterAdmin = authInfo?.role === 'master_admin' || MASTER_ADMIN_EMAILS.includes(authInfo?.email as typeof MASTER_ADMIN_EMAILS[number])

  const [profile, setProfile] = useState({
    name: authInfo?.name || 'User',
    email: authInfo?.email || '',
    bio: 'Product designer and team lead at VSUAL. Passionate about creating beautiful, functional interfaces.',
    location: 'San Francisco, CA',
    website: 'https://johndoe.design',
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    mentions: true,
    updates: false,
    marketing: false,
  })

  const [saving, setSaving] = useState(false)
  const { theme, setTheme } = useTheme()
  const resolvedTheme = theme || 'dark'

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem('vsual_profile', JSON.stringify(profile))
      toast.success('Profile saved successfully!')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    localStorage.removeItem('vsual_auth')
    window.location.reload()
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6 max-w-3xl"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </motion.div>

      {/* Account Information */}
      <motion.div variants={itemVariants}>
        <Card className="border-border bg-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">Account Information</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Your account details and role information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Email Address</Label>
              <Input
                value={authInfo?.email || ''}
                readOnly
                className="bg-muted border-border text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <Label className="text-sm text-foreground">Account Role</Label>
                <div className="flex items-center gap-2">
                  {isMasterAdmin ? (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-2.5 py-0.5 font-semibold">
                      Master Admin
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-2.5 py-0.5 font-semibold">
                      Member
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Separator className="bg-border" />
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Admin Notification Emails</p>
                  <ul className="mt-2 space-y-1">
                    {MASTER_ADMIN_EMAILS.map((email) => (
                      <li key={email} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-primary" />
                        {email}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Notification emails are sent to master admin addresses for all critical events.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-border bg-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">Profile</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                    JD
                  </AvatarFallback>
                </Avatar>
                <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Profile Photo</p>
                <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-foreground">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="bg-card border-border text-foreground focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="bg-card border-border text-foreground focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm text-foreground">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="bg-card border-border text-foreground focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm text-foreground">Website</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="bg-card border-border text-foreground focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm text-foreground">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
                className="bg-card border-border text-foreground focus-visible:ring-primary/30 resize-none"
              />
              <p className="text-xs text-muted-foreground">{profile.bio.length}/256 characters</p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={itemVariants}>
        <Card className="border-border bg-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">Notifications</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Choose what notifications you receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'email' as const, label: 'Email Notifications', desc: 'Receive updates via email' },
              { key: 'push' as const, label: 'Push Notifications', desc: 'Browser push notifications' },
              { key: 'mentions' as const, label: 'Mentions', desc: 'When someone mentions you' },
              { key: 'updates' as const, label: 'Product Updates', desc: 'New features and improvements' },
              { key: 'marketing' as const, label: 'Marketing Emails', desc: 'Tips, offers, and news' },
            ].map((item, i) => (
              <div key={item.key}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, [item.key]: checked })
                    }
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                {i < 4 && <Separator className="mt-4 bg-border" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={itemVariants}>
        <Card className="border-border bg-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">Appearance</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Customize the look and feel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Theme</p>
              <div className="grid grid-cols-2 gap-3 max-w-xs">
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                    resolvedTheme === 'dark'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-[#0B0B0F] border border-[#2A2A35] flex items-center justify-center">
                    <Moon className="h-4 w-4 text-[#8B8B9E]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground">Dark</span>
                    {theme === 'dark' && (
                      <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0">Active</Badge>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                    resolvedTheme === 'light'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <Sun className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground">Light</span>
                    {theme === 'light' && (
                      <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0">Active</Badge>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={itemVariants}>
        <Card className="border-destructive/20 bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              <CardTitle className="text-base font-semibold text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="shrink-0">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      This action cannot be undone. This will permanently delete your account
                      and remove all of your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-background border-border text-muted-foreground hover:text-foreground">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
