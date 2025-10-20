"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import AdminSidebar from "./AdminSidebar"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('admin-profile-dropdown')
      const button = document.getElementById('admin-profile-button')
      
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
          <p className="text-sm text-gray-500">Loading admin portal...</p>
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
  if (session.user?.role !== "ADMIN" && session.user?.role !== "EMPLOYEE") {
    router.push("/unauthorized")
    return null
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar - Fixed, doesn't change during navigation */}
      <AdminSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content Area - Only this section changes during navigation */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Fixed, doesn't change during navigation */}
        <header className="bg-gradient-to-r from-white via-gray-50 to-white shadow-md border-b-2 border-gray-200 sticky top-0 z-[100] backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              {/* Left Section - Page Info & Quick Stats */}
              <div className="flex items-center space-x-6">
                {/* Page Title Area */}
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                    {pathname.split('/').pop()?.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ') || 'Dashboard'}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="hidden lg:flex items-center space-x-4 pl-6 border-l border-gray-200">
                  {/* System Status */}
                  <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">System Online</span>
                  </div>

                  {/* Active Services */}
                  <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                    <span className="text-xs font-medium text-blue-700">4 Services</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Actions & Profile */}
              <div className="flex items-center space-x-3">
                {/* Search Button */}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors group">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {/* Notifications Button */}
                <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* Notification Badge */}
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                {/* Settings Button */}
                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors group">
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                {/* Divider */}
                <div className="h-8 w-px bg-gray-300"></div>
                
                {/* Profile Dropdown */}
                <div className="relative z-[150]">
                  <button
                    id="admin-profile-button"
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all duration-300 border-2 border-transparent hover:border-green-200 group"
                  >
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 shadow-lg ring-2 ring-green-200 group-hover:ring-green-300 transition-all">
                        <span className="text-white font-bold text-base">
                          {session.user?.name?.charAt(0) || 'A'}
                        </span>
                      </div>
                      {/* Online Status Indicator */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                    <div className="text-left hidden md:block">
                      <p className="font-bold text-gray-900 text-sm group-hover:text-green-700 transition-colors">
                        {session.user?.name || 'Administrator'}
                      </p>
                      <div className="flex items-center space-x-1">
                        <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <p className="text-xs text-gray-500 group-hover:text-green-600 transition-colors">
                          {session.user?.role === 'ADMIN' ? 'Administrator' : 'Employee'}
                        </p>
                      </div>
                    </div>
                    {/* Dropdown Arrow */}
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-transform group-hover:rotate-180 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showProfileDropdown && (
                    <div id="admin-profile-dropdown" className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl border-2 border-gray-100 z-[9999] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                      {/* User Info Section with Gradient Background */}
                      <div className="px-5 py-4 bg-gradient-to-br from-green-50 via-white to-green-50 border-b-2 border-gray-100">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 shadow-md">
                              <span className="text-white font-bold text-lg">
                                {session.user?.name?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">{session.user?.name || 'Administrator'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{session.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {session.user?.role === 'ADMIN' ? 'Administrator' : 'Employee'}
                          </span>
                          <div className="flex items-center space-x-1 text-xs text-green-600">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium">Active</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Navigation Links */}
                      <div className="py-2 px-2">
                        <a href="/admin/profile" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 rounded-lg transition-all duration-200 group mb-1">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors mr-3">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold group-hover:text-green-700 transition-colors">My Profile</p>
                            <p className="text-xs text-gray-500">View and edit profile</p>
                          </div>
                        </a>
                        
                        <a href="/admin/settings" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 rounded-lg transition-all duration-200 group mb-1">
                          <div className="w-9 h-9 rounded-lg bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors mr-3">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold group-hover:text-green-700 transition-colors">Settings</p>
                            <p className="text-xs text-gray-500">System preferences</p>
                          </div>
                        </a>
                        
                        <a href="/admin/notifications" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 rounded-lg transition-all duration-200 group mb-1">
                          <div className="w-9 h-9 rounded-lg bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center transition-colors mr-3 relative">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold group-hover:text-green-700 transition-colors">Notifications</p>
                              <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">3</span>
                            </div>
                            <p className="text-xs text-gray-500">3 unread messages</p>
                          </div>
                        </a>
                        
                        <a href="/admin/help" className="flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 rounded-lg transition-all duration-200 group">
                          <div className="w-9 h-9 rounded-lg bg-green-50 group-hover:bg-green-100 flex items-center justify-center transition-colors mr-3">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold group-hover:text-green-700 transition-colors">Help & Support</p>
                            <p className="text-xs text-gray-500">Get assistance</p>
                          </div>
                        </a>
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2"></div>
                      
                      {/* Action Buttons */}
                      <div className="py-2 px-2">
                        <button
                          onClick={() => signOut({ callbackUrl: 'http://localhost:3000' })}
                          className="flex items-center w-full px-3 py-2.5 text-sm rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-200 group border-2 border-transparent hover:border-red-200"
                        >
                          <div className="w-9 h-9 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors mr-3">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-red-600 group-hover:text-red-700 transition-colors">Sign Out</p>
                            <p className="text-xs text-gray-500">End your session</p>
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