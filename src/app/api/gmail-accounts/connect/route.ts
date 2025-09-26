import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { handleAPIError } from '@/lib/api-errors'
import { getGoogleCreds } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { account_label } = await request.json()
    const { clientId } = getGoogleCreds()

    // Generate Gmail-specific OAuth URL with additional scopes
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/gmail-accounts/callback`,
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent', // Force consent to get refresh token
      state: JSON.stringify({
        user_id: session.user.id,
        account_label: account_label || null
      })
    })

    const authUrl = `https://accounts.google.com/oauth/authorize?${params}`

    return NextResponse.json({ 
      auth_url: authUrl,
      message: 'Visit the auth_url to connect your Gmail account'
    })
  } catch (error) {
    return handleAPIError(error)
  }
}