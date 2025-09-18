import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getGoogleCreds, getNextAuthConfig } from './env'

function getAuthOptionsInternal(): NextAuthOptions {
  const { clientId, clientSecret } = getGoogleCreds()
  const { secret } = getNextAuthConfig()

  return {
    providers: [
      GoogleProvider({
        clientId,
        clientSecret,
        authorization: {
          params: {
            scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly'
          }
        }
      })
    ],
    callbacks: {
      async jwt({ token, account, user }) {
        if (account && user) {
          token.accessToken = account.access_token
          token.refreshToken = account.refresh_token
          token.userId = user.id
          token.expiresAt = account.expires_at ? account.expires_at * 1000 : Date.now() + 3600000
        }
        
        if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
          console.warn('Access token expired, requesting fresh sign-in')
          // Return empty token to force sign out
          return {}
        }
        
        return token
      },
      async session({ session, token }) {
        if (!token.accessToken) {
          // No access token means user needs to sign in again
          return null as any
        }
        
        return {
          ...session,
          accessToken: token.accessToken as string,
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