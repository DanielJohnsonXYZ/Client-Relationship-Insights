import { createClient } from '@supabase/supabase-js'
import { getServerEnv } from './env'

let cachedServerClient: ReturnType<typeof createClient> | null = null

export function getSupabaseServer() {
  if (cachedServerClient) return cachedServerClient

  const { supabaseUrl, supabaseAnonKey } = getServerEnv()

  cachedServerClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return cachedServerClient
}