"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  FiUsers, FiSettings, FiFileText, FiClipboard, 
  FiChevronRight, FiChevronDown, FiMenu, FiX,
  FiUser, FiShield, FiClock, FiCheckCircle, FiMap,
  FiDollarSign, FiTrendingUp, FiAward, FiEye,
  FiEdit3, FiSearch, FiDownload, FiUpload,
  FiCreditCard, FiArchive, FiAlertTriangle,
  FiCalendar, FiBarChart, FiDatabase
} from "react-icons/fi"
import { 
  MdDashboard, MdAssignment, 
  MdLocalHospital, MdLocationOn, 
  MdAccountBox, MdSecurity, MdBackup,
  MdPayment, MdHistory,
  MdPrint, MdVerifiedUser, MdNotifications
} from "react-icons/md"
import { AiFillFire } from "react-icons/ai"
import { GiCoffin, GiTombstone } from "react-icons/gi"
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

  // MODULE 2: PERMIT MANAGEMENT - Consolidated
  {
    id: "permits",
    label: "Permit Management",
    href: "/admin/permits",
    icon: MdAssignment
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
  const [expandedItems, setExpandedItems] = useState<string[]>(["dashboard"])
  const pathname = usePathname()

  const toggleExpanded = (itemId: string) => {
    if (isCollapsed) {
      onToggle() // Expand sidebar when clicking on items while collapsed
    }
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }



  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + "/")
  }

  const isParentActive = (children?: SidebarItem[]) => {
    if (!children) return false
    return children.some(child => isActive(child.href))
  }

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-screen border-r border-gray-200 relative flex flex-col`}>
      
      {/* Header */}
      <div className="px-4 py-7 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-md transition-colors"
            style={{backgroundColor: '#4CAF50', color: 'white'}}
          >
            {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => (
          <div key={item.id}>
            {/* Main Item */}
            {item.href ? (
              <Link
                href={item.href}
                prefetch={true}
                className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isActive(item.href) || isParentActive(item.children)
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={isActive(item.href) || isParentActive(item.children) ? {backgroundColor: '#4CAF50'} : {}}
              >
                <item.icon size={20} />
                {!isCollapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </Link>
            ) : (
              <button
                onClick={() => toggleExpanded(item.id)}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                  isParentActive(item.children)
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={isParentActive(item.children) ? {backgroundColor: '#4CAF50'} : {}}
              >
                <item.icon size={20} />
                {!isCollapsed && (
                  <>
                    <span className="ml-3 font-medium flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span 
                        className="px-2 py-1 text-xs font-bold rounded-full text-white mr-2"
                        style={{backgroundColor: '#FDA811'}}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.children && item.children.length > 0 && (
                      expandedItems.includes(item.id) ? 
                        <FiChevronDown size={16} /> : 
                        <FiChevronRight size={16} />
                    )}
                  </>
                )}
              </button>
            )}

            {/* Sub Items */}
            {!isCollapsed && item.children && expandedItems.includes(item.id) && (
              <div className="mt-2 ml-6 space-y-1">
                {item.children.map((child) => (
                  <div key={child.id}>
                    {/* Child Item */}
                    {child.href ? (
                      <Link
                        href={child.href}
                        prefetch={true}
                        className={`flex items-center p-2 rounded-md text-sm transition-colors ${
                          isActive(child.href)
                            ? 'text-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        style={isActive(child.href) ? {backgroundColor: '#4A90E2'} : {}}
                      >
                        <div className="flex items-center mr-2">
                          <child.icon size={16} />
                        </div>
                        <span className="flex-1">{child.label}</span>
                        {child.badge && (
                          <span 
                            className="px-2 py-1 text-xs font-bold rounded-full text-white"
                            style={{backgroundColor: '#FDA811'}}
                          >
                            {child.badge}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <button
                        onClick={() => toggleExpanded(child.id)}
                        className={`w-full flex items-center p-2 rounded-md text-sm transition-colors ${
                          isParentActive(child.children)
                            ? 'text-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                        style={isParentActive(child.children) ? {backgroundColor: '#4A90E2'} : {}}
                      >
                        <div className="flex items-center mr-2">
                          <child.icon size={16} />
                        </div>
                        <span className="flex-1 text-left">{child.label}</span>
                        {child.badge && (
                          <span 
                            className="px-2 py-1 text-xs font-bold rounded-full text-white mr-2"
                            style={{backgroundColor: '#FDA811'}}
                          >
                            {child.badge}
                          </span>
                        )}
                        {child.children && child.children.length > 0 && (
                          expandedItems.includes(child.id) ? 
                            <FiChevronDown size={14} /> : 
                            <FiChevronRight size={14} />
                        )}
                      </button>
                    )}

                    {/* Sub-Sub Items (Third Level) */}
                    {child.children && expandedItems.includes(child.id) && (
                      <div className="mt-1 ml-4 space-y-1">
                        {child.children.map((subChild) => (
                          <Link
                            key={subChild.id}
                            href={subChild.href || '#'}
                            prefetch={true}
                            className={`flex items-center p-2 rounded-md text-xs transition-colors ${
                              isActive(subChild.href)
                                ? 'text-white'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                            style={isActive(subChild.href) ? {backgroundColor: '#6C7B7F'} : {}}
                          >
                            <div className="flex items-center mr-2">
                              <subChild.icon size={14} />
                            </div>
                            <span className="flex-1">{subChild.label}</span>
                            {subChild.badge && (
                              <span 
                                className="px-1.5 py-0.5 text-xs font-bold rounded-full text-white"
                                style={{backgroundColor: '#FDA811'}}
                              >
                                {subChild.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}