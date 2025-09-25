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
    const sender = searchParams.get('sender') || ''
    const domain = searchParams.get('domain') || ''
    const fromDate = searchParams.get('from_date') || ''
    const toDate = searchParams.get('to_date') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = getSupabaseServer()

    // Build the query with filters
    let emailQuery = supabase
      .from('emails')
      .select(`
        id,
        subject,
        sender,
        recipient,
        body,
        thread_id,
        message_id,
        received_date,
        created_at
      `)
      .eq('user_id', session.user.id)
      .order('received_date', { ascending: false })
      .limit(limit)

    // Apply text search filters
    if (query) {
      // Search in subject and body using text search
      emailQuery = emailQuery.or(`subject.ilike.%${query}%,body.ilike.%${query}%`)
    }

    if (sender) {
      emailQuery = emailQuery.ilike('sender', `%${sender}%`)
    }

    if (domain) {
      emailQuery = emailQuery.or(`sender.ilike.%@${domain}%,recipient.ilike.%@${domain}%`)
    }

    // Apply date filters
    if (fromDate) {
      emailQuery = emailQuery.gte('received_date', fromDate)
    }

    if (toDate) {
      emailQuery = emailQuery.lte('received_date', toDate)
    }

    const { data: emails, error } = await emailQuery

    if (error) {
      throw new Error(`Search failed: ${error.message}`)
    }

    // Get insights for these emails
    const emailIds = emails?.map(email => email.id) || []
    let insights = []

    if (emailIds.length > 0) {
      const { data: insightData } = await supabase
        .from('insights')
        .select(`
          id,
          email_id,
          category,
          summary,
          confidence,
          created_at
        `)
        .in('email_id', emailIds)

      insights = insightData || []
    }

    // Combine emails with their insights
    const emailsWithInsights = emails?.map(email => ({
      ...email,
      insights: insights.filter(insight => insight.email_id === email.id)
    })) || []

    return NextResponse.json({
      emails: emailsWithInsights,
      total: emails?.length || 0,
      searchParams: {
        query,
        sender,
        domain,
        fromDate,
        toDate,
        limit
      }
    })

  } catch (error) {
    return handleAPIError(error)
  }
}