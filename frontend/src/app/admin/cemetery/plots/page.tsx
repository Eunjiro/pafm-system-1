"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  FiMap, FiMapPin, FiUser, FiCalendar, FiSearch,
  FiFilter, FiPlus, FiEdit, FiTrash2, FiEye,
  FiRefreshCw, FiDownload, FiUpload, FiGrid,
  FiList, FiSettings, FiNavigation, FiClock, FiX, FiCheck
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
  maxLayers?: number
  assignments?: Array<{
    id: string
    layer: number
    deceasedName: string
    dateOfBirth: string
    dateOfDeath: string
    burialDate?: string
    status: string
  }>
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



interface BurialFormData {
  firstName: string
  lastName: string
  middleName: string
  dateOfBirth: string
  dateOfDeath: string
  burialDate: string
  gender: 'male' | 'female' | ''
  causeOfDeath: string
  occupation: string
  permitNumber: string
  registrationNumber: string
  contactPerson: string
  contactNumber: string
  relationship: string
  layer: number
  notes: string
}

interface ReservationFormData {
  reservedBy: string
  contactNumber: string
  reservationDate: string
  expiryDate: string
  purpose: string
  notes: string
}

interface EditPlotFormData {
  plotNumber: string
  section: string
  block: string
  lot: string
  size: 'standard' | 'large' | 'family' | 'niche'
  type: 'ground_burial' | 'niche' | 'mausoleum'
  baseFee: number
  maintenanceFee: number
  length: number
  width: number
  depth: number
  restrictions: string
  notes: string
}

