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
import { GmailAccountManager } from '@/components/GmailAccounts/GmailAccountManager'

interface Insight {
  id: string
  category?: 'Risk' | 'Upsell' | 'Alignment' | 'Note'
  summary?: string
  evidence?: string
  suggested_action?: string
  confidence?: number
  feedback?: 'positive' | 'negative' | null
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
  const [userProfile, setUserProfile] = useState<{ onboarding_completed?: boolean } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<Array<{
    id: string;
    timestamp: string;
    level: string;
    component: string;
    message: string;
    metadata?: Record<string, unknown>;
  }>>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logFilters, setLogFilters] = useState({ level: 'all', component: 'all' })
  const [selectedGmailAccount, setSelectedGmailAccount] = useState<string | null>(null)
  const { showToast, ToastContainer } = useToast()

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

  // Check if user has completed onboarding
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserProfile()
    }
  }, [status])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedGmailAccount) {
        params.set('gmail_account_id', selectedGmailAccount)
      }
      
      const response = await fetch(`/api/insights?${params}`)
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

  useEffect(() => {
    if (session) {
      fetchInsights()
    }
  }, [session, selectedGmailAccount])

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

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      const params = new URLSearchParams({
        level: logFilters.level,
        component: logFilters.component,
        limit: '50'
      })
      
      const response = await fetch(`/api/logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        showToast('Failed to fetch logs', 'error')
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      showToast('Failed to fetch logs', 'error')
    } finally {
      setLogsLoading(false)
    }
  }

  const toggleLogs = () => {
    if (!showLogs && logs.length === 0) {
      fetchLogs()
    }
    setShowLogs(!showLogs)
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-100'
      case 'warn':
        return 'text-yellow-600 bg-yellow-100'
      case 'info':
        return 'text-blue-600 bg-blue-100'
      case 'debug':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
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
          Here&apos;s what&apos;s happening with your client relationships.
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

      {/* Gmail Account Management */}
      <div className="mb-8">
        <GmailAccountManager 
          onAccountChange={setSelectedGmailAccount}
          selectedAccountId={selectedGmailAccount}
        />
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
          
          {selectedGmailAccount && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Currently viewing insights from selected Gmail account only.
                Choose "All Accounts" above to see insights from all connected accounts.
              </p>
            </div>
          )}
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
        <div className="space-y-6">
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

          {/* Getting Started Tips */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="text-xl mr-2">💡</span>
                Tips for Getting Better Insights
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3 mt-0.5">
                      📧
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Sync Recent Emails</h3>
                      <p className="text-gray-600 text-sm">Connect your Gmail account and sync recent client communications. The AI works best with at least 10-20 email threads.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mr-3 mt-0.5">
                      👥
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Include Multiple Clients</h3>
                      <p className="text-gray-600 text-sm">Make sure your inbox contains communications with different clients to get a comprehensive analysis.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mr-3 mt-0.5">
                      🔄
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Regular Updates</h3>
                      <p className="text-gray-600 text-sm">Sync your emails regularly (daily or weekly) to maintain up-to-date relationship insights.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mr-3 mt-0.5">
                      💬
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Rich Conversations</h3>
                      <p className="text-gray-600 text-sm">The AI analyzes email content - longer, more detailed conversations provide richer insights than short responses.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 mr-3 mt-0.5">
                      📊
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Provide Feedback</h3>
                      <p className="text-gray-600 text-sm">Rate the insights as helpful or not helpful to improve the AI&apos;s accuracy over time.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 mr-3 mt-0.5">
                      🎯
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Focus on Business Emails</h3>
                      <p className="text-gray-600 text-sm">Ensure your inbox primarily contains business communications rather than personal or promotional emails.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onFeedback={submitFeedback}
            />
          ))}

          {/* Suggestions for improving insights */}
          {insights.length > 0 && insights.length < 10 && (
            <Card>
              <CardHeader>
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <span className="text-lg mr-2">🚀</span>
                  Get More Insights
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">
                  You have {insights.length} insight{insights.length !== 1 ? 's' : ''}. Here are some ways to discover more:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs mr-3">
                      📧
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sync More Emails</p>
                      <p className="text-xs text-gray-600">Import older conversations</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-green-600 text-xs mr-3">
                      🔄
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Regular Analysis</p>
                      <p className="text-xs text-gray-600">Run analysis weekly</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-xs mr-3">
                      ⭐
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Rate Insights</p>
                      <p className="text-xs text-gray-600">Improve AI accuracy</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Debug Logs Section */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Debug Logs</h2>
            <div className="flex items-center gap-3">
              {showLogs && (
                <>
                  <select
                    value={logFilters.level}
                    onChange={(e) => {
                      setLogFilters({...logFilters, level: e.target.value})
                      if (showLogs) fetchLogs()
                    }}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Levels</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                  <select
                    value={logFilters.component}
                    onChange={(e) => {
                      setLogFilters({...logFilters, component: e.target.value})
                      if (showLogs) fetchLogs()
                    }}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="all">All Components</option>
                    <option value="auth">Auth</option>
                    <option value="gmail-sync">Gmail Sync</option>
                    <option value="ai-processing">AI Processing</option>
                    <option value="database">Database</option>
                    <option value="api">API</option>
                  </select>
                  <Button
                    onClick={fetchLogs}
                    loading={logsLoading}
                    variant="outline"
                    size="sm"
                  >
                    🔄 Refresh
                  </Button>
                </>
              )}
              <Button
                onClick={toggleLogs}
                variant="outline"
                size="sm"
              >
                {showLogs ? '🔼 Hide Logs' : '🔽 Show Logs'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showLogs && (
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                <span className="text-gray-600">Loading logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No logs found for the selected filters.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  >
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{log.component}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-gray-700">{log.message}</div>
                      {log.metadata && (
                        <div className="mt-1 text-xs text-gray-500 font-mono">
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <ToastContainer />
    </DashboardLayout>
  )
}