export function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
          
          <div className="mb-4">
            <div className="h-4 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-6 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-6 animate-pulse"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex space-x-4 mb-6">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>

        <InsightsSkeleton />
      </main>
    </div>
  )
}