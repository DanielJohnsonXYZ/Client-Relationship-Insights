'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Insight {
  id: string
  category: 'Risk' | 'Upsell' | 'Alignment' | 'Note'
  summary: string
  evidence: string
  suggested_action: string
  confidence: number
  feedback: 'positive' | 'negative' | null
  created_at: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchInsights()
    }
  }, [session])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/insights')
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncEmails = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync-emails', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        alert(data.message)
      } else {
        alert('Error syncing emails: ' + data.error)
      }
    } catch (error) {
      alert('Error syncing emails')
    } finally {
      setSyncing(false)
    }
  }

  const generateInsights = async () => {
    setAnalyzing(true)
    try {
      const response = await fetch('/api/generate-insights', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        alert(data.message)
        fetchInsights()
      } else {
        alert('Error generating insights: ' + data.error)
      }
    } catch (error) {
      alert('Error generating insights')
    } finally {
      setAnalyzing(false)
    }
  }

  const submitFeedback = async (insightId: string, feedback: 'positive' | 'negative') => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId, feedback })
      })
      
      setInsights(insights.map(insight => 
        insight.id === insightId ? { ...insight, feedback } : insight
      ))
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Risk': return 'bg-red-100 text-red-800 border-red-200'
      case 'Upsell': return 'bg-green-100 text-green-800 border-green-200'
      case 'Alignment': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Note': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Client Relationship Insights
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={syncEmails}
              disabled={syncing}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
            >
              {syncing ? 'Syncing...' : 'Sync Emails'}
            </button>
            <button
              onClick={generateInsights}
              disabled={analyzing}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-md"
            >
              {analyzing ? 'Analyzing...' : 'Generate Insights'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading insights...</div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No insights found.</p>
            <p className="text-sm text-gray-500">
              Try syncing your emails and generating insights first.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {insights.map((insight) => (
              <div key={insight.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(insight.category)}`}>
                    {insight.category}
                  </span>
                  <div className="text-sm text-gray-500">
                    Confidence: {Math.round(insight.confidence * 100)}%
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {insight.summary}
                </h3>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Evidence:</h4>
                  <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded">
                    "{insight.evidence}"
                  </p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Suggested Action:</h4>
                  <p className="text-sm text-gray-900">
                    {insight.suggested_action}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Was this helpful?</span>
                    <button
                      onClick={() => submitFeedback(insight.id, 'positive')}
                      className={`text-lg ${insight.feedback === 'positive' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => submitFeedback(insight.id, 'negative')}
                      className={`text-lg ${insight.feedback === 'negative' ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                    >
                      👎
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(insight.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
