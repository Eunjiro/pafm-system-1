"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiSearch, FiFilter, FiDownload, FiEye, FiX, FiCalendar, FiClock, FiUser, FiMail, FiPhone } from "react-icons/fi";

interface FacilityRequest {
  id: number;
  requestNumber: string;
  applicantName: string;
  organizationName: string | null;
  contactNumber: string;
  email: string;
  eventType: string;
  eventTitle: string;
  eventDescription: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  facility: {
    name: string;
    type: string;
  };
}

export default function FacilityRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<FacilityRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<FacilityRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin");
      return;
    }
    fetchRequests();
  }, [session, status, router]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3005/api/admin/all-requests", {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch requests");
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
      AWAITING_REQUIREMENTS: "bg-orange-100 text-orange-800",
      AWAITING_PAYMENT: "bg-blue-100 text-blue-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    if (!confirm("Are you sure you want to approve this request?")) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3005/api/admin/override-status/${selectedRequest.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}` 
        },
        body: JSON.stringify({ 
          status: "APPROVED",
          remarks: "Request approved by admin"
        }),
      });
      
      if (!response.ok) throw new Error("Failed to approve request");
      
      alert("Request approved successfully!");
      setShowModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3005/api/admin/override-status/${selectedRequest.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}` 
        },
        body: JSON.stringify({ 
          status: "REJECTED",
          remarks: reason
        }),
      });
      
      if (!response.ok) throw new Error("Failed to reject request");
      
      alert("Request rejected successfully!");
      setShowModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.contactNumber.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <div className="p-6 text-center">Loading requests...</div>;
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
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Facility Requests</h1>
        <p className="text-gray-600">Manage and review booking requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by request number, name, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="AWAITING_REQUIREMENTS">Awaiting Requirements</option>
              <option value="AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{request.requestNumber}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-800">{request.applicantName}</div>
                    <div className="text-xs text-gray-500">{request.contactNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-800">{request.facility.name}</div>
                    <div className="text-xs text-gray-500">{request.facility.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-800">{request.eventTitle}</div>
                    <div className="text-xs text-gray-500">{request.eventType}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(request.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowModal(true);
                      }}
                      className="text-[#4CAF50] hover:text-[#45a049]"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredRequests.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No requests found matching your criteria
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedRequest.requestNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Status */}
              <div>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Applicant Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-[#4CAF50]" />
                  Applicant Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <FiUser className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-800">{selectedRequest.applicantName}</p>
                    </div>
                  </div>
                  {selectedRequest.organizationName && (
                    <div className="flex items-start gap-2">
                      <FiUser className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Organization</p>
                        <p className="text-sm font-medium text-gray-800">{selectedRequest.organizationName}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <FiMail className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-800">{selectedRequest.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiPhone className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Contact Number</p>
                      <p className="text-sm font-medium text-gray-800">{selectedRequest.contactNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Facility Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiCalendar className="w-5 h-5 text-[#4CAF50]" />
                  Facility Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Facility Name</p>
                    <p className="text-sm font-medium text-gray-800">{selectedRequest.facility.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Facility Type</p>
                    <p className="text-sm font-medium text-gray-800">{selectedRequest.facility.type}</p>
                  </div>
                </div>
              </div>

              {/* Event Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiCalendar className="w-5 h-5 text-[#4CAF50]" />
                  Event Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Event Title</p>
                    <p className="text-sm font-medium text-gray-800">{selectedRequest.eventTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Event Type</p>
                    <p className="text-sm font-medium text-gray-800">{selectedRequest.eventType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Event Description</p>
                    <p className="text-sm text-gray-800">{selectedRequest.eventDescription}</p>
                  </div>
                </div>
              </div>

              {/* Schedule Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiClock className="w-5 h-5 text-[#4CAF50]" />
                  Schedule
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(selectedRequest.startDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Start Time</p>
                    <p className="text-sm font-medium text-gray-800">{selectedRequest.startTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(selectedRequest.endDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">End Time</p>
                    <p className="text-sm font-medium text-gray-800">{selectedRequest.endTime}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                disabled={actionLoading}
              >
                Close
              </button>
              {selectedRequest.status === "PENDING_REVIEW" && (
                <>
                  <button 
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? "Processing..." : "Reject"}
                  </button>
                  <button 
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-gradient-to-r from-[#4CAF50] to-[#45a049] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? "Processing..." : "Approve"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
