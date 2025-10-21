"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if user was redirected from registration
    if (searchParams.get('registered') === 'true') {
      setSuccess('Registration successful! Please sign in with your credentials.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        // Get the session to determine user role
        const session = await getSession()
        if (session?.user?.role) {
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
            default:
              router.push('/')
          }
        } else {
          router.push('/')
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: string) => {
    setLoading(true)
    try {
      await signIn(provider, { callbackUrl: "/" })
    } catch (error) {
      setError("Social sign-in failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image with Overlay */}
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

      {/* Right Side - Login Form */}
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
            <h2 className="text-3xl font-bold text-gray-900">GoServePH</h2>
            <p className="text-sm text-gray-600">Serbisyong Publiko, Abot-Kamay Mo</p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Welcome back! Please sign in to continue
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email-address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                  <span className="ml-2 text-gray-600">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" className="text-green-600 hover:text-green-700 font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded">
                <p className="font-medium">Success</p>
                <p className="text-sm">{success}</p>
              </div>
            )}

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
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSocialSignIn("google")}
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignIn("facebook")}
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </div>
          </form>

          <div className="text-center space-y-4 mt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="font-semibold text-green-600 hover:text-green-700">
                Register here
              </Link>
            </p>
            <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-green-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}