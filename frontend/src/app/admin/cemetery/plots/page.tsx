"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  FiMap, FiMapPin, FiUser, FiCalendar, FiSearch,
  FiFilter, FiPlus, FiEdit, FiTrash2, FiEye,
  FiRefreshCw, FiDownload, FiUpload, FiGrid,
  FiList, FiSettings, FiNavigation, FiClock
} from 'react-icons/fi'
import { 
  MdLocationOn, MdAssignment, MdTerrain, MdLandscape,
  MdSatellite, MdLayers, MdPerson, MdAccountCircle
} from 'react-icons/md'
import { GiGraveFlowers, GiTombstone } from 'react-icons/gi'
import Link from "next/link"

interface CemeteryPlot {
  id: string
  plotNumber: string
  section: string
  block: string
  lot: string
  coordinates: {
    lat: number
    lng: number
  }
  size: 'standard' | 'large' | 'family' | 'niche'
  type: 'ground_burial' | 'niche' | 'mausoleum'
  status: 'vacant' | 'reserved' | 'occupied' | 'unavailable' | 'blocked'
  reservedBy?: string
  occupiedBy?: {
    name: string
    dateOfBirth: string
    dateOfDeath: string
    burialDate: string
    permitNumber: string
    registrationNumber: string
  }
  assignedDate?: string
  lastUpdated: string
  dimensions: {
    length: number
    width: number
    depth?: number
  }
  pricing: {
    baseFee: number
    maintenanceFee: number
    totalFee: number
  }
  restrictions?: string[]
  notes?: string
  gravestone?: {
    material: string
    inscription: string
    dateInstalled: string
    condition: string
  }
}

interface PlotAssignment {
  id: string
  plotId: string
  permitId: string
  deceasedId: string
  assignedBy: string
  assignedDate: string
  burialDate?: string
  status: 'assigned' | 'buried' | 'exhumed'
}

interface CemeteryStatistics {
  totalPlots: number
  vacantPlots: number
  reservedPlots: number
  occupiedPlots: number
  blockedPlots: number
  totalAssignments: number
  occupancyRate: number
}

