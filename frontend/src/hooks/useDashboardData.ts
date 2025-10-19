import { useState, useEffect, useCallback } from 'react'

interface DashboardStats {
  deathRegistrations: {
    total: number
    pending: number
    processing: number
    completed: number
    todaySubmissions: number
    todayCompletions: number
  }
  permits: {
    total: number
    burial: number
    exhumation: number
    cremation: number
    pending: number
    approved: number
    revenue: number
  }
  certificates: {
    total: number
    pending: number
    issued: number
    todayRequests: number
    revenue: number
  }
  cemetery: {
    totalPlots: number
    occupiedPlots: number
    availablePlots: number
    reservedPlots: number
    maintenanceRequired: number
  }
  users: {
    totalUsers: number
    activeUsers: number
    newToday: number
    citizenUsers: number
    employeeUsers: number
  }
  systemHealth: {
    cemeteryService: 'healthy' | 'degraded' | 'down'
    waterService: 'healthy' | 'degraded' | 'down'
    assetsService: 'healthy' | 'degraded' | 'down'
    facilityService: 'healthy' | 'degraded' | 'down'
    overallStatus: 'healthy' | 'degraded' | 'down'
  }
}

interface RecentActivity {
  id: string
  type: 'death_registration' | 'permit' | 'certificate' | 'user' | 'system'
  title: string
  description: string
  timestamp: string
  user: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export default function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>({
    deathRegistrations: {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      todaySubmissions: 0,
      todayCompletions: 0
    },
    permits: {
      total: 0,
      burial: 0,
      exhumation: 0,
      cremation: 0,
      pending: 0,
      approved: 0,
      revenue: 0
    },
    certificates: {
      total: 0,
      pending: 0,
      issued: 0,
      todayRequests: 0,
      revenue: 0
    },
    cemetery: {
      totalPlots: 0,
      occupiedPlots: 0,
      availablePlots: 0,
      reservedPlots: 0,
      maintenanceRequired: 0
    },
    users: {
      totalUsers: 0,
      activeUsers: 0,
      newToday: 0,
      citizenUsers: 0,
      employeeUsers: 0
    },
    systemHealth: {
      cemeteryService: 'healthy',
      waterService: 'down',
      assetsService: 'down',
      facilityService: 'down',
      overallStatus: 'degraded'
    }
  })

  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all dashboard data in parallel
      const [
        deathRegStats,
        permitsData,
        certificatesData,
        usersData,
        activitiesData,
        healthData,
        cemeteryStats
      ] = await Promise.allSettled([
        fetch('/api/dashboard-stats').then(res => res.json()),
        fetch('/api/permits').then(res => res.json()),
        fetch('/api/certificates').then(res => res.json()),
        fetch('/api/users').then(res => res.json()),
        fetch('/api/users/activities').then(res => res.json()),
        fetch('/api/health').then(res => res.json()),
        fetch('/api/cemetery-statistics').then(res => res.json())
      ])

      // Process death registrations stats
      if (deathRegStats.status === 'fulfilled') {
        const data = deathRegStats.value
        setStats(prev => ({
          ...prev,
          deathRegistrations: {
            total: (data.pending || 0) + (data.processing || 0) + (data.completed || 0) + (data.ready || 0),
            pending: data.pending || 0,
            processing: data.processing || 0,
            completed: data.completed || 0,
            todaySubmissions: data.totalToday || 0,
            todayCompletions: data.completedToday || 0
          }
        }))
      }

      // Process permits data
      if (permitsData.status === 'fulfilled') {
        const data = permitsData.value
        const permits = data.permits || data.data || []
        
        if (Array.isArray(permits)) {
          const permitStats = permits.reduce((acc, permit) => {
            acc.total++
            
            // Count by type
            if (permit.type === 'BURIAL') acc.burial++
            else if (permit.type === 'EXHUMATION') acc.exhumation++
            else if (permit.type === 'CREMATION') acc.cremation++
            
            // Count by status
            if (['SUBMITTED', 'PENDING_VERIFICATION', 'FOR_PAYMENT'].includes(permit.status)) {
              acc.pending++
            } else if (['APPROVED', 'ISSUED'].includes(permit.status)) {
              acc.approved++
            }

            // Calculate revenue
            const amount = parseFloat(permit.amountDue?.toString() || '0') || 0
            acc.revenue += amount

            return acc
          }, {
            total: 0,
            burial: 0,
            exhumation: 0,
            cremation: 0,
            pending: 0,
            approved: 0,
            revenue: 0
          })

          setStats(prev => ({
            ...prev,
            permits: permitStats
          }))
        }
      }

