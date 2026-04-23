'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Building2,
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

type CustomerStatus = 'active' | 'inactive' | 'lead'
type CustomerPlan = 'free' | 'pro' | 'enterprise'

interface Customer {
  id: string
  name: string
  email: string
  company: string
  phone: string
  status: CustomerStatus
  plan: CustomerPlan
  revenue: number
}

const statusStyles: Record<CustomerStatus, string> = {
  active: 'bg-primary/15 text-primary border-primary/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  lead: 'bg-amber-400/15 text-amber-400 border-amber-400/20',
}

const planStyles: Record<CustomerPlan, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-blue-400/15 text-blue-400',
  enterprise: 'bg-purple-400/15 text-purple-400',
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

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formCompany, setFormCompany] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPlan, setFormPlan] = useState<string>('free')

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleSubmit = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error('Name and email are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          company: formCompany,
          phone: formPhone,
          plan: formPlan,
        }),
      })

      if (res.ok) {
        toast.success('Customer added successfully!')
        setDialogOpen(false)
        resetForm()
        fetchCustomers()
      } else {
        toast.error('Failed to add customer')
      }
    } catch {
      toast.error('Failed to add customer')
    } finally {
      setSubmitting(false)
    }
  }

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  const confirmDeleteCustomer = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success(`${deleteTarget.name} removed`)
        fetchCustomers()
      } else {
        toast.error('Failed to remove customer')
      }
    } catch {
      toast.error('Failed to remove customer')
    } finally {
      setDeleteTarget(null)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormCompany('')
    setFormPhone('')
    setFormPlan('free')
  }

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q)
    )
  })

  const formatRevenue = (val: number) => {
    if (val === 0) return '$0'
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`
    return `$${val}`
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading customers...</div>
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
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {customers.length} total · {customers.filter(c => c.status === 'active').length} active
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 w-fit">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Customer</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new customer to your database
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cust-name" className="text-foreground">Name *</Label>
                <Input
                  id="cust-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Customer name"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-email" className="text-foreground">Email *</Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cust-company" className="text-foreground">Company</Label>
                  <Input
                    id="cust-company"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Company name"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-phone" className="text-foreground">Phone</Label>
                  <Input
                    id="cust-phone"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+1-555-0000"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Plan</Label>
                <Select value={formPlan} onValueChange={setFormPlan}>
                  <SelectTrigger className="bg-background border-border text-foreground focus:ring-primary/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="free" className="text-foreground focus:bg-accent">Free</SelectItem>
                    <SelectItem value="pro" className="text-foreground focus:bg-accent">Pro</SelectItem>
                    <SelectItem value="enterprise" className="text-foreground focus:bg-accent">Enterprise</SelectItem>
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
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {submitting ? 'Adding...' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-card border-border pl-9 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/30"
          />
        </div>
      </motion.div>

      {/* Desktop Table */}
      <motion.div variants={itemVariants} className="hidden md:block">
        <Card className="border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Customer</TableHead>
                <TableHead className="text-muted-foreground font-medium">Company</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Plan</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Revenue</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="border-border transition-colors duration-150 hover:bg-accent group cursor-pointer"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{customer.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {customer.company || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[11px] px-2 py-0 ${statusStyles[customer.status]}`}>
                      {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[11px] px-2 py-0.5 ${planStyles[customer.plan]}`}>
                      {customer.plan.charAt(0).toUpperCase() + customer.plan.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-medium text-foreground">
                      {formatRevenue(customer.revenue)}
                    </span>
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
                        <DropdownMenuItem className="text-foreground focus:bg-accent cursor-pointer">View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground focus:bg-accent cursor-pointer">Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                          onClick={() => setDeleteTarget({ id: customer.id, name: customer.name })}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.map((customer) => (
          <motion.div key={customer.id} variants={itemVariants}>
            <Card className="border-border bg-card transition-all duration-200 hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusStyles[customer.status]}`}>
                      {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{customer.company || '—'}</span>
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${planStyles[customer.plan]}`}>
                      {customer.plan.charAt(0).toUpperCase() + customer.plan.slice(1)}
                    </Badge>
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {formatRevenue(customer.revenue)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No customers found</div>
        )}
      </div>
    </motion.div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remove Customer</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to remove &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-border text-muted-foreground hover:text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCustomer} className="bg-destructive text-white hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
