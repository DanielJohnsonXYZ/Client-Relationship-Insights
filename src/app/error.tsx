'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Something went wrong!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We encountered an unexpected error. Please try again.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left bg-gray-100 p-4 rounded">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
                {error.message}
              </pre>
            </details>
          )}
        </div>
        <div className="flex space-x-4 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}