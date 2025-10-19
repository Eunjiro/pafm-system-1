const express = require('express');
const router = express.Router();
const prisma = require('../database/prisma');

// GET /api/drainage - Get all drainage requests with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      barangay, 
      issueType, 
      priority,
      page = 1, 
      limit = 50,
      search 
    } = req.query;

    const where = {};
    
    if (status) where.status = status.toUpperCase();
    if (barangay) where.barangay = { contains: barangay, mode: 'insensitive' };
    if (issueType) where.issueType = issueType.toUpperCase().replace(/-/g, '_');
    if (priority) where.priority = priority.toUpperCase();
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { requesterName: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [requests, total] = await Promise.all([
      prisma.drainageRequest.findMany({
        where,
        include: {
          updates: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.drainageRequest.count({ where })
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching drainage requests:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/drainage/:id - Get single drainage request
router.get('/:id', async (req, res) => {
  try {
    const request = await prisma.drainageRequest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Drainage request not found'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching drainage request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/drainage - Create new drainage request
router.post('/', async (req, res) => {
  try {
    const {
      citizenId,
      requesterName,
      contactNumber,
      email,
      issueType,
      description,
      location,
      barangay,
      specificAddress,
      latitude,
      longitude,
      priority,
      photos
    } = req.body;

    const request = await prisma.drainageRequest.create({
      data: {
        citizenId: citizenId ? parseInt(citizenId) : null,
        requesterName,
        contactNumber,
        email,
        issueType: issueType.toUpperCase().replace(/-/g, '_'),
        description,
        location,
        barangay,
        specificAddress,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        priority: priority ? priority.toUpperCase() : 'MEDIUM',
        photos: photos || [],
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      data: request,
      message: 'Drainage request created successfully'
    });
  } catch (error) {
    console.error('Error creating drainage request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/drainage/:id - Update drainage request
router.put('/:id', async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedEngineerId,
      assignedEngineerName,
      scheduledDate,
      estimatedCost,
      actualCost,
      notes,
      adminNotes
    } = req.body;

    const updateData = {};
    
    if (status) {
      updateData.status = status.toUpperCase();
      if (status.toUpperCase() === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (priority) updateData.priority = priority.toUpperCase();
    if (assignedEngineerId !== undefined) {
      updateData.assignedEngineerId = assignedEngineerId ? parseInt(assignedEngineerId) : null;
      updateData.assignedEngineerName = assignedEngineerName || null;
      if (assignedEngineerId) updateData.assignedAt = new Date();
    }
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
    if (estimatedCost !== undefined) updateData.estimatedCost = parseFloat(estimatedCost);
    if (actualCost !== undefined) updateData.actualCost = parseFloat(actualCost);
    if (notes !== undefined) updateData.notes = notes;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const request = await prisma.drainageRequest.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: {
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    res.json({
      success: true,
      data: request,
      message: 'Drainage request updated successfully'
    });
  } catch (error) {
    console.error('Error updating drainage request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/drainage/:id/updates - Add status update
router.post('/:id/updates', async (req, res) => {
  try {
    const { status, description, photos, updatedBy, updatedByRole } = req.body;

    const update = await prisma.drainageUpdate.create({
      data: {
        requestId: parseInt(req.params.id),
        status: status.toUpperCase(),
        description,
        photos: photos || [],
        updatedBy,
        updatedByRole: updatedByRole || 'employee'
      }
    });

    // Also update the main request status
    await prisma.drainageRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { status: status.toUpperCase() }
    });

    res.status(201).json({
      success: true,
      data: update,
      message: 'Status update added successfully'
    });
  } catch (error) {
    console.error('Error adding update:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/drainage/:id - Delete drainage request
router.delete('/:id', async (req, res) => {
  try {
    await prisma.drainageRequest.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({
      success: true,
      message: 'Drainage request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting drainage request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/drainage/stats/summary - Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { barangay, startDate, endDate } = req.query;
    
    const where = {};
    if (barangay) where.barangay = barangay;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [
      total,
      pending,
      ongoing,
      completed,
      byIssueType,
      byBarangay,
      byPriority
    ] = await Promise.all([
      prisma.drainageRequest.count({ where }),
      prisma.drainageRequest.count({ where: { ...where, status: 'PENDING' } }),
      prisma.drainageRequest.count({ where: { ...where, status: 'ONGOING' } }),
      prisma.drainageRequest.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.drainageRequest.groupBy({
        by: ['issueType'],
        where,
        _count: true
      }),
      prisma.drainageRequest.groupBy({
        by: ['barangay'],
        where,
        _count: true,
        orderBy: { _count: { barangay: 'desc' } },
        take: 10
      }),
      prisma.drainageRequest.groupBy({
        by: ['priority'],
        where,
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          pending,
          ongoing,
          completed
        },
        byIssueType,
        byBarangay,
        byPriority
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
