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

// POST route for creating plots
router.post('/', requireCitizen, async (req, res) => {
  try {
    const {
      cemeteryId,
      sectionId,
      blockId,
      plotNumber,
      plotCode,
      latitude,
      longitude,
      size,
      length,
      width,
      depth,
      baseFee,
      maintenanceFee,
      orientation,
      accessibility,
      status,
      maxLayers
    } = req.body;

    // Validate required fields
    if (!cemeteryId || !plotNumber) {
      return res.status(400).json({
        success: false,
        error: 'Cemetery ID and plot number are required'
      });
    }

    // Check if plot number already exists in the cemetery
    const existingPlot = await prisma.cemeteryPlot.findFirst({
      where: {
        cemeteryId: parseInt(cemeteryId),
        plotNumber: plotNumber
      }
    });

    if (existingPlot) {
      return res.status(400).json({
        success: false,
        error: `Plot number ${plotNumber} already exists in this cemetery`
      });
    }

    // Create the plot
    const newPlot = await prisma.cemeteryPlot.create({
      data: {
        cemeteryId: parseInt(cemeteryId),
        sectionId: sectionId ? parseInt(sectionId) : null,
        blockId: blockId ? parseInt(blockId) : null,
        plotNumber: plotNumber,
        plotCode: plotCode || plotNumber,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        boundary: req.body.boundary || null, // Save boundary coordinates for plot outline
        size: size || 'STANDARD',
        length: length ? parseFloat(length) : 2.0,
        width: width ? parseFloat(width) : 1.0,
        depth: depth ? parseFloat(depth) : 1.5,
        baseFee: baseFee ? parseFloat(baseFee) : 5000.0,
        maintenanceFee: maintenanceFee ? parseFloat(maintenanceFee) : 500.0,
        orientation: orientation || 'NORTH',
        accessibility: accessibility !== undefined ? accessibility : true,
        status: status || 'VACANT',
        maxLayers: maxLayers ? parseInt(maxLayers) : 3
      }
    });

    res.status(201).json({
      success: true,
      data: newPlot,
      message: 'Cemetery plot created successfully'
    });

  } catch (error) {
    console.error('Error creating cemetery plot:', error);
    
    // Handle Prisma constraint errors
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Plot with this identifier already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create cemetery plot',
      details: error.message
    });
  }
});

// GET route for getting a single plot by ID
router.get('/:id', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;

    const plot = await prisma.cemeteryPlot.findUnique({
      where: { id: parseInt(id) },
      include: {
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
        error: 'Cemetery plot not found'
      });
    }

    res.json({
      success: true,
      data: plot,
      message: 'Cemetery plot retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching cemetery plot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cemetery plot',
      details: error.message
    });
  }
});

