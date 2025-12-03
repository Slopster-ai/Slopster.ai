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

  // Ensure user exists in public.users table (in case trigger didn't fire)
  // First check if user exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  // If check failed with a non-404 error, return error
  if (checkError) {
    return NextResponse.json({ 
      error: `Failed to check user record: ${checkError.message}` 
    }, { status: 500 })
  }

  // If user doesn't exist, create it
  if (!existingUser) {
    // Email should always be available from authenticated user
    if (!user.email) {
      return NextResponse.json({ 
        error: 'User email is required but not available' 
      }, { status: 400 })
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
      })

    if (insertError) {
      // If it's a unique constraint error, user was created between check and insert (race condition)
      // In that case, it's fine - user exists now
      if (insertError.code !== '23505') { // 23505 is unique_violation
        return NextResponse.json({ 
          error: `Failed to create user record: ${insertError.message}` 
        }, { status: 500 })
      }
    }
  }

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

