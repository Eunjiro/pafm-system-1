"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  FiDroplet, 
  FiFilter, 
  FiSearch, 
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiX,
  FiFileText,
  FiDollarSign,
  FiAlertCircle
} from 'react-icons/fi';

interface WaterConnection {
  id: number;
  applicationNumber: string;
  status: string;
  connectionType: string;
  applicantName: string;
  applicantContact: string;
  applicantEmail?: string;
  propertyAddress: string;
  barangayId?: number;
  barangay?: {
    id: number;
    name: string;
    district: number;
  };
  connectionFee: number;
  isPaid: boolean;
  orNumber?: string;
  paidAt?: string;
  propertyOwnershipDoc?: string;
  validIdDoc?: string;
  sketchPlanDoc?: string;
  inspectorId?: number;
  inspector?: {
    id: number;
    fullNameFirst: string;
    fullNameLast: string;
  };
  inspectionDate?: string;
  inspectionNotes?: string;
  installerId?: number;
  installer?: {
    id: number;
    fullNameFirst: string;
    fullNameLast: string;
  };
  installationDate?: string;
  meterNumber?: string;
  approvedAt?: string;
  activatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WaterSupplyManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connections, setConnections] = useState<WaterConnection[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [connectionTypeFilter, setConnectionTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal
  const [selectedConnection, setSelectedConnection] = useState<WaterConnection | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Update form
  const [updateStatus, setUpdateStatus] = useState('');
  const [inspectorId, setInspectorId] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [installerId, setInstallerId] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [orNumber, setOrNumber] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "EMPLOYEE")) {
      router.replace("/auth/signin");
      return;
    }
    fetchConnections();
  }, [session, status, router]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (connectionTypeFilter !== 'all') params.append('connectionType', connectionTypeFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/water-connections?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch water connections');
      }
      
      const data = await response.json();
      setConnections(data.data || []);
    } catch (error) {
      console.error('Error fetching water connections:', error);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConnection = async () => {
    if (!selectedConnection) return;

    setUpdateLoading(true);
    try {
      const updateData: any = {};
      if (updateStatus) updateData.status = updateStatus;
      if (inspectorId) updateData.inspectorId = parseInt(inspectorId);
      if (inspectionDate) updateData.inspectionDate = inspectionDate;
      if (inspectionNotes) updateData.inspectionNotes = inspectionNotes;
      if (installerId) updateData.installerId = parseInt(installerId);
      if (installationDate) updateData.installationDate = installationDate;
      if (meterNumber) updateData.meterNumber = meterNumber;
      if (orNumber) updateData.orNumber = orNumber;
      updateData.isPaid = isPaid;
      if (isPaid && !selectedConnection.paidAt) {
        updateData.paidAt = new Date().toISOString();
      }
      
      const response = await fetch(`/api/water-connections/${selectedConnection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('Water connection updated successfully');
        setShowModal(false);
        setSelectedConnection(null);
        resetForm();
        fetchConnections();
      } else {
        const error = await response.json();
        alert(`Failed to update: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating connection:', error);
      alert('Failed to update connection');
    } finally {
      setUpdateLoading(false);
    }
  };

  const resetForm = () => {
    setUpdateStatus('');
    setInspectorId('');
    setInspectionDate('');
    setInspectionNotes('');
    setInstallerId('');
    setInstallationDate('');
    setMeterNumber('');
    setIsPaid(false);
    setOrNumber('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FOR_INSPECTION': return 'bg-blue-100 text-blue-800';
      case 'INSPECTED': return 'bg-indigo-100 text-indigo-800';
      case 'FOR_APPROVAL': return 'bg-purple-100 text-purple-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'FOR_PAYMENT': return 'bg-orange-100 text-orange-800';
      case 'PAYMENT_VERIFIED': return 'bg-teal-100 text-teal-800';
      case 'FOR_INSTALLATION': return 'bg-cyan-100 text-cyan-800';
      case 'INSTALLED': return 'bg-lime-100 text-lime-800';
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [statusFilter, connectionTypeFilter, searchQuery]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFBFB'}}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#4CAF50'}}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FBFBFB'}}>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{color: '#2F3B26'}}>
              Water Supply Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage water connection applications and installations
            </p>
          </div>
          <button
            onClick={fetchConnections}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{backgroundColor: '#4CAF50', color: 'white'}}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold" style={{color: '#2F3B26'}}>
                  {connections.length}
                </p>
              </div>
              <FiDroplet className="text-3xl" style={{color: '#4CAF50'}} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {connections.filter(c => c.status === 'PENDING').length}
                </p>
              </div>
              <FiClock className="text-3xl text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Connections</p>
                <p className="text-2xl font-bold text-green-600">
                  {connections.filter(c => c.status === 'ACTIVE').length}
                </p>
              </div>
              <FiCheckCircle className="text-3xl text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₱{connections.filter(c => c.isPaid).reduce((sum, c) => sum + c.connectionFee, 0).toLocaleString()}
                </p>
              </div>
              <FiDollarSign className="text-3xl text-blue-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter style={{color: '#4CAF50'}} />
            <h2 className="font-semibold" style={{color: '#2F3B26'}}>Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="FOR_INSPECTION">For Inspection</option>
                <option value="INSPECTED">Inspected</option>
                <option value="FOR_APPROVAL">For Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="FOR_PAYMENT">For Payment</option>
                <option value="PAYMENT_VERIFIED">Payment Verified</option>
                <option value="FOR_INSTALLATION">For Installation</option>
                <option value="INSTALLED">Installed</option>
                <option value="ACTIVE">Active</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Type
              </label>
              <select
                value={connectionTypeFilter}
                onChange={(e) => setConnectionTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search application, name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Connections Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
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
                {connections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No water connection applications found
                    </td>
                  </tr>
                ) : (
                  connections.map((connection) => (
                    <tr key={connection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{color: '#2F3B26'}}>
                          {connection.applicationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{connection.applicantName}</div>
                        <div className="text-xs text-gray-500">{connection.applicantContact}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{connection.propertyAddress}</div>
                        {connection.barangay && (
                          <div className="text-xs text-gray-500">{connection.barangay.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {connection.connectionType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₱{connection.connectionFee.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {connection.isPaid ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            PAID
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            UNPAID
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(connection.status)}`}>
                          {connection.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedConnection(connection);
                            setIsPaid(connection.isPaid);
                            setOrNumber(connection.orNumber || '');
                            setShowModal(true);
                          }}
                          className="text-white hover:opacity-80 px-3 py-1 rounded"
                          style={{backgroundColor: '#4CAF50'}}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Update Modal */}
      {showModal && selectedConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold" style={{color: '#2F3B26'}}>
                Manage Water Connection Application
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedConnection(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Application Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Number
                  </label>
                  <p className="text-sm font-semibold" style={{color: '#4CAF50'}}>
                    {selectedConnection.applicationNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Status
                  </label>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedConnection.status)}`}>
                    {selectedConnection.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Type
                  </label>
                  <p className="text-sm text-gray-900">{selectedConnection.connectionType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Fee
                  </label>
                  <p className="text-sm text-gray-900">₱{selectedConnection.connectionFee.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Applicant
                  </label>
                  <p className="text-sm text-gray-900">{selectedConnection.applicantName}</p>
                  <p className="text-xs text-gray-500">
                    {selectedConnection.applicantContact} • {selectedConnection.applicantEmail}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Address
                  </label>
                  <p className="text-sm text-gray-900">{selectedConnection.propertyAddress}</p>
                  {selectedConnection.barangay && (
                    <p className="text-xs text-gray-500">{selectedConnection.barangay.name}</p>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submitted Documents
                </label>
                <div className="flex gap-2 flex-wrap">
                  {selectedConnection.propertyOwnershipDoc && (
                    <a
                      href={selectedConnection.propertyOwnershipDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                    >
                      <FiFileText />
                      Property Ownership
                    </a>
                  )}
                  {selectedConnection.validIdDoc && (
                    <a
                      href={selectedConnection.validIdDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                    >
                      <FiFileText />
                      Valid ID
                    </a>
                  )}
                  {selectedConnection.sketchPlanDoc && (
                    <a
                      href={selectedConnection.sketchPlanDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                    >
                      <FiFileText />
                      Sketch Plan
                    </a>
                  )}
                </div>
              </div>

              {/* Update Form */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold mb-4" style={{color: '#2F3B26'}}>
                  Update Application
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Status
                    </label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Keep Current Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="FOR_INSPECTION">For Inspection</option>
                      <option value="INSPECTED">Inspected</option>
                      <option value="FOR_APPROVAL">For Approval</option>
                      <option value="APPROVED">Approved</option>
                      <option value="FOR_PAYMENT">For Payment</option>
                      <option value="PAYMENT_VERIFIED">Payment Verified</option>
                      <option value="FOR_INSTALLATION">For Installation</option>
                      <option value="INSTALLED">Installed</option>
                      <option value="ACTIVE">Active</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inspector ID
                      </label>
                      <input
                        type="number"
                        value={inspectorId}
                        onChange={(e) => setInspectorId(e.target.value)}
                        placeholder="Enter user ID"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inspection Date
                      </label>
                      <input
                        type="date"
                        value={inspectionDate}
                        onChange={(e) => setInspectionDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inspection Notes
                    </label>
                    <textarea
                      value={inspectionNotes}
                      onChange={(e) => setInspectionNotes(e.target.value)}
                      rows={3}
                      placeholder="Add inspection notes..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Installer ID
                      </label>
                      <input
                        type="number"
                        value={installerId}
                        onChange={(e) => setInstallerId(e.target.value)}
                        placeholder="Enter user ID"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Installation Date
                      </label>
                      <input
                        type="date"
                        value={installationDate}
                        onChange={(e) => setInstallationDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meter Number
                    </label>
                    <input
                      type="text"
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value)}
                      placeholder="Enter meter number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium mb-3">Payment Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isPaid"
                          checked={isPaid}
                          onChange={(e) => setIsPaid(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                          style={{accentColor: '#4CAF50'}}
                        />
                        <label htmlFor="isPaid" className="ml-2 text-sm text-gray-700">
                          Payment received
                        </label>
                      </div>
                      {isPaid && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            OR Number
                          </label>
                          <input
                            type="text"
                            value={orNumber}
                            onChange={(e) => setOrNumber(e.target.value)}
                            placeholder="Enter official receipt number"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedConnection(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateConnection}
                  disabled={updateLoading}
                  className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  {updateLoading ? 'Updating...' : 'Update Application'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
