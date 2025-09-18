import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { AuthenticationError } from './errors'
import { Session } from 'next-auth'

export async function getAuthenticatedUser() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      throw new AuthenticationError('No valid session found')
    }

    if (!session.accessToken) {
      throw new AuthenticationError('No access token available')
    }

    if (!session.user.id) {
      throw new AuthenticationError('Invalid user session')
    }

    return {
      id: session.user.id,
      email: session.user.email,
      accessToken: session.accessToken
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new AuthenticationError('Failed to validate authentication')
  }
}

export function validateSession(session: Session | null) {
  if (!session?.user?.email) {
    return { valid: false, error: 'Not authenticated' }
  }

  if (!session.accessToken) {
    return { valid: false, error: 'No access token' }
  }

  if (!session.user.id) {
    return { valid: false, error: 'Invalid user session' }
  }

  return { valid: true }
}