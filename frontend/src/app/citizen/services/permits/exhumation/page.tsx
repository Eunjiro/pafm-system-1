"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import CitizenHeader from "@/components/CitizenHeader"

interface DeceasedData {
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  burialDate?: string
  burialLocation?: string
  plotNumber?: string
}

interface FormData {
  deceased: DeceasedData
  requestedDate: string
  requestedTime: string
  reason: string
  newDestination?: string
  specialRequests?: string
  contactPerson: string
  contactNumber: string
}

interface DocumentFile {
  type: 'death_certificate' | 'burial_permit' | 'court_order' | 'valid_id' | 'sworn_affidavit'
  file: File | null
  label: string
  required: boolean
}

export default function ExhumationPermit() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")

  const [formData, setFormData] = useState<FormData>({
    deceased: {
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      burialDate: "",
      burialLocation: "",
      plotNumber: ""
    },
    requestedDate: "",
    requestedTime: "",
    reason: "",
    newDestination: "",
    specialRequests: "",
    contactPerson: "",
    contactNumber: ""
  })

  const [documents, setDocuments] = useState<DocumentFile[]>([
    {
      type: 'death_certificate',
      file: null,
      label: 'Certified Copy of Death Certificate',
      required: true
    },
    {
      type: 'burial_permit',
      file: null,
      label: 'Original Burial Permit',
      required: true
    },
    {
      type: 'court_order',
      file: null,
      label: 'Court Order (if required)',
      required: false
    },
    {
      type: 'valid_id',
      file: null,
      label: 'Valid ID of Requester',
      required: true
    },
    {
      type: 'sworn_affidavit',
      file: null,
      label: 'Sworn Affidavit of Consent',
      required: true
    }
  ])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!['CITIZEN', 'EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  const handleDeceasedChange = (field: keyof DeceasedData, value: string) => {
    setFormData(prev => ({
      ...prev,
      deceased: {
        ...prev.deceased,
        [field]: value
      }
    }))
  }

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (type: DocumentFile['type'], file: File | null) => {
    setDocuments(prev => prev.map(doc => 
      doc.type === type ? { ...doc, file } : doc
    ))
  }

  const validateForm = (): boolean => {
    if (!formData.deceased.firstName || !formData.deceased.lastName) {
      setError('Deceased person\'s first name and last name are required')
      return false
    }

    if (!formData.requestedDate) {
      setError('Requested exhumation date is required')
      return false
    }

    if (!formData.reason) {
      setError('Reason for exhumation is required')
      return false
    }

    if (!formData.contactPerson || !formData.contactNumber) {
      setError('Contact person and number are required')
      return false
    }

    // Check required documents
    const missingDocs = documents.filter(doc => doc.required && !doc.file)
    if (missingDocs.length > 0) {
      setError(`Please upload required documents: ${missingDocs.map(doc => doc.label).join(', ')}`)
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Create FormData for permit submission
      const submitData = new FormData()
      submitData.append('permitType', 'EXHUMATION')
      submitData.append('deceasedFirstName', formData.deceased.firstName)
      submitData.append('deceasedMiddleName', formData.deceased.middleName || '')
      submitData.append('deceasedLastName', formData.deceased.lastName)
      submitData.append('deceasedSuffix', formData.deceased.suffix || '')
      submitData.append('burialDate', formData.deceased.burialDate || '')
      submitData.append('burialLocation', formData.deceased.burialLocation || '')
      submitData.append('plotNumber', formData.deceased.plotNumber || '')
      submitData.append('requestedDate', formData.requestedDate)
      submitData.append('requestedTime', formData.requestedTime)
      submitData.append('reason', formData.reason)
      submitData.append('newDestination', formData.newDestination || '')
      submitData.append('specialRequests', formData.specialRequests || '')
      submitData.append('contactPerson', formData.contactPerson)
      submitData.append('contactNumber', formData.contactNumber)
      submitData.append('submittedBy', session?.user?.id?.toString() || '')

      // Add documents
      documents.forEach(doc => {
        if (doc.file) {
          submitData.append(`document_${doc.type}`, doc.file)
          submitData.append(`documentType_${doc.type}`, doc.type)
        }
      })

      const response = await fetch('/api/citizen/permits', {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit exhumation permit request')
      }

      const permit = await response.json()
      setSuccess(`Exhumation permit request submitted successfully! Your permit ID is #${permit.data.id}. You will receive further instructions shortly.`)
      
      // Reset form
      setFormData({
        deceased: {
          firstName: "",
          middleName: "",
          lastName: "",
          suffix: "",
          burialDate: "",
          burialLocation: "",
          plotNumber: ""
        },
        requestedDate: "",
        requestedTime: "",
        reason: "",
        newDestination: "",
        specialRequests: "",
        contactPerson: "",
        contactNumber: ""
      })

      setDocuments(prev => prev.map(doc => ({ ...doc, file: null })))

      // Redirect to citizen dashboard after 3 seconds
      setTimeout(() => {
        router.push('/citizen')
      }, 3000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while submitting the permit request')
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CitizenHeader title="Exhumation Permit Request" showBackButton={true} backHref="/citizen/services" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Service Information */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Exhumation Permit Request</h2>
                <p className="text-gray-600">Apply for exhumation permit for transfer or reburial</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Processing Fee</h3>
                <p className="text-2xl font-bold text-orange-600">₱500.00</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Processing Time</h3>
                <p className="text-lg text-gray-700">5-7 business days</p>
              </div>
            </div>
          </div>

          {/* Required Documents */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Certified Copy of Death Certificate
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Original Burial Permit
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sworn Affidavit of Consent from family members
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Valid ID of applicant
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Court Order (if required by law)
              </li>
            </ul>
          </div>

          {/* Application Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Exhumation Permit Application</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Deceased Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Deceased Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.deceased.firstName}
                      onChange={(e) => handleDeceasedChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <input 
                      type="text" 
                      value={formData.deceased.middleName || ''}
                      onChange={(e) => handleDeceasedChange('middleName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.deceased.lastName}
                      onChange={(e) => handleDeceasedChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Burial Date</label>
                    <input 
                      type="date" 
                      value={formData.deceased.burialDate || ''}
                      onChange={(e) => handleDeceasedChange('burialDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Burial Location</label>
                    <input 
                      type="text" 
                      value={formData.deceased.burialLocation || ''}
                      onChange={(e) => handleDeceasedChange('burialLocation', e.target.value)}
                      placeholder="e.g., Section A, Block 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plot/Niche Number</label>
                    <input 
                      type="text" 
                      value={formData.deceased.plotNumber || ''}
                      onChange={(e) => handleDeceasedChange('plotNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                </div>
              </div>

              {/* Exhumation Details */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Exhumation Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested Exhumation Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={formData.requestedDate}
                      onChange={(e) => handleFormChange('requestedDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested Time</label>
                    <input 
                      type="time" 
                      value={formData.requestedTime}
                      onChange={(e) => handleFormChange('requestedTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Exhumation <span className="text-red-500">*</span></label>
                    <textarea 
                      value={formData.reason}
                      onChange={(e) => handleFormChange('reason', e.target.value)}
                      placeholder="Please provide detailed reason for exhumation (e.g., transfer to family plot, reburial)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Destination (if transfer)</label>
                    <input 
                      type="text" 
                      value={formData.newDestination || ''}
                      onChange={(e) => handleFormChange('newDestination', e.target.value)}
                      placeholder="New cemetery or location for reburial"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                    <textarea 
                      value={formData.specialRequests || ''}
                      onChange={(e) => handleFormChange('specialRequests', e.target.value)}
                      placeholder="Any special handling or requests"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.contactPerson}
                      onChange={(e) => handleFormChange('contactPerson', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      value={formData.contactNumber}
                      onChange={(e) => handleFormChange('contactNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Document Upload</h4>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.type}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {doc.label} {doc.required && <span className="text-red-500">*</span>}
                      </label>
                      <input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(doc.type, e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                        required={doc.required}
                      />
                      {doc.file && (
                        <p className="text-sm text-green-600 mt-1">✓ {doc.file.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-600">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link href="/citizen/services" className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
