import { google } from 'googleapis'
import { sanitizeEmailContent, validateEmailAddress, validateGmailId, parseEmailFromHeader } from './validation'
import { logger } from './logger'

// Configuration constants - increased limits for better insights
const GMAIL_CONFIG = {
  daysToFetch: 30, // Extended to 30 days for more comprehensive analysis
  maxResults: 500, // Increased to get more emails
  processLimit: 200 // Process more emails for better insights
}

export async function getGmailClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return google.gmail({ version: 'v1', auth: oauth2Client })
}

export async function fetchRecentEmails(accessToken: string, days: number = GMAIL_CONFIG.daysToFetch) {
  try {
    const gmail = await getGmailClient(accessToken)
    
    const query = `newer_than:${days}d`
    logger.info('Fetching emails from Gmail', { query, maxResults: GMAIL_CONFIG.maxResults, processLimit: GMAIL_CONFIG.processLimit })
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: GMAIL_CONFIG.maxResults
    })

    if (!response.data.messages) {
      logger.warn('No messages returned from Gmail API')
      return []
    }

    logger.info('Gmail API returned messages', { 
      totalFound: response.data.messages.length,
      willProcess: Math.min(response.data.messages.length, GMAIL_CONFIG.processLimit)
    })

    const emails = []
    let skippedInvalidId = 0
    let skippedInvalidEmails = 0
    let skippedInvalidDates = 0
    
    for (const message of response.data.messages.slice(0, GMAIL_CONFIG.processLimit)) {
      try {
        const emailData = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        })

        const headers = emailData.data.payload?.headers || []
        const subject = headers.find(h => h.name === 'Subject')?.value || ''
        const from = headers.find(h => h.name === 'From')?.value || ''
        const to = headers.find(h => h.name === 'To')?.value || ''
        const date = headers.find(h => h.name === 'Date')?.value || ''

        let body = ''
        if (emailData.data.payload?.body?.data) {
          body = Buffer.from(emailData.data.payload.body.data, 'base64').toString()
        } else if (emailData.data.payload?.parts) {
          for (const part of emailData.data.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body = Buffer.from(part.body.data, 'base64').toString()
              break
            }
          }
        }

        // Validate and sanitize email data
        if (!validateGmailId(message.id!)) {
          skippedInvalidId++
          continue
        }

        const sanitizedBody = sanitizeEmailContent(body)
        
        // Parse email addresses from headers and validate
        const fromEmail = parseEmailFromHeader(from)
        const toEmail = parseEmailFromHeader(to)
        
        if (!validateEmailAddress(fromEmail) || !validateEmailAddress(toEmail)) {
          skippedInvalidEmails++
          logger.debug('Skipped email with invalid addresses', { from: fromEmail, to: toEmail, subject })
          continue
        }

        // Handle missing or invalid date headers
        let emailTimestamp: string
        try {
          emailTimestamp = date ? new Date(date).toISOString() : new Date().toISOString()
        } catch (error) {
          skippedInvalidDates++
          emailTimestamp = new Date().toISOString()
        }

        emails.push({
          gmail_id: message.id!,
          thread_id: emailData.data.threadId || message.id!,
          from_email: fromEmail,
          to_email: toEmail,
          subject: subject.substring(0, 500), // Limit subject length
          body: sanitizedBody,
          timestamp: emailTimestamp,
        })

      } catch (error) {
        logger.error('Error fetching individual email', { error, message_id: message.id })
        continue
      }
    }

    logger.info('Email fetch completed', { 
      totalProcessed: emails.length,
      skippedInvalidId,
      skippedInvalidEmails,
      skippedInvalidDates,
      finalCount: emails.length
    })

    return emails
  } catch (error) {
    logger.error('Error fetching Gmail messages', { error })
    throw new Error('Failed to fetch emails from Gmail')
  }
}