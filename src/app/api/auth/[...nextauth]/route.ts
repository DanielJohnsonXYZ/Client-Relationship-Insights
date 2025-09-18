import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth environment variables')
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET environment variable')
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
      
      // Check if token is expired and invalidate if so
      if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
        console.warn('Access token expired, invalidating session')
        // Clear the expired token to force re-authentication
        token.accessToken = undefined
        token.error = 'TokenExpired'
      }
      
      return token
    },
    async session({ session, token }) {
      // If token is expired or has error, return basic session without access token
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
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }