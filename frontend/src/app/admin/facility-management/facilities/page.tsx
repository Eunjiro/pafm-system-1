"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiMapPin, FiUsers, FiDollarSign, FiRefreshCw, FiX } from "react-icons/fi";
import { MdMeetingRoom } from "react-icons/md";

interface Facility {
  id: number;
  name: string;
  type: string;
  location: string;
  capacity: number;
  hourlyRate: number;
  description: string;
  amenities: string[];
  isActive: boolean;
  photos: string[];
}

export default function FacilitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    location: "",
    capacity: "",
    hourlyRate: "",
    description: "",
    amenities: "",
    isActive: true,
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin");
      return;
    }
    fetchFacilities();
  }, [session, status, router]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3005/api/admin/facilities", {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch facilities");
      const data = await response.json();
      setFacilities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteFacility = async (id: number) => {
    if (!confirm("Are you sure you want to delete this facility?")) return;
    
    try {
      const response = await fetch(`http://localhost:3005/api/admin/facility/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete facility");
      }
      
      alert("Facility deleted successfully");
      fetchFacilities();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenModal = (facility: Facility | null) => {
    if (facility) {
      setSelectedFacility(facility);
      setFormData({
        name: facility.name,
        type: facility.type,
        location: facility.location,
        capacity: facility.capacity.toString(),
        hourlyRate: facility.hourlyRate.toString(),
        description: facility.description,
        amenities: facility.amenities.join(", "),
        isActive: facility.isActive,
      });
    } else {
      setSelectedFacility(null);
      setFormData({
        name: "",
        type: "",
        location: "",
        capacity: "",
        hourlyRate: "",
        description: "",
        amenities: "",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const amenitiesArray = formData.amenities
        .split(",")
        .map((a) => a.trim())
        .filter((a) => a !== "");

      const payload = {
        name: formData.name,
        type: formData.type,
        location: formData.location,
        capacity: parseInt(formData.capacity),
        hourlyRate: parseFloat(formData.hourlyRate),
        description: formData.description,
        amenities: amenitiesArray,
        isActive: formData.isActive,
      };

      const url = selectedFacility
        ? `http://localhost:3005/api/admin/facility/${selectedFacility.id}`
        : "http://localhost:3005/api/admin/facility";

      const method = selectedFacility ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save facility");
      }

      alert(
        selectedFacility
          ? "Facility updated successfully"
          : "Facility created successfully"
      );
      setShowModal(false);
      fetchFacilities();
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
          <p className="text-gray-600">Loading facilities...</p>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Facilities</h1>
            <p className="text-gray-600">Add, edit, or remove government facilities</p>
          </div>
          
          <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <FiPlus className="w-4 h-4" />
            Add Facility
          </button>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map((facility) => (
          <div
            key={facility.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{facility.name}</h3>
                <p className="text-sm text-gray-600">{facility.type}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                facility.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {facility.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiUsers className="w-4 h-4 text-[#4CAF50]" />
                <span>Capacity: {facility.capacity} people</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMapPin className="w-4 h-4 text-[#4CAF50]" />
                <span>{facility.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiDollarSign className="w-4 h-4 text-[#4CAF50]" />
                <span>₱{facility.hourlyRate.toLocaleString()} / hour</span>
              </div>
            </div>

            {facility.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{facility.description}</p>
            )}

            {facility.amenities && facility.amenities.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Amenities:</p>
                <div className="flex flex-wrap gap-1">
                  {facility.amenities.slice(0, 3).map((amenity, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {amenity}
                    </span>
                  ))}
                  {facility.amenities.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      +{facility.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleOpenModal(facility)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] transition-all text-sm"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => deleteFacility(facility.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm"
              >
                <FiTrash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {facilities.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <MdMeetingRoom className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Facilities Yet</h3>
          <p className="text-gray-600 mb-4">Start by adding your first facility</p>
          <button
            onClick={() => handleOpenModal(null)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white rounded-lg hover:shadow-lg transition-all"
          >
            <FiPlus className="w-4 h-4" />
            Add Facility
          </button>
        </div>
      )}

      {/* Facility Form Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedFacility ? "Edit Facility" : "Add New Facility"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facility Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      placeholder="e.g., City Hall Conference Room"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facility Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    >
                      <option value="">Select Type</option>
                      <option value="CONFERENCE_ROOM">Conference Room</option>
                      <option value="AUDITORIUM">Auditorium</option>
                      <option value="SPORTS_FACILITY">Sports Facility</option>
                      <option value="PARK">Park</option>
                      <option value="COMMUNITY_CENTER">Community Center</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      placeholder="e.g., 2nd Floor, City Hall"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity (people) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      placeholder="e.g., 50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate (₱) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                      placeholder="e.g., 500.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      required
                      value={formData.isActive ? "true" : "false"}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="Brief description of the facility..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                    placeholder="e.g., WiFi, Projector, Air Conditioning"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple amenities with commas
                  </p>
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
                  {submitLoading ? "Saving..." : selectedFacility ? "Update Facility" : "Create Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
