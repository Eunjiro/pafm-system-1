"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiHome, FiCalendar, FiUsers, FiBarChart2, FiCheckCircle, 
  FiXCircle, FiClock, FiAlertCircle, FiDollarSign, FiTrendingUp, 
  FiRefreshCw, FiArrowRight
} from "react-icons/fi";
import { MdEventBusy, MdMeetingRoom } from "react-icons/md";

interface DashboardStats {
  overview: {
    totalRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    cancelledRequests: number;
    pendingRequests: number;
    activeRequests: number;
    facilitiesCount: number;
  };
  revenue: {
    totalRevenue: number;
    exemptedRevenue: number;
    paidRevenue: number;
  };
  usage: {
    governmentEvents: number;
    privateEvents: number;
    noShows: number;
    utilizationRate: string;
  };
  facilityUtilization: Array<{
    facilityName: string;
    facilityType: string;
    totalBookings: number;
    approvedBookings: number;
  }>;
  mostRequestedFacilities: Array<{
    name: string;
    type: string;
    requestCount: number;
  }>;
}

export default function FacilityManagementDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin");
      return;
    }
    fetchStats();
  }, [session, status, router]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3005/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin text-[#4CAF50] mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#4CAF50] to-[#45a049] rounded-xl shadow-lg">
                <MdMeetingRoom className="w-8 h-8 text-white" />
              </div>
              Facility Management Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Overview of facility bookings and operations</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
              <FiXCircle className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {stats && (
        <>
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiUsers className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-gray-800">
                  {stats.overview.totalRequests}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Total Requests</h3>
              <p className="text-xs text-gray-500 mt-1">
                {stats.overview.pendingRequests} pending
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-gray-800">
                  {stats.overview.approvedRequests}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Approved Bookings</h3>
              <p className="text-xs text-gray-500 mt-1">
                {stats.overview.activeRequests} active
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FiHome className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-gray-800">
                  {stats.overview.facilitiesCount}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Active Facilities</h3>
              <p className="text-xs text-gray-500 mt-1">Available for booking</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-gray-800">
                  ₱{stats.revenue.paidRevenue.toLocaleString()}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <p className="text-xs text-gray-500 mt-1">
                {stats.usage.utilizationRate}% utilization
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link 
              href="/admin/facility-management/requests"
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-[#4CAF50] hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <FiCalendar className="w-6 h-6 text-blue-600" />
                </div>
                <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#4CAF50] transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Facility Requests</h3>
              <p className="text-sm text-gray-600">Manage booking requests and approvals</p>
            </Link>

            <Link 
              href="/admin/facility-management/facilities"
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-[#4CAF50] hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <FiHome className="w-6 h-6 text-green-600" />
                </div>
                <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#4CAF50] transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Manage Facilities</h3>
              <p className="text-sm text-gray-600">Add, edit, or remove facilities</p>
            </Link>

            <Link 
              href="/admin/facility-management/blackouts"
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-[#4CAF50] hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                  <MdEventBusy className="w-6 h-6 text-red-600" />
                </div>
                <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#4CAF50] transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Blackout Dates</h3>
              <p className="text-sm text-gray-600">Manage maintenance and restricted periods</p>
            </Link>

            <Link 
              href="/admin/facility-management/analytics"
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-[#4CAF50] hover:shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <FiBarChart2 className="w-6 h-6 text-purple-600" />
                </div>
                <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#4CAF50] transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Analytics & Reports</h3>
              <p className="text-sm text-gray-600">View detailed statistics and insights</p>
            </Link>
          </div>

          {/* Charts and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Most Requested Facilities */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiBarChart2 className="w-5 h-5 text-[#4CAF50]" />
                Most Requested Facilities
              </h3>
              <div className="space-y-3">
                {stats.mostRequestedFacilities.slice(0, 5).map((facility, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{facility.name}</p>
                      <p className="text-xs text-gray-500">{facility.type}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] h-2 rounded-full"
                          style={{ width: `${(facility.requestCount / stats.mostRequestedFacilities[0].requestCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-800 w-8 text-right">
                        {facility.requestCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Type Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-[#4CAF50]" />
                Event Type Distribution
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Government Events</span>
                    <span className="text-sm font-bold text-blue-600">{stats.usage.governmentEvents}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full"
                      style={{ 
                        width: `${(stats.usage.governmentEvents / (stats.usage.governmentEvents + stats.usage.privateEvents)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Private Events</span>
                    <span className="text-sm font-bold text-purple-600">{stats.usage.privateEvents}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-purple-500 h-3 rounded-full"
                      style={{ 
                        width: `${(stats.usage.privateEvents / (stats.usage.governmentEvents + stats.usage.privateEvents)) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">No Shows</span>
                    <span className="text-sm font-bold text-red-600">{stats.usage.noShows}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Facility Utilization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MdMeetingRoom className="w-5 h-5 text-[#4CAF50]" />
              Facility Utilization
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Bookings</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Approved</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.facilityUtilization.map((facility, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{facility.facilityName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{facility.facilityType}</td>
                      <td className="px-4 py-3 text-sm text-center font-semibold">{facility.totalBookings}</td>
                      <td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">{facility.approvedBookings}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] h-2 rounded-full"
                              style={{ 
                                width: `${facility.totalBookings > 0 ? (facility.approvedBookings / facility.totalBookings) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-12 text-right">
                            {facility.totalBookings > 0 ? ((facility.approvedBookings / facility.totalBookings) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
