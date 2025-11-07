import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('strategy_context, flow_stage')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    strategy_context: data?.strategy_context ?? {},
    flow_stage: typeof data?.flow_stage === 'number' ? data.flow_stage : 1,
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch (_) {
    body = {}
  }

  const strategy_context = (body && typeof body.strategy_context === 'object')
    ? body.strategy_context
    : (typeof body === 'object' ? body : undefined)

  if (!strategy_context || typeof strategy_context !== 'object') {
    return NextResponse.json({ error: 'Invalid strategy_context' }, { status: 400 })
  }

  const advanceToStage2 = Boolean(body?.confirm)

  const supabase = await createClient()

  const updates: Record<string, any> = { strategy_context }
  if (advanceToStage2) updates.flow_stage = 2

  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, strategy_context, flow_stage: advanceToStage2 ? 2 : undefined })
}











