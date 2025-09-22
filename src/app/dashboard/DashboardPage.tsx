'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { InsightCard } from '@/components/Insights/InsightCard'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { InsightsSkeleton } from '@/components/LoadingSkeleton'

interface Insight {
  id: string
  category?: 'Risk' | 'Upsell' | 'Alignment' | 'Note'
  summary?: string
  evidence?: string
  suggested_action?: string
  confidence?: number
  feedback?: 'positive' | 'negative' | null
  raw_output?: string
  created_at: string
}

interface DashboardStats {
  totalInsights: number
  riskInsights: number
  upsellInsights: number
  recentActivity: number
}

export function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const { showToast, ToastContainer } = useToast()

  // Check if user has completed onboarding
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserProfile()
    }
  }, [status])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/onboarding')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.profile)
        if (!data.profile?.onboarding_completed) {
          router.push('/onboarding')
          return
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

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
      showToast('Failed to fetch insights', 'error')
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
        showToast(data.message, 'success')
      } else {
        showToast('Error syncing emails: ' + data.error, 'error')
      }
    } catch (error) {
      showToast('Error syncing emails', 'error')
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
        showToast(data.message, 'success')
        fetchInsights()
      } else {
        showToast('Error generating insights: ' + data.error, 'error')
      }
    } catch (error) {
      showToast('Error generating insights', 'error')
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
      
      showToast('Feedback recorded', 'success')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      showToast('Failed to record feedback', 'error')
    }
  }

  const calculateStats = (): DashboardStats => {
    const totalInsights = insights.length
    const riskInsights = insights.filter(i => i.category === 'Risk').length
    const upsellInsights = insights.filter(i => i.category === 'Upsell').length
    const recentActivity = insights.filter(i => {
      const created = new Date(i.created_at)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return created > weekAgo
    }).length

    return { totalInsights, riskInsights, upsellInsights, recentActivity }
  }

  if (status === 'loading' || profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  if (!userProfile?.onboarding_completed) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Redirecting to onboarding...</p>
        </div>
      </DashboardLayout>
    )
  }

  const stats = calculateStats()

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {session.user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your client relationships.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalInsights}</div>
            <div className="text-sm text-gray-600">Total Insights</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.riskInsights}</div>
            <div className="text-sm text-gray-600">Risk Alerts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.upsellInsights}</div>
            <div className="text-sm text-gray-600">Opportunities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.recentActivity}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => router.push('/clients')}
              variant="outline"
            >
              👥 Manage Clients
            </Button>
            <Button
              onClick={syncEmails}
              loading={syncing}
              variant="outline"
            >
              📧 Sync Communications
            </Button>
            <Button
              onClick={generateInsights}
              loading={analyzing}
              variant="primary"
            >
              🤖 Generate New Insights
            </Button>
            <Button
              onClick={() => router.push('/integrations')}
              variant="outline"
            >
              🔗 Add Integrations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Insights</h2>
          <Badge variant="default">
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Insights List */}
      {loading ? (
        <InsightsSkeleton />
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h3>
            <p className="text-gray-600 mb-6">
              Start by syncing your communications and generating AI insights to understand your client relationships better.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={syncEmails} loading={syncing}>
                Sync Communications
              </Button>
              <Button onClick={generateInsights} loading={analyzing} variant="outline">
                Generate Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onFeedback={submitFeedback}
            />
          ))}
        </div>
      )}

      <ToastContainer />
    </DashboardLayout>
  )
}