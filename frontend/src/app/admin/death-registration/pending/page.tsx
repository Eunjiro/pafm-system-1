"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface DeathRegistration {
  id: string
  registrationType: 'regular' | 'delayed'
  deceasedName: string
  informantName: string
  submittedDate: string
  status: 'submitted' | 'pending_verification' | 'for_payment' | 'paid' | 'registered' | 'for_pickup' | 'claimed'
  amount: number
  orNumber?: string
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

    // Mock data - replace with actual API call
    const mockRegistrations: DeathRegistration[] = [
      {
        id: "DR-2025-001",
        registrationType: "regular",
        deceasedName: "Juan Dela Cruz",
        informantName: "Maria Dela Cruz",
        submittedDate: "2025-10-05",
        status: "pending_verification",
        amount: 50
      },
      {
        id: "DR-2025-002",
        registrationType: "delayed",
        deceasedName: "Jose Santos",
        informantName: "Ana Santos",
        submittedDate: "2025-10-04",
        status: "for_payment",
        amount: 150
      },
      {
        id: "DR-2025-003",
        registrationType: "regular",
        deceasedName: "Pedro Garcia",
        informantName: "Carmen Garcia",
        submittedDate: "2025-10-03",
        status: "paid",
        amount: 50,
        orNumber: "OR-2025-123"
      }
    ]

    setTimeout(() => {
      setRegistrations(mockRegistrations)
      setLoading(false)
    }, 1000)
  }, [session, status, router])

  const getStatusBadge = (status: DeathRegistration['status']) => {
    const styles = {
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      pending_verification: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Verification' },
      for_payment: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'For Payment' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
      registered: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Registered' },
      for_pickup: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'For Pickup' },
      claimed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Claimed' }
    }

    const style = styles[status]
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const handleApprove = (id: string) => {
    setRegistrations(prev => 
      prev.map(reg => 
        reg.id === id 
          ? { ...reg, status: reg.status === 'pending_verification' ? 'for_payment' as const : reg.status }
          : reg
      )
    )
  }

  const handleReject = (id: string) => {
    // Handle rejection logic
    console.log('Rejecting registration:', id)
  }

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
              <option value="pending_verification">Pending Verification</option>
              <option value="for_payment">For Payment</option>
              <option value="paid">Paid</option>
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
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {registration.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="capitalize">{registration.registrationType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registration.deceasedName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.informantName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.submittedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(registration.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₱{registration.amount}
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
                          {registration.status === 'pending_verification' && (
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
                Showing {registrations.length} registration(s)
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