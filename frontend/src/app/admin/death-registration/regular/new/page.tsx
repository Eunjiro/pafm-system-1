"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

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
  submittedBy?: string
  amountDue?: number
  remarks?: string
}

export default function NewRegularDeathRegistration() {
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
    informantContact: "",
    submittedBy: "",
    amountDue: 50.00,
    remarks: ""
  })

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin")
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

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch('/api/death-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationType: 'REGULAR',
          ...formData
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create death registration')
      }

      const registration = await response.json()
      setSuccess(`Death registration created successfully! Registration ID: ${registration.id}`)
      
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
        informantContact: "",
        submittedBy: "",
        amountDue: 50.00,
        remarks: ""
      })

      // Redirect to registration list after 2 seconds
      setTimeout(() => {
        router.push('/admin/death-registration/regular')
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/death-registration/regular" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">New Regular Death Registration</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {session.user?.name}</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {session.user?.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Deceased Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Deceased Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.deceased.firstName}
                    onChange={(e) => handleDeceasedChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.deceased.middleName}
                    onChange={(e) => handleDeceasedChange('middleName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.deceased.lastName}
                    onChange={(e) => handleDeceasedChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suffix</label>
                  <select
                    value={formData.deceased.suffix}
                    onChange={(e) => handleDeceasedChange('suffix', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
                  <input
                    type="date"
                    value={formData.deceased.dateOfDeath}
                    onChange={(e) => handleDeceasedChange('dateOfDeath', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.deceased.age || ''}
                    onChange={(e) => handleDeceasedChange('age', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Place of Death</label>
                  <input
                    type="text"
                    value={formData.deceased.placeOfDeath}
                    onChange={(e) => handleDeceasedChange('placeOfDeath', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                  <select
                    value={formData.deceased.civilStatus}
                    onChange={(e) => handleDeceasedChange('civilStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Citizenship</label>
                  <input
                    type="text"
                    value={formData.deceased.citizenship}
                    onChange={(e) => handleDeceasedChange('citizenship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.deceased.occupation}
                    onChange={(e) => handleDeceasedChange('occupation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cause of Death</label>
                  <textarea
                    rows={2}
                    value={formData.deceased.causeOfDeath}
                    onChange={(e) => handleDeceasedChange('causeOfDeath', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informant Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Informant Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.informantName}
                    onChange={(e) => handleInputChange('informantName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Deceased</label>
                  <input
                    type="text"
                    value={formData.informantRelationship}
                    onChange={(e) => handleInputChange('informantRelationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.informantContact}
                    onChange={(e) => handleInputChange('informantContact', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Due (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amountDue}
                    onChange={(e) => handleInputChange('amountDue', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    rows={3}
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/admin/death-registration/regular"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded-md text-white font-medium ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Creating...' : 'Create Registration'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}