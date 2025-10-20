const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Get all issuances
router.get('/', async (req, res) => {
  try {
    const { status, startDate, endDate, search } = req.query

    const where = {}

    // Filter by date range
    if (startDate || endDate) {
      where.issuedDate = {}
      if (startDate) where.issuedDate.gte = new Date(startDate)
      if (endDate) where.issuedDate.lte = new Date(endDate)
    }

    // Search by issuance number or issued to
    if (search) {
      where.OR = [
        { issuanceNumber: { contains: search, mode: 'insensitive' } },
        { issuedTo: { contains: search, mode: 'insensitive' } }
      ]
    }

    const issuances = await prisma.Issuance.findMany({
      where,
      include: {
        risRequest: {
          select: {
            risNumber: true,
            departmentName: true,
            requestedBy: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                itemName: true,
                itemCode: true,
                unitOfMeasure: true
              }
            }
          }
        },
        _count: {
          select: {
            items: true,
            stockMovements: true
          }
        }
      },
      orderBy: {
        issuedDate: 'desc'
      }
    })

    // Calculate total quantity for each issuance
    const issuancesWithTotals = issuances.map(issuance => ({
      ...issuance,
      totalQuantity: issuance.items.reduce((sum, item) => sum + item.quantity, 0),
      totalItems: issuance.items.length
    }))

    res.json({
      success: true,
      data: issuancesWithTotals
    })
  } catch (error) {
    console.error('Error fetching issuances:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issuances',
      error: error.message
    })
  }
})

// Get issuance by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const issuance = await prisma.Issuance.findUnique({
      where: { id: parseInt(id) },
      include: {
        risRequest: {
          include: {
            items: {
              include: {
                item: true
              }
            }
          }
        },
        items: {
          include: {
            item: true
          }
        },
        stockMovements: {
          include: {
            item: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!issuance) {
      return res.status(404).json({
        success: false,
        message: 'Issuance not found'
      })
    }

    // Calculate total quantity
    const totalQuantity = issuance.items.reduce((sum, item) => sum + item.quantity, 0)

    res.json({
      success: true,
      data: {
        ...issuance,
        totalQuantity
      }
    })
  } catch (error) {
    console.error('Error fetching issuance:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issuance',
      error: error.message
    })
  }
})

// Update issuance acknowledgement
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params
    const { acknowledgedBy } = req.body

    if (!acknowledgedBy) {
      return res.status(400).json({
        success: false,
        message: 'Acknowledged by is required'
      })
    }

    const issuance = await prisma.Issuance.update({
      where: { id: parseInt(id) },
      data: {
        acknowledgedBy,
        acknowledgedDate: new Date()
      },
      include: {
        risRequest: true,
        items: {
          include: {
            item: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: 'Issuance acknowledged successfully',
      data: issuance
    })
  } catch (error) {
    console.error('Error acknowledging issuance:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge issuance',
      error: error.message
    })
  }
})

// Get issuance statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const where = {}
    if (startDate || endDate) {
      where.issuedDate = {}
      if (startDate) where.issuedDate.gte = new Date(startDate)
      if (endDate) where.issuedDate.lte = new Date(endDate)
    }

    // Total issuances
    const totalIssuances = await prisma.Issuance.count({ where })

    // Acknowledged issuances
    const acknowledgedIssuances = await prisma.Issuance.count({
      where: {
        ...where,
        acknowledgedBy: { not: null }
      }
    })

    // Pending acknowledgement
    const pendingAcknowledgement = await prisma.Issuance.count({
      where: {
        ...where,
        acknowledgedBy: null
      }
    })

    // Total items issued
    const issuances = await prisma.Issuance.findMany({
      where,
      include: {
        items: true
      }
    })

    const totalItemsIssued = issuances.reduce((sum, issuance) => {
      return sum + issuance.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    // Top issued items
    const itemIssuances = {}
    issuances.forEach(issuance => {
      issuance.items.forEach(item => {
        if (!itemIssuances[item.itemId]) {
          itemIssuances[item.itemId] = 0
        }
        itemIssuances[item.itemId] += item.quantity
      })
    })

    const topIssuedItemIds = Object.entries(itemIssuances)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([itemId]) => parseInt(itemId))

    const topIssuedItems = await prisma.Item.findMany({
      where: {
        id: { in: topIssuedItemIds }
      },
      select: {
        id: true,
        itemName: true,
        itemCode: true,
        unitOfMeasure: true
      }
    })

    const topIssuedItemsWithQuantity = topIssuedItems.map(item => ({
      ...item,
      totalIssued: itemIssuances[item.id]
    }))

    res.json({
      success: true,
      data: {
        totalIssuances,
        acknowledgedIssuances,
        pendingAcknowledgement,
        totalItemsIssued,
        topIssuedItems: topIssuedItemsWithQuantity,
        acknowledgementRate: totalIssuances > 0 
          ? ((acknowledgedIssuances / totalIssuances) * 100).toFixed(1)
          : 0
      }
    })
  } catch (error) {
    console.error('Error fetching issuance statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issuance statistics',
      error: error.message
    })
  }
})

// Get issuances by department
router.get('/stats/by-department', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const where = {}
    if (startDate || endDate) {
      where.issuedDate = {}
      if (startDate) where.issuedDate.gte = new Date(startDate)
      if (endDate) where.issuedDate.lte = new Date(endDate)
    }

    const issuances = await prisma.Issuance.findMany({
      where,
      include: {
        risRequest: {
          select: {
            departmentName: true
          }
        },
        items: true
      }
    })

    // Group by department
    const departmentStats = {}
    issuances.forEach(issuance => {
      const dept = issuance.risRequest.departmentName
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          department: dept,
          totalIssuances: 0,
          totalItems: 0
        }
      }
      departmentStats[dept].totalIssuances++
      departmentStats[dept].totalItems += issuance.items.reduce((sum, item) => sum + item.quantity, 0)
    })

    const stats = Object.values(departmentStats).sort((a, b) => b.totalIssuances - a.totalIssuances)

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching department statistics:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department statistics',
      error: error.message
    })
  }
})

module.exports = router
