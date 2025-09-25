import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseServer } from '@/lib/supabase-server'
import { handleAPIError } from '@/lib/api-errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const minConfidence = parseFloat(searchParams.get('min_confidence') || '0')
    const fromDate = searchParams.get('from_date') || ''
    const toDate = searchParams.get('to_date') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = getSupabaseServer()

    // First get user's email IDs for filtering
    const { data: userEmails } = await supabase
      .from('emails')
      .select('id')
      .eq('user_id', session.user.id)

    const userEmailIds = userEmails?.map((e: { id: string }) => e.id) || []

    if (userEmailIds.length === 0) {
      return NextResponse.json({
        insights: [],
        total: 0,
        searchParams: { query, category, minConfidence, fromDate, toDate, limit }
      })
    }

    // Build the insights query
    let insightQuery = supabase
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
        email_id
      `)
      .in('email_id', userEmailIds)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply search filters
    if (query) {
      insightQuery = insightQuery.or(`summary.ilike.%${query}%,evidence.ilike.%${query}%,suggested_action.ilike.%${query}%`)
    }

    if (category && category !== 'all') {
      insightQuery = insightQuery.eq('category', category)
    }

    if (minConfidence > 0) {
      insightQuery = insightQuery.gte('confidence', minConfidence)
    }

    if (fromDate) {
      insightQuery = insightQuery.gte('created_at', fromDate)
    }

    if (toDate) {
      insightQuery = insightQuery.lte('created_at', toDate)
    }

    const { data: insights, error } = await insightQuery

    if (error) {
      throw new Error(`Insights search failed: ${error.message}`)
    }

    // Get email details for context
    const insightEmailIds = insights?.map((insight: any) => insight.email_id) || []
    let emailContext: any[] = []

    if (insightEmailIds.length > 0) {
      const { data: emails } = await supabase
        .from('emails')
        .select('id, subject, sender, received_date')
        .in('id', insightEmailIds)

      emailContext = emails || []
    }

    // Combine insights with email context
    const insightsWithContext = insights?.map((insight: any) => ({
      ...insight,
      email: emailContext.find((email: any) => email.id === insight.email_id)
    })) || []

    return NextResponse.json({
      insights: insightsWithContext,
      total: insights?.length || 0,
      searchParams: {
        query,
        category,
        minConfidence,
        fromDate,
        toDate,
        limit
      }
    })

  } catch (error) {
    return handleAPIError(error)
  }
}