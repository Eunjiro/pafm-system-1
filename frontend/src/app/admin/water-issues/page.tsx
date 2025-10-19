"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  FiTool, 
  FiFilter, 
  FiSearch, 
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiX,
  FiImage
} from 'react-icons/fi';

interface WaterIssue {
  id: number;
  ticketNumber: string;
  status: string;
  priority: string;
  issueType: string;
  description: string;
  location: string;
  barangayId?: number;
  barangay?: {
    id: number;
    name: string;
    district: number;
  };
  reporterName: string;
  reporterContact: string;
  reporterEmail?: string;
  accountNumber?: string;
  photos?: string[];
  assignedStaffId?: number;
  assignedStaff?: {
    id: number;
    fullNameFirst: string;
    fullNameLast: string;
  };
  estimatedRepairTime?: string;
  resolutionNotes?: string;
  resolutionPhotos?: string[];
  acknowledgedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WaterIssuesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [issues, setIssues] = useState<WaterIssue[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [issueTypeFilter, setIssueTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal
  const [selectedIssue, setSelectedIssue] = useState<WaterIssue | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState('');
  
  // Update form
  const [updateStatus, setUpdateStatus] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [estimatedRepairTime, setEstimatedRepairTime] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "EMPLOYEE")) {
      router.replace("/auth/signin");
      return;
    }
    fetchIssues();
  }, [session, status, router]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (issueTypeFilter !== 'all') params.append('issueType', issueTypeFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/water-issues?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch water issues');
      }
      
      const data = await response.json();
      setIssues(data.data || []);
    } catch (error) {
      console.error('Error fetching water issues:', error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIssue = async () => {
    if (!selectedIssue) return;

    setUpdateLoading(true);
    try {
      const updateData: any = {};
      if (updateStatus) updateData.status = updateStatus;
      if (assignedStaffId) updateData.assignedStaffId = parseInt(assignedStaffId);
      if (estimatedRepairTime) updateData.estimatedRepairTime = estimatedRepairTime;
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      
      const response = await fetch(`/api/water-issues/${selectedIssue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('Water issue updated successfully');
        setShowModal(false);
        setSelectedIssue(null);
        resetForm();
        fetchIssues();
      } else {
        const error = await response.json();
        alert(`Failed to update: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue');
    } finally {
      setUpdateLoading(false);
    }
  };

  const resetForm = () => {
    setUpdateStatus('');
    setAssignedStaffId('');
    setEstimatedRepairTime('');
    setResolutionNotes('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACKNOWLEDGED': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-indigo-100 text-indigo-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, priorityFilter, issueTypeFilter, searchQuery]);

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
              Water Issue Reports
            </h1>
            <p className="text-gray-600 mt-1">
              Track and resolve water supply issues and complaints
            </p>
          </div>
          <button
            onClick={fetchIssues}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{backgroundColor: '#4CAF50', color: 'white'}}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Issues</p>
                <p className="text-2xl font-bold" style={{color: '#2F3B26'}}>
                  {issues.length}
                </p>
              </div>
              <FiTool className="text-3xl" style={{color: '#4CAF50'}} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {issues.filter(i => i.status === 'PENDING').length}
                </p>
              </div>
              <FiClock className="text-3xl text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">
                  {issues.filter(i => i.status === 'ASSIGNED').length}
                </p>
              </div>
              <FiAlertCircle className="text-3xl text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {issues.filter(i => i.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <FiRefreshCw className="text-3xl text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {issues.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length}
                </p>
              </div>
              <FiCheckCircle className="text-3xl text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-red-600">
                  {issues.filter(i => i.priority === 'URGENT').length}
                </p>
              </div>
              <FiAlertCircle className="text-3xl text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter style={{color: '#4CAF50'}} />
            <h2 className="font-semibold" style={{color: '#2F3B26'}}>Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type
              </label>
              <select
                value={issueTypeFilter}
                onChange={(e) => setIssueTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="NO_WATER">No Water</option>
                <option value="LOW_PRESSURE">Low Pressure</option>
                <option value="CONTAMINATED_WATER">Contaminated Water</option>
                <option value="PIPE_LEAK">Pipe Leak</option>
                <option value="METER_ISSUE">Meter Issue</option>
                <option value="BILLING_ISSUE">Billing Issue</option>
                <option value="OTHER">Other</option>
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
                  placeholder="Search ticket, location..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Issues Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No water issues found
                    </td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{color: '#2F3B26'}}>
                          {issue.ticketNumber}
                        </div>
                        {issue.accountNumber && (
                          <div className="text-xs text-gray-500">Acct: {issue.accountNumber}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {issue.issueType.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{issue.location}</div>
                        {issue.barangay && (
                          <div className="text-xs text-gray-500">{issue.barangay.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{issue.reporterName}</div>
                        <div className="text-xs text-gray-500">{issue.reporterContact}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(issue.priority)}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedIssue(issue);
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
      {showModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold" style={{color: '#2F3B26'}}>
                Manage Water Issue
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedIssue(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Issue Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ticket Number
                  </label>
                  <p className="text-sm font-semibold" style={{color: '#4CAF50'}}>
                    {selectedIssue.ticketNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Status
                  </label>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedIssue.status)}`}>
                    {selectedIssue.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Type
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedIssue.issueType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedIssue.priority)}`}>
                    {selectedIssue.priority}
                  </span>
                </div>
                {selectedIssue.accountNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <p className="text-sm text-gray-900">{selectedIssue.accountNumber}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <p className="text-sm text-gray-900">{selectedIssue.location}</p>
                  {selectedIssue.barangay && (
                    <p className="text-xs text-gray-500">{selectedIssue.barangay.name}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-sm text-gray-900">{selectedIssue.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reporter
                  </label>
                  <p className="text-sm text-gray-900">{selectedIssue.reporterName}</p>
                  <p className="text-xs text-gray-500">{selectedIssue.reporterContact}</p>
                </div>
                {selectedIssue.assignedStaff && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedIssue.assignedStaff.fullNameFirst} {selectedIssue.assignedStaff.fullNameLast}
                    </p>
                  </div>
                )}
              </div>

              {/* Photos */}
              {selectedIssue.photos && selectedIssue.photos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Photos
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedIssue.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setShowPhotoModal(true);
                        }}
                        className="relative w-20 h-20 rounded border border-gray-300 overflow-hidden hover:opacity-80"
                      >
                        <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center">
                          <FiImage className="text-white opacity-0 hover:opacity-100" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Info */}
              {selectedIssue.resolutionNotes && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Notes
                  </label>
                  <p className="text-sm text-gray-900">{selectedIssue.resolutionNotes}</p>
                  {selectedIssue.resolvedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Resolved on {new Date(selectedIssue.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Update Form */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold mb-4" style={{color: '#2F3B26'}}>
                  Update Issue
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
                      <option value="ACKNOWLEDGED">Acknowledged</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Staff (User ID)
                    </label>
                    <input
                      type="number"
                      value={assignedStaffId}
                      onChange={(e) => setAssignedStaffId(e.target.value)}
                      placeholder="Enter user ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Repair Time
                    </label>
                    <input
                      type="text"
                      value={estimatedRepairTime}
                      onChange={(e) => setEstimatedRepairTime(e.target.value)}
                      placeholder="e.g., 2-4 hours, 1 day"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Notes
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={4}
                      placeholder="Add resolution notes or updates..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedIssue(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateIssue}
                  disabled={updateLoading}
                  className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  {updateLoading ? 'Updating...' : 'Update Issue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowPhotoModal(false);
            setSelectedPhoto('');
          }}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => {
                setShowPhotoModal(false);
                setSelectedPhoto('');
              }}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <FiX size={24} />
            </button>
            <img 
              src={selectedPhoto} 
              alt="Full size" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
