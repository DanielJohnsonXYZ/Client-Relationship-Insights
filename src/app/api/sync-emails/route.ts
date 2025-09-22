import { NextRequest, NextResponse } from 'next/server'
import { fetchRecentEmails } from '@/lib/gmail'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getAuthenticatedUser } from '@/lib/auth'
import { handleAPIError, createAPIError } from '@/lib/api-errors'
import { validateRequest, syncEmailsSchema } from '@/lib/request-validation'
import { detectEmailClient, isAutomatedEmail } from '@/lib/client-detection'
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
    } catch (gmailError) {
      const errorMessage = `Failed to fetch emails from Gmail API: ${gmailError instanceof Error ? gmailError.message : 'Unknown error'}`
      throw createAPIError(errorMessage, 503, 'GMAIL_ERROR')
    }

    if (!emails || emails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No new emails found' 
      })
    }

    let inserted = 0
    let skipped = 0
    let clientDetected = 0

    const supabase = getSupabaseServer()

    for (const email of emails) {
      try {
        // Detect if email is automated
        const automated = isAutomatedEmail(email)
        
        // Detect client for the email
        const clientDetection = await detectEmailClient(email, user.id)
        
        const emailWithMetadata = {
          ...email,
          user_id: user.id,
          client_id: clientDetection.client_id,
          is_automated: automated
        }

        const { error } = await (supabase as any)
          .from('emails')
          .upsert(emailWithMetadata, { onConflict: 'user_id,gmail_id' })

        if (error) {
          logger.warn('Failed to insert email', { error, gmail_id: email.gmail_id })
          skipped++
        } else {
          inserted++
          if (clientDetection.client_id) {
            clientDetected++
            logger.info('Email linked to client', {
              emailId: email.gmail_id,
              clientId: clientDetection.client_id,
              confidence: clientDetection.confidence,
              reasoning: clientDetection.reasoning
            })
          }
        }
      } catch (error) {
        logger.error('Error processing individual email', error)
        skipped++
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${inserted} emails, skipped ${skipped}. Linked ${clientDetected} emails to clients.` 
    })
  } catch (error) {
    return handleAPIError(error)
  }
}