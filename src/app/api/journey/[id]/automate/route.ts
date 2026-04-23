import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/journey/[id]/automate — AI-powered automation for a client journey
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const stepsSummary = journey.setupSteps.map(s => `Step ${s.stepNumber}: "${s.title}" [${s.phase}] → ${s.status}`).join('\n')
    const completedCount = journey.setupSteps.filter(s => s.status === 'completed').length
    const currentStep = journey.setupSteps.find(s => s.status === 'in_progress') || journey.setupSteps.find(s => s.status === 'pending')
    const recentLogs = journey.automationLogs.map(l => `- [${l.triggeredBy}] ${l.action}`).join('\n')

    let aiResponse = ''
    let updatedData: Record<string, unknown> = {}

    switch (action) {
      case 'suggest_next': {
        // AI suggests what the next action should be
        const prompt = `You are a project manager for VSUAL NXL BYLDR Command Center, managing client onboarding for ${journey.customer.name} (${journey.customer.company || 'N/A'}).

CURRENT JOURNEY STATE:
Phase: ${journey.currentPhase}
Progress: ${completedCount}/${journey.totalSteps} steps completed
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
        })
        aiResponse = completion.choices[0]?.message?.content || 'Unable to generate suggestion.'
        break
      }

      case 'generate_alert': {
        // AI generates an appropriate alert message based on current state
        const prompt = `You are managing the client portal for ${journey.customer.name}.

PROGRESS: ${completedCount}/13 steps done (${Math.round((completedCount / 13) * 100)}%)
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
        })
        aiResponse = completion.choices[0]?.message?.content || 'All Systems Go — Project on Schedule.'
        
        // Auto-create the alert
        const isActive = aiResponse.includes('ACTION REQUIRED')
        await db.clientAlert.deleteMany({ where: { journeyId } })
        await db.clientAlert.create({
          data: {
            journeyId,
            active: isActive,
            message: aiResponse,
            priority: isActive ? 'urgent' : 'normal',
          },
        })
        updatedData = { alertActive: isActive, alertMessage: aiResponse }
        break
      }

      case 'auto_advance': {
        // AI decides which step to advance based on context
        const prompt = `You are an AI automation system for a client onboarding journey.

CLIENT: ${journey.customer.name} (${journey.customer.company || 'N/A'})
PROGRESS: ${completedCount}/13 steps (${Math.round((completedCount / 13) * 100)}%)
PHASE: ${journey.currentPhase}

ALL STEPS:
${stepsSummary}

Based on the current progress, decide which step(s) should be advanced. Respond ONLY with a JSON array of objects with "stepNumber" and "status" fields. Valid statuses: "completed", "in_progress", "pending".
Example: [{"stepNumber":3,"status":"completed"},{"stepNumber":4,"status":"in_progress"}]

Rules:
- Only advance 1-2 steps at most
- Don't skip steps
- "in_progress" means currently being worked on
- Be conservative — only mark as completed what makes logical sense
- Return ONLY the JSON array, nothing else`

        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'You are an automation engine. Return ONLY valid JSON arrays. No explanation, no markdown.' },
            { role: 'user', content: prompt },
          ],
          thinking: { type: 'disabled' },
        })

        let aiContent = completion.choices[0]?.message?.content || '[]'
        // Clean up response - remove markdown fences if present
        aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        
        const parsed = JSON.parse(aiContent)
        if (!Array.isArray(parsed)) throw new Error('Invalid AI response format')

        const updates: { stepId: string; status: string }[] = []
        for (const item of parsed) {
          const step = journey.setupSteps.find(s => s.stepNumber === item.stepNumber)
          if (step && ['completed', 'in_progress', 'pending'].includes(item.status)) {
            await db.clientSetupStep.update({
              where: { id: step.id },
              data: {
                status: item.status,
                completedAt: item.status === 'completed' ? new Date() : null,
              },
            })
            updates.push({ stepId: step.id, status: item.status })
          }
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
          data: { completedSteps: newCompleted, currentPhase, overallStatus: newCompleted === 13 ? 'completed' : 'in_progress' },
        })

        aiResponse = `AI advanced ${updates.length} step(s). ${updates.map(u => `Step ${u.stepId.split('_')[0]} → ${u.status}`).join(', ')}`
        updatedData = { updates, completedSteps: newCompleted, currentPhase }

        await db.automationLog.create({
          data: { journeyId, action: aiResponse, triggeredBy: 'ai_auto' },
        })
        break
      }

      case 'progress_summary': {
        // AI generates a progress summary for the client
        const prompt = `Generate a brief, professional progress update for ${journey.customer.name}.

PROGRESS: ${completedCount}/13 steps completed (${Math.round((completedCount / 13) * 100)}%)
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
        })
        aiResponse = completion.choices[0]?.message?.content || 'Progress update unavailable.'
        break
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ response: aiResponse, ...updatedData })
  } catch (error) {
    console.error('AI Automation error:', error)
    return NextResponse.json({ error: 'AI automation failed', details: String(error) }, { status: 500 })
  }
}
