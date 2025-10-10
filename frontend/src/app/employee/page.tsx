"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function EmployeeDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!session || !['EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
    return null
  }

  return (
    <div className="p-6">
      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-yellow-500">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Verification</dt>
                    <dd className="text-2xl font-bold text-gray-900">12</dd>
                  </div>
                  <div className="bg-yellow-50 px-2 py-1 rounded-full">
                    <span className="text-xs font-medium text-yellow-600">+3 today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-blue-500">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 truncate">Processing</dt>
                    <dd className="text-2xl font-bold text-gray-900">8</dd>
                  </div>
                  <div className="bg-blue-50 px-2 py-1 rounded-full">
                    <span className="text-xs font-medium text-blue-600">In progress</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-green-500">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                    <dd className="text-2xl font-bold text-gray-900">15</dd>
                  </div>
                  <div className="bg-green-50 px-2 py-1 rounded-full">
                    <span className="text-xs font-medium text-green-600">+7 today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-purple-500">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 truncate">Ready for Pickup</dt>
                    <dd className="text-2xl font-bold text-gray-900">23</dd>
                  </div>
                  <div className="bg-purple-50 px-2 py-1 rounded-full">
                    <span className="text-xs font-medium text-purple-600">Urgent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">System operational</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/employee/death-registrations" className="group bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-t-4 border-red-500">
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-red-50 px-3 py-1 rounded-full">
                  <span className="text-sm font-bold text-red-600">12</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">Death Registrations</h3>
                <p className="text-gray-600 mb-3">Process and verify death registration applications</p>
                <div className="flex items-center text-sm text-red-600 font-medium">
                  <span>Review Applications</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/employee/burial-permits" className="group bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-t-4 border-green-500">
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 712 2" />
                    </svg>
                  </div>
                </div>
                <div className="bg-green-50 px-3 py-1 rounded-full">
                  <span className="text-sm font-bold text-green-600">5</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Burial Permits</h3>
                <p className="text-gray-600 mb-3">Handle burial, cremation, and exhumation permit requests</p>
                <div className="flex items-center text-sm text-green-600 font-medium">
                  <span>Process Permits</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/employee/certificates" className="group bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-t-4 border-blue-500">
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 714.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 713.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 713.138-3.138z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-blue-50 px-3 py-1 rounded-full">
                  <span className="text-sm font-bold text-blue-600">8</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Certificate Requests</h3>
                <p className="text-gray-600 mb-3">Validate and process death certificate requests</p>
                <div className="flex items-center text-sm text-blue-600 font-medium">
                  <span>Validate Requests</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="flow-root">
            <ul className="-mb-8">
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex space-x-4">
                    <div>
                      <span className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">You</span> approved death registration for 
                          <span className="font-medium text-gray-900"> Maria Santos</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Registration #DR-2024-0123</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-400">
                        <time>2 hours ago</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex space-x-4">
                    <div>
                      <span className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 712-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-900">You</span> processed burial permit for 
                          <span className="font-medium text-gray-900"> Juan Dela Cruz</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Permit #BP-2024-0087</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-400">
                        <time>4 hours ago</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="relative">
                  <div className="relative flex space-x-4">
                    <div>
                      <span className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <p className="text-sm text-gray-500">
                          Certificate request flagged for review - <span className="font-medium text-gray-900">Anna Garcia</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Request #CR-2024-0156</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-400">
                        <time>6 hours ago</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
