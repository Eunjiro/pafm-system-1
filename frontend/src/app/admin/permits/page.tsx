"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiShield, FiFileText, FiClock, FiAlertTriangle, FiCheckCircle, FiDollarSign, FiRefreshCw, FiFilter, FiUser, FiCalendar } from "react-icons/fi";

interface Permit {
  id: number;
  permitType: 'burial' | 'exhumation' | 'cremation';
  status: string;
  amountDue?: number;
  orNumber?: string;
  createdAt: string;
  deceased?: {
    id: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    dateOfDeath?: string;
  };
  requester?: {
    id: number;
    fullNameFirst: string;
    fullNameLast: string;
    email: string;
  };
}

export default function AdminPermitsIndex() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideAction, setOverrideAction] = useState('approve');
  const [overrideReason, setOverrideReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin");
      return;
    }
    fetchPermits();
  }, [session, status, router]);

  const fetchPermits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/permits');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch permits');
      }
      const data = await response.json();
      setPermits(data.permits || []);
      console.log(`Fetched ${data.permits?.length || 0} permits from backend`);
    } catch (error) {
      console.error('Error fetching permits:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch permits');
      setPermits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!selectedPermit || !overrideReason.trim()) return;

    setError(null);
    setSuccessMessage(null);

    try {
      const requestBody = {
        action: overrideAction,
        reason: overrideReason,
        adminId: session?.user?.id,
        ...(overrideAction === 'adjust_fee' && { newAmount: parseFloat(newAmount) || 0 })
      };

      const response = await fetch(`/api/permits/${selectedPermit.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Override executed successfully');
        fetchPermits();
        setShowOverrideModal(false);
        setSelectedPermit(null);
        setOverrideReason('');
        setNewAmount('');
      } else {
        throw new Error(data.error || 'Failed to execute override');
      }
    } catch (error) {
      console.error('Override failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute override');
    }
  };

  const filteredPermits = permits.filter(permit => {
    if (filter === 'all') return true;
    if (filter === 'burial') return permit.permitType === 'burial';
    if (filter === 'exhumation') return permit.permitType === 'exhumation';
    if (filter === 'cremation') return permit.permitType === 'cremation';
    if (filter === 'pending') return ['pending_review', 'submitted'].includes(permit.status);
    if (filter === 'issues') return ['rejected', 'returned'].includes(permit.status);
    return true;
  });

  const getPermitTypeIcon = (type: string) => {
    switch (type) {
      case 'burial': return <FiUser size={16} />;
      case 'exhumation': return <FiFileText size={16} />;
      case 'cremation': return <FiAlertTriangle size={16} />;
      default: return <FiFileText size={16} />;
    }
  };

  const getPermitTypeBadge = (type: string) => {
    const colors = {
      burial: 'bg-blue-100 text-blue-800',
      exhumation: 'bg-purple-100 text-purple-800',
      cremation: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFBFB'}}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#4CAF50'}}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FBFBFB'}}>
      {/* Modern Header with Gradient Accent */}
      <div className="bg-white shadow-sm border-b border-gray-200 rounded-2xl mx-6">
        <div 
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(135deg, #9C27B0 0%, #4A90E2 100%)'
          }}
        />
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{backgroundColor: '#9C27B0'}}
              >
                <div className="text-white">
                  <FiShield size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Permits & Certificates</h1>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600 font-medium">Administrative Oversight</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{permits.length} Total Permits</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">{new Date().toLocaleString()}</p>
              </div>
              <button 
                onClick={fetchPermits}
                className="group px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center space-x-2 border border-purple-200"
                style={{backgroundColor: '#9C27B0', color: 'white'}}
              >
                <div className="group-hover:rotate-180 transition-transform duration-300">
                  <FiRefreshCw size={16} />
                </div>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
            <div className="text-red-500">
              <FiAlertTriangle size={20} />
            </div>
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
            <div className="text-green-500">
              <FiCheckCircle size={20} />
            </div>
            <div>
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          </div>
        )}
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{backgroundColor: '#9C27B0'}}
              >
                <div className="text-white">
                  <FiFilter size={18} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Filter Permits</h3>
                <p className="text-sm text-gray-500">Filter by type or status</p>
              </div>
            </div>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              style={{minWidth: '200px'}}
            >
              <option value="all">All Permits</option>
              <option value="burial">Burial Permits</option>
              <option value="exhumation">Exhumation Permits</option>
              <option value="cremation">Cremation Permits</option>
              <option value="pending">Pending Review</option>
              <option value="issues">Issues/Rejected</option>
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Permits</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{permits.length}</p>
                <p className="text-sm text-gray-500 mt-1">All permit types</p>
              </div>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                style={{backgroundColor: '#9C27B0'}}
              >
                <div className="text-white">
                  <FiFileText size={24} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Burial Permits</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {permits.filter(p => p.permitType === 'burial').length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Cemetery burials</p>
              </div>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                style={{backgroundColor: '#4A90E2'}}
              >
                <div className="text-white">
                  <FiUser size={24} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Exhumation</p>
                <p className="text-3xl font-bold mt-2" style={{color: '#9C27B0'}}>
                  {permits.filter(p => p.permitType === 'exhumation').length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Remains removal</p>
              </div>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                style={{backgroundColor: '#9C27B0'}}
              >
                <div className="text-white">
                  <FiFileText size={24} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Cremation</p>
                <p className="text-3xl font-bold mt-2" style={{color: '#FDA811'}}>
                  {permits.filter(p => p.permitType === 'cremation').length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Crematorium permits</p>
              </div>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                style={{backgroundColor: '#FDA811'}}
              >
                <div className="text-white">
                  <FiAlertTriangle size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permits Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{backgroundColor: '#4CAF50'}}
                >
                  <div className="text-white">
                    <FiFileText size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {filter === 'all' ? 'All Permits' : 
                     filter === 'burial' ? 'Burial Permits' :
                     filter === 'exhumation' ? 'Exhumation Permits' :
                     filter === 'cremation' ? 'Cremation Permits' :
                     filter === 'pending' ? 'Pending Review' : 'Issues & Rejections'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {filteredPermits.length} permits • Admin override available
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">Live Data</span>
              </div>
            </div>
          </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deceased Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Death Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPermits.map((permit) => (
                <tr key={permit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permit.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-2 text-xs font-semibold rounded-full flex items-center space-x-1 ${getPermitTypeBadge(permit.permitType)}`}>
                        {getPermitTypeIcon(permit.permitType)}
                        <span>{permit.permitType.toUpperCase()}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {permit.deceased ? `${permit.deceased.firstName} ${permit.deceased.middleName || ''} ${permit.deceased.lastName}`.trim() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {permit.deceased?.dateOfDeath ? new Date(permit.deceased.dateOfDeath).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      permit.status === 'issued' || permit.status === 'for_pickup' ? 'bg-green-100 text-green-800' :
                      permit.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      permit.status === 'pending_review' || permit.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {permit.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{permit.amountDue || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedPermit(permit);
                        setShowOverrideModal(true);
                      }}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Override
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        {/* Admin Override Modal */}
        {showOverrideModal && (
          <div className="fixed inset-0 bg-black bg-opacity-1 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slideUp">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{backgroundColor: '#FF5722'}}
                  >
                    <div className="text-white">
                      <FiShield size={20} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Admin Override</h3>
                    <p className="text-sm text-gray-500">Permit ID: {selectedPermit?.id}</p>
                  </div>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="px-6 py-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Override Action
                  </label>
                  <select 
                    value={overrideAction} 
                    onChange={(e) => setOverrideAction(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="approve">Force Approve</option>
                    <option value="reject">Force Reject</option>
                    <option value="waive_fee">Waive Fee</option>
                    <option value="adjust_fee">Adjust Fee</option>
                    <option value="reset_status">Reset Status</option>
                  </select>
                </div>

                {overrideAction === 'adjust_fee' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      New Amount (₱)
                    </label>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="Enter new amount..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Reason for Override <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Enter detailed reason for administrative override..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={4}
                    required
                  />
                </div>

                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <div className="text-yellow-600">
                      <FiAlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Warning</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        This action will override normal workflow and will be logged in the audit trail.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowOverrideModal(false);
                      setSelectedPermit(null);
                      setOverrideReason('');
                      setNewAmount('');
                    }}
                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-100 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOverride}
                    disabled={!overrideReason.trim() || (overrideAction === 'adjust_fee' && !newAmount)}
                    className="px-6 py-3 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    style={{backgroundColor: '#FF5722'}}
                  >
                    <FiShield size={16} />
                    <span>Execute Override</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}