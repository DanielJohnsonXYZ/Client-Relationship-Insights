import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, createAPIError } from '@/lib/api-errors'
import { validateRequest, feedbackSchema } from '@/lib/request-validation'
import type { SupabaseResponse } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    const body = await request.json()
    const { insightId, feedback } = validateRequest(feedbackSchema, body)

    // Verify the insight belongs to the user
    const supabase = getSupabaseServer()
    const { data: insight, error: fetchError } = await supabase
      .from('insights')
      .select('id, emails!inner(user_id)')
      .eq('id', insightId)
      .eq('emails.user_id', user.id)
      .single()

    if (fetchError || !insight) {
      throw createAPIError('Insight not found or access denied', 404, 'NOT_FOUND')
    }

    // Update insight with feedback
    const { error } = await (supabase as any)
      .from('insights')
      .update({
        feedback: feedback
      })
      .eq('id', insightId)

    if (error) {
      throw createAPIError('Failed to save feedback', 500, 'DATABASE_ERROR')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAPIError(error)
  }
}