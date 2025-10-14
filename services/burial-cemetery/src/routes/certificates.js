const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireCitizen, requireEmployee } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /certificates - List certificate requests with filtering
router.get('/', requireEmployee, async (req, res) => {
  try {
    const { status, certRequestType, page = 1, limit = 50 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (certRequestType) where.certRequestType = certRequestType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [requests, total] = await Promise.all([
      prisma.certificateRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              fullNameFirst: true,
              fullNameLast: true,
              email: true
            }
          },
          deceased: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              lastName: true,
              dateOfDeath: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.certificateRequest.count({ where })
    ]);

    // Transform data for frontend compatibility
    const transformedRequests = requests.map(request => ({
      id: request.id,
      certificateType: request.certRequestType,
      status: request.status,
      copies: request.copies,
      amountDue: parseFloat(request.amountDue),
      orNumber: request.paymentOrderNo,
      createdAt: request.createdAt.toISOString(),
      deceased: request.deceased,
      requester: request.requester,
      relationshipToDeceased: request.relationshipToDeceased,
      purpose: request.purpose,
      pickupStatus: request.pickupStatus,
      remarks: request.remarks
    }));

    res.json({
      success: true,
      requests: transformedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching certificate requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate requests',
      error: error.message
    });
  }
});

// POST /certificates - Create new certificate request
router.post('/', requireCitizen, async (req, res) => {
  try {
    const {
      certRequestType,
      deathId,
      relationshipToDeceased,
      purpose,
      copies = 1
    } = req.body;

    // Calculate amount due based on certificate type and copies
    const baseAmount = certRequestType === 'DEATH' ? 50.00 : 
                      certRequestType === 'BIRTH' ? 30.00 :
                      certRequestType === 'MARRIAGE' ? 40.00 : 25.00;
    const amountDue = baseAmount * copies;

    const certificateRequest = await prisma.certificateRequest.create({
      data: {
        certRequestType,
        deathId,
        requesterUserId: req.user.id,
        relationshipToDeceased,
        purpose,
        copies,
        amountDue,
        status: 'SUBMITTED'
      },
      include: {
        requester: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameLast: true,
            email: true
          }
        },
        deceased: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            dateOfDeath: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: req.user.id,
        action: 'CERTIFICATE_REQUEST_CREATED',
        moduleName: 'CERTIFICATES',
        referenceId: certificateRequest.id,
        details: `Certificate request created for ${certRequestType} certificate, ${copies} copies`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Certificate request created successfully',
      request: {
        id: certificateRequest.id,
        certificateType: certificateRequest.certRequestType,
        status: certificateRequest.status,
        copies: certificateRequest.copies,
        amountDue: parseFloat(certificateRequest.amountDue),
        createdAt: certificateRequest.createdAt.toISOString(),
        deceased: certificateRequest.deceased,
        requester: certificateRequest.requester
      }
    });
  } catch (error) {
    console.error('Error creating certificate request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create certificate request',
      error: error.message
    });
  }
});

// GET /certificates/:id - Get specific certificate request
router.get('/:id', requireCitizen, async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await prisma.certificateRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        requester: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameLast: true,
            email: true
          }
        },
        deceased: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            dateOfDeath: true
          }
        },
        documents: {
          include: {
            document: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Certificate request not found'
      });
    }

    // Check if user has permission to view this request
    if (req.user.role === 'CITIZEN' && request.requesterUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      request: {
        id: request.id,
        certificateType: request.certRequestType,
        status: request.status,
        copies: request.copies,
        amountDue: parseFloat(request.amountDue),
        orNumber: request.paymentOrderNo,
        createdAt: request.createdAt.toISOString(),
        deceased: request.deceased,
        requester: request.requester,
        relationshipToDeceased: request.relationshipToDeceased,
        purpose: request.purpose,
        pickupStatus: request.pickupStatus,
        remarks: request.remarks,
        documents: request.documents
      }
    });
  } catch (error) {
    console.error('Error fetching certificate request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate request',
      error: error.message
    });
  }
});

