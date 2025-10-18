const express = require('express');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { requireCitizen, requireEmployee, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/permits');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  }
});

// Debug endpoint - no auth required (place before auth middleware)
router.get('/debug', async (req, res) => {
  try {
    console.log('=== DEBUG: Fetching all permits without auth ===');
    
    const permits = await prisma.permitRequest.findMany({
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
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${permits.length} permits in database`);

    const transformedPermits = permits.map(permit => ({
      ...permit,
      permitType: permit.permitType.toLowerCase(),
      status: permit.status.toLowerCase(),
      requester: permit.citizen
    }));

    res.json({
      success: true,
      count: permits.length,
      permits: transformedPermits,
      message: 'Debug data retrieved successfully'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch debug data',
      details: error.message 
    });
  }
});

// Get citizen's own permits
router.get('/citizen/:citizenId', requireCitizen, async (req, res) => {
  try {
    const citizenId = parseInt(req.params.citizenId);
    
    // Ensure citizen can only access their own permits
    if (req.user.id !== citizenId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const permits = await prisma.permitRequest.findMany({
      where: { citizenUserId: citizenId },
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to match frontend expectations
    const transformedPermits = permits.map(permit => ({
      ...permit,
      permitType: permit.permitType.toLowerCase(),
      status: permit.status.toLowerCase()
    }));

    res.json({ permits: transformedPermits });
  } catch (error) {
    console.error('Error fetching citizen permits:', error);
    res.status(500).json({ error: 'Failed to fetch permits' });
  }
});

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
router.post('/', requireCitizen, upload.any(), async (req, res) => {
  try {
    console.log('Creating permit with form data...');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const { 
      permitType, 
      deceasedId, 
      requestedDate,
      requestedTime,
      plotPreference,
      specialRequests,
      contactPerson,
      contactNumber,
      submittedBy
    } = req.body;
    
    // Validate permit type
    if (!['BURIAL', 'EXHUMATION', 'CREMATION'].includes(permitType?.toUpperCase())) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid permit type. Must be BURIAL, EXHUMATION, or CREMATION' 
      });
    }

    // Validate required fields
    if (!deceasedId) {
      return res.status(400).json({ 
        success: false,
        error: 'Deceased ID is required' 
      });
    }

    // Create the permit with additional fields
    const permitData = {
      permitType: permitType.toUpperCase(),
      status: 'SUBMITTED',
      amountDue: getPermitFee(permitType.toLowerCase()),
      deathId: parseInt(deceasedId),
      citizenUserId: req.user.id,
      remarks: 'New permit request submitted',
    };

    // Add optional fields if provided
    if (requestedDate) {
      // Store additional data in remarks for now (you may want to add these fields to schema)
      permitData.remarks += `\nRequested Date: ${requestedDate}`;
      if (requestedTime) {
        permitData.remarks += ` at ${requestedTime}`;
      }
    }
    
    if (plotPreference) {
      permitData.remarks += `\nPlot Preference: ${plotPreference}`;
    }
    
    if (specialRequests) {
      permitData.remarks += `\nSpecial Requests: ${specialRequests}`;
    }
    
    if (contactPerson) {
      permitData.remarks += `\nContact Person: ${contactPerson}`;
    }
    
    if (contactNumber) {
      permitData.remarks += `\nContact Number: ${contactNumber}`;
    }

    const permit = await prisma.permitRequest.create({
      data: permitData,
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

    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files...`);
      
      for (const file of req.files) {
        console.log(`Saving document: ${file.originalname} (${file.mimetype})`);
        
        // Extract document type from fieldname (e.g., "document_death_certificate" -> "death_certificate")
        const documentType = file.fieldname.replace('document_', '');
        
        // First, create the Document record
        const document = await prisma.document.create({
          data: {
            uploadedBy: req.user.id,
            fileName: file.originalname,
            filePath: file.path,
            mimeType: file.mimetype,
            fileSizeBytes: BigInt(file.size)
          }
        });

        // Then, create the PermitDocument link
        await prisma.permitDocument.create({
          data: {
            permitId: permit.id,
            documentId: document.id,
            docType: documentType
          }
        });
      }
    }

    // Transform for frontend compatibility
    const transformedPermit = {
      ...permit,
      permitType: permit.permitType.toLowerCase(),
      status: permit.status.toLowerCase(),
      requester: permit.citizen
    };

    console.log(`Created permit: ${permit.id} for deceased: ${permit.deceased.firstName} ${permit.deceased.lastName}`);

    res.status(201).json({ 
      success: true,
      data: transformedPermit,
      message: 'Permit request created successfully'
    });
  } catch (error) {
    console.error('Error creating permit:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create permit',
      details: error.message
    });
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