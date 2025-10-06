export interface EmailRecord {
  id?: string
  user_id: string
  client_id?: string
  gmail_id: string
  thread_id: string
  from_email: string
  to_email: string
  subject: string
  body: string
  timestamp: string
  is_automated?: boolean
  created_at?: string
}

export interface InsightRecord {
  id?: string
  email_id: string
  client_id?: string
  category?: 'Risk' | 'Upsell' | 'Alignment' | 'Note'
  summary?: string
  evidence?: string
  suggested_action?: string
  confidence?: number
  feedback?: 'positive' | 'negative'
  raw_output?: string
  created_at?: string
}

export interface ClientRecord {
  id?: string
  user_id: string
  name: string
  company?: string
  email?: string
  domain?: string
  status?: 'Active' | 'Inactive' | 'Prospect'
  relationship_health?: 'Good' | 'At Risk' | 'Excellent'
  current_project?: string
  notes?: string
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

// Supabase client type helper
export interface TypedSupabaseClient {
  from(table: 'emails'): EmailQueryBuilder
  from(table: 'insights'): InsightQueryBuilder
  from(table: 'clients'): ClientQueryBuilder
  from(table: string): GenericQueryBuilder
}

interface BaseQueryBuilder<T> {
  select(columns: string): SelectQueryBuilder<T>
  insert(data: Partial<T> | Partial<T>[]): MutationQueryBuilder<T>
  update(data: Partial<T>): UpdateQueryBuilder<T>
  delete(): DeleteQueryBuilder<T>
  upsert(data: Partial<T> | Partial<T>[], options?: { onConflict?: string }): MutationQueryBuilder<T>
}

interface SelectQueryBuilder<T> {
  eq(column: keyof T, value: unknown): SelectQueryBuilder<T>
  neq(column: keyof T, value: unknown): SelectQueryBuilder<T>
  limit(count: number): SelectQueryBuilder<T>
  order(column: keyof T, options?: { ascending?: boolean }): SelectQueryBuilder<T>
  single(): Promise<SupabaseResponse<T>>
  then<TResult>(onfulfilled: (value: SupabaseListResponse<T>) => TResult): Promise<TResult>
}

interface MutationQueryBuilder<T> {
  select(columns?: string): SelectQueryBuilder<T>
  then<TResult>(onfulfilled: (value: SupabaseListResponse<T>) => TResult): Promise<TResult>
}

interface UpdateQueryBuilder<T> {
  eq(column: keyof T, value: unknown): MutationQueryBuilder<T>
}

interface DeleteQueryBuilder<T> {
  eq(column: keyof T, value: unknown): MutationQueryBuilder<T>
}

interface GenericQueryBuilder {
  select(columns: string): {
    eq(column: string, value: unknown): {
      single(): Promise<SupabaseResponse<unknown>>
      limit(count: number): Promise<SupabaseListResponse<unknown>>
      order(column: string, options?: { ascending?: boolean }): {
        limit(count: number): Promise<SupabaseListResponse<unknown>>
      }
    }
    limit(count: number): Promise<SupabaseListResponse<unknown>>
    order(column: string, options?: { ascending?: boolean }): {
      limit(count: number): Promise<SupabaseListResponse<unknown>>
    }
  }
  insert(data: Record<string, unknown> | Record<string, unknown>[]): Promise<SupabaseListResponse<unknown>>
  update(data: Record<string, unknown>): {
    eq(column: string, value: unknown): Promise<SupabaseListResponse<unknown>>
  }
  delete(): {
    eq(column: string, value: unknown): Promise<SupabaseListResponse<unknown>>
  }
  upsert(data: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }): Promise<SupabaseListResponse<unknown>>
}

type EmailQueryBuilder = BaseQueryBuilder<EmailRecord>
type InsightQueryBuilder = BaseQueryBuilder<InsightRecord>
type ClientQueryBuilder = BaseQueryBuilder<ClientRecord>