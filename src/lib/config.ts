// Environment variable validation and configuration

function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function validateOptionalEnvVar(name: string, value: string | undefined, defaultValue: string): string {
  return value || defaultValue
}

// Validate and export environment variables
export const config = {
  // Database
  supabase: {
    url: validateEnvVar('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: validateEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: validateEnvVar('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  },
  
  // Authentication
  auth: {
    secret: validateEnvVar('NEXTAUTH_SECRET', process.env.NEXTAUTH_SECRET),
    url: validateOptionalEnvVar('NEXTAUTH_URL', process.env.NEXTAUTH_URL, 'http://localhost:3000'),
  },
  
  // Google OAuth
  google: {
    clientId: validateEnvVar('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID),
    clientSecret: validateEnvVar('GOOGLE_CLIENT_SECRET', process.env.GOOGLE_CLIENT_SECRET),
  },
  
  // AI
  anthropic: {
    apiKey: validateEnvVar('ANTHROPIC_API_KEY', process.env.ANTHROPIC_API_KEY),
  },
  
  // Email (optional)
  resend: {
    apiKey: process.env.RESEND_API_KEY, // Optional for MVP
  },
  
  // Application
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}

// Validate critical configuration at startup
export function validateConfig() {
  try {
    // Test that all required env vars are present
    const required = [
      config.supabase.url,
      config.supabase.anonKey,
      config.supabase.serviceRoleKey,
      config.auth.secret,
      config.google.clientId,
      config.google.clientSecret,
      config.anthropic.apiKey,
    ]

    console.log('✅ Environment configuration validated successfully')
    
    if (config.isDevelopment) {
      console.log('🔧 Running in development mode')
    } else if (config.isProduction) {
      console.log('🚀 Running in production mode')
    }
    
    return true
  } catch (error) {
    console.error('❌ Environment configuration validation failed:', error)
    throw error
  }
}

// Constants
export const APP_CONFIG = {
  name: 'Client Relationship Insights',
  description: 'AI-powered insights from your client communications',
  version: '1.0.0',
  
  // Rate limiting
  rateLimits: {
    syncEmails: { requests: 5, window: 60000 }, // 5 requests per minute
    generateInsights: { requests: 3, window: 60000 }, // 3 requests per minute
    feedback: { requests: 30, window: 60000 }, // 30 requests per minute
    insights: { requests: 20, window: 60000 }, // 20 requests per minute
  },
  
  // Gmail
  gmail: {
    maxResults: 100,
    processLimit: 50,
    daysToFetch: 30,
  },
  
  // AI
  ai: {
    maxEmailsPerThread: 10,
    maxContentLength: 10000,
    confidenceThreshold: 0.5,
  },
  
  // UI
  ui: {
    toastDuration: 5000,
    loadingSkeletonItems: 3,
  },
}