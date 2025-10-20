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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* System Dashboard Header */}
      <div className="relative overflow-hidden mb-6">
        <div className="relative bg-gradient-to-br from-white via-gray-50 to-white shadow-xl mx-6 mt-6 rounded-3xl border-2 border-gray-100">
          <div 
            className="h-2 w-full rounded-t-3xl"
            style={{
              background: 'linear-gradient(90deg, #4CAF50 0%, #4A90E2 35%, #FDA811 70%, #9C27B0 100%)'
            }}
          />
          
          <div className="px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div 
                    className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                    }}
                  >
                    <MdDashboard className="text-white text-4xl" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full animate-pulse border-2 border-white shadow-lg"></div>
                </div>
                
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    System Dashboard
                  </h1>
                  <p className="text-gray-600 font-medium mb-3">
                    Philippine AFPSLAI Marikina Municipal System
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-green-700">All Services Online</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-2">
                      <FiClock className="text-gray-500" size={14} />
                      <span className="text-sm text-gray-700 font-mono">
                        {currentTime.toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-2">
                      <FiUser className="text-gray-500" size={14} />
                      <span className="text-sm text-gray-700">{session?.user?.name || 'Admin'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right mr-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">System Uptime</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-lg"
                        style={{ width: systemStats.systemUptime }}
                      />
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {systemStats.systemUptime}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    className="group p-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-110 bg-gradient-to-br from-blue-500 to-blue-600"
                    onClick={() => window.location.reload()}
                  >
                    <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500 text-white" size={20} />
                  </button>
                  
                  <button 
                    className="group p-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-110 bg-gradient-to-br from-green-500 to-green-600"
                    onClick={() => router.push('/admin/settings')}
                  >
                    <FiSettings className="group-hover:rotate-90 transition-transform duration-300 text-white" size={20} />
                  </button>
                  
                  <button 
                    className="group p-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-110 bg-gradient-to-br from-orange-500 to-orange-600"
                    onClick={() => router.push('/admin/analytics')}
                  >
                    <FiBarChart className="group-hover:scale-110 transition-transform duration-300 text-white" size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {/* System Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <FiUsers className="text-white text-2xl" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">{systemStats.totalUsers.toLocaleString()}</div>
                <div className="text-xs font-medium text-blue-600 flex items-center justify-end mt-1">
                  <FiActivity size={12} className="mr-1" />
                  {systemStats.activeUsers} active
                </div>
              </div>
            </div>
            <h3 className="text-sm font-bold text-gray-700">Total Users</h3>
            <p className="text-xs text-gray-500 mt-1">Registered in system</p>
          </div>

          {/* Active Services */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <FiServer className="text-white text-2xl" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">{systemStats.activeServices}</div>
                <div className="text-xs font-medium text-green-600 flex items-center justify-end mt-1">
                  <FiCheckCircle size={12} className="mr-1" />
                  All online
                </div>
              </div>
            </div>
            <h3 className="text-sm font-bold text-gray-700">Active Services</h3>
            <p className="text-xs text-gray-500 mt-1">Microservices running</p>
          </div>

          {/* Total Transactions */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <FiDatabase className="text-white text-2xl" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-gray-900">{systemStats.totalTransactions.toLocaleString()}</div>
                <div className="text-xs font-medium text-orange-600 flex items-center justify-end mt-1">
                  <FiTrendingUp size={12} className="mr-1" />
                  {systemStats.todayTransactions} today
                </div>
              </div>
            </div>
            <h3 className="text-sm font-bold text-gray-700">Total Transactions</h3>
            <p className="text-xs text-gray-500 mt-1">Across all services</p>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <FiCpu className="text-white text-2xl" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-green-600">{systemStats.systemUptime}</div>
                <div className="text-xs font-medium text-purple-600 flex items-center justify-end mt-1">
                  <FiZap size={12} className="mr-1" />
                  Excellent
                </div>
              </div>
            </div>
            <h3 className="text-sm font-bold text-gray-700">System Uptime</h3>
            <p className="text-xs text-gray-500 mt-1">Last 30 days average</p>
          </div>
        </div>

        {/* Microservices Dashboard */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-900">Microservices Status</h2>
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
                  className="bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100 hover:shadow-2xl transition-all duration-300 group cursor-pointer relative overflow-hidden"
                  onClick={() => router.push(service.route)}
                >
                  {/* Background decoration */}
                  <div 
                    className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-5 transform translate-x-20 -translate-y-20"
                    style={{ backgroundColor: service.color }}
                  />
                  
                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                          style={{ backgroundColor: service.color }}
                        >
                          <IconComponent className="text-white text-3xl" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{service.name}</h3>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-green-700">{service.status.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FiActivity className="text-orange-500" size={16} />
                          <span className="text-xs font-medium text-gray-600">Pending</span>
                        </div>
                        <div className="text-2xl font-black text-gray-900">{service.stats.pending}</div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FiCheckCircle className="text-green-500" size={16} />
                          <span className="text-xs font-medium text-gray-600">Processed</span>
                        </div>
                        <div className="text-2xl font-black text-gray-900">{service.stats.processed}</div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FiTrendingUp className="text-blue-500" size={16} />
                          <span className="text-xs font-medium text-gray-600">Today</span>
                        </div>
                        <div className="text-2xl font-black text-gray-900">{service.stats.today}</div>
                      </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <FiZap className="text-gray-400" size={14} />
                          <span className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">{service.uptime}</span> uptime
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FiDatabase className="text-gray-400" size={14} />
                          <span className="text-sm text-gray-600">
                            <span className="font-semibold text-gray-900">{service.totalRecords.toLocaleString()}</span> records
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm font-medium text-gray-400 group-hover:text-gray-700 transition-colors">
                        <span>View Details</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/admin/users')}
              className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-500 flex items-center justify-center transition-colors">
                <FiUsers className="text-blue-500 group-hover:text-white text-2xl transition-colors" />
              </div>
              <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Manage Users</span>
            </button>

            <button 
              onClick={() => router.push('/admin/analytics')}
              className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-green-400 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 group-hover:bg-green-500 flex items-center justify-center transition-colors">
                <FiBarChart className="text-green-500 group-hover:text-white text-2xl transition-colors" />
              </div>
              <span className="text-sm font-bold text-gray-700 group-hover:text-green-600 transition-colors">View Analytics</span>
            </button>

            <button 
              onClick={() => router.push('/admin/settings')}
              className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 group-hover:bg-orange-500 flex items-center justify-center transition-colors">
                <FiSettings className="text-orange-500 group-hover:text-white text-2xl transition-colors" />
              </div>
              <span className="text-sm font-bold text-gray-700 group-hover:text-orange-600 transition-colors">System Settings</span>
            </button>

            <button 
              onClick={() => router.push('/admin/health')}
              className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 group-hover:bg-purple-500 flex items-center justify-center transition-colors">
                <FiShield className="text-purple-500 group-hover:text-white text-2xl transition-colors" />
              </div>
              <span className="text-sm font-bold text-gray-700 group-hover:text-purple-600 transition-colors">Service Health</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
