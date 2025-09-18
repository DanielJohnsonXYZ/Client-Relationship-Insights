'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function DebugPage() {
  const { data: session, status } = useSession()
  const [profileData, setProfileData] = useState<any>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      // Test the onboarding API
      fetch('/api/onboarding')
        .then(res => res.json())
        .then(data => setProfileData(data))
        .catch(err => setProfileError(err.message))
    }
  }, [status])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Debug Information</h1>
        
        <div className="space-y-6">
          {/* Authentication Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> {status}</p>
              <p><strong>User ID:</strong> {session?.user?.id || 'None'}</p>
              <p><strong>Email:</strong> {session?.user?.email || 'None'}</p>
              <p><strong>Access Token:</strong> {session?.accessToken ? 'Present' : 'Missing'}</p>
            </div>
          </div>

          {/* Profile API Response */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Profile API Response</h2>
            {profileError ? (
              <div className="text-red-600">
                <p><strong>Error:</strong> {profileError}</p>
              </div>
            ) : profileData ? (
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            ) : (
              <p>Loading profile data...</p>
            )}
          </div>

          {/* Manual Navigation */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Manual Navigation</h2>
            <div className="space-x-4">
              <a href="/onboarding" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Go to Onboarding
              </a>
              <a href="/dashboard" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Go to Dashboard
              </a>
              <a href="/clients" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                Go to Clients
              </a>
              <a href="/api/auth/signin" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                Sign In
              </a>
            </div>
          </div>

          {/* Environment Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Environment Check</h2>
            <div className="space-y-2">
              <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server'}</p>
              <p><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'}</p>
            </div>
          </div>

          {/* Raw Session Data */}
          {session && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Raw Session Data</h2>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}