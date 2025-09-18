import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Edge Runtime compatible rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(
  userId: string, 
  endpoint: string, 
  maxRequests: number, 
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${userId}:${endpoint}`
  const now = Date.now()
  
  const existing = rateLimitStore.get(key)
  
  if (existing) {
    if (now < existing.resetTime) {
      if (existing.count >= maxRequests) {
        return {
          allowed: false,
          remaining: Math.max(0, maxRequests - existing.count),
          resetTime: existing.resetTime
        }
      }
      
      existing.count++
      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - existing.count),
        resetTime: existing.resetTime
      }
    }
  }
  
  // Create new rate limit window
  const newLimit = { count: 1, resetTime: now + windowMs }
  rateLimitStore.set(key, newLimit)
  
  return {
    allowed: true,
    remaining: maxRequests - 1,
    resetTime: newLimit.resetTime
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const token = await getToken({ req: request })
    const fwd = request.headers.get('x-forwarded-for')
    const ip = fwd?.split(',')[0]?.trim()
    const userId = token?.userId || ip || 'anonymous'
    
    // Different limits for different endpoints
    const limits = {
      '/api/sync-emails': { requests: 5, window: 60000 },
      '/api/generate-insights': { requests: 3, window: 60000 },
      '/api/feedback': { requests: 30, window: 60000 },
      '/api/insights': { requests: 20, window: 60000 },
    }

    const limit = Object.entries(limits).find(([path]) => pathname.startsWith(path))?.[1]
    
    if (limit) {
      const rateLimitResult = checkRateLimit(
        userId, 
        pathname, 
        limit.requests, 
        limit.window
      )

      if (!rateLimitResult.allowed) {
        const response = NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', limit.requests.toString())
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
        response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString())
        
        return response
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