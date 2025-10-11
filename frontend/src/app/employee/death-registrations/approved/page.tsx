'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

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

export default function ApprovedRegistrationsPage() {
  const { data: session } = useSession()
  const [registrations, setRegistrations] = useState<DeathRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage] = useState(10)

  const fetchRegistrations = useCallback(async (page = 1, limit = 10) => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      const url = `/api/death-registrations?page=${page}&limit=${limit}&status=PROCESSING`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        let errorDetails = `Status: ${response.status} ${response.statusText}`
        try {
          const responseText = await response.text()
          if (responseText) {
            const errorData = JSON.parse(responseText)
            errorDetails = errorData.error || errorData.details || errorData.message || errorDetails
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError)
        }
        throw new Error(errorDetails)
      }

      const data = await response.json()
      
      if (data.registrations) {
        setRegistrations(data.registrations || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalCount(data.pagination?.total || 0)
        setCurrentPage(data.pagination?.page || 1)
      } else if (Array.isArray(data)) {
        setRegistrations(data)
        setTotalPages(1)
        setTotalCount(data.length)
        setCurrentPage(1)
      } else {
        setRegistrations([])
        setTotalPages(1)
        setTotalCount(0)
        setCurrentPage(1)
      }
    } catch (err) {
      console.error('Error fetching approved registrations:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                  <li>
                    <Link href="/employee/death-registrations" className="text-gray-500 hover:text-gray-700">
                      Death Registrations
                    </Link>
                  </li>
                  <li>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </li>
                  <li>
                    <span className="text-gray-900 font-medium">Approved</span>
                  </li>
                </ol>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Approved Registrations</h1>
              <p className="text-gray-600 mt-2">Applications that have been approved and ready for processing</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{totalCount}</span> approved
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Approved Status
          </span>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-4 rounded-full animate-spin mb-4" style={{ borderTopColor: '#4CAF50' }}></div>
              <p className="text-gray-600">Loading approved registrations...</p>
            </div>
          </div>
        )}

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
                <h3 className="text-lg font-semibold text-red-800">Unable to load approved registrations</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <div className="mt-4">
                  <button
                    onClick={() => fetchRegistrations(currentPage, itemsPerPage)}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#4A90E2', color: 'white' }}>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {registration.documents?.length || 0} docs
                          </span>
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
                            <button
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                              style={{ backgroundColor: '#4A90E2', color: 'white' }}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Complete
                            </button>
                            <button
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H9.5a2 2 0 00-2 2v4a2 2 0 002 2h2M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M7 7V3a2 2 0 012-2h6a2 2 0 012 2v4" />
                              </svg>
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#FBFBFB' }}>
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No approved registrations</h3>
                          <p className="text-gray-500 text-sm">No applications have been approved yet or all approved applications have been completed.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}