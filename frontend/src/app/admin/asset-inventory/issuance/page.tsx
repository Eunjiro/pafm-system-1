"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiEye, FiCheck, FiPackage, FiUsers, FiCalendar, FiBarChart2 } from "react-icons/fi";

interface IssuanceItem {
  id: number;
  itemId: number;
  quantity: number;
  fromRackId: number | null;
  item: {
    id: number;
    itemName: string;
    itemCode: string;
    unitOfMeasure: string;
  };
}

interface Issuance {
  id: number;
  issuanceNumber: string;
  issuedTo: string;
  issuedBy: string;
  issuedDate: string;
  acknowledgedBy: string | null;
  acknowledgedDate: string | null;
  remarks: string | null;
  risRequest: {
    risNumber: string;
    departmentName: string;
    requestedBy: string;
  };
  items: IssuanceItem[];
  totalQuantity: number;
  totalItems: number;
}

interface IssuanceStats {
  totalIssuances: number;
  acknowledgedIssuances: number;
  pendingAcknowledgement: number;
  totalItemsIssued: number;
  acknowledgementRate: string;
  topIssuedItems: Array<{
    id: number;
    itemName: string;
    itemCode: string;
    unitOfMeasure: string;
    totalIssued: number;
  }>;
}

export default function IssuancePage() {
  const [issuances, setIssuances] = useState<Issuance[]>([]);
  const [stats, setStats] = useState<IssuanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssuance, setSelectedIssuance] = useState<Issuance | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [acknowledgedBy, setAcknowledgedBy] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "acknowledged">("all");

  useEffect(() => {
    fetchIssuances();
    fetchStats();
  }, []);

  const fetchIssuances = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/asset-inventory/issuances");
      const result = await response.json();
      if (result.success) {
        setIssuances(result.data);
      }
    } catch (error) {
      console.error("Error fetching issuances:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/asset-inventory/issuances/stats");
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedIssuance || !acknowledgedBy.trim()) return;

    try {
      const response = await fetch(
        `/api/asset-inventory/issuances/${selectedIssuance.id}/acknowledge`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acknowledgedBy: acknowledgedBy.trim() }),
        }
      );

      const result = await response.json();
      if (result.success) {
        await fetchIssuances();
        await fetchStats();
        setShowAcknowledgeModal(false);
        setAcknowledgedBy("");
        setSelectedIssuance(null);
      }
    } catch (error) {
      console.error("Error acknowledging issuance:", error);
    }
  };

  const filteredIssuances = issuances.filter((issuance) => {
    const matchesSearch =
      searchTerm === "" ||
      issuance.issuanceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issuance.issuedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issuance.risRequest.departmentName.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "pending") {
      return matchesSearch && !issuance.acknowledgedBy;
    } else if (activeTab === "acknowledged") {
      return matchesSearch && issuance.acknowledgedBy;
    }
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Asset Issuance</h1>
        <p className="text-gray-600 mt-1">Track and manage issued supplies and equipment</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Issuances</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalIssuances}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Acknowledged</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.acknowledgedIssuances}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingAcknowledgement}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <FiCalendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Issued</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalItemsIssued}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <FiBarChart2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Issuances
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("acknowledged")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "acknowledged"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Acknowledged
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by issuance #, department, or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Issuances Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issuance #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RIS #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issued To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issued Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssuances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No issuances found
                  </td>
                </tr>
              ) : (
                filteredIssuances.map((issuance) => (
                  <tr key={issuance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{issuance.issuanceNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{issuance.risRequest.risNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{issuance.risRequest.departmentName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{issuance.issuedTo}</div>
                      <div className="text-xs text-gray-500">By: {issuance.issuedBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{issuance.totalItems} items</div>
                      <div className="text-xs text-gray-500">Qty: {issuance.totalQuantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(issuance.issuedDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {issuance.acknowledgedBy ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Acknowledged
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedIssuance(issuance);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        {!issuance.acknowledgedBy && (
                          <button
                            onClick={() => {
                              setSelectedIssuance(issuance);
                              setShowAcknowledgeModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Acknowledge Receipt"
                          >
                            <FiCheck className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedIssuance && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Issuance Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedIssuance(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuance Number</label>
                  <p className="text-lg font-semibold text-blue-600">{selectedIssuance.issuanceNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RIS Number</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedIssuance.risRequest.risNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <p className="text-gray-900">{selectedIssuance.risRequest.departmentName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issued Date</label>
                  <p className="text-gray-900">{formatDate(selectedIssuance.issuedDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issued To</label>
                  <p className="text-gray-900">{selectedIssuance.issuedTo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issued By</label>
                  <p className="text-gray-900">{selectedIssuance.issuedBy}</p>
                </div>
                {selectedIssuance.acknowledgedBy && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acknowledged By</label>
                      <p className="text-gray-900">{selectedIssuance.acknowledgedBy}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Acknowledged Date</label>
                      <p className="text-gray-900">{formatDate(selectedIssuance.acknowledgedDate!)}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Items Table */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Issued Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedIssuance.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.item.itemCode}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.item.itemName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.item.unitOfMeasure}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{selectedIssuance.totalQuantity}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedIssuance.remarks && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedIssuance.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Acknowledge Modal */}
      {showAcknowledgeModal && selectedIssuance && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Acknowledge Receipt</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Confirm receipt of issuance <span className="font-semibold">{selectedIssuance.issuanceNumber}</span>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acknowledged By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={acknowledgedBy}
                  onChange={(e) => setAcknowledgedBy(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAcknowledgeModal(false);
                    setAcknowledgedBy("");
                    setSelectedIssuance(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcknowledge}
                  disabled={!acknowledgedBy.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
