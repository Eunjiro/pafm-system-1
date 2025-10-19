'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CitizenHeader from '@/components/CitizenHeader'

interface Barangay {
  id: number
  name: string
}

export default function WaterIssuePage() {
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
    issueType: 'NO_WATER_SUPPLY',
    description: '',
    accountNumber: '',
    urgencyLevel: 'MEDIUM',
    contactNumber: '',
    contactEmail: session?.user?.email || '',
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
      
      const response = await fetch('/api/water-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterName: session?.user?.name || 'Citizen User',
          contactNumber: formData.contactNumber,
          email: formData.contactEmail,
          accountNumber: formData.accountNumber || null,
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
        throw new Error(errorData.error || 'Failed to submit water issue report')
      }

      const data = await response.json()
      setTrackingNumber(data.data?.ticketNumber || 'N/A')
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Submission error:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit report. Please try again.')
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
            className="flex items-center text-sky-600 hover:text-sky-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Services
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Report Water Supply Issue</h1>
          <p className="mt-2 text-gray-600">
            Report water supply interruptions, contamination, low pressure, or other water-related concerns.
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
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
                Affected Location <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="Enter the specific location experiencing water supply issues"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="NO_WATER_SUPPLY">No Water Supply</option>
                <option value="LOW_PRESSURE">Low Water Pressure</option>
                <option value="DIRTY_WATER">Dirty Water/Contamination</option>
                <option value="WATER_LEAK">Water Leak</option>
                <option value="METER_PROBLEM">Water Meter Problem</option>
                <option value="BILLING_ISSUE">Billing Issue</option>
                <option value="PIPE_BURST">Pipe Burst</option>
                <option value="VALVE_MALFUNCTION">Valve Malfunction</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={5}
                placeholder="Provide detailed information about the water supply issue, when it started, and any relevant observations"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Water Account Number (Optional)
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Enter your water account number if applicable"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Providing your account number helps us locate and address the issue faster.
              </p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="LOW">Low - Minor inconvenience</option>
                <option value="MEDIUM">Medium - Moderate concern</option>
                <option value="HIGH">High - Significant impact</option>
                <option value="CRITICAL">Critical - Emergency affecting many households</option>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              />
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
                className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
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
              Report Submitted Successfully!
            </h3>
            <p className="text-center text-gray-600 mb-4">
              Your water issue report has been submitted. Your tracking number is:
            </p>
            <div className="bg-sky-50 border border-sky-200 rounded-md p-3 mb-6">
              <p className="text-center text-xl font-bold text-sky-700">{trackingNumber}</p>
            </div>
            <p className="text-sm text-center text-gray-500 mb-6">
              Please save this tracking number for future reference. You will receive updates via email.
            </p>
            <button
              onClick={handleCloseModal}
              className="w-full bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 transition-colors"
            >
              Track My Reports
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
