import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || ''
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    const supabase = await createClient()
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { data, error } = await supabase
      .from('project_generations')
      .select('payload')
      .eq('project_id', projectId)
      .single()

    if (error) {
      // Table missing or not migrated yet
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'project_generations table not found. Run migrations.' }, { status: 500 })
      }
      // PGRST116 is "Results contain 0 rows"
      if (error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ payload: data?.payload || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load generation' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const projectId = String(body.projectId || '')
    const payload = body.payload
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    if (!payload) return NextResponse.json({ error: 'payload required' }, { status: 400 })

    const supabase = await createClient()
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { error } = await supabase
      .from('project_generations')
      .upsert(
        {
          project_id: projectId,
          user_id: user.id,
          payload,
        },
        { onConflict: 'project_id' }
      )

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'project_generations table not found. Run migrations.' }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ status: 'saved' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save generation' }, { status: 500 })
  }
}