// PATCH /certificates/:id/status - Update certificate request status (Admin/Employee only)
router.patch('/:id/status', requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, orNumber, amountDue } = req.body;

    const updateData = { status };
    if (remarks) updateData.remarks = remarks;
    if (orNumber) updateData.paymentOrderNo = orNumber;
    if (amountDue !== undefined) updateData.amountDue = parseFloat(amountDue);

    // Update pickup status based on certificate status
    if (status === 'READY_FOR_PICKUP') {
      updateData.pickupStatus = 'READY_FOR_PICKUP';
    } else if (status === 'CLAIMED') {
      updateData.pickupStatus = 'CLAIMED';
    }

    const updatedRequest = await prisma.certificateRequest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameLast: true,
            email: true
          }
        },
        deceased: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            dateOfDeath: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorUserId: req.user.id,
        action: 'CERTIFICATE_STATUS_UPDATED',
        moduleName: 'CERTIFICATES',
        referenceId: parseInt(id),
        details: `Status updated to ${status}${remarks ? ` - ${remarks}` : ''}`
      }
    });

    res.json({
      success: true,
      message: 'Certificate request status updated successfully',
      request: {
        id: updatedRequest.id,
        certificateType: updatedRequest.certRequestType,
        status: updatedRequest.status,
        copies: updatedRequest.copies,
        amountDue: parseFloat(updatedRequest.amountDue),
        orNumber: updatedRequest.paymentOrderNo,
        createdAt: updatedRequest.createdAt.toISOString(),
        deceased: updatedRequest.deceased,
        requester: updatedRequest.requester,
        pickupStatus: updatedRequest.pickupStatus,
        remarks: updatedRequest.remarks
      }
    });
  } catch (error) {
    console.error('Error updating certificate request status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update certificate request status',
      error: error.message
    });
  }
});

// POST /certificates/:id/override - Admin override functionality
router.post('/:id/override', requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, adminId, newAmount } = req.body;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required for override actions'
      });
    }

    const request = await prisma.certificateRequest.findUnique({
      where: { id: parseInt(id) }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Certificate request not found'
      });
    }

    let updateData = { remarks: reason };
    let auditMessage = '';

    switch (action) {
      case 'approve':
        updateData.status = 'READY_FOR_PICKUP';
        updateData.pickupStatus = 'READY_FOR_PICKUP';
        auditMessage = 'Admin override: Force approved certificate request';
        break;
      case 'reject':
        updateData.status = 'REJECTED';
        auditMessage = 'Admin override: Force rejected certificate request';
        break;
      case 'waive_fee':
        updateData.amountDue = 0.00;
        updateData.status = 'READY_FOR_PICKUP';
        updateData.pickupStatus = 'READY_FOR_PICKUP';
        auditMessage = 'Admin override: Fee waived for certificate request';
        break;
      case 'expedite':
        updateData.status = 'PROCESSING';
        auditMessage = 'Admin override: Expedited certificate request processing';
        break;
      case 'adjust_fee':
        if (newAmount !== undefined) {
          updateData.amountDue = parseFloat(newAmount);
          auditMessage = `Admin override: Fee adjusted to ₱${newAmount}`;
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid override action'
        });
    }

    const updatedRequest = await prisma.certificateRequest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameLast: true,
            email: true
          }
        },
        deceased: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            dateOfDeath: true
          }
        }
      }
    });

    // Create audit log for admin override
    await prisma.auditLog.create({
      data: {
        actorUserId: adminId || req.user.id,
        action: 'CERTIFICATE_ADMIN_OVERRIDE',
        moduleName: 'CERTIFICATES',
        referenceId: parseInt(id),
        details: `${auditMessage}. Reason: ${reason}`
      }
    });

    res.json({
      success: true,
      message: 'Admin override executed successfully',
      request: {
        id: updatedRequest.id,
        certificateType: updatedRequest.certRequestType,
        status: updatedRequest.status,
        copies: updatedRequest.copies,
        amountDue: parseFloat(updatedRequest.amountDue),
        orNumber: updatedRequest.paymentOrderNo,
        createdAt: updatedRequest.createdAt.toISOString(),
        deceased: updatedRequest.deceased,
        requester: updatedRequest.requester,
        pickupStatus: updatedRequest.pickupStatus,
        remarks: updatedRequest.remarks
      }
    });
  } catch (error) {
    console.error('Error executing admin override:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute admin override',
      error: error.message
    });
  }
});

module.exports = router;