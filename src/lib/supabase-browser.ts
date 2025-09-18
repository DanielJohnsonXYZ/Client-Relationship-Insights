import { createClient } from '@supabase/supabase-js'
import { getPublicEnv } from './env'

let cachedBrowserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowser() {
  if (cachedBrowserClient) return cachedBrowserClient

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv()

  cachedBrowserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  })

  return cachedBrowserClient
}