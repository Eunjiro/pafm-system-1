"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiFileText, FiUser, FiCalendar, FiDollarSign, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiSettings } from 'react-icons/fi';

interface CertificateRequest {
  id: number;
  certificateType: string;
  status: string;
  copies: number;
  amountDue?: number;
  orNumber?: string;
  createdAt: string;
  deceased?: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfDeath?: string;
  };
  requester?: {
    fullNameFirst: string;
    fullNameLast: string;
    email: string;
    relationship?: string;
  };
}

export default function AdminCertificatesIndex() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideAction, setOverrideAction] = useState('approve');
  const [overrideReason, setOverrideReason] = useState('');

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
      const response = await fetch('/api/certificates');
      if (!response.ok) throw new Error('Failed to fetch certificate requests');
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const [newAmount, setNewAmount] = useState<string>('');

  const handleOverride = async () => {
    if (!selectedRequest || !overrideReason.trim()) return;

    try {
      const overrideData: any = {
        action: overrideAction,
        reason: overrideReason,
        adminId: session?.user?.id
      };

      if (overrideAction === 'adjust_fee' && newAmount) {
        overrideData.newAmount = parseFloat(newAmount);
      }

      const response = await fetch(`/api/certificates/${selectedRequest.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideData)
      });

      if (response.ok) {
        fetchRequests();
        setShowOverrideModal(false);
        setSelectedRequest(null);
        setOverrideReason('');
        setNewAmount('');
      }
    } catch (error) {
      console.error('Override failed:', error);
    }
  };

  // Calculate statistics
  const statistics = {
    total: requests.length,
    pending: requests.filter(r => ['SUBMITTED', 'FOR_PAYMENT'].includes(r.status)).length,
    processing: requests.filter(r => ['PAID', 'PROCESSING'].includes(r.status)).length,
    ready: requests.filter(r => r.status === 'READY_FOR_PICKUP').length,
    completed: requests.filter(r => r.status === 'CLAIMED').length,
    issues: requests.filter(r => r.status === 'REJECTED').length,
    totalRevenue: requests
      .filter(r => ['PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'CLAIMED'].includes(r.status))
      .reduce((sum, r) => sum + (r.amountDue || 0), 0)
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'pending') return ['SUBMITTED', 'FOR_PAYMENT'].includes(request.status);
    if (filter === 'processing') return ['PAID', 'PROCESSING'].includes(request.status);
    if (filter === 'ready') return request.status === 'READY_FOR_PICKUP';
    if (filter === 'issues') return ['REJECTED'].includes(request.status);
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFBFB'}}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#4CAF50'}}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FBFBFB'}}>
      {/* Modern Gradient Header */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #4A90E2 50%, #FDA811 100%)'
          }}
        />
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-xl shadow-lg"
                style={{backgroundColor: '#4CAF50'}}
              >
                <FiFileText size={32} color="white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
                <p className="text-gray-600 mt-1">Manage and oversee all certificate requests</p>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="flex items-center space-x-4">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl shadow-sm bg-white focus:ring-2 focus:border-transparent focus:ring-green-500"
              >
                <option value="all">All Requests</option>
                <option value="pending">Pending Validation</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready for Pickup</option>
                <option value="issues">Issues/Rejected</option>
              </select>
            </div>
          </div>

          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
            {/* Total Requests */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
                </div>
                <div className="p-3 rounded-xl" style={{backgroundColor: '#E3F2FD'}}>
                  <FiFileText size={24} color="#4A90E2" />
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold" style={{color: '#FDA811'}}>{statistics.pending}</p>
                </div>
                <div className="p-3 rounded-xl" style={{backgroundColor: '#FFF8E1'}}>
                  <FiClock size={24} color="#FDA811" />
                </div>
              </div>
            </div>

            {/* Processing */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Processing</p>
                  <p className="text-2xl font-bold" style={{color: '#4A90E2'}}>{statistics.processing}</p>
                </div>
                <div className="p-3 rounded-xl" style={{backgroundColor: '#E3F2FD'}}>
                  <FiSettings size={24} color="#4A90E2" />
                </div>
              </div>
            </div>

            {/* Ready */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Ready</p>
                  <p className="text-2xl font-bold" style={{color: '#4CAF50'}}>{statistics.ready}</p>
                </div>
                <div className="p-3 rounded-xl" style={{backgroundColor: '#E8F5E8'}}>
                  <FiCheckCircle size={24} color="#4CAF50" />
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-gray-700">{statistics.completed}</p>
                </div>
                <div className="p-3 rounded-xl" style={{backgroundColor: '#F5F5F5'}}>
                  <FiUser size={24} color="#6B7280" />
                </div>
              </div>
            </div>

            {/* Issues */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Issues</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.issues}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50">
                  <FiXCircle size={24} color="#DC2626" />
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                  <p className="text-xl font-bold" style={{color: '#4CAF50'}}>₱{statistics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl" style={{backgroundColor: '#E8F5E8'}}>
                  <FiDollarSign size={24} color="#4CAF50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 pb-8">
        {/* Modern Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Certificate Requests ({filteredRequests.length})
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FiCalendar size={16} />
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Certificate Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type & Copies</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount Due</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{backgroundColor: '#E3F2FD'}}
                        >
                          <FiFileText size={20} color="#4A90E2" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">#{request.id}</p>
                          <p className="text-sm text-gray-600">
                            {request.deceased ? 
                              `${request.deceased.firstName} ${request.deceased.middleName || ''} ${request.deceased.lastName}`.trim() : 
                              'General Certificate'
                            }
                          </p>
                          <p className="text-xs text-gray-500">{new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-6">
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.requester ? `${request.requester.fullNameFirst} ${request.requester.fullNameLast}` : 'N/A'}
                        </p>
                        {(request as any).relationshipToDeceased && (
                          <p className="text-sm text-gray-600">{(request as any).relationshipToDeceased}</p>
                        )}
                        {(request as any).purpose && (
                          <p className="text-xs text-gray-500">{(request as any).purpose}</p>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-6">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {request.certificateType}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">{request.copies} {request.copies === 1 ? 'copy' : 'copies'}</p>
                      </div>
                    </td>
                    
                    <td className="px-6 py-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        ['READY_FOR_PICKUP', 'CLAIMED'].includes(request.status) ? 'bg-green-100 text-green-800' :
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        ['SUBMITTED', 'FOR_PAYMENT'].includes(request.status) ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    
                    <td className="px-6 py-6">
                      <div className="text-lg font-semibold" style={{color: '#4CAF50'}}>
                        ₱{(request.amountDue || 0).toLocaleString()}
                      </div>
                      {request.orNumber && (
                        <p className="text-xs text-gray-500">OR: {request.orNumber}</p>
                      )}
                    </td>
                    
                    <td className="px-6 py-6">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowOverrideModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <span className="mr-1">
                          <FiSettings size={16} />
                        </span>
                        Admin Override
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center">
                      <div className="mx-auto">
                        <FiAlertCircle size={48} color="#9CA3AF" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No certificate requests found</h3>
                      <p className="mt-1 text-sm text-gray-500">Try adjusting your filters to see more results.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enhanced Admin Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-slideUp">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-red-50">
                <FiSettings size={24} color="#DC2626" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Admin Override</h3>
                <p className="text-sm text-gray-600">Certificate Request #{selectedRequest?.id}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Override Action</label>
                <select 
                  value={overrideAction} 
                  onChange={(e) => setOverrideAction(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="approve">Force Approve & Ready for Pickup</option>
                  <option value="reject">Force Reject</option>
                  <option value="waive_fee">Waive Fee & Approve</option>
                  <option value="expedite">Expedite Processing</option>
                  <option value="adjust_fee">Adjust Fee Amount</option>
                </select>
              </div>

              {overrideAction === 'adjust_fee' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Amount (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="Enter new amount..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Override Reason *</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Please provide a detailed reason for this admin override..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowOverrideModal(false);
                  setSelectedRequest(null);
                  setOverrideReason('');
                  setNewAmount('');
                }}
                className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!overrideReason.trim() || (overrideAction === 'adjust_fee' && !newAmount)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Execute Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}