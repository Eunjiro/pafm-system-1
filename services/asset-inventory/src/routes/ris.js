const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Get all RIS requests
router.get('/', async (req, res) => {
  try {
    const { status } = req.query

    const where = status ? { status } : {}

    const requests = await prisma.rISRequest.findMany({
      where,
      include: {
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

    res.json({
      success: true,
      data: requests
    })
  } catch (error) {
    console.error('Error fetching RIS requests:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RIS requests',
      error: error.message
    })
  }
})

// Get RIS request by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const request = await prisma.rISRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'RIS request not found'
      })
    }

    res.json({
      success: true,
      data: request
    })
  } catch (error) {
    console.error('Error fetching RIS request:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RIS request',
      error: error.message
    })
  }
})

// Create new RIS request
router.post('/', async (req, res) => {
  try {
    const {
      departmentName,
      requestedBy,
      requestedByEmail,
      purpose,
      dateNeeded,
      items
    } = req.body

    if (!departmentName || !requestedBy || !purpose || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      })
    }

    // Generate RIS number
    const year = new Date().getFullYear()
    const count = await prisma.rISRequest.count()
    const risNumber = `RIS-${year}-${String(count + 1).padStart(5, '0')}`

    // Create RIS request with items
    const request = await prisma.rISRequest.create({
      data: {
        risNumber,
        departmentName,
        requestedBy,
        requestedByEmail: requestedByEmail || null,
        purpose,
        dateNeeded: dateNeeded ? new Date(dateNeeded) : null,
        status: 'PENDING_APPROVAL',
        items: {
          create: items.map(item => ({
            itemId: item.itemId,
            quantityRequested: item.quantityRequested,
            justification: item.justification || null,
            remarks: item.remarks || null
          }))
        }
      },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      message: 'RIS request created successfully',
      data: request
    })
  } catch (error) {
    console.error('Error creating RIS request:', error)
    console.error('Error details:', error.message)
    console.error('Request body:', req.body)
    res.status(500).json({
      success: false,
      message: 'Failed to create RIS request',
      error: error.message
    })
  }
})

// Approve RIS request
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params
    const { approvedBy } = req.body

    if (!approvedBy) {
      return res.status(400).json({
        success: false,
        message: 'Approver name is required'
      })
    }

    const risRequest = await prisma.rISRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    if (!risRequest) {
      return res.status(404).json({
        success: false,
        message: 'RIS request not found'
      })
    }

    if (risRequest.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be approved'
      })
    }

    // Check stock availability
    let hasNoStock = false
    for (const item of risRequest.items) {
      // Get current stock from stockMovement
      const movements = await prisma.stockMovement.findMany({
        where: { itemId: item.itemId },
        orderBy: { createdAt: 'desc' }
      })
      
      const currentStock = movements.length > 0 ? movements[0].balanceAfter : 0
      
      if (currentStock < item.quantityRequested) {
        hasNoStock = true
        // Update item with available quantity
        await prisma.risItem.update({
          where: { id: item.id },
          data: {
            quantityApproved: Math.max(0, currentStock),
            remarks: `Insufficient stock. Only ${currentStock} available.`
          }
        })
      } else {
        // Approve requested quantity
        await prisma.risItem.update({
          where: { id: item.id },
          data: {
            quantityApproved: item.quantityRequested
          }
        })
      }
    }

    // Update RIS status
    const updatedRequest = await prisma.rISRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: hasNoStock ? 'NO_STOCK' : 'APPROVED',
        approvedBy,
        approvedAt: new Date()
      },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    res.json({
      success: true,
      message: hasNoStock ? 'RIS approved with stock limitations' : 'RIS approved successfully',
      data: updatedRequest
    })
  } catch (error) {
    console.error('Error approving RIS request:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to approve RIS request',
      error: error.message
    })
  }
})

// Reject RIS request
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params
    const { rejectedBy, rejectionReason } = req.body

    const request = await prisma.rISRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason
      }
    })

    res.json({
      success: true,
      message: 'RIS request rejected',
      data: request
    })
  } catch (error) {
    console.error('Error rejecting RIS request:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reject RIS request',
      error: error.message
    })
  }
})

// Issue items (fulfill RIS)
router.post('/:id/issue', async (req, res) => {
  try {
    const { id } = req.params
    const { issuedBy } = req.body

    if (!issuedBy) {
      return res.status(400).json({
        success: false,
        message: 'Issuer name is required'
      })
    }

    const risRequest = await prisma.rISRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    if (!risRequest) {
      return res.status(404).json({
        success: false,
        message: 'RIS request not found'
      })
    }

    if (risRequest.status !== 'APPROVED' && risRequest.status !== 'NO_STOCK') {
      return res.status(400).json({
        success: false,
        message: 'Only approved requests can be issued'
      })
    }

    // Create issuance record
    const issuance = await prisma.issuance.create({
      data: {
        issuanceNumber: `ISS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        risRequestId: risRequest.id,
        issuedTo: risRequest.requestedBy,
        departmentName: risRequest.departmentName,
        issuedBy,
        issuedAt: new Date(),
        purpose: risRequest.purpose,
        status: 'ISSUED'
      }
    })

    // Process each item
    for (const item of risRequest.items) {
      const quantityToIssue = item.quantityApproved || 0

      if (quantityToIssue > 0) {
        // Get current stock from latest stock movement
        const latestMovement = await prisma.stockMovement.findFirst({
          where: { itemId: item.itemId },
          orderBy: { createdAt: 'desc' }
        })
        
        const currentBalance = latestMovement ? latestMovement.balanceAfter : 0

        // Create stock movement
        await prisma.stockMovement.create({
          data: {
            itemId: item.itemId,
            movementType: 'OUT',
            quantity: quantityToIssue,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance - quantityToIssue,
            referenceNumber: risRequest.risNumber,
            performedBy: issuedBy,
            remarks: `Issued to ${risRequest.departmentName} - ${risRequest.purpose}`
          }
        })

        // Create issuance item record
        await prisma.issuanceItem.create({
          data: {
            issuanceId: issuance.id,
            itemId: item.itemId,
            quantityIssued: quantityToIssue,
            unitCost: item.item.unitCost || 0,
            totalCost: quantityToIssue * (item.item.unitCost || 0)
          }
        })
      }
    }

    // Update RIS status
    await prisma.rISRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: 'ISSUED',
        issuedBy,
        issuedAt: new Date()
      }
    })

    res.json({
      success: true,
      message: 'Items issued successfully',
      data: issuance
    })
  } catch (error) {
    console.error('Error issuing items:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to issue items',
      error: error.message
    })
  }
})

// Delete RIS request (only if pending)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const request = await prisma.rISRequest.findUnique({
      where: { id: parseInt(id) }
    })

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'RIS request not found'
      })
    }

    if (request.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be deleted'
      })
    }

    // Delete items first (cascade should handle this, but being explicit)
    await prisma.risItem.deleteMany({
      where: { risId: parseInt(id) }
    })

    // Delete request
    await prisma.rISRequest.delete({
      where: { id: parseInt(id) }
    })

    res.json({
      success: true,
      message: 'RIS request deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting RIS request:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete RIS request',
      error: error.message
    })
  }
})

module.exports = router
