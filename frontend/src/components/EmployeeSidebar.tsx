"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  FiUsers, FiSettings, FiFileText, FiClipboard, 
  FiChevronRight, FiChevronDown, FiMenu, FiX,
  FiUser, FiClock, FiCheckCircle,
  FiDollarSign, FiTrendingUp, FiAward, FiEye,
  FiEdit3, FiSearch, FiBarChart
} from "react-icons/fi"
import { 
  MdDashboard, MdAssignment, 
  MdLocalHospital, MdAccountBox
} from "react-icons/md"
import { GiCoffin } from "react-icons/gi"
import { IconType } from "react-icons"

interface SidebarItem {
  id: string
  label: string
  href?: string
  icon: IconType
  children?: SidebarItem[]
  badge?: string
}

interface EmployeeSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/employee",
    icon: MdDashboard
  },
  
  // Death Registration Management
  {
    id: "death-registration",
    label: "Death Registration",
    icon: MdLocalHospital,
    children: [
      { 
        id: "death-reg-pending", 
        label: "Pending Verification", 
        href: "/employee/death-registrations?filter=pending", 
        icon: FiClock, 
        badge: "12" 
      },
      { 
        id: "death-reg-processing", 
        label: "Processing", 
        href: "/employee/death-registrations?filter=processing", 
        icon: FiEdit3 
      },
      { 
        id: "death-reg-pickup", 
        label: "Ready for Pickup", 
        href: "/employee/death-registrations?filter=pickup", 
        icon: FiCheckCircle 
      },
      { 
        id: "death-reg-all", 
        label: "All Registrations", 
        href: "/employee/death-registrations", 
        icon: FiEye 
      }
    ]
  },

  // Burial Permits
  {
    id: "burial-permits",
    label: "Burial Permits",
    icon: GiCoffin,
    children: [
      { 
        id: "burial-pending", 
        label: "Pending Review", 
        href: "/employee/burial-permits?filter=pending", 
        icon: FiClock, 
        badge: "5" 
      },
      { 
        id: "burial-approved", 
        label: "Approved", 
        href: "/employee/burial-permits?filter=approved", 
        icon: FiCheckCircle 
      },
      { 
        id: "burial-all", 
        label: "All Permits", 
        href: "/employee/burial-permits", 
        icon: FiEye 
      }
    ]
  },

  // Certificate Requests
  {
    id: "certificates",
    label: "Certificate Requests",
    icon: FiAward,
    children: [
      { 
        id: "cert-validation", 
        label: "Identity Validation", 
        href: "/employee/certificates?filter=validation", 
        icon: FiUser, 
        badge: "8" 
      },
      { 
        id: "cert-processing", 
        label: "Processing", 
        href: "/employee/certificates?filter=processing", 
        icon: FiEdit3 
      },
      { 
        id: "cert-ready", 
        label: "Ready for Pickup", 
        href: "/employee/certificates?filter=ready", 
        icon: FiCheckCircle 
      },
      { 
        id: "cert-all", 
        label: "All Requests", 
        href: "/employee/certificates", 
        icon: FiEye 
      }
    ]
  },

  // Work Management
  {
    id: "tasks",
    label: "My Tasks",
    href: "/employee/tasks",
    icon: MdAssignment,
    badge: "3"
  },

  // Reports
  {
    id: "reports",
    label: "Reports",
    href: "/employee/reports",
    icon: FiBarChart
  },

  // Profile
  {
    id: "profile",
    label: "My Profile",
    href: "/employee/profile",
    icon: MdAccountBox
  }
]

export default function EmployeeSidebar({ isCollapsed, onToggle }: EmployeeSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['death-registration'])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (href: string) => {
    if (href === '/employee') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const isItemActive = item.href ? isActive(item.href) : false

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`
              w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg
              transition-colors duration-200 group
              ${isItemActive 
                ? 'bg-green-100 text-green-900 border-r-2 border-green-600' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }
              ${level > 0 ? 'ml-4' : ''}
            `}
          >
            <div className="flex items-center">
              <item.icon className={`
                ${isCollapsed ? 'mr-0' : 'mr-3'} 
                h-5 w-5 flex-shrink-0
                ${isItemActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'}
              `} />
              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center">
                {isExpanded ? (
                  <FiChevronDown className="h-4 w-4" />
                ) : (
                  <FiChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children!.map(child => renderSidebarItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <div key={item.id} className="mb-1">
        <Link
          href={item.href!}
          className={`
            flex items-center px-3 py-2 text-sm font-medium rounded-lg
            transition-colors duration-200 group
            ${isItemActive 
              ? 'bg-green-100 text-green-900 border-r-2 border-green-600' 
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
            ${level > 0 ? 'ml-4' : ''}
          `}
        >
          <item.icon className={`
            ${isCollapsed ? 'mr-0' : 'mr-3'} 
            h-5 w-5 flex-shrink-0
            ${isItemActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'}
          `} />
          {!isCollapsed && (
            <>
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </Link>
      </div>
    )
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">PAFM System</h2>
              <p className="text-xs text-gray-500">Employee Portal</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? <FiMenu className="h-5 w-5" /> : <FiX className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {sidebarItems.map(item => renderSidebarItem(item))}
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <FiUser className="h-4 w-4 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Employee</p>
              <p className="text-xs text-gray-500">Portal Access</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}