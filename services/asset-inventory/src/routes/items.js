const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Get all items
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query

    const where = {}

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { itemCode: { contains: search, mode: 'insensitive' } },
        { itemName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        stockLocations: {
          include: {
            rack: {
              include: {
                zone: true
              }
            }
          }
        },
        _count: {
          select: {
            stockMovements: true,
            risItems: true
          }
        }
      },
      orderBy: {
        itemName: 'asc'
      }
    })

    // Calculate current stock from stock movements
    const itemsWithStock = await Promise.all(
      items.map(async (item) => {
        const stockMovements = await prisma.stockMovement.findMany({
          where: { itemId: item.id },
          orderBy: { createdAt: 'desc' },
          take: 1
        })
        
        const currentStock = stockMovements.length > 0 ? parseInt(stockMovements[0].balanceAfter) : 0

        return {
          ...item,
          currentStock,
          isActive: item.isActive !== false // Default to true if not set
        }
      })
    )

    res.json({
      success: true,
      data: itemsWithStock
    })
  } catch (error) {
    console.error('Error fetching items:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error.message
    })
  }
})

// Get item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const item = await prisma.item.findUnique({
      where: { id: parseInt(id) },
      include: {
        stockLocations: {
          include: {
            rack: {
              include: {
                zone: true
              }
            }
          }
        },
        stockMovements: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      })
    }

    // Get current stock from latest stock movement
    const latestMovement = await prisma.stockMovement.findFirst({
      where: { itemId: item.id },
      orderBy: { createdAt: 'desc' }
    })
    
    const currentStock = latestMovement ? parseInt(latestMovement.balanceAfter) : 0

    res.json({
      success: true,
      data: {
        ...item,
        currentStock
      }
    })
  } catch (error) {
    console.error('Error fetching item:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item',
      error: error.message
    })
  }
})

// Create new item
router.post('/', async (req, res) => {
  try {
    const {
      itemCode,
      itemName,
      description,
      category,
      unitOfMeasure,
      unitPrice,
      reorderLevel,
      status
    } = req.body

    if (!itemCode || !itemName || !category || !unitOfMeasure) {
      return res.status(400).json({
        success: false,
        message: 'Item code, name, category, and unit of measure are required'
      })
    }

    // Check if item code already exists
    const existing = await prisma.item.findUnique({
      where: { itemCode }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Item code already exists'
      })
    }

    const item = await prisma.item.create({
      data: {
        itemCode,
        itemName,
        description,
        category,
        unitOfMeasure,
        unitCost: unitPrice || 0,
        reorderLevel: reorderLevel || 10
      }
    })

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item
    })
  } catch (error) {
    console.error('Error creating item:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error.message
    })
  }
})

// Update item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      itemCode,
      itemName,
      description,
      category,
      unitOfMeasure,
      unitPrice,
      reorderLevel
    } = req.body

    const item = await prisma.item.update({
      where: { id: parseInt(id) },
      data: {
        itemCode,
        itemName,
        description,
        category,
        unitOfMeasure,
        unitCost: unitPrice,
        reorderLevel
      }
    })

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item
    })
  } catch (error) {
    console.error('Error updating item:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error.message
    })
  }
})

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check if item has stock movements
    const movements = await prisma.stockMovement.count({
      where: { itemId: parseInt(id) }
    })

    if (movements > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item with existing stock movements'
      })
    }

    await prisma.item.delete({
      where: { id: parseInt(id) }
    })

    res.json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting item:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error.message
    })
  }
})

// Get item stock history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params
    const { limit = 50 } = req.query

    const movements = await prisma.stockMovement.findMany({
      where: { itemId: parseInt(id) },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    })

    res.json({
      success: true,
      data: movements
    })
  } catch (error) {
    console.error('Error fetching item history:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch item history',
      error: error.message
    })
  }
})

module.exports = router
