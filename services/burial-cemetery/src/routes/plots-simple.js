const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireCitizen } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Simple GET route for testing
router.get('/', requireCitizen, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Simple query without complex includes first
    const plots = await prisma.cemeteryPlot.findMany({
      take: parseInt(limit),
      orderBy: { id: 'asc' }
    });

    const total = await prisma.cemeteryPlot.count();

    res.json({
      success: true,
      data: plots,
      pagination: {
        page: 1,
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      message: 'Cemetery plots retrieved successfully (simple version)'
    });

  } catch (error) {
    console.error('Error fetching cemetery plots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cemetery plots',
      details: error.message
    });
  }
});

module.exports = router;