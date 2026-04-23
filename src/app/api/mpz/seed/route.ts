import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const LEAD_DATA = [
  { name: 'Mike Johnson', businessName: 'Apex Roofing Co', phone: '(555) 123-4567', email: 'mike@apexroofing.com', serviceType: 'Roofing', stage: 'new_lead', assignedTo: 'Sal', mockupReady: false, automationStarted: false, automationDay: 0, createdAt: new Date(Date.now() - 1000 * 60 * 30) },
  { name: 'Sarah Chen', businessName: 'FlowFix Plumbing', phone: '(555) 234-5678', email: 'sarah@flowfix.com', serviceType: 'Plumbing', stage: 'mockup_needed', assignedTo: 'Geo', mockupReady: false, automationStarted: false, automationDay: 0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  { name: 'David Martinez', businessName: 'CoolAir HVAC', phone: '(555) 345-6789', email: 'david@coolair.com', serviceType: 'HVAC', stage: 'mockup_sent', assignedTo: 'Sal', mockupReady: true, automationStarted: true, automationDay: 1, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
  { name: 'Emily Watson', businessName: 'GreenScape Landscaping', phone: '(555) 456-7890', email: 'emily@greenscape.com', serviceType: 'Landscaping', stage: 'engaged', assignedTo: 'Sal', mockupReady: true, automationStarted: true, automationDay: 2, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) },
  { name: 'James Rodriguez', businessName: 'BrightSpark Electric', phone: '(555) 567-8901', email: 'james@brightspark.com', serviceType: 'Electrician', stage: 'video_sent', assignedTo: 'Sal', mockupReady: true, automationStarted: true, automationDay: 4, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96) },
  { name: 'Lisa Thompson', businessName: 'ProPaint Services', phone: '(555) 678-9012', email: 'lisa@propaint.com', serviceType: 'Painting', stage: 'proof_stage', assignedTo: 'Sal', mockupReady: true, automationStarted: true, automationDay: 6, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 144) },
  { name: 'Robert Kim', businessName: 'Elite Remodeling', phone: '(555) 789-0123', email: 'robert@eliteremodel.com', serviceType: 'Remodeling', stage: 'hot_lead', assignedTo: 'Sal', mockupReady: true, automationStarted: false, automationDay: 8, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 168) },
  { name: 'Amanda Foster', businessName: 'ShineClean Pros', phone: '(555) 890-1234', email: 'amanda@shineclean.com', serviceType: 'Cleaning', stage: 'call_scheduled', assignedTo: 'Sal', mockupReady: true, automationStarted: false, automationDay: 11, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 240) },
  { name: 'Carlos Rivera', businessName: 'TopRoof Solutions', phone: '(555) 901-2345', email: 'carlos@toproof.com', serviceType: 'Roofing', stage: 'closed_won', assignedTo: 'Sal', mockupReady: true, automationStarted: false, automationDay: 14, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 336) },
  { name: 'Jennifer Adams', businessName: 'PipeMaster LLC', phone: '(555) 012-3456', email: 'jen@pipemaster.com', serviceType: 'Plumbing', stage: 'closed_lost', assignedTo: 'Sal', mockupReady: true, automationStarted: false, automationDay: 14, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 400) },
  { name: 'Tom Bradley', businessName: 'SunPower Solar', phone: '(555) 111-2222', email: 'tom@sunpower.com', serviceType: 'Roofing', stage: 'retention', assignedTo: 'Sal', mockupReady: true, automationStarted: false, automationDay: 14, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 500) },
  { name: 'Nancy Liu', businessName: 'QuickFix Handyman', phone: '(555) 333-4444', email: 'nancy@quickfix.com', serviceType: 'Remodeling', stage: 'new_lead', assignedTo: 'Sal', mockupReady: false, automationStarted: false, automationDay: 0, createdAt: new Date(Date.now() - 1000 * 60 * 15) },
]

