"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiCalendar, FiMapPin, FiAlertCircle, FiCheckCircle, FiClock, FiUsers, FiTrendingUp, FiActivity, FiDollarSign, FiRefreshCw, FiArrowRight } from 'react-icons/fi'
import { MdWaterDrop, MdOutlineStadium, MdBuild } from 'react-icons/md'

interface DashboardStats {
  amenityReservations: {
    total: number
    upcoming: number
    pending: number
  }
  venueBookings: {
    total: number
    upcoming: number
    pending: number
  }
  maintenance: {
    open: number
    inProgress: number
  }
}

interface Amenity {
  id: number
  name: string
  type: string
  capacity: number
  hourlyRate: number
  dailyRate: number
  isActive: boolean
}

interface Reservation {
  id: number
  bookingCode: string
  requesterName: string
  reservationDate: string
  startTime: string
  endTime: string
  status: string
  paymentStatus: string
  totalAmount: number
  amenity: {
    name: string
    type: string
  }
}

export default function ParksRecreationAdmin() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const statsRes = await fetch('/api/parks-recreation/dashboard/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateToSubmodule = (path: string) => {
    router.push(path)
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin text-[#4CAF50] mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parks & Recreation Management</h1>
          <p className="text-gray-600 mt-1">Comprehensive dashboard for managing amenities, venues, and park maintenance</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] transition-colors flex items-center gap-2"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Summary Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MdWaterDrop className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{stats.amenityReservations.total}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Total Reservations</h3>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {stats.amenityReservations.upcoming} upcoming
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                  {stats.amenityReservations.pending} pending
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <MdOutlineStadium className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{stats.venueBookings.total}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Total Venue Rentals</h3>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                  {stats.venueBookings.upcoming} upcoming
                </span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                  {stats.venueBookings.pending} pending
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <MdBuild className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-gray-800">{stats.maintenance.open + stats.maintenance.inProgress}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Maintenance Requests</h3>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                  {stats.maintenance.open} open
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {stats.maintenance.inProgress} in progress
                </span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Water Park Amenity Reservations */}
            <Link
              href="/admin/parks-recreation/amenity-reservations"
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-[#4CAF50] hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <MdWaterDrop className="w-6 h-6 text-blue-600" />
                </div>
                <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#4CAF50] transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Amenity Reservations</h3>
              <p className="text-sm text-gray-600">Manage reservations for cottages, tables, rooms, pool areas, and pavilions</p>
            </Link>

            {/* Venue Rentals */}
            <Link
              href="/admin/parks-recreation/venue-rentals"
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-[#4CAF50] hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <MdOutlineStadium className="w-6 h-6 text-purple-600" />
                </div>
                <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#4CAF50] transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Venue Rentals</h3>
              <p className="text-sm text-gray-600">Handle bookings for picnic grounds, amphitheaters, courts, and event halls</p>
            </Link>

            {/* Park Maintenance Requests */}
            <Link
              href="/admin/parks-recreation/maintenance-requests"
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-[#4CAF50] hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                  <MdBuild className="w-6 h-6 text-orange-600" />
                </div>
                <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#4CAF50] transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Maintenance Requests</h3>
              <p className="text-sm text-gray-600">Track and resolve park maintenance issues reported by citizens</p>
            </Link>
          </div>

          {/* Utilization & Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilization by Submodule */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5 text-[#4CAF50]" />
                Utilization by Submodule
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Amenity Reservations</span>
                    <span className="text-sm font-bold text-blue-600">
                      {stats.amenityReservations.total > 0 
                        ? Math.round((stats.amenityReservations.upcoming / stats.amenityReservations.total) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${stats.amenityReservations.total > 0 ? (stats.amenityReservations.upcoming / stats.amenityReservations.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Venue Bookings</span>
                    <span className="text-sm font-bold text-purple-600">
                      {stats.venueBookings.total > 0 
                        ? Math.round((stats.venueBookings.upcoming / stats.venueBookings.total) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all" 
                      style={{ width: `${stats.venueBookings.total > 0 ? (stats.venueBookings.upcoming / stats.venueBookings.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Maintenance (Completion Rate)</span>
                    <span className="text-sm font-bold text-orange-600">
                      {(stats.maintenance.open + stats.maintenance.inProgress) > 0 
                        ? Math.round((stats.maintenance.inProgress / (stats.maintenance.open + stats.maintenance.inProgress)) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all" 
                      style={{ width: `${(stats.maintenance.open + stats.maintenance.inProgress) > 0 ? (stats.maintenance.inProgress / (stats.maintenance.open + stats.maintenance.inProgress)) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiActivity className="w-5 h-5 text-[#4CAF50]" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <FiCheckCircle className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New reservation approved</p>
                    <p className="text-xs text-gray-600">Family Cottage #1 - Maria Santos</p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <FiMapPin className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Venue booking confirmed</p>
                    <p className="text-xs text-gray-600">Grand Pavilion - Barangay Anniversary</p>
                    <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <FiAlertCircle className="text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Maintenance request logged</p>
                    <p className="text-xs text-gray-600">Damaged bench at San Jose Memorial Park</p>
                    <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FiDollarSign className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Payment received</p>
                    <p className="text-xs text-gray-600">Pool Area reservation - Juan Dela Cruz</p>
                    <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
