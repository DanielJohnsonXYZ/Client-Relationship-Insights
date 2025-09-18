import { NextRequest, NextResponse } from 'next/server'
import { fetchRecentEmails } from '@/lib/gmail'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, ExternalServiceError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    let emails
    try {
      emails = await fetchRecentEmails(user.accessToken)
    } catch (error) {
      throw new ExternalServiceError('Gmail', 'Failed to fetch emails from Gmail API')
    }
    
    let inserted = 0
    let skipped = 0

    for (const email of emails) {
      try {
        const emailWithUser = {
          ...email,
          user_id: user.id
        }

        const supabase = getSupabaseServer()
        const { error } = await (supabase as any)
          .from('emails')
          .upsert(emailWithUser, { onConflict: 'user_id,gmail_id' })

        if (error) {
          console.error('Error inserting email:', error)
          skipped++
        } else {
          inserted++
        }
      } catch (error) {
        console.error('Error processing email:', error)
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${inserted} emails, skipped ${skipped}`,
      total: emails.length
    })

  } catch (error) {
    const { statusCode, userMessage } = handleAPIError(error)
    return NextResponse.json(
      { error: userMessage },
      { status: statusCode }
    )
  }
}