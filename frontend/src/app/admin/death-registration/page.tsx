"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  FiClock, 
  FiAlertTriangle, 
  FiDollarSign, 
  FiFileText, 
  FiRefreshCw,
  FiShield,
  FiLock
} from 'react-icons/fi';

interface Registration {
  id: number;
  registrationType: string;
  status: string;
  amountDue?: number;
  orNumber?: string;
  createdAt: string;
  updatedAt: string;
  deceased?: {
    id: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    dateOfBirth?: string;
    dateOfDeath?: string;
    age?: number;
  };
  submitter?: {
    id: number;
    fullNameFirst: string;
    fullNameMiddle?: string;
    fullNameLast: string;
    email: string;
  };
}

export default function AdminDeathRegistrationIndex() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideAction, setOverrideAction] = useState('approve');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin");
      return;
    }
    fetchRegistrations();
  }, [session, status, router]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/death-registrations');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch registrations:', errorData);
        
        if (response.status === 503) {
          console.warn('Backend service unavailable');
        } else if (response.status === 429) {
          console.warn('Rate limited');
        }
        
        throw new Error(errorData.error || 'Failed to fetch registrations');
      }
      
      const data = await response.json();
      setRegistrations(data.registrations || data.data || []);
      console.log('Successfully fetched registrations:', data.registrations?.length || 0);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!selectedRegistration || !overrideReason.trim()) return;

    setOverrideLoading(true);
    try {
      console.log(`Executing admin override: ${overrideAction} on registration ${selectedRegistration.id}`);
      
      const response = await fetch(`/api/death-registrations/${selectedRegistration.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: overrideAction,
          reason: overrideReason,
          adminId: session?.user?.id
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Override successful:', result);
        alert(`Override "${overrideAction}" executed successfully`);
        fetchRegistrations();
        setShowOverrideModal(false);
        setSelectedRegistration(null);
        setOverrideReason('');
      } else {
        console.error('Override failed:', result);
        alert(`Override failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Override error:', error);
      alert('Override failed due to connection error. Please try again.');
    } finally {
      setOverrideLoading(false);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (filter === 'all') return true;
    if (filter === 'regular') return reg.registrationType === 'REGULAR';
    if (filter === 'delayed') return reg.registrationType === 'DELAYED';
    if (filter === 'pending') return ['pending_verification', 'submitted'].includes(reg.status);
    if (filter === 'issues') return ['rejected', 'returned'].includes(reg.status);
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
      <div className="p-8 space-y-8">
        {/* Enhanced Header Section */}
        <div className="relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Subtle gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-orange-400" 
               style={{background: 'linear-gradient(90deg, #4CAF50 0%, #4A90E2 50%, #FDA811 100%)'}}></div>
          
          <div className="p-8">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                {/* Modern icon badge */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md" 
                       style={{background: 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)'}}>
                    <FiFileText size={28} color="white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" 
                       style={{backgroundColor: '#FDA811'}}>
                    <FiShield size={12} color="white" />
                  </div>
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Death Registration Management</h1>
                  <p className="text-gray-600 text-lg mb-4">Administrative oversight and control dashboard</p>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: '#4CAF50'}}></div>
                      <span className="text-sm font-medium text-gray-700">Live Data</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#FDA811'}}></div>
                      <span className="text-sm font-medium text-gray-700">Override Authority</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                {/* Modern stats display */}
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                    {registrations.length}
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Records</div>
                </div>
                
                {/* Modern refresh button */}
                <button 
                  onClick={fetchRegistrations}
                  className="group px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center space-x-2 border border-blue-200"
                  style={{backgroundColor: '#4A90E2', color: 'white'}}
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

        {/* Enhanced Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-3xl font-bold text-gray-900">{registrations.length}</p>
                <p className="text-xs text-gray-500 mt-1">All time records</p>
              </div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{backgroundColor: '#E8F5E8'}}>
                <FiFileText size={32} color="#4CAF50" />
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{backgroundColor: '#4CAF50', width: '100%'}}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900">
                  {registrations.filter(r => ['pending_verification', 'submitted', 'SUBMITTED', 'PENDING_VERIFICATION', 'PROCESSING'].includes(r.status)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{backgroundColor: '#FFF3E0'}}>
                <FiClock size={32} color="#FDA811" />
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full" 
                style={{
                  backgroundColor: '#FDA811', 
                  width: `${registrations.length ? (registrations.filter(r => ['pending_verification', 'submitted', 'SUBMITTED', 'PENDING_VERIFICATION', 'PROCESSING'].includes(r.status)).length / registrations.length) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Issues & Rejections</p>
                <p className="text-3xl font-bold text-gray-900">
                  {registrations.filter(r => ['rejected', 'returned', 'REJECTED', 'RETURNED'].includes(r.status)).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Override candidates</p>
              </div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{backgroundColor: '#FFEBEE'}}>
                <FiAlertTriangle size={32} color="#EF4444" />
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-red-500" 
                style={{
                  width: `${registrations.length ? (registrations.filter(r => ['rejected', 'returned', 'REJECTED', 'RETURNED'].includes(r.status)).length / registrations.length) * 100 : 0}%`
                }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₱{registrations.reduce((sum, r) => {
                    const amount = parseFloat(String(r.amountDue || 0)) || 0;
                    return sum + amount;
                  }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Processing fees</p>
              </div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{backgroundColor: '#E3F2FD'}}>
                <FiDollarSign size={32} color="#4A90E2" />
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{backgroundColor: '#4A90E2', width: '85%'}}></div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-800">Filter & Control Panel</h3>
              <div className="flex flex-wrap gap-2">
                {['all', 'regular', 'delayed', 'pending', 'issues'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      filter === filterType 
                        ? 'text-white shadow-lg' 
                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{
                      backgroundColor: filter === filterType ? '#4CAF50' : undefined
                    }}
                  >
                    {filterType === 'all' ? 'All Registrations' :
                     filterType === 'regular' ? 'Regular' :
                     filterType === 'delayed' ? 'Delayed' :
                     filterType === 'pending' ? 'Pending' : 'Issues'}
                    <span className="ml-2 text-xs opacity-75">
                      ({filteredRegistrations.filter(r => {
                        if (filterType === 'all') return true;
                        if (filterType === 'regular') return r.registrationType === 'REGULAR';
                        if (filterType === 'delayed') return r.registrationType === 'DELAYED';
                        if (filterType === 'pending') return ['pending_verification', 'submitted'].includes(r.status);
                        if (filterType === 'issues') return ['rejected', 'returned'].includes(r.status);
                        return false;
                      }).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg" style={{backgroundColor: '#FFF3E0'}}>
                <FiShield size={16} color="#FDA811" />
                <span className="text-sm font-medium" style={{color: '#FDA811'}}>Admin Override Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Registration Records Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-8 py-6" style={{backgroundColor: '#F8F9FA', borderBottom: '1px solid #E9ECEF'}}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {filter === 'all' ? 'All Registrations' : 
                   filter === 'regular' ? 'Regular Registrations' :
                   filter === 'delayed' ? 'Delayed Registrations' :
                   filter === 'pending' ? 'Pending Review' : 'Issues & Rejections'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredRegistrations.length} records • Click any row to view details
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 rounded-full flex items-center space-x-2" style={{backgroundColor: '#E8F5E8'}}>
                  <FiShield size={14} color="#4CAF50" />
                  <span className="text-sm font-medium" style={{color: '#4CAF50'}}>
                    Override Authority Active
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{backgroundColor: '#FBFBFB'}}>
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Registration ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Type & Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Deceased Information
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status & Progress
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Financial Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Admin Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredRegistrations.map((reg, index) => (
                  <tr 
                    key={reg.id} 
                    className={`border-b border-gray-100 hover:shadow-md transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                          style={{backgroundColor: '#4A90E2'}}
                        >
                          {reg.id}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">REG-{reg.id.toString().padStart(4, '0')}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(reg.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <span 
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            reg.registrationType === 'REGULAR' 
                              ? 'text-white' 
                              : 'text-white'
                          }`}
                          style={{
                            backgroundColor: reg.registrationType === 'REGULAR' ? '#4CAF50' : '#FDA811'
                          }}
                        >
                          {reg.registrationType}
                        </span>
                        {reg.registrationType === 'DELAYED' && (
                          <div className="text-xs text-orange-600 font-medium flex items-center space-x-1">
                            <FiAlertTriangle size={12} />
                            <span>High Priority</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {reg.deceased ? `${reg.deceased.firstName} ${reg.deceased.middleName || ''} ${reg.deceased.lastName}`.trim() : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Death: {reg.deceased?.dateOfDeath ? new Date(reg.deceased.dateOfDeath).toLocaleDateString() : 'N/A'}
                        </div>
                        {reg.deceased?.age && (
                          <div className="text-xs text-gray-500">Age: {reg.deceased.age} years</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <span 
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            reg.status === 'approved' || reg.status === 'for_pickup' || reg.status === 'REGISTERED' ? 'text-white' :
                            reg.status === 'rejected' || reg.status === 'REJECTED' ? 'text-white' :
                            reg.status === 'pending_verification' || reg.status === 'submitted' || reg.status === 'SUBMITTED' || reg.status === 'PENDING_VERIFICATION' ? 'text-white' :
                            'bg-gray-100 text-gray-800'
                          }`}
                          style={{
                            backgroundColor: 
                              reg.status === 'approved' || reg.status === 'for_pickup' || reg.status === 'REGISTERED' || reg.status === 'FOR_PICKUP' ? '#4CAF50' :
                              reg.status === 'rejected' || reg.status === 'REJECTED' || reg.status === 'returned' || reg.status === 'RETURNED' ? '#FF5252' :
                              reg.status === 'pending_verification' || reg.status === 'submitted' || reg.status === 'SUBMITTED' || reg.status === 'PENDING_VERIFICATION' || reg.status === 'PROCESSING' ? '#FDA811' :
                              '#9E9E9E'
                          }}
                        >
                          {reg.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: 
                                reg.status === 'approved' || reg.status === 'for_pickup' || reg.status === 'REGISTERED' || reg.status === 'FOR_PICKUP' ? '#4CAF50' :
                                reg.status === 'rejected' || reg.status === 'REJECTED' ? '#FF5252' :
                                '#FDA811',
                              width: 
                                reg.status === 'approved' || reg.status === 'for_pickup' || reg.status === 'REGISTERED' || reg.status === 'FOR_PICKUP' ? '100%' :
                                reg.status === 'rejected' || reg.status === 'REJECTED' ? '25%' :
                                '60%'
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-lg font-bold" style={{color: '#4CAF50'}}>
                          ₱{(reg.amountDue || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {reg.amountDue === 0 ? 'Fee Waived' : 'Outstanding'}
                        </div>
                        {reg.orNumber && (
                          <div className="text-xs text-gray-500">OR: {reg.orNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <button
                        onClick={() => {
                          setSelectedRegistration(reg);
                          setShowOverrideModal(true);
                        }}
                      className="px-4 py-2 rounded-lg font-bold text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center space-x-2"
                      style={{backgroundColor: '#FDA811'}}
                      >
                        <FiLock size={16} />
                        <span>Override</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Admin Override Modal */}
        {showOverrideModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slideUp">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{backgroundColor: '#FFF3E0'}}
                  >
                    <FiShield size={24} color="#FDA811" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Administrative Override</h3>
                    <p className="text-sm text-gray-600">
                      Registration #{selectedRegistration?.id} - {selectedRegistration?.registrationType}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-8 py-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Override Action
                  </label>
                  <select 
                    value={overrideAction} 
                    onChange={(e) => setOverrideAction(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="approve">Force Approve Registration</option>
                    <option value="reject">Force Reject Registration</option>
                    <option value="edit">Mark for Editing</option>
                    <option value="waive_fee">Waive Processing Fee</option>
                    <option value="reset_status">Reset Status to Submitted</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Justification for Override <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Provide detailed reasoning for this administrative override. This will be logged for audit purposes..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                    rows={4}
                    required
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      This action will be recorded in the audit log
                    </span>
                    <span className="text-xs text-gray-400">
                      {overrideReason.length}/500
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowOverrideModal(false);
                      setSelectedRegistration(null);
                      setOverrideReason('');
                    }}
                    disabled={overrideLoading}
                    className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOverride}
                    disabled={!overrideReason.trim() || overrideLoading}
                    className="px-8 py-3 text-white rounded-xl font-bold disabled:opacity-50 flex items-center gap-3 transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                    style={{backgroundColor: '#FDA811'}}
                  >
                    {overrideLoading && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    )}
                    {overrideLoading ? 'Processing Override...' : 'Execute Override'}
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
