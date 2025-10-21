"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { 
  FiUser, FiActivity, FiTrendingUp, FiShield, FiClock, FiCheckCircle,
  FiAlertTriangle, FiRefreshCw, FiSettings, FiBarChart, FiServer,
  FiUsers, FiPackage, FiHome, FiDroplet, FiCpu, FiZap, FiDatabase
} from "react-icons/fi"
import { 
  MdDashboard
} from "react-icons/md"
import { GiTombstone } from "react-icons/gi"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // System-wide statistics
  const [systemStats] = useState({
    totalUsers: 1247,
    activeUsers: 89,
    activeServices: 4,
    totalTransactions: 45632,
    systemUptime: "99.9%",
    todayTransactions: 234
  })

  // Microservices health status
  const [services] = useState([
    {
      id: 1,
      name: "Cemetery & Burial Management",
      icon: GiTombstone,
      color: "#4CAF50",
      status: "healthy",
      uptime: "99.9%",
      activeRequests: 23,
      totalRecords: 8549,
      route: "/admin/cemetery",
      description: "Death registration, permits, certificates",
      stats: {
        pending: 12,
        processed: 234,
        today: 15
      }
    },
    {
      id: 2,
      name: "Water Supply & Drainage",
      icon: FiDroplet,
      color: "#4A90E2",
      status: "healthy",
      uptime: "99.5%",
      activeRequests: 18,
      totalRecords: 6234,
      route: "/admin/water",
      description: "Water connections, billing, maintenance",
      stats: {
        pending: 8,
        processed: 189,
        today: 12
      }
    },
    {
      id: 3,
      name: "Asset Inventory System",
      icon: FiPackage,
      color: "#FDA811",
      status: "healthy",
      uptime: "100%",
      activeRequests: 31,
      totalRecords: 12450,
      route: "/admin/asset-inventory",
      description: "Asset tracking, physical count, issuance",
      stats: {
        pending: 5,
        processed: 421,
        today: 28
      }
    },
    {
      id: 4,
      name: "Facility Management",
      icon: FiHome,
      color: "#9C27B0",
      status: "healthy",
      uptime: "99.8%",
      activeRequests: 14,
      totalRecords: 3892,
      route: "/admin/facility",
      description: "Space booking, maintenance, scheduling",
      stats: {
        pending: 6,
        processed: 167,
        today: 9
      }
    }
  ])

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4 border-green-500"></div>
          <div className="text-gray-600 text-lg font-medium">Loading System Dashboard...</div>
        </div>
      </div>
    )
  }

  // Show auth required if no session
  if (!session) {
    router.push("/auth/signin")
    return null
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Dashboard</h1>
          <p className="text-gray-600 mt-1">Public Assets & Facilities Management</p>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">All Services Online</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center space-x-2">
              <FiClock className="text-gray-500" size={14} />
              <span className="text-sm text-gray-600">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center space-x-2">
              <FiUser className="text-gray-500" size={14} />
              <span className="text-sm text-gray-600">{session?.user?.name || 'Admin'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] transition-colors flex items-center gap-2"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{systemStats.totalUsers.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {systemStats.activeUsers} active
            </span>
          </div>
        </div>

        {/* Active Services */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiServer className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{systemStats.activeServices}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Active Services</h3>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
              All online
            </span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiDatabase className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{systemStats.totalTransactions.toLocaleString()}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Transactions</h3>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
              {systemStats.todayTransactions} today
            </span>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiCpu className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-green-600">{systemStats.systemUptime}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">System Uptime</h3>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
              Excellent
            </span>
          </div>
        </div>
      </div>

      {/* Microservices Status */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Microservices Status</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-medium">All systems operational</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {services.map((service) => {
            const IconComponent = service.icon
            return (
              <div 
                key={service.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#4CAF50] transition-all cursor-pointer group"
                onClick={() => router.push(service.route)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: service.color }}
                    >
                      <IconComponent className="text-white text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 px-2 py-1 bg-green-50 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-green-700">{service.status}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center space-x-1 mb-1">
                      <FiActivity className="text-orange-500" size={14} />
                      <span className="text-xs text-gray-600">Pending</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{service.stats.pending}</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center space-x-1 mb-1">
                      <FiCheckCircle className="text-green-500" size={14} />
                      <span className="text-xs text-gray-600">Processed</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{service.stats.processed}</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center space-x-1 mb-1">
                      <FiTrendingUp className="text-blue-500" size={14} />
                      <span className="text-xs text-gray-600">Today</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">{service.stats.today}</div>
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <FiZap className="text-gray-400" size={14} />
                      <span><span className="font-medium text-gray-900">{service.uptime}</span> uptime</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FiDatabase className="text-gray-400" size={14} />
                      <span><span className="font-medium text-gray-900">{service.totalRecords.toLocaleString()}</span> records</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-400 group-hover:text-[#4CAF50] transition-colors">
                    <span>View</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/admin/users')}
            className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition-colors">
              <FiUsers className="text-blue-500 group-hover:text-white text-xl transition-colors" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Manage Users</span>
          </button>

          <button 
            onClick={() => router.push('/admin/analytics')}
            className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 group-hover:bg-green-500 flex items-center justify-center transition-colors">
              <FiBarChart className="text-green-500 group-hover:text-white text-xl transition-colors" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">View Analytics</span>
          </button>

          <button 
            onClick={() => router.push('/admin/settings')}
            className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 group-hover:bg-orange-500 flex items-center justify-center transition-colors">
              <FiSettings className="text-orange-500 group-hover:text-white text-xl transition-colors" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">System Settings</span>
          </button>

          <button 
            onClick={() => router.push('/admin/health')}
            className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 group-hover:bg-purple-500 flex items-center justify-center transition-colors">
              <FiShield className="text-purple-500 group-hover:text-white text-xl transition-colors" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Service Health</span>
          </button>
        </div>
      </div>
    </div>
  )
}
