import { createClient } from '@supabase/supabase-js'
import { getServerEnv } from './env'

let cachedServerClient: ReturnType<typeof createClient> | null = null

export function getSupabaseServer() {
  if (cachedServerClient) return cachedServerClient

  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv()

  // Use service role key to bypass RLS for server operations
  cachedServerClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return cachedServerClient
}