"use client"

import React from "react"
import { FiSettings, FiDatabase, FiShield, FiUsers, FiGlobe, FiClock } from "react-icons/fi"

export default function AdminSettingsPage() {
  return (
    <div className="min-h-screen" style={{backgroundColor: '#FBFBFB'}}>
      {/* Modern Header with Gradient Accent */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div 
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(135deg, #607D8B 0%, #4A90E2 100%)'
          }}
        />
        <div className="px-6 py-8">
          <div className="flex items-center space-x-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{backgroundColor: '#607D8B'}}
            >
              <div className="text-white">
                <FiSettings size={24} />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">Administrative Configuration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{backgroundColor: '#607D8B'}}
            >
              <div className="text-white">
                <FiSettings size={32} />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              System Configuration Center
            </h2>
            
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Comprehensive system settings and administrative controls for managing 
              database configurations, user permissions, security settings, and 
              system-wide operational parameters.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    <FiDatabase size={20} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Database Config</h3>
                <p className="text-sm text-gray-600">Connection settings and backup configurations</p>
              </div>

              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    <FiShield size={20} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Security Settings</h3>
                <p className="text-sm text-gray-600">Authentication and access control management</p>
              </div>

              <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    <FiUsers size={20} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">User Management</h3>
                <p className="text-sm text-gray-600">Role permissions and account settings</p>
              </div>

              <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    <FiGlobe size={20} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">System Parameters</h3>
                <p className="text-sm text-gray-600">Global settings and operational controls</p>
              </div>

              <div className="p-6 bg-orange-50 rounded-xl border border-orange-200">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    <FiDatabase size={20} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Backup & Recovery</h3>
                <p className="text-sm text-gray-600">Data backup schedules and recovery options</p>
              </div>

              <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    <FiSettings size={20} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Advanced Config</h3>
                <p className="text-sm text-gray-600">System-level configuration and maintenance</p>
              </div>
            </div>

            <div className="mt-8">
              <span className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                <FiClock size={16} />
                <span>Configuration Panel Under Development</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}