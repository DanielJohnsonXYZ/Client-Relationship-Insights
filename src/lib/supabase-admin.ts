import { createClient } from '@supabase/supabase-js'
import { getAdminEnv } from './env'

let cachedAdminClient: ReturnType<typeof createClient> | null = null

/**
 * Admin Supabase client with service role key
 * WARNING: Only use in server-side code, never in client components
 * This bypasses Row Level Security (RLS)
 */
export function getSupabaseAdmin() {
  if (cachedAdminClient) return cachedAdminClient

  const { supabaseUrl, supabaseServiceRoleKey } = getAdminEnv()

  cachedAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return cachedAdminClient
}