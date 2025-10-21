const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { requireCitizen, requireEmployee, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to convert BigInt to Number for JSON serialization
const convertBigIntToNumber = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToNumber(item));
  }
  
  if (typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }
  
  return obj;
};

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/documents');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all death registrations (admin/employee)
router.get('/', requireEmployee, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (type) where.registrationType = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const registrations = await prisma.deathRegistration.findMany({
      where,
      include: {
        deceased: true,
        submitter: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameMiddle: true,
            fullNameLast: true,
            email: true,
            contactNo: true
          }
        },
        payment: true,
        documents: {
          include: {
            document: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.deathRegistration.count({ where });

    res.json({
      registrations: convertBigIntToNumber(registrations),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching death registrations:', error);
    res.status(500).json({ error: 'Failed to fetch death registrations' });
  }
});

// Get citizen's own death registrations
router.get('/citizen/my-applications', requireCitizen, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const where = {
      submittedBy: req.user.id // Only get applications submitted by this citizen
    };
    
    if (status) {
      // Handle comma-separated status values
      const statusArray = status.split(',').map(s => s.trim());
      if (statusArray.length === 1) {
        where.status = status;
      } else {
        where.status = { in: statusArray };
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const registrations = await prisma.deathRegistration.findMany({
      where,
      include: {
        deceased: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true,
            dateOfDeath: true
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            orNumber: true,
            paymentStatus: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.deathRegistration.count({ where });

    // Get status counts for the citizen
    const statusCounts = await prisma.deathRegistration.groupBy({
      by: ['status'],
      where: { submittedBy: req.user.id },
      _count: {
        status: true
      }
    });

    const counts = {
      total,
      PENDING_VERIFICATION: 0,
      PROCESSING: 0,
      REGISTERED: 0,
      FOR_PICKUP: 0,
      CLAIMED: 0,
      REJECTED: 0
    };

    statusCounts.forEach(item => {
      counts[item.status] = item._count.status;
    });

    res.json({
      registrations: convertBigIntToNumber(registrations),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      counts
    });
  } catch (error) {
    console.error('Error fetching citizen applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get deceased records for certificate requests (citizen access)
router.get('/deceased', requireCitizen, async (req, res) => {
  try {
    console.log('[DEBUG] Fetching deceased records for user:', req.user.id);
    
    // First, check all registrations by this user
    const allRegistrations = await prisma.deathRegistration.findMany({
      where: { 
        submittedBy: req.user.id
      },
      select: {
        id: true,
        status: true
      }
    });
    
    console.log('[DEBUG] Total registrations by user:', allRegistrations.length);
    console.log('[DEBUG] Registration statuses:', allRegistrations.map(r => ({ id: r.id, status: r.status })));
    
    // Get all death registrations submitted by this citizen with eligible statuses
    const registrations = await prisma.deathRegistration.findMany({
      where: { 
        submittedBy: req.user.id,
        status: {
          in: ['REGISTERED', 'FOR_PICKUP', 'CLAIMED'] // Only registered/completed registrations
        }
      },
      include: {
        deceased: true
      }
    });

    console.log('[DEBUG] Eligible registrations:', registrations.length);

    // Extract unique deceased records
    const deceased = registrations
      .filter(reg => reg.deceased)
      .map(reg => ({
        id: reg.deceased.id,
        firstName: reg.deceased.firstName,
        middleName: reg.deceased.middleName,
        lastName: reg.deceased.lastName,
        suffix: reg.deceased.suffix,
        dateOfDeath: reg.deceased.dateOfDeath
      }));

    // Remove duplicates based on deceased id
    const uniqueDeceased = Array.from(
      new Map(deceased.map(item => [item.id, item])).values()
    );

    console.log('[DEBUG] Unique deceased records:', uniqueDeceased.length);

    res.json({
      deceased: convertBigIntToNumber(uniqueDeceased)
    });
  } catch (error) {
    console.error('Error fetching deceased records:', error);
    res.status(500).json({ error: 'Failed to fetch deceased records' });
  }
});

// Get specific death registration (citizen can only view their own)
router.get('/citizen/:id', requireCitizen, async (req, res) => {
  try {
    const registration = await prisma.deathRegistration.findFirst({
      where: { 
        id: parseInt(req.params.id),
        submittedBy: req.user.id // Citizens can only view their own applications
      },
      include: {
        deceased: true,
        submitter: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameMiddle: true,
            fullNameLast: true,
            email: true,
            contactNo: true
          }
        },
        payment: true,
        documents: {
          include: {
            document: true
          }
        }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Death registration not found or access denied' });
    }

    res.json(convertBigIntToNumber(registration));
  } catch (error) {
    console.error('Error fetching citizen death registration:', error);
    res.status(500).json({ error: 'Failed to fetch death registration' });
  }
});

// Get specific death registration (employee access)
router.get('/:id', requireEmployee, async (req, res) => {
  try {
    const registration = await prisma.deathRegistration.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        deceased: true,
        submitter: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameMiddle: true,
            fullNameLast: true,
            email: true,
            contactNo: true,
            address: true
          }
        },
        payment: true,
        documents: {
          include: {
            document: true
          }
        }
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Death registration not found' });
    }

    res.json(convertBigIntToNumber(registration));
  } catch (error) {
    console.error('Error fetching death registration:', error);
    res.status(500).json({ error: 'Failed to fetch death registration' });
  }
});

// Create new death registration (citizen submission)
router.post('/citizen', requireCitizen, async (req, res) => {
  try {
    const {
      registrationType,
      deceased,
      informantName,
      informantRelationship,
      informantContact,
      submittedBy,
      amountDue,
      remarks
    } = req.body;

    // Validate required fields
    if (!registrationType || !deceased || !informantName) {
      return res.status(400).json({ 
        error: 'Missing required fields: registrationType, deceased, informantName' 
      });
    }

    // Create deceased record first
    const deceasedRecord = await prisma.deceasedRecord.create({
      data: {
        firstName: deceased.firstName,
        middleName: deceased.middleName,
        lastName: deceased.lastName,
        suffix: deceased.suffix,
        sex: deceased.sex,
        dateOfBirth: deceased.dateOfBirth ? new Date(deceased.dateOfBirth) : null,
        dateOfDeath: deceased.dateOfDeath ? new Date(deceased.dateOfDeath) : null,
        age: deceased.age ? parseInt(deceased.age) : null,
        placeOfDeath: deceased.placeOfDeath,
        residenceAddress: deceased.residenceAddress,
        citizenship: deceased.citizenship,
        civilStatus: deceased.civilStatus,
        occupation: deceased.occupation,
        causeOfDeath: deceased.causeOfDeath,
        covidRelated: deceased.covidRelated || false
      }
    });

    // Create death registration with PENDING_VERIFICATION status (citizens submit for review)
    const registration = await prisma.deathRegistration.create({
      data: {
        registrationType,
        deceasedId: deceasedRecord.id,
        submittedBy: submittedBy ? parseInt(submittedBy) : req.user.id,
        informantName,
        informantRelationship,
        informantContact,
        amountDue: amountDue ? parseFloat(amountDue) : 50.00,
        status: 'PENDING_VERIFICATION', // Citizens submit as PENDING_VERIFICATION (default status)
        remarks: remarks || 'Submitted by citizen through online portal'
      },
      include: {
        deceased: true,
        submitter: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameMiddle: true,
            fullNameLast: true,
            email: true,
            contactNo: true
          }
        }
      }
    });

    res.status(201).json(registration);
  } catch (error) {
    console.error('Error creating citizen death registration:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to create death registration' 
    });
  }
});

// Create new death registration (admin manual entry)
router.post('/', requireEmployee, async (req, res) => {
  try {
    const {
      registrationType,
      deceased,
      informantName,
      informantRelationship,
      informantContact,
      submittedBy,
      amountDue,
      remarks
    } = req.body;

    // Validate required fields
    if (!registrationType || !deceased || !informantName) {
      return res.status(400).json({ 
        error: 'Missing required fields: registrationType, deceased, informantName' 
      });
    }

    // Create deceased record first
    const deceasedRecord = await prisma.deceasedRecord.create({
      data: {
        firstName: deceased.firstName,
        middleName: deceased.middleName,
        lastName: deceased.lastName,
        suffix: deceased.suffix,
        sex: deceased.sex,
        dateOfBirth: deceased.dateOfBirth ? new Date(deceased.dateOfBirth) : null,
        dateOfDeath: deceased.dateOfDeath ? new Date(deceased.dateOfDeath) : null,
        age: deceased.age ? parseInt(deceased.age) : null,
        placeOfDeath: deceased.placeOfDeath,
        residenceAddress: deceased.residenceAddress,
        citizenship: deceased.citizenship,
        civilStatus: deceased.civilStatus,
        occupation: deceased.occupation,
        causeOfDeath: deceased.causeOfDeath,
        covidRelated: deceased.covidRelated || false
      }
    });

    // Create death registration
    const registration = await prisma.deathRegistration.create({
      data: {
        registrationType,
        deceasedId: deceasedRecord.id,
        submittedBy: submittedBy ? parseInt(submittedBy) : null,
        informantName,
        informantRelationship,
        informantContact,
        status: 'PENDING_VERIFICATION',
        amountDue: amountDue ? parseFloat(amountDue) : (registrationType === 'REGULAR' ? 50.00 : 150.00),
        remarks,
        processingDueAt: registrationType === 'REGULAR' 
          ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
          : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days
      },
      include: {
        deceased: true,
        submitter: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameMiddle: true,
            fullNameLast: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(registration);
  } catch (error) {
    console.error('Error creating death registration:', error);
    res.status(500).json({ error: 'Failed to create death registration' });
  }
});

// Update death registration status
router.put('/:id/status', requireEmployee, async (req, res) => {
  try {
    const { status, orNumber, registeredBy, remarks } = req.body;
    const registrationId = parseInt(req.params.id);
    
    console.log(`Updating registration ${registrationId} status to:`, { status, orNumber, registeredBy, remarks });
    
    // Validate the registration exists first
    const existingRegistration = await prisma.deathRegistration.findUnique({
      where: { id: registrationId }
    });
    
    if (!existingRegistration) {
      return res.status(404).json({ error: 'Death registration not found' });
    }
    
    // Validate status value
    const validStatuses = [
      'DRAFT', 'SUBMITTED', 'PENDING_VERIFICATION', 'FOR_PAYMENT', 
      'PAID', 'PROCESSING', 'REGISTERED', 'FOR_PICKUP', 'CLAIMED', 
      'RETURNED', 'REJECTED', 'EXPIRED'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (orNumber) updateData.orNumber = orNumber;
    if (registeredBy) updateData.registeredBy = parseInt(registeredBy);
    if (remarks) updateData.remarks = remarks;
    
    if (status === 'REGISTERED') {
      updateData.registeredAt = new Date();
      updateData.pickupStatus = 'READY_FOR_PICKUP';
    }

    console.log('Update data:', updateData);

    const registration = await prisma.deathRegistration.update({
      where: { id: registrationId },
      data: updateData,
      include: {
        deceased: true,
        submitter: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameMiddle: true,
            fullNameLast: true,
            email: true
          }
        }
      }
    });

    console.log('Registration updated successfully:', registration.id, registration.status);
    res.json(convertBigIntToNumber(registration));
  } catch (error) {
    console.error('Error updating death registration status:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Unique constraint violation',
        details: error.meta?.target ? `Duplicate value for: ${error.meta.target.join(', ')}` : 'Duplicate value detected'
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Record not found',
        details: 'The death registration you are trying to update does not exist'
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Foreign key constraint violation',
        details: 'Referenced record does not exist'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update status',
      details: error.message || 'An unexpected error occurred while updating the registration status',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Update death registration
router.put('/:id', requireEmployee, async (req, res) => {
  try {
    const {
      deceased,
      informantName,
      informantRelationship,
      informantContact,
      amountDue,
      remarks
    } = req.body;

    const registration = await prisma.deathRegistration.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { deceased: true }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Death registration not found' });
    }

    // Update deceased record if provided
    if (deceased && registration.deceasedId) {
      await prisma.deceasedRecord.update({
        where: { id: registration.deceasedId },
        data: {
          firstName: deceased.firstName,
          middleName: deceased.middleName,
          lastName: deceased.lastName,
          suffix: deceased.suffix,
          sex: deceased.sex,
          dateOfBirth: deceased.dateOfBirth ? new Date(deceased.dateOfBirth) : null,
          dateOfDeath: deceased.dateOfDeath ? new Date(deceased.dateOfDeath) : null,
          age: deceased.age ? parseInt(deceased.age) : null,
          placeOfDeath: deceased.placeOfDeath,
          residenceAddress: deceased.residenceAddress,
          citizenship: deceased.citizenship,
          civilStatus: deceased.civilStatus,
          occupation: deceased.occupation,
          causeOfDeath: deceased.causeOfDeath,
          covidRelated: deceased.covidRelated || false
        }
      });
    }

    // Update registration
    const updatedRegistration = await prisma.deathRegistration.update({
      where: { id: parseInt(req.params.id) },
      data: {
        informantName,
        informantRelationship,
        informantContact,
        amountDue: amountDue ? parseFloat(amountDue) : undefined,
        remarks
      },
      include: {
        deceased: true,
        submitter: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameMiddle: true,
            fullNameLast: true,
            email: true
          }
        }
      }
    });

    res.json(convertBigIntToNumber(updatedRegistration));
  } catch (error) {
    console.error('Error updating death registration:', error);
    res.status(500).json({ error: 'Failed to update death registration' });
  }
});

// Admin override endpoint
router.post('/:id/override', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason, adminId, adminEmail, timestamp } = req.body;

    // Validate required fields
    if (!action || !reason?.trim()) {
      return res.status(400).json({ 
        error: 'Action and reason are required for administrative overrides' 
      });
    }

    // Validate action type
    const validActions = ['approve', 'reject', 'edit', 'waive_fee', 'reset_status', 'adjust_fee'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ 
        error: `Invalid action. Must be one of: ${validActions.join(', ')}` 
      });
    }

    // Get current registration
    const registration = await prisma.deathRegistration.findUnique({
      where: { id: parseInt(id) },
      include: {
        deceased: true,
        submitter: true,
        payment: true
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Death registration not found' });
    }

    // Apply the override action
    let updates = {};
    let auditMessage = '';

    switch (action) {
      case 'approve':
        updates.status = 'approved';
        auditMessage = `Registration force approved by admin: ${reason}`;
        break;
      case 'reject':
        updates.status = 'rejected';
        auditMessage = `Registration force rejected by admin: ${reason}`;
        break;
      case 'waive_fee':
        updates.amountDue = 0;
        auditMessage = `Fee waived by admin: ${reason}`;
        break;
      case 'adjust_fee':
        // This would require additional fee amount in the request
        auditMessage = `Fee adjusted by admin: ${reason}`;
        break;
      case 'reset_status':
        updates.status = 'submitted';
        auditMessage = `Status reset by admin: ${reason}`;
        break;
      case 'edit':
        auditMessage = `Record marked for editing by admin: ${reason}`;
        break;
    }

    // Update the registration
    const updatedRegistration = await prisma.deathRegistration.update({
      where: { id: parseInt(id) },
      data: {
        ...updates,
        updatedAt: new Date(),
        // Add audit trail (you might want to create a separate audit table)
        notes: registration.notes ? 
          `${registration.notes}\n[${new Date().toISOString()}] ADMIN OVERRIDE: ${auditMessage}` :
          `[${new Date().toISOString()}] ADMIN OVERRIDE: ${auditMessage}`
      },
      include: {
        deceased: true,
        submitter: {
          select: {
            id: true,
            fullNameFirst: true,
            fullNameMiddle: true,
            fullNameLast: true,
            email: true
          }
        },
        payment: true
      }
    });

    // Log the admin action
    console.log(`Admin override executed: ${action} on registration ${id} by ${adminEmail || adminId}`);

    res.json({
      success: true,
      message: `Administrative override "${action}" executed successfully`,
      registration: updatedRegistration,
      audit: {
        action,
        reason,
        executedBy: adminEmail,
        timestamp: timestamp || new Date().toISOString(),
        registrationId: id
      }
    });

  } catch (error) {
    console.error('Error executing admin override:', error);
    res.status(500).json({ 
      error: 'Failed to execute administrative override',
      details: error.message
    });
  }
});

// POST /deceased - Create deceased record only (for burial assignments)
router.post('/deceased', requireEmployee, async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      suffix,
      dateOfBirth,
      dateOfDeath,
      age,
      sex,
      causeOfDeath,
      placeOfDeath,
      residenceAddress,
      citizenship,
      civilStatus,
      occupation,
      covidRelated
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !dateOfDeath) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields: firstName, lastName, dateOfBirth, dateOfDeath' 
      });
    }

    // Calculate age if not provided
    const calculatedAge = age || Math.floor((new Date(dateOfDeath).getTime() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // Create deceased record
    const deceasedRecord = await prisma.deceasedRecord.create({
      data: {
        firstName,
        middleName: middleName || null,
        lastName,
        suffix: suffix || null,
        sex: sex || 'MALE',
        dateOfBirth: new Date(dateOfBirth),
        dateOfDeath: new Date(dateOfDeath),
        age: calculatedAge,
        placeOfDeath: placeOfDeath || null,
        residenceAddress: residenceAddress || null,
        citizenship: citizenship || 'Filipino',
        civilStatus: civilStatus || 'Single',
        occupation: occupation || null,
        causeOfDeath: causeOfDeath || null,
        covidRelated: covidRelated || false
      }
    });

    console.log('Deceased record created:', deceasedRecord);

    res.json({
      success: true,
      data: deceasedRecord,
      message: `Deceased record created for ${firstName} ${lastName}`
    });

  } catch (error) {
    console.error('Error creating deceased record:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create deceased record',
      details: error.message
    });
  }
});

