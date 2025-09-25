'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface Email {
  id: string
  subject: string
  sender: string
  recipient: string
  body: string
  received_date: string
  insights: Array<{
    id: string
    category: string
    summary: string
    confidence: number
  }>
}

interface Insight {
  id: string
  category: string
  summary: string
  evidence: string
  suggested_action: string
  confidence: number
  created_at: string
  email: {
    id: string
    subject: string
    sender: string
    received_date: string
  }
}

export default function SearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchMode, setSearchMode] = useState<'emails' | 'insights'>('emails')
  const [searchQuery, setSearchQuery] = useState('')
  const [sender, setSender] = useState('')
  const [domain, setDomain] = useState('')
  const [category, setCategory] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [emails, setEmails] = useState<Email[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const searchEmails = async () => {
    setLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (sender) params.set('sender', sender)
      if (domain) params.set('domain', domain)
      if (fromDate) params.set('from_date', fromDate)
      if (toDate) params.set('to_date', toDate)

      const response = await fetch(`/api/search/emails?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEmails(data.emails || [])
      } else {
        showToast('Failed to search emails', 'error')
      }
    } catch (error) {
      console.error('Search error:', error)
      showToast('Search failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const searchInsights = async () => {
    setLoading(true)
    setHasSearched(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (category) params.set('category', category)
      if (fromDate) params.set('from_date', fromDate)
      if (toDate) params.set('to_date', toDate)

      const response = await fetch(`/api/search/insights?${params}`)
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
      } else {
        showToast('Failed to search insights', 'error')
      }
    } catch (error) {
      console.error('Search error:', error)
      showToast('Search failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchMode === 'emails') {
      searchEmails()
    } else {
      searchInsights()
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSender('')
    setDomain('')
    setCategory('')
    setFromDate('')
    setToDate('')
    setEmails([])
    setInsights([])
    setHasSearched(false)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Risk': return 'bg-red-100 text-red-800'
      case 'Upsell': return 'bg-green-100 text-green-800'
      case 'Alignment': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) return null

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Search Communications & Insights
        </h1>
        <p className="text-gray-600">
          Find specific emails, conversations, and insights across your client communications.
        </p>
      </div>

      {/* Search Mode Toggle */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <span className="font-medium text-gray-700">Search in:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSearchMode('emails')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchMode === 'emails'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📧 Emails
              </button>
              <button
                onClick={() => setSearchMode('insights')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchMode === 'insights'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🤖 Insights
              </button>
            </div>
          </div>

          {/* Search Form */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Keywords
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchMode === 'emails' ? 'Search in subject & body...' : 'Search in insights...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {searchMode === 'emails' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Person
                  </label>
                  <input
                    type="text"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="john@company.com or John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Domain
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {searchMode === 'insights' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="Risk">Risk</option>
                  <option value="Upsell">Upsell</option>
                  <option value="Alignment">Alignment</option>
                  <option value="Note">Note</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSearch} loading={loading}>
              🔍 Search
            </Button>
            <Button onClick={clearSearch} variant="outline">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({searchMode === 'emails' ? emails.length : insights.length} found)
              </span>
            </h2>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mr-4"></div>
                <span>Searching...</span>
              </CardContent>
            </Card>
          ) : searchMode === 'emails' ? (
            <div className="space-y-4">
              {emails.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-600">No emails found matching your search criteria.</p>
                  </CardContent>
                </Card>
              ) : (
                emails.map((email) => (
                  <Card key={email.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{email.subject}</h3>
                          <p className="text-sm text-gray-600">From: {email.sender}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(email.received_date).toLocaleDateString()}
                          </p>
                        </div>
                        {email.insights.length > 0 && (
                          <div className="flex gap-2">
                            {email.insights.map((insight) => (
                              <Badge
                                key={insight.id}
                                className={getCategoryColor(insight.category)}
                              >
                                {insight.category}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {email.body.substring(0, 200)}...
                      </p>
                      {email.insights.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">AI Insights:</p>
                          {email.insights.map((insight) => (
                            <p key={insight.id} className="text-sm text-gray-600 mb-1">
                              • {insight.summary}
                            </p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {insights.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-gray-600">No insights found matching your search criteria.</p>
                  </CardContent>
                </Card>
              ) : (
                insights.map((insight) => (
                  <Card key={insight.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge className={getCategoryColor(insight.category)}>
                            {insight.category}
                          </Badge>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              From: {insight.email?.sender} • {new Date(insight.email?.received_date || insight.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Subject: {insight.email?.subject}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Confidence</div>
                          <div className="text-lg font-semibold text-blue-600">
                            {Math.round((insight.confidence || 0) * 100)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900">Summary</h4>
                          <p className="text-gray-700">{insight.summary}</p>
                        </div>
                        
                        {insight.evidence && (
                          <div>
                            <h4 className="font-medium text-gray-900">Evidence</h4>
                            <p className="text-gray-600 italic">"{insight.evidence}"</p>
                          </div>
                        )}
                        
                        {insight.suggested_action && (
                          <div>
                            <h4 className="font-medium text-gray-900">Suggested Action</h4>
                            <p className="text-gray-700">{insight.suggested_action}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <ToastContainer />
    </DashboardLayout>
  )
}