'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  MoreHorizontal,
  Calendar,
  ArrowUpRight,
  Loader2,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'
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
  DropdownMenuSeparator,
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

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ApiProject {
  id: string
  name: string
  description: string | null
  status: string // 'active' | 'paused' | 'completed' | 'archived'
  priority: string // 'low' | 'medium' | 'high' | 'critical'
  progress: number
  createdAt: string
  updatedAt: string
  _count: { tasks: number }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Capitalize first letter: 'active' → 'Active' */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/* -------------------------------------------------------------------------- */
/*  Style maps                                                                */
/* -------------------------------------------------------------------------- */

type StatusKey = 'Active' | 'Paused' | 'Completed' | 'Archived'
type PriorityKey = 'High' | 'Medium' | 'Low' | 'Critical'

const statusStyles: Record<StatusKey, string> = {
  Active: 'bg-primary/15 text-primary border-primary/20',
  Paused: 'bg-amber-400/15 text-amber-400 border-amber-400/20',
  Completed: 'bg-primary/15 text-primary border-primary/20',
  Archived: 'bg-muted text-muted-foreground border-border',
}

const priorityStyles: Record<PriorityKey, string> = {
  High: 'bg-destructive/15 text-destructive',
  Medium: 'bg-amber-400/15 text-amber-400',
  Low: 'bg-muted text-muted-foreground',
  Critical: 'bg-destructive/25 text-destructive',
}

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                        */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function ProjectsView() {
  /* --- state ------------------------------------------------------------- */
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formStatus, setFormStatus] = useState<string>('active')
  const [formPriority, setFormPriority] = useState<string>('medium')

  /* --- fetch projects ---------------------------------------------------- */
  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiFetch('/api/projects')
      if (res.ok) {
        const json = await res.json()
        const data: ApiProject[] = json.data || json
        setProjects(data)
      } else {
        toast.error('Failed to load projects')
      }
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  /* --- create project ---------------------------------------------------- */
  const handleNewProject = async () => {
    if (!formName.trim()) {
      toast.error('Project name is required')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          status: formStatus,
          priority: formPriority,
        }),
      })

      if (res.ok) {
        toast.success('Project created successfully!')
        setDialogOpen(false)
        setFormName('')
        setFormDesc('')
        setFormStatus('active')
        setFormPriority('medium')
        fetchProjects()
      } else {
        toast.error('Failed to create project')
      }
    } catch {
      toast.error('Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  /* --- delete project ---------------------------------------------------- */
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const confirmDeleteProject = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/api/projects/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`"${deleteTarget.name}" deleted`)
        fetchProjects()
      } else {
        toast.error('Failed to delete project')
      }
    } catch {
      toast.error('Failed to delete project')
    } finally {
      setDeleteTarget(null)
    }
  }

  /* --- render ------------------------------------------------------------ */
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
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage and track your team&apos;s projects</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) { setFormName(''); setFormDesc(''); setFormStatus('active'); setFormPriority('medium') }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 w-fit">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">New Project</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a new project for your team
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="proj-name" className="text-foreground">Name *</Label>
                <Input
                  id="proj-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Project name"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-desc" className="text-foreground">Description</Label>
                <Textarea
                  id="proj-desc"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="bg-background border-border text-foreground focus:ring-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="active" className="text-foreground focus:bg-accent">Active</SelectItem>
                      <SelectItem value="paused" className="text-foreground focus:bg-accent">Paused</SelectItem>
                      <SelectItem value="completed" className="text-foreground focus:bg-accent">Completed</SelectItem>
                      <SelectItem value="archived" className="text-foreground focus:bg-accent">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Priority</Label>
                  <Select value={formPriority} onValueChange={setFormPriority}>
                    <SelectTrigger className="bg-background border-border text-foreground focus:ring-primary/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="low" className="text-foreground focus:bg-accent">Low</SelectItem>
                      <SelectItem value="medium" className="text-foreground focus:bg-accent">Medium</SelectItem>
                      <SelectItem value="high" className="text-foreground focus:bg-accent">High</SelectItem>
                      <SelectItem value="critical" className="text-foreground focus:bg-accent">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                onClick={handleNewProject}
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-center py-20"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-foreground">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first project to get started</p>
        </motion.div>
      )}

      {/* Project Grid */}
      {!loading && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const displayStatus = capitalize(project.status) as StatusKey
            const displayPriority = capitalize(project.priority) as PriorityKey
            const totalTasks = project._count.tasks

            return (
              <motion.div key={project.id} variants={itemVariants}>
                <Card className="group h-full border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base font-semibold text-foreground truncate">
                          {project.name}
                        </CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-accent"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem className="text-foreground focus:bg-accent cursor-pointer">
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-foreground focus:bg-accent cursor-pointer">
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                            onClick={() => setDeleteTarget({ id: project.id, name: project.name })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2 py-0 ${statusStyles[displayStatus] ?? 'bg-muted text-muted-foreground border-border'}`}
                      >
                        {displayStatus}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-[11px] px-2 py-0 ${priorityStyles[displayPriority] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {displayPriority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.description ?? 'No description provided'}
                    </p>

                    {/* Progress */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{project.progress}%</span>
                      </div>
                      <Progress
                        value={project.progress}
                        className="h-1.5 bg-secondary [&>[data-slot=indicator]]:bg-primary"
                      />
                    </div>

                    {/* Tasks & Due Date */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {project.updatedAt
                          ? new Date(project.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>

                    {/* Team placeholder */}
                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      <div className="flex items-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium text-muted-foreground">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-primary"
                      >
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone and will remove all associated tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-border text-muted-foreground hover:text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmDeleteProject() }} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
