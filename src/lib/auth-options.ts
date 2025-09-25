import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import BasecampProvider from './basecamp-provider'
import { getGoogleCreds, getBasecampCreds, getNextAuthConfig } from './env'

function getAuthOptionsInternal(): NextAuthOptions {
  const googleCreds = getGoogleCreds()
  const basecampCreds = getBasecampCreds()
  const { secret } = getNextAuthConfig()

  const providers = [
    GoogleProvider({
      clientId: googleCreds.clientId,
      clientSecret: googleCreds.clientSecret,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly'
        }
      }
    })
  ]

  // Add Basecamp provider if credentials are available
  if (basecampCreds) {
    providers.push(
      BasecampProvider({
        clientId: basecampCreds.clientId,
        clientSecret: basecampCreds.clientSecret,
      })
    )
  }

  return {
    providers,
    callbacks: {
      async jwt({ token, account, user }) {
        if (account && user) {
          // Store tokens per provider
          if (account.provider === 'google') {
            token.googleAccessToken = account.access_token
            token.googleRefreshToken = account.refresh_token
            token.googleExpiresAt = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600000
          } else if (account.provider === 'basecamp') {
            token.basecampAccessToken = account.access_token
            token.basecampRefreshToken = account.refresh_token
            token.basecampAccounts = user.basecampAccounts
          }
          
          token.userId = user.id
          // Keep backwards compatibility for Google (primary provider)
          token.accessToken = account.provider === 'google' ? account.access_token : token.accessToken
        }
        
        // Check if Google token is expired (primary provider)
        if (token.googleExpiresAt && Date.now() > (token.googleExpiresAt as number)) {
          console.warn('Google access token expired, requesting fresh sign-in')
          // Return empty token to force sign out
          return {}
        }
        
        return token
      },
      async session({ session, token }) {
        if (!token.googleAccessToken && !token.accessToken) {
          // No Google access token means user needs to sign in again
          return null as any
        }
        
        return {
          ...session,
          // Primary provider (Google) for backwards compatibility
          accessToken: (token.googleAccessToken || token.accessToken) as string,
          // Additional provider tokens
          basecampAccessToken: token.basecampAccessToken as string | undefined,
          basecampAccounts: token.basecampAccounts as any[] | undefined,
          userId: token.userId as string,
          user: {
            ...session.user,
            id: token.userId as string
          }
        }
      }
    },
    pages: {
      signIn: '/auth/signin'
    },
    secret,
    session: {
      strategy: 'jwt',
      maxAge: 24 * 60 * 60 // 24 hours
    }
  }
}

export const authOptions = getAuthOptionsInternal()