import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { edited_text } = await req.json()
    if (typeof edited_text !== 'string') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const supabase = await createClient()
    const { error } = await supabase
      .from('scripts')
      .update({ content: { edited_text } })
      .eq('id', params.id)
      .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}



