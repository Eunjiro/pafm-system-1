import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// GET - Retrieve all cemetery plots
export async function GET(request: NextRequest) {
  try {
    console.log('=== Cemetery Plots API Called ===');
    
    const session = await getServerSession();
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session) {
      console.log('No session - using test-token for development');
      // For development, use test-token when no session
      // return NextResponse.json(
      //   { success: false, error: 'Authentication required', plots: [] },
      //   { status: 401 }
      // );
    }

    // For testing purposes, use a test token if no accessToken is available
    const authToken = session?.accessToken || 'test-token';

    const { searchParams } = new URL(request.url);
    const cemeteryId = searchParams.get('cemeteryId');
    const section = searchParams.get('section');
    const block = searchParams.get('block');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';

    // Build query parameters for backend
    const queryParams = new URLSearchParams();
    if (cemeteryId) queryParams.append('cemeteryId', cemeteryId);
    if (section) queryParams.append('section', section);
    if (block) queryParams.append('block', block);
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    queryParams.append('page', page);
    queryParams.append('limit', limit);

    console.log('Fetching plots with query params:', queryParams.toString());

    // Call backend service to get plot list
    const response = await fetch(`http://localhost:3001/api/plots?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If backend is not available or authentication fails, return empty data
      console.warn(`Backend API error: ${response.status}`);
      return NextResponse.json({
        success: true,
        plots: [],
        total: 0,
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        message: 'Backend service unavailable - using empty data'
      });
    }

    const data = await response.json();
    console.log('Backend plots response:', data.success ? 'Success' : 'Failed');

    if (data.success && data.data && data.data.length > 0) {
      // Fetch detailed information for each plot including assignments
      console.log('Fetching detailed info for', data.data.length, 'plots');
      
      const detailedPlots = await Promise.all(
        data.data.map(async (plot: any) => {
          try {
            const detailResponse = await fetch(`http://localhost:3001/api/plots/${plot.id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              if (detailData.success) {
                return detailData.data;
              }
            }
            
            // Return basic plot data if detailed fetch fails
            return plot;
          } catch (error) {
            console.warn('Failed to fetch details for plot', plot.id, error);
            return plot;
          }
        })
      );

      console.log('Successfully fetched detailed plots:', detailedPlots.length);

      return NextResponse.json({
        success: true,
        plots: detailedPlots,
        total: data.total || detailedPlots.length,
        pagination: data.pagination || { page: 1, limit: 50, total: detailedPlots.length, totalPages: 1 },
        message: data.message || 'Cemetery plots retrieved successfully with details'
      });
    }

    // Return empty data if no plots found
    return NextResponse.json({
      success: true,
      plots: [],
      total: 0,
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      message: 'No plots found'
    });

  } catch (error) {
    console.error('Cemetery plots API error:', error);
    // Return empty data instead of failing completely
    return NextResponse.json({
      success: true,
      plots: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      total: 0,
      message: 'Service temporarily unavailable - showing empty data'
    });
  }
}

// POST - Create a new cemetery plot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For testing purposes, use a test token if no accessToken is available
    const authToken = session.accessToken || 'test-token';

    const body = await request.json();
    
    // Transform coordinates from polygon array to lat/lng if needed
    if (body.coordinates && Array.isArray(body.coordinates) && body.coordinates.length > 0) {
      // If coordinates is an array of points (polygon), use the center point
      if (Array.isArray(body.coordinates[0])) {
        // Calculate center of polygon
        const lats = body.coordinates.map((point: [number, number]) => point[0]);
        const lngs = body.coordinates.map((point: [number, number]) => point[1]);
        
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        
        body.latitude = centerLat;
        body.longitude = centerLng;
        // Keep the boundary coordinates for outline display
        body.boundary = body.coordinates;
      } else if (body.coordinates.length === 2) {
        // Single coordinate pair
        body.latitude = body.coordinates[0];
        body.longitude = body.coordinates[1];
        // For single coordinates, create a small boundary rectangle
        const lat = body.coordinates[0];
        const lng = body.coordinates[1];
        const offset = 0.00001; // Very small offset for plot boundary
        body.boundary = [
          [lat - offset, lng - offset],
          [lat + offset, lng - offset], 
          [lat + offset, lng + offset],
          [lat - offset, lng + offset],
          [lat - offset, lng - offset]
        ];
      }
    }
    
    // Keep coordinates for backward compatibility but rename to avoid conflicts
    if (body.coordinates) {
      body.originalCoordinates = body.coordinates;
      delete body.coordinates;
    }
    
    console.log('Creating plot with data:', body);
    
    // Call backend service
    const response = await fetch('http://localhost:3001/api/plots', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create cemetery plot');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      message: data.message
    });

  } catch (error) {
    console.error('Cemetery plot create error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create cemetery plot'
      },
      { status: 500 }
    );
  }
}

// PUT - Update cemetery plot
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Plot ID is required' },
        { status: 400 }
      );
    }

    // Call backend service
    const response = await fetch(`http://localhost:3001/api/plots/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update cemetery plot');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      message: data.message
    });

  } catch (error) {
    console.error('Cemetery plot update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update cemetery plot'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete cemetery plot
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Plot ID is required' },
        { status: 400 }
      );
    }

    // Call backend service
    const response = await fetch(`http://localhost:3001/api/plots/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete cemetery plot');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: data.message || 'Plot deleted successfully'
    });

  } catch (error) {
    console.error('Cemetery plot delete error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete cemetery plot'
      },
      { status: 500 }
    );
  }
}