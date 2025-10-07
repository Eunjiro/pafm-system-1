"use client"

import { useState } from "react"
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
  if (session.user?.role !== "ADMIN" && session.user?.role !== "EMPLOYEE") {
    router.push("/unauthorized")
    return null
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{backgroundColor: '#FBFBFB'}}>
      {/* Sidebar - Fixed, doesn't change during navigation */}
      <AdminSidebar 
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
                    <p className="font-medium text-gray-900">{session.user?.name || 'Admin User'}</p>
                    <p className="text-gray-500">{session.user?.role === 'ADMIN' ? 'Administrator' : 'Employee'}</p>
                  </div>
                </div>
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
    '/admin': 'Admin Dashboard',
    '/admin/death-registration/regular': 'Regular Death Registration',
    '/admin/death-registration/delayed': 'Delayed Death Registration',
    '/admin/death-registration/pending': 'Pending Registrations',
    '/admin/burial-permits': 'Burial Permits',
    '/admin/permits/exhumation': 'Exhumation Permits',
    '/admin/permits/cremation': 'Cremation Permits',
    '/admin/certificates': 'Certificate Requests',
    '/admin/cemetery/mapping': 'Cemetery Mapping',
    '/admin/cemetery/assignments': 'Plot Assignments',
    '/admin/payments': 'Payment Management',
    '/admin/users': 'User Management',
    '/admin/system': 'System Settings'
  }

  // Try exact match first
  if (pathMap[pathname]) return pathMap[pathname]

  // Try partial matches for nested routes
  for (const [path, title] of Object.entries(pathMap)) {
    if (pathname.startsWith(path) && path !== '/admin') {
      return title
    }
  }

  return 'Admin Dashboard'
}

// Helper function to get page description based on pathname
function getPageDescription(pathname: string): string {
  const descMap: Record<string, string> = {
    '/admin': 'Cemetery & Burial Management System Overview',
    '/admin/death-registration/regular': 'Manage regular death registration applications',
    '/admin/death-registration/delayed': 'Review and process delayed death registration applications',
    '/admin/death-registration/pending': 'Review pending death registration applications',
    '/admin/burial-permits': 'Process and manage burial permit applications',
    '/admin/permits/exhumation': 'Manage exhumation permit requests',
    '/admin/permits/cremation': 'Process cremation permit applications',
    '/admin/certificates': 'Manage death certificate requests and issuance',
    '/admin/cemetery/mapping': 'Interactive cemetery plot mapping and AI locator',
    '/admin/cemetery/assignments': 'Manage cemetery plot assignments and reservations',
    '/admin/payments': 'Monitor payments and financial transactions',
    '/admin/users': 'Manage user accounts and access control',
    '/admin/system': 'System configuration and administration'
  }

  // Try exact match first
  if (descMap[pathname]) return descMap[pathname]

  // Try partial matches for nested routes
  for (const [path, desc] of Object.entries(descMap)) {
    if (pathname.startsWith(path) && path !== '/admin') {
      return desc
    }
  }

  return 'Cemetery & Burial Management System'
}