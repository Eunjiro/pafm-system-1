const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { 
  prisma, 
  generateRequestNumber, 
  checkAvailability, 
  logStatusChange,
  calculatePaymentAmount 
} = require('../database/db');

// GET /api/citizen/facilities - Get all available facilities
router.get('/facilities', async (req, res) => {
  try {
    const facilities = await prisma.facility.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        capacity: true,
        description: true,
        amenities: true,
        location: true,
        hourlyRate: true
      }
    });

    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

// POST /api/citizen/check-availability - Check if facility is available
router.post('/check-availability', async (req, res) => {
  try {
    const { facilityId, scheduleStart, scheduleEnd } = req.body;

    const availability = await checkAvailability(
      parseInt(facilityId),
      new Date(scheduleStart),
      new Date(scheduleEnd)
    );

    res.json(availability);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// POST /api/citizen/facility-request - Submit new facility request
router.post('/facility-request', upload.fields([
  { name: 'governmentPermit', maxCount: 1 },
  { name: 'barangayEndorsement', maxCount: 1 },
  { name: 'otherDocuments', maxCount: 5 }
]), async (req, res) => {
  try {
    const {
      applicantName,
      organizationName,
      contactPerson,
      contactNumber,
      email,
      facilityId,
      activityType,
      activityPurpose,
      scheduleStart,
      scheduleEnd,
      estimatedParticipants,
      layoutRequirements,
      equipmentNeeds,
      eventType
    } = req.body;

    // Validate required fields
    if (!applicantName || !contactPerson || !contactNumber || !facilityId || 
        !activityType || !scheduleStart || !scheduleEnd || !estimatedParticipants) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check availability
    const availability = await checkAvailability(
      parseInt(facilityId),
      new Date(scheduleStart),
      new Date(scheduleEnd)
    );

    if (!availability.available) {
      return res.status(400).json({ 
        error: 'Facility not available for selected time slot',
        conflicts: availability.conflicts,
        blackouts: availability.blackouts
      });
    }

    // Get facility details for pricing
    const facility = await prisma.facility.findUnique({
      where: { id: parseInt(facilityId) }
    });

    // Calculate payment amount
    const totalAmount = calculatePaymentAmount(
      facility,
      new Date(scheduleStart),
      new Date(scheduleEnd),
      eventType || 'PRIVATE'
    );

    // Generate request number
    const requestNumber = await generateRequestNumber();

    // Handle file uploads
    const files = req.files || {};
    const governmentPermit = files.governmentPermit ? files.governmentPermit[0].path : null;
    const barangayEndorsement = files.barangayEndorsement ? files.barangayEndorsement[0].path : null;
    const otherDocuments = files.otherDocuments ? 
      JSON.stringify(files.otherDocuments.map(f => f.path)) : null;

    // Create facility request
    const request = await prisma.facilityRequest.create({
      data: {
        requestNumber,
        applicantName,
        organizationName,
        contactPerson,
        contactNumber,
        email,
        facilityId: parseInt(facilityId),
        activityType,
        activityPurpose,
        scheduleStart: new Date(scheduleStart),
        scheduleEnd: new Date(scheduleEnd),
        estimatedParticipants: parseInt(estimatedParticipants),
        layoutRequirements,
        equipmentNeeds,
        governmentPermit,
        barangayEndorsement,
        otherDocuments,
        eventType: eventType || 'PRIVATE',
        status: 'PENDING_REVIEW',
        paymentStatus: eventType === 'GOVERNMENT' ? 'EXEMPTED' : 'PENDING',
        totalAmount
      },
      include: {
        facility: true
      }
    });

    // Log status creation
    await logStatusChange(
      request.id,
      null,
      'PENDING_REVIEW',
      'SYSTEM',
      'Request submitted by citizen'
    );

    res.status(201).json({
      message: 'Facility request submitted successfully',
      requestNumber: request.requestNumber,
      request
    });
  } catch (error) {
    console.error('Error creating facility request:', error);
    res.status(500).json({ error: 'Failed to submit facility request' });
  }
});

// GET /api/citizen/my-requests - Get citizen's requests (by email or contact)
router.get('/my-requests', async (req, res) => {
  try {
    const { email, contactNumber } = req.query;

    if (!email && !contactNumber) {
      return res.status(400).json({ error: 'Email or contact number required' });
    }

    const requests = await prisma.facilityRequest.findMany({
      where: {
        OR: [
          email ? { email } : {},
          contactNumber ? { contactNumber } : {}
        ]
      },
      include: {
        facility: {
          select: {
            name: true,
            type: true,
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// GET /api/citizen/request/:requestNumber - Get specific request details
router.get('/request/:requestNumber', async (req, res) => {
  try {
    const { requestNumber } = req.params;

    const request = await prisma.facilityRequest.findUnique({
      where: { requestNumber },
      include: {
        facility: true,
        inspections: true,
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
    res.status(500).json({ error: 'Failed to fetch request details' });
  }
});

// PUT /api/citizen/cancel-request/:id - Cancel request (citizen-initiated)
router.put('/cancel-request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, contactNumber } = req.body;

    // Verify request belongs to user
    const request = await prisma.facilityRequest.findUnique({
      where: { id: parseInt(id) }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.contactNumber !== contactNumber) {
      return res.status(403).json({ error: 'Unauthorized to cancel this request' });
    }

    // Only allow cancellation if status is PENDING_REVIEW or AWAITING_PAYMENT
    if (!['PENDING_REVIEW', 'AWAITING_PAYMENT'].includes(request.status)) {
      return res.status(400).json({ 
        error: 'Cannot cancel request with current status',
        currentStatus: request.status
      });
    }

    // Update request
    const updated = await prisma.facilityRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelled by applicant',
        eventStatus: 'CANCELLED'
      }
    });

    // Log status change
    await logStatusChange(
      updated.id,
      request.status,
      'CANCELLED',
      contactNumber,
      reason
    );

    res.json({
      message: 'Request cancelled successfully',
      request: updated
    });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

module.exports = router;
