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

      {/* Hero Section with Background Image */}
      <section className="relative h-[500px] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("@/public/quezon-city-background.jpg")',
          }}
        >
          {/* Green Overlay */}
          <div className="absolute inset-0 bg-green-600 opacity-80"></div>
        </div>
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white px-4">

            {/* Title and Tagline */}
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-blue-400">Go</span><span className="text-green-300">Serve</span><span className="text-blue-300">PH</span>
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-white">
              Serbisyong Publiko, Abot-Kamay mo
            </p>
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
                Burial & Cemetery
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Register deaths, request burial permits, exhumation permits, cremation permits, 
                and death certificates with online document submission.
              </p>
              <Link href="/citizen" className="inline-flex items-center mt-4 text-blue-600 font-semibold hover:text-blue-700">
                Learn more →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Facility Management
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Reserve and manage public facilities including gymnasiums, halls, and community centers. 
                Submit applications and track reservation status online.
              </p>
              <Link href="/citizen" className="inline-flex items-center mt-4 text-green-600 font-semibold hover:text-green-700">
                Learn more →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Parks & Recreation
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Book parks, sports facilities, and recreational areas. 
                View schedules, submit event permits, and manage park reservations.
              </p>
              <Link href="/citizen" className="inline-flex items-center mt-4 text-orange-600 font-semibold hover:text-orange-700">
                Learn more →
              </Link>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-20 h-20 bg-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Water & Drainage
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Report water and drainage issues, request maintenance services, 
                and track infrastructure repairs in your area.
              </p>
              <Link href="/citizen" className="inline-flex items-center mt-4 text-cyan-600 font-semibold hover:text-cyan-700">
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
