import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { feedbackSchema } from '@/lib/validation'
import { handleAPIError, ValidationError, AuthorizationError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    const body = await request.json()
    
    // Validate input
    const validation = feedbackSchema.safeParse(body)
    if (!validation.success) {
      throw new ValidationError('Invalid feedback data', validation.error.issues)
    }

    const { insightId, feedback } = validation.data

    // Verify the insight belongs to the user
    const { data: insight, error: fetchError } = await supabaseServer
      .from('insights')
      .select('id, emails!inner(user_id)')
      .eq('id', insightId)
      .eq('emails.user_id', user.id)
      .single()

    if (fetchError || !insight) {
      throw new AuthorizationError('Insight not found or access denied')
    }

    const { error } = await supabaseServer
      .from('insights')
      .update({ feedback })
      .eq('id', insightId)

    if (error) {
      console.error('Error updating feedback:', error)
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    const { statusCode, userMessage } = handleAPIError(error)
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    )
  }
}