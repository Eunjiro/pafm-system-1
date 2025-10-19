'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CitizenHeader from '@/components/CitizenHeader'

interface Barangay {
  id: number
  name: string
}

export default function WaterConnectionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [loadingBarangays, setLoadingBarangays] = useState(true)

  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullName: session?.user?.name || '',
    contactNumber: '',
    contactEmail: session?.user?.email || '',
    
    // Step 2: Property Information
    barangayId: '',
    propertyAddress: '',
    propertyType: 'Residential',
    ownershipType: 'Owner',
    
    // Step 3: Connection Details
    connectionType: 'New Connection',
    purposeOfUse: 'Household',
    estimatedMonthlyUsage: '',
    numberOfOccupants: '',
    
    // Step 4: Technical Requirements
    meterType: 'Standard',
    pipeSize: '1/2 inch',
    existingWaterSource: 'None',
    
    // Step 5: Additional Information
    remarks: '',
    urgencyLevel: 'Normal',
  })

  // Load barangays on mount
  useState(() => {
    fetch('/api/barangays')
      .then(res => res.json())
      .then(data => {
        setBarangays(data.barangays || [])
        setLoadingBarangays(false)
      })
      .catch(err => {
        console.error('Failed to load barangays:', err)
        setLoadingBarangays(false)
      })
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.fullName && formData.contactNumber && formData.contactEmail)
      case 2:
        return !!(formData.barangayId && formData.propertyAddress && formData.propertyType && formData.ownershipType)
      case 3:
        return !!(formData.connectionType && formData.purposeOfUse)
      case 4:
        return !!(formData.meterType && formData.pipeSize)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    } else {
      alert('Please fill in all required fields before proceeding.')
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(currentStep)) {
      alert('Please fill in all required fields.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/water-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          barangayId: parseInt(formData.barangayId),
          estimatedMonthlyUsage: formData.estimatedMonthlyUsage ? parseFloat(formData.estimatedMonthlyUsage) : null,
          numberOfOccupants: formData.numberOfOccupants ? parseInt(formData.numberOfOccupants) : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit water connection application')
      }

      const data = await response.json()
      setTrackingNumber(data.application.trackingNumber)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    router.push('/citizen/services/water-drainage/track-requests')
  }

  const steps = [
    'Personal Information',
    'Property Details',
    'Connection Requirements',
    'Technical Specifications',
    'Review & Submit'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Services
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Water Connection Application</h1>
          <p className="mt-2 text-gray-600">
            Apply for a new water connection or service upgrade. Complete all steps to submit your application.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep > index + 1
                        ? 'bg-green-500 text-white'
                        : currentStep === index + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > index + 1 ? '✓' : index + 1}
                  </div>
                  <p
                    className={`text-xs mt-2 text-center ${
                      currentStep === index + 1 ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {step}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="09XX XXX XXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Property Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barangay <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="barangayId"
                    value={formData.barangayId}
                    onChange={handleInputChange}
                    required
                    disabled={loadingBarangays}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select your barangay</option>
                    {barangays.map(barangay => (
                      <option key={barangay.id} value={barangay.id}>
                        {barangay.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complete Property Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="propertyAddress"
                    value={formData.propertyAddress}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    placeholder="Enter the complete address where water connection will be installed"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Institutional">Institutional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ownership Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="ownershipType"
                    value={formData.ownershipType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Owner">Property Owner</option>
                    <option value="Renter">Renter/Lessee</option>
                    <option value="Authorized">Authorized Representative</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Connection Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Connection Requirements</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Connection Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="connectionType"
                    value={formData.connectionType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="New Connection">New Connection</option>
                    <option value="Reconnection">Reconnection</option>
                    <option value="Upgrade">Service Upgrade</option>
                    <option value="Transfer">Transfer of Ownership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose of Use <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="purposeOfUse"
                    value={formData.purposeOfUse}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Household">Household Use</option>
                    <option value="Business">Business/Commercial</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Mixed">Mixed Use</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Monthly Usage (cubic meters)
                  </label>
                  <input
                    type="number"
                    name="estimatedMonthlyUsage"
                    value={formData.estimatedMonthlyUsage}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    placeholder="Optional: Estimated water consumption per month"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Occupants
                  </label>
                  <input
                    type="number"
                    name="numberOfOccupants"
                    value={formData.numberOfOccupants}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="Number of people in the household/establishment"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Technical Requirements */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Specifications</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meter Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="meterType"
                    value={formData.meterType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Standard">Standard Meter</option>
                    <option value="Digital">Digital Meter</option>
                    <option value="Smart">Smart Meter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pipe Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="pipeSize"
                    value={formData.pipeSize}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1/2 inch">1/2 inch (Standard Residential)</option>
                    <option value="3/4 inch">3/4 inch (Medium Residential)</option>
                    <option value="1 inch">1 inch (Large Residential/Small Commercial)</option>
                    <option value="1.5 inch">1.5 inch (Commercial)</option>
                    <option value="2 inch">2 inch (Large Commercial/Industrial)</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Select based on your property size and estimated usage.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Existing Water Source
                  </label>
                  <select
                    name="existingWaterSource"
                    value={formData.existingWaterSource}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="None">None</option>
                    <option value="Deep Well">Deep Well</option>
                    <option value="Shallow Well">Shallow Well</option>
                    <option value="Water Delivery">Water Delivery Service</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 5: Review & Submit */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Additional Information</h2>
                
                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-blue-900">Application Summary</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Applicant:</p>
                      <p className="font-medium text-gray-900">{formData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Contact:</p>
                      <p className="font-medium text-gray-900">{formData.contactNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Property Type:</p>
                      <p className="font-medium text-gray-900">{formData.propertyType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Connection Type:</p>
                      <p className="font-medium text-gray-900">{formData.connectionType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Meter Type:</p>
                      <p className="font-medium text-gray-900">{formData.meterType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Pipe Size:</p>
                      <p className="font-medium text-gray-900">{formData.pipeSize}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Remarks or Special Requests
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Any additional information or special requirements (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level
                  </label>
                  <select
                    name="urgencyLevel"
                    value={formData.urgencyLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Normal">Normal (Standard Processing)</option>
                    <option value="Urgent">Urgent (Expedited Processing)</option>
                    <option value="Emergency">Emergency (Immediate Need)</option>
                  </select>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> After submission, our team will review your application and contact you 
                    within 3-5 business days to schedule a site inspection and provide further instructions.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <div className="flex-1" />
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Application Submitted Successfully!
            </h3>
            <p className="text-center text-gray-600 mb-4">
              Your water connection application has been submitted. Your tracking number is:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
              <p className="text-center text-xl font-bold text-blue-700">{trackingNumber}</p>
            </div>
            <p className="text-sm text-center text-gray-500 mb-6">
              Please save this tracking number for future reference. You will receive updates via email 
              and we will contact you to schedule a site inspection.
            </p>
            <button
              onClick={handleCloseModal}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Track My Applications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
