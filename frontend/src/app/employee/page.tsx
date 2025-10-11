"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useDashboardStats } from "@/hooks/useDashboardStats"

export default function EmployeeDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { stats, loading: statsLoading } = useDashboardStats()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!['EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FBFBFB' }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#4CAF50' }}></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || !['EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
    return null
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBFBFB' }}>
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl p-8 mb-8 shadow-xl" 
             style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #4A90E2 100%)' }}>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {session.user?.name?.charAt(0) || 'E'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">
                      Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {session.user?.name?.split(' ')[0]}!
                    </h1>
                    <p className="text-white/90 text-lg mt-1">
                      Ready to make a difference in public service today
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-white/80">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{formatTime(currentTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(currentTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">System Online</span>
                  </div>
                </div>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-16 h-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FDA811', opacity: 0.1 }}>
                <svg className="w-7 h-7" style={{ color: '#FDA811' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#FDA811', color: 'white', opacity: 0.9 }}>
                <span>Urgent</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Review</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? (
                  <span className="inline-block animate-pulse bg-gray-200 h-9 w-12 rounded"></span>
                ) : (
                  stats.pending
                )}
              </p>
              <p className="text-sm mt-2" style={{ color: '#FDA811' }}>
                {statsLoading ? '...' : `+${stats.totalToday} new today`}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#4A90E2', opacity: 0.1 }}>
                <svg className="w-7 h-7" style={{ color: '#4A90E2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#4A90E2', color: 'white', opacity: 0.9 }}>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Active</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">In Progress</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? (
                  <span className="inline-block animate-pulse bg-gray-200 h-9 w-12 rounded"></span>
                ) : (
                  stats.processing
                )}
              </p>
              <p className="text-sm mt-2" style={{ color: '#4A90E2' }}>
                Being processed
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#4CAF50', opacity: 0.1 }}>
                <svg className="w-7 h-7" style={{ color: '#4CAF50' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#4CAF50', color: 'white', opacity: 0.9 }}>
                <span>Done</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Completed</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? (
                  <span className="inline-block animate-pulse bg-gray-200 h-9 w-12 rounded"></span>
                ) : (
                  stats.completed
                )}
              </p>
              <p className="text-sm mt-2" style={{ color: '#4CAF50' }}>
                {statsLoading ? '...' : `+${stats.completedToday} finished today`}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center opacity-90">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="flex items-center space-x-1 text-xs font-medium px-2 py-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full opacity-90">
                <span>Ready</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Ready for Pickup</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statsLoading ? (
                  <span className="inline-block animate-pulse bg-gray-200 h-9 w-12 rounded"></span>
                ) : (
                  stats.ready
                )}
              </p>
              <p className="text-sm text-purple-600 mt-2">
                Available for collection
              </p>
            </div>
          </div>
        </div>

        {/* Action Center & Quick Access */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          
          {/* Main Actions */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Action Center</h2>
              <span className="text-sm text-gray-500">Choose your workflow</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/employee/death-registrations" className="group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform rotate-12 translate-x-8 -translate-y-8" style={{ backgroundColor: '#4CAF50' }}></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#4CAF50', opacity: 0.1 }}>
                        <svg className="w-6 h-6" style={{ color: '#4CAF50' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Death Registrations</h3>
                    <p className="text-gray-600 text-sm mb-4">Process death registration applications and verify documentation</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#4CAF50', color: 'white', opacity: 0.9 }}>
                        High Priority
                      </span>
                      <span className="text-sm font-semibold" style={{ color: '#4CAF50' }}>
                        {statsLoading ? '...' : stats.pending} pending
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/employee/burial-permits" className="group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform rotate-12 translate-x-8 -translate-y-8" style={{ backgroundColor: '#4A90E2' }}></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#4A90E2', opacity: 0.1 }}>
                        <svg className="w-6 h-6" style={{ color: '#4A90E2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Burial Permits</h3>
                    <p className="text-gray-600 text-sm mb-4">Handle burial, cremation, and exhumation permit applications</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#4A90E2', color: 'white', opacity: 0.9 }}>
                        Regular
                      </span>
                      <span className="text-sm font-semibold" style={{ color: '#4A90E2' }}>
                        Process Now
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/employee/certificates" className="group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform rotate-12 translate-x-8 -translate-y-8" style={{ backgroundColor: '#FDA811' }}></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FDA811', opacity: 0.1 }}>
                        <svg className="w-6 h-6" style={{ color: '#FDA811' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Certificate Requests</h3>
                    <p className="text-gray-600 text-sm mb-4">Validate and process death certificate applications</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#FDA811', color: 'white', opacity: 0.9 }}>
                        Validation
                      </span>
                      <span className="text-sm font-semibold" style={{ color: '#FDA811' }}>
                        Review Queue
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/employee/tasks" className="group">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 opacity-5 transform rotate-12 translate-x-8 -translate-y-8"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center opacity-90">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">My Tasks</h3>
                    <p className="text-gray-600 text-sm mb-4">View assigned tasks and track your workflow progress</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium px-2 py-1 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full opacity-90">
                        Personal
                      </span>
                      <span className="text-sm font-semibold text-purple-600">
                        View All
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Stats & Activity */}
          <div className="space-y-6">
            
            {/* Performance Widget */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Today&apos;s Performance</h3>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Applications Processed</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" 
                           style={{ backgroundColor: '#4CAF50', width: '75%' }}></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">12/16</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Certificates Issued</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" 
                           style={{ backgroundColor: '#4A90E2', width: '60%' }}></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">6/10</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Efficiency Rate</span>
                  <span className="text-lg font-bold" style={{ color: '#4CAF50' }}>94%</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <button className="text-sm font-medium hover:underline" style={{ color: '#4A90E2' }}>
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#4CAF50', opacity: 0.1 }}>
                    <svg className="w-4 h-4" style={{ color: '#4CAF50' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Registration approved</span>
                    </p>
                    <p className="text-xs text-gray-500">Maria Santos • 2h ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#4A90E2', opacity: 0.1 }}>
                    <svg className="w-4 h-4" style={{ color: '#4A90E2' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Permit processed</span>
                    </p>
                    <p className="text-xs text-gray-500">Juan Dela Cruz • 4h ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FDA811', opacity: 0.1 }}>
                    <svg className="w-4 h-4" style={{ color: '#FDA811' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Certificate flagged</span>
                    </p>
                    <p className="text-xs text-gray-500">Anna Garcia • 6h ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Need Help?</h3>
              <p className="text-gray-600 text-sm">Access resources and support for your daily tasks</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link href="/employee/help" 
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Help Center</span>
              </Link>
              
              <Link href="/employee/reports" 
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
                    style={{ backgroundColor: '#4A90E2' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Generate Report</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}