"use client"

import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents, useMap, LayersControl, ScaleControl, ZoomControl } from "react-leaflet"
import L from "leaflet"
import type { LatLngExpression } from "leaflet";
import { useRef, useEffect, useState } from "react"
import "leaflet/dist/leaflet.css"

// Fix for Leaflet default icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

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
  onViewChange?: (center: [number, number], zoom: number) => void
  showPlots?: boolean
  center?: [number, number]
  zoom?: number
  height?: string
  mapType?: 'satellite' | 'hybrid' | 'roadmap'
  focusPlot?: any
  initialView?: {lat: number, lng: number, zoom: number}
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
  const [lastCenter, setLastCenter] = useState<[number, number] | null>(null);
  const [lastZoom, setLastZoom] = useState<number | null>(null);
  
  useEffect(() => {
    if (center && zoom) {
      // Only set view if center or zoom has actually changed significantly
      const centerChanged = !lastCenter || 
        Math.abs(center[0] - lastCenter[0]) > 0.0001 || 
        Math.abs(center[1] - lastCenter[1]) > 0.0001;
      const zoomChanged = !lastZoom || Math.abs(zoom - lastZoom) > 0.5;
      
      if (centerChanged || zoomChanged) {
        map.setView(center, zoom, { animate: false, duration: 0 });
        setLastCenter(center);
        setLastZoom(zoom);
      }
    }
  }, [center, zoom, map, lastCenter, lastZoom]);
  
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

function MapViewTracker({ onViewChange }: { onViewChange?: (center: [number, number], zoom: number) => void }) {
  const map = useMap();
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!onViewChange) return;
    
    const handleViewChange = () => {
      // Throttle updates to prevent excessive re-renders
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      
      const newTimeout = setTimeout(() => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        onViewChange([center.lat, center.lng], zoom);
      }, 150); // Wait 150ms after movement stops
      
      setUpdateTimeout(newTimeout);
    };
    
    map.on('moveend', handleViewChange);
    map.on('zoomend', handleViewChange);
    
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      map.off('moveend', handleViewChange);
      map.off('zoomend', handleViewChange);
    };
  }, [map, onViewChange, updateTimeout]);
  
  return null;
}

export default function CemeteryMapComponent({
  cemeteryLayout,
  drawingMode,
  currentDrawing,
  onMapClick,
  onPolygonClick,
  onViewChange,
  showPlots = false,
  center,
  zoom = 18,
  height = "h-96",
  mapType = 'satellite',
  focusPlot,
  initialView
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
      
      {/* Focused Plot Marker */}
      {focusPlot && focusPlot.coordinates && (
        <Marker
          position={[focusPlot.coordinates.lat, focusPlot.coordinates.lng]}
          icon={L.divIcon({
            className: 'custom-plot-marker',
            html: `
              <div style="
                background: ${focusPlot.status === 'vacant' ? '#10b981' : 
                           focusPlot.status === 'occupied' ? '#ef4444' :
                           focusPlot.status === 'reserved' ? '#f59e0b' : '#6b7280'};
                width: 30px; 
                height: 30px; 
                border-radius: 50%; 
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
                animation: pulse 2s infinite;
              ">
                📍
              </div>
              <style>
                @keyframes pulse {
                  0% { transform: scale(1); }
                  50% { transform: scale(1.1); }
                  100% { transform: scale(1); }
                }
              </style>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-gray-900 mb-2">{focusPlot.plotNumber}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Section:</span>
                  <span className="font-medium">{focusPlot.section}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Block:</span>
                  <span className="font-medium">{focusPlot.block}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    focusPlot.status === 'vacant' ? 'text-green-600' :
                    focusPlot.status === 'occupied' ? 'text-blue-600' :
                    focusPlot.status === 'reserved' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {focusPlot.status.toUpperCase()}
                  </span>
                </div>
                {focusPlot.occupiedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Occupied by:</span>
                    <span className="font-medium">{focusPlot.occupiedBy}</span>
                  </div>
                )}
                {focusPlot.reservedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reserved by:</span>
                    <span className="font-medium">{focusPlot.reservedBy}</span>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Coordinates: {focusPlot.coordinates.lat.toFixed(6)}, {focusPlot.coordinates.lng.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Clean Map Controls */}
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" metric={true} imperial={false} />
      
      <MapController 
        center={initialView ? [initialView.lat, initialView.lng] : mapCenter as [number, number]} 
        zoom={initialView ? initialView.zoom : zoom} 
      />
      <MapClickHandler onMapClick={onMapClick} />
      <MapViewTracker onViewChange={onViewChange} />
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