const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  try {
    const parks = await prisma.park.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    res.json({ success: true, data: parks })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
