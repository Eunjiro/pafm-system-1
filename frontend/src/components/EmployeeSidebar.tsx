"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  FiMenu, FiX, FiChevronDown, FiChevronRight
} from "react-icons/fi"
import { 
  MdDashboard, MdAssignment, 
  MdLocalHospital, MdAccountBox,
  MdPending, MdRateReview, MdCheckCircle, MdCancel
} from "react-icons/md"
import { GiCoffin } from "react-icons/gi"
import { FiAward, FiBarChart } from "react-icons/fi"
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

export default function EmployeeSidebar({ isCollapsed, onToggle }: EmployeeSidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['death-registration'])

  // Enhanced sidebar items with death registration submodules
  const sidebarItems: SidebarItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/employee",
      icon: MdDashboard
    },
    {
      id: "death-registration",
      label: "Death Registrations",
      icon: MdLocalHospital,
      children: [
        {
          id: "all-registrations",
          label: "All Registrations",
          href: "/employee/death-registrations",
          icon: MdAssignment
        },
        {
          id: "pending-registrations", 
          label: "Pending",
          href: "/employee/death-registrations/pending",
          icon: MdPending
        },
        {
          id: "under-review-registrations",
          label: "Under Review", 
          href: "/employee/death-registrations/under-review",
          icon: MdRateReview
        },
        {
          id: "approved-registrations",
          label: "Approved",
          href: "/employee/death-registrations/approved",
          icon: MdCheckCircle
        },
        {
          id: "completed-registrations",
          label: "Completed",
          href: "/employee/death-registrations/completed",
          icon: MdCheckCircle
        },
        {
          id: "delayed-registrations",
          label: "Delayed Applications",
          href: "/employee/death-registrations/delayed",
          icon: MdCancel
        }
      ]
    },
    {
      id: "burial-permits",
      label: "Burial Permits",
      href: "/employee/burial-permits",
      icon: GiCoffin
    },
    {
      id: "certificates",
      label: "Certificates",
      href: "/employee/certificates",
      icon: FiAward
    },
    {
      id: "tasks",
      label: "My Tasks",
      href: "/employee/tasks",
      icon: MdAssignment
    },
    {
      id: "reports",
      label: "Reports",
      href: "/employee/reports",
      icon: FiBarChart
    },
    {
      id: "profile",
      label: "My Profile",
      href: "/employee/profile",
      icon: MdAccountBox
    }
  ]

  const isActive = (href?: string) => {
    if (!href) return false
    const cleanHref = href.split('?')[0] // Remove query params for comparison
    if (cleanHref === '/employee') {
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
            <h2 className="text-lg font-semibold text-gray-800">Employee Portal</h2>
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
                className={`group relative flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 overflow-hidden ${
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
                
                {/* Simple arrow for active state only */}
                {isActive(item.href) && !isCollapsed && (
                  <div className="relative z-10">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
                
                {/* Active indicator dot for collapsed state */}
                {isActive(item.href) && isCollapsed && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            )}
            
            {/* Children Items */}
            {item.children && !isCollapsed && expandedItems.includes(item.id) && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.href || '#'}
                    prefetch={true}
                    className={`group relative flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(child.href)
                        ? 'text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={isActive(child.href) 
                      ? {background: 'linear-gradient(135deg, #FDA811 0%, #e6970f 100%)'} 
                      : {}
                    }
                  >
                    {/* Hover background */}
                    {!isActive(child.href) && (
                      <div className="absolute inset-0 bg-gray-50 rounded-lg transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                    )}
                    
                    {/* Icon */}
                    <div className={`relative z-10 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                      isActive(child.href) 
                        ? '' 
                        : 'group-hover:bg-white group-hover:shadow-sm'
                    }`}>
                      <child.icon size={14} className={`transition-colors duration-200 ${
                        isActive(child.href) 
                          ? 'text-white' 
                          : 'group-hover:text-gray-600'
                      }`} />
                    </div>
                    
                    <div className="relative z-10 ml-2 flex-1">
                      <span className={`text-xs font-medium transition-all duration-200 ${
                        isActive(child.href) 
                          ? 'text-white' 
                          : 'group-hover:text-gray-700'
                      }`}>
                        {child.label}
                      </span>
                    </div>
                    
                    {/* Active indicator */}
                    {isActive(child.href) && (
                      <div className="relative z-10">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      
      {/* Bottom accent */}
      <div className="p-4">
        <div className="w-full h-0.5 rounded-full" style={{backgroundColor: '#4CAF50', opacity: 0.3}}></div>
      </div>
    </div>
  )
}