'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface GmailAccount {
  id: string
  gmail_address: string
  account_label?: string
  is_active: boolean
  created_at: string
}

interface GmailAccountManagerProps {
  onAccountChange?: (accountId: string | null) => void
  selectedAccountId?: string | null
}

export function GmailAccountManager({ onAccountChange, selectedAccountId }: GmailAccountManagerProps) {
  const [accounts, setAccounts] = useState<GmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [newAccountLabel, setNewAccountLabel] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/gmail-accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.error?.includes('gmail_accounts') && errorData.error?.includes('schema cache')) {
          // Schema cache issue - table exists but Supabase hasn't refreshed cache yet
          console.log('Gmail accounts table not in schema cache yet - this is normal after deployment')
          setAccounts([])
        } else {
          showToast('Failed to load Gmail accounts', 'error')
        }
      }
    } catch (error) {
      console.error('Error fetching Gmail accounts:', error)
      showToast('Error loading Gmail accounts', 'error')
    } finally {
      setLoading(false)
    }
  }

  const connectNewGmail = async () => {
    if (!newAccountLabel.trim()) {
      showToast('Please enter an account label', 'error')
      return
    }

    setConnecting(true)
    try {
      const response = await fetch('/api/gmail-accounts/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_label: newAccountLabel })
      })

      if (response.ok) {
        const data = await response.json()
        // Open OAuth popup
        window.open(data.auth_url, 'gmail-oauth', 'width=500,height=600')
        
        // Listen for OAuth completion
        const checkOAuthComplete = setInterval(() => {
          fetchAccounts()
        }, 2000)
        
        // Stop checking after 5 minutes
        setTimeout(() => clearInterval(checkOAuthComplete), 300000)
        
        setShowAddForm(false)
        setNewAccountLabel('')
        showToast('Follow the popup to connect your Gmail account', 'info')
      } else {
        showToast('Failed to start Gmail connection', 'error')
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      showToast('Error connecting Gmail account', 'error')
    } finally {
      setConnecting(false)
    }
  }

  const syncAccount = async (accountId: string) => {
    try {
      const response = await fetch('/api/sync-emails-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail_account_id: accountId })
      })

      if (response.ok) {
        const data = await response.json()
        showToast(data.message, 'success')
      } else {
        showToast('Failed to sync emails', 'error')
      }
    } catch (error) {
      console.error('Error syncing emails:', error)
      showToast('Error syncing emails', 'error')
    }
  }

  const syncAllAccounts = async () => {
    try {
      const response = await fetch('/api/sync-emails-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty body syncs all accounts
      })

      if (response.ok) {
        const data = await response.json()
        showToast(data.message, 'success')
      } else {
        showToast('Failed to sync all accounts', 'error')
      }
    } catch (error) {
      console.error('Error syncing all accounts:', error)
      showToast('Error syncing accounts', 'error')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
          <span>Loading Gmail accounts...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              📧 Connected Gmail Accounts
            </h3>
            <div className="flex gap-2">
              {accounts.length > 1 && (
                <Button 
                  onClick={syncAllAccounts}
                  variant="outline"
                  size="sm"
                >
                  🔄 Sync All
                </Button>
              )}
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant="primary"
                size="sm"
              >
                ➕ Add Gmail
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Connect New Gmail Account</h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newAccountLabel}
                  onChange={(e) => setNewAccountLabel(e.target.value)}
                  placeholder="Account label (e.g., 'Work Email', 'Client Email')"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={connectNewGmail}
                  loading={connecting}
                  size="sm"
                >
                  Connect
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Gmail accounts connected</h3>
              <p className="text-gray-600 mb-4">
                Connect your work email and client emails to get comprehensive relationship insights.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                Connect Your First Gmail Account
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* All Accounts Option */}
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAccountId === null 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onAccountChange?.(null)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                      📊
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">All Accounts</h4>
                      <p className="text-sm text-gray-600">View insights from all connected Gmail accounts</p>
                    </div>
                  </div>
                  <Badge variant="default">
                    {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {/* Individual Accounts */}
              {accounts.map((account) => (
                <div 
                  key={account.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAccountId === account.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onAccountChange?.(account.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                        📧
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {account.account_label || 'Gmail Account'}
                        </h4>
                        <p className="text-sm text-gray-600">{account.gmail_address}</p>
                        <p className="text-xs text-gray-500">
                          Connected {new Date(account.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          syncAccount(account.id)
                        }}
                        variant="outline"
                        size="sm"
                      >
                        🔄 Sync
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ToastContainer />
    </>
  )
}