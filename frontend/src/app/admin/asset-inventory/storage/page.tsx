"use client"

import { useEffect, useState } from "react"
import {
  FiDatabase, FiGrid, FiPackage, FiMapPin,
  FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiBox, FiLayers, FiTag, FiBarChart2,
  FiCheckCircle, FiAlertCircle
} from "react-icons/fi"

interface StorageZone {
  id: number
  zoneName: string
  description: string
  capacity: number
  isActive: boolean
  racks: StorageRack[]
  createdAt: string
  updatedAt: string
}

interface StorageRack {
  id: number
  rackCode: string
  zoneId: number
  zone?: StorageZone
  level: number | null
  position: string | null
  capacity: number | null
  isActive: boolean
  stockLocations: StockLocation[]
  createdAt: string
  updatedAt: string
}

interface StockLocation {
  id: number
  tagCode?: string         // QR/Barcode - optional
  rackId: number
  rack?: StorageRack
  itemId: number
  item?: {
    id: number
    itemCode: string
    itemName: string
    category: string
  }
  quantity: number
  status?: string
  batchNumber?: string
  expiryDate?: string
  lastUpdated: string
}

interface Item {
  id: number
  itemCode: string
  itemName: string
  category: string
  description: string
  unitOfMeasure: string
  currentStock: number
}

