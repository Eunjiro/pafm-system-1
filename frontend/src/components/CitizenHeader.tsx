"use client"

import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

interface CitizenHeaderProps {
  title?: string
  showBackButton?: boolean
  backHref?: string
}

export default function CitizenHeader({ title, showBackButton, backHref }: CitizenHeaderProps) {
  const { data: session } = useSession()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  return (
    <header className="bg-white shadow relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            {showBackButton && backHref && (
              <Link href={backHref} className="text-gray-600 hover:text-gray-900 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <Link href="/citizen" className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: '#4CAF50' }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">PAFM System</span>
            </Link>
            {title && (
              <div className="ml-8">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {session?.user?.name}</span>
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
              {session?.user?.role}
            </span>
            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'EMPLOYEE') && (
              <div className="flex space-x-2">
                {session?.user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium hover:underline"
                    style={{ color: '#4CAF50' }}
                  >
                    Admin Dashboard
                  </Link>
                )}
                {(session?.user?.role === 'EMPLOYEE' || session?.user?.role === 'ADMIN') && (
                  <Link
                    href="/employee"
                    className="text-sm font-medium hover:underline"
                    style={{ color: '#4A90E2' }}
                  >
                    Employee Dashboard
                  </Link>
                )}
              </div>
            )}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4CAF50' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link href="/citizen/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </div>
                  </Link>
                  <Link href="/citizen/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </div>
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => signOut({ callbackUrl: 'http://localhost:3000' })}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}