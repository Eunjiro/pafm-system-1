import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const queryParams = url.searchParams.toString()
    
    const backendUrl = `${BACKEND_URL}/api/death-registrations${queryParams ? `?${queryParams}` : ''}`
    
    console.log('Attempting to fetch from backend:', backendUrl)
    console.log('Backend URL environment variable:', BACKEND_URL)
    
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      console.log('Backend response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Backend error response:', errorData)
        return NextResponse.json(
          { error: errorData.error || `Backend error: ${response.status}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log('Backend data received, returning to frontend')
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error('Backend fetch error:', fetchError)
      
      // Check if it's a network/connection error
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        return NextResponse.json(
          { 
            error: 'Cannot connect to backend service. Please check if the backend is running.',
            details: `Backend URL: ${backendUrl}`,
            type: 'CONNECTION_ERROR'
          },
          { status: 503 } // Service Unavailable
        )
      }
      
      // Check if it's a timeout error
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'Backend request timed out. Please try again.',
            type: 'TIMEOUT_ERROR'
          },
          { status: 504 } // Gateway Timeout
        )
      }
      
      throw fetchError // Re-throw unexpected errors
    }
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/api/death-registrations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to create death registration' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating death registration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}