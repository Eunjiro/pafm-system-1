"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardStats from "../../components/DashboardStats"
import RecentActivities from "../../components/RecentActivities"
import QuickActions from "../../components/QuickActions"

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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Database Connection</span>
              </div>
              <span className="text-sm text-green-600">Online</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Payment Gateway</span>
              </div>
              <span className="text-sm text-green-600">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">File Storage</span>
              </div>
              <span className="text-sm text-yellow-600">85% Capacity</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Email Service</span>
              </div>
              <span className="text-sm text-green-600">Operational</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Last Backup</h4>
            <p className="text-sm text-gray-600">October 5, 2025 at 3:00 AM</p>
            <button 
              className="mt-2 text-xs text-white px-3 py-1 rounded hover:opacity-80"
              style={{backgroundColor: '#4A90E2'}}
            >
              Backup Now
            </button>
          </div>
        </div>
      </div>

      {/* Additional Dashboard Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Registrations</span>
              <span className="font-medium">47</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Permits Issued</span>
              <span className="font-medium">23</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Certificates</span>
              <span className="font-medium">89</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="font-medium">₱28,450</span>
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Tasks</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Document Review</span>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Verification</span>
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Plot Assignments</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">User Approvals</span>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">2</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Processing Speed</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">User Satisfaction</span>
                <span className="text-sm font-medium">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '87%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">System Uptime</span>
                <span className="text-sm font-medium">99.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '99.8%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}