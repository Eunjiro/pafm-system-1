const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { prisma } = require('../database/db');

// Apply authentication and admin authorization
router.use(authenticateToken);
router.use(authorizeRole('ADMIN', 'SUPERVISOR'));

// GET /api/admin/dashboard - Admin analytics dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Overall statistics
    const [
      totalRequests,
      approvedRequests,
      rejectedRequests,
      cancelledRequests,
      pendingRequests,
      totalRevenue,
      exemptedRevenue,
      governmentEvents,
      privateEvents,
      noShows,
      facilitiesCount,
      activeRequests
    ] = await Promise.all([
      prisma.facilityRequest.count({ where: dateFilter }),
      prisma.facilityRequest.count({ where: { ...dateFilter, status: 'APPROVED' } }),
      prisma.facilityRequest.count({ where: { ...dateFilter, status: 'REJECTED' } }),
      prisma.facilityRequest.count({ where: { ...dateFilter, status: 'CANCELLED' } }),
      prisma.facilityRequest.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.facilityRequest.aggregate({
        where: { ...dateFilter, paymentStatus: 'PAID' },
        _sum: { totalAmount: true }
      }),
      prisma.facilityRequest.aggregate({
        where: { ...dateFilter, paymentStatus: 'EXEMPTED' },
        _sum: { totalAmount: true }
      }),
      prisma.facilityRequest.count({ where: { ...dateFilter, eventType: 'GOVERNMENT' } }),
      prisma.facilityRequest.count({ where: { ...dateFilter, eventType: 'PRIVATE' } }),
      prisma.facilityRequest.count({ where: { ...dateFilter, eventStatus: 'NO_SHOW' } }),
      prisma.facility.count({ where: { isActive: true } }),
      prisma.facilityRequest.count({
        where: {
          status: { in: ['PENDING_REVIEW', 'AWAITING_REQUIREMENTS', 'AWAITING_PAYMENT', 'APPROVED'] }
        }
      })
    ]);

    // Facility utilization rate
    const facilityUsage = await prisma.facility.findMany({
      where: { isActive: true },
      include: {
        requests: {
          where: {
            ...dateFilter,
            status: { in: ['APPROVED', 'PENDING_REVIEW', 'AWAITING_PAYMENT'] }
          }
        }
      }
    });

    const utilizationData = facilityUsage.map(facility => ({
      facilityId: facility.id,
      facilityName: facility.name,
      facilityType: facility.type,
      totalBookings: facility.requests.length,
      approvedBookings: facility.requests.filter(r => r.status === 'APPROVED').length
    }));

    // Most requested facilities
    const mostRequested = await prisma.facilityRequest.groupBy({
      by: ['facilityId'],
      where: dateFilter,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    const mostRequestedWithNames = await Promise.all(
      mostRequested.map(async (item) => {
        const facility = await prisma.facility.findUnique({
          where: { id: item.facilityId },
          select: { name: true, type: true }
        });
        return {
          ...facility,
          requestCount: item._count.id
        };
      })
    );

    // Activity type breakdown
    const activityBreakdown = await prisma.facilityRequest.groupBy({
      by: ['activityType'],
      where: dateFilter,
      _count: { id: true }
    });

    // Monthly trend (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const count = await prisma.facilityRequest.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
      });

      monthlyData.push({
        month: startOfMonth.toLocaleString('default', { month: 'short', year: 'numeric' }),
        requests: count
      });
    }

    res.json({
      overview: {
        totalRequests,
        approvedRequests,
        rejectedRequests,
        cancelledRequests,
        pendingRequests,
        activeRequests,
        facilitiesCount
      },
      revenue: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        exemptedRevenue: exemptedRevenue._sum.totalAmount || 0,
        paidRevenue: (totalRevenue._sum.totalAmount || 0)
      },
      usage: {
        governmentEvents,
        privateEvents,
        noShows,
        utilizationRate: totalRequests > 0 ? (approvedRequests / totalRequests * 100).toFixed(2) : 0
      },
      facilityUtilization: utilizationData,
      mostRequestedFacilities: mostRequestedWithNames,
      activityBreakdown,
      monthlyTrend: monthlyData
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// FACILITY MANAGEMENT (CRUD)

// GET /api/admin/facilities - Get all facilities
router.get('/facilities', async (req, res) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: {
        requests: {
          where: {
            status: { in: ['APPROVED', 'PENDING_REVIEW'] }
          },
          select: { id: true, scheduleStart: true, scheduleEnd: true }
        },
        blackoutDates: true,
        _count: { select: { requests: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
});

// POST /api/admin/facility - Create new facility
router.post('/facility', async (req, res) => {
  try {
    const {
      name,
      type,
      capacity,
      description,
      amenities,
      location,
      hourlyRate
    } = req.body;

    const facility = await prisma.facility.create({
      data: {
        name,
        type,
        capacity: parseInt(capacity),
        description,
        amenities: amenities || [],
        location,
        hourlyRate: parseFloat(hourlyRate) || 0,
        isActive: true
      }
    });

    res.status(201).json({ message: 'Facility created successfully', facility });
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({ error: 'Failed to create facility' });
  }
});

// PUT /api/admin/facility/:id - Update facility
router.put('/facility/:id', async (req, res) => {
  try {
    const {
      name,
      type,
      capacity,
      description,
      amenities,
      location,
      hourlyRate,
      isActive
    } = req.body;

    const facility = await prisma.facility.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        type,
        capacity: capacity ? parseInt(capacity) : undefined,
        description,
        amenities,
        location,
        hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    res.json({ message: 'Facility updated successfully', facility });
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({ error: 'Failed to update facility' });
  }
});

// DELETE /api/admin/facility/:id - Delete facility
router.delete('/facility/:id', async (req, res) => {
  try {
    // Check if facility has active requests
    const activeRequests = await prisma.facilityRequest.count({
      where: {
        facilityId: parseInt(req.params.id),
        status: { in: ['PENDING_REVIEW', 'AWAITING_REQUIREMENTS', 'AWAITING_PAYMENT', 'APPROVED'] }
      }
    });

    if (activeRequests > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete facility with active requests',
        activeRequests
      });
    }

    await prisma.facility.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ error: 'Failed to delete facility' });
  }
});

