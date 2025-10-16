const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireCitizen, requireEmployee } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET / - List all cemeteries
router.get('/', requireCitizen, async (req, res) => {
  try {
    const cemeteries = await prisma.cemetery.findMany({
      where: { isActive: true },
      include: {
        sections: {
          include: {
            blocks: {
              include: {
                plots: {
                  include: {
                    assignments: {
                      include: {
                        deceased: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            plots: true,
            sections: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: cemeteries,
      message: 'Cemeteries retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching cemeteries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cemeteries',
      details: error.message
    });
  }
});

// GET /:id - Get specific cemetery with full structure
router.get('/:id', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;

    const cemetery = await prisma.cemetery.findUnique({
      where: { id: parseInt(id) },
      include: {
        sections: {
          include: {
            blocks: {
              include: {
                plots: {
                  include: {
                    assignments: {
                      where: { status: 'OCCUPIED' },
                      include: {
                        deceased: {
                          select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            middleName: true,
                            dateOfBirth: true,
                            dateOfDeath: true
                          }
                        }
                      },
                      orderBy: { assignedAt: 'desc' },
                      take: 1
                    },
                    gravestones: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            plots: true,
            sections: true
          }
        }
      }
    });

    if (!cemetery) {
      return res.status(404).json({
        success: false,
        error: 'Cemetery not found'
      });
    }

    res.json({
      success: true,
      data: cemetery,
      message: 'Cemetery details retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching cemetery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cemetery',
      details: error.message
    });
  }
});

// GET /:id/sections - Get sections for a specific cemetery
router.get('/:id/sections', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;

    const sections = await prisma.cemeterySection.findMany({
      where: { cemeteryId: parseInt(id) },
      include: {
        blocks: {
          include: {
            plots: {
              include: {
                assignments: {
                  where: { status: 'OCCUPIED' },
                  include: {
                    deceased: true
                  },
                  take: 1,
                  orderBy: { assignedAt: 'desc' }
                }
              }
            }
          }
        },
        _count: {
          select: {
            blocks: true,
            plots: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: sections,
      message: 'Cemetery sections retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching cemetery sections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cemetery sections',
      details: error.message
    });
  }
});

// GET /:id/statistics - Get statistics for a specific cemetery
router.get('/:id/statistics', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;

    // Get plot counts by status
    const plotStats = await prisma.cemeteryPlot.groupBy({
      by: ['status'],
      where: { cemeteryId: parseInt(id) },
      _count: { status: true }
    });

    // Get total counts
    const totalPlots = await prisma.cemeteryPlot.count({
      where: { cemeteryId: parseInt(id) }
    });

    const totalSections = await prisma.cemeterySection.count({
      where: { cemeteryId: parseInt(id) }
    });

    const totalBlocks = await prisma.cemeteryBlock.count({
      where: { section: { cemeteryId: parseInt(id) } }
    });

    // Calculate occupancy rate
    const occupiedCount = plotStats.find(stat => stat.status === 'OCCUPIED')?._count.status || 0;
    const occupancyRate = totalPlots > 0 ? (occupiedCount / totalPlots) * 100 : 0;

    // Transform plot stats to match frontend expectations
    const statusBreakdown = {
      totalPlots,
      vacantPlots: plotStats.find(stat => stat.status === 'VACANT')?._count.status || 0,
      reservedPlots: plotStats.find(stat => stat.status === 'RESERVED')?._count.status || 0,
      occupiedPlots: occupiedCount,
      blockedPlots: plotStats.find(stat => stat.status === 'BLOCKED')?._count.status || 0,
      totalAssignments: occupiedCount,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      totalSections,
      totalBlocks
    };

    res.json({
      success: true,
      data: statusBreakdown,
      message: 'Cemetery statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching cemetery statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cemetery statistics',
      details: error.message
    });
  }
});

// POST / - Create new cemetery (admin/employee only)
router.post('/', requireEmployee, async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      postalCode,
      establishedDate,
      totalArea,
      boundary,
      standardPrice,
      largePrice,
      familyPrice,
      nichePrice,
      maintenanceFee
    } = req.body;

    const newCemetery = await prisma.cemetery.create({
      data: {
        name,
        description,
        address,
        city,
        postalCode,
        establishedDate: establishedDate ? new Date(establishedDate) : null,
        totalArea: totalArea ? parseFloat(totalArea) : null,
        boundary: boundary || null,
        standardPrice: standardPrice ? parseFloat(standardPrice) : 5000.00,
        largePrice: largePrice ? parseFloat(largePrice) : 8000.00,
        familyPrice: familyPrice ? parseFloat(familyPrice) : 15000.00,
        nichePrice: nichePrice ? parseFloat(nichePrice) : 3000.00,
        maintenanceFee: maintenanceFee ? parseFloat(maintenanceFee) : 500.00,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      data: newCemetery,
      message: 'Cemetery created successfully'
    });

  } catch (error) {
    console.error('Error creating cemetery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create cemetery',
      details: error.message
    });
  }
});

// DELETE /:id - Delete cemetery (admin/employee only)
router.delete('/:id', requireEmployee, async (req, res) => {
  try {
    const cemeteryId = parseInt(req.params.id);
    const cascade = req.query.cascade === 'true';

    if (isNaN(cemeteryId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cemetery ID'
      });
    }

    // Check if cemetery exists
    const existingCemetery = await prisma.cemetery.findUnique({
      where: { id: cemeteryId },
      include: {
        _count: {
          select: {
            plots: true,
            sections: true
          }
        }
      }
    });

    if (!existingCemetery) {
      return res.status(404).json({
        success: false,
        error: 'Cemetery not found'
      });
    }

    // If cascade is true, delete all related data first
    if (cascade) {
      console.log(`🗑️ Cascade deleting cemetery ${cemeteryId} with ${existingCemetery._count.plots} plots and ${existingCemetery._count.sections} sections`);
      
      // Use transaction to ensure all deletions succeed or fail together
      await prisma.$transaction(async (tx) => {
        // First, delete all plot assignments for plots in this cemetery
        await tx.plotAssignment.deleteMany({
          where: {
            plot: {
              cemeteryId: cemeteryId
            }
          }
        });

        // Delete all gravestones for plots in this cemetery
        await tx.gravestone.deleteMany({
          where: {
            plot: {
              cemeteryId: cemeteryId
            }
          }
        });

        // Delete all plots in this cemetery
        await tx.cemeteryPlot.deleteMany({
          where: {
            cemeteryId: cemeteryId
          }
        });

        // Delete all blocks in sections of this cemetery
        await tx.cemeteryBlock.deleteMany({
          where: {
            section: {
              cemeteryId: cemeteryId
            }
          }
        });

        // Delete all sections in this cemetery
        await tx.cemeterySection.deleteMany({
          where: {
            cemeteryId: cemeteryId
          }
        });

        // Finally, delete the cemetery itself
        await tx.cemetery.delete({
          where: { id: cemeteryId }
        });
      });

      console.log(`✅ Successfully cascade deleted cemetery ${cemeteryId}`);
    } else {
      // Original behavior - check if cemetery has plots or sections
      if (existingCemetery._count.plots > 0 || existingCemetery._count.sections > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete cemetery with existing plots or sections. Please remove all plots and sections first.'
        });
      }

      // Delete the cemetery
      await prisma.cemetery.delete({
        where: { id: cemeteryId }
      });
    }

    res.json({
      success: true,
      message: 'Cemetery deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting cemetery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete cemetery',
      details: error.message
    });
  }
});

// DELETE /plots/:plotId - Delete cemetery plot (admin/employee only)
router.delete('/plots/:plotId', requireEmployee, async (req, res) => {
  try {
    const plotId = parseInt(req.params.plotId);

    if (isNaN(plotId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plot ID'
      });
    }

    // Check if plot exists
    const existingPlot = await prisma.cemeteryPlot.findUnique({
      where: { id: plotId },
      include: {
        assignments: true,
        gravestones: true
      }
    });

    if (!existingPlot) {
      return res.status(404).json({
        success: false,
        error: 'Plot not found'
      });
    }

    // Check if plot has assignments
    if (existingPlot.assignments && existingPlot.assignments.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete plot with existing assignments. Please remove all assignments first.'
      });
    }

    // Delete gravestones first (if any)
    if (existingPlot.gravestones && existingPlot.gravestones.length > 0) {
      await prisma.gravestone.deleteMany({
        where: { plotId: plotId }
      });
    }

    // Delete the plot
    await prisma.cemeteryPlot.delete({
      where: { id: plotId }
    });

    res.json({
      success: true,
      message: 'Plot deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting plot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete plot',
      details: error.message
    });
  }
});

