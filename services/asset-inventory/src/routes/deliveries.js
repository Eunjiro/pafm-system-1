const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/deliveries')
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept PDF files only
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// Get all deliveries
router.get('/', async (req, res) => {
  try {
    const { status } = req.query

    const where = status ? { status } : {}

    const deliveries = await prisma.deliveryReceipt.findMany({
      where,
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        },
        supplier: true,
        items: {
          include: {
            item: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data to match frontend expectations
    const transformedDeliveries = deliveries.map(delivery => ({
      id: delivery.id,
      deliveryNumber: delivery.drNumber,
      poNumber: delivery.purchaseOrder?.poNumber || 'N/A',
      drNumber: delivery.drNumber,
      supplier: {
        name: delivery.supplier.name
      },
      deliveryDate: delivery.deliveryDate,
      receivedBy: delivery.receivedBy,
      status: delivery.status,
      items: delivery.items.map(deliveryItem => ({
        itemCode: deliveryItem.item.itemCode,
        itemName: deliveryItem.item.itemName,
        description: deliveryItem.item.description,
        category: deliveryItem.item.category,
        unitOfMeasure: deliveryItem.item.unitOfMeasure,
        quantityOrdered: deliveryItem.quantityOrdered,
        quantityReceived: deliveryItem.quantityDelivered,
        unitPrice: parseFloat(deliveryItem.item.unitCost || 0),
        totalAmount: parseFloat(deliveryItem.item.unitCost || 0) * deliveryItem.quantityDelivered,
        remarks: deliveryItem.remarks
      })),
      poFileUrl: delivery.purchaseOrder?.poDocumentUrl || null,
      drFileUrl: delivery.drDocumentUrl,
      createdAt: delivery.createdAt
    }))

    res.json({
      success: true,
      data: transformedDeliveries
    })
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deliveries',
      error: error.message
    })
  }
})

// Create new delivery with file uploads
router.post('/', upload.fields([
  { name: 'poFile', maxCount: 1 },
  { name: 'drFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      supplierId,
      poNumber,
      drNumber,
      deliveryDate,
      receivedBy,
      items
    } = req.body

    // Validation
    if (!supplierId || !poNumber || !drNumber || !deliveryDate || !receivedBy || !items) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      })
    }

    const parsedItems = JSON.parse(items)

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      })
    }

    // Get file URLs
    const poFileUrl = req.files['poFile'] ? `/uploads/deliveries/${req.files['poFile'][0].filename}` : null
    const drFileUrl = req.files['drFile'] ? `/uploads/deliveries/${req.files['drFile'][0].filename}` : null

    // Generate delivery number if not provided
    const deliveryNumber = `DEL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Create transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create or find Purchase Order
      let purchaseOrder = await tx.purchaseOrder.findFirst({
        where: { poNumber }
      })

      if (!purchaseOrder) {
        purchaseOrder = await tx.purchaseOrder.create({
          data: {
            poNumber,
            supplierId: parseInt(supplierId),
            poDate: new Date(deliveryDate),
            expectedDelivery: new Date(deliveryDate),
            totalAmount: parsedItems.reduce((sum, item) => sum + item.totalAmount, 0),
            poDocumentUrl: poFileUrl,
            createdBy: receivedBy,
            remarks: 'Auto-created from delivery receipt'
          }
        })
      }

      // First, create or get items in the catalog
      const itemRecords = await Promise.all(
        parsedItems.map(async (item) => {
          let catalogItem = await tx.item.findUnique({
            where: { itemCode: item.itemCode }
          })

          if (!catalogItem) {
            catalogItem = await tx.item.create({
              data: {
                itemCode: item.itemCode,
                itemName: item.itemName,
                description: item.description,
                category: item.category,
                unitOfMeasure: item.unitOfMeasure,
                unitCost: item.unitPrice,
                reorderLevel: 10
              }
            })
          }

          return catalogItem
        })
      )

      // Create Delivery Receipt
      const deliveryReceipt = await tx.deliveryReceipt.create({
        data: {
          drNumber,
          poId: purchaseOrder.id,
          supplierId: parseInt(supplierId),
          deliveryDate: new Date(deliveryDate),
          receivedBy,
          receivedDate: new Date(),
          status: 'PENDING_VERIFICATION',
          drDocumentUrl: drFileUrl
        }
      })

      // Create Delivery Items
      const deliveryItems = await Promise.all(
        parsedItems.map((item, index) =>
          tx.deliveryItem.create({
            data: {
              drId: deliveryReceipt.id,
              itemId: itemRecords[index].id,
              quantityOrdered: item.quantityOrdered,
              quantityDelivered: item.quantityReceived,
              quantityAccepted: item.quantityReceived,
              quantityRejected: 0,
              remarks: item.remarks
            }
          })
        )
      )

      return { deliveryReceipt, deliveryItems }
    })

    res.status(201).json({
      success: true,
      message: 'Delivery recorded successfully',
      data: result.deliveryReceipt
    })
  } catch (error) {
    console.error('Error creating delivery:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create delivery',
      error: error.message
    })
  }
})

// Update delivery status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['PENDING_VERIFICATION', 'VERIFIED', 'STORED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      })
    }

    const delivery = await prisma.deliveryReceipt.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        verifiedBy: status === 'VERIFIED' || status === 'STORED' ? req.body.verifiedBy || 'System' : undefined,
        verifiedAt: status === 'VERIFIED' || status === 'STORED' ? new Date() : undefined
      }
    })

    // If status is STORED, create stock entries
    if (status === 'STORED') {
      const items = await prisma.deliveryItem.findMany({
        where: { drId: parseInt(id) },
        include: { item: true }
      })

      for (const deliveryItem of items) {
        // Create stock movement
        await prisma.stockMovement.create({
          data: {
            itemId: deliveryItem.itemId,
            movementType: 'RECEIVED',
            quantityIn: deliveryItem.quantityAccepted,
            quantityOut: 0,
            balanceAfter: deliveryItem.quantityAccepted,
            referenceNumber: delivery.drNumber,
            performedBy: delivery.receivedBy,
            remarks: `Delivery from DR: ${delivery.drNumber}`
          }
        })
      }
    }

    res.json({
      success: true,
      message: `Delivery ${status.toLowerCase().replace('_', ' ')} successfully`,
      data: delivery
    })
  } catch (error) {
    console.error('Error updating delivery status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery status',
      error: error.message
    })
  }
})

module.exports = router
