"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  FiUsers, FiSettings, FiClipboard, 
  FiChevronRight, FiChevronDown, FiMenu, FiX, FiMap,
  FiDollarSign, FiTrendingUp, FiAward, FiBarChart,
  FiDroplet, FiSlash, FiFileText, FiPackage, FiDatabase,
  FiTruck, FiShoppingCart, FiTool, FiHome, FiCalendar,
  FiGrid, FiClock, FiActivity
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

interface SidebarSection {
  id: string
  title: string
  items: SidebarItem[]
}

const sidebarSections: SidebarSection[] = [
  // MAIN SECTION
  {
    id: "main",
    title: "",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/admin",
        icon: MdDashboard
      }
    ]
  },
  
  // MICROSERVICES SECTION
  {
    id: "services",
    title: "SERVICES",
    items: [
      // MICROSERVICE 1: CEMETERY & BURIAL MANAGEMENT
      {
        id: "cemetery-burial",
        label: "Cemetery & Burial",
        icon: GiTombstone,
        children: [
          { id: "cemetery-dashboard", label: "Dashboard", href: "/admin/cemetery-burial", icon: MdDashboard },
          { id: "death-registration", label: "Death Registrations", href: "/admin/death-registration", icon: MdLocalHospital },
          { id: "permits-overview", label: "All Permits", href: "/admin/permits", icon: MdAssignment },
          { id: "burial-permits", label: "Burial Permits", href: "/admin/permits/burial", icon: FiUsers },
          { id: "exhumation-permits", label: "Exhumation Permits", href: "/admin/permits/exhumation", icon: FiClipboard },
          { id: "cremation-permits", label: "Cremation Permits", href: "/admin/permits/cremation", icon: FiTrendingUp },
          { id: "certificates", label: "Certificate Requests", href: "/admin/certificates", icon: FiAward },
          { id: "cemetery-creation", label: "Create Cemetery", href: "/admin/cemetery-map", icon: FiMap },
          { id: "cemetery-management", label: "Manage Cemeteries", href: "/admin/cemetery", icon: GiTombstone },
          { id: "cemetery-plots", label: "Plot Management", href: "/admin/cemetery/plots", icon: MdLocationOn }
        ]
      },

      // MICROSERVICE 2: WATER SUPPLY & DRAINAGE REQUEST
      {
        id: "water-drainage",
        label: "Water & Drainage",
        icon: FiDroplet,
    children: [
      { id: "water-supply", label: "Water Supply Management", href: "/admin/water-supply", icon: FiDroplet },
      { id: "drainage-management", label: "Drainage Management", href: "/admin/drainage", icon: FiSlash },
      { id: "water-issues", label: "Water Issue Reports", href: "/admin/water-issues", icon: FiTool },
      { id: "barangay-coverage", label: "Barangay Management", href: "/admin/barangays", icon: MdLocationOn }
    ]
  },

      // MICROSERVICE 3: ASSETS INVENTORY & WAREHOUSE MANAGEMENT
      {
        id: "assets-inventory",
        label: "Assets & Inventory",
        icon: FiPackage,
    children: [
      { id: "asset-dashboard", label: "Dashboard", href: "/admin/asset-inventory", icon: MdDashboard },
      { id: "receiving", label: "Receiving of Supplies", href: "/admin/asset-inventory/receiving", icon: FiTruck },
      { id: "storage", label: "Storage & Processing", href: "/admin/asset-inventory/storage", icon: FiDatabase },
      { id: "ris", label: "RIS Management", href: "/admin/asset-inventory/ris", icon: FiFileText },
      { id: "issuance", label: "Asset Issuance", href: "/admin/asset-inventory/issuance", icon: FiShoppingCart },
      { id: "physical-count", label: "Physical Inventory", href: "/admin/asset-inventory/physical-count", icon: FiClipboard },
      { id: "inventory-reports", label: "Reports & Monitoring", href: "/admin/asset-inventory/reports", icon: FiBarChart }
    ]
  },

      // MICROSERVICE 4: FACILITY MANAGEMENT
      {
        id: "facility-management",
        label: "Facility Management",
        icon: FiHome,
    children: [
      { id: "facility-booking", label: "Facility Booking", href: "/admin/facilities/booking", icon: FiCalendar },
      { id: "facility-maintenance", label: "Facility Maintenance", href: "/admin/facilities/maintenance", icon: FiSettings },
      { id: "facility-resources", label: "Resource Management", href: "/admin/facilities/resources", icon: FiGrid },
      { id: "facility-schedules", label: "Event Scheduling", href: "/admin/facilities/schedules", icon: FiClock },
      { id: "facility-reports", label: "Facility Reports", href: "/admin/facilities/reports", icon: FiBarChart }
        ]
      }
    ]
  },

  // ADMINISTRATION SECTION
  {
    id: "administration",
    title: "ADMINISTRATION",
    items: [
      {
        id: "users",
        label: "User Management",
        href: "/admin/users",
        icon: FiUsers
      },
      {
        id: "system",
        label: "System Settings",
        icon: FiSettings,
    children: [
      { id: "service-health", label: "Service Health Monitor", href: "/admin/system/health", icon: FiActivity },
      { id: "audit-logs", label: "Audit Logs", href: "/admin/system/audit-logs", icon: FiClipboard },
      { id: "fee-management", label: "Fee Management", href: "/admin/system/fees", icon: FiDollarSign },
        { id: "system-settings", label: "System Settings", href: "/admin/system/settings", icon: FiSettings }
        ]
      }
    ]
  },

  // ANALYTICS SECTION
  {
    id: "analytics",
    title: "ANALYTICS & REPORTING",
    items: [
      {
        id: "reports",
        label: "Reports & Analytics",
        icon: FiBarChart,
        children: [
          { id: "cross-service-analytics", label: "Cross-Service Analytics", href: "/admin/reports/cross-service", icon: FiTrendingUp },
          { id: "service-performance", label: "Service Performance", href: "/admin/reports/performance", icon: FiActivity },
          { id: "financial-reports", label: "Financial Reports", href: "/admin/reports/financial", icon: FiDollarSign },
          { id: "operational-reports", label: "Operational Reports", href: "/admin/reports/operational", icon: FiFileText }
        ]
      }
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

  const isParentActive = (item: SidebarItem): boolean => {
    if (item.href && isActive(item.href)) return true
    if (item.children) {
      return item.children.some(child => {
        if (child.href && isActive(child.href)) return true
        if (child.children) {
          return child.children.some(grandchild => isActive(grandchild.href))
        }
        return false
      })
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
    const itemsToExpand: string[] = []
    
    sidebarSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          // Check if any direct child is active
          const hasActiveChild = item.children.some(child => {
            if (child.href && isActive(child.href)) return true
            if (child.children) {
              // Check if any grandchild is active
              const hasActiveGrandchild = child.children.some(grandchild => isActive(grandchild.href))
              if (hasActiveGrandchild) {
                itemsToExpand.push(child.id) // Also expand the child that has active grandchild
              }
              return hasActiveGrandchild
            }
            return false
          })
          
          if (hasActiveChild) {
            itemsToExpand.push(item.id)
          }
        }
      })
    })
    
    // Update expanded items if there are items to expand
    if (itemsToExpand.length > 0) {
      setExpandedItems(prev => {
        const newExpanded = [...prev]
        itemsToExpand.forEach(id => {
          if (!newExpanded.includes(id)) {
            newExpanded.push(id)
          }
        })
        return newExpanded
      })
    }
  }, [pathname])

  return (
    <div className={`bg-gradient-to-b from-gray-50 to-white shadow-xl transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-screen border-r border-gray-200 relative flex flex-col`}>
      
      {/* Header */}
      <div className="px-4 py-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex-1">
              <h2 className="text-lg font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                Admin Portal
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">PAFM System</p>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg group"
            style={{background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white'}}
          >
            {isCollapsed ? (
              <FiMenu size={18} className="group-hover:rotate-180 transition-transform duration-300" />
            ) : (
              <FiX size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {sidebarSections.map((section, sectionIndex) => (
          <div key={section.id} className="mb-6">
            {/* Section Header */}
            {!isCollapsed && section.title && (
              <div className="px-3 mb-3 mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <h3 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase whitespace-nowrap">
                    {section.title}
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>
              </div>
            )}
            
            {/* Collapsed Section Separator */}
            {isCollapsed && sectionIndex > 0 && (
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-3"></div>
            )}
            
            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => (
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
              <div className="mt-1 ml-4 pl-3 space-y-1 border-l-2 border-green-500/30 relative">
                {/* Left border indicator for open menu */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500/50 via-green-500/30 to-transparent"></div>
                {item.children.map((child) => (
                  <div key={child.id}>
                    {/* Child Item - Can be either a link or expandable parent */}
                    {child.children ? (
                      <button
                        onClick={() => toggleExpanded(child.id)}
                        className={`group relative flex items-center text-start w-full px-3 py-2 rounded-lg transition-all duration-200 overflow-hidden ${
                          isParentActive(child)
                            ? 'text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                        style={isParentActive(child) 
                          ? {background: 'linear-gradient(135deg, #FDA811 0%, #E6951A 100%)'} 
                          : {}
                        }
                      >
                        {/* Animated background for hover - only show when not active */}
                        {!isParentActive(child) && (
                          <div className="absolute inset-0 bg-gray-50 rounded-lg transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                        )}
                        
                        {/* Left accent bar */}
                        <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 rounded-r-full transition-all duration-200 ${
                          isParentActive(child) 
                            ? 'h-4 bg-white' 
                            : 'h-0 bg-gray-400 group-hover:h-3'
                        }`}></div>
                        
                        {/* Icon */}
                        <div className={`relative z-10 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 ${
                          isParentActive(child) 
                            ? '' 
                            : 'group-hover:bg-white group-hover:shadow-sm'
                        }`}>
                          <child.icon size={14} className={`transition-colors duration-200 ${
                            isParentActive(child) 
                              ? 'text-white' 
                              : 'group-hover:text-gray-700'
                          }`} />
                        </div>
                        
                        <div className="relative z-10 ml-2 flex-1">
                          <span className={`font-medium text-xs transition-all duration-200 ${
                            isParentActive(child) 
                              ? 'text-white' 
                              : 'group-hover:text-gray-800'
                          }`}>
                            {child.label}
                          </span>
                        </div>
                        
                        {child.badge && (
                          <span 
                            className="relative z-10 px-1.5 py-0.5 text-xs font-bold rounded-full text-white mr-1"
                            style={{backgroundColor: '#FDA811'}}
                          >
                            {child.badge}
                          </span>
                        )}
                        
                        {/* Expand/Collapse Arrow */}
                        <div className="relative z-10">
                          {expandedItems.includes(child.id) ? (
                            <FiChevronDown className={`w-3 h-3 transition-colors duration-200 ${
                              isParentActive(child) ? 'text-white' : 'text-gray-400'
                            }`} />
                          ) : (
                            <FiChevronRight className={`w-3 h-3 transition-colors duration-200 ${
                              isParentActive(child) ? 'text-white' : 'text-gray-400'
                            }`} />
                          )}
                        </div>
                      </button>
                    ) : (
                      <Link
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
                    )}

                    {/* Sub-sub Items (Third Level) */}
                    {child.children && expandedItems.includes(child.id) && (
                      <div className="mt-1 ml-6 pl-3 space-y-1 border-l-2 border-orange-500/30 relative">
                        {/* Left border indicator for open submenu */}
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500/50 via-orange-500/30 to-transparent"></div>
                        {child.children.map((grandchild) => (
                          <Link
                            key={grandchild.id}
                            href={grandchild.href || '#'}
                            prefetch={true}
                            className={`group relative flex items-center px-3 py-1.5 rounded-md transition-all duration-200 overflow-hidden ${
                              isActive(grandchild.href)
                                ? 'text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                            style={isActive(grandchild.href) 
                              ? {background: 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)'} 
                              : {}
                            }
                          >
                            {/* Animated background for hover - only show when not active */}
                            {!isActive(grandchild.href) && (
                              <div className="absolute inset-0 bg-gray-50 rounded-md transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                            )}
                            
                            {/* Left accent bar */}
                            <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 rounded-r-full transition-all duration-200 ${
                              isActive(grandchild.href) 
                                ? 'h-3 bg-white' 
                                : 'h-0 bg-gray-400 group-hover:h-2'
                            }`}></div>
                            
                            {/* Icon */}
                            <div className={`relative z-10 w-5 h-5 rounded-sm flex items-center justify-center transition-all duration-200 ${
                              isActive(grandchild.href) 
                                ? '' 
                                : 'group-hover:bg-white group-hover:shadow-sm'
                            }`}>
                              <grandchild.icon size={12} className={`transition-colors duration-200 ${
                                isActive(grandchild.href) 
                                  ? 'text-white' 
                                  : 'group-hover:text-gray-700'
                              }`} />
                            </div>
                            
                            <div className="relative z-10 ml-2 flex-1">
                              <span className={`font-medium text-xs transition-all duration-200 ${
                                isActive(grandchild.href) 
                                  ? 'text-white' 
                                  : 'group-hover:text-gray-700'
                              }`}>
                                {grandchild.label}
                              </span>
                            </div>
                            
                            {grandchild.badge && (
                              <span 
                                className="relative z-10 px-1 py-0.5 text-xs font-bold rounded-full text-white"
                                style={{backgroundColor: '#4CAF50'}}
                              >
                                {grandchild.badge}
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
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}