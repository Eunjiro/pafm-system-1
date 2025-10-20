import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.PARKS_RECREATION_SERVICE_URL || 'http://localhost:3004'

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
