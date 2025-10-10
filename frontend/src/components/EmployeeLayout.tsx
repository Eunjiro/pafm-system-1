"use client"

import { useState } from "react"
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

  // Handle authentication loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFBFB'}}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#4CAF50'}}></div>
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
    <div className="h-screen flex overflow-hidden" style={{backgroundColor: '#FBFBFB'}}>
      {/* Sidebar - Fixed, doesn't change during navigation */}
      <EmployeeSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content Area - Only this section changes during navigation */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Fixed, doesn't change during navigation */}
        <header className="bg-white shadow-md sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getPageTitle(pathname)}
                </h1>
                <p className="text-gray-600 mt-1">
                  {getPageDescription(pathname)}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{session.user?.name || 'Employee'}</p>
                    <p className="text-gray-500">{session.user?.role === 'ADMIN' ? 'Administrator' : 'Employee'}</p>
                  </div>
                </div>
                {session.user?.role === 'ADMIN' && (
                  <a
                    href="/admin"
                    className="text-white px-4 py-2 rounded-md transition-colors hover:opacity-90"
                    style={{backgroundColor: '#FF5722'}}
                  >
                    Admin Panel
                  </a>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: 'http://localhost:3000' })}
                  className="text-white px-4 py-2 rounded-md transition-colors hover:opacity-90"
                  style={{backgroundColor: '#FDA811'}}
                >
                  Sign Out
                </button>
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