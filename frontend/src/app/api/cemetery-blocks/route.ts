import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Use the existing burial-cemetery backend service
const BACKEND_URL = 'http://localhost:3001'

export async function GET() {
  try {
    console.log('Fetching cemetery blocks from backend...')
    
    const session = await getServerSession();
    // For testing purposes, use a test token if no accessToken is available
    const authToken = session?.accessToken || 'test-token';
    
    const response = await fetch(`${BACKEND_URL}/api/cemetery-blocks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Backend blocks response:', data)
      
      return NextResponse.json({
        success: true,
        data: data.data || []
      })
    } else {
      console.error('Backend blocks API failed:', response.status)
      return NextResponse.json({
        success: true,
        data: []
      })
    }
  } catch (error) {
    console.error('Error fetching cemetery blocks:', error)
    return NextResponse.json({
      success: true,
      data: []
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Creating cemetery block via backend:', body)
    
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For testing purposes, use a test token if no accessToken is available
    const authToken = session.accessToken || 'test-token';
    
    const response = await fetch(`${BACKEND_URL}/api/cemetery-blocks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Backend block creation response:', data)
      
      return NextResponse.json({
        success: true,
        data: data.data
      })
    } else {
      const errorText = await response.text()
      console.error('Backend block creation failed:', errorText)
      return NextResponse.json(
        { success: false, error: `Backend error: ${errorText}` }, 
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Error creating cemetery block:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create cemetery block' }, 
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
        { success: false, error: 'Block ID is required' },
        { status: 400 }
      )
    }
    
    console.log('Deleting cemetery block via backend:', id)
    
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For testing purposes, use a test token if no accessToken is available
    const authToken = session.accessToken || 'test-token';
    
    const response = await fetch(`${BACKEND_URL}/api/cemetery-blocks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Backend block deletion response:', data)
      
      return NextResponse.json({
        success: true,
        message: 'Block deleted successfully'
      })
    } else {
      const errorText = await response.text()
      console.error('Backend block deletion failed:', errorText)
      return NextResponse.json(
        { success: false, error: `Backend error: ${errorText}` }, 
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Error deleting cemetery block:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete cemetery block' }, 
      { status: 500 }
    )
  }
}