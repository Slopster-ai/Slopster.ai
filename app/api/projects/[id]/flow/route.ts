import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch (_) {
    body = {}
  }

  let flow_stage = Number(body?.flow_stage)
  if (!Number.isFinite(flow_stage)) return NextResponse.json({ error: 'flow_stage required' }, { status: 400 })
  flow_stage = Math.max(1, Math.min(7, Math.trunc(flow_stage)))

  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .update({ flow_stage })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, flow_stage })
}











