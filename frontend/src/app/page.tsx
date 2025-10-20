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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-green-700 font-medium">Loading GoServePH...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b-4 border-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* GoServePH Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 200 200" className="w-8 h-8">
                    <rect x="85" y="50" width="30" height="5" fill="white"/>
                    <rect x="80" y="55" width="40" height="50" fill="white"/>
                    <rect x="87" y="60" width="5" height="15" fill="#4CAF50"/>
                    <rect x="95" y="60" width="5" height="15" fill="#4CAF50"/>
                    <rect x="103" y="60" width="5" height="15" fill="#4CAF50"/>
                    <rect x="111" y="60" width="5" height="15" fill="#4CAF50"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">GoServePH</h1>
                  <p className="text-xs text-gray-600">Serbisyong Publiko, Abot-Kamay Mo</p>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Home
              </Link>
              <Link href="/citizen" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Services
              </Link>
              <Link href="#about" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                About
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              {session ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 hidden md:block">
                    Welcome, <span className="font-semibold">{session.user?.name}</span>
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: 'http://localhost:3000' })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/signin"
                    className="px-6 py-2 text-sm font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-6 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-green-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center space-x-2 bg-green-500 bg-opacity-30 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium">Government Digital Services</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Cemetery & Burial Management System
              </h1>
              
              <p className="text-xl md:text-2xl text-green-50 mb-8 leading-relaxed">
                Serbisyong Publiko, Abot-Kamay Mo
              </p>
              
              <p className="text-lg text-green-100 mb-10 max-w-xl">
                Streamlined digital services for death registration, permit requests, 
                certificate issuance, and cemetery plot management.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {!session ? (
                  <>
                    <Link
                      href="/auth/signup"
                      className="px-8 py-4 text-lg font-bold text-green-600 bg-white rounded-lg hover:bg-green-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      Get Started →
                    </Link>
                    <Link
                      href="/auth/signin"
                      className="px-8 py-4 text-lg font-bold text-white bg-green-800 bg-opacity-40 rounded-lg hover:bg-opacity-60 transition-all border-2 border-green-300"
                    >
                      Sign In
                    </Link>
                  </>
                ) : (
                  <Link
                    href={session.user?.role === 'ADMIN' ? '/admin' : session.user?.role === 'EMPLOYEE' ? '/employee' : '/citizen'}
                    className="px-8 py-4 text-lg font-bold text-green-600 bg-white rounded-lg hover:bg-green-50 transition-all shadow-xl"
                  >
                    Go to Dashboard →
                  </Link>
                )}
              </div>
            </div>

            {/* Logo Showcase */}
            <div className="hidden md:flex justify-center items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white opacity-10 blur-3xl rounded-full"></div>
                <svg viewBox="0 0 300 300" className="w-80 h-80 relative">
                  {/* Government Building */}
                  <rect x="105" y="60" width="90" height="15" fill="white"/>
                  <rect x="90" y="75" width="120" height="150" fill="white"/>
                  <rect x="112" y="90" width="15" height="45" fill="#4CAF50"/>
                  <rect x="135" y="90" width="15" height="45" fill="#4CAF50"/>
                  <rect x="158" y="90" width="15" height="45" fill="#4CAF50"/>
                  <rect x="181" y="90" width="15" height="45" fill="#4CAF50"/>
                  {/* V-shaped hands */}
                  <path d="M 60 180 L 120 120 L 150 150 Z" fill="#2E7D32" opacity="0.8"/>
                  <path d="M 240 180 L 180 120 L 150 150 Z" fill="#2E7D32" opacity="0.8"/>
                  {/* Stars */}
                  <circle cx="75" cy="45" r="5" fill="#FFC107"/>
                  <circle cx="150" cy="30" r="5" fill="#FFC107"/>
                  <circle cx="225" cy="45" r="5" fill="#FFC107"/>
                  <circle cx="105" cy="37" r="5" fill="#FFC107"/>
                  <circle cx="195" cy="37" r="5" fill="#FFC107"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Accessible, efficient, and transparent government services at your fingertips
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Service Cards */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Death Registration
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Register deaths online with regular or delayed registration options. 
                Upload required documents and track your application status.
              </p>
              <Link href="/citizen/services/death-registration" className="inline-flex items-center mt-4 text-blue-600 font-semibold hover:text-blue-700">
                Learn more →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Permits & Certificates
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Request burial permits, exhumation permits, cremation permits, 
                and death certificates with online document submission.
              </p>
              <Link href="/citizen/services/permits" className="inline-flex items-center mt-4 text-green-600 font-semibold hover:text-green-700">
                Learn more →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Cemetery Mapping
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Find cemetery plots with AI-powered search and interactive 
                digital mapping for easy navigation and plot assignment.
              </p>
              <Link href="/citizen/cemetery-search" className="inline-flex items-center mt-4 text-orange-600 font-semibold hover:text-orange-700">
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {session ? (
            <>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Welcome back, {session.user?.name}!
              </h2>
              <p className="text-xl text-green-100 mb-8">
                You are logged in as: <span className="font-bold text-white">{session.user?.role}</span>
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {session.user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="px-8 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-green-50 transition-all shadow-lg"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {(session.user?.role === 'EMPLOYEE' || session.user?.role === 'ADMIN') && (
                  <Link
                    href="/employee"
                    className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg"
                  >
                    Employee Dashboard
                  </Link>
                )}
                <Link
                  href="/citizen"
                  className="px-8 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-green-50 transition-all shadow-lg"
                >
                  Citizen Portal
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Get Started Today
              </h2>
              <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
                Create an account or sign in to access our digital cemetery and burial management services.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/auth/signup"
                  className="px-10 py-4 bg-white text-green-600 font-bold text-lg rounded-lg hover:bg-green-50 transition-all shadow-xl"
                >
                  Create Account
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-10 py-4 bg-green-800 bg-opacity-40 text-white font-bold text-lg rounded-lg hover:bg-opacity-60 transition-all border-2 border-green-300"
                >
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-6 h-6">
                    <rect x="85" y="50" width="30" height="5" fill="white"/>
                    <rect x="80" y="55" width="40" height="50" fill="white"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">GoServePH</h3>
                  <p className="text-xs text-gray-400">Serbisyong Publiko</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Your gateway to efficient and accessible government services.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/citizen" className="hover:text-green-400 transition-colors">Services</Link></li>
                <li><Link href="/citizen/cemetery-search" className="hover:text-green-400 transition-colors">Cemetery Search</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-green-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>📍 Quezon City, Philippines</li>
                <li>📞 (02) 8123-4567</li>
                <li>✉️ info@goserveph.gov.ph</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 GoServePH - Quezon City Government. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
