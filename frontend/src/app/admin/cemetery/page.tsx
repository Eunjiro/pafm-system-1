'use client'

/**
 * Cemetery Management Page - BACKEND INTEGRATION
 * 
 * This page now loads cemetery plot data from the backend API
 * to match the Plot Management page data source.
 * 
 * Data Flow: Backend Database → API → Both Cemetery Management & Plot Management
 */

import React, { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import apiClient from '../../../lib/api'
import { 
  MdMap, MdEdit, MdSearch, MdCancel, MdDelete, MdLocationOn, 
  MdTerrain, MdLayers, MdSatellite, MdNavigation, MdZoomIn,
  MdZoomOut, MdMyLocation, MdFullscreen, MdInfo, MdSettings
} from 'react-icons/md'
import { 
  FiPlus, FiMap, FiEye, FiEdit2, FiTrash2, FiSave, 
  FiX, FiCheck, FiMapPin, FiGrid, FiLayers, FiTarget,
  FiRefreshCw, FiDownload, FiUpload, FiActivity, FiList
} from 'react-icons/fi'

// Management workflow steps
type ManagementStep = 'overview' | 'sections' | 'blocks' | 'plots' | 'burials'

type Point = [number, number]

interface Cemetery {
  id: string
  name: string
  description: string
  address: string
  city: string
  postalCode: string
  establishedDate: string
  totalArea: number
  boundary: Point[]
  standardPrice: number
  largePrice: number
  familyPrice: number
  nichePrice: number
  maintenanceFee: number
  createdAt: string
  updatedAt: string
}

interface Section {
  id: string
  cemeteryId: string
  name: string
  description: string
  color: string
  capacity: number
  boundary: Point[]
  blocks: Block[]
}

interface Block {
  id: string
  sectionId: string
  name: string
  blockType: 'standard' | 'premium' | 'family' | 'niche'
  capacity: number
  color: string
  boundary: Point[]
  plots: Plot[]
}

interface Plot {
  id: string
  blockId: string
  plotNumber: string
  coordinates: Point[]
  size: 'standard' | 'large' | 'family' | 'niche'
  length: number
  width: number
  depth: number
  baseFee: number
  maintenanceFee: number
  orientation: 'north' | 'south' | 'east' | 'west'
  accessibility: boolean
  status: 'available' | 'reserved' | 'occupied' | 'maintenance'
  maxLayers: number // Maximum burial layers (typically 3-5 in Philippine public cemeteries)
  burials: Burial[] // Array of burials in this plot
  gravestone?: Gravestone
}

interface Burial {
  id: string
  plotId: string
  layer: number // 1 = ground level, 2 = second layer, etc.
  deceasedInfo: {
    firstName: string
    lastName: string
    middleName?: string
    dateOfBirth: string
    dateOfDeath: string
    burialDate: string
    gender: 'male' | 'female'
    causeOfDeath?: string
    occupation?: string
    nextOfKin?: {
      name: string
      relationship: string
      contactNumber: string
    }
  }
  burialType: 'temporary' | 'permanent' // Temporary burials can be moved later
  expirationDate?: string // For temporary burials
  status: 'active' | 'transferred' | 'exhumed'
  notes?: string
}

interface Gravestone {
  id: string
  plotId: string
  material: 'granite' | 'marble' | 'bronze' | 'limestone' | 'sandstone' | 'concrete' | 'other'
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  inscription: string
  dateInstalled: string
  manufacturer: string
  height: number
  width: number
  thickness: number
  // For multi-burial plots, gravestone can list multiple deceased
  listedDeceased?: string[] // Array of burial IDs listed on this gravestone
}

const CemeteryMapComponent = dynamic(() => import("../cemetery-map/CemeteryMapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-700 font-medium">Loading Cemetery Management...</p>
        <p className="text-gray-500 text-sm mt-2">Preparing interactive tools...</p>
      </div>
    </div>
  )
})

function CemeteryManagementPageContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const cemeteryId = searchParams.get('id')
  const focusPlotId = searchParams.get('plotId')
  const shouldFocusPlot = searchParams.get('focus') === 'true'
  
  // States
  const [currentStep, setCurrentStep] = useState<ManagementStep>('overview')
  const [selectedCemetery, setSelectedCemetery] = useState<Cemetery | null>(null)
  const [cemeteries, setCemeteries] = useState<Cemetery[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Drawing states
  const [currentDrawing, setCurrentDrawing] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingMode, setDrawingMode] = useState<'section' | 'block' | 'plot' | null>(null)
  
  // Map view states to prevent re-centering during drawing
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined)
  const [mapZoom, setMapZoom] = useState<number>(19)
  const [preserveMapView, setPreserveMapView] = useState(false)
  const [mapInitialized, setMapInitialized] = useState(false)

  // Form states
  const [sectionFormData, setSectionFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    capacity: 100
  })

  const [blockFormData, setBlockFormData] = useState({
    name: '',
    sectionId: '',
    blockType: 'standard' as 'standard' | 'premium' | 'family' | 'niche',
    capacity: 50,
    color: '#10B981'
  })

  const [plotFormData, setPlotFormData] = useState({
    plotCode: '',
    blockId: '',
    size: 'standard' as 'standard' | 'large' | 'family' | 'niche'
  })

  const [plotStatistics, setPlotStatistics] = useState({
    total: 0,
    vacant: 0,
    reserved: 0,
    occupied: 0,
    blocked: 0
  })

  const [plots, setPlots] = useState<Plot[]>([])
  const [selectedPlotId, setSelectedPlotId] = useState('')

  const [gravestoneFormData, setGravestoneFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    dateOfDeath: '',
    burialDate: '',
    gender: '' as 'male' | 'female' | '',
    material: 'granite' as 'granite' | 'marble' | 'bronze' | 'limestone' | 'sandstone' | 'concrete' | 'other',
    condition: 'good' as 'excellent' | 'good' | 'fair' | 'poor' | 'damaged',
    inscription: ''
  })

  // New burial management states
  const [burialFormData, setBurialFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    dateOfDeath: '',
    burialDate: '',
    gender: '' as 'male' | 'female' | '',
    causeOfDeath: '',
    occupation: '',
    permitNumber: '',
    registrationNumber: '',
    nextOfKin: {
      name: '',
      relationship: '',
      contactNumber: ''
    },
    burialType: 'permanent' as 'temporary' | 'permanent',
    expirationDate: '',
    layer: 1,
    notes: ''
  })

  // Occupant listing states
  const [showOccupantsList, setShowOccupantsList] = useState(false)
  const [selectedAreaType, setSelectedAreaType] = useState<'plot' | 'block' | 'section' | null>(null)
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')
  const [selectedAreaName, setSelectedAreaName] = useState<string>('')
  const [areaOccupants, setAreaOccupants] = useState<Burial[]>([])

  // Burial modal state
  const [showBurialModal, setShowBurialModal] = useState(false)

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteType, setDeleteType] = useState<'cemetery' | 'section' | 'block' | 'plot' | 'gravestone' | 'burial' | null>(null)
  const [deleteItem, setDeleteItem] = useState<any>(null)
  const [deleteItemName, setDeleteItemName] = useState('')

  // Reset map initialization when cemetery changes
  useEffect(() => {
    if (selectedCemetery) {
      // Only reset if it's a different cemetery
      setMapInitialized(false)
    }
  }, [selectedCemetery?.id])

  // Listen for cemetery data updates from other components (like Plot Management)
  useEffect(() => {
    const handleCemeteryDataUpdate = async (event: CustomEvent) => {
      console.log('Cemetery data updated from external component:', event.detail)
      
      // If the update is for the currently selected cemetery, reload the data
      if (selectedCemetery && (event.detail?.type === 'burial-assignment' || event.detail?.type === 'assignment')) {
        console.log('Reloading cemetery data due to external burial assignment...', event.detail)
        
        try {
          // Reload specific cemetery with sections and plots
          const response = await fetch(`/api/cemeteries?id=${selectedCemetery.id}`)
          
          if (response.ok) {
            const result = await response.json()
            
            if (result.success && result.data) {
              // Update sections with the fresh data from backend
              const updatedSections = result.data.sections?.map((section: any) => ({
                id: section.id.toString(),
                cemeteryId: selectedCemetery.id,
                name: section.name,
                description: section.description || '',
                color: '#3B82F6',
                capacity: section.capacity || 0,
                boundary: section.boundary || [],
                blocks: section.blocks?.map((block: any) => ({
                  id: block.id.toString(),
                  sectionId: section.id.toString(),
                  name: block.name,
                  blockType: block.blockType ? block.blockType.toLowerCase() : 'standard',
                  capacity: block.capacity || 0,
                  color: '#10B981',
                  boundary: block.boundary || [],
                  plots: block.plots?.map((plot: any) => {
                    // Calculate burials from assignments
                    const burials = plot.assignments?.map((assignment: any) => ({
                      id: assignment.id.toString(),
                      plotId: plot.id.toString(),
                      layer: assignment.layer || 1,
                      deceasedInfo: {
                        firstName: assignment.deceased?.firstName || 'Unknown',
                        lastName: assignment.deceased?.lastName || 'Unknown',
                        middleName: assignment.deceased?.middleName || '',
                        dateOfBirth: assignment.deceased?.dateOfBirth || '',
                        dateOfDeath: assignment.deceased?.dateOfDeath || '',
                        burialDate: assignment.assignedAt || assignment.createdAt || '',
                        gender: assignment.deceased?.gender || 'male',
                      },
                      burialType: 'permanent',
                      status: 'active'
                    })) || []

                    return {
                      id: plot.id.toString(),
                      blockId: block.id.toString(),
                      plotNumber: plot.plotNumber || plot.plotCode,
                      coordinates: plot.coordinates || [],
                      size: plot.size ? plot.size.toLowerCase() : 'standard',
                      length: plot.length || 2.0,
                      width: plot.width || 1.0,
                      depth: plot.depth || 1.5,
                      baseFee: plot.baseFee || selectedCemetery.standardPrice,
                      maintenanceFee: plot.maintenanceFee || selectedCemetery.maintenanceFee,
                      orientation: plot.orientation?.toLowerCase() || 'north',
                      accessibility: plot.accessibility || true,
                      status: plot.status ? plot.status.toLowerCase() : 'available',
                      maxLayers: plot.maxLayers || 3,
                      burials: burials
                    }
                  }) || []
                })) || []
              })) || []

              setSections(updatedSections)
              console.log('Cemetery data refreshed successfully after external update')
            }
          }
        } catch (error) {
          console.error('Error refreshing cemetery data after external update:', error)
        }
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
  }, [selectedCemetery])

  // Load cemetery data from backend API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        console.log('Loading cemetery data from backend API...')
        
        // First, try to load specific cemetery if ID is provided
        if (cemeteryId) {
          console.log('Loading specific cemetery:', cemeteryId)
          
          const cemeteryResponse = await fetch(`/api/cemeteries?id=${cemeteryId}`)
          console.log('Cemetery API response status:', cemeteryResponse.status)
          
          if (cemeteryResponse.ok) {
            const cemeteryResult = await cemeteryResponse.json()
            console.log('Cemetery API result:', cemeteryResult)
            
            if (cemeteryResult.success && cemeteryResult.data) {
              const cemetery = cemeteryResult.data
              
              // Set the cemetery
              setCemeteries([cemetery])
              setSelectedCemetery(cemetery)
              
              // Set initial map center for this cemetery only if not already initialized
              if (!mapInitialized) {
                const initialCenter = calculateCemeteryCenter(cemetery)
                setMapCenter(initialCenter)
                setMapZoom(19)
                setMapInitialized(true)
              }
              
              // Transform sections data from backend structure
              if (cemetery.sections && cemetery.sections.length > 0) {
                const transformedSections = cemetery.sections.map((section: any) => ({
                  id: section.id.toString(),
                  cemeteryId: cemetery.id.toString(),
                  name: section.name,
                  description: section.description || `Section ${section.name}`,
                  color: '#3B82F6',
                  capacity: section.capacity || 100,
                  boundary: section.boundary || [[14.6760, 121.0437], [14.6761, 121.0437], [14.6761, 121.0438], [14.6760, 121.0438]],
                  blocks: section.blocks.map((block: any) => ({
                    id: block.id.toString(),
                    sectionId: section.id.toString(),
                    name: block.name,
                    blockType: block.blockType ? block.blockType.toLowerCase() : 'standard',
                    capacity: block.capacity || 50,
                    color: '#10B981',
                    boundary: block.boundary || [[14.6760, 121.0437], [14.6761, 121.0437], [14.6761, 121.0438], [14.6760, 121.0438]],
                    plots: block.plots.map((plot: any) => ({
                      id: plot.id.toString(),
                      blockId: block.id.toString(),
                      plotNumber: plot.plotNumber || plot.plotCode,
                      coordinates: plot.boundary && plot.boundary.length >= 3 ? plot.boundary : 
                                  generatePlotBoundary(
                                    plot.latitude ? parseFloat(plot.latitude) : 14.6760,
                                    plot.longitude ? parseFloat(plot.longitude) : 121.0437,
                                    plot.length || 2,
                                    plot.width || 1
                                  ),
                      size: plot.size ? plot.size.toLowerCase() : 'standard',
                      length: plot.length || 2,
                      width: plot.width || 1,
                      depth: plot.depth || 1.5,
                      baseFee: parseFloat(plot.baseFee) || 5000,
                      maintenanceFee: parseFloat(plot.maintenanceFee) || 500,
                      orientation: plot.orientation ? plot.orientation.toLowerCase() : 'north',
                      accessibility: plot.accessibility,
                      status: plot.status ? (plot.status.toLowerCase() === 'vacant' ? 'available' : 
                             plot.status.toLowerCase() === 'occupied' ? 'occupied' : 
                             plot.status.toLowerCase() === 'reserved' ? 'reserved' : 'available') : 'available',
                      maxLayers: plot.maxLayers || 3,
                      burials: plot.assignments && plot.assignments.length > 0 ? plot.assignments.map((assignment: any) => ({
                        id: `${plot.id}_burial_${assignment.id}`,
                        plotId: plot.id.toString(),
                        layer: assignment.layer || 1,
                        deceasedInfo: {
                          firstName: assignment.deceased?.firstName || 'Unknown',
                          lastName: assignment.deceased?.lastName || 'Unknown',
                          middleName: assignment.deceased?.middleName || '',
                          dateOfBirth: assignment.deceased?.dateOfBirth || '',
                          dateOfDeath: assignment.deceased?.dateOfDeath || '',
                          burialDate: assignment.assignedAt || '',
                          gender: assignment.deceased?.gender || assignment.deceased?.sex === 'Female' ? 'female' : 'male'
                        },
                        burialType: 'permanent',
                        status: 'active'
                      })) : [],
                      gravestone: plot.gravestones && plot.gravestones.length > 0 ? {
                        id: plot.gravestones[0].id.toString(),
                        plotId: plot.id.toString(),
                        material: plot.gravestones[0].material ? plot.gravestones[0].material.toLowerCase() : 'concrete',
                        condition: plot.gravestones[0].condition ? plot.gravestones[0].condition.toLowerCase() : 'good',
                        inscription: plot.gravestones[0].inscription || '',
                        dateInstalled: plot.gravestones[0].dateInstalled || '',
                        manufacturer: plot.gravestones[0].manufacturer || 'Unknown',
                        height: plot.gravestones[0].height || 100,
                        width: plot.gravestones[0].width || 80,
                        thickness: plot.gravestones[0].thickness || 15
                      } : undefined
                    }))
                  }))
                }))
                
                console.log('Transformed sections:', transformedSections)
                setSections(transformedSections)
                
                // Extract all plots for plots array
                const allPlots = transformedSections.flatMap((section: any) =>
                  section.blocks.flatMap((block: any) => block.plots)
                )
                
                // Also load standalone plots that are not in sections/blocks
                console.log('Loading standalone plots for cemetery:', cemetery.name)
                try {
                  // Use our new API endpoint to get all plots for this cemetery by name
                  const standaloneResponse = await fetch(`/api/cemetery-plots-by-name?cemeteryName=${encodeURIComponent(cemetery.name)}`)
                  if (standaloneResponse.ok) {
                    const standaloneResult = await standaloneResponse.json()
                    console.log('Standalone plots result:', standaloneResult)
                    
                    if (standaloneResult.success && standaloneResult.plots) {
                      // Filter out plots that are already in sections/blocks (have blockId)
                      const standalonePlots = standaloneResult.plots
                        .filter((plot: any) => !plot.blockId) // Only plots without blockId are standalone
                        .map((plot: any) => ({
                          id: plot.id.toString(),
                          blockId: null, // Standalone plots don't belong to blocks
                          plotNumber: plot.plotNumber || plot.plotCode,
                          coordinates: plot.coordinates && plot.coordinates.length >= 3 ? plot.coordinates :
                                      generatePlotBoundary(
                                        plot.latitude ? parseFloat(plot.latitude) : 14.6760,
                                        plot.longitude ? parseFloat(plot.longitude) : 121.0437,
                                        plot.length || 2,
                                        plot.width || 1
                                      ),
                          size: plot.size ? plot.size.toLowerCase() : 'standard',
                          length: plot.length || 2,
                          width: plot.width || 1,
                          depth: plot.depth || 1.5,
                          baseFee: parseFloat(plot.baseFee) || 5000,
                          maintenanceFee: parseFloat(plot.maintenanceFee) || 500,
                          orientation: plot.orientation ? plot.orientation.toLowerCase() : 'north',
                          accessibility: plot.accessibility,
                          status: plot.status ? (plot.status.toLowerCase() === 'vacant' ? 'available' : 
                                 plot.status.toLowerCase() === 'occupied' ? 'occupied' : 
                                 plot.status.toLowerCase() === 'reserved' ? 'reserved' : 'available') : 'available',
                          maxLayers: plot.maxLayers || 3,
                          burials: plot.assignments && plot.assignments.length > 0 ? plot.assignments.map((assignment: any) => ({
                            id: `${plot.id}_burial_${assignment.id}`,
                            plotId: plot.id.toString(),
                            layer: assignment.layer || 1,
                            deceasedInfo: {
                              firstName: assignment.deceased?.firstName || 'Unknown',
                              lastName: assignment.deceased?.lastName || 'Unknown',
                              middleName: assignment.deceased?.middleName || '',
                              dateOfBirth: assignment.deceased?.dateOfBirth || '',
                              dateOfDeath: assignment.deceased?.dateOfDeath || '',
                              burialDate: assignment.assignedAt || '',
                              gender: assignment.deceased?.gender || assignment.deceased?.sex === 'Female' ? 'female' : 'male'
                            },
                            burialType: 'permanent',
                            status: 'active'
                          })) : [],
                          gravestone: plot.gravestones && plot.gravestones.length > 0 ? {
                            id: plot.gravestones[0].id.toString(),
                            plotId: plot.id.toString(),
                            material: plot.gravestones[0].material ? plot.gravestones[0].material.toLowerCase() : 'concrete',
                            condition: plot.gravestones[0].condition ? plot.gravestones[0].condition.toLowerCase() : 'good',
                            inscription: plot.gravestones[0].inscription || '',
                            dateInstalled: plot.gravestones[0].dateInstalled || '',
                            manufacturer: plot.gravestones[0].manufacturer || 'Unknown',
                            height: plot.gravestones[0].height || 100,
                            width: plot.gravestones[0].width || 80,
                            thickness: plot.gravestones[0].thickness || 15
                          } : undefined
                        }))
                      
                      console.log('Found standalone plots:', standalonePlots.length)
                      // Combine structured plots with standalone plots
                      const combinedPlots = [...allPlots, ...standalonePlots]
                      setPlots(combinedPlots)
                    } else {
                      console.warn('No standalone plots found')
                      setPlots(allPlots)
                    }
                  } else {
                    console.warn('Failed to load standalone plots')
                    setPlots(allPlots)
                  }
                } catch (error) {
                  console.error('Error loading standalone plots:', error)
                  setPlots(allPlots)
                }
                
                // Handle plot focus if specified
                if (shouldFocusPlot && focusPlotId) {
                  console.log('Focusing on plot:', focusPlotId)
                  setSelectedPlotId(focusPlotId)
                  setCurrentStep('plots')
                }
                
              } else {
                console.warn('No sections found in cemetery data')
                setSections([])
                setPlots([])
              }
              
            } else {
              console.warn('No cemetery data received from backend')
              setCemeteries([])
              setSections([])
              setPlots([])
            }
          } else {
            console.error('Cemetery API failed with status:', cemeteryResponse.status)
            setCemeteries([])
            setSections([])
            setPlots([])
          }
        } else {
          // Load all cemeteries if no specific ID
          console.log('Loading all cemeteries...')
          
          const cemeteriesResponse = await fetch('/api/cemeteries')
          console.log('Cemeteries API response status:', cemeteriesResponse.status)
          
          if (cemeteriesResponse.ok) {
            const cemeteriesResult = await cemeteriesResponse.json()
            console.log('Cemeteries API result:', cemeteriesResult)
            
            if (cemeteriesResult.success && cemeteriesResult.data && cemeteriesResult.data.length > 0) {
              setCemeteries(cemeteriesResult.data)
              // Don't auto-select a cemetery, let user choose
            } else {
              console.warn('No cemeteries found')
              setCemeteries([])
            }
          } else {
            console.error('Cemeteries API failed with status:', cemeteriesResponse.status)
            setCemeteries([])
          }
        }
        
      } catch (error) {
        console.error('Error loading cemetery data from backend:', error)
        setCemeteries([])
        setSections([])
        setPlots([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [cemeteryId, focusPlotId, shouldFocusPlot])

  // Drawing cancel function
  const handleCancelDrawing = () => {
    setCurrentDrawing([])
    setDrawingMode(null)
    setIsDrawing(false)
  }

  const calculatePolygonArea = (points: Point[]): number => {
    if (points.length < 3) return 0
    let area = 0
    const n = points.length
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      area += points[i][0] * points[j][1]
      area -= points[j][0] * points[i][1]
    }
    return Math.abs(area) / 2
  }

  const calculateCemeteryCenter = (cemetery: Cemetery): [number, number] => {
    if (cemetery.boundary && cemetery.boundary.length > 2) {
      const lats = cemetery.boundary.map(point => point[0])
      const lngs = cemetery.boundary.map(point => point[1])
      
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
      
      return [centerLat, centerLng]
    }
    return [14.6760, 121.0437] // Default fallback
  }

  // Generate plot boundary rectangle from center point and dimensions
  const generatePlotBoundary = (centerLat: number, centerLng: number, length: number = 2, width: number = 1): Point[] => {
    // Convert meters to approximate degrees
    // 1 degree latitude ≈ 111km, 1 degree longitude ≈ 111km * cos(latitude)
    const latOffset = (length / 2) / 111000 // half length in degrees
    const lngOffset = (width / 2) / (111000 * Math.cos(centerLat * Math.PI / 180)) // half width in degrees
    
    // Create rectangle boundary: [top-left, top-right, bottom-right, bottom-left]
    return [
      [centerLat + latOffset, centerLng - lngOffset], // top-left
      [centerLat + latOffset, centerLng + lngOffset], // top-right
      [centerLat - latOffset, centerLng + lngOffset], // bottom-right
      [centerLat - latOffset, centerLng - lngOffset]  // bottom-left
    ]
  }

  const handleSaveSection = async () => {
    if (!selectedCemetery || !sectionFormData.name || currentDrawing.length < 3) return

    // Check for duplicate section names
    const existingSection = sections.find(section => 
      section.name.toLowerCase() === sectionFormData.name.toLowerCase()
    )
    if (existingSection) {
      alert(`A section named "${sectionFormData.name}" already exists. Please choose a different name.`)
      return
    }

    setIsSaving(true)
    try {
      // Prepare section data for backend API
      const sectionData = {
        cemeteryId: parseInt(selectedCemetery.id),
        name: sectionFormData.name,
        description: sectionFormData.description,
        capacity: sectionFormData.capacity,
        boundary: [...currentDrawing]
      }

      console.log('Saving section to backend:', sectionData)

      // Save to backend API
      const response = await fetch('/api/cemetery-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Section saved to backend:', result)

        if (result.success && result.data) {
          // Create section object from backend response
          const newSection: Section = {
            id: result.data.id.toString(),
            cemeteryId: selectedCemetery.id,
            name: result.data.name,
            description: result.data.description || sectionFormData.description,
            color: sectionFormData.color, // Frontend-only property
            capacity: result.data.capacity,
            boundary: result.data.boundary || currentDrawing,
            blocks: []
          }

          // Update local state
          const updatedSections = [...sections, newSection]
          setSections(updatedSections)

          // Reset form and drawing
          setSectionFormData({ name: '', description: '', color: '#3B82F6', capacity: 100 })
          setCurrentDrawing([])
          setDrawingMode(null)
          setIsDrawing(false)

          console.log('Section saved successfully:', newSection)
        } else {
          throw new Error('Invalid response from backend')
        }
      } else {
        const errorData = await response.text()
        console.error('Backend section save failed:', errorData)
        throw new Error(`Failed to save section: ${errorData}`)
      }
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Error saving section. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBlock = async () => {
    if (!selectedCemetery || !blockFormData.name || !blockFormData.sectionId || currentDrawing.length < 3) return

    // Check for duplicate block names within the same section
    const targetSection = sections.find(section => section.id === blockFormData.sectionId)
    if (targetSection) {
      const existingBlock = targetSection.blocks.find(block => 
        block.name.toLowerCase() === blockFormData.name.toLowerCase()
      )
      if (existingBlock) {
        alert(`A block named "${blockFormData.name}" already exists in section "${targetSection.name}". Please choose a different name.`)
        return
      }
    }

    setIsSaving(true)
    try {
      // Prepare block data for backend API
      const blockData = {
        sectionId: parseInt(blockFormData.sectionId),
        name: blockFormData.name,
        blockType: blockFormData.blockType.toUpperCase(), // Convert to match backend enum
        capacity: blockFormData.capacity,
        boundary: [...currentDrawing]
      }

      console.log('Saving block to backend:', blockData)

      // Save to backend API
      const response = await fetch('/api/cemetery-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blockData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Block saved to backend:', result)

        if (result.success && result.data) {
          // Create block object from backend response
          const newBlock: Block = {
            id: result.data.id.toString(),
            sectionId: blockFormData.sectionId,
            name: result.data.name,
            blockType: blockFormData.blockType,
            capacity: result.data.capacity,
            color: blockFormData.color, // Frontend-only property
            boundary: result.data.boundary || currentDrawing,
            plots: []
          }

          // Update sections with new block
          const updatedSections = sections.map(section => {
            if (section.id === blockFormData.sectionId) {
              return {
                ...section,
                blocks: [...section.blocks, newBlock]
              }
            }
            return section
          })

          setSections(updatedSections)

          // Reset form and drawing
          setBlockFormData({
            name: '',
            sectionId: '',
            blockType: 'standard',
            capacity: 50,
            color: '#10B981'
          })
          setCurrentDrawing([])
          setDrawingMode(null)
          setIsDrawing(false)

          console.log('Block saved successfully:', newBlock)
        } else {
          throw new Error('Invalid response from backend')
        }
      } else {
        const errorData = await response.text()
        console.error('Backend block save failed:', errorData)
        throw new Error(`Failed to save block: ${errorData}`)
      }
    } catch (error) {
      console.error('Error saving block:', error)
      alert('Error saving block. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePlot = async () => {
    if (!selectedCemetery || !plotFormData.blockId || currentDrawing.length < 3) return

    setIsSaving(true)
    try {
      // Find the block and section
      let targetSection: Section | null = null
      let targetBlock: Block | null = null

      for (const section of sections) {
        const block = section.blocks.find(b => b.id === plotFormData.blockId)
        if (block) {
          targetSection = section
          targetBlock = block
          break
        }
      }

      if (!targetSection || !targetBlock) {
        throw new Error('Block not found')
      }

      const plotCode = plotFormData.plotCode || `${targetSection.name}-${targetBlock.name}-${Date.now()}`

      // Check for duplicate plot numbers within the same block
      const existingPlot = targetBlock.plots.find(plot => 
        plot.plotNumber.toLowerCase() === plotCode.toLowerCase()
      )
      if (existingPlot) {
        alert(`A plot with number "${plotCode}" already exists in block "${targetBlock.name}". Please choose a different plot number.`)
        return
      }

      // Prepare plot data for backend API
      const plotData = {
        cemeteryId: selectedCemetery.id,      // Send cemetery ID
        blockId: plotFormData.blockId,        // Send block ID
        cemeteryName: selectedCemetery.name,
        section: targetSection.name,  // Backend expects section name as string
        block: targetBlock.name,      // Backend expects block name as string  
        lot: plotCode,                // Backend expects lot as string
        plotCode: plotCode,
        coordinates: [...currentDrawing],
        size: plotFormData.size.toUpperCase(), // Convert to match backend enum
        latitude: currentDrawing.length > 0 ? currentDrawing[0][0] : null,
        longitude: currentDrawing.length > 0 ? currentDrawing[0][1] : null,
        status: 'VACANT'
      }

      console.log('Saving plot to backend:', plotData)

      // Save to backend API
      const response = await fetch('/api/cemetery-plots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plotData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Plot saved to backend:', result)

        if (result.success && result.data) {
          // Create plot object from backend response
          const newPlot: Plot = {
            id: result.data.id.toString(),
            blockId: plotFormData.blockId,
            plotNumber: result.data.plotNumber || plotCode,
            coordinates: result.data.coordinates || currentDrawing,
            size: plotFormData.size,
            length: result.data.length || 2,
            width: result.data.width || 1,
            depth: result.data.depth || 1.5,
            baseFee: result.data.baseFee || selectedCemetery.standardPrice,
            maintenanceFee: result.data.maintenanceFee || selectedCemetery.maintenanceFee,
            orientation: (result.data.orientation || 'NORTH').toLowerCase() as any,
            accessibility: result.data.accessibility ?? true,
            status: (result.data.status || 'VACANT').toLowerCase() as any,
            maxLayers: result.data.maxLayers || 3,
            burials: []
          }

          // Update sections with new plot
          const updatedSections = sections.map(section => {
            if (section.id === targetSection!.id) {
              return {
                ...section,
                blocks: section.blocks.map(block => {
                  if (block.id === plotFormData.blockId) {
                    return {
                      ...block,
                      plots: [...block.plots, newPlot]
                    }
                  }
                  return block
                })
              }
            }
            return section
          })

          setSections(updatedSections)
          setPlots(prev => [...prev, newPlot])

          // Reset form and drawing
          setPlotFormData({ plotCode: '', blockId: '', size: 'standard' })
          setCurrentDrawing([])
          setDrawingMode(null)
          setIsDrawing(false)

          // Update statistics
          updatePlotStatistics()

          console.log('Plot saved successfully:', newPlot)
        } else {
          throw new Error('Invalid response from backend')
        }
      } else {
        const errorData = await response.text()
        console.error('Backend plot save failed:', errorData)
        throw new Error(`Failed to save plot: ${errorData}`)
      }
    } catch (error) {
      console.error('Error saving plot:', error)
      alert('Error saving plot. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAutoGeneratePlots = async () => {
    if (!selectedCemetery || sections.length === 0) return

    setIsSaving(true)
    try {
      const plotsToCreate: any[] = []
      
      sections.forEach(section => {
        section.blocks.forEach(block => {
          // Simple grid generation within block boundary
          const boundary = block.boundary
          if (boundary.length < 3) return

          const minLat = Math.min(...boundary.map(p => p[0]))
          const maxLat = Math.max(...boundary.map(p => p[0]))
          const minLng = Math.min(...boundary.map(p => p[1]))
          const maxLng = Math.max(...boundary.map(p => p[1]))

          const plotLength = 2 / 111000 // ~2m in lat degrees
          const plotWidth = 1 / 111000  // ~1m in lng degrees
          const spacing = 0.5 / 111000  // ~0.5m spacing

          let plotNumber = 1
          for (let lat = minLat; lat <= maxLat - plotLength; lat += plotLength + spacing) {
            for (let lng = minLng; lng <= maxLng - plotWidth; lng += plotWidth + spacing) {
              const plotCoords: Point[] = [
                [lat, lng],
                [lat + plotLength, lng],
                [lat + plotLength, lng + plotWidth],
                [lat, lng + plotWidth],
                [lat, lng] // Close the polygon
              ]

              const plotCode = `${section.name}-${block.name}-${plotNumber.toString().padStart(3, '0')}`

              const newPlot: Plot = {
                id: `${Date.now()}-${plotNumber}`,
                blockId: block.id,
                plotNumber: plotCode,
                coordinates: plotCoords,
                size: 'standard',
                length: 2,
                width: 1,
                depth: 1.5,
                baseFee: selectedCemetery.standardPrice,
                maintenanceFee: selectedCemetery.maintenanceFee,
                orientation: 'north',
                accessibility: true,
                status: 'available',
                maxLayers: 3, // Default to 3 layers for Philippine public cemeteries
                burials: [] // Empty array for new plots
              }

              plotsToCreate.push(newPlot)
              plotNumber++
            }
          }
        })
      })

      // Update sections with generated plots
      const updatedSections = sections.map(section => ({
        ...section,
        blocks: section.blocks.map(block => ({
          ...block,
          plots: plotsToCreate.filter(plot => plot.blockId === block.id)
        }))
      }))

      setSections(updatedSections)
      setPlots(plotsToCreate)

      // Note: Auto-generation creates plots in memory only
      // Individual plots should be saved via backend API for persistence

      // Update statistics
      updatePlotStatistics()

      console.log(`Generated ${plotsToCreate.length} plots successfully`)
      alert(`Generated ${plotsToCreate.length} plots successfully. Individual plots will be saved when you manually save them.`)
    } catch (error) {
      console.error('Error generating plots:', error)
      alert('Error generating plots. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const updatePlotStatistics = () => {
    const allPlots = sections.flatMap(section => 
      section.blocks.flatMap(block => block.plots)
    )

    // Calculate statistics based on burials, not just plot status
    let totalBurials = 0
    let totalCapacity = 0
    
    allPlots.forEach(plot => {
      const activeBurials = plot.burials?.filter(b => b.status === 'active').length || 0
      totalBurials += activeBurials
      totalCapacity += plot.maxLayers || 3
    })

    setPlotStatistics({
      total: allPlots.length,
      vacant: allPlots.filter(p => {
        const activeBurials = p.burials?.filter(b => b.status === 'active').length || 0
        return activeBurials === 0
      }).length,
      reserved: allPlots.filter(p => p.status === 'reserved').length,
      occupied: allPlots.filter(p => {
        const activeBurials = p.burials?.filter(b => b.status === 'active').length || 0
        return activeBurials > 0
      }).length,
      blocked: allPlots.filter(p => p.status === 'maintenance').length
    })
  }

  const handleSaveGravestone = async () => {
    if (!selectedCemetery || !selectedPlotId || !gravestoneFormData.firstName || !gravestoneFormData.lastName) return

    setIsSaving(true)
    try {
      // Find the plot to update
      const updatedSections = sections.map(section => ({
        ...section,
        blocks: section.blocks.map(block => ({
          ...block,
          plots: block.plots.map(plot => {
            if (plot.id === selectedPlotId) {
              return {
                ...plot,
                status: 'occupied' as 'available' | 'reserved' | 'occupied' | 'maintenance',
                gravestone: {
                  id: Date.now().toString(),
                  plotId: plot.id,
                  material: gravestoneFormData.material,
                  condition: gravestoneFormData.condition,
                  inscription: gravestoneFormData.inscription,
                  dateInstalled: new Date().toISOString().split('T')[0],
                  manufacturer: 'Unknown',
                  height: 100,
                  width: 80,
                  thickness: 15,
                  listedDeceased: [] // Empty array for now, can be populated later
                }
              }
            }
            return plot
          })
        }))
      }))

      setSections(updatedSections)

      // Note: Gravestone information is saved in memory only
      // Backend integration for gravestones should be implemented

      // Reset form
      setGravestoneFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        dateOfDeath: '',
        burialDate: '',
        gender: '',
        material: 'granite',
        condition: 'good',
        inscription: ''
      })
      setSelectedPlotId('')

      // Update statistics
      updatePlotStatistics()

      console.log('Gravestone information saved successfully')
      alert('Gravestone information saved successfully.')
    } catch (error) {
      console.error('Error saving gravestone:', error)
      alert('Error saving gravestone information. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // New Burial Management Functions
  const handleAddBurial = async () => {
    if (!selectedCemetery || !selectedPlotId || !burialFormData.firstName || !burialFormData.lastName) return

    setIsSaving(true)
    try {
      // Find the plot to validate
      let targetPlot: Plot | null = null
      let targetSection: Section | null = null
      let targetBlock: Block | null = null

      for (const section of sections) {
        for (const block of section.blocks) {
          const plot = block.plots.find(p => p.id === selectedPlotId)
          if (plot) {
            targetPlot = plot
            targetSection = section
            targetBlock = block
            break
          }
        }
        if (targetPlot) break
      }

      if (!targetPlot || !targetSection || !targetBlock) {
        throw new Error('Plot not found')
      }

      // Check if the selected layer is available
      const existingBurial = targetPlot.burials.find(b => b.layer === burialFormData.layer && b.status === 'active')
      if (existingBurial) {
        throw new Error(`Layer ${burialFormData.layer} is already occupied by ${existingBurial.deceasedInfo.firstName} ${existingBurial.deceasedInfo.lastName}`)
      }

      // Check if layer is within plot limits
      if (burialFormData.layer > targetPlot.maxLayers) {
        throw new Error(`Layer ${burialFormData.layer} exceeds plot maximum of ${targetPlot.maxLayers} layers`)
      }

      // Prepare deceased data for the new burial assignment API
      const burialPayload = {
        plotId: parseInt(selectedPlotId),
        deceased: {
          firstName: burialFormData.firstName,
          lastName: burialFormData.lastName,
          middleName: burialFormData.middleName,
          dateOfBirth: burialFormData.dateOfBirth,
          dateOfDeath: burialFormData.dateOfDeath,
          gender: burialFormData.gender || 'male',
          causeOfDeath: burialFormData.causeOfDeath,
          occupation: burialFormData.occupation,
          placeOfDeath: '', // Not captured in cemetery management form
          residenceAddress: '', // Not captured in cemetery management form
          citizenship: 'Filipino', // Default
          civilStatus: 'Single' // Default
        },
        layer: burialFormData.layer || 1,
        permitId: burialFormData.permitNumber && burialFormData.permitNumber.trim() ? parseInt(burialFormData.permitNumber) : null,
        notes: `Cemetery Management Assignment - Layer ${burialFormData.layer}, Type: ${burialFormData.burialType}${burialFormData.permitNumber ? `, Permit: ${burialFormData.permitNumber}` : ''}${burialFormData.registrationNumber ? `, Registration: ${burialFormData.registrationNumber}` : ''}${burialFormData.nextOfKin.name ? `, Next of Kin: ${burialFormData.nextOfKin.name} (${burialFormData.nextOfKin.relationship}) - ${burialFormData.nextOfKin.contactNumber}` : ''}${burialFormData.notes ? `, Additional Notes: ${burialFormData.notes}` : ''}`
      }

      console.log('Cemetery Management - Using new burial assignment API:', burialPayload)

      // Use the new burial assignment API
      const response = await fetch('/api/burial-assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(burialPayload)
      })

      console.log('Cemetery Management burial assignment response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Cemetery Management burial assignment successful:', result)

        // Reload cemetery data to reflect backend changes
        if (selectedCemetery) {
          const cemeteryResponse = await fetch(`/api/cemeteries?id=${selectedCemetery.id}`)
          if (cemeteryResponse.ok) {
            const cemeteryResult = await cemeteryResponse.json()
            if (cemeteryResult.success && cemeteryResult.data) {
              // Update sections with the fresh data from backend
              const updatedSections = cemeteryResult.data.sections?.map((section: any) => ({
                id: section.id.toString(),
                cemeteryId: selectedCemetery.id,
                name: section.name,
                description: section.description || '',
                color: '#3B82F6',
                capacity: section.capacity || 0,
                boundary: section.boundary || [],
                blocks: section.blocks?.map((block: any) => ({
                  id: block.id.toString(),
                  sectionId: section.id.toString(),
                  name: block.name,
                  blockType: block.blockType.toLowerCase(),
                  capacity: block.capacity || 0,
                  color: '#10B981',
                  boundary: block.boundary || [],
                  plots: block.plots?.map((plot: any) => ({
                    id: plot.id.toString(),
                    blockId: block.id.toString(),
                    plotNumber: plot.plotNumber || plot.plotCode,
                    coordinates: plot.boundary && plot.boundary.length >= 3 ? plot.boundary :
                                generatePlotBoundary(
                                  plot.latitude ? parseFloat(plot.latitude) : 14.6760,
                                  plot.longitude ? parseFloat(plot.longitude) : 121.0437,
                                  plot.length || 2,
                                  plot.width || 1
                                ),
                    size: plot.size ? plot.size.toLowerCase() : 'standard',
                    length: plot.length || 2,
                    width: plot.width || 1,
                    depth: plot.depth || 1.5,
                    baseFee: parseFloat(plot.baseFee) || 5000,
                    maintenanceFee: parseFloat(plot.maintenanceFee) || 500,
                    orientation: plot.orientation ? plot.orientation.toLowerCase() : 'north',
                    accessibility: plot.accessibility,
                    status: plot.status ? (plot.status.toLowerCase() === 'vacant' ? 'available' : 
                           plot.status.toLowerCase() === 'occupied' ? 'occupied' : 
                           plot.status.toLowerCase() === 'reserved' ? 'reserved' : 'available') : 'available',
                    maxLayers: plot.maxLayers || 3,
                    burials: plot.assignments && plot.assignments.length > 0 ? plot.assignments.map((assignment: any) => ({
                      id: `${plot.id}_burial_${assignment.id}`,
                      plotId: plot.id.toString(),
                      layer: assignment.layer || 1,
                      deceasedInfo: {
                        firstName: assignment.deceased?.firstName || 'Unknown',
                        lastName: assignment.deceased?.lastName || 'Unknown',
                        middleName: assignment.deceased?.middleName || '',
                        dateOfBirth: assignment.deceased?.dateOfBirth || '',
                        dateOfDeath: assignment.deceased?.dateOfDeath || '',
                        burialDate: assignment.assignedAt || '',
                        gender: assignment.deceased?.gender || assignment.deceased?.sex === 'Female' ? 'female' : 'male'
                      },
                      burialType: 'permanent',
                      status: 'active'
                    })) : [],
                    gravestone: plot.gravestones && plot.gravestones.length > 0 ? {
                      id: plot.gravestones[0].id.toString(),
                      plotId: plot.id.toString(),
                      material: plot.gravestones[0].material.toLowerCase(),
                      condition: plot.gravestones[0].condition.toLowerCase(),
                      inscription: plot.gravestones[0].inscription || '',
                      dateInstalled: plot.gravestones[0].dateInstalled || '',
                      manufacturer: plot.gravestones[0].manufacturer || 'Unknown',
                      height: plot.gravestones[0].height || 100,
                      width: plot.gravestones[0].width || 80,
                      thickness: plot.gravestones[0].thickness || 15
                    } : undefined
                  })) || []
                })) || []
              })) || []

              setSections(updatedSections)
              console.log('Cemetery data refreshed successfully after burial assignment')
            }
          }
        }

        // Trigger a global refresh event for other components (like plot management)
        window.dispatchEvent(new CustomEvent('cemeteryDataUpdated', {
          detail: { type: 'burial-assignment', plotId: selectedPlotId, source: 'cemetery-management' }
        }))

        // Reset form
        setBurialFormData({
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
          nextOfKin: {
            name: '',
            relationship: '',
            contactNumber: ''
          },
          burialType: 'permanent',
          expirationDate: '',
          layer: 1,
          notes: ''
        })

        // Update statistics
        updatePlotStatistics()

        console.log('Cemetery Management burial assignment completed successfully via new API')
        alert(`Burial assigned successfully for ${burialFormData.firstName} ${burialFormData.lastName} in Layer ${burialFormData.layer}`)
        
        // Close modal
        setShowBurialModal(false)
      } else {
        const errorData = await response.json()
        console.error('Cemetery Management burial assignment failed:', {
          status: response.status,
          error: errorData,
          plotId: selectedPlotId
        })
        throw new Error(`Assignment failed: ${errorData.error || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('Cemetery Management - Error adding burial via new API:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Occupant Listing Functions
  const getAreaOccupants = (areaType: 'plot' | 'block' | 'section', areaId: string): Burial[] => {
    const allBurials: Burial[] = []

    if (areaType === 'plot') {
      // Get burials from specific plot
      for (const section of sections) {
        for (const block of section.blocks) {
          const plot = block.plots.find(p => p.id === areaId)
          if (plot) {
            return plot.burials.filter(b => b.status === 'active')
          }
        }
      }
    } else if (areaType === 'block') {
      // Get burials from all plots in block
      for (const section of sections) {
        const block = section.blocks.find(b => b.id === areaId)
        if (block) {
          block.plots.forEach(plot => {
            allBurials.push(...plot.burials.filter(b => b.status === 'active'))
          })
          break
        }
      }
    } else if (areaType === 'section') {
      // Get burials from all plots in section
      const section = sections.find(s => s.id === areaId)
      if (section) {
        section.blocks.forEach(block => {
          block.plots.forEach(plot => {
            allBurials.push(...plot.burials.filter(b => b.status === 'active'))
          })
        })
      }
    }

    return allBurials.sort((a, b) => {
      // Sort by burial date (newest first)
      return new Date(b.deceasedInfo.burialDate).getTime() - new Date(a.deceasedInfo.burialDate).getTime()
    })
  }

  const handleShowOccupants = (areaType: 'plot' | 'block' | 'section', areaId: string, areaName: string) => {
    const occupants = getAreaOccupants(areaType, areaId)
    setSelectedAreaType(areaType)
    setSelectedAreaId(areaId)
    setSelectedAreaName(areaName)
    setAreaOccupants(occupants)
    setShowOccupantsList(true)
  }

  const handleCloseOccupantsList = () => {
    setShowOccupantsList(false)
    setSelectedAreaType(null)
    setSelectedAreaId('')
    setSelectedAreaName('')
    setAreaOccupants([])
  }

  // Cemetery selection handler
  const handleCemeterySelect = async (cemetery: Cemetery) => {
    setSelectedCemetery(cemetery)
    setIsLoading(true)
    
    // Set initial map center for this cemetery only if not already initialized
    if (!mapInitialized) {
      const initialCenter = calculateCemeteryCenter(cemetery)
      setMapCenter(initialCenter)
      setMapZoom(19)
      setMapInitialized(true)
    }
    setPreserveMapView(false)
    
    try {
      console.log('Loading selected cemetery data:', cemetery.id)
      
      // Load specific cemetery with sections and plots
      const response = await fetch(`/api/cemeteries?id=${cemetery.id}`)
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data) {
          const cemeteryData = result.data
          
          // Transform sections data from backend structure
          if (cemeteryData.sections && cemeteryData.sections.length > 0) {
            const transformedSections = cemeteryData.sections.map((section: any) => ({
              id: section.id.toString(),
              cemeteryId: cemetery.id.toString(),
              name: section.name,
              description: section.description || `Section ${section.name}`,
              color: '#3B82F6',
              capacity: section.capacity || 100,
              boundary: section.boundary || [[14.6760, 121.0437], [14.6761, 121.0437], [14.6761, 121.0438], [14.6760, 121.0438]],
              blocks: section.blocks.map((block: any) => ({
                id: block.id.toString(),
                sectionId: section.id.toString(),
                name: block.name,
                blockType: block.blockType.toLowerCase(),
                capacity: block.capacity || 50,
                color: '#10B981',
                boundary: block.boundary || [[14.6760, 121.0437], [14.6761, 121.0437], [14.6761, 121.0438], [14.6760, 121.0438]],
                plots: block.plots.map((plot: any) => ({
                  id: plot.id.toString(),
                  blockId: block.id.toString(),
                  plotNumber: plot.plotNumber || plot.plotCode,
                  coordinates: plot.boundary || [[
                    plot.latitude ? parseFloat(plot.latitude) : 14.6760,
                    plot.longitude ? parseFloat(plot.longitude) : 121.0437
                  ]],
                  size: plot.size ? plot.size.toLowerCase() : 'standard',
                  length: plot.length || 2,
                  width: plot.width || 1,
                  depth: plot.depth || 1.5,
                  baseFee: parseFloat(plot.baseFee) || 5000,
                  maintenanceFee: parseFloat(plot.maintenanceFee) || 500,
                  orientation: plot.orientation ? plot.orientation.toLowerCase() : 'north',
                  accessibility: plot.accessibility,
                  status: plot.status ? (plot.status.toLowerCase() === 'vacant' ? 'available' : 
                         plot.status.toLowerCase() === 'occupied' ? 'occupied' : 
                         plot.status.toLowerCase() === 'reserved' ? 'reserved' : 'available') : 'available',
                  maxLayers: plot.maxLayers || 3,
                  burials: plot.assignments && plot.assignments.length > 0 ? plot.assignments.map((assignment: any) => ({
                    id: `${plot.id}_burial_${assignment.id}`,
                    plotId: plot.id.toString(),
                    layer: assignment.layer || 1,
                    deceasedInfo: {
                      firstName: assignment.deceased?.firstName || 'Unknown',
                      lastName: assignment.deceased?.lastName || 'Unknown',
                      middleName: assignment.deceased?.middleName || '',
                      dateOfBirth: assignment.deceased?.dateOfBirth || '',
                      dateOfDeath: assignment.deceased?.dateOfDeath || '',
                      burialDate: assignment.assignedAt || '',
                      gender: assignment.deceased?.gender || assignment.deceased?.sex === 'Female' ? 'female' : 'male'
                    },
                    burialType: 'permanent',
                    status: 'active'
                  })) : [],
                  gravestone: plot.gravestones && plot.gravestones.length > 0 ? {
                    id: plot.gravestones[0].id.toString(),
                    plotId: plot.id.toString(),
                    material: plot.gravestones[0].material ? plot.gravestones[0].material.toLowerCase() : 'concrete',
                    condition: plot.gravestones[0].condition ? plot.gravestones[0].condition.toLowerCase() : 'good',
                    inscription: plot.gravestones[0].inscription || '',
                    dateInstalled: plot.gravestones[0].dateInstalled || '',
                    manufacturer: plot.gravestones[0].manufacturer || 'Unknown',
                    height: plot.gravestones[0].height || 100,
                    width: plot.gravestones[0].width || 80,
                    thickness: plot.gravestones[0].thickness || 15
                  } : undefined
                }))
              }))
            }))
            
            setSections(transformedSections)
            
            // Extract all plots for plots array
            const allPlots = transformedSections.flatMap((section: any) =>
              section.blocks.flatMap((block: any) => block.plots)
            )
            
            // Also load standalone plots that are not in sections/blocks
            console.log('Loading standalone plots for selected cemetery:', cemetery.id)
            try {
              const standaloneResponse = await fetch(`/api/cemetery-plots?cemeteryId=${cemetery.id}`)
              if (standaloneResponse.ok) {
                const standaloneResult = await standaloneResponse.json()
                console.log('Standalone plots result for selected cemetery:', standaloneResult)
                
                if (standaloneResult.success && standaloneResult.plots) {
                  // Filter out plots that are already in sections/blocks (have blockId)
                  const standalonePlots = standaloneResult.plots
                    .filter((plot: any) => !plot.blockId) // Only plots without blockId are standalone
                    .map((plot: any) => ({
                      id: plot.id.toString(),
                      blockId: null, // Standalone plots don't belong to blocks
                      plotNumber: plot.plotNumber || plot.plotCode,
                      coordinates: plot.coordinates || [[
                        plot.latitude ? parseFloat(plot.latitude) : 14.6760,
                        plot.longitude ? parseFloat(plot.longitude) : 121.0437
                      ]],
                      size: plot.size.toLowerCase(),
                      length: plot.length || 2,
                      width: plot.width || 1,
                      depth: plot.depth || 1.5,
                      baseFee: parseFloat(plot.baseFee) || 5000,
                      maintenanceFee: parseFloat(plot.maintenanceFee) || 500,
                      orientation: plot.orientation ? plot.orientation.toLowerCase() : 'north',
                      accessibility: plot.accessibility,
                      status: plot.status ? (plot.status.toLowerCase() === 'vacant' ? 'available' : 
                             plot.status.toLowerCase() === 'occupied' ? 'occupied' : 
                             plot.status.toLowerCase() === 'reserved' ? 'reserved' : 'available') : 'available',
                      maxLayers: plot.maxLayers || 3,
                      burials: plot.assignments && plot.assignments.length > 0 ? plot.assignments.map((assignment: any) => ({
                        id: `${plot.id}_burial_${assignment.id}`,
                        plotId: plot.id.toString(),
                        layer: assignment.layer || 1,
                        deceasedInfo: {
                          firstName: assignment.deceased?.firstName || 'Unknown',
                          lastName: assignment.deceased?.lastName || 'Unknown',
                          middleName: assignment.deceased?.middleName || '',
                          dateOfBirth: assignment.deceased?.dateOfBirth || '',
                          dateOfDeath: assignment.deceased?.dateOfDeath || '',
                          burialDate: assignment.assignedAt || '',
                          gender: assignment.deceased?.gender || assignment.deceased?.sex === 'Female' ? 'female' : 'male'
                        },
                        burialType: 'permanent',
                        status: 'active'
                      })) : [],
                      gravestone: plot.gravestones && plot.gravestones.length > 0 ? {
                        id: plot.gravestones[0].id.toString(),
                        plotId: plot.id.toString(),
                        material: plot.gravestones[0].material.toLowerCase(),
                        condition: plot.gravestones[0].condition.toLowerCase(),
                        inscription: plot.gravestones[0].inscription || '',
                        dateInstalled: plot.gravestones[0].dateInstalled || '',
                        manufacturer: plot.gravestones[0].manufacturer || 'Unknown',
                        height: plot.gravestones[0].height || 100,
                        width: plot.gravestones[0].width || 80,
                        thickness: plot.gravestones[0].thickness || 15
                      } : undefined
                    }))
                  
                  console.log('Found standalone plots for selected cemetery:', standalonePlots.length)
                  // Combine structured plots with standalone plots
                  const combinedPlots = [...allPlots, ...standalonePlots]
                  setPlots(combinedPlots)
                } else {
                  console.warn('No standalone plots found for selected cemetery')
                  setPlots(allPlots)
                }
              } else {
                console.warn('Failed to load standalone plots for selected cemetery')
                setPlots(allPlots)
              }
            } catch (error) {
              console.error('Error loading standalone plots for selected cemetery:', error)
              setPlots(allPlots)
            }
            
          } else {
            setSections([])
            setPlots([])
          }
        }
      }
    } catch (error) {
      console.error('Error loading cemetery sections:', error)
      setSections([])
      setPlots([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle cemetery management navigation
  const handleCemeteryManage = async (cemetery: Cemetery) => {
    await handleCemeterySelect(cemetery)
    window.history.pushState({}, '', `/admin/cemetery?id=${cemetery.id}`)
  }

  // Delete functions
  const handleDeleteConfirm = (type: 'cemetery' | 'section' | 'block' | 'plot' | 'gravestone' | 'burial', item: any, itemName: string) => {
    setDeleteType(type)
    setDeleteItem(item)
    setDeleteItemName(itemName)
    setShowDeleteConfirm(true)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setDeleteType(null)
    setDeleteItem(null)
    setDeleteItemName('')
  }

  const handleDeleteExecute = async () => {
    if (!deleteType || !deleteItem) return

    setIsSaving(true)
    try {
      console.log(`Deleting ${deleteType}:`, deleteItem)

      if (deleteType === 'cemetery') {
        // Delete cemetery via backend API
        const response = await fetch(`/api/cemeteries?id=${deleteItem.id}&cascade=true`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Cemetery deleted successfully:', result)
          
          // Remove from state
          const updatedCemeteries = cemeteries.filter(c => c.id !== deleteItem.id)
          setCemeteries(updatedCemeteries)
          
          // If deleted cemetery was selected, clear selection
          if (selectedCemetery && selectedCemetery.id === deleteItem.id) {
            setSelectedCemetery(null)
            setSections([])
            setPlots([])
          }
          
          alert('Cemetery and all associated data deleted successfully!')
        } else {
          let errorMessage = 'Unknown error'
          try {
            const errorData = await response.json()
            console.error('Cemetery deletion failed:', errorData)
            errorMessage = errorData.error || errorData.details || 'Unknown error'
          } catch (jsonError) {
            console.error('Error parsing error response:', jsonError)
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
          alert(`Failed to delete cemetery: ${errorMessage}`)
        }
      } else if (deleteType === 'plot') {
        // Delete plot via backend API
        const response = await fetch(`/api/cemetery-plots/${deleteItem.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Plot deleted successfully:', result)
          
          // Remove from state
          const updatedSections = sections.map(section => ({
            ...section,
            blocks: section.blocks.map(block => ({
              ...block,
              plots: block.plots.filter(p => p.id !== deleteItem.id)
            }))
          }))
          
          setSections(updatedSections)
          setPlots(plots.filter(p => p.id !== deleteItem.id))
          
          alert('Plot deleted successfully!')
        } else {
          const errorData = await response.json()
          console.error('Plot deletion failed:', errorData)
          alert(`Failed to delete plot: ${errorData.error || 'Unknown error'}`)
        }
      } else if (deleteType === 'section') {
        // Delete section via backend API
        const response = await fetch(`/api/cemetery-sections?id=${deleteItem.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Section deleted successfully:', result)
          
          // Reload cemetery data to reflect backend changes
          if (selectedCemetery) {
            const cemeteryResponse = await fetch(`/api/cemeteries?id=${selectedCemetery.id}`)
            if (cemeteryResponse.ok) {
              const cemeteryResult = await cemeteryResponse.json()
              if (cemeteryResult.success && cemeteryResult.data) {
                // Update sections with fresh data from backend
                const updatedSections = cemeteryResult.data.sections?.map((section: any) => ({
                  id: section.id.toString(),
                  cemeteryId: selectedCemetery.id,
                  name: section.name,
                  description: section.description || '',
                  color: '#3B82F6',
                  capacity: section.capacity || 0,
                  boundary: section.boundary || [],
                  blocks: section.blocks?.map((block: any) => ({
                    id: block.id.toString(),
                    sectionId: section.id.toString(),
                    name: block.name,
                    blockType: block.blockType.toLowerCase(),
                    capacity: block.capacity || 0,
                    color: '#10B981',
                    boundary: block.boundary || [],
                    plots: block.plots?.map((plot: any) => ({
                      id: plot.id.toString(),
                      blockId: block.id.toString(),
                      plotNumber: plot.plotNumber || plot.plotCode,
                      coordinates: plot.coordinates || [],
                      size: plot.size.toLowerCase(),
                      length: plot.length || 2.0,
                      width: plot.width || 1.0,
                      depth: plot.depth || 1.5,
                      baseFee: plot.baseFee || selectedCemetery.standardPrice,
                      maintenanceFee: plot.maintenanceFee || selectedCemetery.maintenanceFee,
                      orientation: plot.orientation?.toLowerCase() || 'north',
                      accessibility: plot.accessibility || true,
                      status: plot.status.toLowerCase(),
                      maxLayers: plot.maxLayers || 3,
                      burials: []
                    })) || []
                  })) || []
                })) || []

                setSections(updatedSections)
              }
            }
          }
          
          alert('Section deleted successfully!')
        } else {
          const errorData = await response.text()
          console.error('Section deletion failed:', errorData)
          alert(`Failed to delete section: ${errorData}`)
        }
      } else if (deleteType === 'block') {
        // Delete block via backend API
        const response = await fetch(`/api/cemetery-blocks?id=${deleteItem.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const result = await response.json()
          console.log('Block deleted successfully:', result)
          
          // Reload cemetery data to reflect backend changes
          if (selectedCemetery) {
            const cemeteryResponse = await fetch(`/api/cemeteries?id=${selectedCemetery.id}`)
            if (cemeteryResponse.ok) {
              const cemeteryResult = await cemeteryResponse.json()
              if (cemeteryResult.success && cemeteryResult.data) {
                // Update sections with fresh data from backend
                const updatedSections = cemeteryResult.data.sections?.map((section: any) => ({
                  id: section.id.toString(),
                  cemeteryId: selectedCemetery.id,
                  name: section.name,
                  description: section.description || '',
                  color: '#3B82F6',
                  capacity: section.capacity || 0,
                  boundary: section.boundary || [],
                  blocks: section.blocks?.map((block: any) => ({
                    id: block.id.toString(),
                    sectionId: section.id.toString(),
                    name: block.name,
                    blockType: block.blockType.toLowerCase(),
                    capacity: block.capacity || 0,
                    color: '#10B981',
                    boundary: block.boundary || [],
                    plots: block.plots?.map((plot: any) => ({
                      id: plot.id.toString(),
                      blockId: block.id.toString(),
                      plotNumber: plot.plotNumber || plot.plotCode,
                      coordinates: plot.coordinates || [],
                      size: plot.size.toLowerCase(),
                      length: plot.length || 2.0,
                      width: plot.width || 1.0,
                      depth: plot.depth || 1.5,
                      baseFee: plot.baseFee || selectedCemetery.standardPrice,
                      maintenanceFee: plot.maintenanceFee || selectedCemetery.maintenanceFee,
                      orientation: plot.orientation?.toLowerCase() || 'north',
                      accessibility: plot.accessibility || true,
                      status: plot.status.toLowerCase(),
                      maxLayers: plot.maxLayers || 3,
                      burials: []
                    })) || []
                  })) || []
                })) || []

                setSections(updatedSections)
              }
            }
          }
          
          alert('Block deleted successfully!')
        } else {
          const errorData = await response.text()
          console.error('Block deletion failed:', errorData)
          alert(`Failed to delete block: ${errorData}`)
        }
      } else {
        // Handle other delete types locally (burials, gravestones, etc.)
        switch (deleteType) {
          case 'burial':
            // Delete burial (mark as transferred/exhumed)
            const updatedSectionsAfterBurialDelete = sections.map(section => ({
              ...section,
              blocks: section.blocks.map(block => ({
                ...block,
                plots: block.plots.map(plot => {
                  if (plot.burials && plot.burials.some(b => b.id === deleteItem.id)) {
                    const updatedBurials = plot.burials.map(burial => 
                      burial.id === deleteItem.id 
                        ? { ...burial, status: 'transferred' as 'active' | 'transferred' | 'exhumed' }
                        : burial
                    )
                    const activeBurials = updatedBurials.filter(b => b.status === 'active')
                    return {
                      ...plot,
                      burials: updatedBurials,
                      status: activeBurials.length > 0 ? 'occupied' : 'available' as 'available' | 'reserved' | 'occupied' | 'maintenance'
                    }
                  }
                  return plot
                })
              }))
            }))
            setSections(updatedSectionsAfterBurialDelete)
            
            // Update plots array
            setPlots(plots.map(plot => {
              if (plot.burials && plot.burials.some(b => b.id === deleteItem.id)) {
                const updatedBurials = plot.burials.map(burial => 
                  burial.id === deleteItem.id 
                    ? { ...burial, status: 'transferred' as 'active' | 'transferred' | 'exhumed' }
                    : burial
                )
                const activeBurials = updatedBurials.filter(b => b.status === 'active')
                return {
                  ...plot,
                  burials: updatedBurials,
                  status: activeBurials.length > 0 ? 'occupied' : 'available' as 'available' | 'reserved' | 'occupied' | 'maintenance'
                }
              }
              return plot
            }))
            break

          case 'gravestone':
            // Delete gravestone (keep burials but remove gravestone)
            const updatedSectionsAfterGravestoneDelete = sections.map(section => ({
              ...section,
              blocks: section.blocks.map(block => ({
                ...block,
                plots: block.plots.map(plot => {
                  if (plot.id === deleteItem.plotId) {
                    const { gravestone, ...plotWithoutGravestone } = plot
                    // Keep plot as occupied if there are active burials
                    const activeBurials = plot.burials?.filter(b => b.status === 'active') || []
                    return {
                      ...plotWithoutGravestone,
                      status: activeBurials.length > 0 ? 'occupied' : 'available' as 'available' | 'reserved' | 'occupied' | 'maintenance'
                    }
                  }
                  return plot
                })
              }))
            }))
            setSections(updatedSectionsAfterGravestoneDelete)
            
            // Update plots array
            setPlots(plots.map(plot => {
              if (plot.id === deleteItem.plotId) {
                const activeBurials = plot.burials?.filter(b => b.status === 'active') || []
                return {
                  ...plot,
                  gravestone: undefined,
                  status: activeBurials.length > 0 ? 'occupied' : 'available' as 'available' | 'reserved' | 'occupied' | 'maintenance'
                }
              }
              return plot
            }))
            break
        }
        
        alert(`${deleteType.charAt(0).toUpperCase() + deleteType.slice(1)} deleted successfully!`)
      }

      console.log(`${deleteType} deleted successfully:`, deleteItem)
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error)
      alert(`Error deleting ${deleteType}. Please try again.`)
    } finally {
      setIsSaving(false)
      handleDeleteCancel()
      updatePlotStatistics()
    }
  }

  // Update statistics when sections change
  useEffect(() => {
    updatePlotStatistics()
  }, [sections])

  // Handle keyboard events for modal close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDeleteConfirm) {
          handleDeleteCancel()
        } else if (showOccupantsList) {
          handleCloseOccupantsList()
        }
      }
    }

    if (showDeleteConfirm || showOccupantsList) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [showDeleteConfirm, showOccupantsList])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading Cemetery Management...</p>
        </div>
      </div>
    )
  }

  // Cemetery selection screen
  if (!selectedCemetery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <MdMap size={32} color="#1F2937" />
              <span>Cemetery Management</span>
            </h1>
            <p className="text-gray-600 mt-2">Select a cemetery to manage sections, blocks, plots, and gravestones</p>
          </div>

          {cemeteries.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="mx-auto mb-4">
                <MdMap size={64} color="#9CA3AF" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cemeteries Found</h3>
              <p className="text-gray-600 mb-6">Create a cemetery first before you can manage it.</p>
              <button
                onClick={() => window.location.href = '/admin/cemetery-map'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Cemetery
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cemeteries.map((cemetery) => (
                <div key={cemetery.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <MdMap size={24} color="#3B82F6" />
                      <h3 className="text-lg font-semibold text-gray-900">{cemetery.name}</h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{cemetery.description}</p>
                    
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-center space-x-2">
                        <MdLocationOn size={16} />
                        <span>{cemetery.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MdTerrain size={16} />
                        <span>Area: {Math.round(cemetery.totalArea).toLocaleString()} m²</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MdInfo size={16} />
                        <span>Created: {new Date(cemetery.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCemeteryManage(cemetery)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <FiEdit2 size={16} />
                        <span>Manage</span>
                      </button>
                      <button
                        onClick={() => handleDeleteConfirm('cemetery', cemetery, cemetery.name)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        title="Delete Cemetery"
                      >
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 ${(showDeleteConfirm || showOccupantsList) ? 'overflow-hidden' : ''}`}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <button
                onClick={() => setSelectedCemetery(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiX size={24} />
              </button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <MdMap size={32} color="#1F2937" />
                <span>{selectedCemetery.name}</span>
              </h1>
            </div>
            <p className="text-gray-600 ml-9">Manage sections, blocks, plots, and gravestones</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={async () => {
                setIsLoading(true)
                try {
                  const response = await fetch(`/api/cemeteries?id=${selectedCemetery.id}`)
                  if (response.ok) {
                    const result = await response.json()
                    if (result.success && result.data) {
                      // Update with fresh data
                      window.location.reload()
                    }
                  }
                } catch (error) {
                  console.error('Error refreshing data:', error)
                } finally {
                  setIsLoading(false)
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              <FiRefreshCw size={16} />
              <span>Refresh Data</span>
            </button>
            <button
              onClick={() => window.open(`/admin/cemetery/plots`, '_blank')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              <FiGrid size={16} />
              <span>Plot Management</span>
            </button>
          </div>
        </div>

        {/* Management Steps */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Management Tools</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'overview', title: 'Overview', icon: MdInfo, color: '#6B7280' },
              { key: 'sections', title: 'Sections', icon: MdLayers, color: '#7C3AED' },
              { key: 'blocks', title: 'Blocks', icon: FiGrid, color: '#3B82F6' },
              { key: 'plots', title: 'Plots', icon: FiMapPin, color: '#EF4444' },
              { key: 'burials', title: 'Burials', icon: FiTarget, color: '#8B5CF6' }
            ].map((step) => {
              const isActive = currentStep === step.key
              const IconComponent = step.icon
              
              return (
                <button
                  key={step.key}
                  onClick={() => setCurrentStep(step.key as ManagementStep)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-800 border border-blue-300' : 
                    'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent size={18} color={isActive ? '#1E40AF' : step.color} />
                  <span className="font-medium">{step.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Interactive Cemetery Map</h2>
              </div>
              
              <div 
                className={`h-[600px] ${(showDeleteConfirm || showOccupantsList) ? 'pointer-events-none' : ''}`}
              >
                <CemeteryMapComponent 
                  cemeteryLayout={selectedCemetery ? {
                    id: selectedCemetery.id,
                    name: selectedCemetery.name,
                    description: selectedCemetery.description,
                    boundary: selectedCemetery.boundary,
                    sections: sections.map(section => ({
                      id: section.id,
                      name: section.name,
                      description: section.description,
                      coordinates: section.boundary,
                      color: section.color,
                      blocks: section.blocks.map(block => ({
                        id: block.id,
                        name: block.name,
                        sectionId: block.sectionId,
                        coordinates: block.boundary,
                        color: block.color,
                        plots: block.plots.map(plot => ({
                          id: plot.id,
                          blockId: plot.blockId,
                          plotCode: plot.plotNumber,
                          coordinates: plot.coordinates,
                          status: plot.status === 'available' ? 'VACANT' : 
                                 plot.status === 'reserved' ? 'RESERVED' : 
                                 plot.status === 'occupied' ? 'OCCUPIED' : 'BLOCKED',
                          size: plot.size,
                          occupantCount: plot.burials?.filter(b => b.status === 'active').length || 0,
                          maxLayers: plot.maxLayers || 3,
                          burials: plot.burials?.filter(b => b.status === 'active').map(burial => ({
                            id: burial.id,
                            layer: burial.layer,
                            name: `${burial.deceasedInfo.firstName} ${burial.deceasedInfo.lastName}`,
                            burialDate: burial.deceasedInfo.burialDate,
                            burialType: burial.burialType
                          })) || [],
                          // Use burial data instead of gravestone deceased info
                          deceased: (plot.burials && plot.burials.length > 0 && plot.burials[0].status === 'active') ? {
                            firstName: plot.burials[0].deceasedInfo.firstName,
                            lastName: plot.burials[0].deceasedInfo.lastName,
                            dateOfBirth: plot.burials[0].deceasedInfo.dateOfBirth,
                            dateOfDeath: plot.burials[0].deceasedInfo.dateOfDeath
                          } : undefined,
                          gravestone: plot.gravestone ? {
                            material: plot.gravestone.material,
                            inscription: plot.gravestone.inscription,
                            condition: plot.gravestone.condition
                          } : undefined
                        }))
                      }))
                    }))
                  } : null}
                  drawingMode={drawingMode}
                  currentDrawing={currentDrawing}
                  showPlots={true}
                  center={mapInitialized ? mapCenter : (selectedCemetery ? calculateCemeteryCenter(selectedCemetery) : undefined)}
                  zoom={mapInitialized ? mapZoom : (selectedPlotId ? 20 : 19)} // Zoom in more when focusing on a plot
                  height="h-[600px]"
                  mapType="satellite"
                  focusPlot={selectedPlotId ? (() => {
                    // Find the focused plot data
                    let focusedPlot = null
                    if (selectedCemetery && sections) {
                      for (const section of sections) {
                        for (const block of section.blocks) {
                          const plot = block.plots.find(p => p.id === selectedPlotId)
                          if (plot) {
                            // Calculate center of plot coordinates
                            let centerLat = 14.6760, centerLng = 121.0437 // Default fallback
                            if (plot.coordinates && plot.coordinates.length > 0) {
                              const lats = plot.coordinates.map(coord => coord[0])
                              const lngs = plot.coordinates.map(coord => coord[1])
                              centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
                              centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
                            }
                            
                            focusedPlot = {
                              id: plot.id,
                              plotNumber: plot.plotNumber,
                              coordinates: { lat: centerLat, lng: centerLng },
                              section: section.name,
                              block: block.name,
                              status: plot.status,
                              occupiedBy: plot.burials && plot.burials.length > 0 ? 
                                `${plot.burials[0].deceasedInfo.firstName} ${plot.burials[0].deceasedInfo.lastName}` : 
                                undefined,
                              reservedBy: plot.status === 'reserved' ? 'Reserved' : undefined
                            }
                            break
                          }
                        }
                        if (focusedPlot) break
                      }
                    }
                    return focusedPlot
                  })() : undefined}
                  onMapClick={(coords) => {
                    if (isDrawing) {
                      setCurrentDrawing(prev => [...prev, coords])
                    }
                  }}
                  onViewChange={(center, zoom) => {
                    // Always update map center and zoom when user moves the map
                    setMapCenter(center)
                    setMapZoom(zoom)
                    if (!mapInitialized) {
                      setMapInitialized(true)
                    }
                  }}
                  onPolygonClick={(type, id) => {
                    console.log(`Clicked ${type}:`, id)
                    
                    if (type === 'plot') {
                      // Show plot occupants
                      const plot = sections.flatMap(s => s.blocks.flatMap(b => b.plots)).find(p => p.id === id)
                      if (plot) {
                        handleShowOccupants('plot', plot.id, plot.plotNumber)
                      }
                    } else if (type === 'block') {
                      // Show block occupants
                      const block = sections.flatMap(s => s.blocks).find(b => b.id === id)
                      if (block) {
                        handleShowOccupants('block', block.id, block.name)
                      }
                    } else if (type === 'section') {
                      // Show section occupants
                      const section = sections.find(s => s.id === id)
                      if (section) {
                        handleShowOccupants('section', section.id, section.name)
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Management Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Overview */}
              {currentStep === 'overview' && (
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <MdInfo size={20} color="#6B7280" />
                    <h3 className="text-lg font-semibold text-gray-900">Cemetery Overview</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Total Area:</span>
                          <span>{Math.round(selectedCemetery.totalArea).toLocaleString()} m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Sections:</span>
                          <span>{sections.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Blocks:</span>
                          <span>{sections.reduce((total, s) => total + s.blocks.length, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total Plots:</span>
                          <span>{sections.reduce((total, s) => 
                            total + s.blocks.reduce((blockTotal, b) => 
                              blockTotal + b.plots.length, 0), 0
                          )}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-3">Burial Statistics</h4>
                      <div className="space-y-2 text-sm">
                        {(() => {
                          const allPlots = sections.flatMap(s => s.blocks.flatMap(b => b.plots))
                          const totalBurials = allPlots.reduce((total, plot) => {
                            return total + (plot.burials?.filter(b => b.status === 'active').length || 0)
                          }, 0)
                          const totalCapacity = allPlots.reduce((total, plot) => total + (plot.maxLayers || 3), 0)
                          const temporaryBurials = allPlots.reduce((total, plot) => {
                            return total + (plot.burials?.filter(b => b.status === 'active' && b.burialType === 'temporary').length || 0)
                          }, 0)
                          
                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="font-medium">Active Burials:</span>
                                <span>{totalBurials.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Total Capacity:</span>
                                <span>{totalCapacity.toLocaleString()} layers</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Occupancy Rate:</span>
                                <span>{totalCapacity > 0 ? Math.round((totalBurials / totalCapacity) * 100) : 0}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">Temporary Burials:</span>
                                <span>{temporaryBurials.toLocaleString()}</span>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-3">Quick Actions</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setCurrentStep('sections')}
                          className="w-full text-left bg-white p-3 rounded border hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                          <MdLayers size={16} color="#7C3AED" />
                          <span>Manage Sections</span>
                        </button>
                        <button
                          onClick={() => setCurrentStep('blocks')}
                          className="w-full text-left bg-white p-3 rounded border hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                          <FiGrid size={16} color="#3B82F6" />
                          <span>Manage Blocks</span>
                        </button>
                        <button
                          onClick={() => setCurrentStep('plots')}
                          className="w-full text-left bg-white p-3 rounded border hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                          <FiMapPin size={16} color="#EF4444" />
                          <span>Manage Plots</span>
                        </button>
                        <button
                          onClick={() => setCurrentStep('burials')}
                          className="w-full text-left bg-white p-3 rounded border hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                          <FiTarget size={16} color="#8B5CF6" />
                          <span>Manage Burials</span>
                        </button>
                        <button
                          onClick={() => window.location.href = '/admin/cemetery/plots'}
                          className="w-full text-left bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded border hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center space-x-2 text-white"
                        >
                          <FiList size={16} />
                          <span>View All Plots</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections Management */}
              {currentStep === 'sections' && (
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <MdLayers size={20} color="#7C3AED" />
                    <h3 className="text-lg font-semibold text-gray-900">Manage Sections</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Add New Section</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Section Name *</label>
                          <input
                            type="text"
                            value={sectionFormData.name}
                            onChange={(e) => setSectionFormData({...sectionFormData, name: e.target.value})}
                            placeholder="e.g., Section A, Garden Area"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={sectionFormData.description}
                            onChange={(e) => setSectionFormData({...sectionFormData, description: e.target.value})}
                            placeholder="Brief description..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                            <input
                              type="number"
                              value={sectionFormData.capacity}
                              onChange={(e) => setSectionFormData({...sectionFormData, capacity: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                            <input
                              type="color"
                              value={sectionFormData.color}
                              onChange={(e) => setSectionFormData({...sectionFormData, color: e.target.value})}
                              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {drawingMode === 'section' && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Drawing Section Boundary</h4>
                        <div className="text-sm text-blue-800">
                          <p>Points added: {currentDrawing.length}</p>
                          <p className="mt-1">Click on the map to define section boundaries</p>
                          {currentDrawing.length >= 3 && (
                            <p className="text-green-700 font-medium">✓ Valid section boundary</p>
                          )}
                        </div>
                      </div>
                    )}

                    {sections.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Existing Sections ({sections.length})</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {sections.map((section) => (
                            <div key={section.id} className="flex items-center justify-between bg-white p-2 rounded border">
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: section.color }}></div>
                                <span className="text-sm font-medium">{section.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">{section.blocks.length} blocks</span>
                                <button
                                  onClick={() => handleDeleteConfirm('section', section, section.name)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Section"
                                >
                                  <MdDelete size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-200">
                    {drawingMode !== 'section' ? (
                      <button
                        onClick={() => {
                          setDrawingMode('section')
                          setIsDrawing(true)
                          setCurrentDrawing([])
                        }}
                        disabled={!sectionFormData.name}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
                      >
                        <FiMapPin size={16} />
                        <span>Draw Section</span>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCancelDrawing}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <MdCancel size={16} />
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={handleSaveSection}
                          disabled={currentDrawing.length < 3 || !sectionFormData.name || isSaving}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <FiCheck size={16} />
                              <span>Save Section</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Blocks Management */}
              {currentStep === 'blocks' && (
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <FiGrid size={20} color="#3B82F6" />
                    <h3 className="text-lg font-semibold text-gray-900">Manage Blocks</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {sections.length === 0 ? (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          Create sections first before adding blocks.
                        </p>
                        <button
                          onClick={() => setCurrentStep('sections')}
                          className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                        >
                          Create Sections
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Add New Block</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Block Name *</label>
                              <input
                                type="text"
                                value={blockFormData.name}
                                onChange={(e) => setBlockFormData({...blockFormData, name: e.target.value})}
                                placeholder="e.g., Block 1, Block A-1"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                              <select
                                value={blockFormData.sectionId}
                                onChange={(e) => setBlockFormData({...blockFormData, sectionId: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select Section</option>
                                {sections.map((section) => (
                                  <option key={section.id} value={section.id}>
                                    {section.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                  value={blockFormData.blockType}
                                  onChange={(e) => setBlockFormData({...blockFormData, blockType: e.target.value as any})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="standard">Standard</option>
                                  <option value="premium">Premium</option>
                                  <option value="family">Family</option>
                                  <option value="niche">Niche</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                                <input
                                  type="number"
                                  value={blockFormData.capacity}
                                  onChange={(e) => setBlockFormData({...blockFormData, capacity: parseInt(e.target.value) || 0})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {drawingMode === 'block' && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Drawing Block Boundary</h4>
                            <div className="text-sm text-blue-800">
                              <p>Points added: {currentDrawing.length}</p>
                              <p className="mt-1">Click within the selected section to define block boundaries</p>
                              {currentDrawing.length >= 3 && (
                                <p className="text-green-700 font-medium">✓ Valid block boundary</p>
                              )}
                            </div>
                          </div>
                        )}

                        {sections.some(s => s.blocks.length > 0) && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">Existing Blocks</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {sections.map(section => 
                                section.blocks.map(block => (
                                  <div key={block.id} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                    <span>{section.name} - {block.name} ({block.blockType})</span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">{block.plots.length} plots</span>
                                      <button
                                        onClick={() => handleDeleteConfirm('block', block, `${section.name} - ${block.name}`)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                        title="Delete Block"
                                      >
                                        <MdDelete size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {sections.length > 0 && (
                    <div className="flex space-x-3 pt-6 mt-6 border-t border-gray-200">
                      {drawingMode !== 'block' ? (
                        <button
                          onClick={() => {
                            if (blockFormData.sectionId) {
                              setDrawingMode('block')
                              setIsDrawing(true)
                              setCurrentDrawing([])
                            }
                          }}
                          disabled={!blockFormData.name || !blockFormData.sectionId}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                        >
                          <FiGrid size={16} />
                          <span>Draw Block</span>
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleCancelDrawing}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <MdCancel size={16} />
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={handleSaveBlock}
                            disabled={currentDrawing.length < 3 || !blockFormData.name || !blockFormData.sectionId || isSaving}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                          >
                            {isSaving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <FiCheck size={16} />
                                <span>Save Block</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Plots Management */}
              {currentStep === 'plots' && (
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <FiMapPin size={20} color="#EF4444" />
                    <h3 className="text-lg font-semibold text-gray-900">Manage Plots</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {sections.some(s => s.blocks.length > 0) ? (
                      <>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="font-medium text-red-900 mb-2">Auto-Generate Plots</h4>
                          <p className="text-sm text-red-800 mb-3">
                            Generate plots automatically within existing blocks based on standard dimensions.
                          </p>
                          
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Plot Length (m)</label>
                                <input
                                  type="number"
                                  defaultValue="2"
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Plot Width (m)</label>
                                <input
                                  type="number"
                                  defaultValue="1"
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Spacing (m)</label>
                                <input
                                  type="number"
                                  defaultValue="0.5"
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                            </div>
                            
                            <button 
                              onClick={handleAutoGeneratePlots}
                              disabled={isSaving}
                              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-300 transition-colors text-sm flex items-center justify-center space-x-2"
                            >
                              {isSaving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <FiGrid size={16} />
                                  <span>Auto-Generate All Plots</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Manual Plot Creation</h4>
                          <p className="text-sm text-blue-800 mb-3">
                            Create individual plots by drawing them on the map.
                          </p>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Plot Code</label>
                              <input
                                type="text"
                                value={plotFormData.plotCode}
                                onChange={(e) => setPlotFormData({...plotFormData, plotCode: e.target.value})}
                                placeholder="Auto-generated if empty"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                                <select
                                  value={plotFormData.blockId}
                                  onChange={(e) => setPlotFormData({...plotFormData, blockId: e.target.value})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Select Block</option>
                                  {sections.flatMap(section =>
                                    section.blocks.map(block => (
                                      <option key={block.id} value={block.id}>
                                        {section.name} - {block.name}
                                      </option>
                                    ))
                                  )}
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                                <select
                                  value={plotFormData.size}
                                  onChange={(e) => setPlotFormData({...plotFormData, size: e.target.value as 'standard' | 'large' | 'family' | 'niche'})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="standard">Standard</option>
                                  <option value="large">Large</option>
                                  <option value="family">Family</option>
                                  <option value="niche">Niche</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          {drawingMode === 'plot' && (
                            <div className="mt-3 bg-blue-100 p-3 rounded">
                              <p className="text-sm text-blue-800">
                                Drawing plot... Points: {currentDrawing.length}
                                {currentDrawing.length >= 3 && <span className="text-green-700 ml-2">✓ Valid plot</span>}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex space-x-2 mt-4">
                            {drawingMode !== 'plot' ? (
                              <button
                                onClick={() => {
                                  if (plotFormData.blockId) {
                                    setDrawingMode('plot')
                                    setIsDrawing(true)
                                    setCurrentDrawing([])
                                  }
                                }}
                                disabled={!plotFormData.blockId}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm"
                              >
                                <FiMapPin size={16} />
                                <span>Draw Plot</span>
                              </button>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleCancelDrawing}
                                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm"
                                >
                                  <MdCancel size={16} />
                                  <span>Cancel</span>
                                </button>
                                <button
                                  onClick={handleSavePlot}
                                  disabled={currentDrawing.length < 3 || !plotFormData.blockId || isSaving}
                                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 transition-colors text-sm"
                                >
                                  {isSaving ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                      <span>Saving...</span>
                                    </>
                                  ) : (
                                    <>
                                      <FiCheck size={16} />
                                      <span>Save Plot</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">Plot Statistics</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white p-3 rounded border">
                              <div className="flex justify-between">
                                <span>Total Plots:</span>
                                <span className="font-medium">{plotStatistics.total}</span>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="flex justify-between">
                                <span className="text-green-600">Vacant:</span>
                                <span className="font-medium text-green-600">{plotStatistics.vacant}</span>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="flex justify-between">
                                <span className="text-yellow-600">Reserved:</span>
                                <span className="font-medium text-yellow-600">{plotStatistics.reserved}</span>
                              </div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="flex justify-between">
                                <span className="text-red-600">Occupied:</span>
                                <span className="font-medium text-red-600">{plotStatistics.occupied}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Plot List */}
                        {plotStatistics.total > 0 && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">All Plots ({plotStatistics.total})</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {sections.flatMap(section =>
                                section.blocks.flatMap(block =>
                                  block.plots.map(plot => (
                                    <div key={plot.id} className="bg-white p-3 rounded border text-sm">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <span className="font-medium">{plot.plotNumber}</span>
                                          <span className="ml-2 text-gray-600">({plot.size})</span>
                                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                            plot.status === 'available' ? 'bg-green-100 text-green-800' :
                                            plot.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                            plot.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {plot.status}
                                          </span>
                                          {plot.burials && plot.burials.length > 0 && (
                                            <span className="ml-2 text-xs text-purple-600">
                                              ⚰️ {plot.burials.filter(b => b.status === 'active').length}/{plot.maxLayers || 3} layers
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => handleDeleteConfirm('plot', plot, `${plot.plotNumber} (${plot.status})`)}
                                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                          title="Delete Plot"
                                        >
                                          <MdDelete size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          Create blocks first before adding plots.
                        </p>
                        <button
                          onClick={() => setCurrentStep('blocks')}
                          className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                        >
                          Create Blocks
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Burials Management */}
              {currentStep === 'burials' && (
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <FiTarget size={20} color="#8B5CF6" />
                    <h3 className="text-lg font-semibold text-gray-900">Manage Burials</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {plots.length > 0 ? (
                      <>
                        {/* Add New Burial Button */}
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-medium text-purple-900 mb-2">Add New Burial</h4>
                          <p className="text-sm text-purple-800 mb-3">
                            Philippine public cemeteries allow multiple burials per plot in layers. Assign burials to available plot layers.
                          </p>
                          
                          <button
                            onClick={() => {
                              setSelectedPlotId('')
                              setBurialFormData({
                                firstName: '',
                                lastName: '',
                                middleName: '',
                                dateOfBirth: '',
                                dateOfDeath: '',
                                burialDate: '',
                                gender: '' as 'male' | 'female' | '',
                                causeOfDeath: '',
                                occupation: '',
                                permitNumber: '',
                                registrationNumber: '',
                                nextOfKin: {
                                  name: '',
                                  relationship: '',
                                  contactNumber: ''
                                },
                                burialType: 'permanent' as 'temporary' | 'permanent',
                                expirationDate: '',
                                layer: 1,
                                notes: ''
                              })
                              setShowBurialModal(true)
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <FiPlus size={18} />
                            <span>Assign Burial to Plot</span>
                          </button>
                        </div>

                        {/* Occupant List Quick Actions */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">View Occupants</h4>
                          <p className="text-sm text-blue-800 mb-3">
                            Click on any area to see who is buried there. Perfect for Philippine multi-layer burial system.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sections.map(section => (
                              <button
                                key={section.id}
                                onClick={() => handleShowOccupants('section', section.id, section.name)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              >
                                {section.name} Section
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Plot Status Overview */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-3">Cemetery Plot Status</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sections.flatMap(section =>
                              section.blocks.flatMap(block =>
                                block.plots.map(plot => {
                                  const activeBurials = plot.burials?.filter(b => b.status === 'active').length || 0
                                  const hasSpace = activeBurials < plot.maxLayers
                                  return (
                                    <div key={plot.id} className={`p-3 rounded-lg border ${
                                      hasSpace ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                    }`}>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">{plot.plotNumber}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          hasSpace ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                        }`}>
                                          {activeBurials}/{plot.maxLayers}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {hasSpace ? `${plot.maxLayers - activeBurials} layer(s) available` : 'Fully occupied'}
                                      </div>
                                      {hasSpace && (
                                        <button
                                          onClick={() => {
                                            setSelectedPlotId(plot.id)
                                            setBurialFormData({
                                              ...burialFormData,
                                              layer: 1
                                            })
                                            setShowBurialModal(true)
                                          }}
                                          className="mt-2 w-full text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                        >
                                          Assign Burial
                                        </button>
                                      )}
                                    </div>
                                  )
                                })
                              )
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          Create plots first before adding burials.
                        </p>
                        <button
                          onClick={() => setCurrentStep('plots')}
                          className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                        >
                          Create Plots
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm ? (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] animate-fadeIn"
          onClick={handleDeleteCancel}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl border border-gray-300 max-w-md w-full mx-4 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <MdDelete size={20} color="#DC2626" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete {deleteType === 'gravestone' ? 'Gravestone' : deleteType ? deleteType.charAt(0).toUpperCase() + deleteType.slice(1) : 'Item'}
                  </h3>
                  <p className="text-sm text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete <strong>"{deleteItemName}"</strong>?
                </p>
                {deleteType === 'section' && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ This will also delete all blocks and plots within this section.
                  </p>
                )}
                {deleteType === 'block' && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ This will also delete all plots within this block.
                  </p>
                )}
                {deleteType === 'cemetery' && (
                  <div className="text-sm text-red-600 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold mb-1">⚠️ CASCADE DELETION WARNING</p>
                    <p>This will permanently delete:</p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>The entire cemetery</li>
                      <li>All sections and blocks</li>
                      <li>All plots (could be 1000+)</li>
                      <li>All gravestones and assignments</li>
                      <li>All associated burial records</li>
                    </ul>
                    <p className="mt-2 font-semibold">This action cannot be undone!</p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteExecute}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <MdDelete size={16} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Occupants List Modal */}
      {showOccupantsList && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn"
          onClick={handleCloseOccupantsList}
          style={{ 
            pointerEvents: 'auto',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl border border-gray-300 max-w-4xl w-full max-h-[80vh] mx-4 overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiEye size={20} color="#2563EB" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Occupants in {selectedAreaName} {selectedAreaType && selectedAreaType.charAt(0).toUpperCase() + selectedAreaType.slice(1)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Total burials found: {areaOccupants.length} (Philippine multi-layer system)
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseOccupantsList}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {areaOccupants.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4">
                    <FiMapPin size={48} color="#9CA3AF" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Burials</h4>
                  <p className="text-gray-600">
                    This {selectedAreaType} currently has no active burials recorded.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {areaOccupants.map((burial, index) => {
                    // Find the plot this burial belongs to
                    const plotInfo = sections.flatMap(section =>
                      section.blocks.flatMap(block =>
                        block.plots.map(plot => ({
                          plot,
                          section: section.name,
                          block: block.name
                        }))
                      )
                    ).find(info => info.plot.id === burial.plotId)

                    return (
                      <div key={burial.id} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {burial.deceasedInfo.firstName} {burial.deceasedInfo.middleName && `${burial.deceasedInfo.middleName} `}{burial.deceasedInfo.lastName}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                burial.burialType === 'permanent' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {burial.burialType}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-gray-700">Location</p>
                                <p className="text-gray-600">
                                  {plotInfo?.section} → {plotInfo?.block} → {plotInfo?.plot.plotNumber}
                                </p>
                                <p className="text-xs text-blue-600 font-medium">Layer {burial.layer}</p>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-700">Dates</p>
                                <p className="text-gray-600">
                                  Born: {burial.deceasedInfo.dateOfBirth ? 
                                    new Date(burial.deceasedInfo.dateOfBirth).toLocaleDateString() : 'N/A'}
                                </p>
                                <p className="text-gray-600">
                                  Died: {burial.deceasedInfo.dateOfDeath ? 
                                    new Date(burial.deceasedInfo.dateOfDeath).toLocaleDateString() : 'N/A'}
                                </p>
                                <p className="text-gray-600">
                                  Buried: {burial.deceasedInfo.burialDate ? 
                                    new Date(burial.deceasedInfo.burialDate).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-700">Personal Info</p>
                                <p className="text-gray-600">Gender: {burial.deceasedInfo.gender || 'N/A'}</p>
                                {burial.deceasedInfo.occupation && (
                                  <p className="text-gray-600">Job: {burial.deceasedInfo.occupation}</p>
                                )}
                                {burial.deceasedInfo.causeOfDeath && (
                                  <p className="text-gray-600">Cause: {burial.deceasedInfo.causeOfDeath}</p>
                                )}
                              </div>
                              
                              <div>
                                <p className="font-medium text-gray-700">Next of Kin</p>
                                {burial.deceasedInfo.nextOfKin ? (
                                  <>
                                    <p className="text-gray-600">{burial.deceasedInfo.nextOfKin.name}</p>
                                    <p className="text-gray-600 capitalize">{burial.deceasedInfo.nextOfKin.relationship}</p>
                                    {burial.deceasedInfo.nextOfKin.contactNumber && (
                                      <p className="text-gray-600 text-xs">{burial.deceasedInfo.nextOfKin.contactNumber}</p>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-gray-600">N/A</p>
                                )}
                              </div>
                            </div>
                            
                            {burial.burialType === 'temporary' && burial.expirationDate && (
                              <div className="mt-3 p-2 bg-yellow-50 rounded border">
                                <p className="text-sm font-medium text-yellow-800">
                                  Temporary Burial - Expires: {new Date(burial.expirationDate).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            
                            {burial.notes && (
                              <div className="mt-3 p-2 bg-blue-50 rounded border">
                                <p className="text-sm text-blue-800">
                                  <strong>Notes:</strong> {burial.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => {
                                // Navigate to plot location
                                if (plotInfo) {
                                  handleShowOccupants('plot', plotInfo.plot.id, plotInfo.plot.plotNumber)
                                }
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="View Plot Details"
                            >
                              <FiMapPin size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm('burial', burial, `${burial.deceasedInfo.firstName} ${burial.deceasedInfo.lastName} (Layer ${burial.layer})`)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Remove Burial"
                            >
                              <MdDelete size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {areaOccupants.length > 0 && (
                    <>
                      Showing burials in {selectedAreaType} "{selectedAreaName}" 
                      {selectedAreaType === 'plot' && (
                        <>
                          {' '}({areaOccupants.filter(b => b.burialType === 'permanent').length} permanent, 
                          {areaOccupants.filter(b => b.burialType === 'temporary').length} temporary)
                        </>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={handleCloseOccupantsList}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Burial Assignment Modal */}
      {showBurialModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-300 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-slideUp pointer-events-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Assign Burial {selectedPlotId && sections.flatMap(s => s.blocks.flatMap(b => b.plots)).find(p => p.id === selectedPlotId) ? 
                    `- Plot ${sections.flatMap(s => s.blocks.flatMap(b => b.plots)).find(p => p.id === selectedPlotId)?.plotNumber}` : ''}
                </h2>
                <button
                  onClick={() => setShowBurialModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAddBurial(); }}>
                {/* Plot Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Plot *
                  </label>
                  <select
                    value={selectedPlotId}
                    onChange={(e) => {
                      setSelectedPlotId(e.target.value)
                      setBurialFormData({...burialFormData, layer: 1})
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">Select a plot</option>
                    {sections.flatMap(section =>
                      section.blocks.flatMap(block =>
                        block.plots.map(plot => {
                          const activeBurials = plot.burials?.filter(b => b.status === 'active').length || 0
                          const hasSpace = activeBurials < plot.maxLayers
                          return (
                            <option key={plot.id} value={plot.id} disabled={!hasSpace}>
                              {plot.plotNumber} - {section.name} / {block.name} ({activeBurials}/{plot.maxLayers} occupied) {!hasSpace ? '- FULL' : ''}
                            </option>
                          )
                        })
                      )
                    )}
                  </select>
                </div>

                {/* Layer Status Display */}
                {selectedPlotId && (() => {
                  const plot = sections.flatMap(s => s.blocks.flatMap(b => b.plots)).find(p => p.id === selectedPlotId)
                  if (!plot) return null
                  
                  return (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
                      <h5 className="font-medium text-gray-900 mb-3">Plot Layer Status</h5>
                      <div className="grid grid-cols-1 gap-2">
                        {Array.from({length: plot.maxLayers}, (_, i) => {
                          const layer = i + 1
                          const burial = plot.burials?.find(b => b.layer === layer && b.status === 'active')
                          return (
                            <div key={layer} className={`p-2 rounded text-sm ${
                              burial ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              <strong>Layer {layer}:</strong> {burial ? 
                                `${burial.deceasedInfo.firstName} ${burial.deceasedInfo.lastName}` : 
                                'Available'
                              }
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Basic Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={burialFormData.firstName}
                      onChange={(e) => setBurialFormData({...burialFormData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={burialFormData.lastName}
                      onChange={(e) => setBurialFormData({...burialFormData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={burialFormData.middleName}
                      onChange={(e) => setBurialFormData({...burialFormData, middleName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender *
                    </label>
                    <select
                      value={burialFormData.gender}
                      onChange={(e) => setBurialFormData({...burialFormData, gender: e.target.value as 'male' | 'female' | ''})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      value={burialFormData.dateOfBirth}
                      onChange={(e) => setBurialFormData({...burialFormData, dateOfBirth: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Death *
                    </label>
                    <input
                      type="date"
                      value={burialFormData.dateOfDeath}
                      onChange={(e) => setBurialFormData({...burialFormData, dateOfDeath: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Burial Date *
                    </label>
                    <input
                      type="date"
                      value={burialFormData.burialDate}
                      onChange={(e) => setBurialFormData({...burialFormData, burialDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Burial Layer *
                    </label>
                    <select
                      value={burialFormData.layer}
                      onChange={(e) => setBurialFormData({...burialFormData, layer: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      {selectedPlotId && (() => {
                        const plot = sections.flatMap(s => s.blocks.flatMap(b => b.plots)).find(p => p.id === selectedPlotId)
                        if (!plot) return <option value="">Select plot first</option>
                        
                        return Array.from({length: plot.maxLayers}, (_, i) => {
                          const layer = i + 1
                          const isOccupied = plot.burials?.some(b => b.layer === layer && b.status === 'active')
                          return (
                            <option key={layer} value={layer} disabled={isOccupied}>
                              Layer {layer} {isOccupied ? '(Occupied)' : '(Available)'}
                            </option>
                          )
                        })
                      })()}
                    </select>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cause of Death
                    </label>
                    <input
                      type="text"
                      value={burialFormData.causeOfDeath}
                      onChange={(e) => setBurialFormData({...burialFormData, causeOfDeath: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupation
                    </label>
                    <input
                      type="text"
                      value={burialFormData.occupation}
                      onChange={(e) => setBurialFormData({...burialFormData, occupation: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      value={burialFormData.permitNumber}
                      onChange={(e) => setBurialFormData({...burialFormData, permitNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={burialFormData.registrationNumber}
                      onChange={(e) => setBurialFormData({...burialFormData, registrationNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      value={burialFormData.nextOfKin.name}
                      onChange={(e) => setBurialFormData({
                        ...burialFormData, 
                        nextOfKin: {...burialFormData.nextOfKin, name: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={burialFormData.nextOfKin.contactNumber}
                      onChange={(e) => setBurialFormData({
                        ...burialFormData,
                        nextOfKin: {...burialFormData.nextOfKin, contactNumber: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship to Deceased *
                    </label>
                    <select
                      value={burialFormData.nextOfKin.relationship}
                      onChange={(e) => setBurialFormData({
                        ...burialFormData,
                        nextOfKin: {...burialFormData.nextOfKin, relationship: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                      value={burialFormData.notes}
                      onChange={(e) => setBurialFormData({...burialFormData, notes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                    disabled={isSaving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center disabled:bg-gray-400"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        <span>Assigning...</span>
                      </>
                    ) : (
                      <>
                        <FiTarget className="mr-2" size={16} />
                        <span>Assign Burial</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CemeteryManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    }>
      <CemeteryManagementPageContent />
    </Suspense>
  )
}