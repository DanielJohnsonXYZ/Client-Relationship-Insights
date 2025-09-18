import { NextRequest, NextResponse } from 'next/server'
import { fetchRecentEmails } from '@/lib/gmail'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, createAPIError } from '@/lib/api-errors'
import { validateRequest, syncEmailsSchema } from '@/lib/request-validation'
import type { EmailRecord, SupabaseResponse } from '@/types/database'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    // Validate request body
    const body = await request.json().catch(() => ({}))
    const { days } = validateRequest(syncEmailsSchema, body)

    let emails
    try {
      emails = await fetchRecentEmails(user.accessToken, days)
    } catch (_error) {
      throw createAPIError('Failed to fetch emails from Gmail API', 503, 'GMAIL_ERROR')
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
          logger.warn('Failed to insert email', { error, gmail_id: email.gmail_id })
          skipped++
        } else {
          inserted++
        }
      } catch (error) {
        logger.error('Error processing individual email', error)
        skipped++
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${inserted} emails, skipped ${skipped}` 
    })
  } catch (error) {
    return handleAPIError(error)
  }
}