/**
 * Lazy environment variable access helpers
 * These functions are called at runtime, not at module import time
 */

export interface PublicEnv {
  supabaseUrl: string
  supabaseAnonKey: string
}

export interface ServerEnv {
  supabaseUrl: string
  supabaseAnonKey: string
}

export interface AdminEnv {
  supabaseUrl: string
  supabaseServiceRoleKey: string
}

export function getPublicEnv(): PublicEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required public environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  }
}

export function getServerEnv(): ServerEnv {
  // In server context, prefer explicit server vars, fall back to public vars
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required server environment variables: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  }
}

export function getAdminEnv(): AdminEnv {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing required admin environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  }

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
  }
}

export function getAnthropicKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('Missing required environment variable: ANTHROPIC_API_KEY')
  }

  return apiKey
}

export function getGoogleCreds(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing required Google OAuth environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET')
  }

  return {
    clientId,
    clientSecret,
  }
}

export function getBasecampCreds(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.BASECAMP_CLIENT_ID
  const clientSecret = process.env.BASECAMP_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    // Basecamp is optional, return null if not configured
    return null
  }

  return {
    clientId,
    clientSecret,
  }
}

export function getNextAuthConfig(): { secret: string; url: string } {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  const url = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  if (!secret) {
    throw new Error('Missing required environment variable: NEXTAUTH_SECRET or AUTH_SECRET')
  }

  return {
    secret,
    url,
  }
}