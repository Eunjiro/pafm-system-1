"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import CitizenHeader from "@/components/CitizenHeader"

export default function CitizenPortal() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!['CITIZEN', 'EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBFBFB' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-4" style={{ borderColor: '#4CAF50' }}></div>
          <div className="text-gray-600 text-lg font-medium">Loading Portal...</div>
        </div>
      </div>
    )
  }

  if (!session || !['CITIZEN', 'EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBFBFB' }}>
      {/* Header */}
      <CitizenHeader title="Dashboard" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="rounded-3xl shadow-xl p-8 mb-8 text-white relative overflow-hidden" 
               style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #4A90E2 100%)' }}>
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Welcome back, {session.user?.name}!</h2>
                <p className="text-white/90 text-lg">Manage your applications and access government services online.</p>
              </div>
              <div className="hidden md:block">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Services Card */}
            <Link href="/citizen/services" className="group">
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" 
                       style={{ backgroundColor: '#4A90E215' }}>
                    <svg className="w-8 h-8" style={{ color: '#4A90E2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Services</h3>
                    <p className="text-gray-600">Access all available services</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: '#4CAF50' }}></div>
                    Death Registration (Regular & Delayed)
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: '#4CAF50' }}></div>
                    Permit Requests (Burial, Cremation, Exhumation)
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: '#4CAF50' }}></div>
                    Certificate Requests
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: '#4CAF50' }}></div>
                    Cemetery Services
                  </div>
                </div>
                <div className="mt-6 flex items-center font-medium" style={{ color: '#4A90E2' }}>
                  View All Services
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Applications Card */}
            <Link href="/citizen/applications" className="group">
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" 
                       style={{ backgroundColor: '#4CAF5015' }}>
                    <svg className="w-8 h-8" style={{ color: '#4CAF50' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">My Applications</h3>
                    <p className="text-gray-600">Track your application status</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#FDD83515' }}>
                    <div className="text-2xl font-bold" style={{ color: '#FDA811' }}>2</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#4A90E215' }}>
                    <div className="text-2xl font-bold" style={{ color: '#4A90E2' }}>1</div>
                    <div className="text-sm text-gray-600">Processing</div>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#4CAF5015' }}>
                    <div className="text-2xl font-bold" style={{ color: '#4CAF50' }}>2</div>
                    <div className="text-sm text-gray-600">Ready</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-50">
                    <div className="text-2xl font-bold text-gray-700">5</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>
                <div className="flex items-center font-medium" style={{ color: '#4CAF50' }}>
                  View All Applications
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
              <Link href="/citizen/applications" className="text-sm font-medium hover:underline" style={{ color: '#4A90E2' }}>
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4CAF5020' }}>
                  <svg className="w-5 h-5" style={{ color: '#4CAF50' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900">Burial Permit Request approved</p>
                  <p className="text-xs text-gray-500">Ready for pickup • Oct 8, 2024</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" 
                      style={{ backgroundColor: '#4CAF5020', color: '#4CAF50' }}>
                  Ready
                </span>
              </div>
              
              <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FDA81120' }}>
                  <svg className="w-5 h-5" style={{ color: '#FDA811' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900">Death Registration submitted</p>
                  <p className="text-xs text-gray-500">Under review • Oct 3, 2024</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" 
                      style={{ backgroundColor: '#FDA81120', color: '#FDA811' }}>
                  Pending
                </span>
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Help & Support</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center group cursor-pointer">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-100 transition-colors">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">FAQ</h4>
                <p className="text-sm text-gray-500 mb-4">Find answers to common questions</p>
                <button className="text-sm font-medium hover:underline" style={{ color: '#4A90E2' }}>
                  View FAQ
                </button>
              </div>

              <div className="text-center group cursor-pointer">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-100 transition-colors">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Contact Support</h4>
                <p className="text-sm text-gray-500 mb-4">Get help from our support team</p>
                <button className="text-sm font-medium hover:underline" style={{ color: '#4A90E2' }}>
                  Contact Us
                </button>
              </div>

              <div className="text-center group cursor-pointer">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-100 transition-colors">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">User Guide</h4>
                <p className="text-sm text-gray-500 mb-4">Learn how to use the system</p>
                <button className="text-sm font-medium hover:underline" style={{ color: '#4A90E2' }}>
                  Read Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}