// PUT route for updating plots (assignments, reservations, etc.)
router.put('/:id', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if plot exists
    const existingPlot = await prisma.cemeteryPlot.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPlot) {
      return res.status(404).json({
        success: false,
        error: 'Cemetery plot not found'
      });
    }

    // Handle plot assignment (when occupantDetails is provided)
    if (updateData.occupantDetails) {
      const layer = updateData.occupantDetails.layer || 1;
      
      // Check if the specific layer is already occupied
      const existingLayerAssignment = await prisma.plotAssignment.findFirst({
        where: {
          plotId: parseInt(id),
          layer: layer,
          status: 'ASSIGNED'
        },
        include: {
          deceased: true
        }
      });

      if (existingLayerAssignment) {
        return res.status(400).json({
          success: false,
          error: `Layer ${layer} is already occupied by ${existingLayerAssignment.deceased?.firstName} ${existingLayerAssignment.deceased?.lastName}`
        });
      }

      // Check if layer exceeds plot maximum
      if (layer > (existingPlot.maxLayers || 3)) {
        return res.status(400).json({
          success: false,
          error: `Layer ${layer} exceeds plot maximum of ${existingPlot.maxLayers || 3} layers`
        });
      }

      // Create deceased record first
      const deceasedData = {
        firstName: updateData.occupantDetails.firstName || 'Unknown',
        lastName: updateData.occupantDetails.lastName || 'Unknown', 
        middleName: updateData.occupantDetails.middleName || null,
        dateOfBirth: updateData.occupantDetails.dateOfBirth ? new Date(updateData.occupantDetails.dateOfBirth) : null,
        dateOfDeath: updateData.occupantDetails.dateOfDeath ? new Date(updateData.occupantDetails.dateOfDeath) : null
      };

      const deceased = await prisma.deceasedRecord.create({
        data: deceasedData
      });

      // Create plot assignment with layer information
      const assignment = await prisma.plotAssignment.create({
        data: {
          plotId: parseInt(id),
          deceasedId: deceased.id,
          layer: updateData.occupantDetails.layer || 1,
          assignedBy: 1, // Default to admin user for now
          status: 'ASSIGNED',
          notes: `Layer ${updateData.occupantDetails.layer || 1} - Assigned to ${deceased.firstName} ${deceased.lastName}`
        }
      });

      // Check if plot should be marked as occupied (if this is the first assignment)
      const totalAssignments = await prisma.plotAssignment.count({
        where: {
          plotId: parseInt(id),
          status: 'ASSIGNED'
        }
      });

      // Update plot status - only mark as OCCUPIED if there are active assignments
      const plotStatus = totalAssignments > 0 ? 'OCCUPIED' : 'VACANT';
      
      const updatedPlot = await prisma.cemeteryPlot.update({
        where: { id: parseInt(id) },
        data: {
          status: plotStatus
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

      return res.json({
        success: true,
        data: updatedPlot,
        message: `Cemetery plot assigned successfully to ${deceased.firstName} ${deceased.lastName} (Layer ${updateData.occupantDetails.layer || 1})`
      });
    }

    // Handle plot reservation (when reservationDetails is provided)
    if (updateData.reservationDetails) {
      // Update plot status to RESERVED
      const updatedPlot = await prisma.cemeteryPlot.update({
        where: { id: parseInt(id) },
        data: {
          status: 'RESERVED'
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

      return res.json({
        success: true,
        data: updatedPlot,
        message: 'Cemetery plot reserved successfully'
      });
    }

    // Regular plot update (non-assignment, non-reservation)
    const plotUpdateData = {};
    
    if (updateData.status !== undefined) plotUpdateData.status = updateData.status.toUpperCase();
    if (updateData.size !== undefined) plotUpdateData.size = updateData.size.toUpperCase();
    if (updateData.baseFee !== undefined) plotUpdateData.baseFee = parseFloat(updateData.baseFee);
    if (updateData.maintenanceFee !== undefined) plotUpdateData.maintenanceFee = parseFloat(updateData.maintenanceFee);
    if (updateData.accessibility !== undefined) plotUpdateData.accessibility = updateData.accessibility;
    if (updateData.orientation !== undefined) plotUpdateData.orientation = updateData.orientation.toUpperCase();
    if (updateData.maxLayers !== undefined) plotUpdateData.maxLayers = parseInt(updateData.maxLayers);

    // Update the plot
    const updatedPlot = await prisma.cemeteryPlot.update({
      where: { id: parseInt(id) },
      data: plotUpdateData,
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
      message: 'Cemetery plot updated successfully'
    });

  } catch (error) {
    console.error('Error updating cemetery plot:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to update cemetery plot',
      details: error.message
    });
  }
});

// DELETE route for deleting plots
router.delete('/:id', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if plot exists
    const existingPlot = await prisma.cemeteryPlot.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPlot) {
      return res.status(404).json({
        success: false,
        error: 'Cemetery plot not found'
      });
    }

    // Delete the plot
    await prisma.cemeteryPlot.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Cemetery plot deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting cemetery plot:', error);
    
    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete plot: it has associated records'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete cemetery plot',
      details: error.message
    });
  }
});

module.exports = router;