      // Process certificates data
      if (certificatesData.status === 'fulfilled') {
        const data = certificatesData.value
        const certificates = data.certificates || data.data || []
        
        if (Array.isArray(certificates)) {
          const today = new Date().toDateString()
          
          const certStats = certificates.reduce((acc, cert) => {
            acc.total++
            
            if (['PENDING', 'PROCESSING'].includes(cert.status)) {
              acc.pending++
            } else if (['ISSUED', 'READY_FOR_PICKUP'].includes(cert.status)) {
              acc.issued++
            }

            // Check if requested today
            const requestDate = new Date(cert.createdAt || cert.dateRequested).toDateString()
            if (requestDate === today) {
              acc.todayRequests++
            }

            // Calculate revenue
            const amount = parseFloat(cert.fee?.toString() || '0') || 0
            acc.revenue += amount

            return acc
          }, {
            total: 0,
            pending: 0,
            issued: 0,
            todayRequests: 0,
            revenue: 0
          })

          setStats(prev => ({
            ...prev,
            certificates: certStats
          }))
        }
      }

      // Process users data
      if (usersData.status === 'fulfilled') {
        const data = usersData.value
        const users = data.users || data.data || []
        
        if (Array.isArray(users)) {
          const today = new Date().toDateString()
          
          const userStats = users.reduce((acc, user) => {
            acc.totalUsers++
            
            if (user.isActive) acc.activeUsers++
            
            if (user.role === 'CITIZEN') acc.citizenUsers++
            else if (['EMPLOYEE', 'ADMIN'].includes(user.role)) acc.employeeUsers++

            // Check if created today
            const createdDate = new Date(user.createdAt).toDateString()
            if (createdDate === today) {
              acc.newToday++
            }

            return acc
          }, {
            totalUsers: 0,
            activeUsers: 0,
            newToday: 0,
            citizenUsers: 0,
            employeeUsers: 0
          })

          setStats(prev => ({
            ...prev,
            users: userStats
          }))
        }
      }

      // Process activities data
      if (activitiesData.status === 'fulfilled') {
        const data = activitiesData.value
        const rawActivities = data.activities || data.data || []
        
        const formattedActivities: RecentActivity[] = rawActivities.slice(0, 10).map((activity: any) => ({
          id: activity.id || Math.random().toString(),
          type: activity.module?.toLowerCase().includes('death') ? 'death_registration' :
                activity.module?.toLowerCase().includes('permit') ? 'permit' :
                activity.module?.toLowerCase().includes('certificate') ? 'certificate' :
                activity.module?.toLowerCase().includes('user') ? 'user' : 'system',
          title: activity.action || 'System Activity',
          description: activity.description || 'No description available',
          timestamp: activity.timestamp || activity.createdAt || new Date().toISOString(),
          user: activity.user || 'System',
          status: activity.action?.includes('ERROR') ? 'error' :
                 activity.action?.includes('WARNING') ? 'warning' :
                 activity.action?.includes('SUCCESS') ? 'success' : 'info'
        }))

        setActivities(formattedActivities)
      }

      // Process system health data
      if (healthData.status === 'fulfilled') {
        const data = healthData.value
        
        setStats(prev => ({
          ...prev,
          systemHealth: {
            cemeteryService: data.backend?.status === 'connected' ? 'healthy' : 
                           data.backend?.status === 'error' ? 'degraded' : 'down',
            waterService: 'down', // Not implemented yet
            assetsService: 'down', // Not implemented yet
            facilityService: 'down', // Not implemented yet
            overallStatus: data.status === 'healthy' ? 'healthy' : 
                          data.status === 'degraded' ? 'degraded' : 'down'
          }
        }))
      }

      // Process cemetery statistics data
      if (cemeteryStats.status === 'fulfilled') {
        const data = cemeteryStats.value
        const statistics = data.statistics || {}
        
        setStats(prev => ({
          ...prev,
          cemetery: {
            totalPlots: statistics.totalPlots || 0,
            occupiedPlots: statistics.occupiedPlots || 0,
            availablePlots: statistics.vacantPlots || 0,
            reservedPlots: statistics.reservedPlots || 0,
            maintenanceRequired: statistics.blockedPlots || 0
          }
        }))
      } else {
        // Fallback to default values if cemetery API fails
        console.log('Cemetery statistics API failed, using default values')
        setStats(prev => ({
          ...prev,
          cemetery: {
            totalPlots: 0,
            occupiedPlots: 0,
            availablePlots: 0,
            reservedPlots: 0,
            maintenanceRequired: 0
          }
        }))
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  return {
    stats,
    activities,
    loading,
    error,
    refetch: fetchDashboardData
  }
}