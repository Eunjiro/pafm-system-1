import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    // Test backend connectivity
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return NextResponse.json({
        status: 'error',
        message: `Backend health check failed with status: ${response.status}`,
        backendUrl: BACKEND_URL
      }, { status: 503 })
    }

    const healthData = await response.json()
    
    return NextResponse.json({
      status: 'ok',
      message: 'Backend connection successful',
      backendUrl: BACKEND_URL,
      backendHealth: healthData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Backend connectivity test failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Cannot connect to backend service',
      backendUrl: BACKEND_URL,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 })
  }
}