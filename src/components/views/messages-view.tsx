'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  RefreshCw,
  Mail,
  Clock,
  CheckCircle2,
  ArrowRight,
  Trash2,
  Eye,
  Send,
  Inbox,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { apiFetch } from '@/lib/api-client'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageStatus = 'unread' | 'read' | 'replied'
type MessagePriority = 'normal' | 'medium' | 'urgent'
type FilterTab = 'all' | 'unread' | 'replied'

interface ContactMessage {
  id: string
  customerName: string
  customerEmail: string
  subject: string
  message: string
  priority: MessagePriority
  status: MessageStatus
  assignedTo: string
  reply: string | null
  repliedAt: string | null
  createdAt: string
  updatedAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const priorityStyles: Record<MessagePriority, string> = {
  normal: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-amber-400/15 text-amber-400 border-amber-400/20',
  urgent: 'bg-primary/15 text-primary border-primary/20',
}

const priorityLabels: Record<MessagePriority, string> = {
  normal: 'Normal',
  medium: 'Medium',
  urgent: 'Urgent',
}

const statusStyles: Record<MessageStatus, string> = {
  unread: 'bg-primary/15 text-primary border-primary/20',
  read: 'bg-muted text-muted-foreground border-border',
  replied: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20',
}

const statusLabels: Record<MessageStatus, string> = {
  unread: 'Unread',
  read: 'Read',
  replied: 'Replied',
}

const statusIcons: Record<MessageStatus, React.ReactNode> = {
  unread: <AlertCircle className="h-3 w-3" />,
  read: <Eye className="h-3 w-3" />,
  replied: <CheckCircle2 className="h-3 w-3" />,
}

// ─── Animation Variants ──────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

export function MessagesView() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  // Detail dialog
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Reply
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ContactMessage | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Fetch messages ──────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const params = new URLSearchParams()
      if (activeFilter !== 'all') params.set('status', activeFilter)
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await apiFetch(`/api/contact${query}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      } else {
        toast.error('Failed to load messages')
      }
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeFilter])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // ─── Filtered messages ───────────────────────────────────────────────────

  const filteredMessages = activeFilter === 'all'
    ? messages
    : messages.filter((m) => m.status === activeFilter)

  // ─── Stats ───────────────────────────────────────────────────────────────

  const totalCount = messages.length
  const unreadCount = messages.filter((m) => m.status === 'unread').length
  const repliedCount = messages.filter((m) => m.status === 'replied').length

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleOpenDetail = (msg: ContactMessage) => {
    setSelectedMessage(msg)
    setReplyText('')
    setDetailOpen(true)

    // Auto-mark as read if unread
    if (msg.status === 'unread') {
      apiFetch(`/api/contact/${msg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      })
        .then((res) => {
          if (res.ok) {
            setSelectedMessage((prev) => prev ? { ...prev, status: 'read' as MessageStatus } : null)
            setMessages((prev) =>
              prev.map((m) => (m.id === msg.id ? { ...m, status: 'read' as MessageStatus } : m))
            )
          }
        })
        .catch(() => {})
    }
  }

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      toast.error('Reply text is required')
      return
    }

    setSendingReply(true)
    try {
      const res = await apiFetch(`/api/contact/${selectedMessage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      })

      if (res.ok) {
        const updated = await res.json()
        toast.success('Reply sent successfully')
        setSelectedMessage(updated)
        setReplyText('')
        setMessages((prev) =>
          prev.map((m) => (m.id === selectedMessage.id ? updated : m))
        )
      } else {
        toast.error('Failed to send reply')
      }
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const handleMarkAsRead = async () => {
    if (!selectedMessage || selectedMessage.status === 'read') return

    try {
      const res = await apiFetch(`/api/contact/${selectedMessage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      })

      if (res.ok) {
        const updated = await res.json()
        toast.success('Marked as read')
        setSelectedMessage(updated)
        setMessages((prev) =>
          prev.map((m) => (m.id === selectedMessage.id ? updated : m))
        )
      } else {
        toast.error('Failed to mark as read')
      }
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    try {
      const res = await apiFetch(`/api/contact/${deleteTarget.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Message deleted')
        setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id))
        if (selectedMessage?.id === deleteTarget.id) {
          setDetailOpen(false)
          setSelectedMessage(null)
        }
      } else {
        toast.error('Failed to delete message')
      }
    } catch {
      toast.error('Failed to delete message')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleRefresh = () => {
    fetchMessages(true)
  }

  const handleFilterChange = (tab: FilterTab) => {
    setActiveFilter(tab)
  }

  // ─── Loading state ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading messages...</div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Customer Messages</h1>
              <p className="text-sm text-muted-foreground">
                Messages from customers — routed to Sal &amp; Geo
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-accent w-fit"
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </motion.div>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-border bg-card py-4 shadow-sm">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card py-4 shadow-sm">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <AlertCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card py-4 shadow-sm">
            <CardContent className="flex items-center gap-3 px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{repliedCount}</p>
                <p className="text-xs text-muted-foreground">Replied</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Filter Tabs ─────────────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2">
          {(['all', 'unread', 'replied'] as FilterTab[]).map((tab) => {
            const isActive = activeFilter === tab
            return (
              <Button
                key={tab}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleFilterChange(tab)}
                className={cn(
                  'text-sm',
                  isActive
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'all' && (
                  <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px] bg-background/20 text-current">
                    {totalCount}
                  </Badge>
                )}
                {tab === 'unread' && unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px] bg-background/20 text-current">
                    {unreadCount}
                  </Badge>
                )}
                {tab === 'replied' && repliedCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px] bg-background/20 text-current">
                    {repliedCount}
                  </Badge>
                )}
              </Button>
            )
          })}
        </motion.div>

        {/* ── Message List ────────────────────────────────────────────────── */}
        {filteredMessages.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground">No customer messages yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Messages from the contact form will appear here
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-3">
            {filteredMessages.map((msg) => (
              <motion.div key={msg.id} variants={itemVariants}>
                <Card
                  className={cn(
                    'border-border bg-card transition-all duration-200 cursor-pointer hover:border-primary/30',
                    msg.status === 'unread' && 'border-primary/20 bg-primary/[0.02]'
                  )}
                  onClick={() => handleOpenDetail(msg)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Avatar className="mt-0.5 h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {msg.customerName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {msg.customerName}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            <Mail className="mr-0.5 inline h-3 w-3" />
                            {msg.customerEmail}
                          </span>
                        </div>

                        {/* Badges */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-[11px] px-2 py-0 border-border bg-background">
                            {msg.subject}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn('text-[11px] px-2 py-0', priorityStyles[msg.priority])}
                          >
                            {priorityLabels[msg.priority]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn('text-[11px] px-2 py-0', statusStyles[msg.status])}
                          >
                            <span className="mr-1 flex items-center">{statusIcons[msg.status]}</span>
                            {statusLabels[msg.status]}
                          </Badge>
                        </div>

                        {/* Preview */}
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {msg.message}
                        </p>

                        {/* Footer */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(msg.createdAt)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3 text-primary/60" />
                            <span className="text-primary/80">Sal &amp; Geo</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Message Detail Dialog ─────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setSelectedMessage(null) }}>
        <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground text-lg">
                  Message from {selectedMessage.customerName}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {selectedMessage.subject}
                </DialogDescription>
              </DialogHeader>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-[11px] px-2 py-0', priorityStyles[selectedMessage.priority])}
                >
                  {priorityLabels[selectedMessage.priority]} Priority
                </Badge>
                <Badge
                  variant="outline"
                  className={cn('text-[11px] px-2 py-0', statusStyles[selectedMessage.status])}
                >
                  <span className="mr-1 flex items-center">{statusIcons[selectedMessage.status]}</span>
                  {statusLabels[selectedMessage.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFullDate(selectedMessage.createdAt)}
                </span>
              </div>

              <Separator className="bg-border" />

              {/* Customer Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {selectedMessage.customerName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedMessage.customerName}</p>
                  <p className="text-xs text-muted-foreground">{selectedMessage.customerEmail}</p>
                </div>
              </div>

              {/* Message Body */}
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>

              {/* Assigned to */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3 text-primary/60" />
                Assigned to <span className="text-primary/80 font-medium">Sal &amp; Geo</span>
              </div>

              {/* Existing Reply */}
              {selectedMessage.reply && (
                <>
                  <Separator className="bg-border" />
                  <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[11px] px-2 py-0 bg-emerald-400/15 text-emerald-400 border-emerald-400/20"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Replied
                      </Badge>
                      {selectedMessage.repliedAt && (
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(selectedMessage.repliedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.reply}
                    </p>
                  </div>
                </>
              )}

              {/* Reply Section */}
              {selectedMessage.status !== 'replied' && (
                <>
                  <Separator className="bg-border" />
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Send Reply</p>
                    <Textarea
                      placeholder="Type your reply here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 resize-none"
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </>
              )}

              {/* Actions */}
              <Separator className="bg-border" />
              <DialogFooter className="flex items-center gap-2">
                {selectedMessage.status === 'unread' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAsRead}
                    className="border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Mark as Read
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteTarget(selectedMessage)
                  }}
                  className="border-border text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Message</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete the message from &quot;{deleteTarget?.customerName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-border text-muted-foreground hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