// PUT /plots/:plotId - Update cemetery plot (admin/employee only)
router.put('/plots/:plotId', requireEmployee, async (req, res) => {
  try {
    const plotId = parseInt(req.params.plotId);

    if (isNaN(plotId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plot ID'
      });
    }

    const {
      plotNumber,
      plotCode,
      size,
      status,
      baseFee,
      maintenanceFee,
      length,
      width,
      depth,
      orientation,
      accessibility,
      latitude,
      longitude,
      notes
    } = req.body;

    // Check if plot exists
    const existingPlot = await prisma.cemeteryPlot.findUnique({
      where: { id: plotId }
    });

    if (!existingPlot) {
      return res.status(404).json({
        success: false,
        error: 'Plot not found'
      });
    }

    // Update the plot
    const updatedPlot = await prisma.cemeteryPlot.update({
      where: { id: plotId },
      data: {
        plotNumber: plotNumber || existingPlot.plotNumber,
        plotCode: plotCode || existingPlot.plotCode,
        size: size || existingPlot.size,
        status: status || existingPlot.status,
        baseFee: baseFee ? parseFloat(baseFee) : existingPlot.baseFee,
        maintenanceFee: maintenanceFee ? parseFloat(maintenanceFee) : existingPlot.maintenanceFee,
        length: length ? parseFloat(length) : existingPlot.length,
        width: width ? parseFloat(width) : existingPlot.width,
        depth: depth ? parseFloat(depth) : existingPlot.depth,
        orientation: orientation || existingPlot.orientation,
        accessibility: accessibility !== undefined ? accessibility : existingPlot.accessibility,
        latitude: latitude ? parseFloat(latitude) : existingPlot.latitude,
        longitude: longitude ? parseFloat(longitude) : existingPlot.longitude,
        notes: notes !== undefined ? notes : existingPlot.notes,
        updatedAt: new Date()
      },
      include: {
        assignments: {
          include: {
            deceased: true
          }
        },
        gravestones: true
      }
    });

    res.json({
      success: true,
      data: updatedPlot,
      message: 'Plot updated successfully'
    });

  } catch (error) {
    console.error('Error updating plot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update plot',
      details: error.message
    });
  }
});

// GET /plots/:plotId - Get specific cemetery plot (citizen access)
router.get('/plots/:plotId', requireCitizen, async (req, res) => {
  try {
    const plotId = parseInt(req.params.plotId);

    if (isNaN(plotId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plot ID'
      });
    }

    const plot = await prisma.cemeteryPlot.findUnique({
      where: { id: plotId },
      include: {
        cemetery: true,
        section: true,
        block: true,
        assignments: {
          include: {
            deceased: true
          }
        },
        gravestones: true
      }
    });

    if (!plot) {
      return res.status(404).json({
        success: false,
        error: 'Plot not found'
      });
    }

    res.json({
      success: true,
      data: plot,
      message: 'Plot retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching plot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plot',
      details: error.message
    });
  }
});

module.exports = router;