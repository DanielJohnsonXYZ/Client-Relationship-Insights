import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, createAPIError } from '@/lib/api-errors'
import { logger } from '@/lib/logger'
import type { SupabaseListResponse } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    logger.info('Fetching insights for user', { userId: user.id })
    
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    const supabase = getSupabaseServer()
    
    // Try a simpler query first to debug the issue
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
        email_id
      `)
      .order('created_at', { ascending: false })
      .limit(100)
    
    // Filter by user through email_id if we have emails table
    // For now, let's get all insights and filter manually if needed

    // Filter by client if specified (disabled until migration is run)
    // if (clientId && clientId !== 'all') {
    //   query = query.eq('client_id', clientId)
    // }

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
      email_id: string
    }> = await query

    if (error) {
      // Include the actual Supabase error for debugging  
      logger.error('Supabase insights query failed', { error, userId: user.id })
      const errorMessage = `Failed to fetch insights: ${error.message || 'Unknown database error'}`
      const errorCode = error.code || 'DATABASE_ERROR'
      throw createAPIError(errorMessage, 500, errorCode)
    }

    logger.info('Insights query successful', { insightCount: insights?.length || 0 })

    // Filter insights by user ownership through emails
    if (insights && insights.length > 0) {
      // Get email IDs that belong to this user
      const { data: userEmails } = await supabase
        .from('emails')
        .select('id')
        .eq('user_id', user.id)
      
      const userEmailIds = new Set(userEmails?.map((e: { id: string }) => e.id) || [])
      const userInsights = insights.filter(insight => userEmailIds.has(insight.email_id))
      
      return NextResponse.json({ insights: userInsights })
    }

    return NextResponse.json({ insights: [] })
  } catch (error) {
    return handleAPIError(error)
  }
}