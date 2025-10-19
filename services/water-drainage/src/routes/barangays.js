const express = require('express');
const router = express.Router();
const prisma = require('../database/prisma');

// GET /api/barangays - Get all barangays
router.get('/', async (req, res) => {
  try {
    const { district, search } = req.query;

    const where = {};
    if (district) where.district = district;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const barangays = await prisma.barangay.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: barangays
    });
  } catch (error) {
    console.error('Error fetching barangays:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/barangays - Create new barangay
router.post('/', async (req, res) => {
  try {
    const { name, district, population } = req.body;

    const barangay = await prisma.barangay.create({
      data: {
        name,
        district,
        population: population ? parseInt(population) : null
      }
    });

    res.status(201).json({
      success: true,
      data: barangay,
      message: 'Barangay created successfully'
    });
  } catch (error) {
    console.error('Error creating barangay:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/barangays/:id - Update barangay
router.put('/:id', async (req, res) => {
  try {
    const { name, district, population } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (district) updateData.district = district;
    if (population !== undefined) updateData.population = population ? parseInt(population) : null;

    const barangay = await prisma.barangay.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });

    res.json({
      success: true,
      data: barangay,
      message: 'Barangay updated successfully'
    });
  } catch (error) {
    console.error('Error updating barangay:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/barangays/:id - Delete barangay
router.delete('/:id', async (req, res) => {
  try {
    await prisma.barangay.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({
      success: true,
      message: 'Barangay deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting barangay:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
