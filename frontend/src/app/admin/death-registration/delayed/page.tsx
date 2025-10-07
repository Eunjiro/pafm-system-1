"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { FiClock, FiClipboard, FiDollarSign, FiAlertTriangle } from "react-icons/fi"

interface DelayedRegistration {
  id: string
  deceasedName: string
  informantName: string
  birthDate: string
  deathDate: string
  submittedDate: string
  status: string
  amount: number
  delayReason: string
  yearsDelayed: number
}

export default function DelayedDeathRegistration() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [registrations, setRegistrations] = useState<DelayedRegistration[]>([])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.replace("/auth/signin")
      return
    }

    if (session.user?.role !== "ADMIN" && session.user?.role !== "EMPLOYEE") {
      router.replace("/unauthorized")
      return
    }

    // Load data
    loadRegistrations()
  }, [session, status, router])

  const loadRegistrations = () => {
    // Mock data - replace with actual API call
    const mockRegistrations: DelayedRegistration[] = [
      {
        id: "DRD-2025-001",
        deceasedName: "Jose Santos",
        informantName: "Ana Santos",
        birthDate: "1940-03-20",
        deathDate: "2020-08-15",
        submittedDate: "2025-01-10",
        status: "pending_review",
        amount: 150,
        delayReason: "Lost documents due to natural disaster",
        yearsDelayed: 4
      },
      {
        id: "DRD-2025-002",
        deceasedName: "Carmen Rivera",
        informantName: "Roberto Rivera",
        birthDate: "1935-11-05",
        deathDate: "2018-04-22",
        submittedDate: "2025-01-08",
        status: "additional_docs_required",
        amount: 150,
        delayReason: "Family relocated, documents misplaced",
        yearsDelayed: 6
      }
    ]
    setRegistrations(mockRegistrations)
  }

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      'pending_review': 'bg-yellow-100 text-yellow-800',
      'additional_docs_required': 'bg-red-100 text-red-800',
      'for_payment': 'bg-blue-100 text-blue-800',
      'registered': 'bg-green-100 text-green-800'
    }
    
    const statusLabels: Record<string, string> = {
      'pending_review': 'Pending Review',
      'additional_docs_required': 'Docs Required',
      'for_payment': 'For Payment',
      'registered': 'Registered'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    )
  }

  const getDelayPriorityBadge = (years: number) => {
    if (years >= 5) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Critical ({years}y)</span>
    } else if (years >= 3) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">High ({years}y)</span>
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Medium ({years}y)</span>
    }
  }

  const filteredRegistrations = registrations.filter(reg => 
    selectedFilter === 'all' || reg.status === selectedFilter
  )

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#4CAF50'}}></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Delayed Registration Queue</h2>
          <p className="text-gray-600">Review and process delayed death registration applications</p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="additional_docs_required">Docs Required</option>
            <option value="for_payment">For Payment</option>
            <option value="registered">Registered</option>
          </select>
          <button
            className="text-white px-4 py-2 rounded-md transition-colors hover:opacity-90"
            style={{backgroundColor: '#FDA811'}}
          >
            Review Guidelines
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Delayed</p>
              <p className="text-2xl font-semibold text-gray-900">{registrations.length}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FiClock size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-semibold text-gray-900">
                {registrations.filter(r => r.status === 'pending_review').length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiClipboard size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Critical (5+ years)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {registrations.filter(r => r.yearsDelayed >= 5).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FiAlertTriangle size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Revenue Potential</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₱{registrations.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FiDollarSign size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Delayed Registrations</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deceased</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Death Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{registration.id}</div>
                      <div className="text-sm text-gray-500">by {registration.informantName}</div>
                      <div className="text-xs text-gray-400">{new Date(registration.submittedDate).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{registration.deceasedName}</div>
                    <div className="text-sm text-gray-500">Born: {new Date(registration.birthDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(registration.deathDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getDelayPriorityBadge(registration.yearsDelayed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(registration.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₱{registration.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">Review</button>
                    <button className="text-green-600 hover:text-green-900">Approve</button>
                    <button className="text-yellow-600 hover:text-yellow-900">Request Docs</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No delayed registrations found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}