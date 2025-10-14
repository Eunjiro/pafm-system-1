"use client"

import { MapContainer, TileLayer, Polygon, useMapEvents } from "react-leaflet"
import type { LatLngExpression } from "leaflet";
import { useRef } from "react"
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
}

interface CemeteryLayout {
  id: string
  name: string
  description: string
  boundary: [number, number][]
  sections: CemeterySection[]
}

interface CemeteryMapComponentProps {
  cemeteryLayout: CemeteryLayout | null
  drawingMode: 'cemetery' | 'section' | 'block' | null
  currentDrawing: [number, number][]
  onMapClick: (coords: [number, number]) => void
  onPolygonClick: (type: 'cemetery' | 'section' | 'block', id: string) => void
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
  onPolygonClick
}: CemeteryMapComponentProps) {
  const center: LatLngExpression = [14.6760, 121.0437];
  return (
    <MapContainer center={center} zoom={18} className="w-full h-96 rounded-xl border border-gray-200">
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
      {/* Current drawing */}
      {drawingMode && currentDrawing.length > 1 && (
        <Polygon
          positions={currentDrawing}
          pathOptions={{ color: '#f59e0b', fillOpacity: 0.1, dashArray: '5,5', weight: 2 }}
        />
      )}
      <MapClickHandler onMapClick={onMapClick} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  )
}