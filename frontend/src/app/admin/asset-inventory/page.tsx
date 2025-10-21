"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FiPackage, FiTruck, FiFileText,
  FiAlertCircle, FiTrendingUp, FiTrendingDown,
  FiCheckCircle, FiBox, FiDatabase
} from "react-icons/fi"

interface DashboardStats {
  totalItemsInStock: number
  totalDeliveries: number
  pendingVerification: number
  risRequests: {
    pending: number
    approved: number
    issued: number
    total: number
  }
  lowStockItems: number
}

interface RecentActivity {
  id: number
  type: string
  itemCode: string
  itemName: string
  quantityIn: number
  quantityOut: number
  balance: number
  performedBy: string
  createdAt: string
}

interface StockCategory {
  category: string
  itemCount: number
  totalQuantity: number
}

interface Alert {
  type: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  data?: any
}

export default function AssetInventoryDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [stockByCategory, setStockByCategory] = useState<StockCategory[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/asset-inventory/dashboard')
      const statsData = await statsResponse.json()
      
      if (statsData.success) {
        setStats(statsData.data.summary)
        setRecentActivities(statsData.data.recentActivities)
        setStockByCategory(statsData.data.stockByCategory)
      }

      // Fetch alerts
      const alertsResponse = await fetch('/api/asset-inventory/dashboard/alerts')
      const alertsData = await alertsResponse.json()
      
      if (alertsData.success) {
        setAlerts(alertsData.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Inventory & Warehouse</h1>
          <p className="text-gray-600 mt-1">Manage supplies, storage, and asset distribution</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FiDatabase className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                alert.severity === 'critical'
                  ? 'bg-red-50 border-red-200'
                  : alert.severity === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <FiAlertCircle
                className={`w-5 h-5 mt-0.5 ${
                  alert.severity === 'critical'
                    ? 'text-red-600'
                    : alert.severity === 'warning'
                    ? 'text-yellow-600'
                    : 'text-blue-600'
                }`}
              />
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    alert.severity === 'critical'
                      ? 'text-red-900'
                      : alert.severity === 'warning'
                      ? 'text-yellow-900'
                      : 'text-blue-900'
                  }`}
                >
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalItemsInStock || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">In catalog</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiPackage className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Deliveries */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.totalDeliveries || 0}
              </p>
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                {stats?.pendingVerification || 0} pending
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiTruck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* RIS Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">RIS Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.risRequests.total || 0}
              </p>
              <p className="text-sm text-orange-600 mt-1">
                {stats?.risRequests.pending || 0} pending approval
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiFileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.lowStockItems || 0}
              </p>
              <p className="text-sm text-red-600 mt-1">Needs reorder</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/asset-inventory/receiving"
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
        >
          <FiTruck className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Receive Delivery</h3>
          <p className="text-sm text-blue-100 mt-1">Process incoming supplies</p>
        </Link>

        <Link
          href="/admin/asset-inventory/ris"
          className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
        >
          <FiFileText className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Review RIS</h3>
          <p className="text-sm text-orange-100 mt-1">Approve requisitions</p>
        </Link>

        <Link
          href="/admin/asset-inventory/storage"
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
        >
          <FiDatabase className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Manage Storage</h3>
          <p className="text-sm text-green-100 mt-1">Organize warehouse</p>
        </Link>

        <Link
          href="/admin/asset-inventory/physical-count"
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <FiBox className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg">Physical Count</h3>
          <p className="text-sm text-purple-100 mt-1">Validate inventory</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivities.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No recent activities
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activity.type === 'RECEIVED'
                          ? 'bg-green-100'
                          : activity.type === 'ISSUED'
                          ? 'bg-orange-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      {activity.type === 'RECEIVED' ? (
                        <FiTrendingUp className="w-5 h-5 text-green-600" />
                      ) : activity.type === 'ISSUED' ? (
                        <FiTrendingDown className="w-5 h-5 text-orange-600" />
                      ) : (
                        <FiCheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.itemName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.itemCode} • {activity.type}
                        {activity.quantityIn > 0 && ` +${activity.quantityIn}`}
                        {activity.quantityOut > 0 && ` -${activity.quantityOut}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {activity.performedBy}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {activity.balance}
                      </p>
                      <p className="text-xs text-gray-500">Balance</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock by Category */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Stock by Category</h3>
          </div>
          <div className="p-6">
            {stockByCategory.length === 0 ? (
              <div className="text-center text-gray-500">No stock data available</div>
            ) : (
              <div className="space-y-4">
                {stockByCategory.map((category, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {category.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {category.itemCount} items • {category.totalQuantity} units
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (category.totalQuantity /
                              Math.max(...stockByCategory.map((c) => c.totalQuantity))) *
                              100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
