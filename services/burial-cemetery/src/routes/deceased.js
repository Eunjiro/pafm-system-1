const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/deceased - Fetch all deceased records
router.get('/', async (req, res) => {
  try {
    console.log('Fetching deceased records...');
    
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause for search
    const whereClause = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { middleName: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    // Fetch deceased records with pagination
    const [deceased, total] = await Promise.all([
      prisma.deceasedRecord.findMany({
        where: whereClause,
        skip: skip,
        take: parseInt(limit),
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          permitRequests: {
            select: {
              id: true,
              permitType: true,
              status: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.deceasedRecord.count({
        where: whereClause
      })
    ]);

    console.log(`Found ${deceased.length} deceased records out of ${total} total`);

    res.json({
      success: true,
      data: deceased,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching deceased records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deceased records',
      details: error.message
    });
  }
});

// GET /api/deceased/:id - Fetch single deceased record
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching deceased record with ID: ${id}`);

    const deceased = await prisma.deceasedRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        permitRequests: {
          include: {
            citizen: {
              select: {
                id: true,
                fullNameFirst: true,
                fullNameLast: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!deceased) {
      return res.status(404).json({
        success: false,
        error: 'Deceased record not found'
      });
    }

    console.log(`Found deceased record: ${deceased.firstName} ${deceased.lastName}`);

    res.json({
      success: true,
      data: deceased
    });
  } catch (error) {
    console.error('Error fetching deceased record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deceased record',
      details: error.message
    });
  }
});

// POST /api/deceased - Create new deceased record
router.post('/', async (req, res) => {
  try {
    console.log('Creating new deceased record...');
    console.log('Request body:', req.body);

    const {
      firstName,
      middleName,
      lastName,
      suffix,
      sex,
      dateOfBirth,
      dateOfDeath,
      age,
      placeOfDeath,
      residenceAddress,
      citizenship,
      civilStatus,
      occupation,
      causeOfDeath,
      covidRelated
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfDeath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, and dateOfDeath are required'
      });
    }

    // Check if deceased record already exists (to prevent duplicates)
    const existingDeceased = await prisma.deceasedRecord.findFirst({
      where: {
        firstName: firstName,
        lastName: lastName,
        dateOfDeath: new Date(dateOfDeath)
      }
    });

    if (existingDeceased) {
      console.log(`Deceased record already exists: ${existingDeceased.id}`);
      return res.json({
        success: true,
        data: existingDeceased,
        message: 'Deceased record already exists'
      });
    }

    // Create new deceased record
    const deceased = await prisma.deceasedRecord.create({
      data: {
        firstName,
        middleName: middleName || null,
        lastName,
        suffix: suffix || null,
        sex: sex || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        dateOfDeath: new Date(dateOfDeath),
        age: age ? parseInt(age) : null,
        placeOfDeath: placeOfDeath || null,
        residenceAddress: residenceAddress || null,
        citizenship: citizenship || 'Filipino',
        civilStatus: civilStatus || null,
        occupation: occupation || null,
        causeOfDeath: causeOfDeath || null,
        covidRelated: Boolean(covidRelated)
      }
    });

    console.log(`Created deceased record: ${deceased.firstName} ${deceased.lastName} (ID: ${deceased.id})`);

    res.status(201).json({
      success: true,
      data: deceased,
      message: 'Deceased record created successfully'
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

// PUT /api/deceased/:id - Update deceased record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating deceased record with ID: ${id}`);

    const updateData = { ...req.body };

    // Convert date strings to Date objects
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.dateOfDeath) {
      updateData.dateOfDeath = new Date(updateData.dateOfDeath);
    }
    if (updateData.age) {
      updateData.age = parseInt(updateData.age);
    }
    if (updateData.covidRelated !== undefined) {
      updateData.covidRelated = Boolean(updateData.covidRelated);
    }

    const deceased = await prisma.deceasedRecord.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    console.log(`Updated deceased record: ${deceased.firstName} ${deceased.lastName}`);

    res.json({
      success: true,
      data: deceased,
      message: 'Deceased record updated successfully'
    });
  } catch (error) {
    console.error('Error updating deceased record:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Deceased record not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update deceased record',
      details: error.message
    });
  }
});

// DELETE /api/deceased/:id - Delete deceased record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting deceased record with ID: ${id}`);

    // Check if there are any permits associated with this deceased record
    const permits = await prisma.permitRequest.findMany({
      where: { deathId: parseInt(id) }
    });

    if (permits.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete deceased record with associated permits',
        details: `Found ${permits.length} associated permits`
      });
    }

    await prisma.deceasedRecord.delete({
      where: { id: parseInt(id) }
    });

    console.log(`Deleted deceased record with ID: ${id}`);

    res.json({
      success: true,
      message: 'Deceased record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deceased record:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Deceased record not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete deceased record',
      details: error.message
    });
  }
});

module.exports = router;
