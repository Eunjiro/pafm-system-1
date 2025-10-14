import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admins can view user activities
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    console.log('Fetching user activities from backend...')

    try {
      // Fetch from backend service
      const response = await fetch(`${BACKEND_URL}/api/users/activities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
      })

      console.log('Backend activities response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Backend activities error:', errorData)
        
        // Return mock data for development if backend unavailable
        if (response.status === 503 || response.status === 404) {
          console.warn('Backend unavailable or endpoint not found, using mock activities data')
          return NextResponse.json({
            activities: [
              {
                id: '1',
                userId: '1',
                action: 'USER_LOGIN',
                module: 'AUTH',
                description: 'Administrator logged into the system',
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                timestamp: new Date().toISOString(),
              },
              {
                id: '2',
                userId: '2',
                action: 'DEATH_REGISTRATION_PROCESSED',
                module: 'DEATH_REGISTRATION',
                description: 'Processed death registration #1001',
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
              },
              {
                id: '3',
                userId: '3',
                action: 'APPLICATION_SUBMITTED',
                module: 'APPLICATIONS',
                description: 'Submitted new death certificate application',
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
              },
              {
                id: '4',
                userId: '1',
                action: 'USER_STATUS_UPDATED',
                module: 'USER_MANAGEMENT',
                description: 'Updated user status for employee account',
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                timestamp: new Date(Date.now() - 10800000).toISOString(),
              },
              {
                id: '5',
                userId: '2',
                action: 'CERTIFICATE_GENERATED',
                module: 'CERTIFICATES',
                description: 'Generated death certificate for registration #1002',
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                timestamp: new Date(Date.now() - 14400000).toISOString(),
              }
            ]
          })
        }
        
        return NextResponse.json(
          { 
            error: errorData.error || `Failed to fetch activities (${response.status})`,
            details: errorData.details || 'Backend service error'
          },
          { status: response.status }
        )
      }

      const result = await response.json()
      
      console.log('Successfully fetched activities:', result.activities?.length || 0)

      return NextResponse.json({
        activities: result.activities || result.data || [],
        total: result.total || result.activities?.length || 0,
        message: 'Activities fetched successfully'
      })

    } catch (fetchError) {
      console.error('Backend fetch error for activities:', fetchError)
      
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        console.warn('Backend connection failed, returning mock activities data')
        // Return mock data when backend connection fails
        return NextResponse.json({
          activities: [
            {
              id: '1',
              userId: '1',
              action: 'USER_LOGIN',
              module: 'AUTH',
              description: 'Administrator logged into the system',
              ipAddress: '127.0.0.1',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              timestamp: new Date().toISOString(),
            },
            {
              id: '2',
              userId: '2',
              action: 'DEATH_REGISTRATION_PROCESSED',
              module: 'DEATH_REGISTRATION',
              description: 'Processed death registration #1001',
              ipAddress: '127.0.0.1',
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
            }
          ],
          total: 2,
          message: 'Mock activities data (backend connection failed)'
        })
      }
      
      throw fetchError
    }

  } catch (error) {
    console.error('Error fetching user activities:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error while fetching activities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}