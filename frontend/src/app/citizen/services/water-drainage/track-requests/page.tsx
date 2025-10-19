'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CitizenHeader from '@/components/CitizenHeader'

interface Request {
  id: number
  trackingNumber: string
  type: 'drainage' | 'water-connection' | 'water-issue'
  status: string
  description?: string
  issueType?: string
  connectionType?: string
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Under Review': 'bg-blue-100 text-blue-800',
  'Approved': 'bg-green-100 text-green-800',
  'In Progress': 'bg-indigo-100 text-indigo-800',
  'Completed': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Cancelled': 'bg-gray-100 text-gray-800',
  'Reported': 'bg-orange-100 text-orange-800',
  'Investigating': 'bg-purple-100 text-purple-800',
  'Resolved': 'bg-teal-100 text-teal-800',
}

const typeLabels: Record<string, string> = {
  'drainage': 'Drainage Service',
  'water-connection': 'Water Connection',
  'water-issue': 'Water Issue Report',
}

const typeColors: Record<string, string> = {
  'drainage': 'text-cyan-600',
  'water-connection': 'text-blue-600',
  'water-issue': 'text-sky-600',
}

export default function TrackRequestsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<Request[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'drainage' | 'water-connection' | 'water-issue'>('all')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      // Fetch all types of requests
      const [drainageRes, connectionsRes, issuesRes] = await Promise.all([
        fetch('/api/drainage'),
        fetch('/api/water-connections'),
        fetch('/api/water-issues'),
      ])

      const drainageData = await drainageRes.json()
      const connectionsData = await connectionsRes.json()
      const issuesData = await issuesRes.json()

      // Combine and format all requests
      const allRequests: Request[] = [
        ...(drainageData.requests || []).map((req: any) => ({
          ...req,
          type: 'drainage' as const,
        })),
        ...(connectionsData.applications || []).map((app: any) => ({
          ...app,
          type: 'water-connection' as const,
        })),
        ...(issuesData.issues || []).map((issue: any) => ({
          ...issue,
          type: 'water-issue' as const,
        })),
      ]

      // Sort by date (newest first)
      allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setRequests(allRequests)
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = activeTab === 'all' 
    ? requests 
    : requests.filter(req => req.type === activeTab)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-teal-600 hover:text-teal-700 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Services
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Track My Requests</h1>
              <p className="mt-2 text-gray-600">
                View and monitor all your water and drainage service requests.
              </p>
            </div>
            <button
              onClick={loadRequests}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Requests ({requests.length})
              </button>
              <button
                onClick={() => setActiveTab('drainage')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'drainage'
                    ? 'border-cyan-600 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Drainage ({requests.filter(r => r.type === 'drainage').length})
              </button>
              <button
                onClick={() => setActiveTab('water-connection')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'water-connection'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Water Connections ({requests.filter(r => r.type === 'water-connection').length})
              </button>
              <button
                onClick={() => setActiveTab('water-issue')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'water-issue'
                    ? 'border-sky-600 text-sky-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Water Issues ({requests.filter(r => r.type === 'water-issue').length})
              </button>
            </nav>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading your requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-4">
                {activeTab === 'all' 
                  ? 'No requests found. Start by submitting a service request.'
                  : `No ${typeLabels[activeTab]} requests found.`
                }
              </p>
              <button
                onClick={() => router.push('/citizen/services')}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
              >
                Submit New Request
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={`${request.type}-${request.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.trackingNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${typeColors[request.type]}`}>
                          {typeLabels[request.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {request.type === 'drainage' && request.description}
                          {request.type === 'water-connection' && request.connectionType}
                          {request.type === 'water-issue' && request.issueType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[request.status] || 'bg-gray-100 text-gray-800'}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Help Section */}
        {!loading && filteredRequests.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Need Help?</h3>
            <p className="text-sm text-blue-800">
              If you have questions about your request status or need to provide additional information, 
              please contact our office at <strong>(123) 456-7890</strong> or email{' '}
              <strong>water.drainage@municipality.gov.ph</strong>. 
              Please have your tracking number ready when contacting us.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
