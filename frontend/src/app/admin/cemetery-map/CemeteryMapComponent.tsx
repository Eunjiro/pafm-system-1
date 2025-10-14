"use client"

import { MapContainer, TileLayer, Polygon, useMapEvents, useMap, LayersControl, ScaleControl, ZoomControl } from "react-leaflet"
import type { LatLngExpression } from "leaflet";
import { useRef, useEffect, useState } from "react"
import "leaflet/dist/leaflet.css"

interface CemeterySection {
  id: string
  name: string
  description: string
  coordinates: [number, number][]
  color: string
  blocks: CemeteryBlock[]
}

interface CemeteryBlock {
  id: string
  name: string
  sectionId: string
  coordinates: [number, number][]
  color: string
  plots?: CemeteryPlot[]
}

interface CemeteryPlot {
  id: string
  blockId: string
  plotCode: string
  coordinates: [number, number][]
  status: 'VACANT' | 'RESERVED' | 'OCCUPIED' | 'BLOCKED'
  size?: string
  deceased?: {
    firstName: string
    lastName: string
    dateOfBirth?: string
    dateOfDeath?: string
  }
  gravestone?: {
    material: string
    inscription: string
    condition: string
  }
}

interface CemeteryLayout {
  id: string
  name: string
  description: string
  boundary: [number, number][]
  sections: CemeterySection[]
  plots?: CemeteryPlot[]
}

interface CemeteryMapComponentProps {
  cemeteryLayout: CemeteryLayout | null
  drawingMode: 'cemetery' | 'section' | 'block' | 'plot' | null
  currentDrawing: [number, number][]
  onMapClick: (coords: [number, number]) => void
  onPolygonClick: (type: 'cemetery' | 'section' | 'block' | 'plot', id: string) => void
  showPlots?: boolean
  center?: [number, number]
  zoom?: number
  height?: string
  mapType?: 'satellite' | 'hybrid' | 'roadmap'
}

