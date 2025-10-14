import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 60
const WINDOW_MS = 60000

function isRateLimited(clientId: string): boolean {
  const now = Date.now()
  const record = requestCounts.get(clientId)
  
  if (!record || now > record.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + WINDOW_MS })
    return false
  }
  
  if (record.count >= RATE_LIMIT) {
    return true
  }
  
  record.count++
  return false
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Rate limiting check
    const clientId = session.user?.email || 'anonymous'
    if (isRateLimited(clientId)) {
      console.log(`Rate limited users request for user: ${clientId}`)
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    const url = new URL(request.url)
    const queryParams = url.searchParams.toString()
    
    const backendUrl = `${BACKEND_URL}/api/users${queryParams ? `?${queryParams}` : ''}`
    
    console.log('Attempting to fetch users from backend:', backendUrl)
    
    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      })

      console.log('Backend response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Backend error response:', errorData)
        
        if (response.status === 429) {
          return NextResponse.json(
            { 
              error: 'Backend service is busy. Please wait a moment and try again.',
              retryAfter: response.headers.get('Retry-After') || '30',
              type: 'BACKEND_RATE_LIMITED'
            },
            { status: 429 }
          )
        }
        
        if (response.status === 503) {
          console.warn('Backend service unavailable, returning mock data for development')
          // Return mock data when backend is unavailable
          return NextResponse.json({
            users: [
              {
                id: 1,
                email: 'admin@cemetery.qc.gov.ph',
                fullNameFirst: 'System',
                fullNameLast: 'Administrator',
                role: 'ADMIN',
                isActive: true,
                contactNo: '+63-912-345-6789',
                organization: 'Quezon City Government',
                permissions: ['user_management', 'system_administration', 'audit_access'],
                emailVerified: true,
                twoFactorEnabled: false,
                loginAttempts: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 2,
                email: 'employee@cemetery.qc.gov.ph',
                fullNameFirst: 'Maria',
                fullNameLast: 'Santos',
                role: 'EMPLOYEE',
                isActive: true,
                contactNo: '+63-917-123-4567',
                organization: 'Civil Registry Office',
                permissions: ['death_registration', 'certificate_processing'],
                emailVerified: true,
                twoFactorEnabled: false,
                loginAttempts: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 3,
                email: 'citizen@example.com',
                fullNameFirst: 'Juan',
                fullNameMiddle: 'Santos',
                fullNameLast: 'Dela Cruz',
                role: 'CITIZEN',
                isActive: true,
                contactNo: '+63-905-987-6543',
                address: '123 Main Street, Quezon City',
                permissions: ['application_submission', 'status_tracking'],
                emailVerified: true,
                twoFactorEnabled: false,
                loginAttempts: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            ],
            total: 3,
            message: 'Mock users data (backend unavailable)'
          })
        }
        
        return NextResponse.json(
          { 
            error: errorData.error || `Backend service error (${response.status}). Please try again.`,
            status: response.status
          },
          { status: response.status }
        )
      }

      const data = await response.json()
      console.log('Backend users data received, returning to frontend')
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error('Backend fetch error:', fetchError)
      
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        console.warn('Backend connection failed, returning mock data for development')
        // Return mock data when backend connection fails
        return NextResponse.json({
          users: [
            {
              id: 1,
              email: 'admin@cemetery.qc.gov.ph',
              fullNameFirst: 'System',
              fullNameLast: 'Administrator',
              role: 'ADMIN',
              isActive: true,
              contactNo: '+63-912-345-6789',
              organization: 'Quezon City Government',
              permissions: ['user_management', 'system_administration', 'audit_access'],
              emailVerified: true,
              twoFactorEnabled: false,
              loginAttempts: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 2,
              email: 'employee@cemetery.qc.gov.ph',
              fullNameFirst: 'Maria',
              fullNameLast: 'Santos',
              role: 'EMPLOYEE',
              isActive: true,
              contactNo: '+63-917-123-4567',
              organization: 'Civil Registry Office',
              permissions: ['death_registration', 'certificate_processing'],
              emailVerified: true,
              twoFactorEnabled: false,
              loginAttempts: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 3,
              email: 'citizen@example.com',
              fullNameFirst: 'Juan',
              fullNameMiddle: 'Santos',
              fullNameLast: 'Dela Cruz',
              role: 'CITIZEN',
              isActive: true,
              contactNo: '+63-905-987-6543',
              address: '123 Main Street, Quezon City',
              permissions: ['application_submission', 'status_tracking'],
              emailVerified: true,
              twoFactorEnabled: false,
              loginAttempts: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ],
          total: 3,
          message: 'Mock users data (backend connection failed)'
        })
      }
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'Backend request timed out. Please try again.',
            type: 'TIMEOUT_ERROR'
          },
          { status: 504 }
        )
      }
      
      throw fetchError
    }
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to create user' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}