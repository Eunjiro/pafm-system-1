"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiShield, FiFileText, FiClock, FiAlertTriangle, FiCheckCircle, FiDollarSign, FiRefreshCw, FiFilter, FiUser, FiCalendar, FiPlus, FiEye, FiDownload, FiUpload } from "react-icons/fi";

interface Permit {
  id: number;
  permitType: 'burial' | 'exhumation' | 'cremation';
  status: string;
  amountDue?: number;
  orNumber?: string;
  createdAt: string;
  issuedAt?: string;
  pickupStatus?: 'not_ready' | 'ready_for_pickup' | 'claimed';
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
  remarks?: string;
}

type PermitSubmodule = 'all' | 'burial' | 'exhumation' | 'cremation';

interface PermitWorkflowStep {
  step: string;
  status: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  isActive: boolean;
  isCompleted: boolean;
}

export default function AdminPermitsIndex() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubmodule, setActiveSubmodule] = useState<PermitSubmodule>('all');
  const [filter, setFilter] = useState('all');
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
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

  const getFilteredPermits = () => {
    let filtered = permits;
    
    // Filter by permit type (submodule)
    if (activeSubmodule !== 'all') {
      filtered = filtered.filter(permit => permit.permitType === activeSubmodule);
    }
    
    // Filter by status
    if (filter !== 'all') {
      switch (filter) {
        case 'pending':
          filtered = filtered.filter(permit => ['submitted', 'pending_verification', 'for_payment'].includes(permit.status));
          break;
        case 'processing':
          filtered = filtered.filter(permit => ['paid', 'processing'].includes(permit.status));
          break;
        case 'issued':
          filtered = filtered.filter(permit => ['issued', 'for_pickup'].includes(permit.status));
          break;
        case 'completed':
          filtered = filtered.filter(permit => permit.status === 'claimed');
          break;
        case 'issues':
          filtered = filtered.filter(permit => ['rejected', 'cancelled'].includes(permit.status));
          break;
        default:
          break;
      }
    }
    
    return filtered;
  };

  const getPermitWorkflowSteps = (permit: Permit): PermitWorkflowStep[] => {
    const baseSteps = [
      { step: 'submitted', status: 'Submitted', description: 'Application submitted by citizen', icon: <FiFileText />, color: 'blue' },
      { step: 'pending_verification', status: 'Document Review', description: 'Documents under verification', icon: <FiEye />, color: 'yellow' },
      { step: 'for_payment', status: 'Payment Required', description: 'Payment order generated', icon: <FiDollarSign />, color: 'orange' },
      { step: 'paid', status: 'Payment Confirmed', description: 'Payment verified', icon: <FiCheckCircle />, color: 'green' },
      { step: 'issued', status: 'Permit Issued', description: 'Permit ready for pickup', icon: <FiShield />, color: 'purple' },
      { step: 'claimed', status: 'Completed', description: 'Document claimed by citizen', icon: <FiCheckCircle />, color: 'green' }
    ];

    return baseSteps.map(step => ({
      ...step,
      isActive: permit.status === step.step,
      isCompleted: getStepIndex(permit.status) > getStepIndex(step.step)
    }));
  };

  const getStepIndex = (status: string): number => {
    const stepOrder = ['submitted', 'pending_verification', 'for_payment', 'paid', 'issued', 'claimed'];
    return stepOrder.indexOf(status);
  };

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

  const getPermitTypeDetails = (type: string) => {
    const details = {
      burial: {
        title: 'Burial Permits',
        description: 'Cemetery burial authorization',
        requirements: ['Certified Death Certificate', 'Valid ID', 'Transfer Permit (if applicable)', 'Affidavit of Undertaking (Bagbag/Novaliches)'],
        fees: '₱100 - ₱1,500',
        processTime: '1-2 working days'
      },
      exhumation: {
        title: 'Exhumation Permits',
        description: 'Authorization for remains removal',
        requirements: ['Exhumation Letter (QC Health Dept)', 'Certified Death Certificate', 'Valid ID'],
        fees: '₱100',
        processTime: '1-2 working days'
      },
      cremation: {
        title: 'Cremation Permits',
        description: 'Crematorium authorization',
        requirements: ['Death Certificate', 'Cremation Form (QCHD)', 'Transfer Permit (if applicable)', 'Valid ID'],
        fees: '₱100 - ₱200',
        processTime: '1-2 working days'
      }
    };
    return details[type as keyof typeof details] || details.burial;
  };

  const filteredPermits = getFilteredPermits();

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

        {/* Current Submodule Information */}
        {activeSubmodule !== 'all' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  activeSubmodule === 'burial' ? 'bg-blue-500' :
                  activeSubmodule === 'exhumation' ? 'bg-purple-500' : 'bg-orange-500'
                }`}>
                  <div className="text-white">
                    {activeSubmodule === 'burial' && <FiUser size={24} />}
                    {activeSubmodule === 'exhumation' && <FiFileText size={24} />}
                    {activeSubmodule === 'cremation' && <FiAlertTriangle size={24} />}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 capitalize">
                    {getPermitTypeDetails(activeSubmodule).title}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {getPermitTypeDetails(activeSubmodule).description}
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Required Documents:</p>
                      <ul className="text-xs text-gray-600 mt-1 space-y-1">
                        {getPermitTypeDetails(activeSubmodule).requirements.map((req, idx) => (
                          <li key={idx} className="flex items-center space-x-1">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Fees:</p>
                      <p className="text-xs text-gray-600 mt-1">{getPermitTypeDetails(activeSubmodule).fees}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Processing Time:</p>
                      <p className="text-xs text-gray-600 mt-1">{getPermitTypeDetails(activeSubmodule).processTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Permits</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{filteredPermits.length}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {activeSubmodule === 'all' ? 'All permit types' : `${activeSubmodule} permits`}
                </p>
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
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {filteredPermits.filter(p => ['submitted', 'pending_verification', 'for_payment'].includes(p.status)).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Needs attention</p>
              </div>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                style={{backgroundColor: '#FDA811'}}
              >
                <div className="text-white">
                  <FiClock size={24} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Ready for Pickup</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {filteredPermits.filter(p => ['issued', 'for_pickup'].includes(p.status)).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Awaiting collection</p>
              </div>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                style={{backgroundColor: '#4CAF50'}}
              >
                <div className="text-white">
                  <FiCheckCircle size={24} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Revenue</p>
                <p className="text-3xl font-bold mt-2" style={{color: '#9C27B0'}}>
                  ₱{filteredPermits.reduce((sum, p) => sum + (parseFloat(p.amountDue?.toString() || '0') || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total fees</p>
              </div>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md"
                style={{backgroundColor: '#9C27B0'}}
              >
                <div className="text-white text-2xl font-bold">
                  ₱
                </div>
              </div>
            </div>
          </div>
        </div>

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
                <p className="text-sm text-gray-500">Filter by status and workflow stage</p>
              </div>
            </div>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              style={{minWidth: '200px'}}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="processing">Processing</option>
              <option value="issued">Issued/Ready</option>
              <option value="completed">Completed</option>
              <option value="issues">Issues/Rejected</option>
            </select>
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
                    {activeSubmodule === 'all' ? 'All Permits' : 
                     activeSubmodule === 'burial' ? 'Burial Permits' :
                     activeSubmodule === 'exhumation' ? 'Exhumation Permits' :
                     activeSubmodule === 'cremation' ? 'Cremation Permits' : 'Permits'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {filteredPermits.length} permits • Admin oversight and workflow management
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workflow</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPermits.map((permit) => (
                  <tr key={permit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{permit.id}</td>
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
                      {permit.deceased?.dateOfDeath && (
                        <div className="text-xs text-gray-500">
                          Died: {new Date(permit.deceased.dateOfDeath).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {permit.requester ? `${permit.requester.fullNameFirst} ${permit.requester.fullNameLast}` : 'N/A'}
                      {permit.requester?.email && (
                        <div className="text-xs text-gray-500">{permit.requester.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ['issued', 'for_pickup', 'claimed'].includes(permit.status) ? 'bg-green-100 text-green-800' :
                        ['rejected', 'cancelled'].includes(permit.status) ? 'bg-red-100 text-red-800' :
                        ['submitted', 'pending_verification', 'for_payment'].includes(permit.status) ? 'bg-yellow-100 text-yellow-800' :
                        ['paid', 'processing'].includes(permit.status) ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {permit.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {permit.pickupStatus && permit.pickupStatus !== 'not_ready' && (
                        <div className="mt-1">
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            {permit.pickupStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₱{permit.amountDue || 0}
                      {permit.orNumber && (
                        <div className="text-xs text-gray-500">OR: {permit.orNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        {getPermitWorkflowSteps(permit).slice(0, 3).map((step, idx) => (
                          <div
                            key={idx}
                            className={`w-3 h-3 rounded-full ${
                              step.isCompleted ? 'bg-green-500' :
                              step.isActive ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                            title={step.description}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPermit(permit);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View
                      </button>
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
            
            {filteredPermits.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FiFileText size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No permits found</h3>
                <p className="text-gray-500">
                  {activeSubmodule === 'all' 
                    ? 'No permits match the current filter criteria.'
                    : `No ${activeSubmodule} permits found for the current filter.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Permit Detail Modal */}
        {showDetailModal && selectedPermit && (
          <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto animate-slideUp">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedPermit.permitType === 'burial' ? 'bg-blue-500' :
                      selectedPermit.permitType === 'exhumation' ? 'bg-purple-500' : 'bg-orange-500'
                    }`}>
                      <div className="text-white">
                        {getPermitTypeIcon(selectedPermit.permitType)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedPermit.permitType.charAt(0).toUpperCase() + selectedPermit.permitType.slice(1)} Permit #{selectedPermit.id}
                      </h3>
                      <p className="text-sm text-gray-500">Permit workflow and details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiAlertTriangle size={24} className="rotate-45" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="px-6 py-6 space-y-6">
                {/* Workflow Progress */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Workflow Progress</h4>
                  <div className="space-y-4">
                    {getPermitWorkflowSteps(selectedPermit).map((step, idx) => (
                      <div key={idx} className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.isCompleted ? `bg-green-500` :
                          step.isActive ? `bg-${step.color}-500` : 'bg-gray-300'
                        }`}>
                          <div className="text-white text-sm">
                            {step.isCompleted ? <FiCheckCircle size={16} /> : step.icon}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${
                            step.isActive ? 'text-gray-900' : step.isCompleted ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {step.status}
                          </p>
                          <p className="text-sm text-gray-500">{step.description}</p>
                        </div>
                        {step.isActive && (
                          <div className="text-blue-500 animate-pulse">
                            <FiClock size={16} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permit Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Permit Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Permit Type</label>
                        <p className="text-gray-900 capitalize">{selectedPermit.permitType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Current Status</label>
                        <p className="text-gray-900">{selectedPermit.status.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Amount Due</label>
                        <p className="text-gray-900">₱{selectedPermit.amountDue || 0}</p>
                      </div>
                      {selectedPermit.orNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">OR Number</label>
                          <p className="text-gray-900">{selectedPermit.orNumber}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-700">Submitted</label>
                        <p className="text-gray-900">{new Date(selectedPermit.createdAt).toLocaleString()}</p>
                      </div>
                      {selectedPermit.issuedAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Issued</label>
                          <p className="text-gray-900">{new Date(selectedPermit.issuedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Deceased Information</h4>
                    {selectedPermit.deceased ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Full Name</label>
                          <p className="text-gray-900">
                            {`${selectedPermit.deceased.firstName} ${selectedPermit.deceased.middleName || ''} ${selectedPermit.deceased.lastName} ${selectedPermit.deceased.suffix || ''}`.trim()}
                          </p>
                        </div>
                        {selectedPermit.deceased.dateOfDeath && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Date of Death</label>
                            <p className="text-gray-900">{new Date(selectedPermit.deceased.dateOfDeath).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No deceased information available</p>
                    )}

                    <h4 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Requester Information</h4>
                    {selectedPermit.requester ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Full Name</label>
                          <p className="text-gray-900">{`${selectedPermit.requester.fullNameFirst} ${selectedPermit.requester.fullNameLast}`}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <p className="text-gray-900">{selectedPermit.requester.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No requester information available</p>
                    )}
                  </div>
                </div>

                {selectedPermit.remarks && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Remarks</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedPermit.remarks}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowOverrideModal(true);
                      }}
                      className="px-4 py-2 text-red-600 border border-red-300 rounded-lg font-medium hover:bg-red-50 transition-all duration-200"
                    >
                      Admin Override
                    </button>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Override Modal */}
        {showOverrideModal && selectedPermit && (
          <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn bg-black bg-opacity-50">
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
                    <p className="text-sm text-gray-500">Permit #{selectedPermit?.id} - {selectedPermit?.permitType}</p>
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