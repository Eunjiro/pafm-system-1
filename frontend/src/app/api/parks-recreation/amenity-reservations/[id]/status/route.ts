import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.PARKS_RECREATION_SERVICE_URL || 'http://localhost:3004'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params
    
    const response = await fetch(`${BACKEND_URL}/api/amenity-reservations/${id}/status`, {
      method: 'PUT',
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
    console.error('Error updating reservation status:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation status' },
      { status: 500 }
    )
  }
}
