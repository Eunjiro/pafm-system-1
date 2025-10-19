import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// GET - Retrieve cemetery statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({
        success: true,
        statistics: {
          totalPlots: 0,
          vacantPlots: 0,
          reservedPlots: 0,
          occupiedPlots: 0,
          blockedPlots: 0,
          totalAssignments: 0,
          occupancyRate: 0
        }
      });
    }

    // For development, use test-token that works with backend auth middleware
    const authToken = 'test-token'; // session?.accessToken || 'test-token';

    console.log('Fetching cemetery statistics from backend...');

    // Call backend service for statistics
    const response = await fetch('http://localhost:3001/api/plots/statistics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Return default statistics if backend is unavailable
      console.warn(`Statistics API error: ${response.status}`);
      return NextResponse.json({
        success: true,
        statistics: {
          totalPlots: 0,
          vacantPlots: 0,
          reservedPlots: 0,
          occupiedPlots: 0,
          blockedPlots: 0,
          totalAssignments: 0,
          occupancyRate: 0
        },
        message: 'Backend service unavailable - showing default statistics'
      });
    }

    const data = await response.json();
    
    console.log('Backend statistics response:', data);

    return NextResponse.json({
      success: true,
      statistics: data.data || data.statistics || {
        totalPlots: 0,
        vacantPlots: 0,
        reservedPlots: 0,
        occupiedPlots: 0,
        blockedPlots: 0,
        totalAssignments: 0,
        occupancyRate: 0
      },
      message: data.message
    });

  } catch (error) {
    console.error('Cemetery statistics API error:', error);
    // Return default statistics instead of failing
    return NextResponse.json({
      success: true,
      statistics: {
        totalPlots: 0,
        vacantPlots: 0,
        reservedPlots: 0,
        occupiedPlots: 0,
        blockedPlots: 0,
        totalAssignments: 0,
        occupancyRate: 0
      },
      message: 'Service temporarily unavailable - showing default statistics'
    });
  }
}