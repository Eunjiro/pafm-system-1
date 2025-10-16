import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// GET: Fetch specific cemetery plot by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    
    // For testing purposes, use a test token if no accessToken is available
    const authToken = session.accessToken || 'test-token'
    
    // Call backend service
    const response = await fetch(`http://localhost:3001/api/plots/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Plot not found' },
          { status: 404 }
        )
      }
      
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch plot')
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data.data
    })
  } catch (error) {
    console.error('Error fetching plot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plot' },
      { status: 500 }
    )
  }
}

// PUT: Update specific cemetery plot
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    
    // For testing purposes, use a test token if no accessToken is available
    const authToken = session.accessToken || 'test-token'
    
    // Call backend service
    const response = await fetch(`http://localhost:3001/api/plots/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Plot not found' },
          { status: 404 }
        )
      }
      
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update plot')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data.data,
      message: data.message || 'Plot updated successfully'
    })
  } catch (error) {
    console.error('Error updating plot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update plot' },
      { status: 500 }
    )
  }
}

// DELETE: Remove specific cemetery plot
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    
    // For testing purposes, use a test token if no accessToken is available
    const authToken = session.accessToken || 'test-token'
    
    // Call backend service
    const response = await fetch(`http://localhost:3001/api/plots/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Plot not found' },
          { status: 404 }
        )
      }
      
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete plot')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data.data,
      message: data.message || 'Plot deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting plot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete plot' },
      { status: 500 }
    )
  }
}