export default function CemeteryPlotsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [plots, setPlots] = useState<CemeteryPlot[]>([])
  const [statistics, setStatistics] = useState<CemeteryStatistics>({
    totalPlots: 0,
    vacantPlots: 0,
    reservedPlots: 0,
    occupiedPlots: 0,
    blockedPlots: 0,
    totalAssignments: 0,
    occupancyRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedPlot, setSelectedPlot] = useState<CemeteryPlot | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list')
  const [filterSection, setFilterSection] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showPlotModal, setShowPlotModal] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)

  const calculateStatisticsFromPlots = (plotsData: CemeteryPlot[]) => {
    const totalPlots = plotsData.length
    const vacantPlots = plotsData.filter(p => p.status === 'vacant').length
    const reservedPlots = plotsData.filter(p => p.status === 'reserved').length
    const occupiedPlots = plotsData.filter(p => p.status === 'occupied').length
    const blockedPlots = plotsData.filter(p => p.status === 'unavailable' || p.status === 'blocked').length
    const totalAssignments = plotsData.filter(p => p.occupiedBy).length
    const occupancyRate = totalPlots > 0 ? (occupiedPlots / totalPlots) * 100 : 0

    console.log('Calculated statistics from plots:', {
      totalPlots, vacantPlots, reservedPlots, occupiedPlots, blockedPlots, totalAssignments, occupancyRate
    })

    setStatistics({
      totalPlots,
      vacantPlots,
      reservedPlots,
      occupiedPlots,
      blockedPlots,
      totalAssignments,
      occupancyRate
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        console.log('Fetching cemetery data...')
        
        // Fetch plots and statistics in parallel - request all plots for accurate statistics
        const [plotsResponse, statsResponse] = await Promise.all([
          fetch('/api/cemetery-plots?limit=100'),
          fetch('/api/cemetery-statistics')
        ])
        
        console.log('API Response status - Plots:', plotsResponse.status, 'Statistics:', statsResponse.status)
        
        const plotsData = await plotsResponse.json()
        
        console.log('Plots data received:', plotsData)
        
        // Handle both successful and failed responses gracefully
        if (!plotsResponse.ok && plotsData.success === false) {
          console.warn('Plots API returned error:', plotsData.error)
        }
        
        // Transform backend data to match frontend interface
        const transformedPlots = (plotsData.plots || []).map((backendPlot: any) => ({
          id: backendPlot.id.toString(),
          plotNumber: backendPlot.plotCode || `${backendPlot.section}-${backendPlot.block}-${backendPlot.lot}`,
          section: backendPlot.section || '',
          block: backendPlot.block || '',
          lot: backendPlot.lot || '',
          coordinates: {
            lat: backendPlot.latitude ? parseFloat(backendPlot.latitude) : 14.6760,
            lng: backendPlot.longitude ? parseFloat(backendPlot.longitude) : 121.0437
          },
          size: backendPlot.size?.toLowerCase() || 'standard',
          type: 'ground_burial', // Default type since not in backend model
          status: backendPlot.status?.toLowerCase() || 'vacant',
          reservedBy: backendPlot.reserver ? 
            `${backendPlot.reserver.fullNameFirst} ${backendPlot.reserver.fullNameLast}` : undefined,
          occupiedBy: backendPlot.assignments?.length > 0 && backendPlot.assignments[0].deceased ? {
            name: `${backendPlot.assignments[0].deceased.firstName} ${backendPlot.assignments[0].deceased.lastName}`,
            dateOfBirth: backendPlot.assignments[0].deceased.dateOfBirth,
            dateOfDeath: backendPlot.assignments[0].deceased.dateOfDeath,
            burialDate: backendPlot.assignments[0].assignedAt,
            permitNumber: backendPlot.assignments[0].permit?.permitNumber || '',
            registrationNumber: backendPlot.assignments[0].deceased.registrationNumber || ''
          } : undefined,
          assignedDate: backendPlot.assignments?.length > 0 ? 
            backendPlot.assignments[0].assignedAt : backendPlot.reservedUntil,
          lastUpdated: backendPlot.updatedAt || backendPlot.createdAt,
          dimensions: {
            length: 2.0, // Default dimensions
            width: 1.0,
            depth: 2.0
          },
          pricing: {
            baseFee: 5000,
            maintenanceFee: 500,
            totalFee: 5500
          },
          restrictions: [],
          notes: backendPlot.assignments?.[0]?.notes,
          gravestone: undefined
        }))
        
        setPlots(transformedPlots)
        
        // Always calculate statistics from plots data to ensure we have numbers
        calculateStatisticsFromPlots(transformedPlots)
        
        // Also try to get statistics from API (but fallback is already set above)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          console.log('Statistics data received:', statsData)
          if (statsData.success && statsData.statistics) {
            // Only update if we get valid statistics from API
            if (statsData.statistics.totalPlots > 0) {
              setStatistics(statsData.statistics)
            }
          }
        }
        
      } catch (error) {
        console.error('Error fetching cemetery data:', error)
        setPlots([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handlePlotAssignment = async (plotId: string, assignmentData: any) => {
    try {
      console.log('Assigning plot:', plotId, assignmentData)
      
      setPlots(prev => prev.map(plot => 
        plot.id === plotId ? { 
          ...plot, 
          status: 'occupied' as const,
          occupiedBy: assignmentData,
          assignedDate: new Date().toISOString()
        } : plot
      ))
      
      setShowAssignModal(false)
      setSelectedPlot(null)
    } catch (error) {
      console.error('Error assigning plot:', error)
    }
  }

  const handlePlotReservation = async (plotId: string, reservationData: any) => {
    try {
      console.log('Reserving plot:', plotId, reservationData)
      
      setPlots(prev => prev.map(plot => 
        plot.id === plotId ? { 
          ...plot, 
          status: 'reserved' as const,
          reservedBy: reservationData.reservedBy,
          assignedDate: new Date().toISOString()
        } : plot
      ))
      
      setShowReservationModal(false)
      setSelectedPlot(null)
    } catch (error) {
      console.error('Error reserving plot:', error)
    }
  }

  const filteredPlots = plots.filter(plot => {
    const matchesSection = filterSection === 'all' || plot.section.toLowerCase().includes(filterSection.toLowerCase())
    const matchesStatus = filterStatus === 'all' || plot.status.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch = 
      plot.plotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.block.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plot.occupiedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (plot.reservedBy?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSection && matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    const colors = {
      'vacant': 'bg-green-100 text-green-800',
      'reserved': 'bg-yellow-100 text-yellow-800', 
      'occupied': 'bg-blue-100 text-blue-800',
      'blocked': 'bg-red-100 text-red-800',
      'unavailable': 'bg-red-100 text-red-800'
    }
    return colors[normalizedStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (type: string) => {
    const colors = {
      'ground_burial': 'text-brown-600',
      'niche': 'text-purple-600',
      'mausoleum': 'text-gray-600'
    }
    return colors[type as keyof typeof colors] || 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
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
              <span className="mr-3 text-green-600">
                <MdTerrain size={28} />
              </span>
              Cemetery Plot Management
            </h1>
            <p className="text-gray-600">Manage cemetery plots, assignments, and AI mapping integration</p>
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
              href="/admin/cemetery-map"
              className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90 flex items-center"
              style={{backgroundColor: '#2196F3'}}
            >
              <span className="mr-2">
                <FiMap size={16} />
              </span>
              Map View
            </Link>
            <button
              onClick={() => setShowPlotModal(true)}
              className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90 flex items-center"
              style={{backgroundColor: '#4CAF50'}}
            >
              <span className="mr-2">
                <FiPlus size={16} />
              </span>
              Add Plot
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <span className="text-green-600 mr-3">
                <MdLocationOn size={20} />
              </span>
              <div>
                <p className="text-sm font-medium text-green-600">Total Plots</p>
                <p className="text-2xl font-bold text-green-900">{statistics.totalPlots.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
            <div className="flex items-center">
              <span className="text-emerald-600 mr-3">
                <FiMapPin size={20} />
              </span>
              <div>
                <p className="text-sm font-medium text-emerald-600">Vacant</p>
                <p className="text-2xl font-bold text-emerald-900">{statistics.vacantPlots.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <span className="text-yellow-600 mr-3">
                <FiClock size={20} />
              </span>
              <div>
                <p className="text-sm font-medium text-yellow-600">Reserved</p>
                <p className="text-2xl font-bold text-yellow-900">{statistics.reservedPlots.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <span className="text-blue-600 mr-3">
                <GiTombstone size={20} />
              </span>
              <div>
                <p className="text-sm font-medium text-blue-600">Occupied</p>
                <p className="text-2xl font-bold text-blue-900">{statistics.occupiedPlots.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <span className="text-red-600 mr-3">
                <FiSettings size={20} />
              </span>
              <div>
                <p className="text-sm font-medium text-red-600">Blocked</p>
                <p className="text-2xl font-bold text-red-900">{statistics.blockedPlots.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <span className="text-purple-600 mr-3">
                <MdAssignment size={20} />
              </span>
              <div>
                <p className="text-sm font-medium text-purple-600">Occupancy</p>
                <p className="text-2xl font-bold text-purple-900">{statistics.occupancyRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FiSearch size={16} />
              </span>
              <input
                type="text"
                placeholder="Search plots, deceased, section..."
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
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Sections</option>
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
                <option value="Section C">Section C</option>
              </select>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="vacant">Vacant</option>
                <option value="reserved">Reserved</option>
                <option value="occupied">Occupied</option>
                <option value="unavailable">Unavailable</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <FiList size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <FiGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 ${viewMode === 'map' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <FiMap size={16} />
              </button>
            </div>
            <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
              <span className="mr-2">
                <FiDownload size={16} />
              </span>
              Export
            </button>
            <button className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50">
              <span className="mr-2">
                <FiUpload size={16} />
              </span>
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Plot List/Grid */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredPlots.map((plot) => (
            <div key={plot.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{plot.plotNumber}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plot.status)}`}>
                        {plot.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`text-sm font-medium ${getTypeColor(plot.type)}`}>
                        {plot.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {plot.section} • {plot.block} • {plot.lot}
                    </p>
                    {plot.occupiedBy && (
                      <p className="text-sm text-blue-600">
                        Occupied by: {plot.occupiedBy.name}
                      </p>
                    )}
                    {plot.reservedBy && (
                      <p className="text-sm text-yellow-600">
                        Reserved by: {plot.reservedBy}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>₱{plot.pricing.totalFee.toLocaleString()}</p>
                    <p className="text-xs">{plot.size} ({plot.dimensions.length}x{plot.dimensions.width}m)</p>
                  </div>
                </div>

                {plot.occupiedBy && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Burial Date</p>
                        <p className="text-gray-600">{new Date(plot.occupiedBy.burialDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Permit</p>
                        <p className="text-gray-600">{plot.occupiedBy.permitNumber}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Registration</p>
                        <p className="text-gray-600">{plot.occupiedBy.registrationNumber}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPlot(plot)
                        setShowPlotModal(true)
                      }}
                      className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span className="mr-1">
                        <FiEye size={14} />
                      </span>
                      View Details
                    </button>
                    {plot.status === 'vacant' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedPlot(plot)
                            setShowAssignModal(true)
                          }}
                          className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <span className="mr-1">
                            <MdAssignment size={14} />
                          </span>
                          Assign
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPlot(plot)
                            setShowReservationModal(true)
                          }}
                          className="flex items-center px-3 py-2 text-sm text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-colors"
                        >
                          <span className="mr-1">
                            <FiClock size={14} />
                          </span>
                          Reserve
                        </button>
                      </>
                    )}
                    <button className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="mr-1">
                        <FiEdit size={14} />
                      </span>
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
                      Updated: {new Date(plot.lastUpdated).toLocaleDateString()}
                    </span>
                    {plot.gravestone && (
                      <span className="text-xs text-gray-500 flex items-center">
                        <span className="mr-1">
                          <GiGraveFlowers size={12} />
                        </span>
                        Gravestone
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlots.map((plot) => (
            <div key={plot.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{plot.plotNumber}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plot.status)}`}>
                    {plot.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{plot.section}</p>
                <p className="text-sm text-gray-600 mb-3">{plot.block} • {plot.lot}</p>
                
                {plot.occupiedBy && (
                  <div className="mb-3 p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Occupied by:</p>
                    <p className="text-sm font-medium text-gray-800">{plot.occupiedBy.name}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">₱{plot.pricing.totalFee.toLocaleString()}</span>
                  <span className="text-gray-500">{plot.size}</span>
                </div>
                
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedPlot(plot)
                      setShowPlotModal(true)
                    }}
                    className="flex-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                  >
                    View
                  </button>
                  {plot.status === 'vacant' && (
                    <button
                      onClick={() => {
                        setSelectedPlot(plot)
                        setShowAssignModal(true)
                      }}
                      className="flex-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded"
                    >
                      Assign
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'map' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <span className="text-gray-400 mb-2 block">
                <MdSatellite size={48} />
              </span>
              <p className="text-gray-600 mb-4">Interactive Cemetery Map</p>
              <Link
                href="/admin/cemetery-map"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open Full Map View
              </Link>
            </div>
          </div>
        </div>
      )}

      {filteredPlots.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <span className="mx-auto text-gray-400 mb-4 block">
            <MdLocationOn size={48} />
          </span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No plots found</h3>
          <p className="text-gray-600">No cemetery plots match your current search and filter criteria.</p>
        </div>
      )}
    </div>
  )
}