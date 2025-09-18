import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createAPIError } from './api-errors'
import { Session } from 'next-auth'

export async function getAuthenticatedUser() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      throw createAPIError('No valid session found', 401, 'AUTHENTICATION_ERROR')
    }

    if (!session.accessToken) {
      throw createAPIError('No access token available', 401, 'ACCESS_TOKEN_ERROR')
    }

    if (!session.user.id) {
      throw createAPIError('Invalid user session', 401, 'INVALID_SESSION')
    }

    return {
      id: session.user.id,
      email: session.user.email,
      accessToken: session.accessToken
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createAPIError('Failed to validate authentication', 401, 'AUTH_VALIDATION_ERROR')
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