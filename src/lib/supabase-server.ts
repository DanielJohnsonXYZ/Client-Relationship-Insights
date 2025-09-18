import { createClient } from '@supabase/supabase-js'

let cachedServerClient: ReturnType<typeof createClient> | null = null

export function getSupabaseServer() {
  if (cachedServerClient) return cachedServerClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  cachedServerClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return cachedServerClient
}