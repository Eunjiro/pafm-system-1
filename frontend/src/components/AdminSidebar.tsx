"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  FiUsers, FiSettings, FiClipboard, 
  FiChevronRight, FiChevronDown, FiMenu, FiX, FiMap,
  FiDollarSign, FiTrendingUp, FiAward, FiBarChart,
} from "react-icons/fi"
import { 
  MdDashboard, MdAssignment, 
  MdLocalHospital, MdLocationOn,
} from "react-icons/md"
import { GiTombstone } from "react-icons/gi"
import { IconType } from "react-icons"

interface SidebarItem {
  id: string
  label: string
  href?: string
  icon: IconType
  children?: SidebarItem[]
  badge?: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: MdDashboard
  },
  
  // MODULE 1: DEATH REGISTRATION - Simplified
  {
    id: "death-registration",
    label: "Death Registrations",
    href: "/admin/death-registration",
    icon: MdLocalHospital
  },

  // MODULE 2: PERMIT MANAGEMENT - With Submodules
  {
    id: "permits",
    label: "Permit Management",
    icon: MdAssignment,
    children: [
      { id: "permits-overview", label: "All Permits", href: "/admin/permits", icon: MdAssignment },
      { id: "burial-permits", label: "Burial Permits", href: "/admin/permits/burial", icon: FiUsers },
      { id: "exhumation-permits", label: "Exhumation Permits", href: "/admin/permits/exhumation", icon: FiClipboard },
      { id: "cremation-permits", label: "Cremation Permits", href: "/admin/permits/cremation", icon: FiTrendingUp }
    ]
  },

  // MODULE 3: CERTIFICATE REQUESTS - Simplified
  {
    id: "certificates",
    label: "Certificate Requests",
    href: "/admin/certificates",
    icon: FiAward
  },

  // MODULE 4: CEMETERY MANAGEMENT - Simplified
  {
    id: "cemetery",
    label: "Cemetery Management",
    icon: MdLocationOn,
    children: [
      { id: "cemetery-creation", label: "Create Cemetery", href: "/admin/cemetery-map", icon: FiMap },
      { id: "cemetery-management", label: "Manage Cemeteries", href: "/admin/cemetery", icon: GiTombstone },
      { id: "cemetery-plots", label: "Plot Management", href: "/admin/cemetery/plots", icon: MdLocationOn }
    ]
  },

  // ADMIN-SPECIFIC FUNCTIONS
  {
    id: "users",
    label: "User Management",
    href: "/admin/users",
    icon: FiUsers
  },

  {
    id: "system",
    label: "System Administration",
    icon: FiSettings,
    children: [
      { id: "audit-logs", label: "Audit Logs", href: "/admin/system/audit-logs", icon: FiClipboard },
      { id: "fee-management", label: "Fee Management", href: "/admin/system/fees", icon: FiDollarSign },
      { id: "system-settings", label: "System Settings", href: "/admin/system/settings", icon: FiSettings }
    ]
  },

  // ADMIN-SPECIFIC REPORTS
  {
    id: "reports",
    label: "Reports & Analytics",
    icon: FiBarChart,
    children: [
      { id: "dashboard-analytics", label: "Dashboard Analytics", href: "/admin/reports/dashboard", icon: FiTrendingUp },
      { id: "audit-reports", label: "Audit Reports", href: "/admin/reports/audit", icon: FiClipboard },
      { id: "financial-reports", label: "Financial Reports", href: "/admin/reports/financial", icon: FiDollarSign }
    ]
  }
];

