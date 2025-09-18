export class APIError extends Error {
  public statusCode: number
  public userMessage: string

  constructor(message: string, statusCode: number = 500, userMessage?: string) {
    super(message)
    this.name = 'APIError'
    this.statusCode = statusCode
    this.userMessage = userMessage || 'An unexpected error occurred'
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'Please sign in to continue')
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'You do not have permission to access this resource')
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'The request contains invalid data')
    if (details) {
      this.userMessage = `Invalid input: ${details}`
    }
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'Too many requests. Please try again later')
  }
}

export class ExternalServiceError extends APIError {
  constructor(service: string, message: string) {
    super(`${service} error: ${message}`, 502, `Unable to connect to ${service}. Please try again later`)
  }
}

export function handleAPIError(error: unknown): { statusCode: number; message: string; userMessage: string } {
  console.error('API Error:', error)

  if (error instanceof APIError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      userMessage: error.userMessage
    }
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const userMessage = process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message

    return {
      statusCode: 500,
      message: error.message,
      userMessage
    }
  }

  return {
    statusCode: 500,
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred'
  }
}