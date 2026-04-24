import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/journey/[id]/automate — AI-powered automation for a client journey
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id: journeyId } = await params
    const { action } = await request.json()

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    // Fetch current journey state
    const journey = await db.clientJourney.findUnique({
      where: { id: journeyId },
      include: {
        customer: { select: { name: true, email: true, company: true, phone: true } },
        setupSteps: { orderBy: { stepNumber: 'asc' } },
        alerts: { orderBy: { createdAt: 'desc' }, take: 1 },
        automationLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })

    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 })
    }

    const totalSteps = journey.totalSteps || journey.setupSteps.length
    const stepsSummary = journey.setupSteps.map(s => `Step ${s.stepNumber}: "${s.title}" [${s.phase}] → ${s.status}`).join('\n')
    const completedCount = journey.setupSteps.filter(s => s.status === 'completed').length
    const pct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0
    const currentStep = journey.setupSteps.find(s => s.status === 'in_progress') || journey.setupSteps.find(s => s.status === 'pending')
    const recentLogs = journey.automationLogs.map(l => `- [${l.triggeredBy}] ${l.action}`).join('\n')

    let aiResponse = ''
    let updatedData: Record<string, unknown> = {}

    switch (action) {
      case 'suggest_next': {
        const prompt = `You are a project manager for VSUAL NXL BYLDR Command Center, managing client onboarding for ${journey.customer.name} (${journey.customer.company || 'N/A'}).

CURRENT JOURNEY STATE:
Phase: ${journey.currentPhase}
Progress: ${completedCount}/${totalSteps} steps completed (${pct}%)
${currentStep ? `Current Step: #${currentStep.stepNumber} "${currentStep.title}" (${currentStep.status})` : 'All steps completed!'}

ALL STEPS:
${stepsSummary}

RECENT ACTIVITY:
${recentLogs || 'No recent activity'}

Provide a concise recommendation for the next action (1-2 sentences). Be specific about which step to work on and what to do. Do NOT use markdown or special formatting.`

        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are an expert project manager. Be brief, actionable, and specific. Keep response under 100 words.' },
            { role: 'user', content: prompt },
          ],
          thinking: { type: 'disabled' },
          max_tokens: 200,
        })
        aiResponse = completion.choices[0]?.message?.content || 'Unable to generate suggestion.'

        await db.automationLog.create({
          data: { journeyId, action: `AI suggest_next: ${aiResponse.slice(0, 200)}`, triggeredBy: 'ai_suggest' },
        })
        break
      }

      case 'generate_alert': {
        const prompt = `You are managing the client portal for ${journey.customer.name}.

PROGRESS: ${completedCount}/${totalSteps} steps done (${pct}%)
CURRENT PHASE: ${journey.currentPhase}
CURRENT STEP: ${currentStep ? `#${currentStep.stepNumber} "${currentStep.title}"` : 'All done'}

Generate a short, professional alert message for the client. Rules:
- If there's a specific action needed from the client (like an OTP code, approval, or info), start with "ACTION REQUIRED:" 
- If everything is on track, say "All Systems Go — Project on Schedule."
- Keep under 80 characters.
- Do NOT use quotes or special formatting.`

        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'Generate concise client-facing alert messages. No formatting, no quotes, plain text only.' },
            { role: 'user', content: prompt },
          ],
          thinking: { type: 'disabled' },
          max_tokens: 100,
        })
        aiResponse = completion.choices[0]?.message?.content || 'All Systems Go — Project on Schedule.'
        
        // Update or create the alert (don't deleteMany — use upsert pattern)
        const isActive = aiResponse.includes('ACTION REQUIRED')
        const existingAlert = journey.alerts.length > 0 ? journey.alerts[0] : null
        if (existingAlert) {
          await db.clientAlert.update({
            where: { id: existingAlert.id },
            data: { active: isActive, message: aiResponse, priority: isActive ? 'urgent' : 'normal' },
          })
        } else {
          await db.clientAlert.create({
            data: { journeyId, active: isActive, message: aiResponse, priority: isActive ? 'urgent' : 'normal' },
          })
        }
        updatedData = { alertActive: isActive, alertMessage: aiResponse }

        await db.automationLog.create({
          data: { journeyId, action: `AI generate_alert: "${aiResponse}" (active=${isActive})`, triggeredBy: 'ai_alert' },
        })
        break
      }

      case 'auto_advance_preview': {
        // AI suggests which steps to advance — returns preview WITHOUT applying changes
        const prompt = `You are an AI automation system for a client onboarding journey.

CLIENT: ${journey.customer.name} (${journey.customer.company || 'N/A'})
PROGRESS: ${completedCount}/${totalSteps} steps (${pct}%)
PHASE: ${journey.currentPhase}

ALL STEPS:
${stepsSummary}

Based on the current progress, decide which step(s) should be advanced. Respond ONLY with a JSON array of objects with "stepNumber" and "status" fields. Valid statuses: "completed", "in_progress", "pending".
Example: [{"stepNumber":3,"status":"completed"},{"stepNumber":4,"status":"in_progress"}]

Rules:
- Only advance 1-2 steps at most
- Don't skip steps — cannot complete step N unless step N-1 is completed
- "in_progress" means currently being worked on
- Be conservative — only mark as completed what makes logical sense
- Return ONLY the JSON array, nothing else`

        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are an automation engine. Return ONLY valid JSON arrays. No explanation, no markdown.' },
            { role: 'user', content: prompt },
          ],
          thinking: { type: 'disabled' },
          max_tokens: 300,
        })

        let aiContent = completion.choices[0]?.message?.content || '[]'
        aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

        // Safe JSON parse with validation
        let suggestedUpdates: Array<{ stepNumber: number; status: string }> = []
        try {
          const jsonMatch = aiContent.match(/\[[\s\S]*\]/)
          if (!jsonMatch) throw new Error('No JSON array found')
          const parsed = JSON.parse(jsonMatch[0])
          if (!Array.isArray(parsed)) throw new Error('Not an array')
          if (parsed.length > 2) parsed.length = 2 // Enforce max 2 steps

          const validStatuses = ['completed', 'in_progress', 'pending']
          for (const item of parsed) {
            if (typeof item !== 'object' || item === null) continue
            if (typeof item.stepNumber !== 'number' || !validStatuses.includes(item.status)) continue
            const step = journey.setupSteps.find(s => s.stepNumber === item.stepNumber)
            if (!step) continue
            // Prevent skipping: cannot complete step N unless step N-1 is completed
            if (item.status === 'completed' && item.stepNumber > 1) {
              const prev = journey.setupSteps.find(s => s.stepNumber === item.stepNumber - 1)
              if (prev && prev.status !== 'completed') continue
            }
            suggestedUpdates.push({ stepNumber: item.stepNumber, status: item.status })
          }
        } catch {
          suggestedUpdates = []
        }

        if (suggestedUpdates.length === 0) {
          aiResponse = 'AI found no valid steps to advance at this time.'
        } else {
          aiResponse = `AI suggests advancing ${suggestedUpdates.length} step(s): ${suggestedUpdates.map(u => `Step ${u.stepNumber} → ${u.status}`).join(', ')}. Click "Confirm" to apply or "Cancel" to discard.`
        }
        updatedData = { suggestedUpdates }

        await db.automationLog.create({
          data: { journeyId, action: `AI auto_advance_preview: ${suggestedUpdates.length} suggestion(s)`, triggeredBy: 'ai_preview' },
        })
        break
      }

      case 'auto_advance_confirm': {
        // Admin explicitly confirmed AI suggestions — apply to DB
        const { updates } = await request.json()

        if (!Array.isArray(updates) || updates.length > 2 || updates.length === 0) {
          return NextResponse.json({ error: 'Invalid updates payload' }, { status: 400 })
        }

        const validStatuses = ['completed', 'in_progress', 'pending']
        const appliedUpdates: Array<{ stepId: string; status: string }> = []

        for (const item of updates) {
          if (typeof item !== 'object' || item === null) continue
          if (typeof item.stepNumber !== 'number' || !validStatuses.includes(item.status)) continue
          const step = journey.setupSteps.find(s => s.stepNumber === item.stepNumber)
          if (!step) continue
          if (item.status === 'completed' && item.stepNumber > 1) {
            const prev = journey.setupSteps.find(s => s.stepNumber === item.stepNumber - 1)
            if (prev && prev.status !== 'completed') continue
          }

          await db.clientSetupStep.update({
            where: { id: step.id },
            data: {
              status: item.status,
              completedAt: item.status === 'completed' ? new Date() : null,
            },
          })
          appliedUpdates.push({ stepId: step.id, status: item.status })
        }

        // Recalculate journey
        const allSteps = await db.clientSetupStep.findMany({ where: { journeyId }, orderBy: { stepNumber: 'asc' } })
        const newCompleted = allSteps.filter(s => s.status === 'completed').length
        const phases = ['handover', 'game_plan', 'technical', 'live']
        let currentPhase = 'handover'
        for (const phase of phases) {
          if (allSteps.filter(s => s.phase === phase).some(s => s.status !== 'completed')) {
            currentPhase = phase
            break
          }
        }

        await db.clientJourney.update({
          where: { id: journeyId },
          data: { completedSteps: newCompleted, currentPhase, overallStatus: newCompleted === totalSteps ? 'completed' : 'in_progress' },
        })

        aiResponse = `Confirmed ${appliedUpdates.length} step advance(s). ${appliedUpdates.map(u => `Step ${u.stepId.split('_')[0]} → ${u.status}`).join(', ')}`
        updatedData = { updates: appliedUpdates, completedSteps: newCompleted, currentPhase }

        await db.automationLog.create({
          data: { journeyId, action: `Admin confirmed advance: ${JSON.stringify(appliedUpdates)}`, triggeredBy: 'manual_confirm' },
        })
        break
      }

      case 'progress_summary': {
        const prompt = `Generate a brief, professional progress update for ${journey.customer.name}.

PROGRESS: ${completedCount}/${totalSteps} steps completed (${pct}%)
CURRENT PHASE: ${journey.currentPhase}
${currentStep ? `WORKING ON: Step #${currentStep.stepNumber} "${currentStep.title}"` : 'ALL STEPS COMPLETED!'}

STEPS DETAIL:
${stepsSummary}

Write a friendly 2-3 sentence progress update. Mention what was completed, what's being worked on, and what's next. Do NOT use markdown or special formatting. Plain text only.`

        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'Write friendly, professional client updates. No markdown, no formatting, plain text only.' },
            { role: 'user', content: prompt },
          ],
          thinking: { type: 'disabled' },
          max_tokens: 200,
        })
        aiResponse = completion.choices[0]?.message?.content || 'Progress update unavailable.'

        await db.automationLog.create({
          data: { journeyId, action: `AI progress_summary: ${aiResponse.slice(0, 200)}`, triggeredBy: 'ai_summary' },
        })
        break
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ response: aiResponse, ...updatedData })
  } catch (error) {
    console.error('AI Automation error:', error)
    return NextResponse.json({ error: 'AI automation failed' }, { status: 500 })
  }
}
