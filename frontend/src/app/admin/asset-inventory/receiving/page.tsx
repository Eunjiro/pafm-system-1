"use client"

import { useEffect, useState } from "react"
import {
  FiUpload, FiPackage, FiCheckCircle, FiXCircle,
  FiClock, FiTruck, FiFileText, FiAlertCircle,
  FiPlus, FiTrash2, FiEye,
} from "react-icons/fi"

interface Supplier {
  id: number
  name: string
  contactPerson: string
  contactNumber: string
}

interface DeliveryItem {
  itemCode: string
  itemName: string
  description: string
  category: string
  unitOfMeasure: string
  quantityOrdered: number
  quantityReceived: number
  unitPrice: number
  totalAmount: number
  remarks?: string
}

interface Delivery {
  id: number
  deliveryNumber: string
  poNumber: string
  drNumber: string
  supplier: {
    name: string
  }
  deliveryDate: string
  receivedBy: string
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'STORED' | 'REJECTED'
  items: DeliveryItem[]
  poFileUrl?: string
  drFileUrl?: string
  createdAt: string
}

export default function ReceivingPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewDeliveryModal, setShowNewDeliveryModal] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [showAddSupplierForm, setShowAddSupplierForm] = useState(false)

  // New Delivery Form State
  const [newDelivery, setNewDelivery] = useState({
    supplierId: '',
    poNumber: '',
    drNumber: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    receivedBy: '',
    poFile: null as File | null,
    drFile: null as File | null,
    items: [] as DeliveryItem[]
  })

  // New Item Form State
  const [newItem, setNewItem] = useState<DeliveryItem>({
    itemCode: '',
    itemName: '',
    description: '',
    category: 'OFFICE_SUPPLIES',
    unitOfMeasure: 'PIECE',
    quantityOrdered: 0,
    quantityReceived: 0,
    unitPrice: 0,
    totalAmount: 0,
    remarks: ''
  })

  // New Supplier Form State
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    contactNumber: '',
    email: '',
    address: '',
    tinNumber: ''
  })

  useEffect(() => {
    fetchDeliveries()
    fetchSuppliers()
  }, [])

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/asset-inventory/deliveries')
      const data = await response.json()
      
      if (data.success) {
        setDeliveries(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/asset-inventory/suppliers')
      const data = await response.json()
      
      if (data.success) {
        setSuppliers(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    }
  }

  const handleAddSupplier = async () => {
    try {
      if (!newSupplier.name || !newSupplier.contactPerson || !newSupplier.contactNumber) {
        alert('Please fill in required fields: Name, Contact Person, and Contact Number')
        return
      }

      const response = await fetch('/api/asset-inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier)
      })

      const data = await response.json()

      if (data.success) {
        alert('Supplier added successfully!')
        fetchSuppliers()
        setShowAddSupplierForm(false)
        setNewSupplier({
          name: '',
          contactPerson: '',
          contactNumber: '',
          email: '',
          address: '',
          tinNumber: ''
        })
        // Auto-select the newly added supplier
        setNewDelivery({ ...newDelivery, supplierId: data.data.id.toString() })
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to add supplier:', error)
      alert('Failed to add supplier')
    }
  }

  const handleAddItem = () => {
    const itemWithTotal = {
      ...newItem,
      totalAmount: newItem.quantityReceived * newItem.unitPrice
    }
    
    setNewDelivery({
      ...newDelivery,
      items: [...newDelivery.items, itemWithTotal]
    })

    // Reset new item form
    setNewItem({
      itemCode: '',
      itemName: '',
      description: '',
      category: 'OFFICE_SUPPLIES',
      unitOfMeasure: 'PIECE',
      quantityOrdered: 0,
      quantityReceived: 0,
      unitPrice: 0,
      totalAmount: 0,
      remarks: ''
    })
  }

  const handleRemoveItem = (index: number) => {
    setNewDelivery({
      ...newDelivery,
      items: newDelivery.items.filter((_, i) => i !== index)
    })
  }

  const handleSubmitDelivery = async () => {
    try {
      const formData = new FormData()
      formData.append('supplierId', newDelivery.supplierId)
      formData.append('poNumber', newDelivery.poNumber)
      formData.append('drNumber', newDelivery.drNumber)
      formData.append('deliveryDate', newDelivery.deliveryDate)
      formData.append('receivedBy', newDelivery.receivedBy)
      formData.append('items', JSON.stringify(newDelivery.items))
      
      if (newDelivery.poFile) {
        formData.append('poFile', newDelivery.poFile)
      }
      if (newDelivery.drFile) {
        formData.append('drFile', newDelivery.drFile)
      }

      const response = await fetch('/api/asset-inventory/deliveries', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        alert('Delivery recorded successfully!')
        setShowNewDeliveryModal(false)
        fetchDeliveries()
        
        // Reset form
        setNewDelivery({
          supplierId: '',
          poNumber: '',
          drNumber: '',
          deliveryDate: new Date().toISOString().split('T')[0],
          receivedBy: '',
          poFile: null,
          drFile: null,
          items: []
        })
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to submit delivery:', error)
      alert('Failed to submit delivery')
    }
  }

  const handleUpdateStatus = async (deliveryId: number, status: string) => {
    try {
      const response = await fetch(`/api/asset-inventory/deliveries/${deliveryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Delivery ${status.toLowerCase()} successfully!`)
        fetchDeliveries()
        setSelectedDelivery(null)
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update status')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      VERIFIED: 'bg-blue-100 text-blue-800 border-blue-200',
      STORED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200'
    }

    const icons = {
      PENDING_VERIFICATION: <FiClock className="w-3 h-3" />,
      VERIFIED: <FiCheckCircle className="w-3 h-3" />,
      STORED: <FiPackage className="w-3 h-3" />,
      REJECTED: <FiXCircle className="w-3 h-3" />
    }

    const labels = {
      PENDING_VERIFICATION: 'Pending',
      VERIFIED: 'Verified',
      STORED: 'Stored',
      REJECTED: 'Rejected'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const filteredDeliveries = filterStatus === 'ALL'
    ? deliveries
    : deliveries.filter(d => d.status === filterStatus)

  const totalAmount = newDelivery.items.reduce((sum, item) => sum + item.totalAmount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receiving of Supplies</h1>
          <p className="text-gray-600 mt-1">Record and verify incoming deliveries</p>
        </div>
        <button
          onClick={() => setShowNewDeliveryModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FiPlus className="w-5 h-5" />
          Record New Delivery
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {deliveries.filter(d => d.status === 'PENDING_VERIFICATION').length}
              </p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-blue-600">
                {deliveries.filter(d => d.status === 'VERIFIED').length}
              </p>
            </div>
            <FiCheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stored</p>
              <p className="text-2xl font-bold text-green-600">
                {deliveries.filter(d => d.status === 'STORED').length}
              </p>
            </div>
            <FiPackage className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {deliveries.filter(d => d.status === 'REJECTED').length}
              </p>
            </div>
            <FiXCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
          {['ALL', 'PENDING_VERIFICATION', 'VERIFIED', 'STORED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'PENDING_VERIFICATION' ? 'PENDING' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO / DR Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No deliveries found
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiTruck className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          {delivery.deliveryNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">PO: {delivery.poNumber}</div>
                        <div className="text-gray-500">DR: {delivery.drNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{delivery.supplier.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(delivery.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {delivery.items.length} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(delivery.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedDelivery(delivery)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Delivery Modal */}
      {showNewDeliveryModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Record New Delivery</h2>
              <button
                onClick={() => setShowNewDeliveryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Delivery Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier *
                  </label>
                  
                  {!showAddSupplierForm ? (
                    <div className="flex gap-2">
                      <select
                        value={newDelivery.supplierId}
                        onChange={(e) => setNewDelivery({ ...newDelivery, supplierId: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name} - {supplier.contactPerson}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddSupplierForm(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <FiPlus className="w-4 h-4" />
                        Add New
                      </button>
                    </div>
                  ) : (
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Add New Supplier</h4>
                        <button
                          type="button"
                          onClick={() => setShowAddSupplierForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <FiXCircle className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Supplier Name *
                          </label>
                          <input
                            type="text"
                            value={newSupplier.name}
                            onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="e.g., ABC Corporation"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Contact Person *
                          </label>
                          <input
                            type="text"
                            value={newSupplier.contactPerson}
                            onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="e.g., Juan Dela Cruz"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Contact Number *
                          </label>
                          <input
                            type="text"
                            value={newSupplier.contactNumber}
                            onChange={(e) => setNewSupplier({ ...newSupplier, contactNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="e.g., 09171234567"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={newSupplier.email}
                            onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="e.g., supplier@example.com"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            TIN Number
                          </label>
                          <input
                            type="text"
                            value={newSupplier.tinNumber}
                            onChange={(e) => setNewSupplier({ ...newSupplier, tinNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="e.g., 123-456-789-000"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          <input
                            type="text"
                            value={newSupplier.address}
                            onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                            placeholder="Complete address"
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleAddSupplier}
                        className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        Save Supplier
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={newDelivery.deliveryDate}
                    onChange={(e) => setNewDelivery({ ...newDelivery, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PO Number *
                  </label>
                  <input
                    type="text"
                    value={newDelivery.poNumber}
                    onChange={(e) => setNewDelivery({ ...newDelivery, poNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., PO-2025-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DR Number *
                  </label>
                  <input
                    type="text"
                    value={newDelivery.drNumber}
                    onChange={(e) => setNewDelivery({ ...newDelivery, drNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., DR-2025-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Received By *
                  </label>
                  <input
                    type="text"
                    value={newDelivery.receivedBy}
                    onChange={(e) => setNewDelivery({ ...newDelivery, receivedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Full Name"
                    required
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Order (PDF) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setNewDelivery({ ...newDelivery, poFile: e.target.files?.[0] || null })}
                      className="hidden"
                      id="po-file"
                    />
                    <label htmlFor="po-file" className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                      {newDelivery.poFile ? newDelivery.poFile.name : 'Click to upload PO'}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Receipt (PDF) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setNewDelivery({ ...newDelivery, drFile: e.target.files?.[0] || null })}
                      className="hidden"
                      id="dr-file"
                    />
                    <label htmlFor="dr-file" className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                      {newDelivery.drFile ? newDelivery.drFile.name : 'Click to upload DR'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Item Entry Form */}
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Items</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                    <input
                      type="text"
                      value={newItem.itemCode}
                      onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., ITEM-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                    <input
                      type="text"
                      value={newItem.itemName}
                      onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Bond Paper A4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="OFFICE_SUPPLIES">Office Supplies</option>
                      <option value="EQUIPMENT">Equipment</option>
                      <option value="FURNITURE">Furniture</option>
                      <option value="IT_HARDWARE">IT Hardware</option>
                      <option value="TOOLS">Tools</option>
                      <option value="CLEANING_SUPPLIES">Cleaning Supplies</option>
                      <option value="MEDICAL_SUPPLIES">Medical Supplies</option>
                      <option value="CONSTRUCTION_MATERIALS">Construction Materials</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Item description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
                    <select
                      value={newItem.unitOfMeasure}
                      onChange={(e) => setNewItem({ ...newItem, unitOfMeasure: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PIECE">Piece</option>
                      <option value="BOX">Box</option>
                      <option value="REAM">Ream</option>
                      <option value="PACK">Pack</option>
                      <option value="SET">Set</option>
                      <option value="UNIT">Unit</option>
                      <option value="LITER">Liter</option>
                      <option value="KILOGRAM">Kilogram</option>
                      <option value="METER">Meter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Ordered</label>
                    <input
                      type="number"
                      value={newItem.quantityOrdered}
                      onChange={(e) => setNewItem({ ...newItem, quantityOrdered: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received</label>
                    <input
                      type="number"
                      value={newItem.quantityReceived}
                      onChange={(e) => setNewItem({ ...newItem, quantityReceived: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₱)</label>
                    <input
                      type="number"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <input
                      type="text"
                      value={`₱${(newItem.quantityReceived * newItem.unitPrice).toFixed(2)}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>

                  <div>
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
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  disabled={!newItem.itemCode || !newItem.itemName || newItem.quantityReceived <= 0}
                >
                  <FiPlus className="w-5 h-5" />
                  Add Item to Delivery
                </button>
              </div>

              {/* Items List */}
              {newDelivery.items.length > 0 && (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                    <h3 className="font-semibold text-gray-900">Items in this Delivery ({newDelivery.items.length})</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ordered</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Received</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {newDelivery.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{item.itemName}</div>
                                <div className="text-gray-500">{item.itemCode}</div>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.quantityOrdered} {item.unitOfMeasure}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.quantityReceived} {item.unitOfMeasure}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">₱{item.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">₱{item.totalAmount.toFixed(2)}</td>
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
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-300 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Grand Total:</span>
                    <span className="text-lg font-bold text-gray-900">₱{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowNewDeliveryModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDelivery}
                disabled={!newDelivery.supplierId || !newDelivery.poNumber || !newDelivery.drNumber || newDelivery.items.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Delivery Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
                <p className="text-gray-600">{selectedDelivery.deliveryNumber}</p>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Delivery Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Supplier</p>
                  <p className="font-medium text-gray-900">{selectedDelivery.supplier.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedDelivery.deliveryDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">PO Number</p>
                  <p className="font-medium text-gray-900">{selectedDelivery.poNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">DR Number</p>
                  <p className="font-medium text-gray-900">{selectedDelivery.drNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Received By</p>
                  <p className="font-medium text-gray-900">{selectedDelivery.receivedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedDelivery.status)}</div>
                </div>
              </div>

              {/* Documents */}
              {(selectedDelivery.poFileUrl || selectedDelivery.drFileUrl) && (
                <div className="flex gap-4">
                  {selectedDelivery.poFileUrl && (
                    <a
                      href={selectedDelivery.poFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                    >
                      <FiFileText className="w-5 h-5" />
                      View PO
                    </a>
                  )}
                  {selectedDelivery.drFileUrl && (
                    <a
                      href={selectedDelivery.drFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      <FiFileText className="w-5 h-5" />
                      View DR
                    </a>
                  )}
                </div>
              )}

              {/* Items Table */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ordered</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Received</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDelivery.items.map((item, index) => (
                        <tr key={index} className={item.quantityOrdered !== item.quantityReceived ? 'bg-yellow-50' : ''}>
                          <td className="px-4 py-2">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{item.itemName}</div>
                              <div className="text-gray-500">{item.itemCode}</div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantityOrdered}</td>
                          <td className="px-4 py-2">
                            <span className={`text-sm font-medium ${
                              item.quantityOrdered === item.quantityReceived ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {item.quantityReceived}
                              {item.quantityOrdered !== item.quantityReceived && (
                                <FiAlertCircle className="inline ml-1 w-4 h-4" />
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">₱{item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">₱{item.totalAmount.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedDelivery.status === 'PENDING_VERIFICATION' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'VERIFIED')}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <FiCheckCircle className="w-5 h-5" />
                    Verify Delivery
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'REJECTED')}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <FiXCircle className="w-5 h-5" />
                    Reject Delivery
                  </button>
                </div>
              )}

              {selectedDelivery.status === 'VERIFIED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedDelivery.id, 'STORED')}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <FiPackage className="w-5 h-5" />
                  Mark as Stored
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
