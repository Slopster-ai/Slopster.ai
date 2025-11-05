import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export const runtime = 'edge'

const SYSTEM_PROMPT = `You are Slopster.ai Support. Help users with onboarding, pricing, and using the app.
Keep answers concise and actionable. If you don't know, say so and offer to escalate.
Never invent policies. For account/billing/security, recommend emailing support@slopster.ai.`

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: 'user' | 'assistant'; content: string }[]
    }

    const chatMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: chatMessages,
      max_completion_tokens: 600,
    })

    const reply = completion.choices?.[0]?.message?.content ?? 'Sorry, I’m not sure how to help with that.'
    return NextResponse.json({ reply })
  } catch (e) {
    return NextResponse.json({ reply: 'Something went wrong. Please try again.' }, { status: 200 })
  }
}


