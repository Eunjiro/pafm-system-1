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
  documents?: Array<{
    id: number;
    docType: string;
    uploadedAt: string;
    document: {
      id: number;
      fileName: string;
      filePath: string;
      mimeType?: string;
    };
  }>;
}

export default function AdminDeathRegistrationIndex() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Array<{
    id: number;
    docType: string;
    fileName: string;
    filePath: string;
    uploadedAt: string;
    mimeType?: string;
  }>>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<Registration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const registrations = data.registrations || data.data || [];
      
      // Log to see the structure of documents
      if (registrations.length > 0) {
        console.log('Sample registration with documents:', {
          id: registrations[0].id,
          documents: registrations[0].documents,
          documentsCount: registrations[0].documents?.length
        });
      }
      
      setRegistrations(registrations);
      console.log('Successfully fetched registrations:', registrations.length);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Pending' },
      UNDER_REVIEW: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Under Review' },
      APPROVED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Approved' },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Rejected' },
      COMPLETED: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Completed' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        {config.label}
      </span>
    )
  }

  const canUpdateStatus = (currentStatus: string) => {
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['UNDER_REVIEW', 'REJECTED'],
      UNDER_REVIEW: ['APPROVED', 'REJECTED'],
      APPROVED: ['COMPLETED'],
      REJECTED: [],
      COMPLETED: []
    }
    return allowedTransitions[currentStatus]?.length > 0
  }

  const getNextStatuses = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      PENDING: ['UNDER_REVIEW', 'REJECTED'],
      UNDER_REVIEW: ['APPROVED', 'REJECTED'],
      APPROVED: ['COMPLETED'],
      REJECTED: [],
      COMPLETED: []
    }
    return transitions[currentStatus] || []
  }

  const handleViewDocuments = (registration: Registration) => {
    console.log('handleViewDocuments called', {
      registrationId: registration.id,
      documentsCount: registration.documents?.length,
      documents: registration.documents
    });
    
    // Map the nested structure to flat structure for display
    const mappedDocs = (registration.documents || []).map(doc => ({
      id: doc.document.id,
      docType: doc.docType,
      fileName: doc.document.fileName,
      filePath: doc.document.filePath,
      uploadedAt: doc.uploadedAt,
      mimeType: doc.document.mimeType
    }));
    
    console.log('Mapped documents:', mappedDocs);
    setSelectedDocuments(mappedDocs);
    setShowDocumentsModal(true);
    console.log('Modal should be open now');
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !selectedRegistration) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/death-registrations/${selectedRegistration.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any)?.accessToken}`
        },
        body: JSON.stringify({
          status: newStatus,
          comment: statusComment
        })
      });

      if (response.ok) {
        console.log('Status update successful');
        alert('Status updated successfully');
        fetchRegistrations();
        setShowStatusModal(false);
        setSelectedRegistration(null);
        setNewStatus('');
        setStatusComment('');
      } else {
        const result = await response.json();
        console.error('Status update failed:', result);
        alert(`Status update failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Status update failed due to connection error. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!registrationToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/death-registrations/${registrationToDelete.id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${(session as any)?.accessToken}`
        }
      });

      if (response.ok) {
        console.log('Delete successful');
        alert('Death registration deleted successfully');
        fetchRegistrations();
        setShowDeleteModal(false);
        setRegistrationToDelete(null);
      } else {
        const result = await response.json();
        console.error('Delete failed:', result);
        alert(`Delete failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed due to connection error. Please try again.');
    } finally {
      setIsDeleting(false);
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
                    Documents
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
                        onClick={() => handleViewDocuments(reg)}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          reg.documents && reg.documents.length > 0 
                            ? 'hover:shadow-md cursor-pointer' 
                            : 'cursor-not-allowed opacity-50'
                        }`}
                        style={{ 
                          backgroundColor: reg.documents && reg.documents.length > 0 ? '#4A90E2' : '#E0E0E0',
                          color: reg.documents && reg.documents.length > 0 ? 'white' : '#757575'
                        }}
                        disabled={!reg.documents || reg.documents.length === 0}
                      >
                        <FiFileText className="mr-2" size={14} />
                        <span>View Files</span>
                        {reg.documents && reg.documents.length > 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-white bg-opacity-30">
                            {reg.documents.length}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <a
                          href={`/admin/death-registration/${reg.id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </a>
                        
                        {canUpdateStatus(reg.status) && (
                          <button
                            onClick={() => {
                              setSelectedRegistration(reg);
                              setShowStatusModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            style={{ backgroundColor: '#FDA811', color: 'white' }}
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Update
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setRegistrationToDelete(reg);
                            setShowDeleteModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modern Status Update Modal */}
        {showStatusModal && selectedRegistration && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 animate-slideUp">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Update Registration Status</h3>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Status
                    </label>
                    <div className="flex">
                      {getStatusBadge(selectedRegistration.status)}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    >
                      <option value="">Select new status...</option>
                      {getNextStatuses(selectedRegistration.status).map((status: string) => (
                        <option key={status} value={status}>
                          {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (Optional)
                    </label>
                    <textarea
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      placeholder="Add any comments about this status change..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || isUpdating}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !newStatus || isUpdating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'text-white hover:opacity-90'
                    }`}
                    style={!newStatus || isUpdating ? {} : { backgroundColor: '#4CAF50' }}
                  >
                    {isUpdating ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Review Modal */}
        {showDocumentsModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{backgroundColor: '#E3F2FD'}}>
                      <FiFileText size={24} color="#4A90E2" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Uploaded Documents</h3>
                      <p className="text-sm text-gray-600">{selectedDocuments.length} document(s) uploaded by citizen</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDocumentsModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {selectedDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDocuments.map((doc) => (
                      <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <FiFileText size={20} color="#4A90E2" />
                              <h4 className="text-sm font-semibold text-gray-900">{doc.docType}</h4>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">{doc.fileName}</p>
                            <p className="text-xs text-gray-400">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={`http://localhost:3001${doc.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 text-center text-xs font-medium text-white rounded-lg transition-colors"
                            style={{backgroundColor: '#4A90E2'}}
                          >
                            View Document
                          </a>
                          <a
                            href={`http://localhost:3001${doc.filePath}`}
                            download
                            className="flex-1 px-3 py-2 text-center text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#F5F5F5'}}>
                      <FiFileText size={32} color="#9E9E9E" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Documents Uploaded</h4>
                    <p className="text-sm text-gray-600">This registration does not have any documents yet.</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDocumentsModal(false)}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && registrationToDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 animate-slideUp relative">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Delete Death Registration</h3>
                  </div>
                  <button
                    onClick={() => !isDeleting && setShowDeleteModal(false)}
                    disabled={isDeleting}
                    className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to delete this death registration? This action cannot be undone.
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-red-900">
                      Registration #{registrationToDelete.id}
                    </p>
                    {registrationToDelete.deceased && (
                      <p className="text-sm text-red-700">
                        Deceased: {registrationToDelete.deceased.firstName} {registrationToDelete.deceased.lastName}
                      </p>
                    )}
                    <p className="text-sm text-red-700">
                      Type: {registrationToDelete.registrationType}
                    </p>
                    <p className="text-sm text-red-700">
                      Status: {registrationToDelete.status}
                    </p>
                  </div>

                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Warning:</strong> This will permanently delete:
                    </p>
                    <ul className="text-xs text-yellow-700 list-disc list-inside mt-2 space-y-1">
                      <li>The death registration record</li>
                      <li>Associated deceased information</li>
                      <li>All uploaded documents ({registrationToDelete.documents?.length || 0} files)</li>
                      <li>All related database records</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isDeleting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Permanently
                      </>
                    )}
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
