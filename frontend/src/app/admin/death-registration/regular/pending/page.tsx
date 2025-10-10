"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface DeathRegistration {
  id: number
  registrationType: 'REGULAR' | 'DELAYED'
  status: 'SUBMITTED' | 'VERIFIED' | 'FOR_PAYMENT' | 'PAID' | 'REGISTERED' | 'FOR_PICKUP' | 'CLAIMED'
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
}

export default function PendingDeathRegistrations() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<DeathRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin")
      return
    }

    fetchRegistrations()
  }, [session, status, router])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/death-registrations')
      
      if (!response.ok) {
        throw new Error('Failed to fetch registrations')
      }
      
      const data = await response.json()
      setRegistrations(data.registrations || [])
    } catch (error) {
      console.error('Error fetching registrations:', error)
      setRegistrations([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: DeathRegistration['status']) => {
    const styles = {
      SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      VERIFIED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Verified' },
      FOR_PAYMENT: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'For Payment' },
      PAID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      REGISTERED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Registered' },
      FOR_PICKUP: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'For Pickup' },
      CLAIMED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Claimed' }
    }

    const style = styles[status]
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`/api/death-registrations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'FOR_PAYMENT' }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve registration')
      }

      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === id 
            ? { ...reg, status: 'FOR_PAYMENT' as const }
            : reg
        )
      )
    } catch (error) {
      console.error('Error approving registration:', error)
      alert('Failed to approve registration')
    }
  }

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`/api/death-registrations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'SUBMITTED', remarks: 'Rejected by admin' }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject registration')
      }

      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === id 
            ? { ...reg, status: 'SUBMITTED' as const }
            : reg
        )
      )
    } catch (error) {
      console.error('Error rejecting registration:', error)
      alert('Failed to reject registration')
    }
  }

  const filteredRegistrations = registrations.filter(registration => {
    if (selectedFilter === 'all') return true
    return registration.status === selectedFilter
  })

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFBFB'}}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#4CAF50'}}></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Filter Registrations</h2>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="VERIFIED">Verified</option>
              <option value="FOR_PAYMENT">For Payment</option>
              <option value="PAID">Paid</option>
            </select>
            <button
              className="text-white px-4 py-2 rounded-md transition-colors hover:opacity-90"
              style={{backgroundColor: '#4CAF50'}}
            >
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Registration Queue */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Registration Queue</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
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
                      Informant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {registration.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="capitalize">{registration.registrationType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registration.deceased ? 
                          `${registration.deceased.firstName} ${registration.deceased.middleName || ''} ${registration.deceased.lastName}`.trim() 
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.submitter ? 
                          `${registration.submitter.fullNameFirst} ${registration.submitter.fullNameMiddle || ''} ${registration.submitter.fullNameLast}`.trim()
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(registration.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(registration.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₱{registration.amountDue || 0}
                        {registration.orNumber && (
                          <div className="text-xs text-gray-500">{registration.orNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => console.log('View details for', registration.id)}
                            className="text-white px-3 py-1 rounded text-xs hover:opacity-80"
                            style={{backgroundColor: '#4A90E2'}}
                          >
                            View
                          </button>
                          {registration.status === 'SUBMITTED' && (
                            <>
                              <button
                                onClick={() => handleApprove(registration.id)}
                                className="text-white px-3 py-1 rounded text-xs hover:opacity-80"
                                style={{backgroundColor: '#4CAF50'}}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(registration.id)}
                                className="text-white px-3 py-1 rounded text-xs hover:opacity-80"
                                style={{backgroundColor: '#FDA811'}}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {filteredRegistrations.length} of {registrations.length} registration(s)
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
    </div>
  )
}