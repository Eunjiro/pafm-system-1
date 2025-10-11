"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import EmployeeSidebar from "./EmployeeSidebar"

interface EmployeeLayoutProps {
  children: React.ReactNode
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('employee-profile-dropdown')
      const button = document.getElementById('employee-profile-button')
      
      if (dropdown && button && 
          !dropdown.contains(event.target as Node) && 
          !button.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileDropdown])

  // Handle authentication loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading employee portal...</p>
        </div>
      </div>
    )
  }

  // Handle unauthenticated users
  if (!session) {
    router.push("/auth/signin")
    return null
  }

  // Handle unauthorized users
  if (!["EMPLOYEE", "ADMIN"].includes(session.user?.role || "")) {
    router.push("/unauthorized")
    return null
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar - Fixed, doesn't change during navigation */}
      <EmployeeSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content Area - Only this section changes during navigation */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Fixed, doesn't change during navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {getPageTitle(pathname)}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {getPageDescription(pathname)}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {session.user?.role === 'ADMIN' && (
                  <a
                    href="/admin"
                    className="px-4 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#FDA811' }}
                  >
                    Admin Panel
                  </a>
                )}
                
                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    id="employee-profile-button"
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#4CAF50' }}>
                      <span className="text-white font-semibold text-sm">
                        {session.user?.name?.charAt(0) || 'E'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{session.user?.name || 'Employee'}</p>
                      <p className="text-gray-500">{session.user?.role === 'ADMIN' ? 'Administrator' : 'Employee'}</p>
                    </div>
                  </button>
                  
                  {showProfileDropdown && (
                    <div id="employee-profile-dropdown" className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{session.user?.name || 'Employee'}</p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: '#4CAF50' }}>
                          {session.user?.role === 'ADMIN' ? 'Administrator' : 'Employee'}
                        </span>
                      </div>
                      
                      {/* Navigation Links */}
                      <div className="py-1">
                        <a href="/employee/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Profile
                          </div>
                        </a>
                        <a href="/employee/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                          </div>
                        </a>
                        <a href="/employee/notifications" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a4 4 0 01-4-4V5a4 4 0 014-4h6a4 4 0 014 4v8a4 4 0 01-4 4z" />
                            </svg>
                            Notifications
                          </div>
                        </a>
                        <a href="/employee/help" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Help & Support
                          </div>
                        </a>
                      </div>
                      
                      <hr className="my-1" />
                      
                      {/* Action Buttons */}
                      <div className="py-1">
                        <button
                          onClick={() => signOut({ callbackUrl: 'http://localhost:3000' })}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area - This changes with navigation */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// Helper function to get page title based on pathname
function getPageTitle(pathname: string): string {
  const pathMap: Record<string, string> = {
    '/employee': 'Employee Dashboard',
    '/employee/death-registrations': 'Death Registrations',
    '/employee/burial-permits': 'Burial Permits',
    '/employee/certificates': 'Certificate Requests',
    '/employee/tasks': 'My Tasks',
    '/employee/profile': 'My Profile',
    '/employee/reports': 'Reports'
  }

  // Try exact match first
  if (pathMap[pathname]) return pathMap[pathname]

  // Try partial matches for nested routes
  for (const [path, title] of Object.entries(pathMap)) {
    if (pathname.startsWith(path) && path !== '/employee') {
      return title
    }
  }

  return 'Employee Dashboard'
}

// Helper function to get page description based on pathname
function getPageDescription(pathname: string): string {
  const descMap: Record<string, string> = {
    '/employee': 'Cemetery & Burial Management System - Employee Portal',
    '/employee/death-registrations': 'Process and verify death registration applications',
    '/employee/burial-permits': 'Review and approve burial permit requests',
    '/employee/certificates': 'Manage death certificate requests and validation',
    '/employee/tasks': 'View assigned tasks and workflow items',
    '/employee/profile': 'Manage your profile and account settings',
    '/employee/reports': 'Generate and view work reports'
  }

  // Try exact match first
  if (descMap[pathname]) return descMap[pathname]

  // Try partial matches for nested routes
  for (const [path, desc] of Object.entries(descMap)) {
    if (pathname.startsWith(path) && path !== '/employee') {
      return desc
    }
  }

  return 'Cemetery & Burial Management System - Employee Portal'
}