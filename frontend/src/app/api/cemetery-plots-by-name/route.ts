import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

/**
 * Cemetery Plots by Name API
 * 
 * This endpoint fetches all plots for a specific cemetery by name
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const { searchParams } = new URL(request.url);
    const cemeteryName = searchParams.get('cemeteryName');
    
    if (!cemeteryName) {
      return NextResponse.json(
        { success: false, error: 'Cemetery name is required' },
        { status: 400 }
      );
    }

    // For development, use test-token that works with backend auth middleware
    const authToken = 'test-token';

    console.log('Fetching plots for cemetery:', cemeteryName);

    // Call backend service for plots filtered by cemetery name
    const response = await fetch(`http://localhost:3001/api/plots?cemeteryName=${encodeURIComponent(cemeteryName)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch plots: ${response.status}`);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch plots from backend' },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('Fetched plots result:', result);

    return NextResponse.json({
      success: true,
      plots: result.data || []
    });

  } catch (error) {
    console.error('Error in cemetery-plots-by-name API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}