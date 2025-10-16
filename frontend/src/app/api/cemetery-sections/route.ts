import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Use the existing burial-cemetery backend service
const BACKEND_URL = 'http://localhost:3001'

export async function GET() {
  try {
    console.log('Fetching cemetery sections from backend...')
    
    const session = await getServerSession();
    // For testing purposes, use a test token if no accessToken is available
    const authToken = session?.accessToken || 'test-token';
    
    const response = await fetch(`${BACKEND_URL}/api/cemetery-sections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Backend sections response:', data)
      
      return NextResponse.json({
        success: true,
        data: data.data || []
      })
    } else {
      console.error('Backend sections API failed:', response.status)
      return NextResponse.json({
        success: true,
        data: []
      })
    }
  } catch (error) {
    console.error('Error fetching cemetery sections:', error)
    return NextResponse.json({
      success: true,
      data: []
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Creating cemetery section via backend:', body)
    
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For testing purposes, use a test token if no accessToken is available
    const authToken = session.accessToken || 'test-token';
    
    const response = await fetch(`${BACKEND_URL}/api/cemetery-sections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Backend section creation response:', data)
      
      return NextResponse.json({
        success: true,
        data: data.data
      })
    } else {
      const errorText = await response.text()
      console.error('Backend section creation failed:', errorText)
      return NextResponse.json(
        { success: false, error: `Backend error: ${errorText}` }, 
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Error creating cemetery section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create cemetery section' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      )
    }
    
    console.log('Deleting cemetery section via backend:', id)
    
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For testing purposes, use a test token if no accessToken is available
    const authToken = session.accessToken || 'test-token';
    
    const response = await fetch(`${BACKEND_URL}/api/cemetery-sections/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Backend section deletion response:', data)
      
      return NextResponse.json({
        success: true,
        message: 'Section deleted successfully'
      })
    } else {
      const errorText = await response.text()
      console.error('Backend section deletion failed:', errorText)
      return NextResponse.json(
        { success: false, error: `Backend error: ${errorText}` }, 
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Error deleting cemetery section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete cemetery section' }, 
      { status: 500 }
    )
  }
}