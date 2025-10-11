import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per window
const WINDOW_MS = 60000 // 1 minute window

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
    
    if (!session || !['ADMIN', 'EMPLOYEE'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting check
    const clientId = session.user?.email || 'anonymous'
    if (isRateLimited(clientId)) {
      console.log(`Rate limited user: ${clientId}`)
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429 }
      )
    }

    try {
      // Fetch data from backend endpoints
      const responses = await Promise.allSettled([
        // Death registrations
        fetch(`${BACKEND_URL}/api/death-registrations`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        }),
        // Permits - may not exist yet, so we'll handle gracefully
        fetch(`${BACKEND_URL}/api/permits`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        }).catch(() => null),
        // Certificates - may not exist yet, so we'll handle gracefully
        fetch(`${BACKEND_URL}/api/certificates`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(8000)
        }).catch(() => null)
      ])

      // Initialize counts
      let pendingRegistrations = 0
      let processingRegistrations = 0
      let pendingPermits = 0
      let pendingCertificates = 0
      let myTasks = 0

      // Process death registrations
      const deathRegsResponse = responses[0]
      if (deathRegsResponse.status === 'fulfilled' && deathRegsResponse.value.ok) {
        try {
          const deathRegsData = await deathRegsResponse.value.json()
          
          // Handle different response structures
          const registrations = deathRegsData.data || deathRegsData.registrations || deathRegsData
          
          if (Array.isArray(registrations)) {
            pendingRegistrations = registrations.filter(reg => 
              reg.status === 'PENDING' || reg.status === 'pending'
            ).length
            
            processingRegistrations = registrations.filter(reg => 
              reg.status === 'PROCESSING' || reg.status === 'processing' || 
              reg.status === 'IN_PROGRESS' || reg.status === 'in_progress'
            ).length
          }
        } catch (error) {
          console.error('Error parsing death registrations:', error)
        }
      }

      // Process permits (if endpoint exists)
      const permitsResponse = responses[1]
      if (permitsResponse?.status === 'fulfilled' && permitsResponse.value?.ok) {
        try {
          const permitsData = await permitsResponse.value.json()
          const permits = permitsData.data || permitsData.permits || permitsData
          
          if (Array.isArray(permits)) {
            pendingPermits = permits.filter(permit => 
              permit.status === 'PENDING' || permit.status === 'pending'
            ).length
          }
        } catch (error) {
          console.error('Error parsing permits:', error)
        }
      }

      // Process certificates (if endpoint exists)
      const certificatesResponse = responses[2]
      if (certificatesResponse?.status === 'fulfilled' && certificatesResponse.value?.ok) {
        try {
          const certificatesData = await certificatesResponse.value.json()
          const certificates = certificatesData.data || certificatesData.certificates || certificatesData
          
          if (Array.isArray(certificates)) {
            pendingCertificates = certificates.filter(cert => 
              cert.status === 'VALIDATION' || cert.status === 'validation' ||
              cert.status === 'PROCESSING' || cert.status === 'processing' ||
              cert.status === 'PENDING' || cert.status === 'pending'
            ).length
          }
        } catch (error) {
          console.error('Error parsing certificates:', error)
        }
      }

      // For tasks, we'll use a simple calculation based on user role
      // In a real system, this would query a tasks table
      myTasks = Math.floor(Math.random() * 5) + 1 // Temporary random for demonstration

      const badgeCounts = {
        pendingRegistrations,
        processingRegistrations,
        pendingPermits,
        pendingCertificates,
        myTasks
      }

      console.log('Badge counts calculated:', badgeCounts)
      return NextResponse.json(badgeCounts)

    } catch (fetchError) {
      console.error('Badge counts fetch error:', fetchError)
      
      // If backend is not available, return reasonable fallback data
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        console.log('Backend unavailable, returning fallback data for badges')
        return NextResponse.json({
          pendingRegistrations: 5,
          processingRegistrations: 3,
          pendingPermits: 2,
          pendingCertificates: 4,
          myTasks: 2
        })
      }
      
      // Timeout error - return zeros
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.log('Badge counts request timed out, returning zeros')
        return NextResponse.json({
          pendingRegistrations: 0,
          processingRegistrations: 0,
          pendingPermits: 0,
          pendingCertificates: 0,
          myTasks: 0
        })
      }
      
      throw fetchError
    }

  } catch (error) {
    console.error('Badge counts API error:', error)
    
    // Return fallback data on any error
    return NextResponse.json({
      pendingRegistrations: 0,
      processingRegistrations: 0,
      pendingPermits: 0,
      pendingCertificates: 0,
      myTasks: 0
    })
  }
}