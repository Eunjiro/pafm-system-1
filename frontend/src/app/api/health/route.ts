import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET() {
  try {
    // Basic health check
    const healthCheck: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      backend: {
        url: BACKEND_URL,
        status: 'unknown'
      }
    }

    // Check backend service connectivity
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000), // 3 second timeout
      })

      if (backendResponse.ok) {
        const backendData = await backendResponse.json()
        healthCheck.backend.status = 'connected'
        healthCheck.backend.data = backendData
      } else {
        healthCheck.backend.status = 'error'
        healthCheck.backend.error = `HTTP ${backendResponse.status}`
        healthCheck.status = 'degraded'
      }
    } catch (backendError) {
      healthCheck.backend.status = 'disconnected'
      healthCheck.backend.error = backendError instanceof Error ? backendError.message : 'Connection failed'
      healthCheck.status = 'degraded'
    }
    
    return NextResponse.json(healthCheck, { 
      status: healthCheck.status === 'healthy' ? 200 : 503 
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}