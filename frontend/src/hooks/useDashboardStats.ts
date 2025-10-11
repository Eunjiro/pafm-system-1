"use client"

import { useState, useEffect } from 'react'

interface DashboardStats {
  pending: number
  processing: number
  completed: number
  ready: number
  totalToday: number
  completedToday: number
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    ready: 0,
    totalToday: 0,
    completedToday: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [retryDelay, setRetryDelay] = useState<number>(120000) // Start with 2 minutes

  useEffect(() => {
    const fetchStats = async () => {
      // Throttling: Don't fetch if we fetched recently
      const now = Date.now()
      if (now - lastFetch < 60000) { // Minimum 60 seconds between requests
        return
      }

      try {
        setLoading(true)
        setError(null)
        setLastFetch(now)
        
        console.log('Fetching dashboard stats from API...')
        
        const response = await fetch('/api/dashboard-stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        })

        if (!response.ok) {
          if (response.status === 401) {
            console.log('User not authenticated for dashboard stats')
            setError('Authentication required')
            return
          }
          
          // Handle rate limiting (429) with exponential backoff
          if (response.status === 429) {
            console.warn('Dashboard stats rate limited, increasing retry delay')
            setRetryDelay(prev => Math.min(prev * 2, 600000)) // Max 10 minutes
            throw new Error('Rate limited - will retry with longer delay')
          }
          
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: DashboardStats = await response.json()
        setStats(data)
        
        // Reset retry delay on successful request
        setRetryDelay(120000)
        
        console.log('Dashboard stats updated successfully:', data)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch dashboard stats')
        
        // Keep the current stats instead of using fallback data
        console.log('Keeping current stats due to error - no fallback data used')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Use dynamic retry delay (starts at 2 minutes, increases on rate limiting)
    const interval = setInterval(fetchStats, retryDelay)
    
    return () => clearInterval(interval)
  }, [lastFetch, retryDelay])

  return { stats, loading, error, refetch: () => window.location.reload() }
}