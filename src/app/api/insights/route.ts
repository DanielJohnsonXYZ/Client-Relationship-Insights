import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, createAPIError } from '@/lib/api-errors'
import type { SupabaseListResponse } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    const supabase = getSupabaseServer()
    
    let query = supabase
      .from('insights')
      .select(`
        id,
        category,
        summary,
        evidence,
        suggested_action,
        confidence,
        feedback,
        raw_output,
        created_at,
        client_id,
        clients (
          id,
          name,
          company
        ),
        emails!inner(user_id)
      `)
      .eq('emails.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    // Filter by client if specified
    if (clientId && clientId !== 'all') {
      query = query.eq('client_id', clientId)
    }

    const { data: insights, error }: SupabaseListResponse<{
      id: string
      category?: string
      summary?: string
      evidence?: string
      suggested_action?: string
      confidence?: number
      feedback?: string
      raw_output?: string
      created_at: string
      client_id?: string
      clients?: {
        id: string
        name: string
        company?: string
      }
    }> = await query

    if (error) {
      // Include the actual Supabase error for debugging
      const errorMessage = `Failed to fetch insights: ${error.message || 'Unknown database error'}`
      const errorCode = error.code || 'DATABASE_ERROR'
      throw createAPIError(errorMessage, 500, errorCode)
    }

    return NextResponse.json({ insights: insights || [] })
  } catch (error) {
    return handleAPIError(error)
  }
}