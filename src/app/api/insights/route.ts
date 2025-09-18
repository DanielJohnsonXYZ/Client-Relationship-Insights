import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    const supabase = getSupabaseServer()
    const { data: insights, error } = await supabase
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

    if (error) {
      console.error('Error fetching insights:', error)
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
    }

    return NextResponse.json({ insights: insights || [] })

  } catch (error) {
    const { statusCode, userMessage } = handleAPIError(error)
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    )
  }
}