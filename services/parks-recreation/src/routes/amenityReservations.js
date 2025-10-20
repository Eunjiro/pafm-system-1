const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const QRCode = require('qrcode')

const prisma = new PrismaClient()

// Generate booking code
function generateBookingCode() {
  const prefix = 'AMN'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

// Get all reservations
router.get('/', async (req, res) => {
  try {
    const { status, date, amenityId } = req.query
    
    const where = {}
    if (status) where.status = status
    if (date) {
      where.reservationDate = {
        gte: new Date(date + 'T00:00:00'),
        lte: new Date(date + 'T23:59:59')
      }
    }
    if (amenityId) where.amenityId = parseInt(amenityId)
    
    const reservations = await prisma.amenityReservation.findMany({
      where,
      include: {
        amenity: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json({
      success: true,
      data: reservations
    })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reservations',
      error: error.message
    })
  }
})

// Create reservation
router.post('/', async (req, res) => {
  try {
    const {
      requesterName,
      requesterEmail,
      requesterPhone,
      requesterType,
      proofOfResidencyUrl,
      amenityId,
      reservationDate,
      startTime,
      endTime,
      numberOfGuests,
      specialRequests
    } = req.body
    
    // Check availability
    const conflicts = await prisma.amenityReservation.findMany({
      where: {
        amenityId: parseInt(amenityId),
        reservationDate: new Date(reservationDate),
        status: {
          in: ['APPROVED', 'AWAITING_PAYMENT', 'CHECKED_IN']
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ]
      }
    })
    
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected time slot is not available'
      })
    }
    
    // Get amenity to calculate amount
    const amenity = await prisma.amenity.findUnique({
      where: { id: parseInt(amenityId) }
    })
    
    // Calculate hold expiry (24 hours)
    const holdExpiresAt = new Date()
    holdExpiresAt.setHours(holdExpiresAt.getHours() + 24)
    
    const bookingCode = generateBookingCode()
    
    const reservation = await prisma.amenityReservation.create({
      data: {
        bookingCode,
        requesterName,
        requesterEmail,
        requesterPhone,
        requesterType: requesterType || 'RESIDENT',
        proofOfResidencyUrl,
        amenityId: parseInt(amenityId),
        reservationDate: new Date(reservationDate),
        startTime,
        endTime,
        numberOfGuests: parseInt(numberOfGuests),
        specialRequests,
        totalAmount: amenity.dailyRate,
        holdExpiresAt
      },
      include: {
        amenity: true
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Reservation created successfully. Please complete payment within 24 hours.',
      data: reservation
    })
  } catch (error) {
    console.error('Error creating reservation:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create reservation',
      error: error.message
    })
  }
})

// Update reservation status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, reviewedBy, approvedBy, rejectedBy, rejectionReason, remarks } = req.body
    const id = parseInt(req.params.id)
    
    const updateData = { status, remarks }
    
    if (status === 'AWAITING_PAYMENT') {
      // Set payment due date (24 hours)
      const paymentDueAt = new Date()
      paymentDueAt.setHours(paymentDueAt.getHours() + 24)
      updateData.paymentDueAt = paymentDueAt
      updateData.reviewedBy = reviewedBy
      updateData.reviewedAt = new Date()
    }
    
    if (status === 'APPROVED') {
      // Generate QR code
      const reservation = await prisma.amenityReservation.findUnique({
        where: { id }
      })
      const qrData = {
        bookingCode: reservation.bookingCode,
        type: 'AMENITY',
        date: reservation.reservationDate,
        requester: reservation.requesterName
      }
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData))
      
      updateData.qrCode = qrCode
      updateData.approvedBy = approvedBy
      updateData.approvedAt = new Date()
    }
    
    if (status === 'REJECTED') {
      updateData.rejectedBy = rejectedBy
      updateData.rejectedAt = new Date()
      updateData.rejectionReason = rejectionReason
    }
    
    const updated = await prisma.amenityReservation.update({
      where: { id },
      data: updateData,
      include: {
        amenity: true
      }
    })
    
    res.json({
      success: true,
      message: 'Reservation status updated',
      data: updated
    })
  } catch (error) {
    console.error('Error updating reservation:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update reservation',
      error: error.message
    })
  }
})

// Update payment status
router.put('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus, paymentMethod, paymentProofUrl } = req.body
    
    const updateData = {
      paymentStatus,
      paymentMethod,
      paymentProofUrl
    }
    
    if (paymentStatus === 'PAID' || paymentStatus === 'EXEMPTED') {
      updateData.paidAt = new Date()
      updateData.status = 'AWAITING_PAYMENT' // Will be approved by staff
    }
    
    const updated = await prisma.amenityReservation.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: {
        amenity: true
      }
    })
    
    res.json({
      success: true,
      message: 'Payment status updated',
      data: updated
    })
  } catch (error) {
    console.error('Error updating payment:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    })
  }
})

// Check-in
router.post('/:id/check-in', async (req, res) => {
  try {
    const { checkedInBy, qrCode } = req.body
    
    // Verify QR hasn't been used
    const existing = await prisma.amenityReservation.findFirst({
      where: {
        qrCode,
        checkedInAt: { not: null }
      }
    })
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'QR code already used. Possible fraud attempt.'
      })
    }
    
    const updated = await prisma.amenityReservation.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
        checkedInBy
      },
      include: {
        amenity: true
      }
    })
    
    res.json({
      success: true,
      message: 'Check-in successful',
      data: updated
    })
  } catch (error) {
    console.error('Error checking in:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: error.message
    })
  }
})

// Cancel reservation
router.post('/:id/cancel', async (req, res) => {
  try {
    const { cancelledBy, cancellationReason } = req.body
    
    const updated = await prisma.amenityReservation.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: 'CANCELLED',
        cancelledBy,
        cancelledAt: new Date(),
        cancellationReason
      },
      include: {
        amenity: true
      }
    })
    
    res.json({
      success: true,
      message: 'Reservation cancelled',
      data: updated
    })
  } catch (error) {
    console.error('Error cancelling reservation:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel reservation',
      error: error.message
    })
  }
})

module.exports = router
