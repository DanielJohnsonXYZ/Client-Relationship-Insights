import { google } from 'googleapis'
import { sanitizeEmailContent, validateEmailAddress, validateGmailId } from './validation'

export async function getGmailClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return google.gmail({ version: 'v1', auth: oauth2Client })
}

export async function fetchRecentEmails(accessToken: string, days: number = 30) {
  try {
    const gmail = await getGmailClient(accessToken)
    
    const query = `newer_than:${days}d`
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100
    })

    if (!response.data.messages) {
      return []
    }

    const emails = []
    
    for (const message of response.data.messages.slice(0, 50)) {
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
          console.warn('Invalid Gmail ID, skipping email')
          continue
        }

        const sanitizedBody = sanitizeEmailContent(body)
        
        // Skip emails with invalid email addresses
        if (!validateEmailAddress(from) || !validateEmailAddress(to)) {
          console.warn('Invalid email addresses, skipping email')
          continue
        }

        emails.push({
          gmail_id: message.id!,
          thread_id: emailData.data.threadId || message.id!,
          from_email: from,
          to_email: to,
          subject: subject.substring(0, 500), // Limit subject length
          body: sanitizedBody,
          timestamp: new Date(date).toISOString(),
        })

      } catch (error) {
        console.error('Error fetching individual email:', error)
        continue
      }
    }

    return emails
  } catch (error) {
    console.error('Error fetching Gmail messages:', error)
    throw new Error('Failed to fetch emails from Gmail')
  }
}