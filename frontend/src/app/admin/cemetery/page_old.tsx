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
  status: 'available' | 'reserved' | 'occupied'
  accessibility: boolean
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
  deceasedName: string
  dateOfBirth: string
  dateOfDeath: string
  dateOfBurial: string
  gender: 'male' | 'female'
}

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
  sections: Section[]
}

export default function CemeteryManagementPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const cemeteryId = searchParams.get('id')
  
  const [cemetery, setCemetery] = useState<Cemetery | null>(null)
  const [currentStep, setCurrentStep] = useState<ManagementStep>('overview')
  const [isLoading, setIsLoading] = useState(true)
  
  // Form states
  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    color: '#8B5CF6',
    capacity: 100
  })
  
  const [blockForm, setBlockForm] = useState({
    name: '',
    sectionId: '',
    blockType: 'standard' as const,
    capacity: 50,
    color: '#3B82F6'
  })
  
  const [plotForm, setPlotForm] = useState({
    length: 3,
    width: 2,
    depth: 1.8,
    baseFee: 15000,
    maintenanceFee: 2000,
    size: 'standard' as const,
    orientation: 'north' as const,
    accessibility: false
  })

  // Load cemetery data
  useEffect(() => {
    if (cemeteryId) {
      // Load from localStorage for demo
      const savedCemeteries = localStorage.getItem('cemeteries')
      if (savedCemeteries) {
        const cemeteries = JSON.parse(savedCemeteries)
        const foundCemetery = cemeteries.find((c: Cemetery) => c.id === cemeteryId)
        if (foundCemetery) {
          // Initialize sections array if not exists
          if (!foundCemetery.sections) {
            foundCemetery.sections = []
          }
          setCemetery(foundCemetery)
        }
      }
    }
    setIsLoading(false)
  }, [cemeteryId])

  // Save cemetery data
  const saveCemetery = (updatedCemetery: Cemetery) => {
    const savedCemeteries = localStorage.getItem('cemeteries')
    if (savedCemeteries) {
      const cemeteries = JSON.parse(savedCemeteries)
      const updatedCemeteries = cemeteries.map((c: Cemetery) => 
        c.id === updatedCemetery.id ? updatedCemetery : c
      )
      localStorage.setItem('cemeteries', JSON.stringify(updatedCemeteries))
      setCemetery(updatedCemetery)
    }
  }

  // Generate unique ID
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

  // Add Section
  const handleAddSection = () => {
    if (!cemetery || !sectionForm.name) return
    
    const newSection: Section = {
      id: generateId(),
      name: sectionForm.name,
      description: sectionForm.description,
      color: sectionForm.color,
      capacity: sectionForm.capacity,
      boundary: [], // Will be drawn on map
      blocks: []
    }
    
    const updatedCemetery = {
      ...cemetery,
      sections: [...cemetery.sections, newSection]
    }
    
    saveCemetery(updatedCemetery)
    setSectionForm({ name: '', description: '', color: '#8B5CF6', capacity: 100 })
  }

  // Add Block
  const handleAddBlock = () => {
    if (!cemetery || !blockForm.name || !blockForm.sectionId) return
    
    const newBlock: Block = {
      id: generateId(),
      name: blockForm.name,
      sectionId: blockForm.sectionId,
      blockType: blockForm.blockType,
      capacity: blockForm.capacity,
      color: blockForm.color,
      boundary: [], // Will be drawn on map
      plots: []
    }
    
    const updatedCemetery = {
      ...cemetery,
      sections: cemetery.sections.map(section => 
        section.id === blockForm.sectionId 
          ? { ...section, blocks: [...section.blocks, newBlock] }
          : section
      )
    }
    
    saveCemetery(updatedCemetery)
    setBlockForm({ name: '', sectionId: '', blockType: 'standard', capacity: 50, color: '#3B82F6' })
  }

  // Generate Plots for Block
  const handleGeneratePlotsForBlock = async (blockId: string) => {
    if (!cemetery) return
    
    const section = cemetery.sections.find(s => s.blocks.some(b => b.id === blockId))
    const block = section?.blocks.find(b => b.id === blockId)
    
    if (!block) return
    
    try {
      // Generate plots based on block capacity
      const plots: Plot[] = []
      
      for (let i = 1; i <= block.capacity; i++) {
        const plot: Plot = {
          id: generateId(),
          plotNumber: `${block.name}-${i.toString().padStart(3, '0')}`,
          blockId: block.id,
          coordinates: [], // Will be calculated based on block boundary
          size: plotForm.size,
          length: plotForm.length,
          width: plotForm.width,
          depth: plotForm.depth,
          baseFee: plotForm.baseFee,
          maintenanceFee: plotForm.maintenanceFee,
          orientation: plotForm.orientation,
          status: 'available',
          accessibility: plotForm.accessibility
        }
        plots.push(plot)
      }
      
      // Update cemetery with new plots
      const updatedCemetery = {
        ...cemetery,
        sections: cemetery.sections.map(s => ({
          ...s,
          blocks: s.blocks.map(b => 
            b.id === blockId ? { ...b, plots } : b
          )
        }))
      }
      
      saveCemetery(updatedCemetery)
      
      // Also create plots in backend
      for (const plot of plots) {
        try {
          const response = await fetch('/api/cemetery-plots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              section: section?.name,
              block: block.name,
              plot_number: plot.plotNumber,
              position_x: 0, // Will be updated when coordinates are set
              position_y: 0,
              size_width: plot.width,
              size_length: plot.length,
              status: plot.status,
              plot_type: plot.size
            })
          })
          
          if (!response.ok) {
            console.error('Failed to create plot in backend:', plot.plotNumber)
          }
        } catch (error) {
          console.error('Error creating plot:', error)
        }
      }
      
      alert(`Successfully generated ${plots.length} plots for ${block.name}`)
      
    } catch (error) {
      console.error('Error generating plots:', error)
      alert('Error generating plots. Please try again.')
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

  if (!cemetery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <MdMap size={64} color="#9CA3AF" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Cemetery Not Found</h1>
          <p className="text-gray-600 mb-4">The cemetery you're looking for doesn't exist.</p>
          <button
            onClick={() => window.location.href = '/admin/cemetery-map'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Cemetery List
          </button>
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <MdMap size={32} color="#1F2937" />
              <span>Cemetery Management</span>
            </h1>
            <p className="text-gray-600 mt-2">{cemetery.name} - {cemetery.address}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.href = '/admin/cemetery-map'}
              className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <FiX size={16} />
              <span>Back to List</span>
            </button>
          </div>
        </div>

        {/* Cemetery Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(cemetery.totalArea).toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Area (m²)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{cemetery.sections.length}</div>
              <div className="text-sm text-gray-600">Sections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {cemetery.sections.reduce((total, s) => total + s.blocks.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Blocks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {cemetery.sections.reduce((total, s) => 
                  total + s.blocks.reduce((blockTotal, b) => 
                    blockTotal + (b.plots?.length || 0), 0), 0
                )}
              </div>
              <div className="text-sm text-gray-600">Plots</div>
            </div>
          </div>
        </div>

        {/* Management Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            {[
              { key: 'overview', label: 'Overview', icon: FiEye },
              { key: 'sections', label: 'Sections', icon: MdLayers },
              { key: 'blocks', label: 'Blocks', icon: FiGrid },
              { key: 'plots', label: 'Plots', icon: FiMapPin },
              { key: 'gravestones', label: 'Gravestones', icon: FiTarget }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setCurrentStep(tab.key as ManagementStep)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentStep === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-blue-50'
                  }`}
                >
                  <IconComponent size={20} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Overview Tab */}
              {currentStep === 'overview' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Cemetery Overview</h2>
                  
                  {cemetery.sections.length === 0 ? (
                    <div className="text-center py-12">
                      <MdLayers size={48} color="#9CA3AF" />
                      <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">No Sections Created</h3>
                      <p className="text-gray-600 mb-4">Start by creating sections to organize your cemetery.</p>
                      <button
                        onClick={() => setCurrentStep('sections')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create First Section
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cemetery.sections.map((section) => (
                        <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded" 
                                style={{ backgroundColor: section.color }}
                              ></div>
                              <h4 className="font-semibold text-gray-900">{section.name}</h4>
                            </div>
                            <div className="text-sm text-gray-500">
                              {section.blocks.length} blocks
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{section.description}</p>
                          
                          {section.blocks.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {section.blocks.map((block) => (
                                <div key={block.id} className="bg-gray-50 p-2 rounded text-sm">
                                  <div className="font-medium">{block.name}</div>
                                  <div className="text-gray-500">{block.plots?.length || 0} plots</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sections Tab */}
              {currentStep === 'sections' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Section Management</h2>
                  
                  <div className="space-y-4">
                    {cemetery.sections.map((section) => (
                      <div key={section.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: section.color }}
                            ></div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{section.name}</h4>
                              <p className="text-gray-600 text-sm">{section.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              Capacity: {section.capacity} | Blocks: {section.blocks.length}
                            </span>
                            <button className="text-blue-600 hover:text-blue-700">
                              <FiEdit2 size={16} />
                            </button>
                            <button className="text-red-600 hover:text-red-700">
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {cemetery.sections.length === 0 && (
                      <div className="text-center py-8">
                        <MdLayers size={48} color="#9CA3AF" />
                        <p className="text-gray-500 mt-2">No sections created yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Blocks Tab */}
              {currentStep === 'blocks' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Block Management</h2>
                  
                  <div className="space-y-6">
                    {cemetery.sections.map((section) => (
                      <div key={section.id}>
                        <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded" 
                            style={{ backgroundColor: section.color }}
                          ></div>
                          <span>{section.name}</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {section.blocks.map((block) => (
                            <div key={block.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{block.name}</h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  block.blockType === 'standard' ? 'bg-blue-100 text-blue-800' :
                                  block.blockType === 'family' ? 'bg-green-100 text-green-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}>
                                  {block.blockType}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>Capacity: {block.capacity}</div>
                                <div>Plots: {block.plots?.length || 0}</div>
                              </div>
                              
                              <div className="mt-3 flex items-center justify-between">
                                <button
                                  onClick={() => handleGeneratePlotsForBlock(block.id)}
                                  disabled={block.plots && block.plots.length > 0}
                                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                  {block.plots && block.plots.length > 0 ? 'Plots Created' : 'Generate Plots'}
                                </button>
                                <div className="flex space-x-1">
                                  <button className="text-blue-600 hover:text-blue-700">
                                    <FiEdit2 size={14} />
                                  </button>
                                  <button className="text-red-600 hover:text-red-700">
                                    <FiTrash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {section.blocks.length === 0 && (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <FiGrid size={32} color="#9CA3AF" />
                            <p className="text-gray-500 mt-2 text-sm">No blocks in this section yet.</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plots Tab */}
              {currentStep === 'plots' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Plot Management</h2>
                  
                  <div className="space-y-6">
                    {cemetery.sections.map((section) => 
                      section.blocks.map((block) => (
                        block.plots && block.plots.length > 0 && (
                          <div key={block.id}>
                            <h3 className="font-medium text-gray-900 mb-3">
                              {section.name} - {block.name}
                            </h3>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {block.plots.map((plot) => (
                                <div 
                                  key={plot.id} 
                                  className={`p-2 rounded text-xs border ${
                                    plot.status === 'available' ? 'bg-green-50 border-green-200' :
                                    plot.status === 'reserved' ? 'bg-yellow-50 border-yellow-200' :
                                    'bg-red-50 border-red-200'
                                  }`}
                                >
                                  <div className="font-medium">{plot.plotNumber}</div>
                                  <div className="text-gray-600">{plot.size}</div>
                                  <div className={`text-xs mt-1 ${
                                    plot.status === 'available' ? 'text-green-600' :
                                    plot.status === 'reserved' ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {plot.status}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Gravestones Tab */}
              {currentStep === 'gravestones' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Gravestone Management</h2>
                  
                  <div className="text-center py-12">
                    <FiTarget size={48} color="#9CA3AF" />
                    <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Gravestone Management</h3>
                    <p className="text-gray-600 mb-4">Manage gravestone information for occupied plots.</p>
                    <p className="text-sm text-gray-500">Feature coming soon...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Forms */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Section Form */}
              {currentStep === 'sections' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Section</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section Name</label>
                      <input
                        type="text"
                        value={sectionForm.name}
                        onChange={(e) => setSectionForm({...sectionForm, name: e.target.value})}
                        placeholder="e.g., Section A"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={sectionForm.description}
                        onChange={(e) => setSectionForm({...sectionForm, description: e.target.value})}
                        placeholder="Brief description..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                      <input
                        type="color"
                        value={sectionForm.color}
                        onChange={(e) => setSectionForm({...sectionForm, color: e.target.value})}
                        className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                      <input
                        type="number"
                        value={sectionForm.capacity}
                        onChange={(e) => setSectionForm({...sectionForm, capacity: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <button
                      onClick={handleAddSection}
                      disabled={!sectionForm.name}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Section
                    </button>
                  </div>
                </div>
              )}

              {/* Block Form */}
              {currentStep === 'blocks' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Block</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Block Name</label>
                      <input
                        type="text"
                        value={blockForm.name}
                        onChange={(e) => setBlockForm({...blockForm, name: e.target.value})}
                        placeholder="e.g., Block A-1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                      <select
                        value={blockForm.sectionId}
                        onChange={(e) => setBlockForm({...blockForm, sectionId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a section</option>
                        {cemetery.sections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Block Type</label>
                      <select
                        value={blockForm.blockType}
                        onChange={(e) => setBlockForm({...blockForm, blockType: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="standard">Standard</option>
                        <option value="family">Family</option>
                        <option value="niche">Niche</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                      <input
                        type="number"
                        value={blockForm.capacity}
                        onChange={(e) => setBlockForm({...blockForm, capacity: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <button
                      onClick={handleAddBlock}
                      disabled={!blockForm.name || !blockForm.sectionId}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Block
                    </button>
                  </div>
                </div>
              )}

              {/* Plot Generation Form */}
              {currentStep === 'plots' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Plot Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Dimensions (m)</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Length</label>
                          <input
                            type="number"
                            step="0.1"
                            value={plotForm.length}
                            onChange={(e) => setPlotForm({...plotForm, length: parseFloat(e.target.value) || 0})}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Width</label>
                          <input
                            type="number"
                            step="0.1"
                            value={plotForm.width}
                            onChange={(e) => setPlotForm({...plotForm, width: parseFloat(e.target.value) || 0})}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Depth</label>
                          <input
                            type="number"
                            step="0.1"
                            value={plotForm.depth}
                            onChange={(e) => setPlotForm({...plotForm, depth: parseFloat(e.target.value) || 0})}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Size Type</label>
                      <select
                        value={plotForm.size}
                        onChange={(e) => setPlotForm({...plotForm, size: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="standard">Standard</option>
                        <option value="large">Large</option>
                        <option value="family">Family</option>
                        <option value="niche">Niche</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Pricing (₱)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Base Fee</label>
                          <input
                            type="number"
                            value={plotForm.baseFee}
                            onChange={(e) => setPlotForm({...plotForm, baseFee: parseInt(e.target.value) || 0})}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Maintenance</label>
                          <input
                            type="number"
                            value={plotForm.maintenanceFee}
                            onChange={(e) => setPlotForm({...plotForm, maintenanceFee: parseInt(e.target.value) || 0})}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        These settings will be used when generating plots for blocks. 
                        You can generate plots for each block individually from the Blocks tab.
                      </p>
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