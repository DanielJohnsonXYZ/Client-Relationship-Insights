'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Client {
  id: string
  name: string
  company: string
  email: string
  domain: string
  status: 'active' | 'prospective' | 'at_risk' | 'completed' | 'inactive'
  relationship_health: number
  current_project: string
  notes: string
  created_at: string
  updated_at: string
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'prospective', label: 'Prospective', color: 'bg-blue-100 text-blue-800' },
  { value: 'at_risk', label: 'At Risk', color: 'bg-red-100 text-red-800' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-yellow-100 text-yellow-800' }
]

const HEALTH_LABELS = {
  1: 'Poor',
  2: 'Fair', 
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
}

export default function ClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast, ToastContainer } = useToast()
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    domain: '',
    status: 'active' as Client['status'],
    relationship_health: 3,
    current_project: '',
    notes: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
    } else if (status === 'authenticated') {
      fetchClients()
    }
  }, [status, router])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      } else {
        showToast('Failed to fetch clients', 'error')
      }
    } catch (error) {
      showToast('Error loading clients', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast(
          editingClient ? 'Client updated successfully' : 'Client added successfully',
          'success'
        )
        resetForm()
        fetchClients()
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to save client', 'error')
      }
    } catch (error) {
      showToast('Error saving client', 'error')
    }
  }

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      domain: client.domain,
      status: client.status,
      relationship_health: client.relationship_health,
      current_project: client.current_project,
      notes: client.notes
    })
    setEditingClient(client)
    setShowAddForm(true)
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('Client deleted successfully', 'success')
        fetchClients()
      } else {
        showToast('Failed to delete client', 'error')
      }
    } catch (error) {
      showToast('Error deleting client', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      domain: '',
      status: 'active',
      relationship_health: 3,
      current_project: '',
      notes: ''
    })
    setEditingClient(null)
    setShowAddForm(false)
  }

  const getHealthColor = (health: number) => {
    if (health <= 2) return 'text-red-600'
    if (health === 3) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
              <p className="text-gray-600">Manage your client relationships and project details</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  console.log('Add Client clicked, showAddForm will be:', !showAddForm)
                  setShowAddForm(true)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add/Edit Client Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="john@acmecorp.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="acmecorp.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Client['status'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship Health: {HEALTH_LABELS[formData.relationship_health as keyof typeof HEALTH_LABELS]}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.relationship_health}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship_health: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Project
                  </label>
                  <input
                    type="text"
                    value={formData.current_project}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_project: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Website redesign"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about this client..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingClient ? 'Update Client' : 'Add Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Clients List */}
        {loading ? (
          <div className="text-center py-8">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No clients found</div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Client
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <div key={client.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    {client.company && (
                      <p className="text-sm text-gray-600">{client.company}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    STATUS_OPTIONS.find(s => s.value === client.status)?.color
                  }`}>
                    {STATUS_OPTIONS.find(s => s.value === client.status)?.label}
                  </span>
                </div>

                {client.email && (
                  <p className="text-sm text-gray-600 mb-2">📧 {client.email}</p>
                )}
                
                {client.domain && (
                  <p className="text-sm text-gray-600 mb-2">🌐 {client.domain}</p>
                )}

                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Relationship Health:</span>
                    <span className={`text-sm font-medium ${getHealthColor(client.relationship_health)}`}>
                      {HEALTH_LABELS[client.relationship_health as keyof typeof HEALTH_LABELS]}
                    </span>
                  </div>
                </div>

                {client.current_project && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-600">Current Project:</span>
                    <p className="text-sm font-medium text-gray-900">{client.current_project}</p>
                  </div>
                )}

                {client.notes && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Notes:</span>
                    <p className="text-sm text-gray-900 mt-1">{client.notes}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button
                    onClick={() => handleEdit(client)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}