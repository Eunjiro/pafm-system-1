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
    // Fetch dashboard statistics from backend
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard-stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }
        
        const data = await response.json()
        setStats(data.stats || [])
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setStats([])
      } finally {
        setLoading(false)
      }
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