// Upload document for a death registration
router.post('/:id/documents', requireCitizen, upload.single('file'), async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id);
    const { docType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!docType) {
      return res.status(400).json({ error: 'Document type is required' });
    }
    
    console.log('Uploading document:', {
      registrationId,
      docType,
      fileName: req.file.filename,
      filePath: req.file.path
    });
    
    // Check if registration exists
    const registration = await prisma.deathRegistration.findUnique({
      where: { id: registrationId }
    });
    
    if (!registration) {
      return res.status(404).json({ error: 'Death registration not found' });
    }
    
    // Create document record
    const document = await prisma.document.create({
      data: {
        uploadedBy: req.user.id,
        fileName: req.file.originalname,
        filePath: `/uploads/documents/${req.file.filename}`,
        mimeType: req.file.mimetype,
        fileSizeBytes: BigInt(req.file.size)
      }
    });
    
    // Link document to registration
    const registrationDoc = await prisma.deathRegistrationDocument.create({
      data: {
        registrationId: registrationId,
        documentId: document.id,
        docType: docType
      },
      include: {
        document: true
      }
    });
    
    console.log('Document uploaded successfully:', registrationDoc);
    
    res.json({
      success: true,
      document: convertBigIntToNumber(registrationDoc),
      message: 'Document uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ 
      error: 'Failed to upload document',
      details: error.message
    });
  }
});

