import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const systemPrompt = context
      ? `You are an AI assistant for VSUAL Business OS. ${context}`
      : `You are an AI assistant for VSUAL Business OS — the all-in-one command center for project management, team collaboration, and growth analytics. You help users manage projects, teams, customers, and analytics. Be concise, helpful, and professional. Keep responses under 200 words unless asked for detailed analysis.`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI Assistant error:', error)
    return NextResponse.json({ error: 'AI assistant unavailable' }, { status: 500 })
  }
}
