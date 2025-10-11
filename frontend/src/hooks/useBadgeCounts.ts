"use client"

import { useState, useEffect } from 'react'

interface BadgeCounts {
  pendingRegistrations: number
  processingRegistrations: number
  pendingPermits: number
  pendingCertificates: number
  myTasks: number
}

export const useBadgeCounts = (): BadgeCounts => {
  const [counts, setCounts] = useState<BadgeCounts>({
    pendingRegistrations: 0,
    processingRegistrations: 0,
    pendingPermits: 0,
    pendingCertificates: 0,
    myTasks: 0
  })
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [retryDelay, setRetryDelay] = useState<number>(60000) // Start with 1 minute

  useEffect(() => {
    const fetchCounts = async () => {
      // Throttling: Don't fetch if we fetched recently
      const now = Date.now()
      if (now - lastFetch < 30000) { // Minimum 30 seconds between requests
        return
      }

      try {
        setLastFetch(now)
        console.log('Fetching badge counts from API...')
        
        const response = await fetch('/api/badge-counts', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        })

        if (!response.ok) {
          if (response.status === 401) {
            console.log('User not authenticated, using zero counts')
            setCounts({
              pendingRegistrations: 0,
              processingRegistrations: 0,
              pendingPermits: 0,
              pendingCertificates: 0,
              myTasks: 0
            })
            return
          }
          
          // Handle rate limiting (429) with exponential backoff
          if (response.status === 429) {
            console.warn('Rate limited, increasing retry delay')
            setRetryDelay(prev => Math.min(prev * 2, 300000)) // Max 5 minutes
            throw new Error('Rate limited - will retry with longer delay')
          }
          
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: BadgeCounts = await response.json()
        setCounts(data)
        
        // Reset retry delay on successful request
        setRetryDelay(60000)
        
        console.log('Badge counts updated successfully:', data)
      } catch (error) {
        console.error('Error fetching badge counts:', error)
        
        // On error, use fallback mock data with lower numbers to indicate issues
        const fallbackCounts: BadgeCounts = {
          pendingRegistrations: 2,
          processingRegistrations: 1,
          pendingPermits: 1,
          pendingCertificates: 2,
          myTasks: 1
        }
        
        setCounts(fallbackCounts)
        console.log('Using fallback badge counts due to error:', fallbackCounts)
      }
    }

    fetchCounts()
    
    // Use dynamic retry delay (starts at 60s, increases on rate limiting)
    const interval = setInterval(fetchCounts, retryDelay)
    
    return () => clearInterval(interval)
  }, [lastFetch, retryDelay])

  return counts
}