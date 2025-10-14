import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admins to execute overrides
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { action, reason, adminId, newAmount } = body
    
    // Validate required fields
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Override reason is required' }, { status: 400 })
    }

    const response = await fetch(`${BACKEND_URL}/api/permits/${params.id}/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        action,
        reason: reason.trim(),
        adminId: adminId || session.user?.id,
        ...(newAmount && { newAmount })
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Backend override error:', errorData)
      
      return NextResponse.json(
        { 
          error: errorData.error || 'Failed to execute admin override',
          details: errorData.details 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Admin override executed successfully for permit:', params.id)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error executing admin override:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}