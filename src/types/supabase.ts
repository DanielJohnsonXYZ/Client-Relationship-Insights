import type { SupabaseClient } from '@supabase/supabase-js'
import type { EmailRecord, InsightRecord, ClientRecord } from './database'

// Define the database schema structure
export interface Database {
  public: {
    Tables: {
      emails: {
        Row: EmailRecord
        Insert: Omit<EmailRecord, 'id' | 'created_at'>
        Update: Partial<Omit<EmailRecord, 'id' | 'created_at'>>
      }
      insights: {
        Row: InsightRecord
        Insert: Omit<InsightRecord, 'id' | 'created_at'>
        Update: Partial<Omit<InsightRecord, 'id' | 'created_at'>>
      }
      clients: {
        Row: ClientRecord
        Insert: Omit<ClientRecord, 'id' | 'created_at'>
        Update: Partial<Omit<ClientRecord, 'id' | 'created_at'>>
      }
      gmail_accounts: {
        Row: {
          id: string
          user_id: string
          email: string
          access_token: string
          refresh_token: string
          token_expiry: string
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          email: string
          access_token: string
          refresh_token: string
          token_expiry: string
          is_primary?: boolean
        }
        Update: Partial<{
          email: string
          access_token: string
          refresh_token: string
          token_expiry: string
          is_primary: boolean
        }>
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          onboarding_completed: boolean
          business_type: string | null
          email_volume: string | null
          primary_goal: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          onboarding_completed?: boolean
          business_type?: string
          email_volume?: string
          primary_goal?: string
        }
        Update: Partial<{
          onboarding_completed: boolean
          business_type: string
          email_volume: string
          primary_goal: string
        }>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      insight_category: 'Risk' | 'Upsell' | 'Alignment' | 'Note'
      client_status: 'Active' | 'Inactive' | 'Prospect'
      relationship_health: 'Good' | 'At Risk' | 'Excellent'
    }
  }
}

// Typed Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>

// Helper type for table names
export type TableName = keyof Database['public']['Tables']

// Helper type for getting a table's row type
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']

// Helper type for getting a table's insert type
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']

// Helper type for getting a table's update type
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']
