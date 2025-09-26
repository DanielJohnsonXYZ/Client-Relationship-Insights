import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase-server'
import { getGoogleCreds } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=gmail_auth_failed`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=missing_auth_code`)
    }

    const { user_id, account_label } = JSON.parse(state)
    const { clientId, clientSecret } = getGoogleCreds()

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/gmail-accounts/callback`
      })
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=token_exchange_failed`)
    }

    // Get user's Gmail address
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    })
    
    const profile = await profileResponse.json()

    if (!profile.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=no_gmail_address`)
    }

    // Store Gmail account in database
    const supabase = getSupabaseServer()

    const { error: dbError } = await supabase
      .from('gmail_accounts')
      .upsert({
        user_id,
        gmail_address: profile.email,
        account_label,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,gmail_address'
      })

    if (dbError) {
      console.error('Failed to save Gmail account:', dbError)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=database_save_failed`)
    }

    // Redirect back to dashboard with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?gmail_connected=${encodeURIComponent(profile.email)}`)

  } catch (error) {
    console.error('Gmail OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?error=callback_failed`)
  }
}