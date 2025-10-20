const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Similar structure to amenities route
router.get('/', async (req, res) => {
  try {
    const venues = await prisma.venue.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    res.json({ success: true, data: venues })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const venue = await prisma.venue.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ success: true, data: venue })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const venue = await prisma.venue.create({ data: req.body })
    res.status(201).json({ success: true, data: venue })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
