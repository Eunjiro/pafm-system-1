import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// GET - Retrieve all cemeteries
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Build URL for backend
    const backendUrl = id 
      ? `http://localhost:3001/api/cemeteries/${id}`
      : 'http://localhost:3001/api/cemeteries';

    // Call backend service
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Backend cemetery API error: ${response.status}`);
      return NextResponse.json({
        success: false,
        error: 'Backend service unavailable',
        data: []
      }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      message: data.message
    });

  } catch (error) {
    console.error('Cemetery API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch cemeteries',
      data: []
    }, { status: 500 });
  }
}

// POST - Create a new cemetery
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
    
    // Call backend service
    const response = await fetch('http://localhost:3001/api/cemeteries', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create cemetery');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data,
      message: data.message
    });

  } catch (error) {
    console.error('Cemetery create error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create cemetery'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a cemetery
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const cascade = searchParams.get('cascade');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Cemetery ID is required' },
        { status: 400 }
      );
    }

    // Build URL with cascade parameter if provided
    const backendUrl = cascade 
      ? `http://localhost:3001/api/cemeteries/${id}?cascade=${cascade}`
      : `http://localhost:3001/api/cemeteries/${id}`;

    // Call backend service
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete cemetery');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: data.message || 'Cemetery deleted successfully'
    });

  } catch (error) {
    console.error('Cemetery delete error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete cemetery'
      },
      { status: 500 }
    );
  }
}