"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import CitizenHeader from "@/components/CitizenHeader"

export default function ServicesPage() {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!session || !['CITIZEN', 'EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CitizenHeader title="Services" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Available Services</h2>
            <p className="text-gray-600">Select a service to get started with your application.</p>
          </div>

          {/* Service Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Death Registration */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Death Registration</h3>
                    <p className="text-sm text-gray-500">Register a death online</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/citizen/services/death-registration/regular" className="block w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm text-center">
                    Regular Registration
                  </Link>
                  <Link href="/citizen/services/death-registration/delayed" className="block w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors text-sm text-center">
                    Delayed Registration
                  </Link>
                </div>
              </div>
            </div>

            {/* Permit Requests */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Request Permits</h3>
                    <p className="text-sm text-gray-500">Apply for burial and other permits</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/citizen/services/permits/burial" className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm text-center">
                    Burial Permit
                  </Link>
                  <Link href="/citizen/services/permits/cremation" className="block w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors text-sm text-center">
                    Cremation Permit
                  </Link>
                  <Link href="/citizen/services/permits/exhumation" className="block w-full bg-green-400 text-white py-2 px-4 rounded-md hover:bg-green-500 transition-colors text-sm text-center">
                    Exhumation Permit
                  </Link>
                </div>
              </div>
            </div>

            {/* Certificate Requests */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M11 7h5" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Request Certificates</h3>
                    <p className="text-sm text-gray-500">Get death certificates</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/citizen/services/certificates" className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center">
                    Request Death Certificate
                  </Link>
                </div>
              </div>
            </div>

            {/* Cemetery Services */}
            <div className="bg-white overflow-hidden shadow rounded-lg md:col-span-2 lg:col-span-1">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Cemetery Services</h3>
                    <p className="text-sm text-gray-500">Find plots and cemetery information</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/citizen/services/cemetery-search" className="block w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors text-sm text-center">
                    Search Cemetery Records
                  </Link>
                  <Link href="/citizen/cemetery-search" className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm text-center">
                    Find Burial Locations
                  </Link>
                </div>
              </div>
            </div>

            {/* Water & Drainage Services */}
            <div className="bg-white overflow-hidden shadow rounded-lg md:col-span-2 lg:col-span-1">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Water & Drainage Services</h3>
                    <p className="text-sm text-gray-500">Water connection, drainage, and issue reporting</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/citizen/services/water-drainage/drainage-request" className="block w-full bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors text-sm text-center">
                    Request Drainage Service
                  </Link>
                  <Link href="/citizen/services/water-drainage/water-connection" className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm text-center">
                    Apply for Water Connection
                  </Link>
                  <Link href="/citizen/services/water-drainage/water-issue" className="block w-full bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 transition-colors text-sm text-center">
                    Report Water Issue
                  </Link>
                  <Link href="/citizen/services/water-drainage/track-requests" className="block w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors text-sm text-center">
                    Track My Requests
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Required Documents</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Valid Government-issued ID</li>
                  <li>• Medical Certificate of Death (for registrations)</li>
                  <li>• Supporting documents as required</li>
                  <li>• Payment for applicable fees</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Processing Time</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Regular Death Registration: 1-3 business days</li>
                  <li>• Delayed Registration: 5-10 business days</li>
                  <li>• Permits: 3-5 business days</li>
                  <li>• Certificates: 1-2 business days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}