import { NextRequest, NextResponse } from 'next/server'
import { fetchRecentEmails } from '@/lib/gmail'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, ExternalServiceError } from '@/lib/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    let emails
    try {
      emails = await fetchRecentEmails(user.accessToken)
    } catch (error) {
      throw new ExternalServiceError('Gmail', 'Failed to fetch emails from Gmail API')
    }

    if (!emails || emails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No new emails found' 
      })
    }

    let inserted = 0
    let skipped = 0

    const supabase = getSupabaseServer()

    for (const email of emails) {
      try {
        const emailWithUser = {
          ...email,
          user_id: user.id
        }

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
      message: `Synced ${inserted} emails, skipped ${skipped}` 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}