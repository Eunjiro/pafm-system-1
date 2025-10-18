import { NextRequest, NextResponse } from 'next/server';

// OpenRouteService API integration for AI-powered navigation
export async function POST(request: NextRequest) {
  try {
    console.log('=== OpenRouteService Navigation API Called ===');
    
    const body = await request.json();
    const { start, end, profile = 'driving-car' } = body;

    if (!start || !end) {
      return NextResponse.json({
        success: false,
        error: 'Start and end coordinates are required'
      }, { status: 400 });
    }

    console.log('Navigation request:', { start, end, profile });

    // OpenRouteService API key - In production, this should be in environment variables
    const ORS_API_KEY = process.env.OPENROUTE_API_KEY || '5b3ce3597851110001cf6248a1d8a20e12c74bd89dd3f46c9a8b3cb2';

    // Calculate basic distance and duration for fallback
    const calculateDistance = (start: [number, number], end: [number, number]) => {
      const R = 6371; // Earth's radius in kilometers
      const dLat = (end[1] - start[1]) * Math.PI / 180;
      const dLon = (end[0] - start[0]) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(start[1] * Math.PI / 180) * Math.cos(end[1] * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in kilometers
    };

    const distance = calculateDistance(start, end);
    const estimatedDuration = distance * 120; // Estimate 2 minutes per km in city traffic

    try {
      // Try OpenRouteService first
      const orsUrl = 'https://api.openrouteservice.org/v2/directions/' + profile;
      
      const orsResponse = await fetch(orsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ORS_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          coordinates: [start, end],
          format: 'json',
          instructions: true,
          geometry: true
        })
      });

      if (orsResponse.ok) {
        const orsData = await orsResponse.json();
        console.log('OpenRouteService response received successfully');

        if (orsData.routes && orsData.routes.length > 0) {
          const route = orsData.routes[0];
          const segments = route.segments || [];
          
          // Process turn-by-turn instructions
          const instructions = [];
          for (const segment of segments) {
            if (segment.steps) {
              for (const step of segment.steps) {
                instructions.push({
                  instruction: step.instruction,
                  distance: step.distance,
                  duration: step.duration,
                  type: step.type,
                  name: step.name || '',
                  way_points: step.way_points
                });
              }
            }
          }

          // Format response for frontend
          const navigationData = {
            success: true,
            route: {
              geometry: route.geometry,
              bbox: route.bbox,
              distance: route.summary.distance, // meters
              duration: route.summary.duration, // seconds
              instructions: instructions,
              segments: segments.map((segment: any) => ({
                distance: segment.distance,
                duration: segment.duration,
                steps: segment.steps?.map((step: any) => ({
                  distance: step.distance,
                  duration: step.duration,
                  instruction: step.instruction,
                  name: step.name || '',
                  type: step.type
                })) || []
              }))
            },
            metadata: {
              profile: profile,
              start_coordinates: start,
              end_coordinates: end,
              generated_at: new Date().toISOString(),
              source: 'openrouteservice'
            }
          };

          console.log(`Navigation route calculated: ${(route.summary.distance / 1000).toFixed(2)}km, ${Math.round(route.summary.duration / 60)}min`);

          return NextResponse.json(navigationData);
        }
      } else {
        console.warn('OpenRouteService failed, using fallback navigation');
      }
    } catch (orsError) {
      console.warn('OpenRouteService error, using Google Maps fallback:', orsError);
    }

    // Fallback: Use Google Maps integration
    console.log('Using Google Maps navigation fallback');

    // Create Google Maps navigation response
    const googleMapsNavigation = {
      success: true,
      route: {
        geometry: null, // No detailed geometry available
        bbox: [Math.min(start[0], end[0]), Math.min(start[1], end[1]), Math.max(start[0], end[0]), Math.max(start[1], end[1])],
        distance: distance * 1000, // Convert to meters
        duration: estimatedDuration, // seconds
        instructions: [], // No step-by-step instructions, will use Google Maps
        segments: [],
        useGoogleMaps: true, // Flag to indicate Google Maps should be used
        googleMapsUrl: `https://www.google.com/maps/dir/${start[1]},${start[0]}/${end[1]},${end[0]}`,
        googleMapsAppUrl: `comgooglemaps://?saddr=${start[1]},${start[0]}&daddr=${end[1]},${end[0]}&directionsmode=driving`
      },
      metadata: {
        profile: profile,
        start_coordinates: start,
        end_coordinates: end,
        generated_at: new Date().toISOString(),
        source: 'google-maps-fallback'
      }
    };

    console.log(`Google Maps fallback navigation: ${distance.toFixed(2)}km, estimated ${Math.round(estimatedDuration / 60)}min`);

    return NextResponse.json(googleMapsNavigation);

  } catch (error) {
    console.error('Navigation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate navigation route',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET method for testing navigation service
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startLat = searchParams.get('start_lat');
  const startLng = searchParams.get('start_lng');
  const endLat = searchParams.get('end_lat');
  const endLng = searchParams.get('end_lng');
  
  if (!startLat || !startLng || !endLat || !endLng) {
    return NextResponse.json({
      success: false,
      error: 'Required parameters: start_lat, start_lng, end_lat, end_lng'
    }, { status: 400 });
  }

  // Convert GET parameters to POST format and call POST method
  const mockRequest = {
    json: async () => ({
      start: [parseFloat(startLng), parseFloat(startLat)],
      end: [parseFloat(endLng), parseFloat(endLat)],
      profile: searchParams.get('profile') || 'driving-car'
    })
  } as NextRequest;

  return POST(mockRequest);
}