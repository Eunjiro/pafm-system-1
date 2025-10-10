"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"
import Link from "next/link"

interface DeathRegistration {
  id: number
  registrationType: 'REGULAR' | 'DELAYED'
  status: 'SUBMITTED' | 'VERIFIED' | 'FOR_PAYMENT' | 'PAID' | 'REGISTERED' | 'FOR_PICKUP' | 'CLAIMED'
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
    documentType: string
    fileName: string
    filePath: string
    uploadedAt: string
  }>
}

export default function DeathRegistrationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const unwrappedParams = use(params)
  const [registration, setRegistration] = useState<DeathRegistration | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (status === "loading") return

    if (!session || !['EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
      router.replace("/auth/signin")
      return
    }

    fetchRegistration()
  }, [session, status, router, unwrappedParams.id])

  const fetchRegistration = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/death-registrations/${unwrappedParams.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch registration')
      }
      
      const data = await response.json()
      setRegistration(data)
    } catch (error) {
      console.error('Error fetching registration:', error)
      setError('Failed to load registration details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: DeathRegistration['status']) => {
    const styles = {
      SUBMITTED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Verification' },
      VERIFIED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Verified' },
      FOR_PAYMENT: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'For Payment' },
      PAID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      REGISTERED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Registered' },
      FOR_PICKUP: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'For Pickup' },
      CLAIMED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Claimed' }
    }
    
    const style = styles[status]
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const handleStatusUpdate = async (newStatus: string, additionalData?: any) => {
    setProcessing(true)
    try {
      const response = await fetch(`/api/death-registrations/${unwrappedParams.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          ...additionalData
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      await fetchRegistration() // Refresh data
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setProcessing(false)
    }
  }

  const handleApprove = () => {
    handleStatusUpdate('FOR_PAYMENT', {
      remarks: 'Documents verified and approved by employee'
    })
  }

  const handleReject = () => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return
    
    handleStatusUpdate('SUBMITTED', {
      remarks: `Rejected: ${reason}`
    })
  }

  const handleConfirmPayment = () => {
    const orNumber = prompt('Please enter the OR Number:')
    if (!orNumber) return
    
    handleStatusUpdate('REGISTERED', {
      orNumber: orNumber,
      remarks: 'Payment confirmed and registration completed'
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
          <Link href="/employee/death-registrations" className="text-blue-600 hover:text-blue-800">
            Back to Registration Queue
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/employee/death-registrations" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Death Registration #{registration.id}</h1>
              {getStatusBadge(registration.status)}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {session?.user?.name}</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {session?.user?.role}
              </span>
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
                  {registration.status === 'SUBMITTED' && (
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

                  {registration.status === 'PAID' && (
                    <button
                      onClick={handleConfirmPayment}
                      disabled={processing}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Confirm Payment & Register'}
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
                          <p className="text-sm font-medium text-gray-900">{doc.documentType}</p>
                          <p className="text-xs text-gray-500">{doc.fileName}</p>
                          <p className="text-xs text-gray-400">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          View
                        </button>
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