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
  FiRefreshCw, FiDownload, FiUpload, FiActivity
} from 'react-icons/fi'

// Management workflow steps
type ManagementStep = 'overview' | 'sections' | 'blocks' | 'plots' | 'gravestones'

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
  gravestone?: Gravestone
}

interface Gravestone {
  id: string
  plotId: string
  material: 'granite' | 'marble' | 'bronze' | 'limestone' | 'sandstone' | 'other'
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged'
  inscription: string
  dateInstalled: string
  manufacturer: string
  height: number
  width: number
  thickness: number
  deceasedInfo: {
    firstName: string
    lastName: string
    dateOfBirth: string
    dateOfDeath: string
    burialDate: string
    gender: 'male' | 'female'
  }
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

export default function CemeteryManagementPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const cemeteryId = searchParams.get('id')
  
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
  const [drawingMode, setDrawingMode] = useState<'section' | 'block' | null>(null)

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

  // Load cemetery data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load cemeteries from localStorage
        const savedCemeteries = localStorage.getItem('cemeteries')
        if (savedCemeteries) {
          const cemeteryList = JSON.parse(savedCemeteries)
          setCemeteries(cemeteryList)

          // If we have a cemetery ID, load that specific cemetery
          if (cemeteryId) {
            const cemetery = cemeteryList.find((c: Cemetery) => c.id === cemeteryId)
            if (cemetery) {
              setSelectedCemetery(cemetery)
              
              // Load sections for this cemetery
              const savedSections = localStorage.getItem(`cemetery_${cemeteryId}_sections`)
              if (savedSections) {
                setSections(JSON.parse(savedSections))
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading cemetery data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [cemeteryId])

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

  const handleSaveSection = async () => {
    if (!selectedCemetery || !sectionFormData.name || currentDrawing.length < 3) return

    setIsSaving(true)
    try {
      const newSection: Section = {
        id: Date.now().toString(),
        cemeteryId: selectedCemetery.id,
        name: sectionFormData.name,
        description: sectionFormData.description,
        color: sectionFormData.color,
        capacity: sectionFormData.capacity,
        boundary: [...currentDrawing],
        blocks: []
      }

      const updatedSections = [...sections, newSection]
      setSections(updatedSections)

      // Save to localStorage
      localStorage.setItem(`cemetery_${selectedCemetery.id}_sections`, JSON.stringify(updatedSections))

      // Reset form and drawing
      setSectionFormData({ name: '', description: '', color: '#3B82F6', capacity: 100 })
      setCurrentDrawing([])
      setDrawingMode(null)
      setIsDrawing(false)

      console.log('Section saved successfully:', newSection)
    } catch (error) {
      console.error('Error saving section:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBlock = async () => {
    if (!selectedCemetery || !blockFormData.name || !blockFormData.sectionId || currentDrawing.length < 3) return

    setIsSaving(true)
    try {
      const newBlock: Block = {
        id: Date.now().toString(),
        sectionId: blockFormData.sectionId,
        name: blockFormData.name,
        blockType: blockFormData.blockType,
        capacity: blockFormData.capacity,
        color: blockFormData.color,
        boundary: [...currentDrawing],
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

      // Save to localStorage
      localStorage.setItem(`cemetery_${selectedCemetery.id}_sections`, JSON.stringify(updatedSections))

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
    } catch (error) {
      console.error('Error saving block:', error)
    } finally {
      setIsSaving(false)
    }
  }

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
                    
                    <button
                      onClick={() => {
                        setSelectedCemetery(cemetery)
                        window.history.pushState({}, '', `/admin/cemetery?id=${cemetery.id}`)
                      }}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FiEdit2 size={16} />
                      <span>Manage Cemetery</span>
                    </button>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
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
              { key: 'gravestones', title: 'Gravestones', icon: FiTarget, color: '#8B5CF6' }
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
              
              <div className="h-96">
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
                        color: block.color
                      }))
                    }))
                  } : null}
                  drawingMode={drawingMode}
                  currentDrawing={currentDrawing}
                  onMapClick={(coords) => {
                    if (isDrawing) {
                      setCurrentDrawing(prev => [...prev, coords])
                    }
                  }}
                  onPolygonClick={(type, id) => {
                    console.log(`Clicked ${type}:`, id)
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
                              <span className="text-xs text-gray-500">{section.blocks.length} blocks</span>
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
                                    <span className="text-xs text-gray-500">{block.plots.length} plots</span>
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
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">Plot Generation</h4>
                      <p className="text-sm text-red-800 mb-3">
                        Generate plots automatically within existing blocks or create individual plots manually.
                      </p>
                      
                      <div className="space-y-3">
                        <button className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm">
                          Auto-Generate All Plots
                        </button>
                        <button className="w-full bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition-colors text-sm">
                          Create Individual Plot
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Plot Statistics</h4>
                      <div className="text-sm text-gray-600">
                        <p>Total plots will be calculated based on blocks created.</p>
                        <p className="mt-1">Implementation coming soon...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gravestones Management */}
              {currentStep === 'gravestones' && (
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <FiTarget size={20} color="#8B5CF6" />
                    <h3 className="text-lg font-semibold text-gray-900">Manage Gravestones</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Gravestone Management</h4>
                      <p className="text-sm text-purple-800 mb-3">
                        Add gravestone information for occupied plots. This information will be searchable by citizens.
                      </p>
                      
                      <div className="space-y-3">
                        <button className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors text-sm">
                          Add New Gravestone
                        </button>
                        <button className="w-full bg-purple-100 text-purple-700 px-4 py-2 rounded hover:bg-purple-200 transition-colors text-sm">
                          Import Gravestone Data
                        </button>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Gravestone Records</h4>
                      <div className="text-sm text-gray-600">
                        <p>Gravestone management will be available after plots are created.</p>
                        <p className="mt-1">Implementation coming soon...</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}