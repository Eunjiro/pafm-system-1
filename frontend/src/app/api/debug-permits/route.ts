import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Checking permits without auth ===')
    
    // Try to connect to backend directly
    const backendResponse = await fetch(`${BACKEND_URL}/api/permits/debug`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
    })
    
    console.log('Backend response status:', backendResponse.status)
    
    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json({
        success: true,
        message: 'Backend connection successful',
        data: data
      })
    } else {
      const errorText = await backendResponse.text()
      return NextResponse.json({
        success: false,
        message: 'Backend connection failed',
        status: backendResponse.status,
        error: errorText
      })
    }
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Frontend to backend connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}