export default function StoragePage() {
  const [zones, setZones] = useState<StorageZone[]>([])
  const [racks, setRacks] = useState<StorageRack[]>([])
  const [locations, setLocations] = useState<StockLocation[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState<'zones' | 'racks' | 'locations'>('zones')
  const [selectedZone, setSelectedZone] = useState<StorageZone | null>(null)
  const [selectedRack, setSelectedRack] = useState<StorageRack | null>(null)
  
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showRackModal, setShowRackModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')

  // Zone Form State
  const [zoneForm, setZoneForm] = useState({
    id: null as number | null,
    zoneName: '',
    description: '',
    capacity: 0
  })

  // Rack Form State
  const [rackForm, setRackForm] = useState({
    id: null as number | null,
    rackCode: '',
    zoneId: '',
    level: 1,
    position: '',
    capacity: 0
  })

  // Location Form State
  const [locationForm, setLocationForm] = useState({
    id: null as number | null,
    tagCode: '',
    rackId: '',
    itemId: '',
    quantity: 0,
    batchNumber: '',
    expiryDate: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [zonesRes, racksRes, locationsRes, itemsRes] = await Promise.all([
        fetch('/api/asset-inventory/storage/zones'),
        fetch('/api/asset-inventory/storage/racks'),
        fetch('/api/asset-inventory/storage/locations'),
        fetch('/api/asset-inventory/items')
      ])

      const [zonesData, racksData, locationsData, itemsData] = await Promise.all([
        zonesRes.json(),
        racksRes.json(),
        locationsRes.json(),
        itemsRes.json()
      ])

      if (zonesData.success) setZones(zonesData.data)
      if (racksData.success) setRacks(racksData.data)
      if (locationsData.success) setLocations(locationsData.data)
      if (itemsData.success) setItems(itemsData.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Zone Management
  const handleZoneSubmit = async () => {
    try {
      const url = zoneForm.id
        ? `/api/asset-inventory/storage/zones/${zoneForm.id}`
        : '/api/asset-inventory/storage/zones'
      
      const method = zoneForm.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneForm)
      })

      const data = await response.json()

      if (data.success) {
        alert(`Zone ${zoneForm.id ? 'updated' : 'created'} successfully!`)
        setShowZoneModal(false)
        fetchData()
        resetZoneForm()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to submit zone:', error)
      alert('Failed to save zone')
    }
  }

  const handleDeleteZone = async (id: number) => {
    if (!confirm('Are you sure you want to delete this zone?')) return

    try {
      const response = await fetch(`/api/asset-inventory/storage/zones/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert('Zone deleted successfully!')
        fetchData()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to delete zone:', error)
      alert('Failed to delete zone')
    }
  }

  // Rack Management
  const handleRackSubmit = async () => {
    try {
      const url = rackForm.id
        ? `/api/asset-inventory/storage/racks/${rackForm.id}`
        : '/api/asset-inventory/storage/racks'
      
      const method = rackForm.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rackForm,
          zoneId: parseInt(rackForm.zoneId)
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Rack ${rackForm.id ? 'updated' : 'created'} successfully!`)
        setShowRackModal(false)
        fetchData()
        resetRackForm()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to submit rack:', error)
      alert('Failed to save rack')
    }
  }

  const handleDeleteRack = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rack?')) return

    try {
      const response = await fetch(`/api/asset-inventory/storage/racks/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert('Rack deleted successfully!')
        fetchData()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to delete rack:', error)
      alert('Failed to delete rack')
    }
  }

  // Location Management
  const handleLocationSubmit = async () => {
    try {
      const url = locationForm.id
        ? `/api/asset-inventory/storage/locations/${locationForm.id}`
        : '/api/asset-inventory/storage/locations'
      
      const method = locationForm.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...locationForm,
          rackId: parseInt(locationForm.rackId),
          itemId: parseInt(locationForm.itemId)
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Location ${locationForm.id ? 'updated' : 'assigned'} successfully!`)
        setShowLocationModal(false)
        fetchData()
        resetLocationForm()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to submit location:', error)
      alert('Failed to save location')
    }
  }

  const handleDeleteLocation = async (id: number) => {
    if (!confirm('Are you sure you want to remove this location assignment?')) return

    try {
      const response = await fetch(`/api/asset-inventory/storage/locations/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert('Location removed successfully!')
        fetchData()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Failed to delete location:', error)
      alert('Failed to remove location')
    }
  }

  const resetZoneForm = () => {
    setZoneForm({
      id: null,
      zoneName: '',
      description: '',
      capacity: 0
    })
  }

  const resetRackForm = () => {
    setRackForm({
      id: null,
      rackCode: '',
      zoneId: '',
      level: 1,
      position: '',
      capacity: 0
    })
  }

  const resetLocationForm = () => {
    setLocationForm({
      id: null,
      tagCode: '',
      rackId: '',
      itemId: '',
      quantity: 0,
      batchNumber: '',
      expiryDate: ''
    })
  }

  const editZone = (zone: StorageZone) => {
    setZoneForm({
      id: zone.id,
      zoneName: zone.zoneName,
      description: zone.description,
      capacity: zone.capacity || 0
    })
    setShowZoneModal(true)
  }

  const editRack = (rack: StorageRack) => {
    setRackForm({
      id: rack.id,
      rackCode: rack.rackCode,
      zoneId: rack.zoneId.toString(),
      level: rack.level || 1,
      position: rack.position || '',
      capacity: rack.capacity || 0
    })
    setShowRackModal(true)
  }

  const editLocation = (location: StockLocation) => {
    setLocationForm({
      id: location.id,
      tagCode: location.tagCode || '',
      rackId: location.rackId.toString(),
      itemId: location.itemId.toString(),
      quantity: location.quantity,
      batchNumber: location.batchNumber || '',
      expiryDate: location.expiryDate || ''
    })
    setShowLocationModal(true)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
      MAINTENANCE: 'bg-orange-100 text-orange-800 border-orange-200',
      AVAILABLE: 'bg-blue-100 text-blue-800 border-blue-200',
      FULL: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-orange-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const filteredZones = zones.filter(zone =>
    zone.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    zone.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRacks = racks.filter(rack =>
    rack.rackCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rack.position?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredLocations = locations.filter(location =>
    location.tagCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.item?.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.item?.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalZones = zones.length
  const activeZones = zones.filter(z => z.isActive).length
  const totalRacks = racks.length
  const availableRacks = racks.filter(r => r.isActive).length
  const totalLocations = locations.length
  const totalCapacity = zones.reduce((sum, z) => sum + (z.capacity || 0), 0)
  // Calculate occupancy from stock locations count
  const totalOccupancy = locations.reduce((sum, loc) => sum + loc.quantity, 0)
  const occupancyPercentage = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Storage & Processing</h1>
          <p className="text-gray-600 mt-1">Manage warehouse zones, racks, and stock locations</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FiDatabase className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Storage Zones</p>
              <p className="text-3xl font-bold text-gray-900">{totalZones}</p>
              <p className="text-sm text-green-600 mt-1">{activeZones} active</p>
            </div>
            <FiGrid className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Storage Racks</p>
              <p className="text-3xl font-bold text-gray-900">{totalRacks}</p>
              <p className="text-sm text-blue-600 mt-1">{availableRacks} available</p>
            </div>
            <FiLayers className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Locations</p>
              <p className="text-3xl font-bold text-gray-900">{totalLocations}</p>
              <p className="text-sm text-purple-600 mt-1">Assigned</p>
            </div>
            <FiMapPin className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupancy Rate</p>
              <p className="text-3xl font-bold text-gray-900">{occupancyPercentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-600 mt-1">{totalOccupancy} / {totalCapacity}</p>
            </div>
            <FiBarChart2 className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('zones')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'zones'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiGrid className="inline w-5 h-5 mr-2" />
              Storage Zones
            </button>
            <button
              onClick={() => setActiveTab('racks')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'racks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiLayers className="inline w-5 h-5 mr-2" />
              Storage Racks
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'locations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiMapPin className="inline w-5 h-5 mr-2" />
              Stock Locations
            </button>
          </div>
        </div>

        {/* Search and Add Button */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === 'zones' && (
            <button
              onClick={() => {
                resetZoneForm()
                setShowZoneModal(true)
              }}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Add Zone
            </button>
          )}

          {activeTab === 'racks' && (
            <button
              onClick={() => {
                resetRackForm()
                setShowRackModal(true)
              }}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Add Rack
            </button>
          )}

          {activeTab === 'locations' && (
            <button
              onClick={() => {
                resetLocationForm()
                setShowLocationModal(true)
              }}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Assign Location
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Zones Tab */}
          {activeTab === 'zones' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredZones.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No zones found
                </div>
              ) : (
                filteredZones.map((zone) => {
                  // Calculate occupancy from stock locations in this zone's racks
                  const zoneOccupancy = zone.racks?.reduce((sum, rack) => 
                    sum + (rack.stockLocations?.reduce((rackSum, loc) => rackSum + loc.quantity, 0) || 0), 0) || 0
                  const occupancyPct = (zone.capacity && zone.capacity > 0) ? (zoneOccupancy / zone.capacity) * 100 : 0
                  
                  return (
                    <div key={zone.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{zone.zoneName}</h3>
                          <p className="text-sm text-gray-600">{zone.description || 'No description'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${zone.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {zone.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Capacity</span>
                          <span className="font-medium">{zoneOccupancy} / {zone.capacity || 0}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getOccupancyColor(occupancyPct)}`}
                            style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{occupancyPct.toFixed(1)}% full</p>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <FiLayers className="inline w-4 h-4 mr-1" />
                        {zone.racks?.length || 0} racks
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editZone(zone)}
                          className="flex-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center justify-center gap-1"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="flex-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center justify-center gap-1"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Racks Tab */}
          {activeTab === 'racks' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rack Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Levels</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRacks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No racks found
                      </td>
                    </tr>
                  ) : (
                    filteredRacks.map((rack) => {
                      const zone = zones.find(z => z.id === rack.zoneId)
                      const rackOccupancy = rack.stockLocations?.reduce((sum, loc) => sum + loc.quantity, 0) || 0
                      const occupancyPct = (rack.capacity && rack.capacity > 0) ? (rackOccupancy / rack.capacity) * 100 : 0
                      return (
                        <tr key={rack.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiLayers className="w-5 h-5 text-gray-400 mr-2" />
                              <span className="font-medium text-gray-900">{rack.rackCode}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {zone?.zoneName || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Level {rack.level || 'N/A'} {rack.position ? `- ${rack.position}` : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {rack.capacity || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-32">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>{rackOccupancy}</span>
                                <span>{occupancyPct.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${getOccupancyColor(occupancyPct)}`}
                                  style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${rack.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                              {rack.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => editRack(rack)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRack(rack.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rack</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLocations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No locations found
                      </td>
                    </tr>
                  ) : (
                    filteredLocations.map((location) => {
                      const rack = racks.find(r => r.id === location.rackId)
                      return (
                        <tr key={location.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FiMapPin className="w-5 h-5 text-gray-400 mr-2" />
                              <span className="font-medium text-gray-900">{location.tagCode || `LOC-${location.id}`}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {rack?.rackCode || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{location.item?.itemName}</div>
                              <div className="text-gray-500">{location.item?.itemCode}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                              {location.item?.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{location.quantity}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(location.lastUpdated).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => editLocation(location)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(location.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {zoneForm.id ? 'Edit Zone' : 'Add New Zone'}
              </h2>
              <button
                onClick={() => setShowZoneModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiAlertCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone Name *</label>
                <input
                  type="text"
                  value={zoneForm.zoneName}
                  onChange={(e) => setZoneForm({ ...zoneForm, zoneName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Main Warehouse"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={zoneForm.description}
                  onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Zone description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={zoneForm.capacity}
                  onChange={(e) => setZoneForm({ ...zoneForm, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="Maximum capacity"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowZoneModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleZoneSubmit}
                disabled={!zoneForm.zoneName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {zoneForm.id ? 'Update' : 'Create'} Zone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rack Modal */}
      {showRackModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {rackForm.id ? 'Edit Rack' : 'Add New Rack'}
              </h2>
              <button
                onClick={() => setShowRackModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiAlertCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rack Code *</label>
                <input
                  type="text"
                  value={rackForm.rackCode}
                  onChange={(e) => setRackForm({ ...rackForm, rackCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., R-A-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zone *</label>
                <select
                  value={rackForm.zoneId}
                  onChange={(e) => setRackForm({ ...rackForm, zoneId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Zone</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.zoneName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <input
                  type="number"
                  value={rackForm.level}
                  onChange={(e) => setRackForm({ ...rackForm, level: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                  placeholder="Rack level"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <input
                  type="text"
                  value={rackForm.position}
                  onChange={(e) => setRackForm({ ...rackForm, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., A1, B2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={rackForm.capacity}
                  onChange={(e) => setRackForm({ ...rackForm, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="Maximum capacity"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowRackModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRackSubmit}
                disabled={!rackForm.rackCode || !rackForm.zoneId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {rackForm.id ? 'Update' : 'Create'} Rack
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Assignment Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {locationForm.id ? 'Update Location' : 'Assign Stock Location'}
              </h2>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiAlertCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tag Code (QR/Barcode)</label>
                <input
                  type="text"
                  value={locationForm.tagCode}
                  onChange={(e) => setLocationForm({ ...locationForm, tagCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., QR-12345 (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rack *</label>
                <select
                  value={locationForm.rackId}
                  onChange={(e) => setLocationForm({ ...locationForm, rackId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Rack</option>
                  {racks.map(rack => (
                    <option key={rack.id} value={rack.id}>
                      {rack.rackCode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item *</label>
                <select
                  value={locationForm.itemId}
                  onChange={(e) => setLocationForm({ ...locationForm, itemId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.itemName} ({item.itemCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  value={locationForm.quantity}
                  onChange={(e) => setLocationForm({ ...locationForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                <input
                  type="text"
                  value={locationForm.batchNumber}
                  onChange={(e) => setLocationForm({ ...locationForm, batchNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Batch number (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={locationForm.expiryDate}
                  onChange={(e) => setLocationForm({ ...locationForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLocationSubmit}
                disabled={!locationForm.rackId || !locationForm.itemId || locationForm.quantity <= 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {locationForm.id ? 'Update' : 'Assign'} Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
