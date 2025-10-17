'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { 
  MdMap, MdEdit, MdSearch, MdCancel, MdDelete, MdLocationOn, 
  MdTerrain, MdLayers, MdSatellite, MdNavigation, MdZoomIn,
  MdZoomOut, MdMyLocation, MdFullscreen, MdInfo, MdSettings
} from 'react-icons/md'
import { 
  FiPlus, FiMap, FiEye, FiEdit2, FiTrash2, FiSave, 
  FiX, FiCheck, FiMapPin, FiGrid, FiLayers, FiTarget,
  FiRefreshCw, FiDownload, FiUpload, FiActivity, FiNavigation
} from 'react-icons/fi'

// Types for the cemetery creation
type WorkflowStep = 'cemetery_info' | 'boundary' | 'complete'

type Point = [number, number]

interface CemeteryFormData {
  name: string
  description: string
  address: string
  city: string
  postalCode: string
  establishedDate: string
  standardPrice: number
  largePrice: number
  familyPrice: number
  nichePrice: number
  maintenanceFee: number
}

interface CemeteryLayout {
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

const CemeteryMapComponent = dynamic(() => import("./CemeteryMapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-700 font-medium">Loading Interactive Map...</p>
        <p className="text-gray-500 text-sm mt-2">Preparing cemetery management tools...</p>
      </div>
    </div>
  )
})