/**
 * Cemetery Plots Management Page - PRODUCTION VERSION
 * 
 * This component manages cemetery plots with BACKEND-ONLY data storage:
 * - Backend API: Persistent server-side data from database
 * - Authentication: Required for all operations
 * - No localStorage: Production systems must use centralized database
 * 
 * For production deployment:
 * 1. Backend must be running and accessible
 * 2. Database must contain plot data
 * 3. Authentication must be properly configured
 * 4. No localStorage fallbacks (causes data inconsistency)
 */
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
  const [showPlotModal, setShowPlotModal] = useState(false)
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [showBurialModal, setShowBurialModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPlot, setEditingPlot] = useState<CemeteryPlot | null>(null)
  
  // Form data states
  const [burialForm, setBurialForm] = useState<BurialFormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    dateOfDeath: '',
    burialDate: '',
    gender: '',
    causeOfDeath: '',
    occupation: '',
    permitNumber: '',
    registrationNumber: '',
    contactPerson: '',
    contactNumber: '',
    relationship: '',
    layer: 1,
    notes: ''
  })
  
  const [reservationForm, setReservationForm] = useState<ReservationFormData>({
    reservedBy: '',
    contactNumber: '',
    reservationDate: '',
    expiryDate: '',
    purpose: '',
    notes: ''
  })
  
  const [editForm, setEditForm] = useState<EditPlotFormData>({
    plotNumber: '',
    section: '',
    block: '',
    lot: '',
    size: 'standard',
    type: 'ground_burial',
    baseFee: 0,
    maintenanceFee: 0,
    length: 0,
    width: 0,
    depth: 0,
    restrictions: '',
    notes: ''
  })

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
        
        console.log('Loading cemetery data from new backend API...')
        
        // Load data from new cemetery API
        const response = await fetch('/api/cemeteries')
        console.log('Cemetery API response status:', response.status)
        
        if (response.ok) {
          const result = await response.json()
          console.log('Cemetery API result:', result)
          
          if (result.success && result.data && result.data.length > 0) {
            // Extract all plots from all cemeteries
            const allPlots: CemeteryPlot[] = []
            
            result.data.forEach((cemetery: any) => {
              if (cemetery.sections && cemetery.sections.length > 0) {
                cemetery.sections.forEach((section: any) => {
                  if (section.blocks && section.blocks.length > 0) {
                    section.blocks.forEach((block: any) => {
                      if (block.plots && block.plots.length > 0) {
                        block.plots.forEach((plot: any) => {
                          // Transform backend plot data to match our interface
                          const plotData: CemeteryPlot = {
                            id: plot.id.toString(),
                            plotNumber: plot.plotNumber || plot.plotCode || `Plot-${plot.id}`,
                            section: section.name,
                            block: block.name,
                            lot: plot.plotNumber || plot.plotCode || `Lot-${plot.id}`,
                            coordinates: {
                              lat: plot.latitude ? parseFloat(plot.latitude) : 14.6760,
                              lng: plot.longitude ? parseFloat(plot.longitude) : 121.0437
                            },
                            size: plot.size.toLowerCase() as 'standard' | 'large' | 'family' | 'niche',
                            type: 'ground_burial',
                            status: plot.status.toLowerCase() === 'vacant' ? 'vacant' : 
                                   plot.status.toLowerCase() === 'occupied' ? 'occupied' : 
                                   plot.status.toLowerCase() === 'reserved' ? 'reserved' : 'vacant',
                            occupiedBy: plot.assignments && plot.assignments.length > 0 ? {
                              name: `${plot.assignments.length} burial${plot.assignments.length > 1 ? 's' : ''} (${plot.assignments.length}/${plot.maxLayers || 3} layers)`,
                              dateOfBirth: plot.assignments[0].deceased?.dateOfBirth || '',
                              dateOfDeath: plot.assignments[0].deceased?.dateOfDeath || '',
                              burialDate: plot.assignments[0].assignedAt || '',
                              permitNumber: '',
                              registrationNumber: ''
                            } : undefined,
                            assignments: plot.assignments || [],
                            assignedDate: plot.assignments && plot.assignments.length > 0 ? plot.assignments[0].assignedAt : undefined,
                            lastUpdated: plot.updatedAt || new Date().toISOString(),
                            dimensions: {
                              length: plot.length || 2.0,
                              width: plot.width || 1.0,
                              depth: plot.depth || 2.0
                            },
                            pricing: {
                              baseFee: parseFloat(plot.baseFee) || 5000,
                              maintenanceFee: parseFloat(plot.maintenanceFee) || 500,
                              totalFee: (parseFloat(plot.baseFee) || 5000) + (parseFloat(plot.maintenanceFee) || 500)
                            },
                            restrictions: [],
                            notes: plot.notes || '',
                            gravestone: plot.gravestones && plot.gravestones.length > 0 ? {
                              material: plot.gravestones[0].material.toLowerCase(),
                              inscription: plot.gravestones[0].inscription || '',
                              dateInstalled: plot.gravestones[0].dateInstalled || '',
                              condition: plot.gravestones[0].condition.toLowerCase()
                            } : undefined
                          }
                          
                          allPlots.push(plotData)
                        })
                      }
                    })
                  }
                })
              }
            })
            
            console.log('Extracted plots from cemetery structure:', allPlots.length)
            setPlots(allPlots)
            
            // Calculate statistics from plots data
            calculateStatisticsFromPlots(allPlots)
          } else {
            console.warn('No cemetery data received from backend')
            setPlots([])
            calculateStatisticsFromPlots([])
          }
        } else {
          console.error('Cemetery API failed with status:', response.status)
          
          // PRODUCTION: Show proper error message
          const errorMessage = response.status === 401 
            ? 'Authentication required. Please sign in to access cemetery data.'
            : response.status === 404
            ? 'No cemetery plots found in database. Please add plots via cemetery management.'
            : `Backend service error (${response.status}). Please contact system administrator.`
          
          console.error('PRODUCTION ERROR:', errorMessage)
          alert(errorMessage)
          setPlots([])
          throw new Error(errorMessage)
        }
        
      } catch (error) {
        console.error('PRODUCTION: Backend API failed - no localStorage fallback in production:', error)
        
        // PRODUCTION: Only show backend errors, no localStorage fallback
        const errorMessage = error instanceof Error ? error.message : 'Failed to load cemetery data'
        
        // Show user-friendly error message
        if (errorMessage.includes('Authentication')) {
          alert('Please sign in to access cemetery data.')
        } else if (errorMessage.includes('fetch')) {
          alert('Backend service unavailable. Please contact system administrator.')
        } else {
          alert('Error loading cemetery data. Please try again or contact support.')
        }
        
        setPlots([])
        calculateStatisticsFromPlots([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Listen for cemetery data updates from other components (like Cemetery Management)
  useEffect(() => {
    const handleCemeteryDataUpdate = async (event: CustomEvent) => {
      console.log('Plot management received cemetery data update:', event.detail)
      
      // If the update is from the cemetery map, refresh our data
      if (event.detail?.type === 'assignment' && event.detail?.source === 'cemetery-map') {
        console.log('Refreshing plot data due to cemetery map assignment...')
        await refreshData()
      }
    }

    // Create a wrapper function that handles the event type properly
    const eventHandler = (event: Event) => {
      handleCemeteryDataUpdate(event as CustomEvent)
    }

    // Add event listener for cemetery data updates
    window.addEventListener('cemeteryDataUpdated', eventHandler)

    // Cleanup event listener
    return () => {
      window.removeEventListener('cemeteryDataUpdated', eventHandler)
    }
  }, [])

  // Refresh data from backend API
  const refreshData = async () => {
    try {
      setLoading(true)
      
      console.log('Refreshing cemetery data from new backend API...')
      
      // Load data from new cemetery API
      const response = await fetch('/api/cemeteries')
      console.log('Cemetery API response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data) {
          // Extract all plots from all cemeteries
          const allPlots: CemeteryPlot[] = []
          
          result.data.forEach((cemetery: any) => {
            if (cemetery.sections && cemetery.sections.length > 0) {
              cemetery.sections.forEach((section: any) => {
                if (section.blocks && section.blocks.length > 0) {
                  section.blocks.forEach((block: any) => {
                    if (block.plots && block.plots.length > 0) {
                      block.plots.forEach((plot: any) => {
                        // Transform backend plot data to match our interface
                        const plotData: CemeteryPlot = {
                          id: plot.id.toString(),
                          plotNumber: plot.plotNumber || plot.plotCode || `Plot-${plot.id}`,
                          section: section.name,
                          block: block.name,
                          lot: plot.plotNumber || plot.plotCode || `Lot-${plot.id}`,
                          coordinates: {
                            lat: plot.latitude ? parseFloat(plot.latitude) : 14.6760,
                            lng: plot.longitude ? parseFloat(plot.longitude) : 121.0437
                          },
                          size: plot.size.toLowerCase() as 'standard' | 'large' | 'family' | 'niche',
                          type: 'ground_burial',
                          status: plot.status.toLowerCase() === 'vacant' ? 'vacant' : 
                                 plot.status.toLowerCase() === 'occupied' ? 'occupied' : 
                                 plot.status.toLowerCase() === 'reserved' ? 'reserved' : 'vacant',
                          occupiedBy: plot.assignments && plot.assignments.length > 0 ? {
                            name: `${plot.assignments.length} burial${plot.assignments.length > 1 ? 's' : ''} (${plot.assignments.length}/${plot.maxLayers || 3} layers)`,
                            dateOfBirth: plot.assignments[0].deceased?.dateOfBirth || '',
                            dateOfDeath: plot.assignments[0].deceased?.dateOfDeath || '',
                            burialDate: plot.assignments[0].assignedAt || '',
                            permitNumber: '',
                            registrationNumber: ''
                          } : undefined,
                          assignments: plot.assignments || [],
                          assignedDate: plot.assignments && plot.assignments.length > 0 ? plot.assignments[0].assignedAt : undefined,
                          lastUpdated: plot.updatedAt || new Date().toISOString(),
                          dimensions: {
                            length: plot.length || 2.0,
                            width: plot.width || 1.0,
                            depth: plot.depth || 2.0
                          },
                          pricing: {
                            baseFee: parseFloat(plot.baseFee) || 5000,
                            maintenanceFee: parseFloat(plot.maintenanceFee) || 500,
                            totalFee: (parseFloat(plot.baseFee) || 5000) + (parseFloat(plot.maintenanceFee) || 500)
                          },
                          restrictions: [],
                          notes: plot.notes || '',
                          gravestone: plot.gravestones && plot.gravestones.length > 0 ? {
                            material: plot.gravestones[0].material.toLowerCase(),
                            inscription: plot.gravestones[0].inscription || '',
                            dateInstalled: plot.gravestones[0].dateInstalled || '',
                            condition: plot.gravestones[0].condition.toLowerCase()
                          } : undefined
                        }
                        
                        allPlots.push(plotData)
                      })
                    }
                  })
                }
              })
            }
          })
          
          console.log('Cemetery plots refreshed:', allPlots.length)
          setPlots(allPlots)
          
          // Calculate statistics from plots data
          calculateStatisticsFromPlots(allPlots)
        } else {
          console.warn('No data received from backend during refresh')
          setPlots([])
        }
      } else {
        console.error('Cemetery API refresh failed with status:', response.status)
        throw new Error(`API refresh failed with status ${response.status}`)
      }
      
    } catch (error) {
      console.error('PRODUCTION: Error refreshing cemetery data from backend - no localStorage fallback:', error)
      
      // PRODUCTION: Show proper error handling without localStorage
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh cemetery data'
      
      if (errorMessage.includes('Authentication')) {
        alert('Session expired. Please sign in again to access cemetery data.')
      } else if (errorMessage.includes('fetch')) {
        alert('Backend service unavailable. Please check your connection or contact support.')
      } else {
        alert('Error refreshing data. Please try again.')
      }
      
      // Keep existing data instead of clearing it during refresh errors
      console.log('Keeping existing plot data due to refresh error')
      calculateStatisticsFromPlots(plots) // Recalculate with existing data
    } finally {
      setLoading(false)
    }
  }



  const handlePlotReservation = async (plotId: string, reservationData: any) => {
    try {
      console.log('Reserving plot:', plotId, reservationData)
      
      // Find the current plot to get existing data
      const currentPlot = plots.find(p => p.id === plotId)
      if (!currentPlot) {
        throw new Error('Plot not found')
      }
      
      // Prepare reservation data for backend API with all required fields
      const reservationPayload = {
        section: currentPlot.section,
        block: currentPlot.block,
        lot: currentPlot.lot,
        coordinates: [currentPlot.coordinates.lat, currentPlot.coordinates.lng],
        size: currentPlot.size,
        status: 'reserved',
        notes: `Reserved by ${reservationData.reservedBy} - Purpose: ${reservationData.purpose}`,
        // Additional reservation details for our system
        reservationDetails: {
          reservedBy: reservationData.reservedBy,
          contactNumber: reservationData.contactNumber,
          reservationDate: reservationData.reservationDate,
          expiryDate: reservationData.expiryDate,
          purpose: reservationData.purpose,
          notes: reservationData.notes
        },
        reservedDate: new Date().toISOString()
      }

      // Send reservation to backend API
      console.log('Sending reservation payload:', reservationPayload)
      
      const response = await fetch(`/api/cemetery-plots/${plotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationPayload)
      })

      console.log('Reservation response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Backend reservation successful:', result)
        
        setShowReservationModal(false)
        setSelectedPlot(null)
        
        // Refresh data from backend to get updated state
        await refreshData()
        
        // Trigger a global refresh event for other components (like cemetery map)
        window.dispatchEvent(new CustomEvent('cemeteryDataUpdated', {
          detail: { type: 'reservation', plotId: plotId }
        }))
        
        console.log('Plot reservation completed successfully')
        alert('Plot reserved successfully!')
      } else {
        const errorData = await response.text()
        console.error('Backend reservation failed:', {
          status: response.status,
          error: errorData,
          plotId: plotId
        })
        throw new Error(`Reservation failed: ${errorData}`)
      }
      
    } catch (error) {
      console.error('Error reserving plot:', error)
      alert('Error reserving plot. Please try again.')
    }
  }

  // Handle View Details - Navigate to cemetery map with plot focus
  const handleViewDetails = (plot: CemeteryPlot) => {
    console.log('Viewing plot details:', plot)
    
    // Navigate to cemetery map with plot focus parameters
    const mapUrl = `/admin/cemetery-map?plotId=${encodeURIComponent(plot.id)}&focus=true&section=${encodeURIComponent(plot.section)}&block=${encodeURIComponent(plot.block)}`
    
    console.log('Navigating to cemetery map:', mapUrl)
    router.push(mapUrl)
  }

  // Handle Edit Plot
  const handleEditPlot = (plot: CemeteryPlot) => {
    setEditingPlot(plot)
    setEditForm({
      plotNumber: plot.plotNumber,
      section: plot.section,
      block: plot.block,
      lot: plot.lot,
      size: plot.size,
      type: plot.type,
      baseFee: plot.pricing.baseFee,
      maintenanceFee: plot.pricing.maintenanceFee,
      length: plot.dimensions.length,
      width: plot.dimensions.width,
      depth: plot.dimensions.depth || 2.0,
      restrictions: plot.restrictions?.join(', ') || '',
      notes: plot.notes || ''
    })
    setShowEditModal(true)
  }

  // Handle Save Edit
  const handleSaveEdit = async () => {
    if (!editingPlot) return

    try {
      const updatedPlot: CemeteryPlot = {
        ...editingPlot,
        plotNumber: editForm.plotNumber,
        section: editForm.section,
        block: editForm.block,
        lot: editForm.lot,
        size: editForm.size,
        type: editForm.type,
        dimensions: {
          length: editForm.length,
          width: editForm.width,
          depth: editForm.depth
        },
        pricing: {
          baseFee: editForm.baseFee,
          maintenanceFee: editForm.maintenanceFee,
          totalFee: editForm.baseFee + editForm.maintenanceFee
        },
        restrictions: editForm.restrictions ? editForm.restrictions.split(',').map(r => r.trim()) : [],
        notes: editForm.notes,
        lastUpdated: new Date().toISOString()
      }

      // Prepare edit data for backend API with required fields
      const editPayload = {
        section: editForm.section,
        block: editForm.block,
        lot: editForm.lot,
        coordinates: [editingPlot.coordinates.lat, editingPlot.coordinates.lng],
        size: editForm.size,
        status: editingPlot.status,
        occupant: editingPlot.occupiedBy?.name,
        notes: editForm.notes,
        // Additional edit details for our system
        plotNumber: editForm.plotNumber,
        type: editForm.type,
        dimensions: {
          length: editForm.length,
          width: editForm.width,
          depth: editForm.depth
        },
        pricing: {
          baseFee: editForm.baseFee,
          maintenanceFee: editForm.maintenanceFee,
          totalFee: editForm.baseFee + editForm.maintenanceFee
        },
        restrictions: editForm.restrictions ? editForm.restrictions.split(',').map(r => r.trim()) : [],
        lastUpdated: new Date().toISOString()
      }

      // Send edits to backend API
      console.log('Sending edit payload:', editPayload)
      
      const response = await fetch(`/api/cemetery-plots/${editingPlot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editPayload)
      })

      console.log('Edit response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Backend edit successful:', result)
        
        setShowEditModal(false)
        setEditingPlot(null)
        
        // Refresh data from backend to get updated state
        await refreshData()
        
        // Trigger a global refresh event for other components (like cemetery map)
        window.dispatchEvent(new CustomEvent('cemeteryDataUpdated', {
          detail: { type: 'edit', plotId: editingPlot.id }
        }))
        
        console.log('Plot updated successfully:', editForm.plotNumber)
        alert('Plot updated successfully!')
      } else {
        const errorData = await response.text()
        console.error('Backend edit failed:', {
          status: response.status,
          error: errorData,
          plotId: editingPlot.id
        })
        throw new Error(`Edit failed: ${errorData}`)
      }
      
    } catch (error) {
      console.error('Error updating plot:', error)
      alert('Error updating plot. Please try again.')
    }
  }

  // Handle Delete Plot with backend API
  const handleDeletePlot = async (plot: CemeteryPlot) => {
    if (!window.confirm(`Are you sure you want to delete plot ${plot.plotNumber}? This action cannot be undone.`)) {
      return
    }

    try {
      // Send delete request to backend API
      console.log('Deleting plot:', plot.id)
      
      const response = await fetch(`/api/cemetery-plots/${plot.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      console.log('Delete response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Backend delete successful:', result)
        
        // Remove plot from local state immediately for better UX
        setPlots(prevPlots => prevPlots.filter(p => p.id !== plot.id))
        
        // Recalculate statistics
        const updatedPlots = plots.filter(p => p.id !== plot.id)
        calculateStatisticsFromPlots(updatedPlots)
        
        // Trigger a global refresh event for other components (like cemetery map)
        window.dispatchEvent(new CustomEvent('cemeteryDataUpdated', {
          detail: { type: 'delete', plotId: plot.id }
        }))
        
        console.log('Plot deleted successfully:', plot.plotNumber)
        alert('Plot deleted successfully!')
        
        // Refresh data from backend to ensure consistency
        await refreshData()
      } else {
        const errorData = await response.text()
        console.error('Backend delete failed:', {
          status: response.status,
          error: errorData,
          plotId: plot.id
        })
        
        if (response.status === 404) {
          // Plot doesn't exist in backend, remove from frontend state
          setPlots(prevPlots => prevPlots.filter(p => p.id !== plot.id))
          const updatedPlots = plots.filter(p => p.id !== plot.id)
          calculateStatisticsFromPlots(updatedPlots)
          alert('Plot was already removed from the database.')
        } else {
          throw new Error(`Delete failed: ${errorData}`)
        }
      }
      
    } catch (error) {
      console.error('Error deleting plot:', error)
      alert('Error deleting plot. Please try again.')
    }
  }



  // Handle Burial Assignment
  const handleBurialAssignment = async (plotId: string, burialData: BurialFormData) => {
    try {
      console.log('Assigning burial to plot:', plotId, burialData)
      
      // Prepare burial assignment data for unified API (matching Cemetery Management format)
      const burialPayload = {
        plotId: parseInt(plotId),
        deceased: {
          firstName: burialData.firstName,
          lastName: burialData.lastName,
          middleName: burialData.middleName || '',
          dateOfBirth: burialData.dateOfBirth,
          dateOfDeath: burialData.dateOfDeath,
          gender: burialData.gender || 'male',
          causeOfDeath: burialData.causeOfDeath || '',
          occupation: burialData.occupation || '',
          placeOfDeath: '', // Not captured in plot management form
          residenceAddress: '', // Not captured in plot management form
          citizenship: 'Filipino', // Default
          civilStatus: 'Single' // Default
        },
        permitId: burialData.permitNumber || null,
        layer: burialData.layer || 1, // Include layer information
        notes: `Plot Management Assignment - Layer ${burialData.layer}${burialData.permitNumber ? `, Permit: ${burialData.permitNumber}` : ''}${burialData.registrationNumber ? `, Registration: ${burialData.registrationNumber}` : ''}${burialData.contactPerson ? `, Contact: ${burialData.contactPerson} (${burialData.relationship}) - ${burialData.contactNumber}` : ''}${burialData.notes ? `, Additional Notes: ${burialData.notes}` : ''}`
      }

      // Send burial assignment to unified API
      console.log('Sending burial assignment payload:', burialPayload)
      
      const response = await fetch('/api/burial-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(burialPayload)
      })

      console.log('Burial assignment response status:', response.status)
      console.log('Burial assignment response headers:', response.headers)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Burial assignment successful:', result)
        
        setShowBurialModal(false)
        setSelectedPlot(null)
        
        // Refresh data from backend to get updated state
        await refreshData()
        
        // Trigger a global refresh event for other components
        window.dispatchEvent(new CustomEvent('cemeteryDataUpdated', {
          detail: { type: 'burial-assignment', plotId: plotId, source: 'plot-management' }
        }))
        
        console.log('Burial assignment completed successfully from Plot Management')
        alert('Burial assigned successfully!')
      } else {
        let errorData
        let errorDetails = 'Unknown error'
        
        try {
          errorData = await response.text()
          console.log('Raw error response:', errorData)
          
          // Try to parse as JSON
          try {
            const jsonError = JSON.parse(errorData)
            errorDetails = jsonError.error || jsonError.message || 'Unknown error'
          } catch (e) {
            // Not JSON, use raw text
            errorDetails = errorData || 'Unknown error'
          }
        } catch (e) {
          console.error('Failed to read error response:', e)
          errorDetails = 'Failed to read error response'
        }
        
        console.error('Burial assignment failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          errorDetails: errorDetails,
          plotId: plotId,
          url: response.url,
          payload: burialPayload
        })
        
        alert(`Burial assignment failed: ${errorDetails}`)
        throw new Error(`Burial assignment failed: ${errorDetails}`)
      }
      
    } catch (error) {
      console.error('Error assigning burial:', error)
      alert('Error assigning burial. Please try again.')
    }
  }

  // Handle Burial Form Submit
  const handleBurialSubmit = async () => {
    if (!selectedPlot) return

    // Validate required fields
    if (!burialForm.firstName || !burialForm.lastName) {
      alert('Please enter both First Name and Last Name for the deceased.')
      return
    }

    if (!burialForm.dateOfDeath) {
      alert('Please enter the Date of Death.')
      return
    }

    await handleBurialAssignment(selectedPlot.id, burialForm)
    
    // Reset form
    setBurialForm({
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      dateOfDeath: '',
      burialDate: '',
      gender: '',
      causeOfDeath: '',
      occupation: '',
      permitNumber: '',
      registrationNumber: '',
      contactPerson: '',
      contactNumber: '',
      relationship: '',
      layer: 1,
      notes: ''
    })
  }

  // Handle Reservation Form Submit
  const handleReservationSubmit = async () => {
    if (!selectedPlot) return

    await handlePlotReservation(selectedPlot.id, {
      reservedBy: reservationForm.reservedBy,
      contactNumber: reservationForm.contactNumber,
      reservationDate: reservationForm.reservationDate,
      expiryDate: reservationForm.expiryDate,
      purpose: reservationForm.purpose,
      notes: reservationForm.notes
    })
    
    // Reset form
    setReservationForm({
      reservedBy: '',
      contactNumber: '',
      reservationDate: '',
      expiryDate: '',
      purpose: '',
      notes: ''
    })
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
            <p className="text-gray-600">Comprehensive view of all plots across all cemeteries with burial management</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={refreshData}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
            >
              <span className="mr-2">
                <FiRefreshCw size={16} />
              </span>
              Refresh
            </button>
            <Link
              href="/admin/cemetery"
              className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90 flex items-center"
              style={{backgroundColor: '#8B5CF6'}}
            >
              <span className="mr-2">
                <FiNavigation size={16} />
              </span>
              Cemetery Management
            </Link>
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
                      onClick={() => handleViewDetails(plot)}
                      className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span className="mr-1">
                        <FiEye size={14} />
                      </span>
                      View on Map
                    </button>
                    {plot.status === 'vacant' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedPlot(plot)
                            setShowBurialModal(true)
                          }}
                          className="flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <span className="mr-1">
                            <GiTombstone size={14} />
                          </span>
                          Assign Burial
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
                    <button 
                      onClick={() => handleEditPlot(plot)}
                      className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <span className="mr-1">
                        <FiEdit size={14} />
                      </span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlot(plot)}
                      className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <span className="mr-1">
                        <FiTrash2 size={14} />
                      </span>
                      Delete
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
                
                <div className="mt-3 flex space-x-1">
                  <button
                    onClick={() => handleViewDetails(plot)}
                    className="flex-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                    title="View on Map"
                  >
                    View
                  </button>
                  {plot.status === 'vacant' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedPlot(plot)
                          setShowBurialModal(true)
                        }}
                        className="flex-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded"
                        title="Assign Burial"
                      >
                        Burial
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPlot(plot)
                          setShowReservationModal(true)
                        }}
                        className="flex-1 px-2 py-1 text-xs text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Reserve Plot"
                      >
                        Reserve
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleEditPlot(plot)}
                    className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded"
                    title="Edit Plot"
                  >
                    <FiEdit size={12} />
                  </button>
                  <button
                    onClick={() => handleDeletePlot(plot)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    title="Delete Plot"
                  >
                    <FiTrash2 size={12} />
                  </button>
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
          {plots.length === 0 ? (
            <div className="space-y-4">
              <p className="text-gray-600">No cemetery plots have been created yet.</p>
              <p className="text-sm text-blue-600">
                📍 To create plots, go to <strong>Cemetery Management</strong> and set up:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-left max-w-md mx-auto">
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Create a cemetery layout</li>
                  <li>2. Add sections to divide the cemetery</li>
                  <li>3. Create blocks within sections</li>
                  <li>4. Generate plots within blocks</li>
                </ol>
              </div>
              <Link
                href="/admin/cemetery"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2"><FiNavigation size={16} /></span>
                Go to Cemetery Management
              </Link>
            </div>
          ) : (
            <p className="text-gray-600">No cemetery plots match your current search and filter criteria.</p>
          )}
        </div>
      )}



      {/* Burial Assignment Modal */}
      {showBurialModal && selectedPlot && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white rounded-lg shadow-2xl border border-gray-300 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Assign Burial - Plot {selectedPlot.plotNumber}
                </h2>
                <button
                  onClick={() => setShowBurialModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleBurialSubmit(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Basic Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={burialForm.firstName}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={burialForm.lastName}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={burialForm.middleName}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, middleName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender *
                    </label>
                    <select
                      value={burialForm.gender}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  {/* Dates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={burialForm.dateOfBirth}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Death *
                    </label>
                    <input
                      type="date"
                      value={burialForm.dateOfDeath}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, dateOfDeath: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Burial Date *
                    </label>
                    <input
                      type="date"
                      value={burialForm.burialDate}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, burialDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Burial Layer *
                    </label>
                    <select
                      value={burialForm.layer}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, layer: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      {selectedPlot ? (
                        Array.from({length: selectedPlot.maxLayers || 3}, (_, i) => {
                          const layer = i + 1
                          const isOccupied = selectedPlot.assignments?.some((assignment: any) => 
                            assignment.layer === layer && assignment.status === 'ASSIGNED'
                          )
                          return (
                            <option key={layer} value={layer} disabled={isOccupied}>
                              Layer {layer} {isOccupied ? '(Occupied)' : '(Available)'}
                            </option>
                          )
                        })
                      ) : (
                        <option value="">Select plot first</option>
                      )}
                    </select>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cause of Death
                    </label>
                    <input
                      type="text"
                      value={burialForm.causeOfDeath}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, causeOfDeath: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={burialForm.occupation}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, occupation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Optional"
                    />
                  </div>

                  {/* Permit Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permit Number
                    </label>
                    <input
                      type="text"
                      value={burialForm.permitNumber}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, permitNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={burialForm.registrationNumber}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Optional"
                    />
                  </div>

                  {/* Contact Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      value={burialForm.contactPerson}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={burialForm.contactNumber}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship to Deceased *
                    </label>
                    <select
                      value={burialForm.relationship}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, relationship: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select Relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Relative">Other Relative</option>
                      <option value="Friend">Friend</option>
                      <option value="Legal Guardian">Legal Guardian</option>
                    </select>
                  </div>
                  
                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={burialForm.notes}
                      onChange={(e) => setBurialForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Any additional information about the burial..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowBurialModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <span className="mr-2">
                      <GiTombstone size={16} />
                    </span>
                    Assign Burial
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Plot Reservation Modal */}
      {showReservationModal && selectedPlot && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white rounded-lg shadow-2xl border border-gray-300 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Reserve Plot {selectedPlot.plotNumber}
                </h2>
                <button
                  onClick={() => setShowReservationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleReservationSubmit(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reserved By *
                    </label>
                    <input
                      type="text"
                      value={reservationForm.reservedBy}
                      onChange={(e) => setReservationForm(prev => ({ ...prev, reservedBy: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={reservationForm.contactNumber}
                      onChange={(e) => setReservationForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reservation Date *
                    </label>
                    <input
                      type="date"
                      value={reservationForm.reservationDate}
                      onChange={(e) => setReservationForm(prev => ({ ...prev, reservationDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={reservationForm.expiryDate}
                      onChange={(e) => setReservationForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose *
                    </label>
                    <select
                      value={reservationForm.purpose}
                      onChange={(e) => setReservationForm(prev => ({ ...prev, purpose: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    >
                      <option value="">Select Purpose</option>
                      <option value="Future Burial">Future Burial</option>
                      <option value="Family Plot">Family Plot</option>
                      <option value="Pre-need">Pre-need Purchase</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={reservationForm.notes}
                      onChange={(e) => setReservationForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="Additional notes or special requests..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowReservationModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
                  >
                    <span className="mr-2">
                      <FiClock size={16} />
                    </span>
                    Reserve Plot
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Plot Edit Modal */}
      {showEditModal && editingPlot && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white rounded-lg shadow-2xl border border-gray-300 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Plot {editingPlot.plotNumber}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plot Number *
                    </label>
                    <input
                      type="text"
                      value={editForm.plotNumber}
                      onChange={(e) => setEditForm(prev => ({ ...prev, plotNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section *
                    </label>
                    <input
                      type="text"
                      value={editForm.section}
                      onChange={(e) => setEditForm(prev => ({ ...prev, section: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Block *
                    </label>
                    <input
                      type="text"
                      value={editForm.block}
                      onChange={(e) => setEditForm(prev => ({ ...prev, block: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lot *
                    </label>
                    <input
                      type="text"
                      value={editForm.lot}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lot: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size *
                    </label>
                    <select
                      value={editForm.size}
                      onChange={(e) => setEditForm(prev => ({ ...prev, size: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="standard">Standard</option>
                      <option value="large">Large</option>
                      <option value="family">Family</option>
                      <option value="niche">Niche</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="ground_burial">Ground Burial</option>
                      <option value="niche">Niche</option>
                      <option value="mausoleum">Mausoleum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Length (m) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.length}
                      onChange={(e) => setEditForm(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (m) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.width}
                      onChange={(e) => setEditForm(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Depth (m) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.depth}
                      onChange={(e) => setEditForm(prev => ({ ...prev, depth: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Fee (₱) *
                    </label>
                    <input
                      type="number"
                      value={editForm.baseFee}
                      onChange={(e) => setEditForm(prev => ({ ...prev, baseFee: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maintenance Fee (₱) *
                    </label>
                    <input
                      type="number"
                      value={editForm.maintenanceFee}
                      onChange={(e) => setEditForm(prev => ({ ...prev, maintenanceFee: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Fee: ₱{(editForm.baseFee + editForm.maintenanceFee).toLocaleString()}
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                      ₱{(editForm.baseFee + editForm.maintenanceFee).toLocaleString()}
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Restrictions
                    </label>
                    <input
                      type="text"
                      value={editForm.restrictions}
                      onChange={(e) => setEditForm(prev => ({ ...prev, restrictions: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Comma-separated restrictions..."
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes or comments..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <span className="mr-2">
                      <FiEdit size={16} />
                    </span>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Plot Details Modal */}
      {showPlotModal && selectedPlot && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white rounded-lg shadow-2xl border border-gray-300 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Plot Details: {selectedPlot.plotNumber}
                </h2>
                <button
                  onClick={() => setShowPlotModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Plot Number</label>
                      <p className="text-gray-900">{selectedPlot.plotNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-gray-900">{selectedPlot.section} • {selectedPlot.block} • {selectedPlot.lot}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPlot.status)}`}>
                        {selectedPlot.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Size & Type</label>
                      <p className="text-gray-900">{selectedPlot.size} • {selectedPlot.type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dimensions</label>
                      <p className="text-gray-900">
                        {selectedPlot.dimensions.length}m × {selectedPlot.dimensions.width}m × {selectedPlot.dimensions.depth}m
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Coordinates</label>
                      <p className="text-gray-900">{selectedPlot.coordinates.lat}, {selectedPlot.coordinates.lng}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pricing Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Base Fee</label>
                      <p className="text-gray-900">₱{selectedPlot.pricing.baseFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Maintenance Fee</label>
                      <p className="text-gray-900">₱{selectedPlot.pricing.maintenanceFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Fee</label>
                      <p className="text-lg font-semibold text-gray-900">₱{selectedPlot.pricing.totalFee.toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedPlot.assignments && selectedPlot.assignments.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mt-6">Burial Information</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {selectedPlot.assignments.length} of {selectedPlot.maxLayers || 3} layers occupied
                      </p>
                      <div className="space-y-4">
                        {selectedPlot.assignments.map((assignment: any, index: number) => (
                          <div key={assignment.id} className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">Layer {assignment.layer}</h4>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {assignment.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Name</label>
                                <p className="text-gray-900">
                                  {assignment.deceased?.firstName && assignment.deceased?.lastName 
                                    ? `${assignment.deceased.firstName} ${assignment.deceased.lastName}`
                                    : 'Unknown'}
                                </p>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700">Burial Date</label>
                                <p className="text-gray-900">
                                  {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              {assignment.deceased?.dateOfBirth && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Date of Birth</label>
                                  <p className="text-gray-900">
                                    {new Date(assignment.deceased.dateOfBirth).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                              {assignment.deceased?.dateOfDeath && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700">Date of Death</label>
                                  <p className="text-gray-900">
                                    {new Date(assignment.deceased.dateOfDeath).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {selectedPlot.reservedBy && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mt-6">Reservation Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Reserved By</label>
                          <p className="text-gray-900">{selectedPlot.reservedBy}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {(selectedPlot.restrictions && selectedPlot.restrictions.length > 0) && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Restrictions</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {selectedPlot.restrictions.map((restriction, index) => (
                      <li key={index}>{restriction}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPlot.notes && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600">{selectedPlot.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t mt-6">
                <div className="text-sm text-gray-500">
                  Last Updated: {new Date(selectedPlot.lastUpdated).toLocaleString()}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleViewDetails(selectedPlot)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <span className="mr-2">
                      <FiMap size={16} />
                    </span>
                    View on Map
                  </button>
                  <button
                    onClick={() => setShowPlotModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}