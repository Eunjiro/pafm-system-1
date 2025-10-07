"use client"

import { useEffect, useState } from "react"
import { 
  FiFileText, FiClock, FiMapPin,
  FiTrendingUp, FiTrendingDown,
} from "react-icons/fi"
import { MdLocalHospital, MdAssignment } from "react-icons/md"
import { IconType } from "react-icons"
import { FaPesoSign } from "react-icons/fa6"

interface StatCard {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
  icon: IconType
  color: string
}

interface DashboardStatsProps {
  className?: string
}

export default function DashboardStats({ className = "" }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch dashboard statistics
    const fetchStats = async () => {
      // Mock data - replace with actual API call
      const mockStats: StatCard[] = [
        {
          title: "Total Death Registrations",
          value: "1,247",
          change: "+12%",
          changeType: "increase",
          icon: MdLocalHospital,
          color: "#4CAF50"
        },
        {
          title: "Pending Verifications",
          value: "23",
          change: "-8%",
          changeType: "decrease",
          icon: FiClock,
          color: "#FDA811"
        },
        {
          title: "Active Permits",
          value: "456",
          change: "+5%",
          changeType: "increase",
          icon: MdAssignment,
          color: "#4A90E2"
        },
        {
          title: "Available Plots",
          value: "89",
          change: "-2%",
          changeType: "decrease",
          icon: FiMapPin,
          color: "#9C27B0"
        },
        {
          title: "Revenue This Month",
          value: "₱124,500",
          change: "+18%",
          changeType: "increase",
          icon: FaPesoSign,
          color: "#4CAF50"
        },
        {
          title: "Certificate Requests",
          value: "67",
          change: "+3%",
          changeType: "increase",
          icon: FiFileText,
          color: "#FF9800"
        }
      ]

      // Simulate loading delay
      setTimeout(() => {
        setStats(mockStats)
        setLoading(false)
      }, 1000)
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="w-12 h-6 bg-gray-200 rounded"></div>
            </div>
            <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: stat.color }}
            >
              <stat.icon size={24} />
            </div>
            <div className={`flex items-center text-sm font-medium ${
              stat.changeType === 'increase' ? 'text-green-600' : 
              stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {stat.changeType === 'increase' && <FiTrendingUp size={16} />}
              {stat.changeType === 'decrease' && <FiTrendingDown size={16} />}
              {stat.changeType === 'neutral' && <span>→</span>}
              <span className="ml-1">{stat.change}</span>
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  )
}