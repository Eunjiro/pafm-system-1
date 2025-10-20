const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await prisma.Supplier.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    res.json({
      success: true,
      data: suppliers
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: error.message
    })
  }
})

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const supplier = await prisma.Supplier.findUnique({
      where: { id: parseInt(id) },
      include: {
        purchase_orders: {
          include: {
            delivery_receipts: true
          }
        }
      }
    })

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      })
    }

    res.json({
      success: true,
      data: supplier
    })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier',
      error: error.message
    })
  }
})

// Create new supplier
router.post('/', async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      contactNumber,
      email,
      address,
      tinNumber,
      businessType
    } = req.body

    // Validation
    if (!name || !contactPerson || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Name, contact person, and contact number are required'
      })
    }

    const supplier = await prisma.Supplier.create({
      data: {
        name,
        contactPerson,
        contactNumber,
        email,
        address,
        tinNumber,
        businessType
      }
    })

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    })
  } catch (error) {
    console.error('Error creating supplier:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier',
      error: error.message
    })
  }
})

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      contactPerson,
      contactNumber,
      email,
      address,
      tinNumber,
      businessType
    } = req.body

    const supplier = await prisma.Supplier.update({
      where: { id: parseInt(id) },
      data: {
        name,
        contactPerson,
        contactNumber,
        email,
        address,
        tinNumber,
        businessType
      }
    })

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    })
  } catch (error) {
    console.error('Error updating supplier:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier',
      error: error.message
    })
  }
})

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    await prisma.Supplier.delete({
      where: { id: parseInt(id) }
    })

    res.json({
      success: true,
      message: 'Supplier deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier',
      error: error.message
    })
  }
})

module.exports = router
