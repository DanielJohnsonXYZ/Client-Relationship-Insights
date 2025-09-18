import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const token = await getToken({ req: request })
    const userId = token?.userId || request.ip || 'anonymous'
    
    // Different limits for different endpoints
    const limits = {
      '/api/sync-emails': { requests: 5, window: 60000 }, // 5 requests per minute
      '/api/generate-insights': { requests: 3, window: 60000 }, // 3 requests per minute
      '/api/feedback': { requests: 30, window: 60000 }, // 30 requests per minute
      '/api/insights': { requests: 20, window: 60000 }, // 20 requests per minute
    }

    const limit = Object.entries(limits).find(([path]) => pathname.startsWith(path))?.[1]
    
    if (limit) {
      const key = `${userId}:${pathname}`
      const now = Date.now()
      const userLimit = rateLimitMap.get(key)

      if (userLimit) {
        if (now < userLimit.resetTime) {
          if (userLimit.count >= limit.requests) {
            return NextResponse.json(
              { error: 'Rate limit exceeded. Please try again later.' },
              { status: 429 }
            )
          }
          userLimit.count++
        } else {
          // Reset the rate limit
          rateLimitMap.set(key, { count: 1, resetTime: now + limit.window })
        }
      } else {
        rateLimitMap.set(key, { count: 1, resetTime: now + limit.window })
      }
    }
  }

  // Security headers for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // CSRF protection
    if (request.method !== 'GET') {
      const origin = request.headers.get('origin')
      const referer = request.headers.get('referer')
      const host = request.headers.get('host')
      
      // Check if origin matches our domain (in production)
      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = [
          `https://${host}`,
          process.env.NEXTAUTH_URL
        ].filter(Boolean)
        
        if (!origin || !allowedOrigins.includes(origin)) {
          return NextResponse.json(
            { error: 'Invalid origin' },
            { status: 403 }
          )
        }
      }
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}