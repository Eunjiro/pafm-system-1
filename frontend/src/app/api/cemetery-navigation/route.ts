import { NextRequest, NextResponse } from 'next/server'

// OpenRouteService API endpoint for directions
const ORS_API_KEY = process.env.OPENROUTESERVICE_API_KEY || 'your-ors-api-key-here'
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { start, end, profile = 'foot-walking' } = body
    
    if (!start || !end) {
      return NextResponse.json(
        { success: false, error: 'Start and end coordinates are required' },
        { status: 400 }
      )
    }
    
    // Validate coordinates format [longitude, latitude]
    if (!Array.isArray(start) || start.length !== 2 || !Array.isArray(end) || end.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Coordinates must be arrays of [longitude, latitude]' },
        { status: 400 }
      )
    }
    
    // If no API key is configured, return a mock route
    if (!ORS_API_KEY || ORS_API_KEY === 'your-ors-api-key-here') {
      const mockRoute = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              summary: {
                distance: 150.5,
                duration: 108.2
              },
              way_points: [0, 2]
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                start,
                [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2], // midpoint
                end
              ]
            }
          }
        ]
      }
      
      return NextResponse.json({
        success: true,
        data: mockRoute,
        message: 'Mock route generated (configure ORS_API_KEY for real routing)'
      })
    }
    
    // Make request to OpenRouteService
    const response = await fetch(`${ORS_BASE_URL}/directions/${profile}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ORS_API_KEY
      },
      body: JSON.stringify({
        coordinates: [start, end],
        format: 'geojson',
        instructions: true,
        language: 'en'
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouteService error:', errorText)
      return NextResponse.json(
        { success: false, error: 'Failed to get directions from OpenRouteService' },
        { status: response.status }
      )
    }
    
    const routeData = await response.json()
    
    return NextResponse.json({
      success: true,
      data: routeData
    })
  } catch (error) {
    console.error('Error getting directions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get directions' },
      { status: 500 }
    )
  }
}

// GET: Get navigation information for a specific plot
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const plotId = searchParams.get('plotId')
    const userLat = searchParams.get('lat')
    const userLng = searchParams.get('lng')
    
    if (!plotId) {
      return NextResponse.json(
        { success: false, error: 'Plot ID is required' },
        { status: 400 }
      )
    }
    
    // Mock plot data (in real implementation, fetch from database)
    const mockPlots = [
      {
        id: "1",
        name: "Section A - Block 1 - Lot 001",
        coordinates: [14.6760, 121.0437]
      },
      {
        id: "2",
        name: "Section A - Block 1 - Lot 002",
        coordinates: [14.6761, 121.0437]
      },
      {
        id: "3",
        name: "Section A - Block 1 - Lot 003",
        coordinates: [14.6762, 121.0437]
      }
    ]
    
    const plot = mockPlots.find(p => p.id === plotId)
    if (!plot) {
      return NextResponse.json(
        { success: false, error: 'Plot not found' },
        { status: 404 }
      )
    }
    
    const result: any = {
      success: true,
      data: {
        plot: {
          id: plot.id,
          name: plot.name,
          coordinates: plot.coordinates
        },
        cemetery: {
          name: 'Bagbag Cemetery',
          address: 'Bagbag, Quezon City, Metro Manila, Philippines',
          coordinates: [14.6760, 121.0437]
        }
      }
    }
    
    // If user location is provided, calculate distance and get directions
    if (userLat && userLng) {
      const userCoords = [parseFloat(userLng), parseFloat(userLat)]
      const plotCoords = [plot.coordinates[1], plot.coordinates[0]] // Convert to [lng, lat]
      
      // Calculate straight-line distance
      const distance = calculateDistance(
        parseFloat(userLat), parseFloat(userLng),
        plot.coordinates[0], plot.coordinates[1]
      )
      
      result.data.navigation = {
        distance: Math.round(distance),
        estimatedWalkingTime: Math.round(distance * 12), // ~12 seconds per meter walking
        userLocation: userCoords,
        destination: plotCoords
      }
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting navigation info:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get navigation information' },
      { status: 500 }
    )
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  
  return R * c
}