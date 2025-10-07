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
  
  // MODULE 1: DEATH REGISTRATION
  {
    id: "death-registration",
    label: "Death Registration",
    icon: MdLocalHospital,
    children: [
      {
        id: "regular-registration",
        label: "Regular Registration",
        icon: FiFileText,
        children: [
          { id: "regular-submit", label: "New Registration", href: "/admin/death-registration/regular/new", icon: FiEdit3 },
          { id: "regular-pending", label: "Pending Verification", href: "/admin/death-registration/regular/pending", icon: FiClock, badge: "12" },
          { id: "regular-payment", label: "Payment Orders", href: "/admin/death-registration/regular/payment", icon: FiDollarSign },
          { id: "regular-pickup", label: "For Pickup", href: "/admin/death-registration/regular/pickup", icon: FiCheckCircle },
          { id: "regular-all", label: "All Regular", href: "/admin/death-registration/regular", icon: FiEye }
        ]
      },
      {
        id: "delayed-registration",
        label: "Delayed Registration",
        icon: FiClock,
        children: [
          { id: "delayed-submit", label: "New Delayed", href: "/admin/death-registration/delayed/new", icon: FiEdit3 },
          { id: "delayed-review", label: "Document Review", href: "/admin/death-registration/delayed/review", icon: FiSearch, badge: "5" },
          { id: "delayed-processing", label: "Processing (11 days)", href: "/admin/death-registration/delayed/processing", icon: FiCalendar },
          { id: "delayed-pickup", label: "For Pickup", href: "/admin/death-registration/delayed/pickup", icon: FiCheckCircle },
          { id: "delayed-all", label: "All Delayed", href: "/admin/death-registration/delayed", icon: FiEye }
        ]
      },
      { id: "registration-reports", label: "Registration Reports", href: "/admin/death-registration/reports", icon: FiBarChart }
    ]
  },

  // MODULE 2: PERMIT REQUESTS
  {
    id: "permits",
    label: "Permit Management",
    icon: MdAssignment,
    children: [
      {
        id: "burial-permits",
        label: "Burial Permits",
        icon: GiCoffin,
        children: [
          { id: "burial-new", label: "New Applications", href: "/admin/permits/burial/new", icon: FiEdit3 },
          { id: "burial-review", label: "Pending Review", href: "/admin/permits/burial/review", icon: FiSearch, badge: "8" },
          { id: "burial-payment", label: "Payment Orders", href: "/admin/permits/burial/payment", icon: FiDollarSign },
          { id: "burial-issued", label: "Issued Permits", href: "/admin/permits/burial/issued", icon: FiCheckCircle },
          { id: "burial-all", label: "All Burial Permits", href: "/admin/burial-permits", icon: FiEye }
        ]
      },
      {
        id: "exhumation-permits",
        label: "Exhumation Permits",
        icon: GiTombstone,
        children: [
          { id: "exhumation-new", label: "New Applications", href: "/admin/permits/exhumation/new", icon: FiEdit3 },
          { id: "exhumation-review", label: "Pending Review", href: "/admin/permits/exhumation/review", icon: FiSearch, badge: "2" },
          { id: "exhumation-issued", label: "Issued Permits", href: "/admin/permits/exhumation/issued", icon: FiCheckCircle },
          { id: "exhumation-all", label: "All Exhumations", href: "/admin/permits/exhumation", icon: FiEye }
        ]
      },
      {
        id: "cremation-permits",
        label: "Cremation Permits",
        icon: AiFillFire,
        children: [
          { id: "cremation-new", label: "New Applications", href: "/admin/permits/cremation/new", icon: FiEdit3 },
          { id: "cremation-review", label: "Pending Review", href: "/admin/permits/cremation/review", icon: FiSearch, badge: "3" },
          { id: "cremation-issued", label: "Issued Permits", href: "/admin/permits/cremation/issued", icon: FiCheckCircle },
          { id: "cremation-all", label: "All Cremations", href: "/admin/permits/cremation", icon: FiEye }
        ]
      },
      { id: "permit-reports", label: "Permit Reports", href: "/admin/permits/reports", icon: FiBarChart }
    ]
  },

  // MODULE 3: DEATH CERTIFICATE REQUEST & ISSUANCE
  {
    id: "certificates",
    label: "Certificate Requests",
    icon: FiAward,
    children: [
      { id: "cert-new", label: "New Requests", href: "/admin/certificates/new", icon: FiEdit3 },
      { id: "cert-validation", label: "Identity Validation", href: "/admin/certificates/validation", icon: MdVerifiedUser, badge: "7" },
      { id: "cert-payment", label: "Payment Orders", href: "/admin/certificates/payment", icon: FiDollarSign },
      { id: "cert-printing", label: "Print Queue", href: "/admin/certificates/printing", icon: MdPrint },
      { id: "cert-pickup", label: "Ready for Pickup", href: "/admin/certificates/pickup", icon: FiCheckCircle, badge: "15" },
      { id: "cert-claimed", label: "Claimed Certificates", href: "/admin/certificates/claimed", icon: FiArchive },
      { id: "cert-reports", label: "Certificate Reports", href: "/admin/certificates/reports", icon: FiBarChart }
    ]
  },

  // MODULE 4: CEMETERY PLOT & AI MAPPING
  {
    id: "cemetery",
    label: "Cemetery Management",
    icon: MdLocationOn,
    children: [
      {
        id: "plot-mapping",
        label: "Digital Mapping",
        icon: FiMap,
        children: [
          { id: "interactive-map", label: "Interactive Map", href: "/admin/cemetery/map", icon: FiMap },
          { id: "plot-search", label: "Plot Search", href: "/admin/cemetery/search", icon: FiSearch },
          { id: "ai-locator", label: "AI Grave Locator", href: "/admin/cemetery/ai-locator", icon: MdSecurity },
          { id: "map-layers", label: "GIS Map Layers", href: "/admin/cemetery/layers", icon: FiSettings }
        ]
      },
      {
        id: "plot-management",
        label: "Plot Management",
        icon: MdLocationOn,
        children: [
          { id: "plot-status", label: "Plot Status", href: "/admin/cemetery/status", icon: FiEye },
          { id: "plot-assignments", label: "Assignments", href: "/admin/cemetery/assignments", icon: MdAssignment },
          { id: "plot-reservations", label: "Reservations", href: "/admin/cemetery/reservations", icon: FiCalendar },
          { id: "plot-history", label: "Assignment History", href: "/admin/cemetery/history", icon: MdHistory }
        ]
      },
      { id: "cemetery-sections", label: "Cemetery Sections", href: "/admin/cemetery/sections", icon: FiSettings },
      { id: "cemetery-reports", label: "Cemetery Reports", href: "/admin/cemetery/reports", icon: FiBarChart }
    ]
  },

  // PAYMENT MANAGEMENT
  {
    id: "payments",
    label: "Payment Management",
    icon: FiDollarSign,
    children: [
      { id: "payment-orders", label: "Payment Orders", href: "/admin/payments/orders", icon: FiFileText },
      { id: "payment-confirmation", label: "Proof Verification", href: "/admin/payments/confirmation", icon: FiCheckCircle, badge: "9" },
      { id: "or-management", label: "OR Management", href: "/admin/payments/receipts", icon: MdPayment },
      { id: "fee-structure", label: "Fee Structure", href: "/admin/payments/fees", icon: FiSettings },
      { id: "payment-reports", label: "Financial Reports", href: "/admin/payments/reports", icon: FiTrendingUp }
    ]
  },

  // USER MANAGEMENT
  {
    id: "users",
    label: "User Management",
    icon: FiUsers,
    children: [
      { id: "employees", label: "Civil Registry Staff", href: "/admin/users/employees", icon: MdAccountBox },
      { id: "citizens", label: "Citizen Accounts", href: "/admin/users/citizens", icon: FiUser },
      { id: "user-roles", label: "Role Management", href: "/admin/users/roles", icon: FiShield },
      { id: "access-logs", label: "Access Logs", href: "/admin/users/logs", icon: FiClipboard }
    ]
  },

  // SYSTEM ADMINISTRATION
  {
    id: "system",
    label: "System Settings",
    icon: FiSettings,
    children: [
      { id: "document-types", label: "Document Requirements", href: "/admin/system/documents", icon: FiFileText },
      { id: "workflow-config", label: "Workflow Configuration", href: "/admin/system/workflow", icon: FiSettings },
      { id: "audit-logs", label: "Audit Logs", href: "/admin/system/audit", icon: FiClipboard },
      { id: "notifications", label: "Notification Settings", href: "/admin/system/notifications", icon: MdNotifications },
      { id: "system-backup", label: "Backup & Archive", href: "/admin/system/backup", icon: MdBackup },
      { id: "system-reports", label: "System Reports", href: "/admin/system/reports", icon: FiDatabase }
    ]
  }
]

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