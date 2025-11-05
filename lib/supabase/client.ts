import { createBrowserClient } from '@supabase/ssr'

type StorageMode = 'local' | 'session'

export const createClient = (opts?: { storage?: StorageMode }) => {
  const storage = typeof window === 'undefined'
    ? undefined
    : opts?.storage === 'session'
      ? window.sessionStorage
      : window.localStorage

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

