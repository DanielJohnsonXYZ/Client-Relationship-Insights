import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Email = {
  id: string
  user_id: string
  gmail_id: string
  thread_id: string
  from_email: string
  to_email: string
  subject: string
  body: string
  timestamp: string
  created_at: string
}

export type Insight = {
  id: string
  email_id: string
  category: 'Risk' | 'Upsell' | 'Alignment' | 'Note'
  summary: string
  evidence: string
  suggested_action: string
  confidence: number
  feedback: 'positive' | 'negative' | null
  created_at: string
}