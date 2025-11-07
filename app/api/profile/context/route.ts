import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('brand_context')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ brand_context: data?.brand_context ?? {} })
}

export async function PUT(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch (_e) {
    body = {}
  }

  const incoming = (body && typeof body === 'object' && body.brand_context && typeof body.brand_context === 'object')
    ? body.brand_context
    : body

  if (!incoming || typeof incoming !== 'object') {
    return NextResponse.json({ error: 'Invalid brand_context' }, { status: 400 })
  }

  const supabase = await createClient()

  // Fetch current for shallow merge
  const { data: current, error: fetchError } = await supabase
    .from('users')
    .select('brand_context')
    .eq('id', user.id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  const merged = { ...(current?.brand_context ?? {}), ...incoming }

  const { error: updateError } = await supabase
    .from('users')
    .update({ brand_context: merged })
    .eq('id', user.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ ok: true, brand_context: merged })
}










