'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Calendar, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PRIORITY_COLORS, isOverdue, type MpzTask } from './constants'

export function MpzTasks() {
  const [tasks, setTasks] = useState<MpzTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/mpz/tasks')
      .then(r => r.ok ? r.json() : [])
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  const handleComplete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/mpz/tasks/${taskId}/complete`, { method: 'PUT' })
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
        toast.success('Task completed! 🎉')
      } else {
        toast.error('Failed to complete task')
      }
    } catch {
      toast.error('Failed to complete task')
    }
  }

  const handleDelete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/mpz/tasks/${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        toast.success('Task deleted')
      } else {
        toast.error('Failed to delete task')
      }
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const salTasks = tasks.filter(t => t.assignedTo === 'Sal')
  const geoTasks = tasks.filter(t => t.assignedTo === 'Geo')

  const renderTaskCard = (task: MpzTask) => {
    const isDone = task.status === 'completed'
    const overdue = !isDone && isOverdue(task.dueDate)

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        layout
        className={cn(
          'group rounded-lg border p-4 transition-all hover:shadow-sm',
          isDone && 'opacity-60 bg-muted/30',
          overdue && 'border-red-500/50 bg-red-500/5',
          !isDone && !overdue && 'border-border bg-card'
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isDone}
            onCheckedChange={() => !isDone && handleComplete(task.id)}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={cn('text-sm font-medium', isDone && 'line-through text-muted-foreground')}>
                {task.title}
              </p>
              <Badge className={cn(PRIORITY_COLORS[task.priority] ?? 'bg-gray-500 text-white', 'text-[10px]')}>
                {task.priority}
              </Badge>
              {overdue && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                </Badge>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              {task.leadId && (
                <Badge variant="outline" className="text-[10px] h-5">
                  {task.lead?.businessName ?? 'Linked Lead'}
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDelete(task.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </motion.div>
    )
  }

  const renderColumn = (user: 'Sal' | 'Geo', userTasks: MpzTask[], color: string) => {
    const pending = userTasks.filter(t => t.status !== 'completed').length
    const completed = userTasks.filter(t => t.status === 'completed').length

    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded-full', color)} />
            {user}&apos;s Tasks
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {pending} pending
            </Badge>
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {completed} completed
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-3 pt-2">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : userTasks.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No tasks assigned
                </div>
              ) : (
                userTasks.map(renderTaskCard)
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-10rem)]">
      <div className="grid gap-4 h-full lg:grid-cols-2">
        {renderColumn('Sal', salTasks, 'bg-emerald-500')}
        {renderColumn('Geo', geoTasks, 'bg-amber-500')}
      </div>
    </div>
  )
}
