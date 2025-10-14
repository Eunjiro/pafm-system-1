"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  FiFileText, FiUser, FiCalendar, FiMapPin, 
  FiCheckCircle, FiXCircle, FiClock, FiEye,
  FiDownload, FiEdit3, FiSearch, FiFilter,
  FiRefreshCw, FiAlertTriangle, FiDollarSign,
  FiUpload, FiMail, FiPhone, FiShield
} from 'react-icons/fi'
import { MdAssignment, MdPayment, MdVerifiedUser, MdPrint, MdLocationOn } from 'react-icons/md'
import { GiCoffin } from 'react-icons/gi'
import Link from "next/link"

interface BurialPermit {
  id: string
  permitNumber: string
  deceased: {
    firstName: string
    middleName?: string
    lastName: string
    dateOfBirth: string
    dateOfDeath: string
    placeOfDeath: string
    deathCertificateNumber?: string
  }
  applicant: {
    name: string
    relationship: string
    contactNumber: string
    address: string
    email?: string
  }
  burialDetails: {
    cemetery: string
    section?: string
    block?: string
    plotNumber?: string
    burialDate: string
    burialTime: string
  }
  status: 'submitted' | 'pending_verification' | 'for_payment' | 'paid' | 'issued' | 'for_pickup' | 'claimed' | 'returned' | 'rejected'
  permitType: 'burial' | 'entrance' | 'niche'
  submittedAt: string
  submittedBy: string
  assignedTo?: string
  documents: Array<{
    type: string
    fileName: string
    uploadedAt: string
  }>
  payment?: {
    amount: number
    orNumber?: string
    paidAt?: string
    feeType: 'burial' | 'entrance' | 'child_niche' | 'adult_niche'
  }
  priority: 'high' | 'medium' | 'low'
  notes?: string
}