interface AdminSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([]) // Start with all items collapsed

  const isActive = (href?: string) => {
    if (!href) return false
    const cleanHref = href.split('?')[0] // Remove query params for comparison
    if (cleanHref === '/admin') {
      return pathname === cleanHref
    }
    return pathname === href || pathname.startsWith(cleanHref + "/")
  }

  const isParentActive = (item: SidebarItem) => {
    if (item.href && isActive(item.href)) return true
    if (item.children) {
      return item.children.some(child => isActive(child.href))
    }
    return false
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  // Auto-expand parent items when child is active
  useEffect(() => {
    sidebarItems.forEach(item => {
      if (item.children && item.children.some(child => isActive(child.href))) {
        if (!expandedItems.includes(item.id)) {
          setExpandedItems(prev => [...prev, item.id])
        }
      }
    })
  }, [pathname])

  return (
    <div className={`bg-white shadow-md transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-screen border-r border-gray-100 relative flex flex-col`}>
      
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800">Admin Portal</h2>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{backgroundColor: '#4CAF50', color: 'white'}}
          >
            {isCollapsed ? <FiMenu size={18} /> : <FiX size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
          <div key={item.id}>
            {/* Parent Item */}
            {item.children ? (
              <button
                onClick={() => !isCollapsed && toggleExpanded(item.id)}
                className={`group relative flex items-center text-start w-full px-3 py-2.5 rounded-xl transition-all duration-200 overflow-hidden ${
                  isParentActive(item)
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                style={isParentActive(item) 
                  ? {background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'} 
                  : {}
                }
              >
                {/* Animated background for hover - only show when not active */}
                {!isParentActive(item) && (
                  <div className="absolute inset-0 bg-gray-50 rounded-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                )}
                
                {/* Left accent bar */}
                <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 rounded-r-full transition-all duration-200 ${
                  isParentActive(item) 
                    ? 'h-6 bg-white' 
                    : 'h-0 bg-gray-400 group-hover:h-4'
                }`}></div>
                
                {/* Icon */}
                <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isParentActive(item) 
                    ? '' 
                    : 'group-hover:bg-white group-hover:shadow-sm'
                }`}>
                  <item.icon size={18} className={`transition-colors duration-200 ${
                    isParentActive(item) 
                      ? 'text-white' 
                      : 'group-hover:text-gray-700'
                  }`} />
                </div>
                
                {!isCollapsed && (
                  <>
                    <div className="relative z-10 ml-3 flex-1">
                      <span className={`font-medium text-sm transition-all duration-200 ${
                        isParentActive(item) 
                          ? 'text-white' 
                          : 'group-hover:text-gray-800'
                      }`}>
                        {item.label}
                      </span>
                    </div>
                    
                    {item.badge && (
                      <span 
                        className="relative z-10 px-2 py-1 text-xs font-bold rounded-full text-white mr-2"
                        style={{backgroundColor: '#FDA811'}}
                      >
                        {item.badge}
                      </span>
                    )}
                    
                    {/* Expand/Collapse Arrow */}
                    <div className="relative z-10">
                      {expandedItems.includes(item.id) ? (
                        <FiChevronDown className={`w-4 h-4 transition-colors duration-200 ${
                          isParentActive(item) ? 'text-white' : 'text-gray-500'
                        }`} />
                      ) : (
                        <FiChevronRight className={`w-4 h-4 transition-colors duration-200 ${
                          isParentActive(item) ? 'text-white' : 'text-gray-500'
                        }`} />
                      )}
                    </div>
                  </>
                )}
                
                {/* Active indicator dot for collapsed state */}
                {isParentActive(item) && isCollapsed && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            ) : (
              <Link
                href={item.href || '#'}
                prefetch={true}
                className={`group relative flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 overflow-hidden ${
                  isActive(item.href)
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                style={isActive(item.href) 
                  ? {background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'} 
                  : {}
                }
              >
                {/* Animated background for hover - only show when not active */}
                {!isActive(item.href) && (
                  <div className="absolute inset-0 bg-gray-50 rounded-xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                )}
                
                {/* Left accent bar */}
                <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 rounded-r-full transition-all duration-200 ${
                  isActive(item.href) 
                    ? 'h-6 bg-white' 
                    : 'h-0 bg-gray-400 group-hover:h-4'
                }`}></div>
                
                {/* Icon */}
                <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isActive(item.href) 
                    ? '' 
                    : 'group-hover:bg-white group-hover:shadow-sm'
                }`}>
                  <item.icon size={18} className={`transition-colors duration-200 ${
                    isActive(item.href) 
                      ? 'text-white' 
                      : 'group-hover:text-gray-700'
                  }`} />
                </div>
                
                {!isCollapsed && (
                  <div className="relative z-10 ml-3 flex-1">
                    <span className={`font-medium text-sm transition-all duration-200 ${
                      isActive(item.href) 
                        ? 'text-white' 
                        : 'group-hover:text-gray-800'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                )}
                
                {/* Active indicator dot for collapsed state */}
                {isActive(item.href) && isCollapsed && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            )}

            {/* Sub Items */}
            {!isCollapsed && item.children && expandedItems.includes(item.id) && (
              <div className="mt-1 ml-4 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.href || '#'}
                    prefetch={true}
                    className={`group relative flex items-center px-3 py-2 rounded-lg transition-all duration-200 overflow-hidden ${
                      isActive(child.href)
                        ? 'text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={isActive(child.href) 
                      ? {background: 'linear-gradient(135deg, #FDA811 0%, #E6951A 100%)'} 
                      : {}
                    }
                  >
                    {/* Animated background for hover - only show when not active */}
                    {!isActive(child.href) && (
                      <div className="absolute inset-0 bg-gray-50 rounded-lg transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                    )}
                    
                    {/* Left accent bar */}
                    <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 rounded-r-full transition-all duration-200 ${
                      isActive(child.href) 
                        ? 'h-4 bg-white' 
                        : 'h-0 bg-gray-400 group-hover:h-3'
                    }`}></div>
                    
                    {/* Icon */}
                    <div className={`relative z-10 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                      isActive(child.href) 
                        ? '' 
                        : 'group-hover:bg-white group-hover:shadow-sm'
                    }`}>
                      <child.icon size={14} className={`transition-colors duration-200 ${
                        isActive(child.href) 
                          ? 'text-white' 
                          : 'group-hover:text-gray-700'
                      }`} />
                    </div>
                    
                    <div className="relative z-10 ml-2 flex-1">
                      <span className={`font-medium text-xs transition-all duration-200 ${
                        isActive(child.href) 
                          ? 'text-white' 
                          : 'group-hover:text-gray-800'
                      }`}>
                        {child.label}
                      </span>
                    </div>
                    
                    {child.badge && (
                      <span 
                        className="relative z-10 px-1.5 py-0.5 text-xs font-bold rounded-full text-white"
                        style={{backgroundColor: '#FDA811'}}
                      >
                        {child.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}