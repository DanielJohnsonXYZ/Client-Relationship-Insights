import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseServer } from '@/lib/supabase-server'
import { handleAPIError } from '@/lib/api-errors'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { gmail_account_id } = await request.json()
    const supabase = getSupabaseServer()

    let accountsToSync = []

    if (gmail_account_id) {
      // Sync specific Gmail account
      const { data: account } = await supabase
        .from('gmail_accounts')
        .select('*')
        .eq('id', gmail_account_id)
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single()

      if (!account) {
        return NextResponse.json({ error: 'Gmail account not found' }, { status: 404 })
      }

      accountsToSync = [account]
    } else {
      // Sync all active Gmail accounts
      const { data: accounts } = await supabase
        .from('gmail_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)

      accountsToSync = accounts || []
    }

    if (accountsToSync.length === 0) {
      return NextResponse.json({ 
        message: 'No Gmail accounts connected',
        synced_accounts: 0,
        total_emails: 0
      })
    }

    let totalEmails = 0
    const syncResults = []

    for (const account of accountsToSync) {
      try {
        const result = await syncGmailAccount(account, supabase)
        syncResults.push({
          gmail_address: account.gmail_address,
          account_label: account.account_label,
          emails_synced: result.emailsSynced,
          success: true
        })
        totalEmails += result.emailsSynced
      } catch (error) {
        logger.error(`Failed to sync Gmail account ${account.gmail_address}`, error)
        syncResults.push({
          gmail_address: account.gmail_address,
          account_label: account.account_label,
          emails_synced: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Synced ${totalEmails} emails from ${accountsToSync.length} Gmail accounts`,
      synced_accounts: accountsToSync.length,
      total_emails: totalEmails,
      results: syncResults
    })

  } catch (error) {
    return handleAPIError(error)
  }
}

async function syncGmailAccount(account: any, supabase: any) {
  // Check if token is expired and refresh if needed
  const now = Date.now()
  if (account.expires_at && now >= account.expires_at) {
    // Refresh token logic would go here
    // For now, we'll just log and continue
    logger.warn(`Access token expired for ${account.gmail_address}`)
  }

  // Fetch messages from Gmail API
  const messagesResponse = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=is:unread OR newer_than:7d`,
    {
      headers: {
        'Authorization': `Bearer ${account.access_token}`
      }
    }
  )

  if (!messagesResponse.ok) {
    throw new Error(`Gmail API error: ${messagesResponse.statusText}`)
  }

  const messagesData = await messagesResponse.json()
  const messages = messagesData.messages || []

  let emailsSynced = 0

  for (const message of messages.slice(0, 100)) { // Limit to prevent timeouts
    try {
      // Get full message details
      const messageResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
        {
          headers: {
            'Authorization': `Bearer ${account.access_token}`
          }
        }
      )

      const messageData = await messageResponse.json()
      
      // Extract email details
      const headers = messageData.payload?.headers || []
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
      const from = headers.find((h: any) => h.name === 'From')?.value || ''
      const to = headers.find((h: any) => h.name === 'To')?.value || ''
      const date = headers.find((h: any) => h.name === 'Date')?.value || ''

      // Extract body (simplified version)
      let body = ''
      if (messageData.payload?.body?.data) {
        body = Buffer.from(messageData.payload.body.data, 'base64').toString()
      } else if (messageData.payload?.parts) {
        for (const part of messageData.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString()
            break
          }
        }
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('emails')
        .select('id')
        .eq('message_id', message.id)
        .eq('gmail_account_id', account.id)
        .single()

      if (!existing) {
        // Insert new email
        const { error: insertError } = await supabase
          .from('emails')
          .insert({
            user_id: account.user_id,
            gmail_account_id: account.id,
            message_id: message.id,
            thread_id: messageData.threadId,
            subject: subject.substring(0, 255),
            sender: from.substring(0, 255),
            recipient: to.substring(0, 255),
            body: body.substring(0, 10000), // Limit body size
            received_date: date ? new Date(date).toISOString() : new Date().toISOString()
          })

        if (!insertError) {
          emailsSynced++
        }
      }
    } catch (messageError) {
      logger.warn(`Failed to process message ${message.id}:`, messageError)
      continue
    }
  }

  return { emailsSynced }
}