// BLACKOUT DATES MANAGEMENT

// POST /api/admin/blackout-date - Create blackout date
router.post('/blackout-date', async (req, res) => {
  try {
    const { facilityId, startDate, endDate, reason, type } = req.body;

    const blackout = await prisma.blackoutDate.create({
      data: {
        facilityId: parseInt(facilityId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        type: type || 'MAINTENANCE'
      },
      include: {
        facility: { select: { name: true } }
      }
    });

    res.status(201).json({ message: 'Blackout date created successfully', blackout });
  } catch (error) {
    console.error('Error creating blackout date:', error);
    res.status(500).json({ error: 'Failed to create blackout date' });
  }
});

// GET /api/admin/blackout-dates - Get all blackout dates
router.get('/blackout-dates', async (req, res) => {
  try {
    const { facilityId } = req.query;

    const where = facilityId ? { facilityId: parseInt(facilityId) } : {};

    const blackouts = await prisma.blackoutDate.findMany({
      where,
      include: {
        facility: { select: { name: true, type: true } }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json(blackouts);
  } catch (error) {
    console.error('Error fetching blackout dates:', error);
    res.status(500).json({ error: 'Failed to fetch blackout dates' });
  }
});

// DELETE /api/admin/blackout-date/:id - Delete blackout date
router.delete('/blackout-date/:id', async (req, res) => {
  try {
    await prisma.blackoutDate.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Blackout date deleted successfully' });
  } catch (error) {
    console.error('Error deleting blackout date:', error);
    res.status(500).json({ error: 'Failed to delete blackout date' });
  }
});

// REQUEST MANAGEMENT

// GET /api/admin/all-requests - Get all requests (with advanced filtering)
router.get('/all-requests', async (req, res) => {
  try {
    const { status, eventType, startDate, endDate, facilityId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (eventType) where.eventType = eventType;
    if (facilityId) where.facilityId = parseInt(facilityId);
    if (startDate && endDate) {
      where.scheduleStart = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const requests = await prisma.facilityRequest.findMany({
      where,
      include: {
        facility: { select: { name: true, type: true } },
        handledBy: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// PUT /api/admin/override-status/:id - Override request status
router.put('/override-status/:id', async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const updated = await prisma.facilityRequest.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status,
        remarks,
        ...(status === 'APPROVED' && { approvedAt: new Date() }),
        ...(status === 'REJECTED' && { rejectedAt: new Date() }),
        ...(status === 'CANCELLED' && { cancelledAt: new Date(), cancellationReason: remarks })
      }
    });

    await prisma.statusHistory.create({
      data: {
        requestId: updated.id,
        fromStatus: updated.status,
        toStatus: status,
        changedBy: req.user.email,
        remarks: `Admin override: ${remarks || 'No remarks'}`
      }
    });

    res.json({ message: 'Status overridden successfully', request: updated });
  } catch (error) {
    console.error('Error overriding status:', error);
    res.status(500).json({ error: 'Failed to override status' });
  }
});

// PUT /api/admin/reassign/:id - Reassign request handler
router.put('/reassign/:id', async (req, res) => {
  try {
    const { handlerId } = req.body;

    const updated = await prisma.facilityRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { handledById: parseInt(handlerId) },
      include: {
        handledBy: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    await prisma.statusHistory.create({
      data: {
        requestId: updated.id,
        fromStatus: updated.status,
        toStatus: updated.status,
        changedBy: req.user.email,
        remarks: `Request reassigned to ${updated.handledBy?.email}`
      }
    });

    res.json({ message: 'Request reassigned successfully', request: updated });
  } catch (error) {
    console.error('Error reassigning request:', error);
    res.status(500).json({ error: 'Failed to reassign request' });
  }
});

// GET /api/admin/reports/export - Export data to CSV
router.get('/reports/export', async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const requests = await prisma.facilityRequest.findMany({
      where,
      include: {
        facility: { select: { name: true, type: true } },
        handledBy: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'json') {
      return res.json(requests);
    }

    // CSV format
    const headers = [
      'Request Number',
      'Applicant Name',
      'Organization',
      'Facility',
      'Activity Type',
      'Schedule Start',
      'Schedule End',
      'Status',
      'Payment Status',
      'Total Amount',
      'Event Type',
      'Handled By',
      'Created At'
    ].join(',');

    const rows = requests.map(r => [
      r.requestNumber,
      r.applicantName,
      r.organizationName || 'N/A',
      r.facility.name,
      r.activityType,
      r.scheduleStart.toISOString(),
      r.scheduleEnd.toISOString(),
      r.status,
      r.paymentStatus,
      r.totalAmount,
      r.eventType,
      r.handledBy ? `${r.handledBy.firstName} ${r.handledBy.lastName}` : 'Unassigned',
      r.createdAt.toISOString()
    ].join(','));

    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=facility-requests.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// GET /api/admin/users - Get all staff users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        _count: {
          select: { handledRequests: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
