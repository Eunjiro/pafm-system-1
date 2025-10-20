const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Get all amenities
router.get('/', async (req, res) => {
  try {
    const { type, isActive } = req.query
    
    const where = {}
    if (type) where.type = type
    if (isActive !== undefined) where.isActive = isActive === 'true'
    
    const amenities = await prisma.amenity.findMany({
      where,
      orderBy: { name: 'asc' }
    })
    
    res.json({
      success: true,
      data: amenities
    })
  } catch (error) {
    console.error('Error fetching amenities:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch amenities',
      error: error.message
    })
  }
})

// Get single amenity
router.get('/:id', async (req, res) => {
  try {
    const amenity = await prisma.amenity.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        reservations: {
          where: {
            status: {
              in: ['APPROVED', 'CHECKED_IN']
            }
          },
          orderBy: { reservationDate: 'asc' }
        }
      }
    })
    
    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found'
      })
    }
    
    res.json({
      success: true,
      data: amenity
    })
  } catch (error) {
    console.error('Error fetching amenity:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch amenity',
      error: error.message
    })
  }
})

// Create amenity
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      capacity,
      hourlyRate,
      dailyRate,
      imageUrl
    } = req.body
    
    const amenity = await prisma.amenity.create({
      data: {
        name,
        type,
        description,
        capacity: parseInt(capacity),
        hourlyRate: parseFloat(hourlyRate),
        dailyRate: parseFloat(dailyRate),
        imageUrl
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Amenity created successfully',
      data: amenity
    })
  } catch (error) {
    console.error('Error creating amenity:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create amenity',
      error: error.message
    })
  }
})

// Update amenity
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      capacity,
      hourlyRate,
      dailyRate,
      imageUrl,
      isActive
    } = req.body
    
    const amenity = await prisma.amenity.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        type,
        description,
        capacity: capacity ? parseInt(capacity) : undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        dailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
        imageUrl,
        isActive
      }
    })
    
    res.json({
      success: true,
      message: 'Amenity updated successfully',
      data: amenity
    })
  } catch (error) {
    console.error('Error updating amenity:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update amenity',
      error: error.message
    })
  }
})

// Delete amenity
router.delete('/:id', async (req, res) => {
  try {
    await prisma.amenity.delete({
      where: { id: parseInt(req.params.id) }
    })
    
    res.json({
      success: true,
      message: 'Amenity deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting amenity:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete amenity',
      error: error.message
    })
  }
})

// Check availability
router.post('/:id/check-availability', async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body
    const amenityId = parseInt(req.params.id)
    
    // Check for conflicting reservations
    const conflicts = await prisma.amenityReservation.findMany({
      where: {
        amenityId,
        reservationDate: new Date(date),
        status: {
          in: ['APPROVED', 'CHECKED_IN', 'AWAITING_PAYMENT']
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
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    })
    
    res.json({
      success: true,
      available: conflicts.length === 0,
      conflicts: conflicts.length
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    })
  }
})

module.exports = router
