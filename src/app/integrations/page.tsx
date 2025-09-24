'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/Layout/DashboardLayout'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  status: 'connected' | 'available' | 'coming_soon'
  category: 'email' | 'messaging' | 'video' | 'project'
  features: string[]
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Sync and analyze email communications with clients',
    icon: '📧',
    status: 'connected',
    category: 'email',
    features: ['Email analysis', 'Client detection', 'Thread insights']
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Monitor client conversations and team communications',
    icon: '💬',
    status: 'available',
    category: 'messaging',
    features: ['Channel monitoring', 'DM analysis', 'Client mentions']
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Analyze video calls and chat messages with clients',
    icon: '🎥',
    status: 'available',
    category: 'messaging',
    features: ['Chat analysis', 'Meeting insights', 'File sharing tracking']
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Track client communications on WhatsApp',
    icon: '📱',
    status: 'available',
    category: 'messaging',
    features: ['Message analysis', 'Business conversations', 'Response time tracking']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Monitor professional networking and messages',
    icon: '💼',
    status: 'coming_soon',
    category: 'messaging',
    features: ['Professional messages', 'Connection insights', 'Opportunity tracking']
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Analyze meeting recordings and chat logs',
    icon: '📹',
    status: 'coming_soon',
    category: 'video',
    features: ['Meeting transcripts', 'Sentiment analysis', 'Action items']
  }
]

export default function IntegrationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS)
  const [connecting, setConnecting] = useState<string | null>(null)
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleConnect = async (integrationId: string) => {
    setConnecting(integrationId)
    
    try {
      if (integrationId === 'gmail') {
        // Gmail is already connected via NextAuth
        showToast('Gmail is already connected!', 'info')
        return
      }
      
      if (integrationId === 'slack') {
        // Start Slack OAuth flow
        showToast('Slack integration coming soon!', 'info')
        return
      }
      
      // For other integrations
      showToast(`${integrationId} integration is being developed!`, 'info')
      
    } catch (error) {
      showToast('Failed to connect integration', 'error')
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    try {
      // Implement disconnect logic
      showToast(`${integrationId} disconnected`, 'success')
    } catch (error) {
      showToast('Failed to disconnect integration', 'error')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="success">Connected</Badge>
      case 'available':
        return <Badge variant="info">Available</Badge>
      case 'coming_soon':
        return <Badge variant="default">Coming Soon</Badge>
      default:
        return <Badge variant="default">Unknown</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'email': return '📧'
      case 'messaging': return '💬'
      case 'video': return '🎥'
      case 'project': return '📋'
      default: return '🔗'
    }
  }

  if (status === 'loading') {
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

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const availableCount = integrations.filter(i => i.status === 'available').length

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Communication Integrations
        </h1>
        <p className="text-gray-600">
          Connect your communication platforms to get comprehensive client insights.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-green-600">{connectedCount}</div>
            <div className="text-sm text-gray-600">Connected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-blue-600">{availableCount}</div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-gray-600">{integrations.length}</div>
            <div className="text-sm text-gray-600">Total Platforms</div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} hover className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(integration.status)}
                      <span className="text-xs text-gray-500">
                        {getCategoryIcon(integration.category)} {integration.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              <p className="text-gray-600 text-sm mb-4">
                {integration.description}
              </p>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {integration.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              {integration.status === 'connected' ? (
                <div className="flex space-x-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    fullWidth
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    Disconnect
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push(`/integrations/${integration.id}`)}
                  >
                    Settings
                  </Button>
                </div>
              ) : integration.status === 'available' ? (
                <Button
                  fullWidth
                  size="sm"
                  loading={connecting === integration.id}
                  onClick={() => handleConnect(integration.id)}
                >
                  Connect
                </Button>
              ) : (
                <Button
                  fullWidth
                  size="sm"
                  variant="outline"
                  disabled
                >
                  Coming Soon
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <Card className="mt-8">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            💡 Get Better Insights with More Platforms
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Why Connect Multiple Platforms?</h3>
              <ul className="space-y-1">
                <li>• Get a complete view of client relationships</li>
                <li>• Detect patterns across communication channels</li>
                <li>• Never miss important client signals</li>
                <li>• Track response times and engagement</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">What We Analyze:</h3>
              <ul className="space-y-1">
                <li>• Client satisfaction and sentiment</li>
                <li>• Project progress and roadblocks</li>
                <li>• Upsell and renewal opportunities</li>
                <li>• Communication patterns and preferences</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <ToastContainer />
    </DashboardLayout>
  )
}