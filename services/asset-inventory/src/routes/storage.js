const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Get all storage zones
router.get('/zones', async (req, res) => {
  try {
    const zones = await prisma.storageZone.findMany({
      include: {
        racks: {
          include: {
            _count: {
              select: { stockLocations: true }
            }
          }
        }
      },
      orderBy: {
        zoneName: 'asc'
      }
    })

    // Calculate current occupancy for each zone (removed - field doesn't exist in schema)
    res.json({
      success: true,
      data: zones
    })
  } catch (error) {
    console.error('Error fetching storage zones:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch storage zones',
      error: error.message
    })
  }
})

// Get zone by ID
router.get('/zones/:id', async (req, res) => {
  try {
    const { id } = req.params

    const zone = await prisma.storageZone.findUnique({
      where: { id: parseInt(id) },
      include: {
        racks: {
          include: {
            stockLocations: {
              include: {
                item: true
              }
            }
          }
        }
      }
    })

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Zone not found'
      })
    }

    res.json({
      success: true,
      data: zone
    })
  } catch (error) {
    console.error('Error fetching zone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch zone',
      error: error.message
    })
  }
})

// Create new zone
router.post('/zones', async (req, res) => {
  try {
    const { zoneName, description, capacity } = req.body

    if (!zoneName) {
      return res.status(400).json({
        success: false,
        message: 'Zone name is required'
      })
    }

    // Check if zone name already exists
    const existing = await prisma.storageZone.findUnique({
      where: { zoneName }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Zone name already exists'
      })
    }

    const zone = await prisma.storageZone.create({
      data: {
        zoneName,
        description,
        capacity: capacity || null
      }
    })

    res.status(201).json({
      success: true,
      message: 'Zone created successfully',
      data: zone
    })
  } catch (error) {
    console.error('Error creating zone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create zone',
      error: error.message
    })
  }
})

// Update zone
router.put('/zones/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { zoneName, description, capacity } = req.body

    const zone = await prisma.storageZone.update({
      where: { id: parseInt(id) },
      data: {
        zoneName,
        description,
        capacity
      }
    })

    res.json({
      success: true,
      message: 'Zone updated successfully',
      data: zone
    })
  } catch (error) {
    console.error('Error updating zone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update zone',
      error: error.message
    })
  }
})

// Delete zone
router.delete('/zones/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check if zone has racks
    const racks = await prisma.storageRack.count({
      where: { zoneId: parseInt(id) }
    })

    if (racks > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete zone with existing racks'
      })
    }

    await prisma.storageZone.delete({
      where: { id: parseInt(id) }
    })

    res.json({
      success: true,
      message: 'Zone deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting zone:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete zone',
      error: error.message
    })
  }
})

// Get all racks
router.get('/racks', async (req, res) => {
  try {
    const racks = await prisma.storageRack.findMany({
      include: {
        zone: true,
        stockLocations: {
          include: {
            item: true
          }
        }
      },
      orderBy: {
        rackCode: 'asc'
      }
    })

    res.json({
      success: true,
      data: racks
    })
  } catch (error) {
    console.error('Error fetching racks:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch racks',
      error: error.message
    })
  }
})

// Create new rack
router.post('/racks', async (req, res) => {
  try {
    const { rackCode, zoneId, level, position, capacity } = req.body

    if (!rackCode || !zoneId) {
      return res.status(400).json({
        success: false,
        message: 'Rack code and zone are required'
      })
    }

    // Check if rack code already exists
    const existing = await prisma.storageRack.findUnique({
      where: { rackCode }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Rack code already exists'
      })
    }

    const rack = await prisma.storageRack.create({
      data: {
        rackCode,
        zoneId: parseInt(zoneId),
        level: level || null,
        position: position || null,
        capacity: capacity || null
      }
    })

    res.status(201).json({
      success: true,
      message: 'Rack created successfully',
      data: rack
    })
  } catch (error) {
    console.error('Error creating rack:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create rack',
      error: error.message
    })
  }
})

// Update rack
router.put('/racks/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { rackCode, zoneId, level, position, capacity } = req.body

    const rack = await prisma.storageRack.update({
      where: { id: parseInt(id) },
      data: {
        rackCode,
        zoneId: zoneId ? parseInt(zoneId) : undefined,
        level,
        position,
        capacity
      }
    })

    res.json({
      success: true,
      message: 'Rack updated successfully',
      data: rack
    })
  } catch (error) {
    console.error('Error updating rack:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update rack',
      error: error.message
    })
  }
})

// Delete rack
router.delete('/racks/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check if rack has locations
    const locations = await prisma.stockLocation.count({
      where: { rackId: parseInt(id) }
    })

    if (locations > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete rack with existing stock locations'
      })
    }

    await prisma.storageRack.delete({
      where: { id: parseInt(id) }
    })

    res.json({
      success: true,
      message: 'Rack deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting rack:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete rack',
      error: error.message
    })
  }
})

// Get all stock locations
router.get('/locations', async (req, res) => {
  try {
    const locations = await prisma.stockLocation.findMany({
      include: {
        rack: {
          include: {
            zone: true
          }
        },
        item: true
      },
      orderBy: {
        id: 'asc'
      }
    })

    res.json({
      success: true,
      data: locations
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message
    })
  }
})

// Assign stock location
router.post('/locations', async (req, res) => {
  try {
    const { tagCode, rackId, itemId, quantity, batchNumber, expiryDate } = req.body

    if (!rackId || !itemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Rack, item, and quantity are required'
      })
    }

    // Check if tag code already exists (if provided)
    if (tagCode) {
      const existing = await prisma.stockLocation.findUnique({
        where: { tagCode }
      })

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Tag code already exists'
        })
      }
    }

    const location = await prisma.stockLocation.create({
      data: {
        tagCode,
        rackId,
        itemId,
        quantity,
        batchNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'IN_STOCK'
      },
      include: {
        rack: {
          include: {
            zone: true
          }
        },
        item: true
      }
    })

    // Note: StorageRack doesn't have currentOccupancy or status fields in the schema
    // If needed, these should be calculated from stockLocations count

    res.status(201).json({
      success: true,
      message: 'Location assigned successfully',
      data: location
    })
  } catch (error) {
    console.error('Error assigning location:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to assign location',
      error: error.message
    })
  }
})

// Update stock location
router.put('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tagCode, rackId, itemId, quantity, batchNumber, expiryDate, status } = req.body

    const location = await prisma.stockLocation.update({
      where: { id: parseInt(id) },
      data: {
        ...(tagCode !== undefined && { tagCode }),
        ...(rackId !== undefined && { rackId }),
        ...(itemId !== undefined && { itemId }),
        ...(quantity !== undefined && { quantity }),
        ...(batchNumber !== undefined && { batchNumber }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(status !== undefined && { status })
      },
      include: {
        rack: {
          include: {
            zone: true
          }
        },
        item: true
      }
    })

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location
    })
  } catch (error) {
    console.error('Error updating location:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    })
  }
})

// Remove stock location
router.delete('/locations/:id', async (req, res) => {
  try {
    const { id } = req.params

    const location = await prisma.stockLocation.findUnique({
      where: { id: parseInt(id) }
    })

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      })
    }

    await prisma.stockLocation.delete({
      where: { id: parseInt(id) }
    })

    // Note: StorageRack doesn't have currentOccupancy or status fields in the schema
    // If needed, these should be calculated from stockLocations count

    res.json({
      success: true,
      message: 'Location removed successfully'
    })
  } catch (error) {
    console.error('Error removing location:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove location',
      error: error.message
    })
  }
})

module.exports = router
