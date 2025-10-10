import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }
    
    if (!['CITIZEN', 'EMPLOYEE', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
    }

    // Fetch from backend
    const response = await fetch(`${BACKEND_URL}/api/death-registrations/citizen/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch application details' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching application details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}