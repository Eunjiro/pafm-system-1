const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Helper function to calculate age
function calculateAge(dateOfBirth, dateOfDeath) {
  if (!dateOfBirth || !dateOfDeath) return null;
  const birth = new Date(dateOfBirth);
  const death = new Date(dateOfDeath);
  return Math.floor((death - birth) / (365.25 * 24 * 60 * 60 * 1000));
}

// GET: Fetch all deceased records with search
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { middleName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const deceased = await prisma.deceasedRecord.findMany({
      where,
      include: {
        plotAssignments: {
          include: {
            plot: true
          }
        }
      },
      orderBy: { lastName: 'asc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.deceasedRecord.count({ where });

    res.json({ 
      success: true, 
      data: deceased,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching deceased records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deceased records' });
  }
});

// POST: Create new deceased record
router.post('/', async (req, res) => {
  try {
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
      covidRelated,
      plotId
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !dateOfDeath) {
      return res.status(400).json({
        success: false,
        error: 'First name, last name, date of birth, and date of death are required'
      });
    }

    // Calculate age if not provided
    const calculatedAge = age || calculateAge(dateOfBirth, dateOfDeath);

    const deceased = await prisma.deceasedRecord.create({
      data: {
        firstName,
        middleName,
        lastName,
        suffix,
        sex,
        dateOfBirth: new Date(dateOfBirth),
        dateOfDeath: new Date(dateOfDeath),
        age: calculatedAge,
        placeOfDeath,
        residenceAddress,
        citizenship,
        civilStatus,
        occupation,
        causeOfDeath,
        covidRelated: covidRelated || false
      },
      include: {
        plotAssignments: {
          include: {
            plot: true
          }
        }
      }
    });

    // If plotId is provided, create a plot assignment
    if (plotId) {
      await prisma.plotAssignment.create({
        data: {
          plotId: parseInt(plotId),
          deceasedId: deceased.id,
          status: 'ASSIGNED'
        }
      });

      // Update plot status to occupied
      await prisma.cemeteryPlot.update({
        where: { id: parseInt(plotId) },
        data: { status: 'OCCUPIED' }
      });
    }

    res.status(201).json({ success: true, data: deceased });
  } catch (error) {
    console.error('Error creating deceased record:', error);
    res.status(500).json({ success: false, error: 'Failed to create deceased record' });
  }
});

// PUT: Update deceased record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove id from updateData if present
    delete updateData.id;

    // Convert date strings to Date objects if provided
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.dateOfDeath) {
      updateData.dateOfDeath = new Date(updateData.dateOfDeath);
    }

    // Recalculate age if dates are updated
    if (updateData.dateOfBirth || updateData.dateOfDeath) {
      const existing = await prisma.deceasedRecord.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (existing) {
        const birthDate = updateData.dateOfBirth || existing.dateOfBirth;
        const deathDate = updateData.dateOfDeath || existing.dateOfDeath;
        updateData.age = calculateAge(birthDate, deathDate);
      }
    }

    const deceased = await prisma.deceasedRecord.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        plotAssignments: {
          include: {
            plot: true
          }
        }
      }
    });

    res.json({ success: true, data: deceased });
  } catch (error) {
    console.error('Error updating deceased record:', error);
    res.status(500).json({ success: false, error: 'Failed to update deceased record' });
  }
});

// DELETE: Delete deceased record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the deceased record and find associated plot assignments
    const deceased = await prisma.deceasedRecord.findUnique({
      where: { id: parseInt(id) },
      include: {
        plotAssignments: {
          include: {
            plot: true
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

    if (deceased.plotAssignments.length > 0) {
      // Update plot status to vacant and remove assignments
      for (const assignment of deceased.plotAssignments) {
        await prisma.cemeteryPlot.update({
          where: { id: assignment.plotId },
          data: { status: 'VACANT' }
        });
        
        await prisma.plotAssignment.delete({
          where: { id: assignment.id }
        });
      }
    }

    await prisma.deceasedRecord.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: 'Deceased record deleted successfully' });
  } catch (error) {
    console.error('Error deleting deceased record:', error);
    res.status(500).json({ success: false, error: 'Failed to delete deceased record' });
  }
});

module.exports = router;
