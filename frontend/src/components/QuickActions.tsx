"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  FiCheckCircle, FiUsers, FiDollarSign, FiBarChart,
  FiMap
} from "react-icons/fi"
import { MdAssignment } from "react-icons/md"
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
      id: "approve-registrations",
      label: "Approve Registrations",
      description: "Review and approve pending death registrations",
      href: "/admin/death-registration/pending",
      icon: FiCheckCircle,
      color: "#4CAF50",
      bgColor: "#E8F5E8"
    },
    {
      id: "process-permits",
      label: "Process Permits",
      description: "Review burial, cremation, and exhumation permits",
      href: "/admin/permits/pending",
      icon: MdAssignment,
      color: "#4A90E2",
      bgColor: "#E3F2FD"
    },
    {
      id: "confirm-payments",
      label: "Confirm Payments",
      description: "Verify payment receipts and update records",
      href: "/admin/payments/confirmation",
      icon: FiDollarSign,
      color: "#FDA811",
      bgColor: "#FFF8E1"
    },
    {
      id: "manage-plots",
      label: "Manage Cemetery Plots",
      description: "Update plot status and assignments",
      href: "/admin/cemetery/mapping",
      icon: FiMap,
      color: "#9C27B0",
      bgColor: "#F3E5F5"
    },
    {
      id: "user-accounts",
      label: "User Accounts",
      description: "Create and manage employee accounts",
      href: "/admin/users/employees",
      icon: FiUsers,
      color: "#FF5722",
      bgColor: "#FBE9E7"
    },
    {
      id: "system-reports",
      label: "Generate Reports",
      description: "Create financial and operational reports",
      href: "/admin/payments/reports",
      icon: FiBarChart,
      color: "#607D8B",
      bgColor: "#ECEFF1"
    }
  ]

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            prefetch={true}
            onClick={handleNavigation}
            className="block p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 group"
            style={{ backgroundColor: action.bgColor }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: action.color }}
              >
                <action.icon size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 group-hover:text-gray-700">
                  {action.label}
                </h4>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}