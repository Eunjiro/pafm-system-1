"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"
import Link from "next/link"

interface DeathRegistration {
  id: number
  registrationType: 'REGULAR' | 'DELAYED'
  status: string
  orNumber?: string
  amountDue?: number
  remarks?: string
  createdAt: string
  updatedAt: string
  deceased?: {
    id: number
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
    covidRelated?: boolean
  }
  submitter?: {
    id: number
    fullNameFirst: string
    fullNameMiddle?: string
    fullNameLast: string
    email: string
    contactNo?: string
  }
  documents?: Array<{
    id: number
    docType: string
    uploadedAt: string
    document: {
      id: number
      fileName: string
      filePath: string
      mimeType?: string
    }
  }>
}

export default function AdminDeathRegistrationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const unwrappedParams = use(params)
  const [registration, setRegistration] = useState<DeathRegistration | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string>("")
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('profile-dropdown')
      const button = document.getElementById('profile-button')
      
      if (dropdown && button && 
          !dropdown.contains(event.target as Node) && 
          !button.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileDropdown])

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user?.role !== 'ADMIN') {
      router.replace("/auth/signin")
      return
    }

    fetchRegistration()
  }, [session, status, router, unwrappedParams.id])

  const fetchRegistration = async () => {
    try {
      setLoading(true)
      setError("")
      
      console.log(`Fetching registration details for ID: ${unwrappedParams.id}`)
      
      const response = await fetch(`/api/death-registrations/${unwrappedParams.id}`)
      
      console.log('Fetch response status:', response.status)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Registration not found')
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.')
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view this registration.')
        } else {
          throw new Error(`Failed to fetch registration (${response.status})`)
        }
      }
      
      const data = await response.json()
      console.log('Registration data received:', data)
      setRegistration(data)
    } catch (error) {
      console.error('Error fetching registration:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load registration details'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      SUBMITTED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Submitted' },
      PENDING_VERIFICATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Verification' },
      VERIFIED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Verified' },
      FOR_PAYMENT: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'For Payment' },
      PAID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
      REGISTERED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Registered' },
      FOR_PICKUP: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'For Pickup' },
      CLAIMED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Claimed' },
      RETURNED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Returned' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      EXPIRED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expired' }
    }
    
    const style = styles[status] || { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      label: status || 'Unknown' 
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const handleStatusUpdate = async (newStatus: string, additionalData?: any) => {
    setProcessing(true)
    try {
      console.log(`Updating registration ${unwrappedParams.id} status to ${newStatus}...`)
      
      const requestBody = { 
        status: newStatus,
        ...additionalData
      }
      
      console.log('Request body:', requestBody)
      
      const response = await fetch(`/api/death-registrations/${unwrappedParams.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Raw error response:', errorText)
        
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError)
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` }
        }
        
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        console.error('Status update failed:', errorMessage, errorData)
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.')
        } else if (response.status === 403) {
          throw new Error('You do not have permission to update this registration.')
        } else if (response.status === 404) {
          throw new Error('Registration not found. It may have been deleted.')
        } else if (response.status === 500) {
          throw new Error(`Server error: ${errorMessage}. Please try again or contact support.`)
        } else {
          throw new Error(`Failed to update status: ${errorMessage}`)
        }
      }

      const result = await response.json()
      console.log('Registration updated successfully:', result)
      
      await fetchRegistration() // Refresh data
    } catch (error) {
      console.error('Error updating status:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to update status: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleApprove = () => {
    handleStatusUpdate('PROCESSING', {
      remarks: 'Documents verified and approved by admin'
    })
  }

  const handleReject = () => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return
    
    handleStatusUpdate('REJECTED', {
      remarks: `Rejected: ${reason}`
    })
  }

  const handleConfirmPayment = () => {
    const orNumber = prompt('Please enter the OR Number:')
    if (!orNumber) return
    
    handleStatusUpdate('PAID', {
      orNumber: orNumber,
      remarks: 'Payment confirmed and OR number recorded'
    })
  }

  const handleCompleteRegistration = () => {
    handleStatusUpdate('REGISTERED', {
      remarks: 'Death registration completed and officially recorded',
      registeredAt: new Date().toISOString(),
      registeredBy: session?.user?.id || 1
    })
  }

  const handleMarkForPickup = () => {
    handleStatusUpdate('FOR_PICKUP', {
      remarks: 'Certificate prepared and ready for pickup'
    })
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Registration Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested registration could not be found.'}</p>
          <Link href="/admin/death-registration" className="text-blue-600 hover:text-blue-800">
            Back to Registration Management
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/death-registration" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <Link href="/admin" className="flex items-center">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">PAFM System</span>
              </Link>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">Death Registration #{registration.id}</h1>
                {getStatusBadge(registration.status)}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {session?.user?.name}</span>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {session?.user?.role}
              </span>
              <Link
                href="/admin"
                className="text-red-600 hover:text-red-900 text-sm font-medium"
              >
                Admin Dashboard
              </Link>
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  id="profile-button"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </button>
                
                {showProfileDropdown && (
                  <div id="profile-dropdown" className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link href="/admin/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </div>
                    </Link>
                    <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </div>
                    </Link>
                    <Link href="/admin/death-registration" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Death Registrations
                      </div>
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => signOut({ callbackUrl: 'http://localhost:3000' })}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Registration Info */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{registration.registrationType.toLowerCase()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount Due</label>
                    <p className="mt-1 text-sm text-gray-900">₱{registration.amountDue || 50}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Submitted Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(registration.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(registration.updatedAt).toLocaleString()}</p>
                  </div>
                  {registration.orNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">OR Number</label>
                      <p className="mt-1 text-sm text-gray-900">{registration.orNumber}</p>
                    </div>
                  )}
                  {registration.remarks && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Remarks</label>
                      <p className="mt-1 text-sm text-gray-900">{registration.remarks}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Deceased Information */}
              {registration.deceased && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Deceased Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {`${registration.deceased.firstName} ${registration.deceased.middleName || ''} ${registration.deceased.lastName} ${registration.deceased.suffix || ''}`.trim()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sex</label>
                      <p className="mt-1 text-sm text-gray-900">{registration.deceased.sex || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {registration.deceased.dateOfBirth ? new Date(registration.deceased.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Death</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {registration.deceased.dateOfDeath ? new Date(registration.deceased.dateOfDeath).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Age</label>
                      <p className="mt-1 text-sm text-gray-900">{registration.deceased.age || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Place of Death</label>
                      <p className="mt-1 text-sm text-gray-900">{registration.deceased.placeOfDeath || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Civil Status</label>
                      <p className="mt-1 text-sm text-gray-900">{registration.deceased.civilStatus || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Occupation</label>
                      <p className="mt-1 text-sm text-gray-900">{registration.deceased.occupation || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Residence Address</label>
                      <p className="mt-1 text-sm text-gray-900">{registration.deceased.residenceAddress || 'N/A'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Cause of Death</label>
                      <p className="mt-1 text-sm text-gray-900">{registration.deceased.causeOfDeath || 'N/A'}</p>
                      {registration.deceased.covidRelated && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                          COVID-19 Related
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submitter Information */}
              {registration.submitter && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitter Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {`${registration.submitter.fullNameFirst} ${registration.submitter.fullNameMiddle || ''} ${registration.submitter.fullNameLast}`.trim()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{registration.submitter.email}</p>
                    </div>
                    {registration.submitter.contactNo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                        <p className="mt-1 text-sm text-gray-900">{registration.submitter.contactNo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  {(registration.status === 'SUBMITTED' || registration.status === 'PENDING_VERIFICATION') && (
                    <>
                      <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? 'Processing...' : 'Approve Application'}
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={processing}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject Application
                      </button>
                    </>
                  )}

                  {registration.status === 'PROCESSING' && (
                    <button
                      onClick={handleConfirmPayment}
                      disabled={processing}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  )}

                  {registration.status === 'PAID' && (
                    <button
                      onClick={handleCompleteRegistration}
                      disabled={processing}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Complete Registration'}
                    </button>
                  )}

                  {registration.status === 'REGISTERED' && (
                    <button
                      onClick={handleMarkForPickup}
                      disabled={processing}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Mark for Pickup'}
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Print Details
                  </button>
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                {registration.documents && registration.documents.length > 0 ? (
                  <div className="space-y-3">
                    {registration.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.docType}</p>
                          <p className="text-xs text-gray-500">{doc.document.fileName}</p>
                          <p className="text-xs text-gray-400">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a 
                          href={`http://localhost:3001${doc.document.filePath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                )}
              </div>

              {/* Status History */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status History</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current: {getStatusBadge(registration.status)}</p>
                      <p className="text-xs text-gray-500">{new Date(registration.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-gray-700">Submitted</p>
                      <p className="text-xs text-gray-500">{new Date(registration.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
