const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireCitizen, requireEmployee } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

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
      registrations,
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
      registrations,
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

    res.json(registration);
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

    res.json(registration);
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
    
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (orNumber) updateData.orNumber = orNumber;
    if (registeredBy) updateData.registeredBy = parseInt(registeredBy);
    if (remarks) updateData.remarks = remarks;
    
    if (status === 'REGISTERED') {
      updateData.registeredAt = new Date();
      updateData.pickupStatus = 'READY';
    }

    const registration = await prisma.deathRegistration.update({
      where: { id: parseInt(req.params.id) },
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

    res.json(registration);
  } catch (error) {
    console.error('Error updating death registration status:', error);
    res.status(500).json({ error: 'Failed to update status' });
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

    res.json(updatedRegistration);
  } catch (error) {
    console.error('Error updating death registration:', error);
    res.status(500).json({ error: 'Failed to update death registration' });
  }
});

module.exports = router;