'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Mail,
  MoreHorizontal,
  Search,
  Filter,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type MemberRole = 'admin' | 'manager' | 'member' | 'master_admin'
type MemberStatus = 'active' | 'inactive'

interface TeamMember {
  id: string
  name: string
  email: string
  role: MemberRole
  avatar: string | null
  status: MemberStatus
  createdAt: string
  _count?: { tasks: number }
}

const roleLabels: Record<MemberRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
  master_admin: 'Master Admin',
}

const roleStyles: Record<MemberRole, string> = {
  admin: 'bg-destructive/15 text-destructive',
  manager: 'bg-amber-400/15 text-amber-400',
  member: 'bg-primary/15 text-primary',
  master_admin: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
}

const statusColors: Record<MemberStatus, string> = {
  active: 'bg-primary',
  inactive: 'bg-muted-foreground/40',
}

const statusDotTitle: Record<MemberStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

const statusStyles: Record<MemberStatus, string> = {
  active: 'bg-primary/15 text-primary',
  inactive: 'bg-muted text-muted-foreground',
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function TeamView() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<string>('member')

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/team')
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch {
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleAddMember = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Name and email are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          role: formRole,
        }),
      })

      if (res.ok) {
        toast.success('Team member added!')
        setDialogOpen(false)
        resetForm()
        fetchMembers()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to add team member')
      }
    } catch {
      toast.error('Failed to add team member')
    } finally {
      setSubmitting(false)
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const confirmDeleteMember = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/team/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success(`${deleteTarget.name} removed`)
        fetchMembers()
      } else {
        toast.error('Failed to remove member')
      }
    } catch {
      toast.error('Failed to remove member')
    } finally {
      setDeleteTarget(null)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormRole('member')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const avatarColors = [
    'bg-primary/20', 'bg-rose-400/20', 'bg-purple-400/20',
    'bg-amber-400/20', 'bg-teal-400/20', 'bg-cyan-400/20',
    'bg-pink-400/20', 'bg-orange-400/20',
  ]

  const getColor = (id: string) => {
    const index = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % avatarColors.length
    return avatarColors[index]
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    } catch {
      return '—'
    }
  }

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading team...
        </div>
      </div>
    )
  }

  return (
    <>
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 md:p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} members · {members.filter(m => m.status === 'active').length} active
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 w-fit">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Team Member</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new member to your team. No verification needed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="member-name" className="text-foreground">Name *</Label>
                <Input
                  id="member-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Full name"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-email" className="text-foreground">Email *</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Role</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger className="bg-background border-border text-foreground focus:ring-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="admin" className="text-foreground focus:bg-accent">Admin</SelectItem>
                    <SelectItem value="manager" className="text-foreground focus:bg-accent">Manager</SelectItem>
                    <SelectItem value="member" className="text-foreground focus:bg-accent">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? 'Adding...' : 'Add Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search & Filter */}
      <motion.div variants={itemVariants} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-card border-border pl-9 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
          />
        </div>
        <Button variant="outline" size="sm" className="bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent w-fit">
          <Filter className="mr-2 h-3.5 w-3.5" />
          Filter
        </Button>
      </motion.div>

      {/* Desktop Table */}
      <motion.div variants={itemVariants} className="hidden md:block">
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Member</TableHead>
                <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Tasks</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Joined</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className="border-border transition-colors duration-150 hover:bg-accent group cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`${getColor(member.id)} text-sm font-semibold text-foreground`}>
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${statusColors[member.status]}`}
                          title={statusDotTitle[member.status]}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[11px] px-2 py-0.5 font-medium ${roleStyles[member.role]}`}>
                      {roleLabels[member.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${statusColors[member.status]}`} />
                      <span className="text-sm text-muted-foreground capitalize">{member.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-medium text-foreground">{member._count?.tasks ?? 0}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm text-muted-foreground">{formatDate(member.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem className="text-foreground focus:bg-accent cursor-pointer">View Profile</DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground focus:bg-accent cursor-pointer">Edit Role</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                          onClick={() => setDeleteTarget({ id: member.id, name: member.name })}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No team members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredMembers.map((member) => (
          <motion.div key={member.id} variants={itemVariants}>
            <Card className="border-border bg-card transition-all duration-200 hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${getColor(member.id)} text-sm font-semibold text-foreground`}>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${statusColors[member.status]}`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-[10px] px-2 py-0.5 font-medium ${roleStyles[member.role]}`}>
                    {roleLabels[member.role]}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusColors[member.status]}`} />
                    {member.status} · {member._count?.tasks ?? 0} tasks
                  </span>
                  <span>Joined {formatDate(member.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No team members found</div>
        )}
      </div>
    </motion.div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to remove &quot;{deleteTarget?.name}&quot; from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-border text-muted-foreground hover:text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMember} className="bg-destructive text-white hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
