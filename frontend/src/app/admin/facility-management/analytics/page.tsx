"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FiArrowLeft, FiBarChart2, FiTrendingUp, FiUsers, FiDollarSign, 
  FiCalendar, FiDownload, FiRefreshCw 
} from "react-icons/fi";
import { MdMeetingRoom } from "react-icons/md";

interface AnalyticsData {
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
  monthlyTrends: Array<{
    month: string;
    requests: number;
    revenue: number;
  }>;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin");
      return;
    }
    fetchAnalytics();
  }, [session, status, router]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3005/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch("http://localhost:3005/api/admin/reports/export?format=csv", {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      
      if (!response.ok) throw new Error("Failed to export data");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facility-analytics-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert("Data exported successfully");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin text-[#4CAF50] mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="p-6 text-center text-red-600">Failed to load analytics data</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="mb-6">
        <Link
          href="/admin/facility-management"
          className="inline-flex items-center gap-2 text-[#4CAF50] hover:text-[#45a049] mb-4"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics & Reports</h1>
            <p className="text-gray-600">Detailed statistics and insights</p>
          </div>
          
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <FiDownload className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FiUsers className="w-8 h-8 opacity-80" />
            <FiTrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold mb-1">{analytics.overview.totalRequests}</h3>
          <p className="text-blue-100 text-sm">Total Requests</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <MdMeetingRoom className="w-8 h-8 opacity-80" />
            <FiTrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold mb-1">{analytics.overview.facilitiesCount}</h3>
          <p className="text-green-100 text-sm">Active Facilities</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FiDollarSign className="w-8 h-8 opacity-80" />
            <FiTrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold mb-1">₱{analytics.revenue.paidRevenue.toLocaleString()}</h3>
          <p className="text-purple-100 text-sm">Total Revenue</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <FiBarChart2 className="w-8 h-8 opacity-80" />
            <FiTrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-bold mb-1">{analytics.usage.utilizationRate}%</h3>
          <p className="text-orange-100 text-sm">Utilization Rate</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Request Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiBarChart2 className="w-5 h-5 text-[#4CAF50]" />
            Request Status Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Approved</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(analytics.overview.approvedRequests / analytics.overview.totalRequests) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-800 w-12 text-right">
                  {analytics.overview.approvedRequests}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${(analytics.overview.pendingRequests / analytics.overview.totalRequests) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-800 w-12 text-right">
                  {analytics.overview.pendingRequests}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rejected</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(analytics.overview.rejectedRequests / analytics.overview.totalRequests) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-800 w-12 text-right">
                  {analytics.overview.rejectedRequests}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cancelled</span>
              <div className="flex items-center gap-3 flex-1 ml-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full"
                    style={{ width: `${(analytics.overview.cancelledRequests / analytics.overview.totalRequests) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-800 w-12 text-right">
                  {analytics.overview.cancelledRequests}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiDollarSign className="w-5 h-5 text-[#4CAF50]" />
            Revenue Breakdown
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                <span className="text-lg font-bold text-gray-800">
                  ₱{analytics.revenue.totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Paid Revenue</span>
                <span className="text-sm font-bold text-green-600">
                  ₱{analytics.revenue.paidRevenue.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full"
                  style={{ 
                    width: `${(analytics.revenue.paidRevenue / analytics.revenue.totalRevenue) * 100}%` 
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Exempted Revenue</span>
                <span className="text-sm font-bold text-blue-600">
                  ₱{analytics.revenue.exemptedRevenue.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full"
                  style={{ 
                    width: `${(analytics.revenue.exemptedRevenue / analytics.revenue.totalRevenue) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Most Requested Facilities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiTrendingUp className="w-5 h-5 text-[#4CAF50]" />
          Most Requested Facilities
        </h3>
        <div className="space-y-3">
          {analytics.mostRequestedFacilities.map((facility, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-[#4CAF50] text-white rounded-full font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{facility.name}</p>
                <p className="text-xs text-gray-500">{facility.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] h-2 rounded-full"
                    style={{ width: `${(facility.requestCount / analytics.mostRequestedFacilities[0].requestCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-800 w-12 text-right">
                  {facility.requestCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Facility Utilization Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MdMeetingRoom className="w-5 h-5 text-[#4CAF50]" />
          Facility Utilization Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Bookings</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Approved</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics.facilityUtilization.map((facility, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{facility.facilityName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{facility.facilityType}</td>
                  <td className="px-4 py-3 text-sm text-center font-semibold">{facility.totalBookings}</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 font-semibold">{facility.approvedBookings}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#4CAF50] to-[#45a049] h-2 rounded-full"
                          style={{ 
                            width: `${facility.totalBookings > 0 ? (facility.approvedBookings / facility.totalBookings) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
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
    </div>
  );
}
