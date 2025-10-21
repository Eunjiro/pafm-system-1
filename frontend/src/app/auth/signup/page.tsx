"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullNameFirst: "",
    fullNameLast: "",
    fullNameMiddle: "",
    contactNo: "",
    address: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/auth/register-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullNameFirst: formData.fullNameFirst,
          fullNameLast: formData.fullNameLast,
          fullNameMiddle: formData.fullNameMiddle || undefined,
          contactNo: formData.contactNo || undefined,
          address: formData.address || undefined,
          role: 'CITIZEN',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/auth/signin?registered=true')
      } else {
        setError(data.message || data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: string) => {
    setLoading(true)
    try {
      await signIn(provider, { callbackUrl: "/citizen" })
    } catch (error) {
      setError("Social sign-up failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-12 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-block p-4 bg-green-600 rounded-full shadow-lg mb-4">
              <svg viewBox="0 0 200 200" className="w-16 h-16">
                <rect x="70" y="40" width="60" height="10" fill="white"/>
                <rect x="60" y="50" width="80" height="100" fill="white"/>
                <rect x="75" y="60" width="10" height="30" fill="#4CAF50"/>
                <rect x="90" y="60" width="10" height="30" fill="#4CAF50"/>
                <rect x="105" y="60" width="10" height="30" fill="#4CAF50"/>
                <rect x="120" y="60" width="10" height="30" fill="#4CAF50"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">GoServePH</h2>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              Create Account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Join thousands of citizens accessing government services
            </p>
          </div>
        
        
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullNameFirst" className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    id="fullNameFirst"
                    name="fullNameFirst"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="First Name"
                    value={formData.fullNameFirst}
                    onChange={handleChange}
                  />
                </div>
              
                <div>
                  <label htmlFor="fullNameLast" className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    id="fullNameLast"
                    name="fullNameLast"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Last Name"
                    value={formData.fullNameLast}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fullNameMiddle" className="block text-sm font-semibold text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  id="fullNameMiddle"
                  name="fullNameMiddle"
                  type="text"
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Middle Name (optional)"
                  value={formData.fullNameMiddle}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="contactNo" className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  id="contactNo"
                  name="contactNo"
                  type="tel"
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Contact number (optional)"
                  value={formData.contactNo}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                  placeholder="Address (optional)"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Password (min. 8 characters)"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">OR</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => handleSocialSignIn("google")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </div>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/signin" className="font-medium text-green-600 hover:text-green-700">
                Sign in
              </Link>
            </p>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-green-600 hover:text-green-700">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image with Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-green-600 to-green-700">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Logo and Branding */}
          <div className="mb-8 text-center">
            <div className="inline-block p-6 bg-white rounded-full shadow-2xl mb-6">
              <div className="w-32 h-32 relative">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Government Building Icon */}
                  <rect x="70" y="40" width="60" height="10" fill="#4CAF50"/>
                  <rect x="60" y="50" width="80" height="100" fill="#4CAF50"/>
                  <rect x="75" y="60" width="10" height="30" fill="white"/>
                  <rect x="90" y="60" width="10" height="30" fill="white"/>
                  <rect x="105" y="60" width="10" height="30" fill="white"/>
                  <rect x="120" y="60" width="10" height="30" fill="white"/>
                  {/* V-shaped hands */}
                  <path d="M 40 120 L 80 80 L 100 100 Z" fill="#2E7D32"/>
                  <path d="M 160 120 L 120 80 L 100 100 Z" fill="#2E7D32"/>
                  {/* Stars */}
                  <circle cx="50" cy="30" r="3" fill="#FFC107"/>
                  <circle cx="100" cy="20" r="3" fill="#FFC107"/>
                  <circle cx="150" cy="30" r="3" fill="#FFC107"/>
                  <circle cx="70" cy="25" r="3" fill="#FFC107"/>
                  <circle cx="130" cy="25" r="3" fill="#FFC107"/>
                </svg>
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-2">GoServePH</h1>
            <p className="text-xl text-green-100">Serbisyong Publiko, Abot-Kamay Mo</p>
          </div>
          
          {/* Tagline */}
          <div className="max-w-md text-center mt-8">
            <p className="text-lg leading-relaxed">
              Your Gateway to Efficient Government Services
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
