import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(req: Request) {
  const user = await getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  let title: string | null = null
  let description: string | null = null

  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => ({})) as any
    title = (body?.title ?? '').toString().trim() || null
    description = (body?.description ?? '').toString().trim() || null
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    title = (form.get('title') as string | null)?.toString().trim() || null
    description = (form.get('description') as string | null)?.toString().trim() || null
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title: title || `New Project ${new Date().toLocaleDateString()}`,
      description: description,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If the caller expects JSON (AJAX), return JSON so the client can navigate
  const accept = req.headers.get('accept') || ''
  if (accept.includes('application/json')) {
    return NextResponse.json({ id: project.id })
  }

  redirect(`/projects/${project.id}/strategy`)
}

