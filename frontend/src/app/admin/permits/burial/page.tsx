"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiShield, FiFileText, FiUser, FiAlertTriangle, FiCheckCircle, FiDollarSign, FiRefreshCw, FiEye, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

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

export default function BurialPermitsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "ADMIN") {
      router.replace("/auth/signin");
      return;
    }
    fetchBurialPermits();
  }, [session, status, router]);

  const fetchBurialPermits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/permits?permitType=burial');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch burial permits');
      }
      const data = await response.json();
      setPermits(data.permits || []);
    } catch (error) {
      console.error('Error fetching burial permits:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch burial permits');
      setPermits([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'submitted': 'bg-yellow-100 text-yellow-800',
      'pending_verification': 'bg-blue-100 text-blue-800',
      'for_payment': 'bg-orange-100 text-orange-800',
      'paid': 'bg-purple-100 text-purple-800',
      'issued': 'bg-green-100 text-green-800',
      'for_pickup': 'bg-green-100 text-green-800',
      'claimed': 'bg-gray-100 text-gray-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const getWorkflowProgress = (status: string) => {
    const steps = ['submitted', 'pending_verification', 'for_payment', 'paid', 'issued', 'claimed'];
    const currentIndex = steps.indexOf(status);
    const progress = currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
    return Math.min(progress, 100);
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 rounded-2xl mx-6">
        <div 
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)'
          }}
        />
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/permits" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <FiArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{backgroundColor: '#4A90E2'}}
              >
                <div className="text-white">
                  <FiUser size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Burial Permits</h1>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600 font-medium">Cemetery Burial Authorization</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{permits.length} Burial Permits</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Fee Range</p>
                <p className="text-sm font-medium text-gray-900">₱100 - ₱1,500</p>
              </div>
              <button 
                onClick={fetchBurialPermits}
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

      <div className="p-6 space-y-6">
        {/* Error Messages */}
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Burial Permits</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{permits.length}</p>
                <p className="text-sm text-gray-500 mt-1">All burial requests</p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md bg-blue-500">
                <div className="text-white">
                  <FiUser size={24} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {permits.filter(p => ['submitted', 'pending_verification'].includes(p.status)).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Awaiting review</p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md bg-yellow-500">
                <div className="text-white">
                  <FiFileText size={24} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Ready for Pickup</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {permits.filter(p => ['issued', 'for_pickup'].includes(p.status)).length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Permits issued</p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md bg-green-500">
                <div className="text-white">
                  <FiCheckCircle size={24} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Revenue</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  ₱{permits.reduce((sum, p) => sum + (p.amountDue || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total burial fees</p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md bg-purple-500">
                <div className="text-white">
                  <FiDollarSign size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Burial Permits Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500">
                  <div className="text-white">
                    <FiUser size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Burial Permit Requests</h3>
                  <p className="text-sm text-gray-500">
                    {permits.length} burial permits • Cemetery authorization workflow
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">Live Data</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deceased Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permits.map((permit) => (
                  <tr key={permit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{permit.id}</td>
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(permit.status)}`}>
                        {permit.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${getWorkflowProgress(permit.status)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{Math.round(getWorkflowProgress(permit.status))}% Complete</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{permit.amountDue || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedPermit(permit);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {permits.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FiUser size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No burial permits found</h3>
                <p className="text-gray-500">No burial permit requests have been submitted yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}