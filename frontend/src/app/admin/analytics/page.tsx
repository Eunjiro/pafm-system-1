"use client"

import React from "react"
import { FiTrendingUp, FiBarChart, FiPieChart, FiActivity } from "react-icons/fi"

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen" style={{backgroundColor: '#FBFBFB'}}>
      {/* Modern Header with Gradient Accent */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div 
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(135deg, #FF5722 0%, #4A90E2 100%)'
          }}
        />
        <div className="px-6 py-8">
          <div className="flex items-center space-x-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{backgroundColor: '#FF5722'}}
            >
              <div className="text-white">
                <FiTrendingUp size={24} />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">Performance Insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{backgroundColor: '#FF5722'}}
            >
              <div className="text-white">
                <FiBarChart size={32} />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Analytics & Reporting Dashboard
            </h2>
            
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Comprehensive system analytics providing insights into registration trends, 
              revenue analysis, operational efficiency, and detailed reporting capabilities 
              for administrative decision-making.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="p-6 bg-orange-50 rounded-xl border border-orange-200">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    <FiTrendingUp size={20} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Performance Metrics</h3>
                <p className="text-sm text-gray-600">Real-time system performance and operational efficiency</p>
              </div>

              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    <FiBarChart size={20} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Financial Reports</h3>
                <p className="text-sm text-gray-600">Revenue analysis and financial trend reporting</p>
              </div>

              <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    <FiPieChart size={20} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Usage Analytics</h3>
                <p className="text-sm text-gray-600">User behavior and system utilization patterns</p>
              </div>
            </div>

            <div className="mt-8">
              <span className="inline-flex items-center space-x-2 text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                <FiActivity size={16} />
                <span>Advanced Analytics Coming Soon</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}