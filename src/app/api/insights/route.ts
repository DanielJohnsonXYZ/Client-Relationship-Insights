import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, createAPIError } from '@/lib/api-errors'
import type { SupabaseListResponse } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    const supabase = getSupabaseServer()
    const { data: insights, error }: SupabaseListResponse<{
      id: string
      category: string
      summary: string
      evidence: string
      suggested_action: string
      confidence: number
      feedback?: string
      created_at: string
    }> = await supabase
      .from('insights')
      .select(`
        id,
        category,
        summary,
        evidence,
        suggested_action,
        confidence,
        feedback,
        created_at,
        emails!inner(user_id)
      `)
      .eq('emails.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      throw createAPIError('Failed to fetch insights', 500, 'DATABASE_ERROR')
    }

    return NextResponse.json({ insights: insights || [] })
  } catch (error) {
    return handleAPIError(error)
  }
}