export default function CemeteryMapPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('cemetery_info')
  const [isSaving, setIsSaving] = useState(false)
  
  // Plot focus parameters from URL
  const [focusPlot, setFocusPlot] = useState<any>(null)
  const [mapInitialView, setMapInitialView] = useState<{lat: number, lng: number, zoom: number} | null>(null)
  
  // Cemetery form data
  const [cemeteryFormData, setCemeteryFormData] = useState<CemeteryFormData>({
    name: '',
    description: '',
    address: '',
    city: 'Novaliches',
    postalCode: '',
    establishedDate: '',
    standardPrice: 15000,
    largePrice: 25000,
    familyPrice: 40000,
    nichePrice: 8000,
    maintenanceFee: 2000
  })
  
  // Drawing states
  const [currentDrawing, setCurrentDrawing] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawingMode, setDrawingMode] = useState<'cemetery' | null>(null)
  
  // Cemetery layout state
  const [cemeteryLayout, setCemeteryLayout] = useState<CemeteryLayout | null>(null)
  const [existingCemeteries, setExistingCemeteries] = useState<CemeteryLayout[]>([])

  // Handle plot focus from URL parameters and localStorage
  useEffect(() => {
    const urlPlotId = searchParams.get('plotId')
    const urlLat = searchParams.get('lat')
    const urlLng = searchParams.get('lng')
    const urlZoom = searchParams.get('zoom')
    const shouldFocus = searchParams.get('focus') === 'true'
    
    // Check localStorage for focus plot data
    const focusPlotFromStorage = localStorage.getItem('focusPlot')
    const sessionFocusPlot = sessionStorage.getItem('mapFocusPlot')
    
    if (shouldFocus && urlPlotId) {
      let plotData = null
      
      // Try to get plot data from various sources
      if (focusPlotFromStorage) {
        try {
          plotData = JSON.parse(focusPlotFromStorage)
        } catch (e) {
          console.warn('Error parsing focus plot from localStorage:', e)
        }
      }
      
      if (!plotData && sessionFocusPlot) {
        try {
          plotData = JSON.parse(sessionFocusPlot)
        } catch (e) {
          console.warn('Error parsing focus plot from sessionStorage:', e)
        }
      }
      
      // Set the focus plot data
      if (plotData && plotData.id === urlPlotId) {
        setFocusPlot(plotData)
        console.log('Focusing on plot:', plotData)
      }
      
      // Set initial map view from URL parameters
      if (urlLat && urlLng) {
        const lat = parseFloat(urlLat)
        const lng = parseFloat(urlLng)
        const zoom = urlZoom ? parseInt(urlZoom, 10) : 18
        
        setMapInitialView({ lat, lng, zoom })
        console.log('Setting map initial view:', { lat, lng, zoom })
      }
    }
    
    // Clean up storage after using the data
    return () => {
      if (shouldFocus) {
        localStorage.removeItem('focusPlot')
        sessionStorage.removeItem('mapFocusPlot')
      }
    }
  }, [searchParams])

  // Calculate polygon area
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

  const handleNextStep = async () => {
    if (currentStep === 'cemetery_info') {
      // Move to boundary drawing
      setCurrentStep('boundary')
      setDrawingMode('cemetery')
      setIsDrawing(true)
      setCurrentDrawing([])
    } else if (currentStep === 'boundary' && currentDrawing.length >= 3) {
      // Save cemetery and complete setup
      await handleSaveCemetery()
      setCurrentStep('complete')
    }
  }

  const handlePreviousStep = () => {
    const steps: WorkflowStep[] = ['cemetery_info', 'boundary', 'complete']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
      setIsDrawing(false)
      setDrawingMode(null)
    }
  }

  const handleSaveCemetery = async () => {
    setIsSaving(true)
    try {
      // Calculate total area if boundary exists
      const totalArea = currentDrawing.length >= 3 ? 
        calculatePolygonArea(currentDrawing) : 0

      const layoutData = {
        name: cemeteryFormData.name,
        description: cemeteryFormData.description,
        address: cemeteryFormData.address,
        city: cemeteryFormData.city,
        postalCode: cemeteryFormData.postalCode,
        establishedDate: cemeteryFormData.establishedDate,
        totalArea: totalArea,
        boundary: currentDrawing,
        standardPrice: cemeteryFormData.standardPrice,
        largePrice: cemeteryFormData.largePrice,
        familyPrice: cemeteryFormData.familyPrice,
        nichePrice: cemeteryFormData.nichePrice,
        maintenanceFee: cemeteryFormData.maintenanceFee,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Create a cemetery layout object
      const newCemetery: CemeteryLayout = {
        id: Date.now().toString(),
        ...layoutData
      }

      setCemeteryLayout(newCemetery)
      
      // Add to existing cemeteries list
      setExistingCemeteries(prev => [...prev, newCemetery])
      
      console.log('Cemetery layout created:', newCemetery)
      
    } catch (error) {
      console.error('Error saving cemetery:', error)
      alert('Error saving cemetery layout. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Load existing cemeteries on mount
  useEffect(() => {
    // In a real app, this would fetch from API
    // For now, we'll use localStorage to persist data
    const savedCemeteries = localStorage.getItem('cemeteries')
    if (savedCemeteries) {
      setExistingCemeteries(JSON.parse(savedCemeteries))
    }
  }, [])

  // Save to localStorage whenever cemeteries change
  useEffect(() => {
    if (existingCemeteries.length > 0) {
      localStorage.setItem('cemeteries', JSON.stringify(existingCemeteries))
    }
  }, [existingCemeteries])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Focused Plot View */}
      {focusPlot && mapInitialView ? (
        <div className="h-screen flex flex-col">
          {/* Plot Focus Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <MdLocationOn size={28} color="#1F2937" />
                  <span>Plot Location: {focusPlot.plotNumber}</span>
                </h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>Section: {focusPlot.section}</span>
                  <span>•</span>
                  <span>Block: {focusPlot.block}</span>
                  <span>•</span>
                  <span>Status: <span className={`font-medium ${
                    focusPlot.status === 'vacant' ? 'text-green-600' :
                    focusPlot.status === 'occupied' ? 'text-blue-600' :
                    focusPlot.status === 'reserved' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{focusPlot.status.toUpperCase()}</span></span>
                  {focusPlot.occupiedBy && (
                    <>
                      <span>•</span>
                      <span>Occupied by: <span className="font-medium">{focusPlot.occupiedBy}</span></span>
                    </>
                  )}
                  {focusPlot.reservedBy && (
                    <>
                      <span>•</span>
                      <span>Reserved by: <span className="font-medium">{focusPlot.reservedBy}</span></span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.history.back()}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiX size={16} />
                  <span>Close</span>
                </button>
                <button
                  onClick={() => window.open(`/admin/cemetery/plots`, '_blank')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiGrid size={16} />
                  <span>Plot Management</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Focused Map */}
          <div className="flex-1">
            <CemeteryMapComponent 
              cemeteryLayout={null}
              drawingMode={null}
              currentDrawing={[]}
              center={[mapInitialView.lat, mapInitialView.lng]}
              zoom={mapInitialView.zoom}
              height="h-full"
              mapType="satellite"
              showPlots={true}
              focusPlot={focusPlot}
              initialView={mapInitialView}
              onMapClick={() => {}}
              onPolygonClick={(type, id) => {
                console.log(`Clicked ${type}:`, id)
              }}
            />
          </div>
        </div>
      ) : (
        <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <MdMap size={32} color="#1F2937" />
              <span>Cemetery Layout Creation</span>
            </h1>
            <p className="text-gray-600 mt-2">Create and define cemetery boundaries and basic information</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isCreatingNew && (
              <button
                onClick={() => setIsCreatingNew(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                <FiPlus size={20} />
                <span>Create New Cemetery</span>
              </button>
            )}
            
            {isCreatingNew && (
              <button
                onClick={() => {
                  setIsCreatingNew(false)
                  setCurrentStep('cemetery_info')
                  setCurrentDrawing([])
                  setDrawingMode(null)
                  setIsDrawing(false)
                }}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <FiX size={16} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        {isCreatingNew && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Progress</h3>
            <div className="flex items-center justify-between">
              {[
                { key: 'cemetery_info', title: 'Cemetery Information', icon: MdInfo },
                { key: 'boundary', title: 'Draw Boundary', icon: MdTerrain },
                { key: 'complete', title: 'Complete Setup', icon: FiCheck }
              ].map((step, index) => {
                const isActive = currentStep === step.key
                const isCompleted = ['cemetery_info', 'boundary'].indexOf(step.key as any) < ['cemetery_info', 'boundary'].indexOf(currentStep as any)
                const IconComponent = step.icon
                
                return (
                  <div key={step.key} className="flex items-center">
                    <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-blue-100 text-blue-800' : 
                      isCompleted ? 'bg-green-100 text-green-800' : 
                      'bg-gray-100 text-gray-500'
                    }`}>
                      <IconComponent size={20} />
                      <span className="font-medium">{step.title}</span>
                    </div>
                    {index < 2 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-400' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cemetery List / Map View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isCreatingNew ? 'Cemetery Boundary Drawing' : 'Existing Cemeteries'}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <MdMap size={20} color="#6B7280" />
                  </div>
                </div>
              </div>
              
              <div className="h-96">
                {isCreatingNew ? (
                  <CemeteryMapComponent 
                    cemeteryLayout={null}
                    drawingMode={drawingMode}
                    currentDrawing={currentDrawing}
                    zoom={18}
                    height="h-96"
                    mapType="satellite"
                    onMapClick={(coords) => {
                      if (isDrawing) {
                        setCurrentDrawing(prev => [...prev, coords])
                      }
                    }}
                    onPolygonClick={(type, id) => {
                      console.log(`Clicked ${type}:`, id)
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    {existingCemeteries.length === 0 ? (
                      <div className="text-center">
                        <div className="flex justify-center mb-4">
                          <MdMap size={48} color="#9CA3AF" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Cemeteries Created</h3>
                        <p className="text-gray-600 mb-4">Create your first cemetery layout to get started.</p>
                        <button
                          onClick={() => setIsCreatingNew(true)}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create Cemetery
                        </button>
                      </div>
                    ) : (
                      <div className="w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cemetery List</h3>
                        <div className="space-y-3">
                          {existingCemeteries.map((cemetery) => (
                            <div key={cemetery.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{cemetery.name}</h4>
                                  <p className="text-sm text-gray-600">{cemetery.address}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Area: {Math.round(cemetery.totalArea).toLocaleString()} m² | 
                                    Created: {new Date(cemetery.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      // Navigate to cemetery management
                                      window.location.href = `/admin/cemetery?id=${cemetery.id}`
                                    }}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                  >
                                    Manage
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Form Panel */}
          {isCreatingNew && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Cemetery Information Form */}
                {currentStep === 'cemetery_info' && (
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <MdInfo size={20} color="#2563EB" />
                      <h3 className="text-lg font-semibold text-gray-900">Cemetery Information</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cemetery Name *</label>
                        <input
                          type="text"
                          value={cemeteryFormData.name}
                          onChange={(e) => setCemeteryFormData({...cemeteryFormData, name: e.target.value})}
                          placeholder="e.g., Bagbag Public Cemetery"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <textarea
                          value={cemeteryFormData.description}
                          onChange={(e) => setCemeteryFormData({...cemeteryFormData, description: e.target.value})}
                          placeholder="Brief description of the cemetery..."
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Complete Address *</label>
                        <input
                          type="text"
                          value={cemeteryFormData.address}
                          onChange={(e) => setCemeteryFormData({...cemeteryFormData, address: e.target.value})}
                          placeholder="Street address..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                          <input
                            type="text"
                            value={cemeteryFormData.city}
                            onChange={(e) => setCemeteryFormData({...cemeteryFormData, city: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                          <input
                            type="text"
                            value={cemeteryFormData.postalCode}
                            onChange={(e) => setCemeteryFormData({...cemeteryFormData, postalCode: e.target.value})}
                            placeholder="1100"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Established Date</label>
                        <input
                          type="date"
                          value={cemeteryFormData.establishedDate}
                          onChange={(e) => setCemeteryFormData({...cemeteryFormData, establishedDate: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      
                      {/* Pricing Configuration */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Plot Pricing Configuration</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Standard Plot (₱)</label>
                            <input
                              type="number"
                              value={cemeteryFormData.standardPrice}
                              onChange={(e) => setCemeteryFormData({...cemeteryFormData, standardPrice: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Large Plot (₱)</label>
                            <input
                              type="number"
                              value={cemeteryFormData.largePrice}
                              onChange={(e) => setCemeteryFormData({...cemeteryFormData, largePrice: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Family Plot (₱)</label>
                            <input
                              type="number"
                              value={cemeteryFormData.familyPrice}
                              onChange={(e) => setCemeteryFormData({...cemeteryFormData, familyPrice: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Niche (₱)</label>
                            <input
                              type="number"
                              value={cemeteryFormData.nichePrice}
                              onChange={(e) => setCemeteryFormData({...cemeteryFormData, nichePrice: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Annual Maintenance Fee (₱)</label>
                          <input
                            type="number"
                            value={cemeteryFormData.maintenanceFee}
                            onChange={(e) => setCemeteryFormData({...cemeteryFormData, maintenanceFee: parseInt(e.target.value) || 0})}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                      <button
                        onClick={handleNextStep}
                        disabled={!cemeteryFormData.name || !cemeteryFormData.description || !cemeteryFormData.address}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>Next: Draw Boundary</span>
                        <FiTarget size={16} />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Boundary Drawing Step */}
                {currentStep === 'boundary' && (
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <MdTerrain size={20} color="#059669" />
                      <h3 className="text-lg font-semibold text-gray-900">Draw Cemetery Boundary</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Click on the map to add boundary points</li>
                          <li>• Add at least 3 points to form a valid boundary</li>
                          <li>• Connect back to the first point to close the area</li>
                          <li>• Use satellite view for better accuracy</li>
                        </ul>
                      </div>
                      
                      {currentDrawing.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">Boundary Progress</h4>
                          <div className="text-sm text-green-800">
                            <p>Points added: {currentDrawing.length}</p>
                            {currentDrawing.length >= 3 && (
                              <p className="font-medium">✓ Valid boundary created</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
                      <button
                        onClick={handlePreviousStep}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <FiX size={16} />
                        <span>Back</span>
                      </button>
                      
                      <button
                        onClick={handleNextStep}
                        disabled={currentDrawing.length < 3 || isSaving}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <FiSave size={16} />
                            <span>Complete Cemetery Setup</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Complete Setup Step */}
                {currentStep === 'complete' && (
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <FiCheck size={20} color="#059669" />
                      <h3 className="text-lg font-semibold text-gray-900">Cemetery Created Successfully!</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Cemetery Summary */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-3">Cemetery Information</h4>
                        {cemeteryLayout && (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">Name:</span>
                              <span>{cemeteryLayout.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Total Area:</span>
                              <span>{Math.round(cemeteryLayout.totalArea).toLocaleString()} m²</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Address:</span>
                              <span className="text-right">{cemeteryLayout.address}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Established:</span>
                              <span>{cemeteryLayout.establishedDate || 'Not specified'}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Success Message */}
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl">
                        <div className="flex items-center space-x-3 mb-3">
                          <FiCheck size={24} />
                          <h4 className="text-lg font-semibold">Setup Complete!</h4>
                        </div>
                        <p className="text-green-100 mb-4">
                          Your cemetery layout has been successfully created with boundary information. 
                          You can now proceed to manage sections, blocks, plots, and gravestones.
                        </p>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              if (cemeteryLayout) {
                                window.location.href = `/admin/cemetery?id=${cemeteryLayout.id}`
                              }
                            }}
                            className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                          >
                            <FiNavigation size={16} />
                            <span className="ml-2">Manage Cemetery</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setIsCreatingNew(false)
                              setCurrentStep('cemetery_info')
                              setCemeteryLayout(null)
                              setCurrentDrawing([])
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium border border-green-300 hover:bg-green-700 transition-colors"
                          >
                            <FiPlus size={16} />
                            <span className="ml-2">Create Another</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center pt-6 mt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setIsCreatingNew(false)
                          setCurrentStep('cemetery_info')
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiMap size={16} />
                        <span>View All Cemeteries</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}