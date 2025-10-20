import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.PARKS_RECREATION_SERVICE_URL || 'http://localhost:3004'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    
    const response = await fetch(`${BACKEND_URL}/api/amenities${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch amenities')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching amenities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch amenities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/api/amenities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating amenity:', error)
    return NextResponse.json(
      { error: 'Failed to create amenity' },
      { status: 500 }
    )
  }
}