// Delete death registration (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id);
    
    console.log(`Admin ${req.user.id} attempting to delete death registration ${registrationId}`);

    // Check if registration exists
    const registration = await prisma.deathRegistration.findUnique({
      where: { id: registrationId },
      include: {
        documents: {
          include: {
            document: true
          }
        },
        deceased: true
      }
    });

    if (!registration) {
      return res.status(404).json({ error: 'Death registration not found' });
    }

    // Delete associated documents from filesystem
    if (registration.documents && registration.documents.length > 0) {
      for (const doc of registration.documents) {
        const filePath = path.join(__dirname, '../../', doc.document.filePath);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${filePath}`);
          } catch (fileError) {
            console.error(`Error deleting file ${filePath}:`, fileError);
          }
        }
      }
    }

    // Delete in order: 
    // 1. DeathRegistrationDocument links
    await prisma.deathRegistrationDocument.deleteMany({
      where: { registrationId: registrationId }
    });

    // 2. Document records
    const documentIds = registration.documents.map(d => d.document.id);
    if (documentIds.length > 0) {
      await prisma.document.deleteMany({
        where: { id: { in: documentIds } }
      });
    }

    // 3. Death registration
    await prisma.deathRegistration.delete({
      where: { id: registrationId }
    });

    // 4. Deceased record (if not used by other registrations)
    if (registration.deceasedId) {
      const otherRegistrations = await prisma.deathRegistration.count({
        where: { 
          deceasedId: registration.deceasedId,
          id: { not: registrationId }
        }
      });

      if (otherRegistrations === 0) {
        await prisma.deceasedRecord.delete({
          where: { id: registration.deceasedId }
        });
        console.log(`Deleted deceased record ${registration.deceasedId}`);
      }
    }

    console.log(`Death registration ${registrationId} deleted successfully`);
    
    res.json({
      success: true,
      message: 'Death registration deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting death registration:', error);
    res.status(500).json({ 
      error: 'Failed to delete death registration',
      details: error.message
    });
  }
});

module.exports = router;