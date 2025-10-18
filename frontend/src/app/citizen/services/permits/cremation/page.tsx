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
  sex?: string
  dateOfBirth?: string
  dateOfDeath?: string
  age?: number
  placeOfDeath?: string
  residenceAddress?: string
  citizenship?: string
  civilStatus?: string
  occupation?: string
  causeOfDeath?: string
  covidRelated: boolean
}

interface FormData {
  deceased: DeceasedData
  requestedDate: string
  requestedTime: string
  crematorium?: string
  ashesDisposition?: string
  specialRequests?: string
  contactPerson: string
  contactNumber: string
}

interface DocumentFile {
  type: 'death_certificate' | 'valid_id' | 'medical_certificate' | 'cremation_authorization'
  file: File | null
  label: string
  required: boolean
}

export default function CremationPermit() {
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
      sex: "",
      dateOfBirth: "",
      dateOfDeath: "",
      age: undefined,
      placeOfDeath: "",
      residenceAddress: "",
      citizenship: "Filipino",
      civilStatus: "",
      occupation: "",
      causeOfDeath: "",
      covidRelated: false
    },
    requestedDate: "",
    requestedTime: "",
    crematorium: "",
    ashesDisposition: "",
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
      type: 'valid_id',
      file: null,
      label: 'Valid ID of Requester',
      required: true
    },
    {
      type: 'medical_certificate',
      file: null,
      label: 'Medical Certificate of Cause of Death',
      required: true
    },
    {
      type: 'cremation_authorization',
      file: null,
      label: 'Written Authorization for Cremation',
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

  const handleDeceasedChange = (field: keyof DeceasedData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      deceased: {
        ...prev.deceased,
        [field]: value
      }
    }))

    // Auto-calculate age if birth and death dates are provided
    if ((field === 'dateOfBirth' || field === 'dateOfDeath') && 
        formData.deceased.dateOfBirth && formData.deceased.dateOfDeath) {
      const birth = new Date(field === 'dateOfBirth' ? value as string : formData.deceased.dateOfBirth)
      const death = new Date(field === 'dateOfDeath' ? value as string : formData.deceased.dateOfDeath)
      const ageInMs = death.getTime() - birth.getTime()
      const ageInYears = Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000))
      
      setFormData(prev => ({
        ...prev,
        deceased: {
          ...prev.deceased,
          age: ageInYears >= 0 ? ageInYears : undefined
        }
      }))
    }
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

    if (!formData.deceased.dateOfDeath) {
      setError('Date of death is required')
      return false
    }

    if (!formData.requestedDate) {
      setError('Requested cremation date is required')
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
      // First, create or get the deceased record
      const deceasedResponse = await fetch('/api/deceased', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData.deceased)
      })

      if (!deceasedResponse.ok) {
        const errorData = await deceasedResponse.json()
        throw new Error(errorData.error || 'Failed to create deceased record')
      }

      const deceasedRecord = await deceasedResponse.json()

      // Create FormData for permit submission
      const submitData = new FormData()
      submitData.append('permitType', 'CREMATION')
      submitData.append('deceasedId', deceasedRecord.data.id.toString())
      submitData.append('requestedDate', formData.requestedDate)
      submitData.append('requestedTime', formData.requestedTime)
      submitData.append('crematorium', formData.crematorium || '')
      submitData.append('ashesDisposition', formData.ashesDisposition || '')
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
        throw new Error(errorData.error || 'Failed to submit cremation permit request')
      }

      const permit = await response.json()
      setSuccess(`Cremation permit request submitted successfully! Your permit ID is #${permit.data.id}. You will receive further instructions shortly.`)
      
      // Reset form
      setFormData({
        deceased: {
          firstName: "",
          middleName: "",
          lastName: "",
          suffix: "",
          sex: "",
          dateOfBirth: "",
          dateOfDeath: "",
          age: undefined,
          placeOfDeath: "",
          residenceAddress: "",
          citizenship: "Filipino",
          civilStatus: "",
          occupation: "",
          causeOfDeath: "",
          covidRelated: false
        },
        requestedDate: "",
        requestedTime: "",
        crematorium: "",
        ashesDisposition: "",
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

  if (!session || !['CITIZEN', 'EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CitizenHeader title="Cremation Permit Request" showBackButton={true} backHref="/citizen/services" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Service Information */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 1.657-4.343 1.657-4.343a8 8 0 019.657 9.657z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Cremation Permit Request</h2>
                <p className="text-gray-600">Apply for cremation permit and authorization</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Processing Fee</h3>
                <p className="text-2xl font-bold text-red-600">₱200.00</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Processing Time</h3>
                <p className="text-lg text-gray-700">3-5 business days</p>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Cremation Permit Application</h3>
            
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <input 
                      type="text" 
                      value={formData.deceased.middleName || ''}
                      onChange={(e) => handleDeceasedChange('middleName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.deceased.lastName}
                      onChange={(e) => handleDeceasedChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={formData.deceased.dateOfBirth || ''}
                      onChange={(e) => handleDeceasedChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={formData.deceased.dateOfDeath || ''}
                      onChange={(e) => handleDeceasedChange('dateOfDeath', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                    <select 
                      value={formData.deceased.sex || ''}
                      onChange={(e) => handleDeceasedChange('sex', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cremation Details */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Cremation Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested Cremation Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      value={formData.requestedDate}
                      onChange={(e) => handleFormChange('requestedDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested Time</label>
                    <input 
                      type="time" 
                      value={formData.requestedTime}
                      onChange={(e) => handleFormChange('requestedTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Crematorium</label>
                    <input 
                      type="text" 
                      value={formData.crematorium || ''}
                      onChange={(e) => handleFormChange('crematorium', e.target.value)}
                      placeholder="Name of crematorium"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Disposition of Ashes</label>
                    <select 
                      value={formData.ashesDisposition || ''}
                      onChange={(e) => handleFormChange('ashesDisposition', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select disposition</option>
                      <option value="family_custody">Family Custody</option>
                      <option value="columbarium">Columbarium</option>
                      <option value="scattering">Scattering</option>
                      <option value="burial">Burial of Ashes</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                    <textarea 
                      value={formData.specialRequests || ''}
                      onChange={(e) => handleFormChange('specialRequests', e.target.value)}
                      placeholder="Any special requests or considerations"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      value={formData.contactNumber}
                      onChange={(e) => handleFormChange('contactNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
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
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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