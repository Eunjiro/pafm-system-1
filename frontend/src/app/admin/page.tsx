"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import useDashboardData from "../../hooks/useDashboardData"
import { 
  FiUser, FiActivity, FiTrendingUp, FiShield, FiDatabase, FiCreditCard, 
  FiHardDrive, FiMail, FiRefreshCw, FiClock, FiAlertTriangle, FiCheckCircle,
  FiFileText, FiAward, FiUserCheck, FiDollarSign, FiBarChart, FiCalendar,
  FiMapPin, FiMonitor, FiSettings, FiZap, FiGlobe, FiUsers, FiEye, FiDownload,
  FiPackage, FiHome, FiDroplet, FiServer
} from "react-icons/fi"
import { 
  MdDashboard, MdAssignment, MdLocalHospital, MdLocationOn, MdTrendingUp,
  MdPeople, MdAttachMoney, MdNotifications, MdSecurity
} from "react-icons/md"
import { GiTombstone } from "react-icons/gi"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const { stats, activities, loading, error, refetch } = useDashboardData()

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFBFB'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4" style={{borderColor: '#4CAF50'}}></div>
          <div className="text-gray-600 text-lg font-medium">Loading PAFM Admin Portal...</div>
        </div>
      </div>
    )
  }

  // Show auth required if no session
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFBFB'}}>
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="text-center">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{backgroundColor: '#4CAF50'}}
            >
              <FiShield className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-6">Administrator authentication required to access this portal.</p>
            <button 
              onClick={() => router.push('/auth/signin')}
              className="w-full py-3 px-4 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
              style={{backgroundColor: '#4CAF50'}}
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F8FAFC'}}>
      {/* Executive Header */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 25%, #4A90E2 50%, #357ABD 75%, #FDA811 100%)'
          }}
        />
        <div className="relative bg-white shadow-xl mx-6 rounded-3xl border border-gray-100">
          <div 
            className="h-2 w-full rounded-t-3xl"
            style={{
              background: 'linear-gradient(90deg, #4CAF50 0%, #4A90E2 50%, #FDA811 100%)'
            }}
          />
          
          <div className="px-8 py-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div 
                    className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                    }}
                  >
                    <MdDashboard className="text-white text-3xl" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
                </div>
                
                <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-2">
                    PAFM Executive Portal
                  </h1>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-green-700">All Systems Operational</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-600 font-medium">Administrator: {session?.user?.name || 'System Admin'}</span>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center space-x-2">
                      <FiClock className="text-gray-400" size={14} />
                      <span className="text-sm text-gray-600 font-mono">
                        {currentTime.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="flex items-center space-x-2">
                      <FiUsers className="text-blue-500" size={16} />
                      <span className="text-sm font-medium text-gray-700">{stats.users.activeUsers} Active Users</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiActivity className="text-orange-500" size={16} />
                      <span className="text-sm font-medium text-gray-700">{stats.deathRegistrations.pending + stats.permits.pending + stats.certificates.pending} Pending</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiCheckCircle className="text-green-500" size={16} />
                      <span className="text-sm font-medium text-gray-700">{stats.deathRegistrations.todayCompletions} Completed Today</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right mr-4">
                  <p className="text-sm text-gray-500 font-medium">System Health</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: stats.systemHealth.overallStatus === 'healthy' ? '100%' : 
                                stats.systemHealth.overallStatus === 'degraded' ? '65%' : '25%',
                          backgroundColor: stats.systemHealth.overallStatus === 'healthy' ? '#10b981' : 
                                         stats.systemHealth.overallStatus === 'degraded' ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {stats.systemHealth.overallStatus === 'healthy' ? '100%' : 
                       stats.systemHealth.overallStatus === 'degraded' ? '65%' : '25%'}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    className="group p-4 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-110 border border-gray-200"
                    style={{backgroundColor: '#4A90E2'}}
                    onClick={() => window.location.reload()}
                  >
                    <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500 text-white" size={20} />
                  </button>
                  
                  <button 
                    className="group p-4 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-110 border border-gray-200"
                    style={{backgroundColor: '#4CAF50'}}
                    onClick={() => router.push('/admin/settings')}
                  >
                    <FiSettings className="group-hover:rotate-90 transition-transform duration-300 text-white" size={20} />
                  </button>
                  
                  <button 
                    className="group p-4 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-110 border border-gray-200"
                    style={{backgroundColor: '#FDA811'}}
                    onClick={() => router.push('/admin/reports')}
                  >
                    <FiBarChart className="group-hover:scale-110 transition-transform duration-300 text-white" size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <FiAlertTriangle className="text-red-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Data Loading Error</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button 
                  onClick={refetch}
                  className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Executive KPI Dashboard */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-pulse">
                <div className="h-16 bg-gray-200 rounded-2xl mb-6"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Death Registrations KPI */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden cursor-pointer"
                 onClick={() => router.push('/admin/death-registration')}>
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 transform translate-x-16 -translate-y-16"
                style={{backgroundColor: '#4CAF50'}}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{backgroundColor: '#4CAF50'}}
                  >
                    <MdLocalHospital className="text-white text-2xl" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{stats.deathRegistrations.total}</div>
                    <div className="text-sm font-medium text-green-600 flex items-center">
                      <FiTrendingUp size={12} className="mr-1" />
                      Today: {stats.deathRegistrations.todaySubmissions}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Death Registrations</h3>
                  <p className="text-sm text-gray-600">Total registrations in system</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Pending</span>
                      <span className="text-xs font-semibold text-orange-600">{stats.deathRegistrations.pending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Processing</span>
                      <span className="text-xs font-semibold text-blue-600">{stats.deathRegistrations.processing}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Completed</span>
                      <span className="text-xs font-semibold text-green-600">{stats.deathRegistrations.completed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Permits KPI */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden cursor-pointer"
                 onClick={() => router.push('/admin/permits')}>
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 transform translate-x-16 -translate-y-16"
                style={{backgroundColor: '#4A90E2'}}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{backgroundColor: '#4A90E2'}}
                  >
                    <MdAssignment className="text-white text-2xl" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{stats.permits.total}</div>
                    <div className="text-sm font-medium text-blue-600 flex items-center">
                      <FiDollarSign size={12} className="mr-1" />
                      ₱{stats.permits.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Permits Issued</h3>
                  <p className="text-sm text-gray-600">All permit types combined</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Burial</span>
                      <span className="text-xs font-semibold text-gray-900">{stats.permits.burial}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Cremation</span>
                      <span className="text-xs font-semibold text-gray-900">{stats.permits.cremation}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Exhumation</span>
                      <span className="text-xs font-semibold text-gray-900">{stats.permits.exhumation}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificates KPI */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden cursor-pointer"
                 onClick={() => router.push('/admin/certificates')}>
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 transform translate-x-16 -translate-y-16"
                style={{backgroundColor: '#FDA811'}}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{backgroundColor: '#FDA811'}}
                  >
                    <FiAward className="text-white text-2xl" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{stats.certificates.total}</div>
                    <div className="text-sm font-medium text-orange-600 flex items-center">
                      <FiCalendar size={12} className="mr-1" />
                      Today: {stats.certificates.todayRequests}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Certificates</h3>
                  <p className="text-sm text-gray-600">Requests & issued certificates</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Pending</span>
                      <span className="text-xs font-semibold text-orange-600">{stats.certificates.pending}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Issued</span>
                      <span className="text-xs font-semibold text-green-600">{stats.certificates.issued}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Revenue</span>
                      <span className="text-xs font-semibold text-gray-900">₱{stats.certificates.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cemetery Management KPI */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden cursor-pointer"
                 onClick={() => router.push('/admin/cemetery')}>
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 transform translate-x-16 -translate-y-16"
                style={{backgroundColor: '#10b981'}}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{backgroundColor: '#10b981'}}
                  >
                    <GiTombstone className="text-white text-2xl" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{stats.cemetery.totalPlots}</div>
                    <div className="text-sm font-medium text-green-600 flex items-center">
                      <FiMapPin size={12} className="mr-1" />
                      Total Plots
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Cemetery Plots</h3>
                  <p className="text-sm text-gray-600">Occupancy & availability status</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Occupied</span>
                        <span>{stats.cemetery.occupiedPlots} ({((stats.cemetery.occupiedPlots / stats.cemetery.totalPlots) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${(stats.cemetery.occupiedPlots / stats.cemetery.totalPlots) * 100}%`, 
                            backgroundColor: '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Available</span>
                        <span>{stats.cemetery.availablePlots} ({((stats.cemetery.availablePlots / stats.cemetery.totalPlots) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${(stats.cemetery.availablePlots / stats.cemetery.totalPlots) * 100}%`, 
                            backgroundColor: '#10b981'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Microservice Health Dashboard */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{backgroundColor: '#4CAF50'}}
              >
                <FiServer className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Microservice Health Monitor</h2>
                <p className="text-sm text-gray-600">Real-time status of all system services</p>
              </div>
            </div>
            <button 
              onClick={refetch}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <FiRefreshCw className="text-gray-600" size={16} />
              <span className="text-sm font-medium text-gray-600">Refresh</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cemetery & Burial Service */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <GiTombstone className="text-gray-700" size={20} />
                  <span className="text-sm font-semibold text-gray-700">Cemetery & Burial</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  stats.systemHealth.cemeteryService === 'healthy' ? 'bg-green-500' :
                  stats.systemHealth.cemeteryService === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                } animate-pulse`}></div>
              </div>
              <div className="text-xs text-gray-500 mb-2">Status: 
                <span className={`ml-1 font-medium ${
                  stats.systemHealth.cemeteryService === 'healthy' ? 'text-green-600' :
                  stats.systemHealth.cemeteryService === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.systemHealth.cemeteryService.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-500">Port: 3001</div>
            </div>

            {/* Water & Drainage Service */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FiDroplet className="text-gray-700" size={20} />
                  <span className="text-sm font-semibold text-gray-700">Water & Drainage</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  stats.systemHealth.waterService === 'healthy' ? 'bg-green-500' :
                  stats.systemHealth.waterService === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
              <div className="text-xs text-gray-500 mb-2">Status: 
                <span className={`ml-1 font-medium ${
                  stats.systemHealth.waterService === 'healthy' ? 'text-green-600' :
                  stats.systemHealth.waterService === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.systemHealth.waterService.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-500">Port: 3002</div>
            </div>

            {/* Assets & Inventory Service */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FiPackage className="text-gray-700" size={20} />
                  <span className="text-sm font-semibold text-gray-700">Assets & Inventory</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  stats.systemHealth.assetsService === 'healthy' ? 'bg-green-500' :
                  stats.systemHealth.assetsService === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
              <div className="text-xs text-gray-500 mb-2">Status: 
                <span className={`ml-1 font-medium ${
                  stats.systemHealth.assetsService === 'healthy' ? 'text-green-600' :
                  stats.systemHealth.assetsService === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.systemHealth.assetsService.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-500">Port: 3003</div>
            </div>

            {/* Facility Management Service */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FiHome className="text-gray-700" size={20} />
                  <span className="text-sm font-semibold text-gray-700">Facility Management</span>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  stats.systemHealth.facilityService === 'healthy' ? 'bg-green-500' :
                  stats.systemHealth.facilityService === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
              <div className="text-xs text-gray-500 mb-2">Status: 
                <span className={`ml-1 font-medium ${
                  stats.systemHealth.facilityService === 'healthy' ? 'text-green-600' :
                  stats.systemHealth.facilityService === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.systemHealth.facilityService.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-500">Port: 3004</div>
            </div>
          </div>
        </div>

        {/* Recent Activities & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{backgroundColor: '#4A90E2'}}
                >
                  <FiActivity className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Recent Activities</h3>
                  <p className="text-sm text-gray-600">Latest system activities</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/admin/system/audit-logs')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <FiEye size={14} />
              </button>
            </div>
            
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.status === 'success' ? 'bg-green-100' :
                      activity.status === 'warning' ? 'bg-yellow-100' :
                      activity.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {activity.type === 'death_registration' ? <MdLocalHospital className={`${
                        activity.status === 'success' ? 'text-green-600' :
                        activity.status === 'warning' ? 'text-yellow-600' :
                        activity.status === 'error' ? 'text-red-600' : 'text-blue-600'
                      }`} size={16} /> :
                      activity.type === 'permit' ? <MdAssignment className={`${
                        activity.status === 'success' ? 'text-green-600' :
                        activity.status === 'warning' ? 'text-yellow-600' :
                        activity.status === 'error' ? 'text-red-600' : 'text-blue-600'
                      }`} size={16} /> :
                      activity.type === 'certificate' ? <FiAward className={`${
                        activity.status === 'success' ? 'text-green-600' :
                        activity.status === 'warning' ? 'text-yellow-600' :
                        activity.status === 'error' ? 'text-red-600' : 'text-blue-600'
                      }`} size={16} /> :
                      activity.type === 'user' ? <FiUsers className={`${
                        activity.status === 'success' ? 'text-green-600' :
                        activity.status === 'warning' ? 'text-yellow-600' :
                        activity.status === 'error' ? 'text-red-600' : 'text-blue-600'
                      }`} size={16} /> :
                      <FiSettings className={`${
                        activity.status === 'success' ? 'text-green-600' :
                        activity.status === 'warning' ? 'text-yellow-600' :
                        activity.status === 'error' ? 'text-red-600' : 'text-blue-600'
                      }`} size={16} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{activity.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-400">{activity.user}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FiActivity className="mx-auto text-gray-400 mb-3" size={32} />
                  <p className="text-gray-500">No recent activities</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Statistics */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                style={{backgroundColor: '#FDA811'}}
              >
                <FiBarChart className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Quick Statistics</h3>
                <p className="text-sm text-gray-600">Key metrics at a glance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                <div className="flex items-center space-x-2 mb-2">
                  <FiUsers className="text-green-600" size={16} />
                  <span className="text-sm font-medium text-green-700">Users</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{stats.users.totalUsers}</div>
                <div className="text-xs text-green-600">+{stats.users.newToday} new today</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="flex items-center space-x-2 mb-2">
                  <FiActivity className="text-blue-600" size={16} />
                  <span className="text-sm font-medium text-blue-700">Active Now</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">{stats.users.activeUsers}</div>
                <div className="text-xs text-blue-600">{((stats.users.activeUsers / stats.users.totalUsers) * 100).toFixed(1)}% online</div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100">
                <div className="flex items-center space-x-2 mb-2">
                  <FiDollarSign className="text-purple-600" size={16} />
                  <span className="text-sm font-medium text-purple-700">Revenue</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  ₱{(stats.permits.revenue + stats.certificates.revenue).toLocaleString()}
                </div>
                <div className="text-xs text-purple-600">Total collected</div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                <div className="flex items-center space-x-2 mb-2">
                  <FiClock className="text-orange-600" size={16} />
                  <span className="text-sm font-medium text-orange-700">Maintenance</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">{stats.cemetery.maintenanceRequired}</div>
                <div className="text-xs text-orange-600">Plots need attention</div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Overall System Health</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.values(stats.systemHealth).slice(0, 4).filter(status => status === 'healthy').length}/4 services healthy
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  stats.systemHealth.overallStatus === 'healthy' ? 'bg-green-100 text-green-700' :
                  stats.systemHealth.overallStatus === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {stats.systemHealth.overallStatus.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Actions Panel */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{backgroundColor: '#4CAF50'}}
              >
                <FiZap className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Executive Actions</h2>
                <p className="text-sm text-gray-600">Quick access to critical administrative functions</p>
              </div>
            </div>
            <button 
              className="px-6 py-3 text-white font-semibold rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex items-center space-x-2"
              style={{backgroundColor: '#4CAF50'}}
              onClick={() => router.push('/admin/reports')}
            >
              <FiEye size={16} />
              <span>View All Reports</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/admin/death-registration')}
              className="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{backgroundColor: '#4A90E2'}}
                >
                  <MdLocalHospital className="text-white text-xl" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-sm">Death Registry</div>
                  <div className="text-xs text-gray-600">Manage registrations</div>
                </div>
              </div>
            </button>

            <button 
              onClick={() => router.push('/admin/permits')}
              className="group p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  <MdAssignment className="text-white text-xl" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-sm">Permit Center</div>
                  <div className="text-xs text-gray-600">Issue permits</div>
                </div>
              </div>
            </button>

            <button 
              onClick={() => router.push('/admin/cemetery')}
              className="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{backgroundColor: '#FDA811'}}
                >
                  <GiTombstone className="text-white text-xl" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-sm">Cemetery Hub</div>
                  <div className="text-xs text-gray-600">Manage plots</div>
                </div>
              </div>
            </button>

            <button 
              onClick={() => router.push('/admin/users')}
              className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <div className="flex flex-col items-center space-y-3">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300"
                  style={{backgroundColor: '#8b5cf6'}}
                >
                  <FiUsers className="text-white text-xl" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-sm">User Admin</div>
                  <div className="text-xs text-gray-600">Manage accounts</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Analytics and Monitoring Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Activity Monitor */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                  style={{backgroundColor: '#4A90E2'}}
                >
                  <FiActivity className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Live Activity Monitor</h3>
                  <p className="text-sm text-gray-500">Real-time system events</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-600">LIVE</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { icon: FiUserCheck, action: "Death registration approved", user: "Maria Santos", time: "2 min ago", type: "success" },
                { icon: FiFileText, action: "Burial permit issued", user: "Juan Dela Cruz", time: "5 min ago", type: "info" },
                { icon: FiMapPin, action: "Plot assigned in Section A", user: "Admin User", time: "8 min ago", type: "warning" },
                { icon: FiDollarSign, action: "Payment processed - ₱150", user: "System", time: "12 min ago", type: "success" },
                { icon: FiUsers, action: "New user registration", user: "Ana Garcia", time: "15 min ago", type: "info" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                  <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                      activity.type === 'success' ? 'bg-green-100' : 
                      activity.type === 'warning' ? 'bg-orange-100' : 'bg-blue-100'
                    }`}
                  >
                    <activity.icon 
                      className={`${
                        activity.type === 'success' ? 'text-green-600' : 
                        activity.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
                      }`} 
                      size={16} 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">{activity.action}</div>
                    <div className="text-xs text-gray-600">by {activity.user}</div>
                  </div>
                  <div className="text-xs text-gray-500 font-medium">{activity.time}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button 
                className="w-full py-3 px-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                onClick={() => router.push('/admin/system/audit-logs')}
              >
                <FiEye size={14} />
                <span>View Full Activity Log</span>
              </button>
            </div>
          </div>

          {/* System Health Dashboard */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                  style={{backgroundColor: '#10b981'}}
                >
                  <FiMonitor className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">System Health Dashboard</h3>
                  <p className="text-sm text-gray-500">Infrastructure monitoring</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-600">ALL SYSTEMS GO</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FiDatabase className="text-green-600" size={16} />
                    <span className="text-sm font-semibold text-gray-900">Database</span>
                  </div>
                  <FiCheckCircle className="text-green-600" size={16} />
                </div>
                <div className="text-xs text-green-700 font-medium">Response: 12ms</div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FiCreditCard className="text-green-600" size={16} />
                    <span className="text-sm font-semibold text-gray-900">Payment Gateway</span>
                  </div>
                  <FiCheckCircle className="text-green-600" size={16} />
                </div>
                <div className="text-xs text-green-700 font-medium">99.9% Uptime</div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FiHardDrive className="text-orange-600" size={16} />
                    <span className="text-sm font-semibold text-gray-900">Storage</span>
                  </div>
                  <FiAlertTriangle className="text-orange-600" size={16} />
                </div>
                <div className="text-xs text-orange-700 font-medium">85% Used (Warning)</div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FiGlobe className="text-green-600" size={16} />
                    <span className="text-sm font-semibold text-gray-900">Web Server</span>
                  </div>
                  <FiCheckCircle className="text-green-600" size={16} />
                </div>
                <div className="text-xs text-green-700 font-medium">Load: 34%</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">CPU Usage</span>
                  <span className="text-sm font-bold text-gray-900">34%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{width: '34%', background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'}}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Memory Usage</span>
                  <span className="text-sm font-bold text-gray-900">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{width: '67%', background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'}}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{backgroundColor: '#4A90E2'}}
                  >
                    <FiDatabase className="text-white" size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Last Backup</div>
                    <div className="text-xs text-gray-600">October 17, 2025 - 3:00 AM</div>
                  </div>
                </div>
                <button 
                  className="group px-4 py-2 text-sm font-medium text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                  style={{backgroundColor: '#4A90E2'}}
                >
                  <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-300" size={14} />
                  <span>Backup Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary & Weekly Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Performance Overview */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  <FiCalendar className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Weekly Performance</h3>
                  <p className="text-sm text-gray-500">Oct 11-17, 2025</p>
                </div>
              </div>
              <div className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                +18.3%
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { label: "Death Registrations", value: 247, icon: MdLocalHospital, color: '#4CAF50' },
                { label: "Permits Issued", value: 189, icon: MdAssignment, color: '#4A90E2' },
                { label: "Certificates", value: 156, icon: FiAward, color: '#FDA811' },
                { label: "Plot Assignments", value: 78, icon: GiTombstone, color: '#8b5cf6' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{backgroundColor: item.color}}
                    >
                      <item.icon className="text-white" size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-900 text-lg">{item.value}</span>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                      style={{backgroundColor: '#4CAF50'}}
                    >
                      <FiDollarSign className="text-white" size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Weekly Revenue</div>
                      <div className="text-xs text-gray-600">vs. last week</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-700 text-xl">₱184K</div>
                    <div className="text-xs font-medium text-green-600">+12.4%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Tasks & Alerts */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                  style={{backgroundColor: '#ef4444'}}
                >
                  <FiAlertTriangle className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Critical Tasks</h3>
                  <p className="text-sm text-gray-500">Requires immediate attention</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-red-600">URGENT</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { 
                  title: "Document Verification", 
                  count: 23, 
                  urgency: "high", 
                  icon: FiFileText,
                  description: "Delayed registrations pending review"
                },
                { 
                  title: "Payment Confirmations", 
                  count: 12, 
                  urgency: "medium", 
                  icon: FiDollarSign,
                  description: "OR numbers awaiting verification"
                },
                { 
                  title: "Plot Assignments", 
                  count: 8, 
                  urgency: "medium", 
                  icon: FiMapPin,
                  description: "Cemetery plots need assignment"
                },
                { 
                  title: "User Account Issues", 
                  count: 4, 
                  urgency: "low", 
                  icon: FiUsers,
                  description: "Account access problems"
                }
              ].map((task, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-2xl border transition-all duration-200 hover:scale-105 cursor-pointer ${
                    task.urgency === 'high' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                    task.urgency === 'medium' ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' :
                    'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => router.push('/admin/tasks')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                          task.urgency === 'high' ? 'bg-red-500' :
                          task.urgency === 'medium' ? 'bg-orange-500' : 'bg-gray-500'
                        }`}
                      >
                        <task.icon className="text-white" size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{task.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{task.description}</div>
                      </div>
                    </div>
                    <div 
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        task.urgency === 'high' ? 'bg-red-200 text-red-900' :
                        task.urgency === 'medium' ? 'bg-orange-200 text-orange-900' :
                        'bg-gray-200 text-gray-900'
                      }`}
                    >
                      {task.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <button 
                className="w-full py-3 px-4 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-2xl transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center justify-center space-x-2"
                onClick={() => router.push('/admin/tasks')}
              >
                <FiAlertTriangle size={14} />
                <span>View All Critical Tasks</span>
              </button>
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #4A90E2 100%)'
                  }}
                >
                  <MdTrendingUp className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Performance Analytics</h3>
                  <p className="text-sm text-gray-500">Key performance indicators</p>
                </div>
              </div>
              <button 
                className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors duration-200"
                onClick={() => router.push('/admin/analytics')}
              >
                View Details
              </button>
            </div>
            
            <div className="space-y-6">
              {[
                { 
                  label: "Processing Efficiency", 
                  value: 94.2, 
                  target: 95, 
                  color: '#4CAF50', 
                  icon: FiZap,
                  trend: '+2.1%'
                },
                { 
                  label: "Customer Satisfaction", 
                  value: 88.7, 
                  target: 90, 
                  color: '#4A90E2', 
                  icon: FiUser,
                  trend: '+1.8%'
                },
                { 
                  label: "System Reliability", 
                  value: 99.8, 
                  target: 99.5, 
                  color: '#10b981', 
                  icon: FiShield,
                  trend: '+0.2%'
                }
              ].map((metric, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                        style={{backgroundColor: metric.color}}
                      >
                        <metric.icon className="text-white" size={14} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-gray-900">{metric.value}%</span>
                      <span className="text-xs font-medium text-green-600">{metric.trend}</span>
                    </div>
                  </div>
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out relative"
                        style={{
                          width: `${metric.value}%`,
                          backgroundColor: metric.color
                        }}
                      >
                        <div 
                          className="absolute right-0 top-0 h-full w-1 bg-gray-400 opacity-50"
                          style={{right: `${100 - metric.target}%`}}
                          title={`Target: ${metric.target}%`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Target: {metric.target}%</span>
                      <span className={metric.value >= metric.target ? 'text-green-600' : 'text-orange-600'}>
                        {metric.value >= metric.target ? 'Above Target' : 'Below Target'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                    style={{background: 'linear-gradient(135deg, #4CAF50 0%, #4A90E2 100%)'}}
                  >
                    <FiBarChart className="text-white" size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Overall Score</div>
                    <div className="text-xs text-gray-600">Weighted average</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-gray-900">92.4</div>
                  <div className="text-xs font-medium text-green-600">Excellent</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  <FiGlobe className="text-white" size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">PAFM System Status</div>
                  <div className="text-xs text-green-600 font-medium">All services operational</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{stats.users.activeUsers}</div>
                  <div className="text-xs text-gray-500">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{stats.deathRegistrations.todayCompletions}</div>
                  <div className="text-xs text-gray-500">Completed Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">₱{(stats.permits.revenue + stats.certificates.revenue).toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Total Revenue</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 flex items-center space-x-2"
                onClick={() => router.push('/admin/reports')}
              >
                <FiDownload size={14} />
                <span>Export Data</span>
              </button>
              
              <button 
                className="px-4 py-2 text-sm font-medium text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center space-x-2"
                style={{backgroundColor: '#4CAF50'}}
                onClick={() => router.push('/admin/settings')}
              >
                <FiSettings size={14} />
                <span>System Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}