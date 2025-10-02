import { createClient } from '@supabase/supabase-js'
import { getAdminEnv } from './env'
import type { Database, TypedSupabaseClient } from '@/types/supabase'

let cachedAdminClient: TypedSupabaseClient | null = null

/**
 * Admin Supabase client with service role key
 * WARNING: Only use in server-side code, never in client components
 * This bypasses Row Level Security (RLS)
 */
export function getSupabaseAdmin(): TypedSupabaseClient {
  if (cachedAdminClient) return cachedAdminClient

  const { supabaseUrl, supabaseServiceRoleKey } = getAdminEnv()

  cachedAdminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return cachedAdminClient
}