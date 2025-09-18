'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface OnboardingData {
  businessType: string
  services: string[]
  clientTypes: string[]
  teamSize: string
  primaryGoals: string[]
}

const BUSINESS_TYPES = [
  { id: 'freelancer', label: 'Freelancer', description: 'Independent contractor working with multiple clients' },
  { id: 'agency', label: 'Agency', description: 'Team providing services to external clients' },
  { id: 'consultant', label: 'Consultant', description: 'Strategic advisor for businesses' },
  { id: 'saas', label: 'SaaS Company', description: 'Software company with recurring customers' },
  { id: 'service_business', label: 'Service Business', description: 'Business providing professional services' }
]

const SERVICE_OPTIONS = [
  'Web Development', 'Mobile App Development', 'UI/UX Design', 'Graphic Design',
  'Digital Marketing', 'SEO/SEM', 'Content Marketing', 'Social Media Management',
  'Business Consulting', 'Strategy Consulting', 'Financial Consulting', 'Legal Services',
  'Copywriting', 'Video Production', 'Photography', 'Branding', 'E-commerce',
  'Data Analytics', 'DevOps', 'IT Support', 'Other'
]

const CLIENT_TYPES = [
  'Startups', 'Small Businesses', 'Mid-size Companies', 'Enterprise', 
  'Non-profits', 'Government', 'E-commerce', 'SaaS Companies',
  'Healthcare', 'Finance', 'Education', 'Real Estate', 'Other'
]

const TEAM_SIZES = [
  { id: 'solo', label: 'Just me', description: 'Solo practitioner' },
  { id: 'small', label: '2-5 people', description: 'Small team' },
  { id: 'medium', label: '6-20 people', description: 'Medium team' },
  { id: 'large', label: '20+ people', description: 'Large organization' }
]

const PRIMARY_GOALS = [
  'Identify at-risk client relationships',
  'Find upselling opportunities', 
  'Improve client communication',
  'Track project health',
  'Manage client expectations',
  'Increase client retention',
  'Streamline client onboarding',
  'Monitor payment discussions'
]

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    businessType: '',
    services: [],
    clientTypes: [],
    teamSize: '',
    primaryGoals: []
  })

  const totalSteps = 5

  const handleArrayToggle = (field: keyof OnboardingData, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        console.error('Failed to save onboarding data')
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return data.businessType !== ''
      case 2: return data.services.length > 0
      case 3: return data.clientTypes.length > 0
      case 4: return data.teamSize !== ''
      case 5: return data.primaryGoals.length > 0
      default: return false
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <a href="/api/auth/signin" className="text-blue-600 hover:underline">
            Sign in with Google
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Step 1: Business Type */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">What type of business are you?</h2>
              <p className="text-gray-600 mb-6">This helps us understand your client relationships better.</p>
              
              <div className="space-y-3">
                {BUSINESS_TYPES.map(type => (
                  <div
                    key={type.id}
                    onClick={() => setData(prev => ({ ...prev, businessType: type.id }))}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      data.businessType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Services */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">What services do you offer?</h2>
              <p className="text-gray-600 mb-6">Select all that apply. This helps us understand your client projects.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {SERVICE_OPTIONS.map(service => (
                  <div
                    key={service}
                    onClick={() => handleArrayToggle('services', service)}
                    className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${
                      data.services.includes(service)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {service}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Client Types */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">What types of clients do you work with?</h2>
              <p className="text-gray-600 mb-6">This helps us identify relevant business conversations in your emails.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {CLIENT_TYPES.map(clientType => (
                  <div
                    key={clientType}
                    onClick={() => handleArrayToggle('clientTypes', clientType)}
                    className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${
                      data.clientTypes.includes(clientType)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {clientType}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Team Size */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">How big is your team?</h2>
              <p className="text-gray-600 mb-6">This helps us understand your business scale and communication patterns.</p>
              
              <div className="space-y-3">
                {TEAM_SIZES.map(size => (
                  <div
                    key={size.id}
                    onClick={() => setData(prev => ({ ...prev, teamSize: size.id }))}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      data.teamSize === size.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{size.label}</div>
                    <div className="text-sm text-gray-600">{size.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Primary Goals */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">What are your primary goals?</h2>
              <p className="text-gray-600 mb-6">Select the insights that matter most to your business success.</p>
              
              <div className="space-y-3">
                {PRIMARY_GOALS.map(goal => (
                  <div
                    key={goal}
                    onClick={() => handleArrayToggle('primaryGoals', goal)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      data.primaryGoals.includes(goal)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {goal}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : currentStep === totalSteps ? 'Complete Setup' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}