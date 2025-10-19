const express = require('express');
const router = express.Router();
const prisma = require('../database/prisma');

// GET /api/water-connections - Get all water connection requests
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      barangay, 
      connectionType,
      page = 1, 
      limit = 50,
      search 
    } = req.query;

    const where = {};
    
    if (status) where.status = status.toUpperCase().replace(/-/g, '_');
    if (barangay) where.barangay = { contains: barangay, mode: 'insensitive' };
    if (connectionType) where.connectionType = connectionType.toUpperCase();
    if (search) {
      where.OR = [
        { applicationNumber: { contains: search, mode: 'insensitive' } },
        { applicantFirstName: { contains: search, mode: 'insensitive' } },
        { applicantLastName: { contains: search, mode: 'insensitive' } },
        { propertyAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [connections, total] = await Promise.all([
      prisma.waterConnection.findMany({
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
      prisma.waterConnection.count({ where })
    ]);

    res.json({
      success: true,
      data: connections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching water connections:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/water-connections/:id - Get single connection
router.get('/:id', async (req, res) => {
  try {
    const connection = await prisma.waterConnection.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        updates: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection request not found'
      });
    }

    res.json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error('Error fetching connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/water-connections - Create new connection request
router.post('/', async (req, res) => {
  try {
    const {
      citizenId,
      applicantFirstName,
      applicantLastName,
      applicantMiddleName,
      contactNumber,
      email,
      propertyAddress,
      barangay,
      propertyType,
      connectionType,
      numberOfOccupants,
      businessName,
      businessType,
      latitude,
      longitude,
      validIdUrl,
      proofOfOwnershipUrl,
      businessPermitUrl,
      barangayClearanceUrl,
      sketchMapUrl,
      connectionFee
    } = req.body;

    const connection = await prisma.waterConnection.create({
      data: {
        citizenId: citizenId ? parseInt(citizenId) : null,
        applicantFirstName,
        applicantLastName,
        applicantMiddleName,
        contactNumber,
        email,
        propertyAddress,
        barangay,
        propertyType: propertyType.toUpperCase(),
        connectionType: connectionType.toUpperCase(),
        numberOfOccupants: numberOfOccupants ? parseInt(numberOfOccupants) : null,
        businessName,
        businessType,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        validIdUrl,
        proofOfOwnershipUrl,
        businessPermitUrl,
        barangayClearanceUrl,
        sketchMapUrl,
        connectionFee: parseFloat(connectionFee),
        status: 'PENDING',
        inspectionPhotos: [],
        installationPhotos: []
      }
    });

    res.status(201).json({
      success: true,
      data: connection,
      message: 'Water connection request created successfully'
    });
  } catch (error) {
    console.error('Error creating connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/water-connections/:id - Update connection request
router.put('/:id', async (req, res) => {
  try {
    const {
      status,
      inspectorId,
      inspectorName,
      installerId,
      installerName,
      inspectionDate,
      inspectionNotes,
      inspectionApproved,
      inspectionPhotos,
      installationDate,
      installationNotes,
      meterNumber,
      connectionSize,
      installationPhotos,
      paymentStatus,
      paymentDate,
      receiptNumber,
      depositAmount,
      rejectionReason,
      adminNotes
    } = req.body;

    const updateData = {};
    
    if (status) {
      updateData.status = status.toUpperCase().replace(/-/g, '_');
      if (status === 'APPROVED') updateData.approvedAt = new Date();
      if (status === 'ACTIVE') updateData.activatedAt = new Date();
    }
    if (inspectorId !== undefined) {
      updateData.inspectorId = inspectorId ? parseInt(inspectorId) : null;
      updateData.inspectorName = inspectorName || null;
    }
    if (installerId !== undefined) {
      updateData.installerId = installerId ? parseInt(installerId) : null;
      updateData.installerName = installerName || null;
    }
    if (inspectionDate) updateData.inspectionDate = new Date(inspectionDate);
    if (inspectionNotes !== undefined) updateData.inspectionNotes = inspectionNotes;
    if (inspectionApproved !== undefined) updateData.inspectionApproved = inspectionApproved;
    if (inspectionPhotos) updateData.inspectionPhotos = inspectionPhotos;
    if (installationDate) updateData.installationDate = new Date(installationDate);
    if (installationNotes !== undefined) updateData.installationNotes = installationNotes;
    if (meterNumber) updateData.meterNumber = meterNumber;
    if (connectionSize) updateData.connectionSize = connectionSize;
    if (installationPhotos) updateData.installationPhotos = installationPhotos;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentDate) updateData.paymentDate = new Date(paymentDate);
    if (receiptNumber) updateData.receiptNumber = receiptNumber;
    if (depositAmount !== undefined) updateData.depositAmount = parseFloat(depositAmount);
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const connection = await prisma.waterConnection.update({
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
      data: connection,
      message: 'Connection request updated successfully'
    });
  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/water-connections/:id/updates - Add status update
router.post('/:id/updates', async (req, res) => {
  try {
    const { status, description, photos, updatedBy, updatedByRole } = req.body;

    const update = await prisma.connectionUpdate.create({
      data: {
        connectionId: parseInt(req.params.id),
        status: status.toUpperCase().replace(/-/g, '_'),
        description,
        photos: photos || [],
        updatedBy,
        updatedByRole: updatedByRole || 'employee'
      }
    });

    // Also update the main connection status
    await prisma.waterConnection.update({
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

// DELETE /api/water-connections/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.waterConnection.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({
      success: true,
      message: 'Connection request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/water-connections/stats/summary - Get statistics
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
      forInspection,
      active,
      byConnectionType,
      byBarangay
    ] = await Promise.all([
      prisma.waterConnection.count({ where }),
      prisma.waterConnection.count({ where: { ...where, status: 'PENDING' } }),
      prisma.waterConnection.count({ where: { ...where, status: 'FOR_INSPECTION' } }),
      prisma.waterConnection.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.waterConnection.groupBy({
        by: ['connectionType'],
        where,
        _count: true
      }),
      prisma.waterConnection.groupBy({
        by: ['barangay'],
        where,
        _count: true,
        orderBy: { _count: { barangay: 'desc' } },
        take: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          pending,
          forInspection,
          active
        },
        byConnectionType,
        byBarangay
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
