import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

function getAuthOptions(): NextAuthOptions {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth environment variables')
  }
  if (!nextAuthSecret) {
    throw new Error('Missing NEXTAUTH_SECRET environment variable')
  }

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
          console.warn('Access token expired, invalidating session')
          token.accessToken = undefined
          token.error = 'TokenExpired'
        }
        
        return token
      },
      async session({ session, token }) {
        if (token.error === 'TokenExpired' || !token.accessToken) {
          return session
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
    secret: nextAuthSecret,
    session: {
      strategy: 'jwt',
      maxAge: 24 * 60 * 60 // 24 hours
    }
  }
}

export const authOptions = getAuthOptions()
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }