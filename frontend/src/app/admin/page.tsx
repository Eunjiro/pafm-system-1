"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardStats from "../../components/DashboardStats"
import RecentActivities from "../../components/RecentActivities"
import QuickActions from "../../components/QuickActions"
import { FiUser, FiActivity, FiTrendingUp, FiShield, FiDatabase, FiCreditCard, FiHardDrive, FiMail, FiRefreshCw, FiClock, FiAlertTriangle, FiCheckCircle } from "react-icons/fi"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#4CAF50'}}></div>
      </div>
    )
  }

  // Show auth required if no session
  if (!session) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FBFBFB'}}>
      {/* Modern Header with Gradient Accent */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div 
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #4A90E2 50%, #FDA811 100%)'
          }}
        />
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{backgroundColor: '#4CAF50'}}
              >
                <div className="text-white">
                  <FiShield size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600 font-medium">System Online</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">Welcome back, {session?.user?.name || 'Admin'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">{new Date().toLocaleString()}</p>
              </div>
              <button 
                className="group p-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-gray-200"
                style={{backgroundColor: '#4A90E2'}}
                onClick={() => window.location.reload()}
              >
                <div className="group-hover:rotate-180 transition-transform duration-300 text-white">
                  <FiRefreshCw size={16} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <DashboardStats />

        {/* Quick Actions */}
        <QuickActions />

      {/* Recent Activities and Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <RecentActivities />

        {/* System Status */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
              style={{backgroundColor: '#4A90E2'}}
            >
              <div className="text-white">
                <FiActivity size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">System Health</h3>
              <p className="text-sm text-gray-500">Real-time monitoring</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-white">
                  <FiDatabase size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-900">Database Connection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-green-600">
                  <FiCheckCircle size={16} />
                </div>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-green-600">
                  <FiCreditCard size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-900">Payment Gateway</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-green-600">
                  <FiCheckCircle size={16} />
                </div>
                <span className="text-sm font-medium text-green-700">Active</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-100 rounded-xl border border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                <div style={{color: '#FDA811'}}>
                  <FiHardDrive size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-900">File Storage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div style={{color: '#FDA811'}}>
                  <FiAlertTriangle size={16} />
                </div>
                <span className="text-sm font-medium" style={{color: '#FDA811'}}>85% Capacity</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <div className="text-green-600">
                  <FiMail size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-900">Email Service</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-green-600">
                  <FiCheckCircle size={16} />
                </div>
                <span className="text-sm font-medium text-green-700">Operational</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{backgroundColor: '#4A90E2'}}
                >
                  <div className="text-white">
                    <FiDatabase size={14} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">System Backup</h4>
                  <p className="text-xs text-gray-600">Last: Oct 14, 2025 at 3:00 AM</p>
                </div>
              </div>
              <button 
                className="group px-4 py-2 text-sm font-medium text-white rounded-lg hover:shadow-md transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                style={{backgroundColor: '#4A90E2'}}
              >
                <div className="group-hover:rotate-180 transition-transform duration-300">
                  <FiRefreshCw size={14} />
                </div>
                <span>Backup Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
              style={{backgroundColor: '#4CAF50'}}
            >
              <div className="text-white">
                <FiTrendingUp size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Weekly Performance</h3>
              <p className="text-sm text-gray-500">Oct 7 - Oct 14, 2025</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  <div className="text-white">
                    <FiUser size={14} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">Registrations</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">47</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{backgroundColor: '#4A90E2'}}
                >
                  <div className="text-white">
                    <FiCheckCircle size={14} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">Permits Issued</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">23</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{backgroundColor: '#FDA811'}}
                >
                  <div className="text-white">
                    <FiActivity size={14} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">Certificates</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">89</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  <div className="text-white">
                    <FiTrendingUp size={14} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">Revenue</span>
              </div>
              <span className="font-bold text-green-700 text-xl">₱28,450</span>
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
              style={{backgroundColor: '#FDA811'}}
            >
              <div className="text-white">
                <FiClock size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Pending Tasks</h3>
              <p className="text-sm text-gray-500">Requires attention</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200 hover:bg-yellow-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{backgroundColor: '#FDA811'}}
                >
                  <div className="text-white">
                    <FiActivity size={14} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">Document Review</span>
              </div>
              <span className="bg-yellow-200 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full">12</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500"
                >
                  <div className="text-white">
                    <FiAlertTriangle size={14} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">Payment Verification</span>
              </div>
              <span className="bg-red-200 text-red-900 text-sm font-bold px-3 py-1 rounded-full">3</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{backgroundColor: '#4A90E2'}}
                >
                  <div className="text-white">
                    <FiDatabase size={14} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">Plot Assignments</span>
              </div>
              <span className="bg-blue-200 text-blue-900 text-sm font-bold px-3 py-1 rounded-full">8</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  <div className="text-white">
                    <FiUser size={14} />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">User Approvals</span>
              </div>
              <span className="bg-green-200 text-green-900 text-sm font-bold px-3 py-1 rounded-full">2</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
              style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #4A90E2 100%)'
              }}
            >
              <div className="text-white">
                <FiTrendingUp size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">System Performance</h3>
              <p className="text-sm text-gray-500">Live metrics</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{backgroundColor: '#4CAF50'}}
                  >
                    <div className="text-white">
                      <FiTrendingUp size={12} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Processing Speed</span>
                </div>
                <span className="text-lg font-bold text-green-600">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: '92%',
                    background: 'linear-gradient(90deg, #4CAF50 0%, #81C784 100%)'
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{backgroundColor: '#4A90E2'}}
                  >
                    <div className="text-white">
                      <FiUser size={12} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">User Satisfaction</span>
                </div>
                <span className="text-lg font-bold" style={{color: '#4A90E2'}}>87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: '87%',
                    background: 'linear-gradient(90deg, #4A90E2 0%, #64B5F6 100%)'
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{backgroundColor: '#4CAF50'}}
                  >
                    <div className="text-white">
                      <FiCheckCircle size={12} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">System Uptime</span>
                </div>
                <span className="text-lg font-bold text-green-600">99.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: '99.8%',
                    background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}