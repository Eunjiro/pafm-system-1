"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FiUsers, FiFileText, FiAward, FiMap,
  FiAlertCircle, FiTrendingUp, FiTrendingDown,
  FiCheckCircle, FiClock, FiMapPin
} from "react-icons/fi"
import { GiTombstone } from "react-icons/gi"
import { MdLocalHospital } from "react-icons/md"

interface DashboardStats {
  deathRegistrations: {
    total: number
    pending: number
    approved: number
    thisMonth: number
  }
  permits: {
    total: number
    burial: number
    exhumation: number
    cremation: number
    pending: number
    approved: number
  }
  certificates: {
    total: number
    pending: number
    issued: number
    thisMonth: number
  }
  cemeteries: {
    total: number
    totalPlots: number
    occupiedPlots: number
    availablePlots: number
  }
}

interface RecentActivity {
  id: number
  type: string
  description: string
  status: string
  createdAt: string
}

export default function CemeteryBurialDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('[Cemetery Dashboard] Fetching data from /api/cemetery-burial/dashboard')
      
      const response = await fetch('/api/cemetery-burial/dashboard')
      
      console.log('[Cemetery Dashboard] Response status:', response.status)
      
      const data = await response.json()
      
      console.log('[Cemetery Dashboard] Response data:', data)
      
      if (data.success) {
        setStats(data.data.summary)
        setRecentActivities(data.data.recentActivities || [])
        console.log('[Cemetery Dashboard] Data loaded successfully')
      } else {
        const errorMsg = data.message || 'Failed to load dashboard data'
        const detailMsg = data.details ? `\n\nDetails: ${data.details}` : ''
        const hintMsg = data.hint ? `\n\n${data.hint}` : ''
        setError(errorMsg + detailMsg + hintMsg)
        console.error('[Cemetery Dashboard] Error response:', data)
      }
    } catch (error) {
      console.error('[Cemetery Dashboard] Fetch error:', error)
      setError('Failed to connect to server. Please check if the backend service is running on port 3001.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl w-full">
          <div className="flex items-center space-x-3 mb-4">
            <FiAlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-red-900">Error Loading Dashboard</h2>
          </div>
          <div className="text-red-700 mb-4 whitespace-pre-wrap">{error}</div>
          <div className="bg-red-100 border border-red-300 rounded p-4 mb-4">
            <h3 className="font-semibold text-red-900 mb-2">Troubleshooting Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-red-800">
              <li>Check if the burial-cemetery service is running on port 3001</li>
              <li>Verify the BURIAL_CEMETERY_SERVICE_URL environment variable</li>
              <li>Check the browser console for detailed error logs</li>
              <li>Check the terminal running the backend service for errors</li>
            </ol>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cemetery & Burial Management</h1>
          <p className="text-gray-600 mt-1">Overview of cemetery operations and burial services</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Death Registrations */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <MdLocalHospital className="w-6 h-6 text-red-600" />
            </div>
            <Link 
              href="/admin/death-registration"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All →
            </Link>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Death Registrations</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.deathRegistrations.total || 0}</p>
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-600">Pending: {stats?.deathRegistrations.pending || 0}</span>
            <span className="text-green-600 font-medium">+{stats?.deathRegistrations.thisMonth || 0} this month</span>
          </div>
        </div>

        {/* Permits */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
            <Link 
              href="/admin/permits"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All →
            </Link>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Total Permits</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.permits.total || 0}</p>
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-600">Pending: {stats?.permits.pending || 0}</span>
            <span className="text-green-600 font-medium">{stats?.permits.approved || 0} Approved</span>
          </div>
        </div>

        {/* Certificates */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FiAward className="w-6 h-6 text-yellow-600" />
            </div>
            <Link 
              href="/admin/certificates"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All →
            </Link>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Certificates</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.certificates.total || 0}</p>
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-600">Pending: {stats?.certificates.pending || 0}</span>
            <span className="text-green-600 font-medium">+{stats?.certificates.thisMonth || 0} this month</span>
          </div>
        </div>

        {/* Cemetery Plots */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <GiTombstone className="w-6 h-6 text-green-600" />
            </div>
            <Link 
              href="/admin/cemetery/plots"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All →
            </Link>
          </div>
          <h3 className="text-gray-600 text-sm font-medium">Cemetery Plots</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.cemeteries.totalPlots || 0}</p>
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-600">Occupied: {stats?.cemeteries.occupiedPlots || 0}</span>
            <span className="text-green-600 font-medium">{stats?.cemeteries.availablePlots || 0} Available</span>
          </div>
        </div>
      </div>

      {/* Permit Breakdown & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permit Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Permit Breakdown</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Burial Permits */}
            <Link href="/admin/permits/burial" className="block hover:bg-gray-50 p-3 rounded-lg transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FiUsers className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Burial Permits</p>
                    <p className="text-sm text-gray-600">Active burial permits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats?.permits.burial || 0}</p>
                </div>
              </div>
            </Link>

            {/* Exhumation Permits */}
            <Link href="/admin/permits/exhumation" className="block hover:bg-gray-50 p-3 rounded-lg transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <FiAlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Exhumation Permits</p>
                    <p className="text-sm text-gray-600">Active exhumation permits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats?.permits.exhumation || 0}</p>
                </div>
              </div>
            </Link>

            {/* Cremation Permits */}
            <Link href="/admin/permits/cremation" className="block hover:bg-gray-50 p-3 rounded-lg transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <FiTrendingUp className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Cremation Permits</p>
                    <p className="text-sm text-gray-600">Active cremation permits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats?.permits.cremation || 0}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          </div>
          <div className="p-6">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activities</p>
            ) : (
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex-shrink-0">
                      {activity.type === 'death-registration' && (
                        <div className="bg-red-100 p-2 rounded-lg">
                          <MdLocalHospital className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                      {activity.type === 'permit' && (
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <FiFileText className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      {activity.type === 'certificate' && (
                        <div className="bg-yellow-100 p-2 rounded-lg">
                          <FiAward className="w-4 h-4 text-yellow-600" />
                        </div>
                      )}
                      {activity.type === 'cemetery' && (
                        <div className="bg-green-100 p-2 rounded-lg">
                          <GiTombstone className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          activity.status === 'approved' || activity.status === 'issued' 
                            ? 'bg-green-100 text-green-800'
                            : activity.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.status}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Access</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            href="/admin/death-registration"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="bg-red-100 p-3 rounded-lg">
              <MdLocalHospital className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Death Registrations</p>
              <p className="text-sm text-gray-600">Register new deaths</p>
            </div>
          </Link>

          <Link 
            href="/admin/permits"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="bg-blue-100 p-3 rounded-lg">
              <FiFileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Manage Permits</p>
              <p className="text-sm text-gray-600">View all permits</p>
            </div>
          </Link>

          <Link 
            href="/admin/certificates"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FiAward className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Certificates</p>
              <p className="text-sm text-gray-600">Issue certificates</p>
            </div>
          </Link>

          <Link 
            href="/admin/cemetery-map"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="bg-purple-100 p-3 rounded-lg">
              <FiMap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create Cemetery</p>
              <p className="text-sm text-gray-600">Design new cemeteries</p>
            </div>
          </Link>

          <Link 
            href="/admin/cemetery"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="bg-green-100 p-3 rounded-lg">
              <GiTombstone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Manage Cemeteries</p>
              <p className="text-sm text-gray-600">View all cemeteries</p>
            </div>
          </Link>

          <Link 
            href="/admin/cemetery/plots"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="bg-indigo-100 p-3 rounded-lg">
              <FiMapPin className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Plot Management</p>
              <p className="text-sm text-gray-600">Manage cemetery plots</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
