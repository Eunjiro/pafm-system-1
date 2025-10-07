"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user?.role) {
      // Auto-redirect based on user role
      const role = session.user.role.toLowerCase()
      switch (role) {
        case 'admin':
          router.push('/admin')
          break
        case 'employee':
          router.push('/employee')
          break
        case 'citizen':
          router.push('/citizen')
          break
      }
    }
  }, [session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFBFB'}}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#4CAF50'}}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FBFBFB'}}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Cemetery & Burial Management System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    Welcome, {session.user?.name}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: 'http://localhost:3000' })}
                    className="text-white px-4 py-2 rounded-md transition-colors hover:opacity-90"
                    style={{backgroundColor: '#FDA811'}}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-x-2">
                  <Link
                    href="/auth/signin"
                    className="text-white px-4 py-2 rounded-md transition-colors hover:opacity-90"
                    style={{backgroundColor: '#4A90E2'}}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-white px-4 py-2 rounded-md transition-colors hover:opacity-90"
                    style={{backgroundColor: '#4CAF50'}}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Quezon City Cemetery & Burial Services
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Streamlined digital services for death registration, permit requests, 
            certificate issuance, and cemetery plot management.
          </p>

          {!session && (
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Service Cards */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#4A90E2', opacity: 0.2}}>
                  <svg className="w-8 h-8" style={{color: '#4A90E2'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Death Registration
                </h3>
                <p className="text-gray-600">
                  Register deaths online with regular or delayed registration options. 
                  Upload required documents and track your application status.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#4CAF50', opacity: 0.2}}>
                  <svg className="w-8 h-8" style={{color: '#4CAF50'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Permits & Certificates
                </h3>
                <p className="text-gray-600">
                  Request burial permits, exhumation permits, cremation permits, 
                  and death certificates with online document submission.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#FDA811', opacity: 0.2}}>
                  <svg className="w-8 h-8" style={{color: '#FDA811'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Cemetery Mapping
                </h3>
                <p className="text-gray-600">
                  Find cemetery plots with AI-powered search and interactive 
                  digital mapping for easy navigation and plot assignment.
                </p>
              </div>
            </div>
          )}

          {session && (
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Welcome back, {session.user?.name}!
              </h3>
              <p className="text-gray-600 mb-6">
                You are logged in as: <span className="font-semibold" style={{color: '#4CAF50'}}>{session.user?.role}</span>
              </p>
              <div className="flex justify-center space-x-4">
                {session.user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-white px-6 py-3 rounded-md transition-colors hover:opacity-90"
                    style={{backgroundColor: '#FDA811'}}
                  >
                    Admin Dashboard
                  </Link>
                )}
                {(session.user?.role === 'EMPLOYEE' || session.user?.role === 'ADMIN') && (
                  <Link
                    href="/employee"
                    className="text-white px-6 py-3 rounded-md transition-colors hover:opacity-90"
                    style={{backgroundColor: '#4A90E2'}}
                  >
                    Employee Dashboard
                  </Link>
                )}
                <Link
                  href="/citizen"
                  className="text-white px-6 py-3 rounded-md transition-colors hover:opacity-90"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  Citizen Portal
                </Link>
              </div>
            </div>
          )}

          {!session && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Get Started Today
              </h3>
              <p className="text-gray-600 mb-6">
                Create an account or sign in to access our digital cemetery and burial management services.
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/auth/signup"
                  className="text-white px-8 py-3 rounded-md text-lg transition-colors hover:opacity-90"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  Create Account
                </Link>
                <Link
                  href="/auth/signin"
                  className="text-white px-8 py-3 rounded-md text-lg transition-colors hover:opacity-90"
                  style={{backgroundColor: '#4A90E2'}}
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Quezon City Government. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
