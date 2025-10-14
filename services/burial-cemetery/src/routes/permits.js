const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireCitizen, requireEmployee, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all permits (employee/admin access)
router.get('/', requireEmployee, async (req, res) => {
  try {
    const { permitType, status, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (permitType && ['BURIAL', 'EXHUMATION', 'CREMATION'].includes(permitType.toUpperCase())) {
      where.permitType = permitType.toUpperCase();
    }
    if (status) {
      where.status = status.toUpperCase();
    }

    const permits = await prisma.permitRequest.findMany({
      where,
      include: {
        deceased: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
            dateOfDeath: true
          }
        },
        citizen: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameLast: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // Transform the data to match frontend expectations
    const transformedPermits = permits.map(permit => ({
      ...permit,
      permitType: permit.permitType.toLowerCase(),
      status: permit.status.toLowerCase(),
      requester: permit.citizen // Map citizen to requester for frontend compatibility
    }));

    const total = await prisma.permitRequest.count({ where });

    res.json({
      permits: transformedPermits,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching permits:', error);
    res.status(500).json({ error: 'Failed to fetch permits' });
  }
});

// Get specific permit
router.get('/:id', requireEmployee, async (req, res) => {
  try {
    const permit = await prisma.permitRequest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        deceased: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
            dateOfDeath: true,
            dateOfBirth: true,
            placeOfDeath: true
          }
        },
        citizen: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameLast: true,
            email: true,
            contactNo: true
          }
        }
      }
    });

    if (!permit) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    // Transform for frontend compatibility
    const transformedPermit = {
      ...permit,
      permitType: permit.permitType.toLowerCase(),
      status: permit.status.toLowerCase(),
      requester: permit.citizen
    };

    res.json({ permit: transformedPermit });
  } catch (error) {
    console.error('Error fetching permit:', error);
    res.status(500).json({ error: 'Failed to fetch permit' });
  }
});

// Create new permit request
router.post('/', requireCitizen, async (req, res) => {
  try {
    const { permitType, deceasedId, documents } = req.body;
    
    // Validate permit type
    if (!['burial', 'exhumation', 'cremation'].includes(permitType.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid permit type' });
    }

    // Create the permit
    const permit = await prisma.permitRequest.create({
      data: {
        permitType: permitType.toUpperCase(),
        status: 'SUBMITTED',
        amountDue: getPermitFee(permitType.toLowerCase()),
        deathId: parseInt(deceasedId),
        citizenUserId: req.user.id,
        remarks: 'New permit request submitted'
      },
      include: {
        deceased: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
            dateOfDeath: true
          }
        },
        citizen: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameLast: true,
            email: true
          }
        }
      }
    });

    // Transform for frontend compatibility
    const transformedPermit = {
      ...permit,
      permitType: permit.permitType.toLowerCase(),
      status: permit.status.toLowerCase(),
      requester: permit.citizen
    };

    res.status(201).json({ permit: transformedPermit });
  } catch (error) {
    console.error('Error creating permit:', error);
    res.status(500).json({ error: 'Failed to create permit' });
  }
});

// Update permit status (employee/admin)
router.put('/:id/status', requireEmployee, async (req, res) => {
  try {
    const { status, notes, orNumber } = req.body;
    
    const validStatuses = [
      'DRAFT', 'SUBMITTED', 'PENDING_VERIFICATION', 'FOR_PAYMENT', 'PAID',
      'ISSUED', 'FOR_PICKUP', 'CLAIMED', 'REJECTED', 'CANCELLED'
    ];
    
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status: status.toUpperCase(),
      ...(notes && { remarks: notes }),
      ...(orNumber && { orNumber })
    };

    if (status.toUpperCase() === 'ISSUED') {
      updateData.issuedAt = new Date();
      updateData.pickupStatus = 'READY';
    }

    const permit = await prisma.permitRequest.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: {
        deceased: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
            dateOfDeath: true
          }
        },
        citizen: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameLast: true,
            email: true
          }
        }
      }
    });

    // Transform for frontend compatibility
    const transformedPermit = {
      ...permit,
      permitType: permit.permitType.toLowerCase(),
      status: permit.status.toLowerCase(),
      requester: permit.citizen
    };

    res.json({ permit: transformedPermit });
  } catch (error) {
    console.error('Error updating permit status:', error);
    res.status(500).json({ error: 'Failed to update permit status' });
  }
});

// Admin override endpoint
router.post('/:id/override', requireAdmin, async (req, res) => {
  try {
    const { action, reason, adminId, newAmount } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Override reason is required' });
    }

    const permitId = parseInt(req.params.id);
    const permit = await prisma.permitRequest.findUnique({
      where: { id: permitId }
    });

    if (!permit) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    let updateData = {};
    
    switch (action) {
      case 'approve':
        updateData = {
          status: 'ISSUED',
          issuedAt: new Date(),
          pickupStatus: 'READY',
          remarks: `Admin Override: ${reason}`
        };
        break;
      case 'reject':
        updateData = {
          status: 'REJECTED',
          remarks: `Admin Override: ${reason}`
        };
        break;
      case 'waive_fee':
        updateData = {
          amountDue: 0,
          remarks: `Admin Override - Fee Waived: ${reason}`
        };
        break;
      case 'adjust_fee':
        updateData = {
          amountDue: parseFloat(newAmount) || 0,
          remarks: `Admin Override - Fee Adjusted to ₱${parseFloat(newAmount) || 0}: ${reason}`
        };
        break;
      case 'reset_status':
        updateData = {
          status: 'SUBMITTED',
          issuedAt: null,
          pickupStatus: 'NOT_READY',
          remarks: `Admin Override - Status Reset: ${reason}`
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid override action' });
    }

    // Record the override in audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: parseInt(adminId) || req.user.id,
        action: `PERMIT_OVERRIDE_${action.toUpperCase()}`,
        moduleName: 'PERMITS',
        details: `Permit ID ${permitId}: ${action} - ${reason}. Previous status: ${permit.status}`
      }
    });

    const updatedPermit = await prisma.permitRequest.update({
      where: { id: permitId },
      data: updateData,
      include: {
        deceased: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            suffix: true,
            dateOfDeath: true
          }
        },
        citizen: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameLast: true,
            email: true
          }
        }
      }
    });

    // Transform for frontend compatibility
    const transformedPermit = {
      ...updatedPermit,
      permitType: updatedPermit.permitType.toLowerCase(),
      status: updatedPermit.status.toLowerCase(),
      requester: updatedPermit.citizen
    };

    res.json({ 
      permit: transformedPermit,
      message: 'Admin override executed successfully'
    });
  } catch (error) {
    console.error('Error executing admin override:', error);
    res.status(500).json({ error: 'Failed to execute admin override' });
  }
});

// Helper function to calculate permit fees
function getPermitFee(permitType) {
  const fees = {
    burial: 500,
    exhumation: 1000,
    cremation: 750
  };
  return fees[permitType] || 500;
}

module.exports = router;