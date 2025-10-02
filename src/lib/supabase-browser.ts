import { createClient } from '@supabase/supabase-js'
import { getPublicEnv } from './env'
import type { Database, TypedSupabaseClient } from '@/types/supabase'

let cachedBrowserClient: TypedSupabaseClient | null = null

export function getSupabaseBrowser(): TypedSupabaseClient {
  if (cachedBrowserClient) return cachedBrowserClient

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv()

  cachedBrowserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  })

  return cachedBrowserClient
}