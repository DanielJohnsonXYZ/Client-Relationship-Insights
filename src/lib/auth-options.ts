import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getGoogleCreds, getBasecampCreds, getNextAuthConfig } from './env'

export function getAuthOptions(): NextAuthOptions {
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

  // Basecamp provider removed for now

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

// For backwards compatibility and ease of use
// Note: This will be called at runtime only when the auth route is accessed
let _authOptions: NextAuthOptions | null = null

export function getAuthOptionsLazy(): NextAuthOptions {
  if (!_authOptions) {
    _authOptions = getAuthOptions()
  }
  return _authOptions
}

// For direct use in API routes (lazy evaluation)
export const authOptions = new Proxy({} as NextAuthOptions, {
  get(target, prop) {
    const options = getAuthOptionsLazy()
    return (options as any)[prop]
  }
})