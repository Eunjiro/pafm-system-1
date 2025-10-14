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
    
    // Only admins can perform overrides
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { action, reason, adminId } = body

    // Validate required fields
    if (!action || !reason?.trim()) {
      return NextResponse.json({ 
        error: 'Action and reason are required for administrative overrides' 
      }, { status: 400 })
    }

    // Validate action type
    const validActions = ['approve', 'reject', 'edit', 'waive_fee', 'reset_status', 'adjust_fee']
    if (!validActions.includes(action)) {
      return NextResponse.json({ 
        error: `Invalid action. Must be one of: ${validActions.join(', ')}` 
      }, { status: 400 })
    }

    // Prepare override data with audit trail
    const overrideData = {
      action,
      reason: reason.trim(),
      adminId: adminId || session.user?.id,
      adminEmail: session.user?.email,
      timestamp: new Date().toISOString(),
      registrationId: params.id
    }

    console.log('Sending admin override to backend:', overrideData)

    // Forward to backend service
    const response = await fetch(`${BACKEND_URL}/api/death-registrations/${params.id}/override`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(overrideData),
    })

    console.log('Backend override response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Backend override error:', errorData)
      
      return NextResponse.json(
        { 
          error: errorData.error || `Override failed (${response.status})`,
          details: errorData.details || 'Backend service error'
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    // Log successful override for audit purposes
    console.log(`Admin override executed: ${action} on registration ${params.id} by ${session.user?.email}`)

    return NextResponse.json({
      success: true,
      message: `Administrative override "${action}" executed successfully`,
      data: result,
      audit: {
        action,
        executedBy: session.user?.email,
        timestamp: overrideData.timestamp,
        registrationId: params.id
      }
    })

  } catch (error) {
    console.error('Error executing admin override:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during override execution',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}