"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface RegularRegistration {
  id: string
  deceasedName: string
  informantName: string
  birthDate: string
  deathDate: string
  submittedDate: string
  status: 'submitted' | 'verified' | 'for_payment' | 'paid' | 'registered' | 'for_pickup' | 'claimed'
  amount: number
  orNumber?: string
  registeredBy?: string
}

export default function RegularDeathRegistrations() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<RegularRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>('all')


  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin")
      return
    }

    // Mock data - replace with actual API call
    const mockRegistrations: RegularRegistration[] = [
      {
        id: "DR-2025-001",
        deceasedName: "Juan Dela Cruz",
        informantName: "Maria Dela Cruz",
        birthDate: "1950-05-15",
        deathDate: "2025-01-01",
        submittedDate: "2025-01-02",
        status: "registered",
        amount: 50,
        orNumber: "OR-2025-001",
        registeredBy: "Admin User"
      },
      {
        id: "DR-2025-004",
        deceasedName: "Rosa Martinez",
        informantName: "Carlos Martinez",
        birthDate: "1955-08-20",
        deathDate: "2025-01-03",
        submittedDate: "2025-01-04",
        status: "for_pickup",
        amount: 50,
        orNumber: "OR-2025-002",
        registeredBy: "Admin User"
      },
      {
        id: "DR-2025-007",
        deceasedName: "Antonio Cruz",
        informantName: "Elena Cruz",
        birthDate: "1960-12-10",
        deathDate: "2025-01-05",
        submittedDate: "2025-01-06",
        status: "paid",
        amount: 50,
        orNumber: "OR-2025-003"
      }
    ]

    setTimeout(() => {
      setRegistrations(mockRegistrations)
      setLoading(false)
    }, 1000)
  }, [session, status, router])

  const getStatusBadge = (status: RegularRegistration['status']) => {
    const styles = {
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      verified: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Verified' },
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

  const handleMarkClaimed = (id: string) => {
    setRegistrations(prev => 
      prev.map(reg => 
        reg.id === id 
          ? { ...reg, status: 'claimed' as const }
          : reg
      )
    )
  }

  const calculateAge = (birthDate: string, deathDate: string) => {
    const birth = new Date(birthDate)
    const death = new Date(deathDate)
    const age = death.getFullYear() - birth.getFullYear()
    const monthDiff = death.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      return age - 1
    }
    return age
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
              <option value="paid">Paid</option>
              <option value="registered">Registered</option>
              <option value="for_pickup">For Pickup</option>
              <option value="claimed">Claimed</option>
            </select>
            <button
              className="text-white px-4 py-2 rounded-md transition-colors hover:opacity-90"
              style={{backgroundColor: '#4CAF50'}}
            >
              New Registration
            </button>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Regular Registrations</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deceased Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age at Death
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Death Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Informant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      OR Number
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registration.deceasedName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {calculateAge(registration.birthDate, registration.deathDate)} years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.deathDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.informantName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(registration.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registration.orNumber || '-'}
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
                          {registration.status === 'for_pickup' && (
                            <button
                              onClick={() => handleMarkClaimed(registration.id)}
                              className="text-white px-3 py-1 rounded text-xs hover:opacity-80"
                              style={{backgroundColor: '#4CAF50'}}
                            >
                              Mark Claimed
                            </button>
                          )}
                          <button
                            onClick={() => console.log('Print certificate for', registration.id)}
                            className="text-white px-3 py-1 rounded text-xs hover:opacity-80"
                            style={{backgroundColor: '#FDA811'}}
                          >
                            Print
                          </button>
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