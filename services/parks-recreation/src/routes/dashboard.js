const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date()
    const next7Days = new Date()
    next7Days.setDate(today.getDate() + 7)
    
    const [
      totalReservations,
      upcomingReservations,
      pendingReservations,
      totalVenueBookings,
      upcomingEvents,
      pendingBookings,
      openMaintenanceRequests,
      inProgressMaintenance
    ] = await Promise.all([
      prisma.amenityReservation.count(),
      prisma.amenityReservation.count({
        where: {
          reservationDate: { gte: today, lte: next7Days },
          status: 'APPROVED'
        }
      }),
      prisma.amenityReservation.count({
        where: { status: 'PENDING_REVIEW' }
      }),
      prisma.venueBooking.count(),
      prisma.venueBooking.count({
        where: {
          eventDate: { gte: today, lte: next7Days },
          status: 'APPROVED'
        }
      }),
      prisma.venueBooking.count({
        where: { status: 'PENDING_REVIEW' }
      }),
      prisma.maintenanceRequest.count({
        where: { status: { in: ['PENDING_INSPECTION', 'UNDER_INSPECTION'] } }
      }),
      prisma.maintenanceRequest.count({
        where: { status: 'IN_PROGRESS' }
      })
    ])
    
    res.json({
      success: true,
      data: {
        amenityReservations: {
          total: totalReservations,
          upcoming: upcomingReservations,
          pending: pendingReservations
        },
        venueBookings: {
          total: totalVenueBookings,
          upcoming: upcomingEvents,
          pending: pendingBookings
        },
        maintenance: {
          open: openMaintenanceRequests,
          inProgress: inProgressMaintenance
        }
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    })
  }
})

module.exports = router
