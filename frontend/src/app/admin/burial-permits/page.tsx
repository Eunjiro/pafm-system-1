"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface BurialPermit {
  id: string
  deceasedName: string
  applicantName: string
  relationship: string
  deathCertificateNumber?: string
  burialSite: string
  burialDate: string
  appliedDate: string
  status: 'pending' | 'approved' | 'denied' | 'expired'
  amount: number
  orNumber?: string
  approvedBy?: string
  notes?: string
}

export default function BurialPermits() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [permits, setPermits] = useState<BurialPermit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin")
      return
    }

    // Mock data - replace with actual API call
    const mockPermits: BurialPermit[] = [
      {
        id: "BP-2025-001",
        deceasedName: "Juan Dela Cruz",
        applicantName: "Maria Dela Cruz",
        relationship: "Spouse",
        deathCertificateNumber: "DC-2025-001",
        burialSite: "Lot 15, Block A, Municipal Cemetery",
        burialDate: "2025-01-03",
        appliedDate: "2025-01-02",
        status: "approved",
        amount: 200,
        orNumber: "OR-2025-201",
        approvedBy: "Admin User"
      },
      {
        id: "BP-2025-002",
        deceasedName: "Rosa Martinez",
        applicantName: "Carlos Martinez",
        relationship: "Son",
        burialSite: "Lot 22, Block B, Municipal Cemetery",
        burialDate: "2025-01-05",
        appliedDate: "2025-01-04",
        status: "pending",
        amount: 200
      },
      {
        id: "BP-2025-003",
        deceasedName: "Pedro Garcia",
        applicantName: "Carmen Garcia",
        relationship: "Daughter",
        deathCertificateNumber: "DC-2025-003",
        burialSite: "Private Cemetery - San Miguel",
        burialDate: "2025-01-06",
        appliedDate: "2025-01-05",
        status: "approved",
        amount: 150,
        orNumber: "OR-2025-202",
        approvedBy: "Admin User"
      }
    ]

    setTimeout(() => {
      setPermits(mockPermits)
      setLoading(false)
    }, 1000)
  }, [session, status, router])

  const getStatusBadge = (status: BurialPermit['status']) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      denied: { bg: 'bg-red-100', text: 'text-red-800', label: 'Denied' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Expired' }
    }

    const style = styles[status]
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const handleApprove = (id: string) => {
    setPermits(prev => 
      prev.map(permit => 
        permit.id === id 
          ? { ...permit, status: 'approved' as const, approvedBy: session?.user?.name || 'Admin' }
          : permit
      )
    )
  }

  const handleDeny = (id: string) => {
    setPermits(prev => 
      prev.map(permit => 
        permit.id === id 
          ? { ...permit, status: 'denied' as const }
          : permit
      )
    )
  }

  const isUrgent = (burialDate: string) => {
    const burial = new Date(burialDate)
    const today = new Date()
    const diffTime = burial.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 1
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
          <h2 className="text-lg font-medium text-gray-900">Filter Applications</h2>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="expired">Expired</option>
            </select>
            <button
              className="text-white px-4 py-2 rounded-md transition-colors hover:opacity-90"
              style={{backgroundColor: '#4CAF50'}}
            >
              New Permit
            </button>
          </div>
        </div>
      </div>

      {/* Permits Table */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Burial Permit Applications</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permit ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deceased Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Burial Site
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Burial Date
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
                  {permits.map((permit) => (
                    <tr key={permit.id} className={`hover:bg-gray-50 ${isUrgent(permit.burialDate) && permit.status === 'pending' ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {permit.id}
                        {isUrgent(permit.burialDate) && permit.status === 'pending' && (
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            URGENT
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {permit.deceasedName}
                        {permit.deathCertificateNumber && (
                          <div className="text-xs text-gray-500">DC: {permit.deathCertificateNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {permit.applicantName}
                        <div className="text-xs text-gray-400">({permit.relationship})</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={permit.burialSite}>
                          {permit.burialSite}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {permit.burialDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(permit.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₱{permit.amount}
                        {permit.orNumber && (
                          <div className="text-xs text-gray-500">{permit.orNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => console.log('View details for', permit.id)}
                            className="text-white px-3 py-1 rounded text-xs hover:opacity-80"
                            style={{backgroundColor: '#4A90E2'}}
                          >
                            View
                          </button>
                          {permit.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(permit.id)}
                                className="text-white px-3 py-1 rounded text-xs hover:opacity-80"
                                style={{backgroundColor: '#4CAF50'}}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDeny(permit.id)}
                                className="text-white px-3 py-1 rounded text-xs hover:opacity-80"
                                style={{backgroundColor: '#FDA811'}}
                              >
                                Deny
                              </button>
                            </>
                          )}
                          {permit.status === 'approved' && (
                            <button
                              onClick={() => console.log('Print permit for', permit.id)}
                              className="text-white px-3 py-1 rounded text-xs hover:opacity-80"
                              style={{backgroundColor: '#FDA811'}}
                            >
                              Print
                            </button>
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
                Showing {permits.length} permit(s)
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