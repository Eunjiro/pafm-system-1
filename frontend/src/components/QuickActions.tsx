"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  FiFileText, FiUsers, FiShield, FiTrendingUp,
  FiMap, FiActivity, FiSettings, FiDatabase, FiArrowRight
} from "react-icons/fi"
import { IconType } from "react-icons"

interface QuickAction {
  id: string
  label: string
  description: string
  href: string
  icon: IconType
  color: string
  bgColor: string
}

interface QuickActionsProps {
  className?: string
}

export default function QuickActions({ className = "" }: QuickActionsProps) {
  const [isNavigating, setIsNavigating] = useState(false)

  const handleNavigation = () => {
    setIsNavigating(true)
    setTimeout(() => setIsNavigating(false), 300)
  }
  const actions: QuickAction[] = [
    {
      id: "death-registrations",
      label: "Death Registrations",
      description: "Manage and oversee all death registration processes with admin privileges",
      href: "/admin/death-registration",
      icon: FiFileText,
      color: "#4CAF50",
      bgColor: "linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)"
    },
    {
      id: "cemetery-management",
      label: "Cemetery Management",
      description: "Oversee cemetery plots, sections, and mapping operations",
      href: "/admin/cemetery-map",
      icon: FiMap,
      color: "#4A90E2",
      bgColor: "linear-gradient(135deg, #E3F2FD 0%, #E8F4FD 100%)"
    },
    {
      id: "user-management",
      label: "User Management",
      description: "Manage employee accounts, roles, and system permissions",
      href: "/admin/users",
      icon: FiUsers,
      color: "#FDA811",
      bgColor: "linear-gradient(135deg, #FFF8E1 0%, #FFFBF0 100%)"
    },
    {
      id: "permits-oversight",
      label: "Permits & Certificates",
      description: "Administrative oversight of burial permits and death certificates",
      href: "/admin/permits",
      icon: FiShield,
      color: "#9C27B0",
      bgColor: "linear-gradient(135deg, #F3E5F5 0%, #F8F0FB 100%)"
    },
    {
      id: "system-analytics",
      label: "System Analytics",
      description: "View comprehensive reports and system performance metrics",
      href: "/admin/analytics",
      icon: FiTrendingUp,
      color: "#FF5722",
      bgColor: "linear-gradient(135deg, #FBE9E7 0%, #FFF2F0 100%)"
    },
    {
      id: "system-settings",
      label: "System Settings",
      description: "Configure system parameters and administrative controls",
      href: "/admin/settings",
      icon: FiSettings,
      color: "#607D8B",
      bgColor: "linear-gradient(135deg, #ECEFF1 0%, #F5F7FA 100%)"
    }
  ]

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-300 ${className}`}>
      <div className="flex items-center space-x-3 mb-8">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
          style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #4A90E2 100%)'
          }}
        >
          <div className="text-white">
            <FiActivity size={20} />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Quick Actions</h3>
          <p className="text-sm text-gray-500">Administrative controls & oversight</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            prefetch={true}
            onClick={handleNavigation}
            className="group block p-6 rounded-2xl border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden"
            style={{ 
              background: action.bgColor,
              borderColor: action.color + '20'
            }}
          >
            {/* Top gradient accent */}
            <div 
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: action.color }}
            />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: action.color }}
                >
                  <div className="text-white">
                    <action.icon size={24} />
                  </div>
                </div>
                <div className="opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                  <div style={{ color: action.color }}>
                    <FiArrowRight size={18} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 text-lg group-hover:text-gray-700 transition-colors duration-200">
                  {action.label}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {action.description}
                </p>
              </div>

              {/* Interactive hover effect */}
              <div className="mt-4 pt-4 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="flex items-center space-x-2 text-sm font-medium" style={{ color: action.color }}>
                  <span>Access Module</span>
                  <div className="transform group-hover:translate-x-1 transition-transform duration-200">
                    <FiArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}