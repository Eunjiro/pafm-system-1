"use client"

import { useState, useEffect } from 'react'
import { FiCalendar, FiClock, FiUsers, FiFilter, FiDownload, FiCheckCircle, FiXCircle, FiPrinter, FiEye, FiDollarSign } from 'react-icons/fi'
import { MdQrCode } from 'react-icons/md'

interface Reservation {
  id: number
  bookingCode: string
  requesterName: string
  requesterEmail: string
  requesterPhone: string
  requesterType: string
  reservationDate: string
  startTime: string
  endTime: string
  numberOfGuests: number
  status: string
  paymentStatus: string
  totalAmount: number
  amenity: {
    id: number
    name: string
    type: string
  }
  specialRequests?: string
  createdAt: string
}

export default function AmenityReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterAmenityType, setFilterAmenityType] = useState('ALL')
  const [filterRequesterType, setFilterRequesterType] = useState('ALL')
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' })
  const [sortBy, setSortBy] = useState('date')

  // Stats
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    pending: 0,
    awaitingPayment: 0,
    approved: 0,
    cancelled: 0
  })

  useEffect(() => {
    fetchReservations()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [reservations, filterStatus, filterAmenityType, filterRequesterType, filterDateRange, sortBy])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/parks-recreation/amenity-reservations')
      if (response.ok) {
        const data = await response.json()
        setReservations(data.data || [])
        calculateStats(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: Reservation[]) => {
    const today = new Date().toDateString()
    const thisWeekStart = new Date()
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)

    setStats({
      today: data.filter(r => new Date(r.reservationDate).toDateString() === today).length,
      thisWeek: data.filter(r => new Date(r.reservationDate) >= thisWeekStart).length,
      thisMonth: data.filter(r => new Date(r.reservationDate) >= thisMonthStart).length,
      pending: data.filter(r => r.status === 'PENDING_REVIEW').length,
      awaitingPayment: data.filter(r => r.status === 'AWAITING_PAYMENT').length,
      approved: data.filter(r => r.status === 'APPROVED').length,
      cancelled: data.filter(r => r.status === 'CANCELLED').length
    })
  }

  const applyFilters = () => {
    let filtered = [...reservations]

    // Status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(r => r.status === filterStatus)
    }

    // Amenity type filter
    if (filterAmenityType !== 'ALL') {
      filtered = filtered.filter(r => r.amenity.type === filterAmenityType)
    }

    // Requester type filter
    if (filterRequesterType !== 'ALL') {
      filtered = filtered.filter(r => r.requesterType === filterRequesterType)
    }

    // Date range filter
    if (filterDateRange.start) {
      filtered = filtered.filter(r => new Date(r.reservationDate) >= new Date(filterDateRange.start))
    }
    if (filterDateRange.end) {
      filtered = filtered.filter(r => new Date(r.reservationDate) <= new Date(filterDateRange.end))
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime()
        case 'name':
          return a.requesterName.localeCompare(b.requesterName)
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    setFilteredReservations(filtered)
  }

  const handleUpdateStatus = async (id: number, status: string, remarks?: string) => {
    try {
      const response = await fetch(`/api/parks-recreation/amenity-reservations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewedBy: 'Admin',
          approvedBy: status === 'APPROVED' ? 'Admin' : undefined,
          rejectedBy: status === 'REJECTED' ? 'Admin' : undefined,
          rejectionReason: status === 'REJECTED' ? remarks : undefined
        })
      })

      if (response.ok) {
        alert('Status updated successfully!')
        fetchReservations()
        setShowModal(false)
      } else {
        alert('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    }
  }

  const handleExportCSV = () => {
    const csv = [
      ['Booking Code', 'Requester', 'Amenity', 'Date', 'Time', 'Guests', 'Status', 'Amount'].join(','),
      ...filteredReservations.map(r => [
        r.bookingCode,
        r.requesterName,
        r.amenity.name,
        new Date(r.reservationDate).toLocaleDateString(),
        `${r.startTime}-${r.endTime}`,
        r.numberOfGuests,
        r.status,
        r.totalAmount
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reservations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string, text: string }> = {
      'PENDING_REVIEW': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'AWAITING_PAYMENT': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'PAID': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'APPROVED': { bg: 'bg-green-100', text: 'text-green-800' },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-800' },
      'CANCELLED': { bg: 'bg-gray-100', text: 'text-gray-800' },
      'CHECKED_IN': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'COMPLETED': { bg: 'bg-green-100', text: 'text-green-800' }
    }
    const badge = badges[status] || badges['PENDING_REVIEW']
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {status.replace(/_/g, ' ')}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">Water Park Amenity Reservations</h1>
          <p className="text-blue-100 mt-1">Manage reservations for cottages, tables, rooms, and pool areas</p>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
              </div>
              <FiCalendar className="text-3xl text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
              </div>
              <FiClock className="text-3xl text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
              </div>
              <FiUsers className="text-3xl text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FiCheckCircle className="text-3xl text-yellow-600" />
            </div>
        </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <p className="text-sm text-gray-600">Awaiting Payment</p>
            <p className="text-2xl font-bold text-orange-600">{stats.awaitingPayment}</p>
          </div>
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded">
            <p className="text-sm text-gray-600">Cancelled</p>
            <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="AWAITING_PAYMENT">Awaiting Payment</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amenity Type</label>
              <select
                value={filterAmenityType}
                onChange={(e) => setFilterAmenityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Types</option>
                <option value="COTTAGE">Cottage</option>
                <option value="TABLE">Table</option>
                <option value="ROOM">Room</option>
                <option value="POOL_AREA">Pool Area</option>
                <option value="PAVILION">Pavilion</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requester</label>
              <select
                value={filterRequesterType}
                onChange={(e) => setFilterRequesterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All</option>
                <option value="RESIDENT">Resident</option>
                <option value="NON_RESIDENT">Non-Resident</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <FiDownload /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Reservations Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amenity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-gray-900">{reservation.bookingCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{reservation.requesterName}</div>
                      <div className="text-xs text-gray-500">{reservation.requesterType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{reservation.amenity.name}</div>
                      <div className="text-xs text-gray-500">{reservation.amenity.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(reservation.reservationDate).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{reservation.startTime} - {reservation.endTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{reservation.numberOfGuests}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(reservation.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedReservation(reservation)
                          setShowModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <FiEye className="inline mr-1" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reservation Details Modal */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
              <h2 className="text-2xl font-bold">Reservation Details</h2>
              <p className="text-blue-100 mt-1">Booking Code: {selectedReservation.bookingCode}</p>
            </div>

            <div className="p-6">
              {/* Contact & Amenity Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Requester Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{selectedReservation.requesterName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedReservation.requesterEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{selectedReservation.requesterPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium text-gray-900">{selectedReservation.requesterType}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Reservation Details</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Amenity</p>
                      <p className="font-medium text-gray-900">{selectedReservation.amenity.name}</p>
                      <p className="text-sm text-gray-500">{selectedReservation.amenity.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium text-gray-900">{new Date(selectedReservation.reservationDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium text-gray-900">{selectedReservation.startTime} - {selectedReservation.endTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Guests</p>
                      <p className="font-medium text-gray-900">{selectedReservation.numberOfGuests} persons</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedReservation.specialRequests && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Special Requests</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedReservation.specialRequests}</p>
                </div>
              )}

              {/* Payment & Status */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
                  <p className="text-3xl font-bold text-green-600">₱{selectedReservation.totalAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">Payment Status: {selectedReservation.paymentStatus}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Reservation Status</h3>
                  {getStatusBadge(selectedReservation.status)}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedReservation.status === 'PENDING_REVIEW' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-blue-900 mb-3">Review this reservation</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdateStatus(selectedReservation.id, 'AWAITING_PAYMENT')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <FiDollarSign /> Approve & Request Payment
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:')
                        if (reason) handleUpdateStatus(selectedReservation.id, 'REJECTED', reason)
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <FiXCircle /> Reject
                    </button>
                  </div>
                </div>
              )}

              {selectedReservation.status === 'AWAITING_PAYMENT' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-orange-900 mb-3">Mark payment as received?</p>
                  <button
                    onClick={() => handleUpdateStatus(selectedReservation.id, 'APPROVED')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <FiCheckCircle /> Confirm Payment & Approve
                  </button>
                </div>
              )}

              {selectedReservation.status === 'APPROVED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-green-900 mb-3">Generate entry pass</p>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                      <MdQrCode /> Generate QR Code
                    </button>
                    <button className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2">
                      <FiPrinter /> Print Pass
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
