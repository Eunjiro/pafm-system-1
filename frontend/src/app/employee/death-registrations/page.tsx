"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

interface DeathRegistration {
  id: number
  registrationType: 'REGULAR' | 'DELAYED'
  status: string // Made more flexible to handle unexpected values
  orNumber?: string
  amountDue?: number
  createdAt: string
  updatedAt: string
  deceased?: {
    id: number
    firstName: string
    middleName?: string
    lastName: string
    suffix?: string
    dateOfBirth?: string
    dateOfDeath?: string
    age?: number
  }
  submitter?: {
    id: number
    fullNameFirst: string
    fullNameMiddle?: string
    fullNameLast: string
    email: string
  }
  documents?: Array<{
    id: number
    documentType: string
    fileName: string
    filePath: string
    uploadedAt: string
  }>
}

export default function EmployeeDeathRegistrations() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<DeathRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>('pending')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session || !['EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
      router.push('/auth/signin')
      return
    }

    fetchRegistrations()
  }, [session, status, router])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      setError(null) // Clear any previous errors
      
      console.log('Fetching registrations from /api/death-registrations...')
      const response = await fetch('/api/death-registrations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        
        if (response.status === 401) {
          setError('Authentication failed. Please sign in again.')
          router.push('/auth/signin')
          return
        }
        
        if (response.status === 403) {
          setError('You do not have permission to view this page.')
          router.push('/unauthorized')
          return
        }
        
        if (response.status === 500) {
          setError('Server error. Please try again later or contact support.')
          return
        }
        
        throw new Error(`API Error (${response.status}): ${errorText || 'Failed to fetch registrations'}`)
      }
      
      const data = await response.json()
      console.log('API Response:', data) // Debug log
      
      // Ensure we always set an array
      if (Array.isArray(data)) {
        setRegistrations(data)
      } else if (data && Array.isArray(data.registrations)) {
        setRegistrations(data.registrations)
      } else if (data && Array.isArray(data.data)) {
        setRegistrations(data.data)
      } else {
        console.warn('Unexpected API response format:', data)
        setRegistrations([])
        
        // For development: use mock data when API doesn't return expected format
        if (process.env.NODE_ENV === 'development') {
          console.log('Using mock data for development')
          setRegistrations([
            {
              id: 1,
              registrationType: 'REGULAR',
              status: 'PENDING_VERIFICATION',
              orNumber: 'OR-001',
              amountDue: 500,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              deceased: {
                id: 1,
                firstName: 'John',
                middleName: 'Smith',
                lastName: 'Doe',
                suffix: '',
                dateOfBirth: '1950-01-01',
                dateOfDeath: '2024-01-01',
                age: 74
              },
              submitter: {
                id: 1,
                fullNameFirst: 'Jane',
                fullNameMiddle: '',
                fullNameLast: 'Doe',
                email: 'jane.doe@example.com'
              },
              documents: [
                {
                  id: 1,
                  documentType: 'Death Certificate',
                  fileName: 'death_cert.pdf',
                  filePath: '/uploads/death_cert.pdf',
                  uploadedAt: new Date().toISOString()
                }
              ]
            }
          ])
        }
      }
    } catch (error) {
      console.error('Error fetching registrations:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Failed to load registrations: ${errorMessage}`)
      setRegistrations([]) // Ensure empty array on error
    } finally {
      setLoading(false)
    }
  }

  const checkApiHealth = async () => {
    try {
      console.log('Checking API health...')
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('API Health Check:', data)
        alert(`API Status: ${data.status}\nTimestamp: ${data.timestamp}`)
      } else {
        console.error('Health check failed:', response.status)
        alert(`Health check failed with status: ${response.status}`)
      }
    } catch (error) {
      console.error('Health check error:', error)
      alert(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      PENDING_VERIFICATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Verification' },
      PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
      REGISTERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Registered' },
      FOR_PICKUP: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'For Pickup' },
      CLAIMED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Claimed' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
    }
    
    // Fallback for unknown status values
    const style = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Unknown' }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const handleApprove = async (id: number) => {
    setProcessingId(id)
    try {
      const response = await fetch(`/api/death-registrations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'PROCESSING',
          remarks: 'Approved by employee - documents verified'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve registration')
      }

      await fetchRegistrations()
    } catch (error) {
      console.error('Error approving registration:', error)
      alert('Failed to approve registration')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: number) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    setProcessingId(id)
    try {
      const response = await fetch(`/api/death-registrations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'REJECTED',
          remarks: `Rejected: ${reason}`
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject registration')
      }

      await fetchRegistrations()
    } catch (error) {
      console.error('Error rejecting registration:', error)
      alert('Failed to reject registration')
    } finally {
      setProcessingId(null)
    }
  }

  const handleMarkForPickup = async (id: number) => {
    setProcessingId(id)
    try {
      const response = await fetch(`/api/death-registrations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'FOR_PICKUP',
          remarks: 'Certificate prepared and ready for pickup'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark for pickup')
      }

      await fetchRegistrations()
    } catch (error) {
      console.error('Error marking for pickup:', error)
      alert('Failed to mark for pickup')
    } finally {
      setProcessingId(null)
    }
  }

  const handleMarkAsClaimed = async (id: number) => {
    setProcessingId(id)
    try {
      const response = await fetch(`/api/death-registrations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'CLAIMED',
          remarks: 'Certificate claimed by applicant'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark as claimed')
      }

      await fetchRegistrations()
    } catch (error) {
      console.error('Error marking as claimed:', error)
      alert('Failed to mark as claimed')
    } finally {
      setProcessingId(null)
    }
  }

  const handleViewDocuments = (registration: DeathRegistration) => {
    if (!registration.documents || registration.documents.length === 0) {
      alert('No documents uploaded for this registration')
      return
    }
    
    const documentsList = registration.documents.map(doc => 
      `• ${doc.documentType}: ${doc.fileName} (uploaded ${new Date(doc.uploadedAt).toLocaleDateString()})`
    ).join('\n')
    
    alert(`Documents for Registration #${registration.id}:\n\n${documentsList}`)
  }

  const filteredRegistrations = Array.isArray(registrations) 
    ? registrations.filter(registration => {
        if (selectedFilter === 'all') return true
        if (selectedFilter === 'pending') return registration.status === 'PENDING_VERIFICATION'
        return registration.status === selectedFilter
      })
    : []

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFBFB'}}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#4CAF50'}}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                    selectedFilter === 'all'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All Registrations
                </button>
                <button
                  onClick={() => setSelectedFilter('pending')}
                  className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                    selectedFilter === 'pending'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pending Verification
                </button>
                <button
                  onClick={() => setSelectedFilter('PROCESSING')}
                  className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                    selectedFilter === 'PROCESSING'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Processing
                </button>
                <button
                  onClick={() => setSelectedFilter('FOR_PICKUP')}
                  className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                    selectedFilter === 'FOR_PICKUP'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Ready for Pickup
                </button>
                <button
                  onClick={() => setSelectedFilter('CLAIMED')}
                  className={`whitespace-nowrap border-b-2 py-2 px-1 text-sm font-medium ${
                    selectedFilter === 'CLAIMED'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Completed
                </button>
              </nav>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading registrations</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <div className="mt-3 space-x-2">
                    <button
                      onClick={fetchRegistrations}
                      className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={checkApiHealth}
                      className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      Check API Status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deceased Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRegistrations && filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((registration) => (
                      <tr key={registration.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{registration.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="capitalize">{registration.registrationType.toLowerCase()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {registration.deceased ? 
                            `${registration.deceased.firstName} ${registration.deceased.middleName || ''} ${registration.deceased.lastName}`.trim() 
                            : 'N/A'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {registration.submitter ? 
                            `${registration.submitter.fullNameFirst} ${registration.submitter.fullNameLast}`.trim()
                            : 'N/A'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleViewDocuments(registration)}
                            className="text-blue-600 hover:text-blue-900 text-xs underline"
                          >
                            View Documents ({registration.documents?.length || 0})
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {registration.status ? getStatusBadge(registration.status) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No Status
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₱{registration.amountDue || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/employee/death-registrations/${registration.id}`}
                              className="text-blue-600 hover:text-blue-900 text-xs underline"
                            >
                              View Details
                            </Link>
                            
                            {registration.status === 'PENDING_VERIFICATION' && (
                              <>
                                <button
                                  onClick={() => handleApprove(registration.id)}
                                  disabled={processingId === registration.id}
                                  className="text-white px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-50"
                                  style={{backgroundColor: '#4CAF50'}}
                                >
                                  {processingId === registration.id ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleReject(registration.id)}
                                  disabled={processingId === registration.id}
                                  className="text-white px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-50"
                                  style={{backgroundColor: '#F44336'}}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {registration.status === 'PROCESSING' && (
                              <>
                                <button
                                  onClick={() => handleMarkForPickup(registration.id)}
                                  disabled={processingId === registration.id}
                                  className="text-white px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-50"
                                  style={{backgroundColor: '#FF9800'}}
                                >
                                  Ready for Pickup
                                </button>
                                <button
                                  onClick={() => handleReject(registration.id)}
                                  disabled={processingId === registration.id}
                                  className="text-white px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-50"
                                  style={{backgroundColor: '#F44336'}}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {registration.status === 'FOR_PICKUP' && (
                              <button
                                onClick={() => handleMarkAsClaimed(registration.id)}
                                disabled={processingId === registration.id}
                                className="text-white px-2 py-1 rounded text-xs hover:opacity-80 disabled:opacity-50"
                                style={{backgroundColor: '#607D8B'}}
                              >
                                Mark as Claimed
                              </button>
                            )}

                            {registration.status === 'CLAIMED' && (
                              <span className="text-green-600 text-xs font-medium">
                                ✓ Completed
                              </span>
                            )}

                            {registration.status === 'REJECTED' && (
                              <span className="text-red-600 text-xs font-medium">
                                ✗ Rejected
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                          No registrations found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredRegistrations.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No registrations found for the selected filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}