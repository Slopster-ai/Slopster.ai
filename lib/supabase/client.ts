import { createBrowserClient } from '@supabase/ssr'

type StorageMode = 'local' | 'session'

export const createClient = (opts?: { storage?: StorageMode }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, env vars might not be available
    // Return a mock client that will fail gracefully
    throw new Error(
      'Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  const storage = typeof window === 'undefined'
    ? undefined
    : opts?.storage === 'session'
      ? window.sessionStorage
      : window.localStorage

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )
}

