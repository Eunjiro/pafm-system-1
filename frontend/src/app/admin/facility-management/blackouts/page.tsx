"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiPlus, FiTrash2, FiCalendar, FiAlertCircle, FiRefreshCw, FiX } from "react-icons/fi";
import { MdEventBusy } from "react-icons/md";

interface BlackoutDate {
  id: number;
  facilityId: number;
  startDate: string;
  endDate: string;
  reason: string;
  facility: {
    name: string;
    type: string;
  };
}

interface Facility {
  id: number;
  name: string;
  type: string;
}

export default function BlackoutDatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [blackouts, setBlackouts] = useState<BlackoutDate[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    facilityId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin");
      return;
    }
    fetchBlackouts();
    fetchFacilities();
  }, [session, status, router]);

  const fetchBlackouts = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3005/api/admin/blackout-dates", {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch blackout dates");
      const data = await response.json();
      setBlackouts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await fetch("http://localhost:3005/api/admin/facilities", {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch facilities");
      const data = await response.json();
      setFacilities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBlackout = async (id: number) => {
    if (!confirm("Are you sure you want to delete this blackout date?")) return;
    
    try {
      const response = await fetch(`http://localhost:3005/api/admin/blackout-date/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete blackout date");
      }
      
      alert("Blackout date deleted successfully");
      fetchBlackouts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      facilityId: "",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const response = await fetch("http://localhost:3005/api/admin/blackout-date", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          facilityId: parseInt(formData.facilityId),
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create blackout date");
      }

      alert("Blackout date created successfully");
      setShowModal(false);
      fetchBlackouts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin text-[#4CAF50] mx-auto mb-4" />
          <p className="text-gray-600">Loading blackout dates...</p>
        </div>
      </div>
    );
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Blackout Dates</h1>
            <p className="text-gray-600">Manage maintenance periods and restricted dates</p>
          </div>
          
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <FiPlus className="w-4 h-4" />
            Add Blackout Date
          </button>
        </div>
      </div>

      {/* Blackout Dates List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blackouts.map((blackout) => (
                <tr key={blackout.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{blackout.facility.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{blackout.facility.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(blackout.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(blackout.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <FiAlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-800">{blackout.reason}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteBlackout(blackout.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm"
                    >
                      <FiTrash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {blackouts.length === 0 && (
          <div className="p-12 text-center">
            <MdEventBusy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Blackout Dates</h3>
            <p className="text-gray-600 mb-4">Add blackout dates for maintenance or special events</p>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white rounded-lg hover:shadow-lg transition-all"
            >
              <FiPlus className="w-4 h-4" />
              Add Blackout Date
            </button>
          </div>
        )}
      </div>

      {/* Add Blackout Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add Blackout Date</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facility *
                  </label>
                  <select
                    required
                    value={formData.facilityId}
                    onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                  >
                    <option value="">Select Facility</option>
                    {facilities.map((facility) => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name} ({facility.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="e.g., Scheduled maintenance, Annual cleaning, Repairs..."
                  />
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Important Note</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        The facility will be unavailable for booking during this period. 
                        Any existing approved bookings will need to be rescheduled.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitLoading}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitLoading ? "Creating..." : "Create Blackout Date"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
