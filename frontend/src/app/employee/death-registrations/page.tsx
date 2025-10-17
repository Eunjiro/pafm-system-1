'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Type definitions
interface DeathRegistration {
  id: number
  registrationType: 'REGULAR' | 'DELAYED'
  status: string
  amountDue: number
  deceased?: {
    firstName: string
    middleName?: string
    lastName: string
    age?: number
  }
  submitter?: {
    fullNameFirst: string
    fullNameLast: string
    email?: string
  }
  documents?: Array<{
    documentType?: string
    fileName?: string
    fileUrl: string
  }>
}

interface StatusModalState {
  registrationId: number
  currentStatus: string
}

interface DocumentsModalState {
  registrationId: number
  documents: Array<{
    documentType?: string
    fileName?: string
    fileUrl: string
  }>
}

export default function DeathRegistrationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // State management
  const [registrations, setRegistrations] = useState<DeathRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState<StatusModalState | null>(null)
  const [showDocumentsModal, setShowDocumentsModal] = useState<DocumentsModalState | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusComment, setStatusComment] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Rate limiting
  const [retryDelay, setRetryDelay] = useState(1000)
  const [lastFetch, setLastFetch] = useState(0)

  // Fetch registrations with pagination
  const fetchRegistrations = useCallback(async (page = 1, limit = 10) => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)
      setLastFetch(Date.now())

      let url = `/api/death-registrations?page=${page}&limit=${limit}`

      console.log('Fetching from URL:', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5') * 1000
        setRetryDelay(retryAfter)
        throw new Error('Server is busy. Please try again in a few seconds.')
      }

      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = `Status: ${response.status} ${response.statusText}`
        try {
          const responseText = await response.text()
          console.error('Raw error response:', responseText)
          
          if (responseText) {
            try {
              const errorData = JSON.parse(responseText)
              console.error('Error response data:', errorData)
              errorDetails = errorData.error || errorData.details || errorData.message || errorDetails
              
              // Special handling for backend connectivity issues
              if (errorData.type === 'CONNECTION_ERROR') {
                errorDetails = 'Backend service is not available. Please ensure the backend server is running on port 3001.'
              } else if (errorData.type === 'TIMEOUT_ERROR') {
                errorDetails = 'Request timed out. The backend service may be overloaded.'
              } else if (errorData.type === 'BACKEND_UNAVAILABLE') {
                errorDetails = 'Backend service is temporarily unavailable. Please try again in a moment.'
              }
            } catch (jsonError) {
              console.error('Response is not valid JSON:', jsonError)
              errorDetails = `Server error: ${responseText.substring(0, 200)}...`
            }
          }
        } catch (parseError) {
          console.error('Could not read error response:', parseError)
          errorDetails = `Network error: Unable to read server response (${response.status})`
        }
        
        throw new Error(errorDetails)
      }

      const data = await response.json()
      console.log('Successfully received data:', data)
      
      // Handle different response formats
      if (data.registrations) {
        // New format with pagination info
        setRegistrations(data.registrations || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.total || 0)
        setCurrentPage(data.pagination?.page || 1)
      } else if (Array.isArray(data)) {
        // Legacy format - just an array
        setRegistrations(data)
        setTotalPages(1)
        setTotalCount(data.length)
        setCurrentPage(1)
      } else {
        // Fallback
        setRegistrations([])
        setTotalPages(1)
        setTotalCount(0)
        setCurrentPage(1)
      }
    } catch (err) {
      console.error('Error fetching registrations:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      if (errorMessage.includes('Server is busy')) {
        setTimeout(() => fetchRegistrations(page, limit), retryDelay)
      }
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, retryDelay])

  // Tab filtering - removed since we now use sidebar navigation
  // const handleTabChange = (tab: string) => {
  //   setActiveTab(tab)
  //   setCurrentPage(1)
  // }

  // Pagination
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    return pages
  }

  // Status management
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Pending' },
      UNDER_REVIEW: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Under Review' },
      APPROVED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Approved' },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Rejected' },
      COMPLETED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Completed' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        {config.label}
      </span>
    )
  }

  const canUpdateStatus = (currentStatus: string) => {
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['UNDER_REVIEW', 'REJECTED'],
      UNDER_REVIEW: ['APPROVED', 'REJECTED'],
      APPROVED: ['COMPLETED'],
      REJECTED: [],
      COMPLETED: []
    }
    return allowedTransitions[currentStatus]?.length > 0
  }

  const getNextStatuses = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      PENDING: ['UNDER_REVIEW', 'REJECTED'],
      UNDER_REVIEW: ['APPROVED', 'REJECTED'],
      APPROVED: ['COMPLETED'],
      REJECTED: [],
      COMPLETED: []
    }
    return transitions[currentStatus] || []
  }

  // Status update
  const handleStatusUpdate = async () => {
    if (!newStatus || !showStatusModal) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/death-registrations/${showStatusModal.registrationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          comment: statusComment
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      await fetchRegistrations(currentPage, itemsPerPage)
      setShowStatusModal(null)
      setNewStatus('')
      setStatusComment('')
    } catch (err) {
      console.error('Error updating status:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status'
      setError(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  // Document handling
  const handleViewDocuments = (registration: DeathRegistration) => {
    setShowDocumentsModal({
      registrationId: registration.id,
      documents: registration.documents || []
    })
  }

  // API health check
  const checkApiHealth = async () => {
    try {
      console.log('Checking API health...')
      const response = await fetch('/api/health')
      console.log('Health check response:', response.status)
      if (response.ok) {
        const healthData = await response.json()
        console.log('Health check data:', healthData)
        setError(null)
        fetchRegistrations(currentPage, itemsPerPage)
      } else {
        console.error('Health check failed:', response.status)
        setError('API health check failed. Backend service may not be running.')
      }
    } catch (err) {
      console.error('Health check failed:', err)
      setError('Cannot connect to API. Please check if the backend service is running.')
    }
  }

  // Check backend connectivity
  const checkBackendConnectivity = async () => {
    try {
      console.log('Checking backend connectivity...')
      setError(null)
      
      // First check the Next.js API health
      const apiResponse = await fetch('/api/health')
      console.log('Next.js API health response:', apiResponse.status)
      
      if (!apiResponse.ok) {
        throw new Error('Next.js API is not responding')
      }
      
      // Then try to fetch registrations with detailed error info
      await fetchRegistrations(currentPage, itemsPerPage)
    } catch (err) {
      console.error('Connectivity check failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Connectivity check failed'
      setError(`Connection failed: ${errorMessage}`)
    }
  }

  // Effects
  useEffect(() => {
    if (session?.user?.id) {
      fetchRegistrations(currentPage, itemsPerPage)
    }
  }, [session?.user?.id, currentPage, itemsPerPage, fetchRegistrations])

  if (!session) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBFBFB' }}>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Death Registrations</h1>
              <p className="text-gray-600 mt-2">Manage and process all death registration applications</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{totalCount}</span> total registrations
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-4 rounded-full animate-spin mb-4" style={{ borderTopColor: '#4CAF50' }}></div>
              <p className="text-gray-600">Loading registrations...</p>
            </div>
          </div>
        )}

        {/* Modern Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F44336', opacity: 0.1 }}>
                  <svg className="w-5 h-5" style={{ color: '#F44336' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-red-800">Unable to load registrations</h3>
                <p className="text-red-700 mt-1">{error}</p>
                {error?.includes('Server is busy') && (
                  <p className="text-sm text-red-600 mt-2">
                    Server is temporarily busy. Next retry available in {Math.round(retryDelay / 1000)} seconds.
                  </p>
                )}
                {error?.includes('Backend service is not available') && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Troubleshooting steps:</strong>
                    </p>
                    <ol className="text-sm text-yellow-700 mt-1 list-decimal list-inside space-y-1">
                      <li>Ensure the backend service is running on port 3001</li>
                      <li>Check if the backend server started successfully</li>
                      <li>Verify the BACKEND_URL environment variable is set correctly</li>
                    </ol>
                  </div>
                )}
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => {
                      setRetryDelay(1000)
                      setLastFetch(0)
                      fetchRegistrations(currentPage, itemsPerPage)
                    }}
                    disabled={Date.now() - lastFetch < retryDelay && error?.includes('Server is busy')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      Date.now() - lastFetch < retryDelay && error?.includes('Server is busy')
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {Date.now() - lastFetch < retryDelay && error?.includes('Server is busy')
                      ? `Wait ${Math.round((retryDelay - (Date.now() - lastFetch)) / 1000)}s`
                      : 'Retry'
                    }
                  </button>
                  <button
                    onClick={checkApiHealth}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    Check API Status
                  </button>
                  <button
                    onClick={checkBackendConnectivity}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Data Table */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead style={{ backgroundColor: '#FBFBFB' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deceased Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted By</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Documents</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fee</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrations && registrations.length > 0 ? (
                    registrations.map((registration) => (
                      <tr key={registration.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: '#4CAF50' }}>
                              {registration.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            registration.registrationType === 'REGULAR' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            {registration.registrationType === 'REGULAR' ? 'Regular' : 'Delayed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {registration.deceased ? 
                                `${registration.deceased.firstName} ${registration.deceased.middleName || ''} ${registration.deceased.lastName}`.trim() 
                                : 'N/A'
                              }
                            </div>
                            {registration.deceased?.age && (
                              <div className="text-xs text-gray-500">Age: {registration.deceased.age}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {registration.submitter ? 
                              `${registration.submitter.fullNameFirst} ${registration.submitter.fullNameLast}`.trim()
                              : 'N/A'
                            }
                          </div>
                          {registration.submitter?.email && (
                            <div className="text-xs text-gray-500">{registration.submitter.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewDocuments(registration)}
                            className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                            style={{ backgroundColor: '#4A90E2', color: 'white' }}
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {registration.documents?.length || 0} docs
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {registration.status ? getStatusBadge(registration.status) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              No Status
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-semibold" style={{ color: '#4CAF50' }}>
                            ₱{registration.amountDue || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/employee/death-registrations/${registration.id}`}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </Link>
                            
                            {canUpdateStatus(registration.status) && (
                              <button
                                onClick={() => setShowStatusModal({ registrationId: registration.id, currentStatus: registration.status })}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                style={{ backgroundColor: '#FDA811', color: 'white' }}
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Update
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#FBFBFB' }}>
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
                          <p className="text-gray-500 text-sm">
                            No death registrations are currently available.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modern Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {getPageNumbers().map((pageNum, index) => (
                      <button
                        key={index}
                        onClick={() => typeof pageNum === 'number' && setCurrentPage(pageNum)}
                        disabled={typeof pageNum === 'string'}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pageNum === currentPage
                            ? 'text-white'
                            : typeof pageNum === 'string'
                            ? 'bg-transparent text-gray-400 cursor-default'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={pageNum === currentPage ? { backgroundColor: '#4CAF50' } : {}}
                      >
                        {pageNum}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modern Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-1 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 animate-slideUp">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Update Registration Status</h3>
                  <button
                    onClick={() => setShowStatusModal(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Status
                    </label>
                    <div className="flex">
                      {getStatusBadge(showStatusModal.currentStatus)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                      <option value="">Select new status...</option>
                      {getNextStatuses(showStatusModal.currentStatus).map((status: string) => (
                        <option key={status} value={status}>
                          {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (Optional)
                    </label>
                    <textarea
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      placeholder="Add any comments about this status change..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowStatusModal(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || isUpdating}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !newStatus || isUpdating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-white hover:opacity-90'
                    }`}
                    style={!newStatus || isUpdating ? {} : { backgroundColor: '#4CAF50' }}
                  >
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Documents Modal */}
        {showDocumentsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-1 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden animate-slideUp">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Registration Documents</h3>
                  <button
                    onClick={() => setShowDocumentsModal(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {showDocumentsModal.documents && showDocumentsModal.documents.length > 0 ? (
                  <div className="space-y-4">
                    {showDocumentsModal.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: '#4A90E2' }}>
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.documentType || `Document ${index + 1}`}</p>
                            <p className="text-sm text-gray-500">{doc.fileName || 'No filename'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                          style={{ backgroundColor: '#4CAF50' }}
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#FBFBFB' }}>
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No documents available for this registration.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}