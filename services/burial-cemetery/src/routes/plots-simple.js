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
    const plotData = {
        plotNumber: plotNumber,
        plotCode: plotCode || plotNumber,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        coordinates: req.body.boundary || null, // Save boundary coordinates for plot outline
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
    };

    // Add cemetery relation if cemeteryId is provided
    if (cemeteryId) {
      plotData.cemetery = {
        connect: { id: parseInt(cemeteryId) }
      };
    }

    // Add block relation if blockId is provided
    if (blockId) {
      plotData.block_rel = {
        connect: { id: parseInt(blockId) }
      };
    }

    const newPlot = await prisma.cemeteryPlot.create({
      data: plotData
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

// GET route for searching by deceased name - MUST be before /:id route
router.get('/search', requireCitizen, async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }
    
    // Search for plots with assigned deceased that match the name
    const plots = await prisma.cemeteryPlot.findMany({
      where: {
        assignments: {
          some: {
            deceased: {
              OR: [
                { firstName: { contains: name, mode: 'insensitive' } },
                { lastName: { contains: name, mode: 'insensitive' } },
                { middleName: { contains: name, mode: 'insensitive' } }
              ]
            },
            status: 'ASSIGNED'
          }
        }
      },
      include: {
        assignments: {
          where: {
            status: 'ASSIGNED'
          },
          include: {
            deceased: true
          }
        },
        gravestones: true,
        cemetery: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Transform the data for the frontend
    const results = [];
    
    plots.forEach(plot => {
      plot.assignments.forEach(assignment => {
        if (assignment.deceased) {
          const deceased = assignment.deceased;
          const fullName = `${deceased.firstName || ''} ${deceased.middleName || ''} ${deceased.lastName || ''}`.replace(/\s+/g, ' ').trim();
          
          results.push({
            id: `${plot.id}-${assignment.id}`,
            deceasedName: fullName,
            firstName: deceased.firstName || '',
            lastName: deceased.lastName || '',
            middleName: deceased.middleName || '',
            dateOfBirth: deceased.dateOfBirth,
            dateOfDeath: deceased.dateOfDeath,
            burialDate: assignment.assignedAt, // Use assignment date as burial date
            age: deceased.dateOfBirth && deceased.dateOfDeath ? 
              Math.floor((new Date(deceased.dateOfDeath).getTime() - new Date(deceased.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
            gender: deceased.sex || 'unknown',
            plotLocation: {
              section: plot.section || 'Unknown Section',
              block: plot.block || 'Unknown Block',  
              plotNumber: plot.plotNumber || plot.plotCode || 'Unknown',
              coordinates: [
                plot.latitude ? parseFloat(plot.latitude.toString()) : 14.6760,
                plot.longitude ? parseFloat(plot.longitude.toString()) : 121.0437
              ]
            },
            gravestone: plot.gravestones ? {
              material: plot.gravestones.material || '',
              inscription: plot.gravestones.inscription || '',
              condition: plot.gravestones.condition || 'good'
            } : undefined,
            cemetery: {
              id: plot.cemetery?.id,
              name: plot.cemetery?.name || 'Unknown Cemetery'
            },
            plotDetails: {
              size: plot.size,
              type: plot.type,
              baseFee: plot.baseFee,
              maintenanceFee: plot.maintenanceFee
            }
          });
        }
      });
    });

    res.json({
      success: true,
      data: results,
      message: `Found ${results.length} burial records`
    });

  } catch (error) {
    console.error('Error searching cemetery plots by name:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search cemetery plots',
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
      // Get the target layer (default to 1 if not specified)
      const targetLayer = updateData.occupantDetails.layer || 1;
      
      // First, get the plot to check maxLayers
      const plot = await prisma.cemeteryPlot.findUnique({
        where: { id: parseInt(id) }
      });

      if (!plot) {
        return res.status(404).json({
          success: false,
          error: 'Plot not found'
        });
      }

      // Validate layer is within plot limits
      if (targetLayer > (plot.maxLayers || 3)) {
        return res.status(400).json({
          success: false,
          error: `Layer ${targetLayer} exceeds plot maximum of ${plot.maxLayers || 3} layers`
        });
      }

      // Check if the specific layer is already occupied
      const existingBurial = await prisma.burials.findFirst({
        where: {
          plotId: parseInt(id),
          layer: targetLayer,
          status: 'active'
        },
        include: {
          deceased_records: true
        }
      });

      if (existingBurial) {
        return res.status(400).json({
          success: false,
          error: `Layer ${targetLayer} is already occupied by ${existingBurial.deceased_records?.firstName} ${existingBurial.deceased_records?.lastName}`
        });
      }

      // Validate required deceased information
      if (!updateData.occupantDetails.firstName || !updateData.occupantDetails.lastName) {
        return res.status(400).json({
          success: false,
          error: 'First name and last name are required for burial assignment'
        });
      }

      // Create deceased record first
      const deceasedData = {
        firstName: updateData.occupantDetails.firstName,
        lastName: updateData.occupantDetails.lastName, 
        middleName: updateData.occupantDetails.middleName || null,
        dateOfBirth: updateData.occupantDetails.dateOfBirth ? new Date(updateData.occupantDetails.dateOfBirth) : null,
        dateOfDeath: updateData.occupantDetails.dateOfDeath ? new Date(updateData.occupantDetails.dateOfDeath) : null
      };

      const deceased = await prisma.deceasedRecord.create({
        data: deceasedData
      });

      // Create plot assignment
      const assignment = await prisma.plotAssignment.create({
        data: {
          plotId: parseInt(id),
          deceasedId: deceased.id,
          assignedBy: 1, // Default to admin user for now
          status: 'ASSIGNED',
          notes: updateData.occupantDetails.notes || `Assigned to ${deceased.firstName} ${deceased.lastName}`
        }
      });

      // Also create a burial record in the burials table
      const burial = await prisma.burials.create({
        data: {
          plotId: parseInt(id),
          deceasedId: deceased.id,
          layer: targetLayer, // Use the specified layer
          burialType: 'permanent',
          burialDate: updateData.occupantDetails.dateOfDeath ? new Date(updateData.occupantDetails.dateOfDeath) : new Date(),
          status: 'active',
          permitNumber: updateData.occupantDetails.permitNumber || null,
          registrationNumber: updateData.occupantDetails.registrationNumber || null,
          nextOfKinName: updateData.occupantDetails.nextOfKinName || null,
          nextOfKinRelation: updateData.occupantDetails.nextOfKinRelation || null,
          nextOfKinContact: updateData.occupantDetails.nextOfKinContact || null,
          notes: updateData.occupantDetails.notes || `Burial record for ${deceased.firstName} ${deceased.lastName} - Layer ${targetLayer}`,
          updatedAt: new Date()
        }
      });

      // Update plot status based on occupancy
      // Check how many active burials exist in this plot
      const activeBurials = await prisma.burials.count({
        where: {
          plotId: parseInt(id),
          status: 'active'
        }
      });

      // Plot is fully occupied when all layers are filled
      const plotStatus = activeBurials >= (plot.maxLayers || 3) ? 'OCCUPIED' : 'RESERVED';

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
        message: `Cemetery plot assigned successfully to ${deceased.firstName} ${deceased.lastName}`
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