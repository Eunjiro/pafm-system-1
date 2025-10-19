'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CitizenHeader from '@/components/CitizenHeader'

interface Barangay {
  id: number
  name: string
}

export default function DrainageRequestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [loadingBarangays, setLoadingBarangays] = useState(true)

  const [formData, setFormData] = useState({
    barangayId: '',
    address: '',
    description: '',
    issueType: 'CLOGGED_DRAIN',
    urgencyLevel: 'MEDIUM',
    contactNumber: '',
    contactEmail: session?.user?.email || '',
    preferredSchedule: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Find selected barangay name
      const selectedBarangay = barangays.find(b => b.id === parseInt(formData.barangayId))
      
      const response = await fetch('/api/drainage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName: session?.user?.name || 'Citizen User',
          contactNumber: formData.contactNumber,
          email: formData.contactEmail,
          issueType: formData.issueType,
          description: formData.description,
          location: formData.address,
          barangay: selectedBarangay?.name || 'Unknown',
          specificAddress: formData.address,
          priority: formData.urgencyLevel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit drainage request')
      }

      const data = await response.json()
      setTrackingNumber(data.data?.ticketNumber || 'N/A')
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Submission error:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    router.push('/citizen/services/water-drainage/track-requests')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-cyan-600 hover:text-cyan-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Services
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Drainage Service Request</h1>
          <p className="mt-2 text-gray-600">
            Submit a request for drainage cleaning, repair, or maintenance services.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Barangay Selection */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="">Select your barangay</option>
                {barangays.map(barangay => (
                  <option key={barangay.id} value={barangay.id}>
                    {barangay.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complete Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="Enter the specific location where drainage service is needed"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type <span className="text-red-500">*</span>
              </label>
              <select
                name="issueType"
                value={formData.issueType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="CLOGGED_DRAIN">Clogged Drain</option>
                <option value="BROKEN_PIPE">Broken Pipe</option>
                <option value="FLOODING">Flooding</option>
                <option value="OVERFLOW">Overflow</option>
                <option value="MAINTENANCE">Maintenance Request</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={5}
                placeholder="Describe the drainage issue (e.g., clogged drainage, flooding, damaged drainage cover, etc.)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Urgency Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <select
                name="urgencyLevel"
                value={formData.urgencyLevel}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="LOW">Low - Minor issue, not urgent</option>
                <option value="MEDIUM">Medium - Moderate concern</option>
                <option value="HIGH">High - Significant problem</option>
                <option value="URGENT">Urgent - Emergency requiring immediate attention</option>
              </select>
            </div>

            {/* Contact Number */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                required
                placeholder="your.email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Preferred Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Inspection Date (Optional)
              </label>
              <input
                type="date"
                name="preferredSchedule"
                value={formData.preferredSchedule}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Suggest a preferred date for inspection. The actual schedule will be confirmed by staff.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
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
              Request Submitted Successfully!
            </h3>
            <p className="text-center text-gray-600 mb-4">
              Your drainage service request has been submitted. Your tracking number is:
            </p>
            <div className="bg-cyan-50 border border-cyan-200 rounded-md p-3 mb-6">
              <p className="text-center text-xl font-bold text-cyan-700">{trackingNumber}</p>
            </div>
            <p className="text-sm text-center text-gray-500 mb-6">
              Please save this tracking number for future reference. You will receive updates via email.
            </p>
            <button
              onClick={handleCloseModal}
              className="w-full bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors"
            >
              Track My Requests
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
