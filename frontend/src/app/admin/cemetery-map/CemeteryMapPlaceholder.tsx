"use client"

import { useEffect, useState } from "react"

interface Plot {
  id: string
  name: string
  section: string
  block: string
  lot: string
  coordinates: [number, number]
  status: 'available' | 'occupied' | 'reserved' | 'unavailable'
  size: string
  occupant?: string
  dateOccupied?: string
  notes?: string
}

interface CemeteryMapComponentProps {
  plots: Plot[]
  onMapClick: (coords: [number, number]) => void
  onPlotClick: (plot: Plot) => void
  isAddingMode: boolean
}

export default function CemeteryMapComponent({ plots, onMapClick, onPlotClick, isAddingMode }: CemeteryMapComponentProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-2 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }

  // Temporary placeholder until we can resolve the Leaflet import issues
  return (
    <div className="w-full h-full relative bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cemetery Map</h3>
          <p className="text-gray-600 mb-4">Interactive map loading...</p>
          <p className="text-sm text-blue-600">Bagbag Cemetery, Quezon City</p>
        </div>

        {isAddingMode && (
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg inline-block">
            Map in adding mode - Click to add plots
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm">Available: {plots.filter(p => p.status === 'available').length}</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm">Occupied: {plots.filter(p => p.status === 'occupied').length}</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Reserved: {plots.filter(p => p.status === 'reserved').length}</span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
              <span className="text-sm">Unavailable: {plots.filter(p => p.status === 'unavailable').length}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-gray-500">
            Total Plots: {plots.length}
          </p>
        </div>
      </div>
    </div>
  )
}