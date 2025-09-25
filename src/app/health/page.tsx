'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HealthStatus {
  status: string
  timestamp: string
  services: {
    database: string
    api: string
  }
  environment: string
  error?: string
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthData(data)
      setLastChecked(new Date())
    } catch (error) {
      console.error('Failed to fetch health status:', error)
      setHealthData({
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          database: 'error',
          api: 'error'
        },
        environment: 'unknown',
        error: 'Failed to connect to health endpoint'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '⚠️'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              System Health Status
            </h1>
            <p className="text-gray-600">
              Real-time monitoring of application services and dependencies
            </p>
          </div>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Auto-refresh indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              Auto-refreshing every 30 seconds
            </div>
            {lastChecked && (
              <div>
                Last checked: {lastChecked.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mr-4"></div>
              <span className="text-gray-600">Checking system status...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Overall Status</h2>
                <button
                  onClick={fetchHealthStatus}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
              
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">{getStatusIcon(healthData?.status || 'error')}</span>
                <div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData?.status || 'error')}`}>
                    {healthData?.status || 'Unknown'}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                    Environment: {healthData?.environment || 'Unknown'}
                  </div>
                </div>
              </div>

              {healthData?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <span className="text-red-800 font-medium">Error Details:</span>
                  </div>
                  <p className="text-red-700 mt-1">{healthData.error}</p>
                </div>
              )}
            </div>

            {/* Service Status */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Service Status</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Database */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl mr-4">
                      🗄️
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Database</h3>
                      <p className="text-gray-500 text-sm">Supabase PostgreSQL</p>
                    </div>
                  </div>
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData?.services.database || 'error')}`}>
                    <span className="mr-1">{getStatusIcon(healthData?.services.database || 'error')}</span>
                    {healthData?.services.database || 'Unknown'}
                  </div>
                </div>

                {/* API */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl mr-4">
                      ⚡
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">API Server</h3>
                      <p className="text-gray-500 text-sm">Next.js API Routes</p>
                    </div>
                  </div>
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData?.services.api || 'error')}`}>
                    <span className="mr-1">{getStatusIcon(healthData?.services.api || 'error')}</span>
                    {healthData?.services.api || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">System Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Timestamp</h3>
                  <p className="text-gray-600 font-mono">
                    {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Environment</h3>
                  <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    healthData?.environment === 'production' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {healthData?.environment || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📊 Go to Dashboard
                </Link>
                <Link
                  href="/debug"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  🔧 Debug Tools
                </Link>
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  📋 Raw API Response
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}