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
  informantName: string
  informantRelationship: string
  informantContact: string
}

interface DocumentFile {
  type: 'form_103' | 'valid_id' | 'covid_swab'
  file: File | null
  label: string
  required: boolean
}

export default function RegularDeathRegistration() {
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
    informantName: "",
    informantRelationship: "",
    informantContact: ""
  })

  const [documents, setDocuments] = useState<DocumentFile[]>([
    {
      type: 'form_103',
      file: null,
      label: 'Municipal Form 103 (Death Certificate Form)',
      required: true
    },
    {
      type: 'valid_id',
      file: null,
      label: 'Valid ID of informant',
      required: true
    },
    {
      type: 'covid_swab',
      file: null,
      label: 'Swab Test Result (if Covid-related death)',
      required: false
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
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (documentType: DocumentFile['type'], file: File | null) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.type === documentType 
          ? { ...doc, file }
          : doc
      )
    )
  }

  const calculateAge = (birthDate: string, deathDate: string): number => {
    const birth = new Date(birthDate)
    const death = new Date(deathDate)
    let age = death.getFullYear() - birth.getFullYear()
    const monthDiff = death.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  useEffect(() => {
    if (formData.deceased.dateOfBirth && formData.deceased.dateOfDeath) {
      const age = calculateAge(formData.deceased.dateOfBirth, formData.deceased.dateOfDeath)
      handleDeceasedChange('age', age)
    }
  }, [formData.deceased.dateOfBirth, formData.deceased.dateOfDeath])

  const validateForm = (): string | null => {
    // Basic validation
    if (!formData.deceased.firstName.trim()) return "Deceased first name is required"
    if (!formData.deceased.lastName.trim()) return "Deceased last name is required"
    if (!formData.informantName.trim()) return "Informant name is required"
    
    // Document validation
    const requiredDocs = documents.filter(doc => doc.required)
    for (const doc of requiredDocs) {
      if (!doc.file) {
        return `${doc.label} is required`
      }
    }

    // COVID-related validation
    if (formData.deceased.covidRelated) {
      const covidDoc = documents.find(doc => doc.type === 'covid_swab')
      if (!covidDoc?.file) {
        return "COVID swab test result is required for COVID-related deaths"
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add the registration data
      submitData.append('registrationType', 'REGULAR')
      submitData.append('deceased', JSON.stringify(formData.deceased))
      submitData.append('informantName', formData.informantName)
      submitData.append('informantRelationship', formData.informantRelationship)
      submitData.append('informantContact', formData.informantContact)
      submitData.append('submittedBy', session?.user?.id?.toString() || '')
      submitData.append('amountDue', '50.00')

      // Add documents
      documents.forEach(doc => {
        if (doc.file) {
          submitData.append(`document_${doc.type}`, doc.file)
          submitData.append(`documentType_${doc.type}`, doc.type)
        }
      })

      const response = await fetch('/api/citizen/death-registrations', {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit death registration')
      }

      const registration = await response.json()
      setSuccess(`Death registration submitted successfully! Your registration ID is #${registration.id}. You will receive payment instructions shortly.`)
      
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
        informantName: "",
        informantRelationship: "",
        informantContact: ""
      })

      setDocuments(prev => prev.map(doc => ({ ...doc, file: null })))

      // Redirect to citizen dashboard after 3 seconds
      setTimeout(() => {
        router.push('/citizen')
      }, 3000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while submitting the registration')
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
      <CitizenHeader title="Regular Death Registration" showBackButton={true} backHref="/citizen/services" />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Service Information */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Regular Death Registration</h2>
                <p className="text-gray-600">Register a death within 30 days of occurrence</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Processing Fee</h3>
                <p className="text-2xl font-bold text-green-600">₱50.00</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Processing Time</h3>
                <p className="text-gray-600">Same day processing</p>
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
                Municipal Form 103 (Death Certificate Form)
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Valid ID of informant
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Swab Test Result (if Covid-related death)
              </li>
            </ul>
          </div>

          {/* Registration Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Registration Form</h3>
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Deceased Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Deceased Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.deceased.firstName}
                      onChange={(e) => handleDeceasedChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <input 
                      type="text" 
                      value={formData.deceased.middleName}
                      onChange={(e) => handleDeceasedChange('middleName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.deceased.lastName}
                      onChange={(e) => handleDeceasedChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
                    <select 
                      value={formData.deceased.suffix}
                      onChange={(e) => handleDeceasedChange('suffix', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">None</option>
                      <option value="Jr.">Jr.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                    <select 
                      value={formData.deceased.sex}
                      onChange={(e) => handleDeceasedChange('sex', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input 
                      type="date" 
                      value={formData.deceased.dateOfBirth}
                      onChange={(e) => handleDeceasedChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.deceased.dateOfDeath}
                      onChange={(e) => handleDeceasedChange('dateOfDeath', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input 
                      type="number" 
                      value={formData.deceased.age || ''}
                      onChange={(e) => handleDeceasedChange('age', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                      readOnly={!!(formData.deceased.dateOfBirth && formData.deceased.dateOfDeath)}
                      placeholder={formData.deceased.dateOfBirth && formData.deceased.dateOfDeath ? "Auto-calculated" : "Enter age"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Place of Death</label>
                    <input 
                      type="text" 
                      value={formData.deceased.placeOfDeath}
                      onChange={(e) => handleDeceasedChange('placeOfDeath', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                    <select 
                      value={formData.deceased.civilStatus}
                      onChange={(e) => handleDeceasedChange('civilStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Separated">Separated</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Residence Address</label>
                    <textarea 
                      rows={2}
                      value={formData.deceased.residenceAddress}
                      onChange={(e) => handleDeceasedChange('residenceAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Citizenship</label>
                    <input 
                      type="text" 
                      value={formData.deceased.citizenship}
                      onChange={(e) => handleDeceasedChange('citizenship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <input 
                      type="text" 
                      value={formData.deceased.occupation}
                      onChange={(e) => handleDeceasedChange('occupation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cause of Death</label>
                    <textarea 
                      rows={2}
                      value={formData.deceased.causeOfDeath}
                      onChange={(e) => handleDeceasedChange('causeOfDeath', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={formData.deceased.covidRelated}
                        onChange={(e) => handleDeceasedChange('covidRelated', e.target.checked)}
                        className="mr-2" 
                      />
                      <span className="text-sm text-gray-700">COVID-19 Related Death</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Informant Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Informant Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.informantName}
                      onChange={(e) => handleInputChange('informantName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Deceased</label>
                    <select 
                      value={formData.informantRelationship}
                      onChange={(e) => handleInputChange('informantRelationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select Relationship</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="relative">Other Relative</option>
                      <option value="friend">Friend</option>
                      <option value="funeral_home">Funeral Home Representative</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input 
                      type="tel" 
                      value={formData.informantContact}
                      onChange={(e) => handleInputChange('informantContact', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g. +63 912 345 6789"
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
                        {doc.type === 'covid_swab' && formData.deceased.covidRelated && <span className="text-red-500">*</span>}
                      </label>
                      <input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        required={doc.required || (doc.type === 'covid_swab' && formData.deceased.covidRelated)}
                        onChange={(e) => handleFileChange(doc.type, e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                      />
                      {doc.file && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ {doc.file.name} ({(doc.file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                      {doc.type === 'covid_swab' && !formData.deceased.covidRelated && (
                        <p className="text-xs text-gray-500 mt-1">
                          Only required if death is COVID-19 related
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-700">
                      <strong>File Requirements:</strong>
                    </p>
                    <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
                      <li>Accepted formats: PDF, JPG, JPEG, PNG</li>
                      <li>Maximum file size: 10MB per file</li>
                      <li>Ensure documents are clear and readable</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link href="/citizen" className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`px-6 py-2 rounded-md text-white font-medium ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}