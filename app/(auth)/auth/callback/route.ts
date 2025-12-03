import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Determine the correct site URL
  // Priority: 1. Environment variable, 2. Request origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`)
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback_error`)
}

