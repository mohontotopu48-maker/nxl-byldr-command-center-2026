'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SERVICE_TYPES } from './constants'
import { toast } from 'sonner'

interface MpzNewLeadProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function MpzNewLead({ open, onClose, onCreated }: MpzNewLeadProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    serviceType: '',
  })

  const resetForm = () => setForm({ name: '', businessName: '', phone: '', email: '', serviceType: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.businessName || !form.serviceType) {
      toast.error('Please fill in required fields')
      return
    }
    setLoading(true)
    try {
      await fetch('/api/mpz/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      toast.success('Lead created successfully!', {
        description: `${form.name} from ${form.businessName} has been added.`,
      })
      resetForm()
      onCreated?.()
      onClose()
    } catch {
      toast.error('Failed to create lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetForm(); onClose() } }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Add a new lead to the pipeline. They will start in the &quot;New Lead&quot; stage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mpz-name">Name *</Label>
            <Input
              id="mpz-name"
              placeholder="John Smith"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mpz-businessName">Business Name *</Label>
            <Input
              id="mpz-businessName"
              placeholder="Acme Corp"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mpz-phone">Phone</Label>
              <Input
                id="mpz-phone"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mpz-email">Email</Label>
              <Input
                id="mpz-email"
                type="email"
                placeholder="john@acme.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mpz-serviceType">Service Type *</Label>
            <Select value={form.serviceType} onValueChange={(v) => setForm({ ...form, serviceType: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground">
            Assigned to: <span className="font-medium text-foreground">Sal</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { resetForm(); onClose() }}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.name || !form.businessName || !form.serviceType}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
