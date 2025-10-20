"use client"

import { useEffect, useState, useRef } from "react"
import {
  FiFileText, FiPlus, FiCheckCircle, FiXCircle,
  FiClock, FiAlertCircle, FiEdit2, FiTrash2,
  FiEye, FiDownload, FiPrinter, FiSearch,
  FiPackage, FiUser, FiCalendar, FiTag
} from "react-icons/fi"
import QRCode from 'qrcode'

interface RISRequest {
  id: number
  risNumber: string
  departmentName: string
  requestedBy: string
  requestedByEmail?: string
  purpose: string
  dateNeeded?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  issuedBy?: string
  issuedAt?: string
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'NO_STOCK' | 'ISSUED' | 'COMPLETED' | 'CANCELLED'
  remarks?: string
  items: RISItem[]
  createdAt: string
}

interface RISItem {
  id?: number
  itemId: number
  item?: {
    itemCode: string
    itemName: string
    unitOfMeasure: string
    currentStock?: number
  }
  quantityRequested: number
  quantityApproved?: number
  quantityIssued?: number
  justification?: string
  remarks?: string
}

interface Item {
  id: number
  itemCode: string
  itemName: string
  unitOfMeasure: string
  currentStock: number
  category: string
}

export default function RISManagementPage() {
  const [requests, setRequests] = useState<RISRequest[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showNewRISModal, setShowNewRISModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedRIS, setSelectedRIS] = useState<RISRequest | null>(null)
  
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  const printRef = useRef<HTMLDivElement>(null)

  // New RIS Form State
  const [risForm, setRisForm] = useState({
    departmentName: '',
    requestedBy: '',
    requestedByEmail: '',
    purpose: '',
    dateNeeded: new Date().toISOString().split('T')[0],
    items: [] as RISItem[]
  })

  // New Item Form State
  const [newItem, setNewItem] = useState<RISItem>({
    itemId: 0,
    quantityRequested: 0,
    justification: '',
    remarks: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [requestsRes, itemsRes] = await Promise.all([
        fetch('/api/asset-inventory/ris'),
        fetch('/api/asset-inventory/items')
      ])

      const [requestsData, itemsData] = await Promise.all([
        requestsRes.json(),
        itemsRes.json()
      ])

      if (requestsData.success) setRequests(requestsData.data)
      if (itemsData.success) setItems(itemsData.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    const item = items.find(i => i.id === newItem.itemId)
    if (!item) {
      alert('Please select an item')
      return
    }

    if (newItem.quantityRequested <= 0) {
      alert('Quantity must be greater than 0')
      return
    }

    if (newItem.quantityRequested > item.currentStock) {
      if (!confirm(`Requested quantity (${newItem.quantityRequested}) exceeds available stock (${item.currentStock}). Continue anyway?`)) {
        return
      }
    }

    const itemWithDetails: RISItem = {
      ...newItem,
      item: {
        itemCode: item.itemCode,
        itemName: item.itemName,
        unitOfMeasure: item.unitOfMeasure,
        currentStock: item.currentStock
      }
    }

    setRisForm({
      ...risForm,
      items: [...risForm.items, itemWithDetails]
    })

    // Reset new item form
    setNewItem({
      itemId: 0,
      quantityRequested: 0,
      remarks: ''
    })
  }

  const handleRemoveItem = (index: number) => {
    setRisForm({
      ...risForm,
      items: risForm.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmitRIS = async () => {
    try {
      if (!risForm.departmentName || !risForm.requestedBy || !risForm.purpose) {
        alert('Please fill in all required fields')
        return
      }

      if (risForm.items.length === 0) {
        alert('Please add at least one item')
        return
      }

      const response = await fetch('/api/asset-inventory/ris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(risForm)
      })

      const data = await response.json()

      if (data.success) {
        alert('RIS request submitted successfully!')
        setShowNewRISModal(false)
        fetchData()
        resetRISForm()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to submit RIS:', error)
      alert('Failed to submit RIS request')
    }
  }

  const handleApproveRIS = async (id: number) => {
    try {
      const approvedBy = prompt('Enter your name to approve:')
      if (!approvedBy) return

      const response = await fetch(`/api/asset-inventory/ris/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy })
      })

      const data = await response.json()

      if (data.success) {
        alert('RIS approved successfully!')
        fetchData()
        setSelectedRIS(null)
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to approve RIS:', error)
      alert('Failed to approve RIS')
    }
  }

  const handleRejectRIS = async (id: number) => {
    try {
      const remarks = prompt('Enter reason for rejection:')
      if (!remarks) return

      const response = await fetch(`/api/asset-inventory/ris/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks })
      })

      const data = await response.json()

      if (data.success) {
        alert('RIS rejected')
        fetchData()
        setSelectedRIS(null)
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to reject RIS:', error)
      alert('Failed to reject RIS')
    }
  }

  const handleIssueRIS = async (id: number) => {
    try {
      const issuedBy = prompt('Enter your name to issue:')
      if (!issuedBy) return

      const response = await fetch(`/api/asset-inventory/ris/${id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issuedBy })
      })

      const data = await response.json()

      if (data.success) {
        alert('Items issued successfully!')
        fetchData()
        setSelectedRIS(null)
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to issue RIS:', error)
      alert('Failed to issue items')
    }
  }

  const handlePrintRIS = async (ris: RISRequest) => {
    try {
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(ris.risNumber, {
        width: 150,
        margin: 1
      })

      // Create print content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>RIS - ${ris.risNumber}</title>
          <style>
            @media print {
              @page { margin: 0.5in; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header h2 {
              margin: 5px 0;
              font-size: 18px;
              font-weight: normal;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 20px;
            }
            .info-item {
              display: flex;
              gap: 10px;
            }
            .info-label {
              font-weight: bold;
              min-width: 120px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 40px;
              padding-top: 5px;
            }
            .qr-code {
              position: absolute;
              top: 20px;
              right: 20px;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 5px;
              font-weight: bold;
            }
            .status-approved { background-color: #d4edda; color: #155724; }
            .status-pending { background-color: #fff3cd; color: #856404; }
            .status-rejected { background-color: #f8d7da; color: #721c24; }
            .status-issued { background-color: #d1ecf1; color: #0c5460; }
          </style>
        </head>
        <body>
          <div class="qr-code">
            <img src="${qrCodeDataUrl}" alt="QR Code" />
          </div>
          
          <div class="header">
            <h1>PHILIPPINE AIR FORCE MEMORIAL</h1>
            <h2>Requisition and Issue Slip (RIS)</h2>
          </div>

          <div class="info-section">
            <div class="info-item">
              <span class="info-label">RIS Number:</span>
              <span>${ris.risNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Date Needed:</span>
              <span>${ris.dateNeeded ? new Date(ris.dateNeeded).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Department:</span>
              <span>${ris.departmentName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Requested By:</span>
              <span>${ris.requestedBy}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <span class="info-label">Purpose:</span>
              <span>${ris.purpose}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status:</span>
              <span class="status-badge status-${ris.status.toLowerCase()}">${ris.status}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 10%;">Item Code</th>
                <th style="width: 30%;">Description</th>
                <th style="width: 10%;">Unit</th>
                <th style="width: 15%;">Qty Requested</th>
                <th style="width: 15%;">Qty Approved</th>
                <th style="width: 20%;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${ris.items.map(item => `
                <tr>
                  <td>${item.item?.itemCode || ''}</td>
                  <td>${item.item?.itemName || ''}</td>
                  <td>${item.item?.unitOfMeasure || ''}</td>
                  <td style="text-align: center;">${item.quantityRequested}</td>
                  <td style="text-align: center;">${item.quantityApproved || '-'}</td>
                  <td>${item.remarks || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${ris.remarks ? `
            <div style="margin: 20px 0;">
              <strong>Remarks:</strong> ${ris.remarks}
            </div>
          ` : ''}

          <div class="footer">
            <div class="signature-box">
              <div class="signature-line">
                ${ris.requestedBy || '_____________________'}
              </div>
              <div>Requested By</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                ${ris.approvedBy || '_____________________'}
              </div>
              <div>Approved By</div>
              ${ris.approvedAt ? `<div style="font-size: 12px; margin-top: 5px;">Date: ${new Date(ris.approvedAt).toLocaleDateString()}</div>` : ''}
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
            This is a system-generated document. Scan QR code for verification.
          </div>
        </body>
        </html>
      `

      // Open print window
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    } catch (error) {
      console.error('Failed to print RIS:', error)
      alert('Failed to generate printable RIS')
    }
  }

  const resetRISForm = () => {
    setRisForm({
      departmentName: '',
      requestedBy: '',
      requestedByEmail: '',
      purpose: '',
      dateNeeded: new Date().toISOString().split('T')[0],
      items: []
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      NO_STOCK: 'bg-orange-100 text-orange-800 border-orange-200',
      ISSUED: 'bg-green-100 text-green-800 border-green-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const icons = {
      PENDING: <FiClock className="w-3 h-3" />,
      APPROVED: <FiCheckCircle className="w-3 h-3" />,
      REJECTED: <FiXCircle className="w-3 h-3" />,
      NO_STOCK: <FiAlertCircle className="w-3 h-3" />,
      ISSUED: <FiPackage className="w-3 h-3" />
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.replace(/_/g, ' ')}
      </span>
    )
  }

  const filteredRequests = filterStatus === 'ALL'
    ? requests.filter(r =>
        r.risNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : requests.filter(r =>
        r.status === filterStatus &&
        (r.risNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
         r.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         r.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()))
      )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING_APPROVAL').length
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length
  const issuedCount = requests.filter(r => r.status === 'ISSUED').length
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RIS Management</h1>
          <p className="text-gray-600 mt-1">Requisition and Issue Slip requests</p>
        </div>
        <button
          onClick={() => {
            resetRISForm()
            setShowNewRISModal(true)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FiPlus className="w-5 h-5" />
          New RIS Request
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-blue-600">{approvedCount}</p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Issued</p>
              <p className="text-2xl font-bold text-green-600">{issuedCount}</p>
            </div>
            <FiPackage className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            </div>
            <FiXCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {['ALL', 'PENDING', 'APPROVED', 'ISSUED', 'REJECTED', 'NO_STOCK'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search RIS number, department, or requester..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* RIS Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RIS Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No RIS requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((ris) => (
                  <tr key={ris.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiFileText className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{ris.risNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ris.departmentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ris.requestedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ris.dateNeeded ? new Date(ris.dateNeeded).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ris.items.length} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ris.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRIS(ris)
                            setShowViewModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePrintRIS(ris)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Print RIS"
                        >
                          <FiPrinter className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New RIS Modal */}
      {showNewRISModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">New RIS Request</h2>
              <button
                onClick={() => setShowNewRISModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Request Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={risForm.departmentName}
                    onChange={(e) => setRisForm({ ...risForm, departmentName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Administration"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requested By *
                  </label>
                  <input
                    type="text"
                    value={risForm.requestedBy}
                    onChange={(e) => setRisForm({ ...risForm, requestedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Full Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={risForm.requestedByEmail}
                    onChange={(e) => setRisForm({ ...risForm, requestedByEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Needed
                  </label>
                  <input
                    type="date"
                    value={risForm.dateNeeded}
                    onChange={(e) => setRisForm({ ...risForm, dateNeeded: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose *
                  </label>
                  <textarea
                    value={risForm.purpose}
                    onChange={(e) => setRisForm({ ...risForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Purpose of requisition"
                    required
                  />
                </div>
              </div>

              {/* Item Selection */}
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Items</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Item *</label>
                    <select
                      value={newItem.itemId}
                      onChange={(e) => setNewItem({ ...newItem, itemId: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>Choose an item...</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.itemName} ({item.itemCode}) - Stock: {item.currentStock} {item.unitOfMeasure}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={newItem.quantityRequested}
                      onChange={(e) => setNewItem({ ...newItem, quantityRequested: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <input
                      type="text"
                      value={newItem.remarks}
                      onChange={(e) => setNewItem({ ...newItem, remarks: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional remarks"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddItem}
                  disabled={!newItem.itemId || newItem.quantityRequested <= 0}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <FiPlus className="w-5 h-5" />
                  Add Item to RIS
                </button>
              </div>

              {/* Items List */}
              {risForm.items.length > 0 && (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                    <h3 className="font-semibold text-gray-900">Items in this RIS ({risForm.items.length})</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Requested</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remarks</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {risForm.items.map((item, index) => (
                          <tr key={index} className={item.quantityRequested > (item.item?.currentStock || 0) ? 'bg-orange-50' : ''}>
                            <td className="px-4 py-2">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{item.item?.itemName}</div>
                                <div className="text-gray-500">{item.item?.itemCode}</div>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span className={item.quantityRequested > (item.item?.currentStock || 0) ? 'text-orange-600 font-medium' : 'text-gray-900'}>
                                {item.item?.currentStock} {item.item?.unitOfMeasure}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {item.quantityRequested} {item.item?.unitOfMeasure}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{item.remarks || '-'}</td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowNewRISModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRIS}
                disabled={!risForm.departmentName || !risForm.requestedBy || !risForm.purpose || risForm.items.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit RIS Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View RIS Modal */}
      {showViewModal && selectedRIS && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">RIS Details</h2>
                <p className="text-gray-600">{selectedRIS.risNumber}</p>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{selectedRIS.departmentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested By</p>
                  <p className="font-medium text-gray-900">{selectedRIS.requestedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Needed</p>
                  <p className="font-medium text-gray-900">
                    {selectedRIS.dateNeeded ? new Date(selectedRIS.dateNeeded).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRIS.status)}</div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Purpose</p>
                  <p className="font-medium text-gray-900">{selectedRIS.purpose}</p>
                </div>
                {selectedRIS.approvedBy && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Approved By</p>
                      <p className="font-medium text-gray-900">{selectedRIS.approvedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Approval Date</p>
                      <p className="font-medium text-gray-900">
                        {selectedRIS.approvedAt ? new Date(selectedRIS.approvedAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Requested Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Requested</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Approved</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedRIS.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{item.item?.itemName}</div>
                              <div className="text-gray-500">{item.item?.itemCode}</div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.quantityRequested} {item.item?.unitOfMeasure}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {item.quantityApproved ? `${item.quantityApproved} ${item.item?.unitOfMeasure}` : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handlePrintRIS(selectedRIS)}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <FiPrinter className="w-5 h-5" />
                  Print RIS
                </button>

                {selectedRIS.status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      onClick={() => handleApproveRIS(selectedRIS.id)}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <FiCheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRIS(selectedRIS.id)}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <FiXCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </>
                )}

                {selectedRIS.status === 'APPROVED' && (
                  <button
                    onClick={() => handleIssueRIS(selectedRIS.id)}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <FiPackage className="w-5 h-5" />
                    Issue Items
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
