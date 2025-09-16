import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { fetchRecentEmails } from '@/lib/gmail'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // @ts-ignore
    const accessToken = session.accessToken
    
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 })
    }

    const emails = await fetchRecentEmails(accessToken)
    
    let inserted = 0
    let skipped = 0

    for (const email of emails) {
      try {
        const { error } = await supabase
          .from('emails')
          .upsert(email, { onConflict: 'gmail_id' })

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
    console.error('Error syncing emails:', error)
    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 }
    )
  }
}