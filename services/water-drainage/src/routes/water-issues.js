const express = require('express');
const router = express.Router();
const prisma = require('../database/prisma');

// GET /api/water-issues - Get all water issues with filtering
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
    
    if (status) where.status = status.toUpperCase().replace(/-/g, '_');
    if (barangay) where.barangay = { contains: barangay, mode: 'insensitive' };
    if (issueType) where.issueType = issueType.toUpperCase().replace(/-/g, '_');
    if (priority) where.priority = priority.toUpperCase();
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { reporterName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [issues, total] = await Promise.all([
      prisma.waterIssue.findMany({
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
      prisma.waterIssue.count({ where })
    ]);

    res.json({
      success: true,
      data: issues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching water issues:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/water-issues/:id - Get single water issue
router.get('/:id', async (req, res) => {
  try {
    const issue = await prisma.waterIssue.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Water issue not found'
      });
    }

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    console.error('Error fetching water issue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/water-issues - Create new water issue report
router.post('/', async (req, res) => {
  try {
    const {
      citizenId,
      reporterName,
      contactNumber,
      email,
      accountNumber,
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

    const issue = await prisma.waterIssue.create({
      data: {
        citizenId: citizenId ? parseInt(citizenId) : null,
        reporterName,
        contactNumber,
        email,
        accountNumber,
        issueType: issueType.toUpperCase().replace(/-/g, '_'),
        description,
        location,
        barangay,
        specificAddress,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        priority: priority ? priority.toUpperCase() : 'MEDIUM',
        photos: photos || [],
        resolutionPhotos: [],
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      data: issue,
      message: 'Water issue reported successfully'
    });
  } catch (error) {
    console.error('Error creating water issue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/water-issues/:id - Update water issue
router.put('/:id', async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedStaffId,
      assignedStaffName,
      scheduledDate,
      resolutionNotes,
      resolutionPhotos,
      estimatedRepairTime,
      notes,
      adminNotes
    } = req.body;

    const updateData = {};
    
    if (status) {
      updateData.status = status.toUpperCase().replace(/-/g, '_');
      if (status.toUpperCase() === 'RESOLVED') {
        updateData.resolvedAt = new Date();
      }
      if (status.toUpperCase() === 'CLOSED') {
        updateData.closedAt = new Date();
      }
    }
    if (priority) updateData.priority = priority.toUpperCase();
    if (assignedStaffId !== undefined) {
      updateData.assignedStaffId = assignedStaffId ? parseInt(assignedStaffId) : null;
      updateData.assignedStaffName = assignedStaffName || null;
      if (assignedStaffId) updateData.assignedAt = new Date();
    }
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
    if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;
    if (resolutionPhotos) updateData.resolutionPhotos = resolutionPhotos;
    if (estimatedRepairTime !== undefined) updateData.estimatedRepairTime = estimatedRepairTime;
    if (notes !== undefined) updateData.notes = notes;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const issue = await prisma.waterIssue.update({
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
      data: issue,
      message: 'Water issue updated successfully'
    });
  } catch (error) {
    console.error('Error updating water issue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/water-issues/:id/updates - Add status update
router.post('/:id/updates', async (req, res) => {
  try {
    const { status, description, photos, updatedBy, updatedByRole } = req.body;

    const update = await prisma.waterIssueUpdate.create({
      data: {
        issueId: parseInt(req.params.id),
        status: status.toUpperCase().replace(/-/g, '_'),
        description,
        photos: photos || [],
        updatedBy,
        updatedByRole: updatedByRole || 'staff'
      }
    });

    // Also update the main issue status
    await prisma.waterIssue.update({
      where: { id: parseInt(req.params.id) },
      data: { status: status.toUpperCase().replace(/-/g, '_') }
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

// DELETE /api/water-issues/:id - Delete water issue
router.delete('/:id', async (req, res) => {
  try {
    await prisma.waterIssue.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({
      success: true,
      message: 'Water issue deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting water issue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/water-issues/stats/summary - Get statistics
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
      inProgress,
      resolved,
      byIssueType,
      byBarangay,
      byPriority,
      avgResolutionTime
    ] = await Promise.all([
      prisma.waterIssue.count({ where }),
      prisma.waterIssue.count({ where: { ...where, status: 'PENDING' } }),
      prisma.waterIssue.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.waterIssue.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.waterIssue.groupBy({
        by: ['issueType'],
        where,
        _count: true
      }),
      prisma.waterIssue.groupBy({
        by: ['barangay'],
        where,
        _count: true,
        orderBy: { _count: { barangay: 'desc' } },
        take: 10
      }),
      prisma.waterIssue.groupBy({
        by: ['priority'],
        where,
        _count: true
      }),
      prisma.waterIssue.aggregate({
        where: { ...where, resolvedAt: { not: null } },
        _avg: {
          // Calculate average resolution time in days
          // This is a simplified calculation
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          pending,
          inProgress,
          resolved
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
