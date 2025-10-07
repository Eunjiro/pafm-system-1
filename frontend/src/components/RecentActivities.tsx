"use client"

import { useEffect, useState } from "react"
import { 
  FiFileText, FiUsers, FiDollarSign, FiAward, FiClipboard
} from "react-icons/fi"
import { MdAssignment } from "react-icons/md"
import { IconType } from "react-icons"

interface Activity {
  id: string
  type: 'registration' | 'permit' | 'certificate' | 'payment' | 'user'
  action: string
  user: string
  details: string
  timestamp: string
  status: 'success' | 'pending' | 'error'
}

interface RecentActivitiesProps {
  className?: string
}

export default function RecentActivities({ className = "" }: RecentActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      // Mock data - replace with actual API call
      const mockActivities: Activity[] = [
        {
          id: "1",
          type: "registration",
          action: "Death Registration Approved",
          user: "Maria Santos",
          details: "Regular death registration for Juan Dela Cruz",
          timestamp: "2 minutes ago",
          status: "success"
        },
        {
          id: "2",
          type: "permit",
          action: "Burial Permit Requested",
          user: "Jose Garcia",
          details: "Burial permit for Manila Memorial Park",
          timestamp: "15 minutes ago",
          status: "pending"
        },
        {
          id: "3",
          type: "payment",
          action: "Payment Confirmed",
          user: "Ana Rodriguez",
          details: "₱50 for death certificate request",
          timestamp: "32 minutes ago",
          status: "success"
        },
        {
          id: "4",
          type: "certificate",
          action: "Certificate Ready",
          user: "Carlos Mendoza",
          details: "Death certificate ready for pickup",
          timestamp: "1 hour ago",
          status: "success"
        },
        {
          id: "5",
          type: "user",
          action: "New Employee Added",
          user: "Admin User",
          details: "Added new civil registry staff member",
          timestamp: "2 hours ago",
          status: "success"
        },
        {
          id: "6",
          type: "registration",
          action: "Documentation Issue",
          user: "Pedro Reyes",
          details: "Missing required documents for delayed registration",
          timestamp: "3 hours ago",
          status: "error"
        }
      ]

      setTimeout(() => {
        setActivities(mockActivities)
        setLoading(false)
      }, 800)
    }

    fetchActivities()
  }, [])

  const getActivityIcon = (type: Activity['type']): IconType => {
    switch (type) {
      case 'registration': return FiClipboard
      case 'permit': return MdAssignment
      case 'certificate': return FiAward
      case 'payment': return FiDollarSign
      case 'user': return FiUsers
      default: return FiFileText
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'registration': return '#4CAF50'
      case 'permit': return '#4A90E2'
      case 'certificate': return '#FDA811'
      case 'payment': return '#9C27B0'
      case 'user': return '#FF5722'
      default: return '#757575'
    }
  }

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'success': return '#4CAF50'
      case 'pending': return '#FDA811'
      case 'error': return '#F44336'
      default: return '#757575'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        <button 
          className="text-sm text-white px-3 py-1 rounded hover:opacity-80"
          style={{backgroundColor: '#4CAF50'}}
        >
          View All
        </button>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: getActivityColor(activity.type) }}
            >
              {(() => {
                const IconComponent = getActivityIcon(activity.type)
                return <IconComponent size={16} />
              })()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.action}
                </p>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getStatusColor(activity.status) }}
                  ></div>
                  <span className="text-xs text-gray-500">{activity.timestamp}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 truncate">{activity.details}</p>
              <p className="text-xs text-gray-500">by {activity.user}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}