export default function BurialPermitsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [permits, setPermits] = useState<BurialPermit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPermit, setSelectedPermit] = useState<BurialPermit | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  useEffect(() => {
    const fetchPermits = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/permits?type=burial')
        
        if (!response.ok) {
          throw new Error('Failed to fetch burial permits')
        }
        
        const data = await response.json()
        setPermits(data.permits || [])
      } catch (error) {
        console.error('Error fetching permits:', error)
        setPermits([])
      } finally {
        setLoading(false)
      }
    }

    fetchPermits()
  }, [])

  const handleStatusUpdate = async (permitId: string, newStatus: string, notes?: string) => {
    try {
      console.log('Updating permit status:', permitId, newStatus, notes)
      
      setPermits(prev => prev.map(permit => 
        permit.id === permitId ? { ...permit, status: newStatus as any } : permit
      ))
      
      setShowApprovalModal(false)
      setSelectedPermit(null)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleApprove = (permit: BurialPermit) => {
    setSelectedPermit(permit)
    setShowApprovalModal(true)
  }

  const filteredPermits = permits.filter(permit => {
    const matchesStatus = filterStatus === 'all' || permit.status === filterStatus
    const matchesSearch = 
      permit.deceased.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.deceased.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.permitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permit.applicant.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    const colors = {
      'submitted': 'bg-blue-100 text-blue-800',
      'pending_verification': 'bg-yellow-100 text-yellow-800',
      'for_payment': 'bg-orange-100 text-orange-800',
      'paid': 'bg-green-100 text-green-800',
      'issued': 'bg-green-100 text-green-800',
      'for_pickup': 'bg-teal-100 text-teal-800',
      'claimed': 'bg-gray-100 text-gray-800',
      'returned': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'border-l-4 border-red-500',
      'medium': 'border-l-4 border-yellow-500',
      'low': 'border-l-4 border-green-500'
    }
    return colors[priority as keyof typeof colors] || ''
  }

  const getFeeAmount = (permitType: string, feeType?: string) => {
    const fees = {
      'burial': 100,
      'entrance': 100,
      'child_niche': 750,
      'adult_niche': 1500
    }
    return fees[feeType as keyof typeof fees] || fees.burial
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3 text-brown-600">
                <GiCoffin size={24} />
              </span>
              Burial Permits
            </h1>
            <p className="text-gray-600">Manage burial permit applications (₱100 - ₱1,500 fees)</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <span className="mr-2">
                <FiRefreshCw size={16} />
              </span>
              Refresh
            </button>
            <Link
              href="/admin/permits/burial/new"
              className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90 flex items-center"
              style={{backgroundColor: '#4CAF50'}}
            >
              <span className="mr-2">
                <FiFileText size={16} />
              </span>
              New Permit
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-blue-600 mr-3">
                <FiFileText size={20} />
              </span>
              <div>
                <p className="text-sm text-blue-600">Total Applications</p>
                <p className="text-xl font-bold text-blue-900">{permits.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-3">
                <FiClock size={20} />
              </span>
              <div>
                <p className="text-sm text-yellow-600">Pending Review</p>
                <p className="text-xl font-bold text-yellow-900">
                  {permits.filter(p => p.status === 'pending_verification').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-orange-600 mr-3">
                <FiDollarSign size={20} />
              </span>
              <div>
                <p className="text-sm text-orange-600">For Payment</p>
                <p className="text-xl font-bold text-orange-900">
                  {permits.filter(p => p.status === 'for_payment').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-600 mr-3">
                <FiCheckCircle size={20} />
              </span>
              <div>
                <p className="text-sm text-green-600">Issued</p>
                <p className="text-xl font-bold text-green-900">
                  {permits.filter(p => ['issued', 'for_pickup'].includes(p.status)).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-gray-600 mr-3">
                <MdVerifiedUser size={20} />
              </span>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900">
                  {permits.filter(p => p.status === 'claimed').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FiSearch size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by name, permit number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">
                <FiFilter size={16} />
              </span>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="for_payment">For Payment</option>
                <option value="paid">Paid</option>
                <option value="issued">Issued</option>
                <option value="for_pickup">For Pickup</option>
                <option value="claimed">Claimed</option>
                <option value="returned">Returned</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
              <span className="mr-2">
                <FiDownload size={16} />
              </span>
              Export
            </button>
            <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
              <span className="mr-2">
                <MdPrint size={16} />
              </span>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Permits List */}
      <div className="space-y-4">
        {filteredPermits.map((permit) => (
          <div 
            key={permit.id} 
            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${getPriorityColor(permit.priority)}`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {permit.deceased.firstName} {permit.deceased.middleName} {permit.deceased.lastName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(permit.status)}`}>
                      {permit.status.replace('_', ' ').toUpperCase()}
                    </span>
                    {permit.priority === 'high' && (
                      <span className="text-red-500">
                        <FiAlertTriangle size={16} />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Permit: {permit.permitNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    Applicant: {permit.applicant.name} ({permit.applicant.relationship})
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{new Date(permit.submittedAt).toLocaleDateString()}</p>
                  <p>{new Date(permit.submittedAt).toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Cemetery</p>
                  <p className="text-sm text-gray-600">{permit.burialDetails.cemetery}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Burial Date</p>
                  <p className="text-sm text-gray-600">
                    {new Date(permit.burialDetails.burialDate).toLocaleDateString()} at {permit.burialDetails.burialTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Death Certificate</p>
                  <p className="text-sm text-gray-600">{permit.deceased.deathCertificateNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Documents</p>
                  <p className="text-sm text-gray-600">{permit.documents.length} files uploaded</p>
                </div>
              </div>

              {permit.payment && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-green-600 mr-2">
                        <MdPayment size={16} />
                      </span>
                      <span className="text-sm font-medium">Fee: ₱{permit.payment.amount} ({permit.payment.feeType})</span>
                    </div>
                    {permit.payment.orNumber && (
                      <span className="text-sm text-gray-600">OR: {permit.payment.orNumber}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedPermit(permit)
                      setShowDetailsModal(true)
                    }}
                    className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <span className="mr-1">
                      <FiEye size={14} />
                    </span>
                    View Details
                  </button>
                  {permit.status === 'pending_verification' && (
                    <button
                      onClick={() => handleApprove(permit)}
                      className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <span className="mr-1">
                        <FiCheckCircle size={14} />
                      </span>
                      Review & Approve
                    </button>
                  )}
                  <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="mr-1">
                      <FiDownload size={14} />
                    </span>
                    Download
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  Priority: <span className={`font-medium ${
                    permit.priority === 'high' ? 'text-red-600' :
                    permit.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                  }`}>{permit.priority.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPermits.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <span className="mx-auto text-gray-400 mb-4 block">
            <FiFileText size={48} />
          </span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No permits found</h3>
          <p className="text-gray-600">No burial permits match your current search and filter criteria.</p>
        </div>
      )}
    </div>
  )
}