const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET / - List all cemetery sections
router.get('/', async (req, res) => {
  try {
    const { cemeteryId } = req.query;
    
    const where = {};
    if (cemeteryId) {
      where.cemeteryId = parseInt(cemeteryId);
    }

    const sections = await prisma.cemeterySection.findMany({
      where,
      include: {
        cemetery: {
          select: {
            id: true,
            name: true
          }
        },
        blocks: {
          include: {
            plots: {
              include: {
                assignments: {
                  include: {
                    deceased: true
                  }
                },
                gravestones: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: sections
    });
  } catch (error) {
    console.error('Error fetching cemetery sections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cemetery sections'
    });
  }
});

// POST / - Create a new cemetery section
router.post('/', async (req, res) => {
  try {
    const { cemeteryId, name, description, capacity, boundary } = req.body;

    // Validate required fields
    if (!cemeteryId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Cemetery ID and name are required'
      });
    }

    // Verify cemetery exists
    const cemetery = await prisma.cemetery.findUnique({
      where: { id: parseInt(cemeteryId) }
    });

    if (!cemetery) {
      return res.status(404).json({
        success: false,
        error: 'Cemetery not found'
      });
    }

    const section = await prisma.cemeterySection.create({
      data: {
        cemeteryId: parseInt(cemeteryId),
        name,
        description: description || '',
        capacity: capacity || 100,
        boundary: boundary || null
      },
      include: {
        cemetery: {
          select: {
            id: true,
            name: true
          }
        },
        blocks: true
      }
    });

    res.status(201).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error creating cemetery section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cemetery section'
    });
  }
});

// GET /:id - Get a specific cemetery section
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const section = await prisma.cemeterySection.findUnique({
      where: { id: parseInt(id) },
      include: {
        cemetery: {
          select: {
            id: true,
            name: true
          }
        },
        blocks: {
          include: {
            plots: {
              include: {
                assignments: {
                  include: {
                    deceased: true
                  }
                },
                gravestones: true
              }
            }
          }
        }
      }
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Cemetery section not found'
      });
    }

    res.json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error fetching cemetery section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cemetery section'
    });
  }
});

// PUT /:id - Update a cemetery section
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, capacity } = req.body;

    const section = await prisma.cemeterySection.update({
      where: { id: parseInt(id) },
      data: {
        name: name || undefined,
        description: description || undefined,
        capacity: capacity || undefined
      },
      include: {
        cemetery: {
          select: {
            id: true,
            name: true
          }
        },
        blocks: true
      }
    });

    res.json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error updating cemetery section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cemetery section'
    });
  }
});

// DELETE /:id - Delete a cemetery section
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if section has blocks
    const section = await prisma.cemeterySection.findUnique({
      where: { id: parseInt(id) },
      include: {
        blocks: true
      }
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Cemetery section not found'
      });
    }

    if (section.blocks.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete section with existing blocks. Please delete blocks first.'
      });
    }

    await prisma.cemeterySection.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Cemetery section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cemetery section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cemetery section'
    });
  }
});

module.exports = router;