const TASK_DATA = [
  { title: 'Build Mockup Site (24h)', description: 'Create custom mockup site for FlowFix Plumbing', status: 'pending', priority: 'high', assignedTo: 'Geo', leadEmail: 'sarah@flowfix.com', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 20) },
  { title: 'Call Hot Lead: Robert Kim', description: 'Elite Remodeling replied! Call within 5 minutes', status: 'pending', priority: 'urgent', assignedTo: 'Sal', leadEmail: 'robert@eliteremodel.com', dueDate: new Date(Date.now() + 1000 * 60 * 5) },
  { title: 'Check automation health', description: 'Verify all active automation sequences are running', status: 'in_progress', priority: 'medium', assignedTo: 'Geo' },
  { title: 'Day 15 follow-up call', description: 'Call leads who completed 14-day funnel', status: 'pending', priority: 'medium', assignedTo: 'Sal' },
  { title: 'Fix mockup for BrightSpark', description: 'Update branding colors and CTA placement', status: 'completed', priority: 'high', assignedTo: 'Geo', leadEmail: 'james@brightspark.com' },
  { title: 'Prepare call script', description: 'Update closing script with new case studies', status: 'pending', priority: 'low', assignedTo: 'Sal' },
  { title: 'Review stuck leads', description: 'Check pipeline for leads stuck > 3 days in any stage', status: 'in_progress', priority: 'medium', assignedTo: 'Sal' },
  { title: 'Build Mockup Site (24h)', description: 'Create custom mockup site for QuickFix Handyman', status: 'pending', priority: 'high', assignedTo: 'Geo', leadEmail: 'nancy@quickfix.com', dueDate: new Date(Date.now() + 1000 * 60 * 60 * 22) },
]

const ACTIVITY_DATA = [
  { type: 'hot_lead', message: 'Robert Kim (Elite Remodeling) replied to Day 8 message!' },
  { type: 'new_lead', message: 'New lead: Nancy Liu - QuickFix Handyman (Remodeling)' },
  { type: 'mockup_ready', message: 'Mockup ready for BrightSpark Electric' },
  { type: 'automation_started', message: '14-day funnel started for David Martinez (CoolAir HVAC)' },
  { type: 'stage_change', message: 'Amanda Foster moved to Call Scheduled' },
  { type: 'closed_won', message: 'Carlos Rivera (TopRoof Solutions) - Closed Won!' },
  { type: 'task_completed', message: 'Geo completed mockup for BrightSpark Electric' },
  { type: 'automation_started', message: '14-day funnel started for Emily Watson (GreenScape)' },
]

export async function POST() {
  try {
    await db.mpzTask.deleteMany()
    await db.mpzActivity.deleteMany()
    await db.mpzLead.deleteMany()

    for (const lead of LEAD_DATA) {
      await db.mpzLead.create({ data: lead })
    }

    for (const task of TASK_DATA) {
      const { leadEmail, ...taskData } = task as Record<string, unknown> & { leadEmail?: string }
      const baseData = {
        title: String(taskData.title),
        description: String(taskData.description ?? ''),
        status: String(taskData.status ?? 'pending'),
        priority: String(taskData.priority ?? 'medium'),
        assignedTo: String(taskData.assignedTo ?? ''),
        dueDate: taskData.dueDate ? new Date(taskData.dueDate as string) : null,
      }
      if (leadEmail) {
        const lead = await db.mpzLead.findFirst({ where: { email: leadEmail } })
        if (lead) {
          await db.mpzTask.create({ data: { ...baseData, leadId: lead.id } })
          continue
        }
      }
      await db.mpzTask.create({ data: baseData })
    }

    for (const activity of ACTIVITY_DATA) {
      await db.mpzActivity.create({ data: activity })
    }

    return NextResponse.json({
      success: true,
      leads: LEAD_DATA.length,
      tasks: TASK_DATA.length,
      activities: ACTIVITY_DATA.length,
    })
  } catch (error) {
    console.error('POST /api/mpz/seed error:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}
