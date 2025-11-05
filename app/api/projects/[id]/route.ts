import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const body = await req.json().catch(() => ({})) as any
  const title = typeof body.title === 'string' ? body.title.trim() : undefined
  const description = typeof body.description === 'string' ? body.description.trim() : undefined

  if (!title && typeof description === 'undefined') {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const updates: Record<string, any> = {}
  if (title) updates.title = title
  if (typeof description !== 'undefined') updates.description = description

  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}


