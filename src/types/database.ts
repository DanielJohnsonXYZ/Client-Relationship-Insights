export interface EmailRecord {
  id?: string
  user_id: string
  gmail_id: string
  thread_id: string
  from_email: string
  to_email: string
  subject: string
  body: string
  timestamp: string
  created_at?: string
}

export interface InsightRecord {
  id?: string
  email_id: string
  category: 'Risk' | 'Upsell' | 'Alignment' | 'Note'
  summary: string
  evidence: string
  suggested_action: string
  confidence: number
  feedback?: 'positive' | 'negative'
  created_at?: string
}

// Feedback is now stored directly on insights table

// Supabase response types
export interface SupabaseResponse<T> {
  data: T | null
  error: {
    message: string
    code?: string
    details?: string
    hint?: string
  } | null
}

export interface SupabaseListResponse<T> {
  data: T[] | null
  error: {
    message: string
    code?: string
    details?: string
    hint?: string
  } | null
}