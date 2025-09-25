import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Client Relationship Insights
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered analysis for stronger client relationships
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Production Ready
          </div>
        </div>

        {/* Main Navigation */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link 
            href="/dashboard" 
            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl mb-0 mr-4">
                📊
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  Dashboard
                </h3>
                <p className="text-gray-600">Main application interface</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/api/auth/signin" 
            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mb-0 mr-4">
                🔐
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
                  Sign In
                </h3>
                <p className="text-gray-600">Authenticate with Google</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/health" 
            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-200 hover:border-purple-300"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mb-0 mr-4">
                🏥
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600">
                  Health Check
                </h3>
                <p className="text-gray-600">System status monitoring</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-4 mt-1">
                🤖
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">AI-Powered Analysis</h3>
                <p className="text-gray-600 text-sm">Automatically analyze communications to identify risks, opportunities, and relationship insights.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mr-4 mt-1">
                📧
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Gmail Integration</h3>
                <p className="text-gray-600 text-sm">Seamlessly sync and analyze your email communications with clients.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mr-4 mt-1">
                📊
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Real-time Dashboard</h3>
                <p className="text-gray-600 text-sm">Monitor client relationships with actionable insights and metrics.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mr-4 mt-1">
                🎯
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Actionable Recommendations</h3>
                <p className="text-gray-600 text-sm">Get specific suggestions for improving client relationships and outcomes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Endpoints</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono mr-3">POST</span>
              <code className="text-gray-700">/api/sync-emails</code>
              <span className="text-gray-500 ml-2">- Sync email communications</span>
            </div>
            <div className="flex items-center">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono mr-3">POST</span>
              <code className="text-gray-700">/api/generate-insights</code>
              <span className="text-gray-500 ml-2">- Generate AI insights</span>
            </div>
            <div className="flex items-center">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-mono mr-3">GET</span>
              <code className="text-gray-700">/api/insights</code>
              <span className="text-gray-500 ml-2">- Retrieve insights data</span>
            </div>
            <div className="flex items-center">
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-mono mr-3">POST</span>
              <code className="text-gray-700">/api/feedback</code>
              <span className="text-gray-500 ml-2">- Submit insight feedback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}