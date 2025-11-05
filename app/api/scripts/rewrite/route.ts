import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export const runtime = 'edge'

const SYSTEM = `You rewrite only the selected span of text while keeping the rest intact.
You can make minimal adjustments to adjacent words so the sentence flows, but avoid broad changes outside the selection.
Return ONLY the full updated document text.`

export async function POST(req: NextRequest) {
  try {
    const { text, selectionStart, selectionEnd, instruction } = await req.json()
    if (typeof text !== 'string' || typeof selectionStart !== 'number' || typeof selectionEnd !== 'number' || selectionStart < 0 || selectionEnd > text.length || selectionStart >= selectionEnd) {
      return NextResponse.json({ error: 'Invalid selection' }, { status: 400 })
    }

    const before = text.slice(0, selectionStart)
    const selected = text.slice(selectionStart, selectionEnd)
    const after = text.slice(selectionEnd)

    const messages = [
      { role: 'system' as const, content: SYSTEM },
      {
        role: 'user' as const,
        content: `Instruction: ${instruction || 'Rewrite to improve clarity.'}
---
BEFORE (unchanged):\n${before}
---
SELECTED (rewrite this):\n${selected}
---
AFTER (unchanged):\n${after}
---
Return the full concatenated document with your rewritten SELECTED span inserted, adjusting at most a few neighboring words for flow.`,
      },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages,
      max_completion_tokens: 1200,
    })

    const updated = completion.choices?.[0]?.message?.content
    if (!updated) return NextResponse.json({ error: 'No rewrite produced' }, { status: 500 })
    return NextResponse.json({ text: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


