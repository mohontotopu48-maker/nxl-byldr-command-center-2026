import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import { requireMasterAdmin } from '@/lib/auth-guard'

export async function POST(request: NextRequest) {
  // Seed endpoint requires master admin authentication
  const auth = requireMasterAdmin(request)
  if (!auth.authorized) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Check if data already exists
    const projectCount = await db.project.count()
    if (projectCount > 0 && !force) {
      return NextResponse.json(
        { message: 'Database already seeded. Use ?force=true to re-seed.' },
        { status: 200 }
      )
    }

    // If force, clear all existing data first (in reverse dependency order)
    if (force) {
      await db.automationLog.deleteMany()
      await db.clientAlert.deleteMany()
      await db.clientSetupStep.deleteMany()
      await db.clientJourney.deleteMany()
      await db.contactMessage.deleteMany()
      await db.mpzActivity.deleteMany()
      await db.mpzTask.deleteMany()
      await db.mpzLead.deleteMany()
      await db.task.deleteMany()
      await db.activity.deleteMany()
      await db.metric.deleteMany()
      await db.customer.deleteMany()
      await db.project.deleteMany()
      await db.otpCode.deleteMany()
      await db.setupStep.deleteMany()
      await db.alertBar.deleteMany()
      await db.teamMember.deleteMany()
    }

    // Hash master admin password
    const masterPasswordHash = await hash('VSUAL@NX$260&', 10)

    // Create master admin team members first
    await db.teamMember.createMany({
      data: [
        {
          name: 'VSUAL Master Admin',
          email: 'info.vsualdm@gmail.com',
          password: masterPasswordHash,
          role: 'master_admin',
          status: 'active',
        },
        {
          name: 'VSUAL Geo Admin',
          email: 'geovsualdm@gmail.com',
          password: masterPasswordHash,
          role: 'master_admin',
          status: 'active',
        },
      ],
    })

    // Hash default member password
    const memberPasswordHash = await hash('password123', 10)

    // Create team members
    await db.teamMember.createMany({
      data: [
        { name: 'Alex Rivera', email: 'alex@nxlbyldr.com', password: memberPasswordHash, role: 'admin', avatar: '/avatars/alex.jpg', status: 'active' },
        { name: 'Sarah Chen', email: 'sarah@nxlbyldr.com', password: memberPasswordHash, role: 'manager', avatar: '/avatars/sarah.jpg', status: 'active' },
        { name: 'Marcus Johnson', email: 'marcus@nxlbyldr.com', password: memberPasswordHash, role: 'member', avatar: '/avatars/marcus.jpg', status: 'active' },
        { name: 'Priya Patel', email: 'priya@nxlbyldr.com', password: memberPasswordHash, role: 'member', avatar: '/avatars/priya.jpg', status: 'active' },
        { name: 'Jordan Kim', email: 'jordan@nxlbyldr.com', password: memberPasswordHash, role: 'member', avatar: '/avatars/jordan.jpg', status: 'active' },
        { name: 'Liam O\'Brien', email: 'liam@nxlbyldr.com', password: memberPasswordHash, role: 'member', avatar: '/avatars/liam.jpg', status: 'active' },
        { name: 'Mia Thompson', email: 'mia@nxlbyldr.com', password: memberPasswordHash, role: 'manager', avatar: '/avatars/mia.jpg', status: 'active' },
        { name: 'Noah Garcia', email: 'noah@nxlbyldr.com', password: memberPasswordHash, role: 'member', avatar: '/avatars/noah.jpg', status: 'active' },
      ],
    })

    const allMembers = await db.teamMember.findMany()

    // Create projects
    await db.project.createMany({
      data: [
        {
          name: 'Brand Redesign',
          description: 'Complete overhaul of the company brand identity including logo, color palette, and typography system.',
          status: 'active',
          priority: 'high',
          progress: 65,
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-04-30'),
        },
        {
          name: 'Mobile App v2.0',
          description: 'Major update to the mobile application with new features, improved performance, and refreshed UI.',
          status: 'active',
          priority: 'critical',
          progress: 40,
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-06-15'),
        },
        {
          name: 'API Integration Hub',
          description: 'Build a centralized API gateway to manage and monitor all third-party integrations.',
          status: 'active',
          priority: 'medium',
          progress: 20,
          startDate: new Date('2025-03-01'),
          endDate: new Date('2025-07-01'),
        },
        {
          name: 'Analytics Dashboard',
          description: 'Real-time analytics dashboard for tracking KPIs, user engagement, and business metrics.',
          status: 'active',
          priority: 'high',
          progress: 80,
          startDate: new Date('2024-11-01'),
          endDate: new Date('2025-03-15'),
        },
        {
          name: 'Security Audit',
          description: 'Comprehensive security review and vulnerability assessment across all systems.',
          status: 'completed',
          priority: 'critical',
          progress: 100,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-02-28'),
        },
        {
          name: 'Design System 3.0',
          description: 'Next generation design system with improved component library, tokens, and documentation.',
          status: 'paused',
          priority: 'medium',
          progress: 10,
          startDate: new Date('2025-04-01'),
          endDate: new Date('2025-08-30'),
        },
      ],
    })

    const allProjects = await db.project.findMany()

    // Create tasks across projects
    await db.task.createMany({
      data: [
        // Brand Redesign tasks
        {
          title: 'Create mood board and style guide',
          description: 'Research competitors and create visual mood boards for the new brand direction.',
          status: 'done',
          priority: 'high',
          projectId: allProjects[0].id,
          assigneeId: allMembers[1].id,
          dueDate: new Date('2025-02-15'),
        },
        {
          title: 'Design new logo concepts',
          description: 'Develop 5 logo concepts based on the approved style guide direction.',
          status: 'done',
          priority: 'high',
          projectId: allProjects[0].id,
          assigneeId: allMembers[3].id,
          dueDate: new Date('2025-03-01'),
        },
        {
          title: 'Implement brand assets in code',
          description: 'Convert approved brand assets into reusable components and design tokens.',
          status: 'in_progress',
          priority: 'medium',
          projectId: allProjects[0].id,
          assigneeId: allMembers[4].id,
          dueDate: new Date('2025-04-15'),
        },
        // Mobile App v2.0 tasks
        {
          title: 'User authentication flow redesign',
          description: 'Redesign the login, signup, and password recovery flows with improved UX.',
          status: 'done',
          priority: 'critical',
          projectId: allProjects[1].id,
          assigneeId: allMembers[2].id,
          dueDate: new Date('2025-03-01'),
        },
        {
          title: 'Push notification system',
          description: 'Implement push notifications with customizable preferences and deep linking.',
          status: 'in_progress',
          priority: 'high',
          projectId: allProjects[1].id,
          assigneeId: allMembers[5].id,
          dueDate: new Date('2025-04-15'),
        },
        {
          title: 'Offline mode support',
          description: 'Add offline data caching and sync capabilities for key features.',
          status: 'todo',
          priority: 'medium',
          projectId: allProjects[1].id,
          assigneeId: allMembers[2].id,
          dueDate: new Date('2025-05-15'),
        },
        {
          title: 'Performance optimization pass',
          description: 'Profile and optimize app startup time, rendering, and memory usage.',
          status: 'todo',
          priority: 'high',
          projectId: allProjects[1].id,
          assigneeId: allMembers[5].id,
          dueDate: new Date('2025-06-01'),
        },
        // API Integration Hub tasks
        {
          title: 'Design API gateway architecture',
          description: 'Define the microservice architecture and API gateway patterns.',
          status: 'in_progress',
          priority: 'high',
          projectId: allProjects[2].id,
          assigneeId: allMembers[0].id,
          dueDate: new Date('2025-04-01'),
        },
        {
          title: 'Implement rate limiting middleware',
          description: 'Build rate limiting and throttling middleware for API protection.',
          status: 'todo',
          priority: 'medium',
          projectId: allProjects[2].id,
          assigneeId: allMembers[0].id,
          dueDate: new Date('2025-05-01'),
        },
        // Analytics Dashboard tasks
        {
          title: 'Set up data pipeline',
          description: 'Configure ETL pipeline from various data sources to the analytics warehouse.',
          status: 'done',
          priority: 'high',
          projectId: allProjects[3].id,
          assigneeId: allMembers[0].id,
          dueDate: new Date('2025-01-15'),
        },
        {
          title: 'Build real-time charting components',
          description: 'Create interactive, real-time charting components using WebSocket data feeds.',
          status: 'review',
          priority: 'high',
          projectId: allProjects[3].id,
          assigneeId: allMembers[4].id,
          dueDate: new Date('2025-03-01'),
        },
        {
          title: 'Create executive summary view',
          description: 'Design and implement a high-level executive summary with key KPIs and trends.',
          status: 'done',
          priority: 'medium',
          projectId: allProjects[3].id,
          assigneeId: allMembers[6].id,
          dueDate: new Date('2025-02-28'),
        },
        // Security Audit tasks
        {
          title: 'Penetration testing',
          description: 'Conduct thorough penetration testing on all public-facing endpoints.',
          status: 'done',
          priority: 'critical',
          projectId: allProjects[4].id,
          assigneeId: allMembers[7].id,
          dueDate: new Date('2025-02-15'),
        },
        {
          title: 'Remediate critical vulnerabilities',
          description: 'Fix all critical and high-severity vulnerabilities found during testing.',
          status: 'done',
          priority: 'critical',
          projectId: allProjects[4].id,
          assigneeId: allMembers[0].id,
          dueDate: new Date('2025-02-28'),
        },
        // Design System 3.0 tasks
        {
          title: 'Audit current design system usage',
          description: 'Analyze usage patterns of the current design system across all products.',
          status: 'in_progress',
          priority: 'medium',
          projectId: allProjects[5].id,
          assigneeId: allMembers[3].id,
          dueDate: new Date('2025-05-01'),
        },
      ],
    })

    // Create activities
    await db.activity.createMany({
      data: [
        {
          type: 'project_created',
          message: 'Brand Redesign project was created and assigned to the design team.',
          userId: allMembers[0].id,
          metadata: JSON.stringify({ projectId: allProjects[0].id }),
        },
        {
          type: 'task_completed',
          message: 'Sarah Chen completed "Create mood board and style guide" for Brand Redesign.',
          userId: allMembers[1].id,
          metadata: JSON.stringify({ projectId: allProjects[0].id, taskId: 'task-1' }),
        },
        {
          type: 'member_joined',
          message: 'Noah Garcia joined the team as a security specialist.',
          userId: allMembers[7].id,
        },
        {
          type: 'task_completed',
          message: 'Alex Rivera completed "Remediate critical vulnerabilities" for Security Audit.',
          userId: allMembers[0].id,
          metadata: JSON.stringify({ projectId: allProjects[4].id }),
        },
        {
          type: 'project_completed',
          message: 'Security Audit has been completed successfully with all issues resolved.',
          userId: allMembers[0].id,
          metadata: JSON.stringify({ projectId: allProjects[4].id }),
        },
        {
          type: 'task_started',
          message: 'Jordan Kim started working on "Build real-time charting components".',
          userId: allMembers[4].id,
          metadata: JSON.stringify({ projectId: allProjects[3].id }),
        },
        {
          type: 'project_created',
          message: 'Mobile App v2.0 project kicked off with critical priority.',
          userId: allMembers[1].id,
          metadata: JSON.stringify({ projectId: allProjects[1].id }),
        },
        {
          type: 'member_joined',
          message: 'Mia Thompson was promoted to manager role.',
          userId: allMembers[6].id,
        },
        {
          type: 'task_completed',
          message: 'Liam O\'Brien completed "Set up data pipeline" for Analytics Dashboard.',
          userId: allMembers[5].id,
          metadata: JSON.stringify({ projectId: allProjects[3].id }),
        },
        {
          type: 'task_started',
          message: 'Marcus Johnson started "Push notification system" for Mobile App v2.0.',
          userId: allMembers[2].id,
          metadata: JSON.stringify({ projectId: allProjects[1].id }),
        },
      ],
    })

    // Create metrics
    await db.metric.createMany({
      data: [
        { name: 'Sprint Velocity', value: 42, unit: 'story points', category: 'performance' },
        { name: 'Bug Resolution Rate', value: 87.5, unit: '%', category: 'quality' },
        { name: 'Team Satisfaction', value: 8.2, unit: '/10', category: 'team' },
        { name: 'Code Coverage', value: 78, unit: '%', category: 'quality' },
        { name: 'Deployment Frequency', value: 12, unit: 'per week', category: 'performance' },
        { name: 'Average Response Time', value: 245, unit: 'ms', category: 'performance' },
        { name: 'Uptime', value: 99.95, unit: '%', category: 'reliability' },
        { name: 'Active Users', value: 15420, unit: 'users', category: 'growth' },
      ],
    })

    // Create customers (passwords hashed)
    const customerPasswordHash = await hash('Customer@123', 10)
    await db.customer.createMany({
      data: [
        { name: 'TechVision Inc', email: 'contact@techvision.com', password: customerPasswordHash, company: 'TechVision Inc', status: 'active', plan: 'pro', revenue: 12500 },
        { name: 'CloudNine Solutions', email: 'info@cloudnine.io', password: customerPasswordHash, company: 'CloudNine Solutions', status: 'active', plan: 'enterprise', revenue: 34000 },
        { name: 'DataFlow Analytics', email: 'hello@dataflow.dev', password: customerPasswordHash, company: 'DataFlow Analytics', status: 'active', plan: 'pro', revenue: 8900 },
        { name: 'StartupXYZ', email: 'founders@startupxyz.co', password: customerPasswordHash, company: 'StartupXYZ', status: 'lead', plan: 'free', revenue: 0 },
        { name: 'GlobalTech Corp', email: 'admin@globaltech.com', password: customerPasswordHash, company: 'GlobalTech Corp', status: 'inactive', plan: 'pro', revenue: 15600 },
        { name: 'Nexus Digital', email: 'team@nexusdigital.com', password: customerPasswordHash, company: 'Nexus Digital', status: 'active', plan: 'free', revenue: 2100 },
      ],
    })

    const totalMembers = await db.teamMember.count()

    return NextResponse.json(
      {
        message: 'Database seeded successfully',
        data: {
          teamMembers: totalMembers,
          projects: 6,
          tasks: 15,
          activities: 10,
          metrics: 8,
          customers: 6,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error seeding database:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to seed database', details: message },
      { status: 500 }
    )
  }
}
