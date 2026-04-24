/**
 * Comprehensive in-memory data store for all entities.
 * Used as fallback when DATABASE_URL is not configured.
 * Data persists during serverless warm starts but is lost on cold starts.
 */
import { isDbAvailable } from './db'

// ─── ID Generator ─────────────────────────────────────────────────────
let idCounter = 1000
function genId(prefix: string = 'id'): string {
  idCounter++
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`
}

// ─── Team Members ─────────────────────────────────────────────────────
interface TeamMemberRecord {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  status: string
  phone: string | null
  location: string | null
  bio: string | null
  createdAt: Date
  updatedAt: Date
}

const teamMembers = new Map<string, TeamMemberRecord>()

// Seed default team members
const defaultTeamMembers: Omit<TeamMemberRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Sal', email: 'info.vsualdm@gmail.com', role: 'master_admin', avatar: null, status: 'active', phone: null, location: null, bio: 'Master Admin' },
  { name: 'Geo', email: 'geovsualdm@gmail.com', role: 'admin', avatar: null, status: 'active', phone: null, location: null, bio: 'Admin' },
]
defaultTeamMembers.forEach(m => {
  const id = genId('tm')
  teamMembers.set(id, { ...m, id, createdAt: new Date('2026-01-01'), updatedAt: new Date() })
})

export const memTeam = {
  getAll: (skip = 0, take = 50) => {
    const arr = Array.from(teamMembers.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return { data: arr.slice(skip, skip + take).map(toJson), total: arr.length }
  },
  findByEmail: (email: string) => {
    for (const m of teamMembers.values()) if (m.email === email) return { ...m, createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString() }
    return null
  },
  findById: (id: string) => {
    const m = teamMembers.get(id)
    return m ? { ...m, createdAt: m.createdAt.toISOString(), updatedAt: m.updatedAt.toISOString() } : null
  },
  create: (data: { name: string; email: string; role: string; avatar?: string | null; status?: string }) => {
    if (memTeam.findByEmail(data.email)) throw new Error('A team member with this email already exists')
    const id = genId('tm')
    const now = new Date()
    const record: TeamMemberRecord = { id, name: data.name.trim(), email: data.email.trim().toLowerCase(), role: data.role || 'member', avatar: data.avatar ?? null, status: data.status || 'active', phone: null, location: null, bio: null, createdAt: now, updatedAt: now }
    teamMembers.set(id, record)
    return { ...record, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() }
  },
  update: (id: string, data: Partial<TeamMemberRecord>) => {
    const existing = teamMembers.get(id)
    if (!existing) throw new Error('Not found')
    const updated = { ...existing, ...data, updatedAt: new Date() }
    teamMembers.set(id, updated)
    return { ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() }
  },
  delete: (id: string) => {
    if (!teamMembers.has(id)) throw new Error('Not found')
    teamMembers.delete(id)
  },
  count: () => teamMembers.size,
}

// ─── Customers ────────────────────────────────────────────────────────
interface CustomerRecord {
  id: string
  name: string
  email: string
  password: string
  company: string | null
  phone: string | null
  status: string
  plan: string
  revenue: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

const customers = new Map<string, CustomerRecord>()

// Seed default customer
const seedCustomer: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt' | 'password'> = {
  name: 'Test Customer', email: 'test@customer.com', company: 'Test Company', phone: null, status: 'active', plan: 'free', revenue: 0, notes: null
}
customers.set(genId('cust'), { ...seedCustomer, id: genId('cust'), password: '$2b$10$2sLy/qTAfV0bGh3IVbg1Ae9gIp1iw69TBhkaeNQ5sUKqHQ/XpQsVW', createdAt: new Date('2026-01-01'), updatedAt: new Date() })

export const memCustomers = {
  getAll: (skip = 0, take = 50) => {
    const arr = Array.from(customers.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return { data: arr.slice(skip, skip + take).map(c => toJsonStrip(c, 'password')), total: arr.length }
  },
  findByEmail: (email: string) => {
    for (const c of customers.values()) if (c.email === email) return { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() }
    return null
  },
  findById: (id: string) => {
    const c = customers.get(id)
    return c ? { ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() } : null
  },
  create: (data: { name: string; email: string; password: string; company?: string; phone?: string; plan?: string; status?: string }) => {
    if (memCustomers.findByEmail(data.email)) throw new Error('A customer with this email already exists')
    const id = genId('cust')
    const now = new Date()
    const record: CustomerRecord = { id, name: data.name.trim(), email: data.email.trim().toLowerCase(), password: data.password, company: (data.company?.trim()) || null, phone: (data.phone?.trim()) || null, status: data.status || 'active', plan: data.plan || 'free', revenue: 0, notes: null, createdAt: now, updatedAt: now }
    customers.set(id, record)
    return { ...toJsonStrip(record, 'password'), createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() }
  },
  update: (id: string, data: Partial<CustomerRecord>) => {
    const existing = customers.get(id)
    if (!existing) throw new Error('Not found')
    const updated = { ...existing, ...data, updatedAt: new Date() }
    customers.set(id, updated)
    return { ...toJsonStrip(updated, 'password'), createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() }
  },
  delete: (id: string) => {
    if (!customers.has(id)) throw new Error('Not found')
    customers.delete(id)
  },
  count: () => customers.size,
}

// ─── Projects ─────────────────────────────────────────────────────────
interface ProjectRecord {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  progress: number
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
}

const projects = new Map<string, ProjectRecord>()

export const memProjects = {
  getAll: (skip = 0, take = 50) => {
    const arr = Array.from(projects.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const result = arr.slice(skip, skip + take).map(p => ({
      ...toJson(p),
      _count: { tasks: memTasks.countByProject(p.id) },
    }))
    return { data: result, total: arr.length }
  },
  findById: (id: string) => {
    const p = projects.get(id)
    return p ? { ...toJson(p), _count: { tasks: memTasks.countByProject(p.id) } } : null
  },
  create: (data: { name: string; description?: string; status?: string; priority?: string; startDate?: string; endDate?: string }) => {
    const id = genId('proj')
    const now = new Date()
    const record: ProjectRecord = { id, name: data.name.trim(), description: data.description || null, status: data.status || 'active', priority: data.priority || 'medium', progress: 0, startDate: data.startDate ? new Date(data.startDate) : null, endDate: data.endDate ? new Date(data.endDate) : null, createdAt: now, updatedAt: now }
    projects.set(id, record)
    return { ...toJson(record) }
  },
  update: (id: string, data: Partial<ProjectRecord>) => {
    const existing = projects.get(id)
    if (!existing) throw new Error('Not found')
    const updated = { ...existing, ...data, updatedAt: new Date() }
    projects.set(id, updated)
    return { ...toJson(updated) }
  },
  delete: (id: string) => {
    if (!projects.has(id)) throw new Error('Not found')
    projects.delete(id)
    // Also delete associated tasks
    for (const [tid, task] of tasks.entries()) {
      if (task.projectId === id) tasks.delete(tid)
    }
  },
  count: () => projects.size,
  countByStatus: () => {
    const counts: Record<string, number> = {}
    for (const p of projects.values()) {
      counts[p.status] = (counts[p.status] || 0) + 1
    }
    return counts
  },
}

// ─── Tasks ────────────────────────────────────────────────────────────
interface TaskRecord {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  projectId: string
  assigneeId: string | null
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
}

const tasks = new Map<string, TaskRecord>()

export const memTasks = {
  getAll: (skip = 0, take = 50, filters?: { projectId?: string; status?: string }) => {
    let arr = Array.from(tasks.values())
    if (filters?.projectId) arr = arr.filter(t => t.projectId === filters.projectId)
    if (filters?.status) arr = arr.filter(t => t.status === filters.status)
    arr.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const result = arr.slice(skip, skip + take).map(t => {
      const project = projects.get(t.projectId)
      const assignee = t.assigneeId ? teamMembers.get(t.assigneeId) : null
      return {
        ...toJson(t),
        project: project ? { id: project.id, name: project.name } : null,
        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, avatar: assignee.avatar } : null,
      }
    })
    return { data: result, total: arr.length }
  },
  findById: (id: string) => {
    const t = tasks.get(id)
    if (!t) return null
    const project = projects.get(t.projectId)
    const assignee = t.assigneeId ? teamMembers.get(t.assigneeId) : null
    return {
      ...toJson(t),
      project: project ? { id: project.id, name: project.name } : null,
      assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, avatar: assignee.avatar } : null,
    }
  },
  create: (data: { title: string; description?: string; status?: string; priority?: string; projectId: string; assigneeId?: string; dueDate?: string }) => {
    const id = genId('task')
    const now = new Date()
    const record: TaskRecord = { id, title: data.title.trim(), description: data.description || null, status: data.status || 'pending', priority: data.priority || 'medium', projectId: data.projectId, assigneeId: data.assigneeId || null, dueDate: data.dueDate ? new Date(data.dueDate) : null, createdAt: now, updatedAt: now }
    tasks.set(id, record)
    return memTasks.findById(id)
  },
  update: (id: string, data: Partial<TaskRecord>) => {
    const existing = tasks.get(id)
    if (!existing) throw new Error('Not found')
    const updated = { ...existing, ...data, updatedAt: new Date() }
    tasks.set(id, updated)
    return memTasks.findById(id)
  },
  delete: (id: string) => {
    if (!tasks.has(id)) throw new Error('Not found')
    tasks.delete(id)
  },
  count: (filters?: { status?: string }) => {
    let arr = Array.from(tasks.values())
    if (filters?.status) arr = arr.filter(t => t.status === filters.status)
    return arr.length
  },
  countByProject: (projectId: string) => {
    return Array.from(tasks.values()).filter(t => t.projectId === projectId).length
  },
}

// ─── Client Journeys ──────────────────────────────────────────────────
interface SetupStepRecord {
  id: string
  stepNumber: number
  title: string
  description: string | null
  phase: string
  status: string
  completedAt: string | null
  journeyId: string
}

interface ClientAlertRecord {
  id: string
  active: boolean
  message: string
  priority: string
  journeyId: string
  createdAt: Date
}

interface ClientJourneyRecord {
  id: string
  customerId: string
  currentPhase: string
  overallStatus: string
  completedSteps: number
  totalSteps: number
  createdAt: Date
  updatedAt: Date
}

const journeys = new Map<string, ClientJourneyRecord>()
const journeySteps = new Map<string, SetupStepRecord[]>()
const journeyAlerts = new Map<string, ClientAlertRecord[]>()
const automationLogs = new Map<string, { id: string; action: string; details: string; triggeredBy: string; journeyId: string; createdAt: Date }[]>()

const JOURNEY_DEFAULT_STEPS = [
  { stepNumber: 1, title: 'Business Information Gathered', phase: 'discovery', status: 'pending' },
  { stepNumber: 2, title: 'Access Credentials Received', phase: 'discovery', status: 'pending' },
  { stepNumber: 3, title: 'Brand Assets & Logo Collected', phase: 'discovery', status: 'pending' },
  { stepNumber: 4, title: 'Target Audience Defined', phase: 'strategy', status: 'pending' },
  { stepNumber: 5, title: 'Service Areas Mapped', phase: 'strategy', status: 'pending' },
  { stepNumber: 6, title: 'Competitor Analysis Complete', phase: 'strategy', status: 'pending' },
  { stepNumber: 7, title: 'Google Business Profile Optimized', phase: 'delivery', status: 'pending' },
  { stepNumber: 8, title: 'Facebook Business Page Created', phase: 'delivery', status: 'pending' },
  { stepNumber: 9, title: 'Ad Account Setup & Verification', phase: 'delivery', status: 'pending' },
  { stepNumber: 10, title: 'CRM & Lead Tracking Installed', phase: 'delivery', status: 'pending' },
  { stepNumber: 11, title: 'Landing Page Built', phase: 'delivery', status: 'pending' },
  { stepNumber: 12, title: 'Ad Campaigns Launched', phase: 'launch', status: 'pending' },
  { stepNumber: 13, title: 'Lead Machine Running', phase: 'launch', status: 'pending' },
]

export const memJourneys = {
  getAll: (skip = 0, take = 50) => {
    const arr = Array.from(journeys.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    const result = arr.slice(skip, skip + take).map(j => memJourneys.enrich(j))
    return { data: result, total: arr.length }
  },
  findById: (id: string) => {
    const j = journeys.get(id)
    return j ? memJourneys.enrich(j) : null
  },
  enrich: (j: ClientJourneyRecord) => {
    const customer = memCustomers.findById(j.customerId)
    const steps = (journeySteps.get(j.id) || []).map(toJson)
    const alerts = (journeyAlerts.get(j.id) || []).slice(0, 1).map(toJson)
    return {
      ...toJson(j),
      customer: customer ? { id: customer.id, name: customer.name, email: customer.email, company: customer.company, status: customer.status, plan: customer.plan } : null,
      setupSteps: steps,
      alerts: alerts,
    }
  },
  create: (customerId: string) => {
    if (journeys.has(customerId)) throw new Error('Journey already exists for this customer')
    const now = new Date()
    const record: ClientJourneyRecord = { id: customerId, customerId, currentPhase: 'discovery', overallStatus: 'active', completedSteps: 0, totalSteps: 13, createdAt: now, updatedAt: now }
    journeys.set(customerId, record)
    // Create default steps
    const steps: SetupStepRecord[] = JOURNEY_DEFAULT_STEPS.map(s => ({
      id: genId('step'),
      stepNumber: s.stepNumber,
      title: s.title,
      description: null,
      phase: s.phase,
      status: s.status,
      completedAt: null,
      journeyId: customerId,
    }))
    journeySteps.set(customerId, steps)
    // Create default alert
    journeyAlerts.set(customerId, [{
      id: genId('alert'),
      active: false,
      message: 'All Systems Go — Project on Schedule.',
      priority: 'medium',
      journeyId: customerId,
      createdAt: now,
    }])
    return memJourneys.enrich(record)
  },
  updateStep: (journeyId: string, stepId: string, status: string) => {
    const steps = journeySteps.get(journeyId)
    if (!steps) throw new Error('Journey not found')
    const step = steps.find(s => s.id === stepId)
    if (!step) throw new Error('Step not found')
    step.status = status
    step.completedAt = status === 'completed' ? new Date().toISOString() : null
    // Recalculate completed steps
    const completedCount = steps.filter(s => s.status === 'completed').length
    const journey = journeys.get(journeyId)
    if (journey) {
      journey.completedSteps = completedCount
      journey.updatedAt = new Date()
    }
    return toJson(step)
  },
  updateAlert: (journeyId: string, data: { active: boolean; message: string; priority?: string }) => {
    const alerts = journeyAlerts.get(journeyId)
    if (!alerts || alerts.length === 0) {
      const newAlert: ClientAlertRecord = { id: genId('alert'), active: data.active, message: data.message, priority: data.priority || 'medium', journeyId, createdAt: new Date() }
      journeyAlerts.set(journeyId, [newAlert])
      return toJson(newAlert)
    }
    alerts[0].active = data.active
    alerts[0].message = data.message
    if (data.priority) alerts[0].priority = data.priority
    return toJson(alerts[0])
  },
  delete: (id: string) => {
    if (!journeys.has(id)) throw new Error('Not found')
    journeys.delete(id)
    journeySteps.delete(id)
    journeyAlerts.delete(id)
    automationLogs.delete(id)
  },
  count: () => journeys.size,
  getAutomationLogs: (journeyId: string) => (automationLogs.get(journeyId) || []).map(toJson),
  addAutomationLog: (journeyId: string, action: string, details: string, triggeredBy: string) => {
    const logs = automationLogs.get(journeyId) || []
    const log = { id: genId('autolog'), action, details, triggeredBy, journeyId, createdAt: new Date() }
    logs.push(log)
    automationLogs.set(journeyId, logs)
    return toJson(log)
  },
}

// ─── Alert Bar ────────────────────────────────────────────────────────
let globalAlert: { active: boolean; message: string } = { active: false, message: 'All Systems Go — Machine is on Schedule.' }

export const memAlertBar = {
  get: () => ({ ...globalAlert }),
  set: (data: { active: boolean; message: string }) => {
    globalAlert = { active: data.active, message: data.message || 'All Systems Go — Machine is on Schedule.' }
    return { ...globalAlert }
  },
}

// ─── Activities ───────────────────────────────────────────────────────
interface ActivityRecord {
  id: string
  type: string
  message: string
  userId: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

const activities = new Map<string, ActivityRecord>()

export const memActivities = {
  getAll: (take = 10) => {
    const arr = Array.from(activities.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, take)
    return arr.map(toJson)
  },
  create: (data: { type: string; message: string; userId?: string; metadata?: Record<string, unknown> }) => {
    const id = genId('act')
    const now = new Date()
    const record: ActivityRecord = { id, type: data.type, message: data.message, userId: data.userId || null, metadata: data.metadata || null, createdAt: now }
    activities.set(id, record)
    return { ...toJson(record) }
  },
}

// ─── Metrics ──────────────────────────────────────────────────────────
interface MetricRecord {
  id: string
  name: string
  value: number
  unit: string
  category: string
  createdAt: Date
}

const metrics = new Map<string, MetricRecord>()

export const memMetrics = {
  getAll: () => Array.from(metrics.values()).map(toJson),
  create: (data: { name: string; value: number; unit?: string; category?: string }) => {
    const id = genId('metric')
    const now = new Date()
    const record: MetricRecord = { id, name: data.name, value: data.value, unit: data.unit || '', category: data.category || 'general', createdAt: now }
    metrics.set(id, record)
    return { ...toJson(record) }
  },
}

// ─── Contact Messages ─────────────────────────────────────────────────
interface ContactMessageRecord {
  id: string
  customerName: string
  customerEmail: string
  subject: string
  message: string
  priority: string
  status: string
  assignedTo: string
  reply: string | null
  repliedAt: string | null
  createdAt: Date
  updatedAt: Date
}

const contactMessages = new Map<string, ContactMessageRecord>()

export const memContact = {
  getAll: (skip = 0, take = 50, filters?: { status?: string }) => {
    let arr = Array.from(contactMessages.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    if (filters?.status) arr = arr.filter(m => m.status === filters.status)
    return { data: arr.slice(skip, skip + take).map(toJson), total: arr.length }
  },
  findById: (id: string) => {
    const m = contactMessages.get(id)
    return m ? toJson(m) : null
  },
  create: (data: { customerName: string; customerEmail: string; subject: string; message: string; priority?: string }) => {
    const id = genId('msg')
    const now = new Date()
    const record: ContactMessageRecord = { id, customerName: data.customerName, customerEmail: data.customerEmail, subject: data.subject, message: data.message, priority: data.priority || 'normal', status: 'unread', assignedTo: 'Sal & Geo', reply: null, repliedAt: null, createdAt: now, updatedAt: now }
    contactMessages.set(id, record)
    return { ...toJson(record) }
  },
  update: (id: string, data: Partial<ContactMessageRecord>) => {
    const existing = contactMessages.get(id)
    if (!existing) throw new Error('Not found')
    const updated = { ...existing, ...data, updatedAt: new Date() }
    if (data.reply && !existing.reply) updated.repliedAt = new Date().toISOString()
    contactMessages.set(id, updated)
    return { ...toJson(updated) }
  },
  delete: (id: string) => {
    if (!contactMessages.has(id)) throw new Error('Not found')
    contactMessages.delete(id)
  },
}

// ─── MPZ Leads ────────────────────────────────────────────────────────
interface MpzLeadRecord {
  id: string
  name: string
  businessName: string
  phone: string
  email: string
  stage: string
  assignedTo: string
  serviceType: string
  notes: string | null
  mockupReady: boolean
  budget: number | null
  source: string | null
  createdAt: Date
  updatedAt: Date
}

const mpzLeads = new Map<string, MpzLeadRecord>()

export const memMpzLeads = {
  getAll: (skip = 0, take = 50) => {
    const arr = Array.from(mpzLeads.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return { data: arr.slice(skip, skip + take).map(toJson), total: arr.length }
  },
  findById: (id: string) => {
    const l = mpzLeads.get(id)
    return l ? { ...toJson(l) } : null
  },
  create: (data: { name: string; businessName: string; phone?: string; email?: string; serviceType?: string; assignedTo?: string }) => {
    const id = genId('lead')
    const now = new Date()
    const record: MpzLeadRecord = { id, name: data.name, businessName: data.businessName, phone: data.phone || '', email: data.email || '', stage: 'new_lead', assignedTo: data.assignedTo || 'Sal', serviceType: data.serviceType || '', notes: null, mockupReady: false, budget: null, source: null, createdAt: now, updatedAt: now }
    mpzLeads.set(id, record)
    return { ...toJson(record) }
  },
  update: (id: string, data: Partial<MpzLeadRecord>) => {
    const existing = mpzLeads.get(id)
    if (!existing) throw new Error('Not found')
    const updated = { ...existing, ...data, updatedAt: new Date() }
    mpzLeads.set(id, updated)
    return { ...toJson(updated) }
  },
  updateStage: (id: string, stage: string) => {
    return memMpzLeads.update(id, { stage })
  },
  setMockupReady: (id: string, ready: boolean) => {
    return memMpzLeads.update(id, { mockupReady: ready })
  },
  delete: (id: string) => {
    if (!mpzLeads.has(id)) throw new Error('Not found')
    mpzLeads.delete(id)
  },
  count: () => mpzLeads.size,
  countByStage: () => {
    const counts: Record<string, number> = {}
    for (const l of mpzLeads.values()) {
      counts[l.stage] = (counts[l.stage] || 0) + 1
    }
    return counts
  },
  countByStageValue: (stage: string) => {
    return Array.from(mpzLeads.values()).filter(l => l.stage === stage).length
  },
  getStuckLeads: () => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return Array.from(mpzLeads.values())
      .filter(l => l.updatedAt.getTime() < sevenDaysAgo && l.stage !== 'closed_won' && l.stage !== 'closed_lost')
      .slice(0, 5)
      .map(toJson)
  },
}

// ─── MPZ Tasks ────────────────────────────────────────────────────────
interface MpzTaskRecord {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  assignedTo: string
  leadId: string | null
  dueDate: string | null
  createdAt: Date
  updatedAt: Date
}

const mpzTasks = new Map<string, MpzTaskRecord>()

export const memMpzTasks = {
  getAll: (skip = 0, take = 50) => {
    const arr = Array.from(mpzTasks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    const result = arr.slice(skip, skip + take).map(t => {
      const lead = t.leadId ? mpzLeads.get(t.leadId) : null
      return { ...toJson(t), lead: lead ? { id: lead.id, businessName: lead.businessName, name: lead.name } : null }
    })
    return { data: result, total: arr.length }
  },
  findById: (id: string) => {
    const t = mpzTasks.get(id)
    if (!t) return null
    const lead = t.leadId ? mpzLeads.get(t.leadId) : null
    return { ...toJson(t), lead: lead ? { id: lead.id, businessName: lead.businessName, name: lead.name } : null }
  },
  create: (data: { title: string; description?: string; status?: string; priority?: string; assignedTo?: string; leadId?: string; dueDate?: string }) => {
    const id = genId('mtask')
    const now = new Date()
    const record: MpzTaskRecord = { id, title: data.title, description: data.description || null, status: data.status || 'pending', priority: data.priority || 'medium', assignedTo: data.assignedTo || 'Sal', leadId: data.leadId || null, dueDate: data.dueDate || null, createdAt: now, updatedAt: now }
    mpzTasks.set(id, record)
    return memMpzTasks.findById(id)
  },
  update: (id: string, data: Partial<MpzTaskRecord>) => {
    const existing = mpzTasks.get(id)
    if (!existing) throw new Error('Not found')
    const updated = { ...existing, ...data, updatedAt: new Date() }
    mpzTasks.set(id, updated)
    return memMpzTasks.findById(id)
  },
  complete: (id: string) => {
    return memMpzTasks.update(id, { status: 'completed' })
  },
  delete: (id: string) => {
    if (!mpzTasks.has(id)) throw new Error('Not found')
    mpzTasks.delete(id)
  },
  countByStatus: (status?: string) => {
    const arr = Array.from(mpzTasks.values())
    return status ? arr.filter(t => t.status === status).length : arr.length
  },
  countUrgent: () => {
    return Array.from(mpzTasks.values()).filter(t => t.priority === 'urgent' && t.status !== 'completed').length
  },
}

// ─── MPZ Activities ───────────────────────────────────────────────────
interface MpzActivityRecord {
  id: string
  type: string
  message: string
  leadId: string | null
  createdAt: Date
}

const mpzActivities = new Map<string, MpzActivityRecord>()

export const memMpzActivities = {
  getAll: (take = 20) => {
    const arr = Array.from(mpzActivities.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, take)
    return { data: arr.map(toJson), total: arr.length }
  },
  create: (data: { type: string; message: string; leadId?: string }) => {
    const id = genId('mact')
    const now = new Date()
    const record: MpzActivityRecord = { id, type: data.type, message: data.message, leadId: data.leadId || null, createdAt: now }
    mpzActivities.set(id, record)
    return { ...toJson(record) }
  },
}

// ─── Dashboard Stats (aggregated) ─────────────────────────────────────
export const memDashboard = {
  getStats: () => ({
    totalProjects: memProjects.count(),
    activeTasks: memTasks.count({ status: 'in_progress' }),
    allTasks: memTasks.count(),
    doneTasks: memTasks.count({ status: 'completed' }),
    teamMembers: memTeam.count(),
    totalCustomers: memCustomers.count(),
    completionRate: memTasks.count() > 0 ? Math.round((memTasks.count({ status: 'completed' }) / memTasks.count()) * 100) : 0,
    recentActivity: memActivities.getAll(10),
    projectsByStatus: memProjects.countByStatus(),
  }),
}

// ─── MPZ Dashboard Stats ──────────────────────────────────────────────
export const memMpzDashboard = {
  getStats: () => {
    const totalLeads = memMpzLeads.count()
    const newLeads = Array.from(mpzLeads.values()).filter(l => l.stage === 'new_lead').length
    const hotLeads = Array.from(mpzLeads.values()).filter(l => l.stage === 'hot_lead').length
    const closedWon = Array.from(mpzLeads.values()).filter(l => l.stage === 'closed_won').length
    return {
      totalLeads,
      newLeads,
      hotLeads,
      leadsByStage: memMpzLeads.countByStage(),
      pendingTasks: memMpzTasks.countByStatus('pending'),
      urgentTasks: memMpzTasks.countUrgent(),
      activeAutomations: 0,
      stuckLeads: memMpzLeads.getStuckLeads(),
      recentActivities: memMpzActivities.getAll(10).data || [],
      conversionRate: totalLeads > 0 ? closedWon / totalLeads : 0,
    }
  },
}

// ─── MPZ Seed ─────────────────────────────────────────────────────────
export function seedMpzData() {
  const leadNames = [
    { name: 'Sarah Johnson', business: 'Johnson Plumbing', phone: '555-0101', email: 'sarah@johnsonplumbing.com' },
    { name: 'Mike Chen', business: 'Chen Electric', phone: '555-0102', email: 'mike@chenelectric.com' },
    { name: 'Lisa Park', business: 'Park Dental', phone: '555-0103', email: 'lisa@parkdental.com' },
    { name: 'Tom Wilson', business: 'Wilson Roofing', phone: '555-0104', email: 'tom@wilsonroofing.com' },
    { name: 'Amy Brown', business: 'Brown Landscaping', phone: '555-0105', email: 'amy@brownlandscaping.com' },
  ]
  const stages = ['new_lead', 'mockup_needed', 'engaged', 'hot_lead', 'closed_won', 'closed_lost', 'contacted', 'qualified', 'proposal_sent']
  const services = ['Facebook Ads', 'Google Ads', 'Social Media Management', 'Web Design', 'SEO']
  const leadIds: string[] = []
  leadNames.forEach((l, i) => {
    const lead = memMpzLeads.create({ name: l.name, businessName: l.business, phone: l.phone, email: l.email, serviceType: services[i % services.length], assignedTo: i % 2 === 0 ? 'Sal' : 'Geo' })
    const leadId = String(lead.id)
    if (i > 0) memMpzLeads.updateStage(leadId, stages[i % stages.length])
    leadIds.push(leadId)
  })
  // Create tasks
  const taskTitles = ['Send proposal', 'Design mockup', 'Set up ad account', 'Create content calendar', 'Client follow-up', 'Review analytics', 'Schedule meeting']
  leadIds.forEach((leadId, i) => {
    taskTitles.slice(0, 2 + (i % 3)).forEach((title, j) => {
      memMpzTasks.create({ title, description: `Task for lead`, priority: j === 0 ? 'high' : 'medium', assignedTo: i % 2 === 0 ? 'Sal' : 'Geo', leadId, dueDate: new Date(Date.now() + (j + 1) * 3 * 24 * 60 * 60 * 1000).toISOString() })
    })
  })
  // Create activities
  memMpzActivities.create({ type: 'lead_created', message: 'New lead Sarah Johnson from Johnson Plumbing', leadId: leadIds[0] })
  memMpzActivities.create({ type: 'stage_changed', message: 'Mike Chen moved to engaged stage', leadId: leadIds[1] })
  memMpzActivities.create({ type: 'task_completed', message: 'Proposal sent for Park Dental', leadId: leadIds[2] })

  return { leads: leadIds.length, tasks: mpzTasks.size, activities: mpzActivities.size }
}

// ─── Utility: should use memory (i.e. DB is not available) ────────────
export function shouldUseMemory(): boolean {
  return !isDbAvailable()
}

// ─── Helpers ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toJson(record: any): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (value instanceof Date) {
      obj[key] = value.toISOString()
    } else {
      obj[key] = value
    }
  }
  return obj
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toJsonStrip(record: any, ...stripKeys: string[]): Record<string, unknown> {
  const obj = toJson(record)
  for (const key of stripKeys) delete obj[key]
  return obj
}
