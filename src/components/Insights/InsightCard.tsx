'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge, getCategoryBadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

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

interface InsightCardProps {
  insight: Insight
  onFeedback: (insightId: string, feedback: 'positive' | 'negative') => void
}

export function InsightCard({ insight, onFeedback }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (insight.category) {
    // Structured insight
    return (
      <Card hover className="transition-all duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant={getCategoryBadgeVariant(insight.category)}>
                {insight.category}
              </Badge>
              {insight.confidence && (
                <span className="text-sm text-gray-500">
                  {Math.round(insight.confidence * 100)}% confidence
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {formatDate(insight.created_at)}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {insight.summary}
          </h3>

          {insight.evidence && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Evidence:</h4>
              <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600 bg-gray-50 py-2 rounded-r">
                &quot;{insight.evidence}&quot;
              </blockquote>
            </div>
          )}

          {insight.suggested_action && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Action:</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">{insight.suggested_action}</p>
              </div>
            </div>
          )}

          {insight.raw_output && (
            <div className="mt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                {isExpanded ? 'Hide' : 'Show'} raw AI response
                <svg
                  className={`ml-1 h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isExpanded && (
                <div className="mt-2 bg-gray-900 text-gray-100 text-xs p-3 rounded font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {insight.raw_output}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Was this helpful?</span>
              <Button
                size="sm"
                variant={insight.feedback === 'positive' ? 'primary' : 'ghost'}
                onClick={() => onFeedback(insight.id, 'positive')}
                className="text-xs"
              >
                👍
              </Button>
              <Button
                size="sm"
                variant={insight.feedback === 'negative' ? 'danger' : 'ghost'}
                onClick={() => onFeedback(insight.id, 'negative')}
                className="text-xs"
              >
                👎
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    )
  }

  if (insight.raw_output) {
    // Raw AI output
    return (
      <Card hover className="transition-all duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <Badge variant="purple">AI Analysis</Badge>
            <span className="text-xs text-gray-400">
              {formatDate(insight.created_at)}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            AI Response
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
              {insight.raw_output}
            </pre>
          </div>
        </CardContent>

        <CardFooter>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Was this helpful?</span>
            <Button
              size="sm"
              variant={insight.feedback === 'positive' ? 'primary' : 'ghost'}
              onClick={() => onFeedback(insight.id, 'positive')}
              className="text-xs"
            >
              👍
            </Button>
            <Button
              size="sm"
              variant={insight.feedback === 'negative' ? 'danger' : 'ghost'}
              onClick={() => onFeedback(insight.id, 'negative')}
              className="text-xs"
            >
              👎
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  }

  // Fallback for empty insights
  return (
    <Card className="opacity-50">
      <CardContent>
        <p className="text-gray-500 text-center py-4">No insight data available</p>
      </CardContent>
    </Card>
  )
}