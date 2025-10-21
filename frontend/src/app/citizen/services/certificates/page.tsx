"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface DeceasedRecord {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfDeath?: string;
}

export default function DeathCertificateRequest() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deceasedRecords, setDeceasedRecords] = useState<DeceasedRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    deathId: '',
    copies: '1',
    purpose: '',
    specificPurpose: '',
    relationshipToDeceased: '',
    contactNumber: '',
  })

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
    
    // Fetch deceased records from death registrations
    fetchDeceasedRecords()
  }, [session, status, router])
  
  const fetchDeceasedRecords = async () => {
    try {
      const response = await fetch('/api/death-registrations/deceased')
      if (response.ok) {
        const data = await response.json()
        setDeceasedRecords(data.deceased || [])
      }
    } catch (error) {
      console.error('Error fetching deceased records:', error)
    } finally {
      setLoadingRecords(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.deathId) {
      alert('Please select a deceased person')
      return
    }
    
    if (!formData.relationshipToDeceased) {
      alert('Please specify your relationship to the deceased')
      return
    }
    
    if (!formData.purpose) {
      alert('Please select a purpose for the certificate request')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const purposeText = formData.specificPurpose || formData.purpose
      
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certRequestType: 'DEATH',
          deathId: parseInt(formData.deathId),
          relationshipToDeceased: formData.relationshipToDeceased,
          purpose: purposeText,
          copies: parseInt(formData.copies),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Certificate request submitted successfully!')
        router.push('/citizen/applications')
      } else {
        alert(`Failed to submit request: ${data.error || data.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error submitting certificate request:', error)
      alert('Failed to submit certificate request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const calculateAmount = () => {
    const baseAmount = 50
    return baseAmount * parseInt(formData.copies || '1')
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/citizen" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Death Certificate Request</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {session.user?.name}</span>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {session.user?.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Service Information */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M11 7h5" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Death Certificate Request</h2>
                <p className="text-gray-600">Request certified copies of death certificates</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">First Copy</h3>
                <p className="text-2xl font-bold text-blue-600">₱50.00</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Additional Copies</h3>
                <p className="text-xl font-bold text-blue-600">₱50.00 each</p>
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
                Valid ID (if you are next of kin)
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Authorization Letter (if you are NOT next of kin)
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Supporting ID of family member (if requesting for someone else)
              </li>
            </ul>
          </div>

          {/* Request Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Certificate Request Form</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Deceased Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Deceased Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Deceased Person <span className="text-red-500">*</span>
                    </label>
                    {loadingRecords ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                        Loading deceased records...
                      </div>
                    ) : deceasedRecords.length > 0 ? (
                      <select 
                        name="deathId"
                        value={formData.deathId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select a deceased person</option>
                        {deceasedRecords.map((deceased) => (
                          <option key={deceased.id} value={deceased.id}>
                            {deceased.firstName} {deceased.middleName || ''} {deceased.lastName}
                            {deceased.dateOfDeath && ` - ${new Date(deceased.dateOfDeath).toLocaleDateString()}`}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 text-yellow-700">
                        No deceased records found. Please submit a death registration first.
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Select from your previously registered death records
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Request Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Copies <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="copies"
                      value={formData.copies}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="1">1 copy (₱50.00)</option>
                      <option value="2">2 copies (₱100.00)</option>
                      <option value="3">3 copies (₱150.00)</option>
                      <option value="4">4 copies (₱200.00)</option>
                      <option value="5">5 copies (₱250.00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Purpose</option>
                      <option value="Insurance Claims">Insurance Claims</option>
                      <option value="Legal Proceedings">Legal Proceedings</option>
                      <option value="Bank Requirements">Bank Requirements</option>
                      <option value="Property Transfer">Property Transfer</option>
                      <option value="Pension/Benefits">Pension/Benefits</option>
                      <option value="Burial Services">Burial Services</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specific Purpose (Optional)</label>
                    <textarea 
                      name="specificPurpose"
                      value={formData.specificPurpose}
                      onChange={handleInputChange}
                      rows={3} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="Please specify the purpose for requesting the death certificate"
                    />
                  </div>
                  <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Amount Due:</span>
                      <span className="text-2xl font-bold text-blue-600">₱{calculateAmount()}.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requestor Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Requestor Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={session.user?.name || ""} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      disabled 
                    />
                    <p className="text-xs text-gray-500 mt-1">Your registered name</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship to Deceased <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="relationshipToDeceased"
                      value={formData.relationshipToDeceased}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Grandchild">Grandchild</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Authorized Representative">Authorized Representative</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input 
                      type="tel" 
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="09XX XXX XXXX" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={session.user?.email || ""} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      disabled 
                    />
                    <p className="text-xs text-gray-500 mt-1">Your registered email</p>
                  </div>
                </div>
              </div>

              {/* Document Upload Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Document Requirements</h4>
                    <p className="text-sm text-yellow-700">
                      Required documents (Valid ID, Authorization Letter if applicable) will be collected during the pickup process at the municipal office. 
                      Please bring the original copies when you claim your certificate.
                    </p>
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
                  disabled={isSubmitting || loadingRecords || deceasedRecords.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}