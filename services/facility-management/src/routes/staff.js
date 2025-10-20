const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { prisma, checkAvailability, logStatusChange } = require('../database/db');

// Apply authentication to all staff routes
router.use(authenticateToken);
router.use(authorizeRole('STAFF', 'ADMIN', 'SUPERVISOR'));

// GET /api/staff/dashboard - Get staff dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const [
      pendingReview,
      awaitingRequirements,
      awaitingPayment,
      approved,
      todayEvents,
      upcomingEvents
    ] = await Promise.all([
      prisma.facilityRequest.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.facilityRequest.count({ where: { status: 'AWAITING_REQUIREMENTS' } }),
      prisma.facilityRequest.count({ where: { status: 'AWAITING_PAYMENT' } }),
      prisma.facilityRequest.count({ where: { status: 'APPROVED' } }),
      prisma.facilityRequest.count({
        where: {
          scheduleStart: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          status: 'APPROVED'
        }
      }),
      prisma.facilityRequest.findMany({
        where: {
          scheduleStart: {
            gte: new Date(),
            lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          },
          status: 'APPROVED'
        },
        include: {
          facility: { select: { name: true, type: true } }
        },
        orderBy: { scheduleStart: 'asc' },
        take: 10
      })
    ]);

    res.json({
      stats: {
        pendingReview,
        awaitingRequirements,
        awaitingPayment,
        approved,
        todayEvents
      },
      upcomingEvents
    });
  } catch (error) {
    console.error('Error fetching staff dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/staff/requests - Get all requests with filters
router.get('/requests', async (req, res) => {
  try {
    const { status, facilityId, startDate, endDate, search } = req.query;

    const where = {};
    
    if (status) where.status = status;
    if (facilityId) where.facilityId = parseInt(facilityId);
    if (startDate && endDate) {
      where.scheduleStart = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { applicantName: { contains: search, mode: 'insensitive' } },
        { organizationName: { contains: search, mode: 'insensitive' } },
        { contactNumber: { contains: search } }
      ];
    }

    const requests = await prisma.facilityRequest.findMany({
      where,
      include: {
        facility: { select: { name: true, type: true, location: true } },
        handledBy: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/staff/request/:id - Get request details
router.get('/request/:id', async (req, res) => {
  try {
    const request = await prisma.facilityRequest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        facility: true,
        handledBy: { select: { firstName: true, lastName: true, email: true } },
        inspections: {
          include: {
            inspector: { select: { firstName: true, lastName: true } }
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

// PUT /api/staff/assign/:id - Assign request to self
router.put('/assign/:id', async (req, res) => {
  try {
    const request = await prisma.facilityRequest.update({
      where: { id: parseInt(req.params.id) },
      data: {
        handledById: req.user.id,
        reviewedAt: new Date()
      },
      include: {
        facility: true,
        handledBy: { select: { firstName: true, lastName: true } }
      }
    });

    await logStatusChange(
      request.id,
      request.status,
      request.status,
      req.user.email,
      'Request assigned for review'
    );

    res.json({ message: 'Request assigned successfully', request });
  } catch (error) {
    console.error('Error assigning request:', error);
    res.status(500).json({ error: 'Failed to assign request' });
  }
});

// PUT /api/staff/update-status/:id - Update request status
router.put('/update-status/:id', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const requestId = parseInt(req.params.id);

    const currentRequest = await prisma.facilityRequest.findUnique({
      where: { id: requestId }
    });

    if (!currentRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updateData = {
      status,
      remarks,
      handledById: req.user.id
    };

    // Set timestamp based on status
    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.eventStatus = 'SCHEDULED';
    } else if (status === 'REJECTED') {
      updateData.rejectedAt = new Date();
      updateData.eventStatus = 'CANCELLED';
    }

    const updated = await prisma.facilityRequest.update({
      where: { id: requestId },
      data: updateData,
      include: { facility: true }
    });

    await logStatusChange(
      requestId,
      currentRequest.status,
      status,
      req.user.email,
      remarks
    );

    res.json({ message: 'Status updated successfully', request: updated });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/staff/upload-requirements/:id - Upload additional requirements
router.post('/upload-requirements/:id', upload.fields([
  { name: 'barangayEndorsement', maxCount: 1 },
  { name: 'healthClearance', maxCount: 1 },
  { name: 'otherDocuments', maxCount: 5 }
]), async (req, res) => {
  try {
    const files = req.files || {};
    const updateData = {};

    if (files.barangayEndorsement) {
      updateData.barangayEndorsement = files.barangayEndorsement[0].path;
    }
    if (files.healthClearance) {
      updateData.healthClearance = files.healthClearance[0].path;
    }
    if (files.otherDocuments) {
      updateData.otherDocuments = JSON.stringify(files.otherDocuments.map(f => f.path));
    }

    const updated = await prisma.facilityRequest.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });

    await logStatusChange(
      updated.id,
      updated.status,
      updated.status,
      req.user.email,
      'Additional requirements uploaded'
    );

    res.json({ message: 'Requirements uploaded successfully', request: updated });
  } catch (error) {
    console.error('Error uploading requirements:', error);
    res.status(500).json({ error: 'Failed to upload requirements' });
  }
});

// PUT /api/staff/set-payment/:id - Set payment details
router.put('/set-payment/:id', async (req, res) => {
  try {
    const { paymentType, totalAmount } = req.body;
    const requestId = parseInt(req.params.id);

    const updated = await prisma.facilityRequest.update({
      where: { id: requestId },
      data: {
        paymentType,
        totalAmount: parseFloat(totalAmount),
        paymentStatus: paymentType === 'EXEMPTED' || paymentType === 'WAIVED' ? 
          'EXEMPTED' : 'PENDING',
        status: 'AWAITING_PAYMENT'
      }
    });

    await logStatusChange(
      requestId,
      'PENDING_REVIEW',
      'AWAITING_PAYMENT',
      req.user.email,
      `Payment type set to ${paymentType}`
    );

    res.json({ message: 'Payment details set successfully', request: updated });
  } catch (error) {
    console.error('Error setting payment:', error);
    res.status(500).json({ error: 'Failed to set payment details' });
  }
});

// POST /api/staff/mock-payment/:id - Handle mock payment
router.post('/mock-payment/:id', upload.single('paymentProof'), async (req, res) => {
  try {
    const { paymentType } = req.body;
    const requestId = parseInt(req.params.id);

    const updateData = {
      paymentStatus: 'PAID',
      paymentType: paymentType || 'CASH',
      paidAt: new Date(),
      status: 'APPROVED',
      approvedAt: new Date()
    };

    if (req.file) {
      updateData.paymentProof = req.file.path;
    }

    const updated = await prisma.facilityRequest.update({
      where: { id: requestId },
      data: updateData
    });

    await logStatusChange(
      requestId,
      'AWAITING_PAYMENT',
      'APPROVED',
      req.user.email,
      'Payment verified (mock) - Request approved'
    );

    res.json({ message: 'Payment processed successfully', request: updated });
  } catch (error) {
    console.error('Error processing mock payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// POST /api/staff/generate-gate-pass/:id - Generate gate pass
router.post('/generate-gate-pass/:id', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    
    // Generate simple access code (in production, use QR code library)
    const gatePass = `GP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const updated = await prisma.facilityRequest.update({
      where: { id: requestId },
      data: { gatePass }
    });

    await logStatusChange(
      requestId,
      updated.status,
      updated.status,
      req.user.email,
      'Gate pass generated'
    );

    res.json({ message: 'Gate pass generated successfully', gatePass, request: updated });
  } catch (error) {
    console.error('Error generating gate pass:', error);
    res.status(500).json({ error: 'Failed to generate gate pass' });
  }
});

// PUT /api/staff/event-status/:id - Update event status (In Use, Completed, No Show)
router.put('/event-status/:id', async (req, res) => {
  try {
    const { eventStatus, actualStartTime, actualEndTime } = req.body;
    const requestId = parseInt(req.params.id);

    const updateData = { eventStatus };
    
    if (actualStartTime) updateData.actualStartTime = new Date(actualStartTime);
    if (actualEndTime) updateData.actualEndTime = new Date(actualEndTime);
    
    if (eventStatus === 'COMPLETED') {
      updateData.actualEndTime = updateData.actualEndTime || new Date();
    }

    const updated = await prisma.facilityRequest.update({
      where: { id: requestId },
      data: updateData
    });

    await logStatusChange(
      requestId,
      updated.status,
      updated.status,
      req.user.email,
      `Event status changed to ${eventStatus}`
    );

    res.json({ message: 'Event status updated successfully', request: updated });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

// POST /api/staff/inspection/:id - Submit post-event inspection
router.post('/inspection/:id', upload.array('photos', 10), async (req, res) => {
  try {
    const { hasDamages, damageDescription, violations, billingAmount, remarks } = req.body;
    const requestId = parseInt(req.params.id);

    const photos = req.files ? req.files.map(f => f.path) : [];
    
    let inspectionStatus = 'NO_ISSUES';
    if (hasDamages === 'true' || hasDamages === true) {
      inspectionStatus = 'WITH_DAMAGES';
    } else if (violations) {
      inspectionStatus = 'WITH_VIOLATIONS';
    }
    if (billingAmount && parseFloat(billingAmount) > 0) {
      inspectionStatus = 'PENDING_BILLING';
    }

    const inspection = await prisma.inspection.create({
      data: {
        requestId,
        inspectedById: req.user.id,
        hasDamages: hasDamages === 'true' || hasDamages === true,
        damageDescription,
        violations,
        photos,
        status: inspectionStatus,
        billingAmount: billingAmount ? parseFloat(billingAmount) : 0,
        remarks
      },
      include: {
        inspector: { select: { firstName: true, lastName: true } }
      }
    });

    // Update request event status
    await prisma.facilityRequest.update({
      where: { id: requestId },
      data: { eventStatus: 'COMPLETED' }
    });

    await logStatusChange(
      requestId,
      'APPROVED',
      'APPROVED',
      req.user.email,
      `Post-event inspection completed: ${inspectionStatus}`
    );

    res.json({ message: 'Inspection submitted successfully', inspection });
  } catch (error) {
    console.error('Error submitting inspection:', error);
    res.status(500).json({ error: 'Failed to submit inspection' });
  }
});

module.exports = router;
