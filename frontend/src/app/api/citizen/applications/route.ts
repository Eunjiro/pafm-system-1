import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Citizen Applications API Called ===')
    const session = await getServerSession(authOptions)
    console.log('Session:', session?.user)
    
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }
    
    if (!['CITIZEN', 'EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
      console.log('Invalid role:', session.user?.role)
      return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'

    // Build query parameters for backend
    const queryParams = new URLSearchParams()
    if (status) queryParams.append('status', status)
    queryParams.append('page', page)
    queryParams.append('limit', limit)

    const backendUrl = `${BACKEND_URL}/api/death-registrations/citizen/my-applications?${queryParams}`
    console.log('Fetching from backend:', backendUrl)
    console.log('Access token exists:', !!session.accessToken)

    // Fetch from backend
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Backend response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('Backend error:', errorData)
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch applications' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Backend data received:', Object.keys(data))
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in citizen applications API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}