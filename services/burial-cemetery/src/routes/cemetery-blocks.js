const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET / - List all cemetery blocks
router.get('/', async (req, res) => {
  try {
    const { sectionId, cemeteryId } = req.query;
    
    const where = {};
    if (sectionId) {
      where.sectionId = parseInt(sectionId);
    }

    const include = {
      section: {
        select: {
          id: true,
          name: true,
          cemetery: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
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
    };

    // If cemeteryId is provided, filter by cemetery
    if (cemeteryId && !sectionId) {
      const sections = await prisma.cemeterySection.findMany({
        where: { cemeteryId: parseInt(cemeteryId) },
        select: { id: true }
      });
      
      if (sections.length > 0) {
        where.sectionId = {
          in: sections.map(s => s.id)
        };
      }
    }

    const blocks = await prisma.cemeteryBlock.findMany({
      where,
      include,
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: blocks
    });
  } catch (error) {
    console.error('Error fetching cemetery blocks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cemetery blocks'
    });
  }
});

// POST / - Create a new cemetery block
router.post('/', async (req, res) => {
  try {
    const { sectionId, name, blockType, capacity, boundary } = req.body;

    // Validate required fields
    if (!sectionId || !name) {
      return res.status(400).json({
        success: false,
        error: 'Section ID and name are required'
      });
    }

    // Verify section exists
    const section = await prisma.cemeterySection.findUnique({
      where: { id: parseInt(sectionId) }
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: 'Cemetery section not found'
      });
    }

    // Map blockType to enum value
    const blockTypeEnum = (blockType || 'standard').toUpperCase();
    const validTypes = ['STANDARD', 'PREMIUM', 'FAMILY', 'NICHE'];
    
    if (!validTypes.includes(blockTypeEnum)) {
      return res.status(400).json({
        success: false,
        error: `Invalid block type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const block = await prisma.cemeteryBlock.create({
      data: {
        sectionId: parseInt(sectionId),
        name,
        blockType: blockTypeEnum,
        capacity: capacity || 50,
        boundary: boundary || null
      },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            cemetery: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        plots: true
      }
    });

    res.status(201).json({
      success: true,
      data: block
    });
  } catch (error) {
    console.error('Error creating cemetery block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cemetery block'
    });
  }
});

// GET /:id - Get a specific cemetery block
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const block = await prisma.cemeteryBlock.findUnique({
      where: { id: parseInt(id) },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            cemetery: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
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
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        error: 'Cemetery block not found'
      });
    }

    res.json({
      success: true,
      data: block
    });
  } catch (error) {
    console.error('Error fetching cemetery block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cemetery block'
    });
  }
});

// PUT /:id - Update a cemetery block
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, blockType, capacity } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (capacity) updateData.capacity = capacity;
    
    if (blockType) {
      const blockTypeEnum = blockType.toUpperCase();
      const validTypes = ['STANDARD', 'PREMIUM', 'FAMILY', 'NICHE'];
      
      if (!validTypes.includes(blockTypeEnum)) {
        return res.status(400).json({
          success: false,
          error: `Invalid block type. Must be one of: ${validTypes.join(', ')}`
        });
      }
      updateData.blockType = blockTypeEnum;
    }

    const block = await prisma.cemeteryBlock.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        section: {
          select: {
            id: true,
            name: true,
            cemetery: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        plots: true
      }
    });

    res.json({
      success: true,
      data: block
    });
  } catch (error) {
    console.error('Error updating cemetery block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cemetery block'
    });
  }
});

// DELETE /:id - Delete a cemetery block
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if block has plots
    const block = await prisma.cemeteryBlock.findUnique({
      where: { id: parseInt(id) },
      include: {
        plots: true
      }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        error: 'Cemetery block not found'
      });
    }

    if (block.plots.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete block with existing plots. Please delete plots first.'
      });
    }

    await prisma.cemeteryBlock.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Cemetery block deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cemetery block:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cemetery block'
    });
  }
});

module.exports = router;