// Helper function to calculate the center point from a polygon boundary
function calculateCenterFromBoundary(boundary: [number, number][]): [number, number] {
  if (boundary.length === 0) return [14.6760, 121.0437];
  
  const lats = boundary.map(point => point[0]);
  const lngs = boundary.map(point => point[1]);
  
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  
  return [centerLat, centerLng];
}

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (coords: [number, number]) => void }) {
  useMapEvents({
    click: (e: any) => {
      onMapClick([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

export default function CemeteryMapComponent({
  cemeteryLayout,
  drawingMode,
  currentDrawing,
  onMapClick,
  onPolygonClick,
  showPlots = false,
  center,
  zoom = 18,
  height = "h-96",
  mapType = 'satellite'
}: CemeteryMapComponentProps) {
  const [currentMapType, setCurrentMapType] = useState(mapType);
  
  // Calculate center from cemetery boundary if not provided
  const mapCenter: LatLngExpression = center || 
    (cemeteryLayout?.boundary && cemeteryLayout.boundary.length > 2 
      ? calculateCenterFromBoundary(cemeteryLayout.boundary)
      : [14.6760, 121.0437]);
  
  // Google Maps API Key - In production, this should be in environment variables
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  
  // Clean satellite imagery URLs
  const getMapTileUrl = (type: string) => {
    switch (type) {
      case 'satellite': return 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
      case 'hybrid': return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
      case 'roadmap': return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
      default: return 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}' // Default to clean satellite
    }
  }
  
  return (
    <div className="relative">
      {/* Map Type Selector */}
      <div className="absolute top-2 right-2 z-[1000] bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="flex flex-col space-y-1">
          <div className="text-xs font-medium text-gray-700 mb-1">Map Type</div>
          {[
            { key: 'satellite', label: 'Satellite', icon: '�️' },
            { key: 'hybrid', label: 'Hybrid', icon: '�️' },
            { key: 'roadmap', label: 'Streets', icon: '🛣️' }
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => setCurrentMapType(type.key as any)}
              className={`flex items-center space-x-2 px-2 py-1 rounded text-xs transition-colors ${
                currentMapType === type.key 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        minZoom={10}
        maxZoom={22}
        zoomControl={false}
        className={`w-full ${height} rounded-xl border border-gray-200`}
      >
      {/* Clean Satellite Imagery */}
      <TileLayer
        attribution="&copy; Google Satellite"
        url={getMapTileUrl(currentMapType)}
        maxZoom={22}
        minZoom={10}
        tileSize={256}
      />
      
      {/* Cemetery boundary */}
      {cemeteryLayout && Array.isArray(cemeteryLayout.boundary) && cemeteryLayout.boundary.length > 2 && (
        <Polygon
          positions={cemeteryLayout.boundary}
          pathOptions={{ color: '#2563eb', fillOpacity: 0.1, weight: 3 }}
          eventHandlers={{ click: () => onPolygonClick('cemetery', cemeteryLayout.id) }}
        />
      )}
      {/* Sections */}
      {cemeteryLayout?.sections?.map(section => (
        <Polygon
          key={section.id}
          positions={section.coordinates}
          pathOptions={{ color: section.color, fillOpacity: 0.2, weight: 2 }}
          eventHandlers={{ click: () => onPolygonClick('section', section.id) }}
        />
      ))}
      {/* Blocks */}
      {cemeteryLayout?.sections?.flatMap(section => section.blocks.map(block => (
        <Polygon
          key={block.id}
          positions={block.coordinates}
          pathOptions={{ color: '#3b82f6', fillOpacity: 0.3, weight: 1 }}
          eventHandlers={{ click: () => onPolygonClick('block', block.id) }}
        />
      )))}
      
      {/* Plots within blocks */}
      {showPlots && cemeteryLayout?.sections?.flatMap(section => 
        section.blocks.flatMap(block => 
          (block.plots || []).map(plot => {
            let plotColor = '#10b981' // Default vacant - green
            let fillOpacity = 0.4
            
            switch (plot.status) {
              case 'RESERVED':
                plotColor = '#f59e0b' // Yellow
                break
              case 'OCCUPIED':
                plotColor = '#ef4444' // Red
                fillOpacity = 0.6
                break
              case 'BLOCKED':
                plotColor = '#6b7280' // Gray
                fillOpacity = 0.8
                break
            }
            
            return (
              <Polygon
                key={plot.id}
                positions={plot.coordinates}
                pathOptions={{ 
                  color: plotColor, 
                  fillColor: plotColor,
                  fillOpacity, 
                  weight: 1.5,
                  opacity: 0.8
                }}
                eventHandlers={{ 
                  click: () => onPolygonClick('plot', plot.id),
                  mouseover: (e) => {
                    e.target.setStyle({ weight: 3 })
                  },
                  mouseout: (e) => {
                    e.target.setStyle({ weight: 1.5 })
                  }
                }}
              />
            )
          })
        )
      )}

      {/* Cemetery-wide plots (if not in blocks) */}
      {showPlots && cemeteryLayout?.plots?.map(plot => {
        let plotColor = '#10b981' // Default vacant - green
        let fillOpacity = 0.4
        
        switch (plot.status) {
          case 'RESERVED':
            plotColor = '#f59e0b' // Yellow
            break
          case 'OCCUPIED':
            plotColor = '#ef4444' // Red
            fillOpacity = 0.6
            break
          case 'BLOCKED':
            plotColor = '#6b7280' // Gray
            fillOpacity = 0.8
            break
        }
        
        return (
          <Polygon
            key={plot.id}
            positions={plot.coordinates}
            pathOptions={{ 
              color: plotColor, 
              fillColor: plotColor,
              fillOpacity, 
              weight: 1.5,
              opacity: 0.8
            }}
            eventHandlers={{ 
              click: () => onPolygonClick('plot', plot.id),
              mouseover: (e) => {
                e.target.setStyle({ weight: 3 })
              },
              mouseout: (e) => {
                e.target.setStyle({ weight: 1.5 })
              }
            }}
          />
        )
      })}
      
      {/* Current drawing */}
      {drawingMode && currentDrawing.length > 1 && (
        <Polygon
          positions={currentDrawing}
          pathOptions={{ color: '#f59e0b', fillOpacity: 0.1, dashArray: '5,5', weight: 2 }}
        />
      )}
      
      {/* Clean Map Controls */}
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" metric={true} imperial={false} />
      
      <MapController center={mapCenter as [number, number]} zoom={zoom} />
      <MapClickHandler onMapClick={onMapClick} />
    </MapContainer>
    
    {/* Enhanced Zoom Info */}
    <div className="absolute bottom-2 right-2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-gray-600 border border-gray-200">
      <div className="flex items-center space-x-2">
        <span>🔍</span>
        <span>Zoom: Level {zoom} (Max: 22 for detailed mapping)</span>
      </div>
    </div>
  </div>
  )
}