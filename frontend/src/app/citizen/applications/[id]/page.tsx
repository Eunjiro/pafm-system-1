"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
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

interface PaymentData {
  id: number
  amount: number
  orNumber?: string
  paymentStatus: string
}

interface ApplicationDetail {
  id: number
  registrationType: string
  status: string
  amountDue: number | string
  informantName: string
  informantRelationship?: string
  informantContact?: string
  createdAt: string
  updatedAt: string
  remarks?: string
  deceased: DeceasedData
  payment?: PaymentData
  submitter: {
    id: number
    fullNameFirst: string
    fullNameMiddle?: string
    fullNameLast: string
    email: string
    contactNo?: string
  }
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { id } = use(params)
  const [application, setApplication] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

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

    fetchApplicationDetail()
  }, [session, status, router, id])

  const fetchApplicationDetail = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/citizen/applications/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch application details')
      }

      const data: ApplicationDetail = await response.json()
      setApplication(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FOR_PAYMENT':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'PAID':
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'REGISTERED':
      case 'FOR_PICKUP':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CLAIMED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!session || !['CITIZEN', 'EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-4">
              <h2 className="text-lg font-medium text-gray-900">Application Not Found</h2>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          </div>
          <Link href="/citizen/applications" className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            Back to Applications
          </Link>
        </div>
      </div>
    )
  }

  if (!application) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/citizen/applications" className="flex items-center text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Applications
              </Link>
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Application Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Application #DR-{application.id.toString().padStart(3, '0')}
                </h1>
                <p className="text-gray-600">Death Registration - {application.registrationType}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg border ${getStatusColor(application.status)}`}>
                <span className="font-medium">{formatStatus(application.status)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deceased Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Deceased Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-sm text-gray-900">
                      {application.deceased.firstName} {application.deceased.middleName} {application.deceased.lastName} {application.deceased.suffix}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Sex</label>
                    <p className="text-sm text-gray-900">{application.deceased.sex || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-sm text-gray-900">
                      {application.deceased.dateOfBirth ? new Date(application.deceased.dateOfBirth).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date of Death</label>
                    <p className="text-sm text-gray-900">
                      {application.deceased.dateOfDeath ? new Date(application.deceased.dateOfDeath).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Age</label>
                    <p className="text-sm text-gray-900">{application.deceased.age || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Place of Death</label>
                    <p className="text-sm text-gray-900">{application.deceased.placeOfDeath || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">Residence Address</label>
                    <p className="text-sm text-gray-900">{application.deceased.residenceAddress || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Citizenship</label>
                    <p className="text-sm text-gray-900">{application.deceased.citizenship || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Civil Status</label>
                    <p className="text-sm text-gray-900">{application.deceased.civilStatus || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Occupation</label>
                    <p className="text-sm text-gray-900">{application.deceased.occupation || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">COVID-19 Related</label>
                    <p className="text-sm text-gray-900">{application.deceased.covidRelated ? 'Yes' : 'No'}</p>
                  </div>
                  {application.deceased.causeOfDeath && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Cause of Death</label>
                      <p className="text-sm text-gray-900">{application.deceased.causeOfDeath}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informant Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-sm text-gray-900">{application.informantName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Relationship to Deceased</label>
                    <p className="text-sm text-gray-900">{application.informantRelationship || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Contact Number</label>
                    <p className="text-sm text-gray-900">{application.informantContact || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Application Status */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Current Status</label>
                    <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {formatStatus(application.status)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Submitted Date</label>
                    <p className="text-sm text-gray-900">{formatDate(application.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-sm text-gray-900">{formatDate(application.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Processing Fee</label>
                    <p className="text-lg font-semibold text-gray-900">₱{typeof application.amountDue === 'number' 
                      ? application.amountDue.toFixed(2) 
                      : parseFloat(application.amountDue || '0').toFixed(2)}</p>
                  </div>
                  {application.payment && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Payment Status</label>
                        <p className="text-sm text-gray-900">{application.payment.paymentStatus}</p>
                      </div>
                      {application.payment.orNumber && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">OR Number</label>
                          <p className="text-sm text-gray-900">{application.payment.orNumber}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={fetchApplicationDetail}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Refresh Status
                  </button>
                  {application.status === 'FOR_PAYMENT' && (
                    <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                      Make Payment
                    </button>
                  )}
                </div>
              </div>

              {/* Remarks */}
              {application.remarks && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Remarks</h3>
                  <p className="text-sm text-gray-700">{application.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}