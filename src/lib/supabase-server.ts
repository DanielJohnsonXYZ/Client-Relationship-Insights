import { createClient } from '@supabase/supabase-js'
import { getServerEnv } from './env'
import type { Database, TypedSupabaseClient } from '@/types/supabase'

let cachedServerClient: TypedSupabaseClient | null = null

export function getSupabaseServer(): TypedSupabaseClient {
  if (cachedServerClient) return cachedServerClient

  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv()

  // Use service role key to bypass RLS for server operations
  cachedServerClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return cachedServerClient
}