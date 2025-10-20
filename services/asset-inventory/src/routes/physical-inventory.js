const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET all count sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await prisma.PhysicalCount.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    // Calculate totals for each session
    const sessionsWithTotals = await Promise.all(
      sessions.map(async (session) => {
        const entries = await prisma.PhysicalCountItem.findMany({
          where: { countId: session.id },
          include: { item: true }
        });

        const totalItems = entries.length;
        const itemsWithDiscrepancy = entries.filter(e => {
          const variance = (e.actualQuantity || 0) - e.systemQuantity;
          return variance !== 0;
        }).length;
        
        const totalDiscrepancyValue = entries.reduce((sum, e) => {
          const variance = (e.actualQuantity || 0) - e.systemQuantity;
          const value = variance * parseFloat(e.item.unitCost || 0);
          return sum + value;
        }, 0);

        return {
          id: session.id,
          sessionNumber: session.countNumber,
          sessionDate: session.scheduledDate,
          countedBy: session.conductedBy,
          status: session.status,
          remarks: session.remarks,
          createdAt: session.createdAt,
          totalItems,
          itemsWithDiscrepancy,
          totalDiscrepancyValue
        };
      })
    );

    res.json({
      success: true,
      data: sessionsWithTotals
    });
  } catch (error) {
    console.error('Error fetching count sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch count sessions',
      error: error.message
    });
  }
});

// GET single count session
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.PhysicalCount.findUnique({
      where: { id: parseInt(id) }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Count session not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: session.id,
        sessionNumber: session.countNumber,
        sessionDate: session.scheduledDate,
        countedBy: session.conductedBy,
        status: session.status,
        remarks: session.remarks,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching count session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch count session',
      error: error.message
    });
  }
});

// POST create new count session
router.post('/sessions', async (req, res) => {
  try {
    const { sessionDate, countedBy, remarks } = req.body;

    // Generate session number: PC-YYYY-#####
    const year = new Date(sessionDate).getFullYear();
    const lastSession = await prisma.PhysicalCount.findFirst({
      where: {
        countNumber: {
          startsWith: `PC-${year}-`
        }
      },
      orderBy: { countNumber: 'desc' }
    });

    let sessionNumber;
    if (lastSession) {
      const lastNumber = parseInt(lastSession.countNumber.split('-')[2]);
      sessionNumber = `PC-${year}-${String(lastNumber + 1).padStart(5, '0')}`;
    } else {
      sessionNumber = `PC-${year}-00001`;
    }

    const session = await prisma.PhysicalCount.create({
      data: {
        countNumber: sessionNumber,
        scheduledDate: new Date(sessionDate),
        startedDate: new Date(),
        conductedBy: countedBy,
        status: 'IN_PROGRESS',
        remarks
      }
    });

    res.json({
      success: true,
      data: {
        id: session.id,
        sessionNumber: session.countNumber,
        sessionDate: session.scheduledDate,
        countedBy: session.conductedBy,
        status: session.status,
        remarks: session.remarks,
        createdAt: session.createdAt
      },
      message: 'Count session created successfully'
    });
  } catch (error) {
    console.error('Error creating count session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create count session',
      error: error.message
    });
  }
});

// DELETE count session (only if IN_PROGRESS)
router.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.PhysicalCount.findUnique({
      where: { id: parseInt(id) }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Count session not found'
      });
    }

    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete IN_PROGRESS sessions'
      });
    }

    // Delete all entries first
    await prisma.PhysicalCountItem.deleteMany({
      where: { countId: parseInt(id) }
    });

    // Delete session
    await prisma.PhysicalCount.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Count session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting count session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete count session',
      error: error.message
    });
  }
});

// GET count entries for a session
router.get('/sessions/:id/entries', async (req, res) => {
  try {
    const { id } = req.params;

    const entries = await prisma.PhysicalCountItem.findMany({
      where: { countId: parseInt(id) },
      include: {
        item: true
      }
    });

    // Transform to match frontend expectations
    const transformedEntries = entries.map(entry => {
      const systemQuantity = entry.systemQuantity;
      const actualQuantity = entry.actualQuantity || 0;
      const discrepancy = actualQuantity - systemQuantity;
      const discrepancyValue = discrepancy * parseFloat(entry.item.unitCost || 0);

      return {
        id: entry.id,
        sessionId: entry.countId,
        itemId: entry.itemId,
        systemQuantity,
        actualQuantity,
        discrepancy,
        discrepancyValue,
        remarks: entry.remarks,
        item: entry.item
      };
    });

    res.json({
      success: true,
      data: transformedEntries
    });
  } catch (error) {
    console.error('Error fetching count entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch count entries',
      error: error.message
    });
  }
});

// POST add count entry
router.post('/sessions/:id/entries', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, actualQuantity, remarks } = req.body;

    // Check session exists and is IN_PROGRESS
    const session = await prisma.PhysicalCount.findUnique({
      where: { id: parseInt(id) }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Count session not found'
      });
    }

    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Can only add entries to IN_PROGRESS sessions'
      });
    }

    // Check if item already counted in this session
    const existingEntry = await prisma.PhysicalCountItem.findFirst({
      where: {
        countId: parseInt(id),
        itemId: parseInt(itemId)
      }
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Item already counted in this session'
      });
    }

    // Get item details
    const item = await prisma.item.findUnique({
      where: { id: parseInt(itemId) }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Get system quantity from vw_current_stock
    const stockView = await prisma.$queryRaw`
      SELECT quantity 
      FROM vw_current_stock 
      WHERE item_id = ${parseInt(itemId)}
    `;

    const systemQuantity = stockView.length > 0 ? parseInt(stockView[0].quantity) : 0;

    // Calculate variance
    const variance = parseInt(actualQuantity) - systemQuantity;

    // Create count entry
    const entry = await prisma.PhysicalCountItem.create({
      data: {
        countId: parseInt(id),
        itemId: parseInt(itemId),
        systemQuantity,
        actualQuantity: parseInt(actualQuantity),
        variance,
        remarks
      },
      include: {
        item: true
      }
    });

    // Transform response
    const discrepancy = variance;
    const discrepancyValue = discrepancy * parseFloat(item.unitCost || 0);

    res.json({
      success: true,
      data: {
        id: entry.id,
        sessionId: entry.countId,
        itemId: entry.itemId,
        systemQuantity: entry.systemQuantity,
        actualQuantity: entry.actualQuantity,
        discrepancy,
        discrepancyValue,
        remarks: entry.remarks,
        item: entry.item
      },
      message: 'Count entry added successfully'
    });
  } catch (error) {
    console.error('Error adding count entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add count entry',
      error: error.message
    });
  }
});

// POST complete count session
router.post('/sessions/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.PhysicalCount.findUnique({
      where: { id: parseInt(id) }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Count session not found'
      });
    }

    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Can only complete IN_PROGRESS sessions'
      });
    }

    // Check if any items have been counted
    const entryCount = await prisma.PhysicalCountItem.count({
      where: { countId: parseInt(id) }
    });

    if (entryCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete session with no count entries'
      });
    }

    // Count discrepancies
    const entries = await prisma.PhysicalCountItem.findMany({
      where: { countId: parseInt(id) }
    });

    const discrepancyCount = entries.filter(e => {
      const variance = (e.actualQuantity || 0) - e.systemQuantity;
      return variance !== 0;
    }).length;

    // Update session status
    const updatedSession = await prisma.PhysicalCount.update({
      where: { id: parseInt(id) },
      data: { 
        status: discrepancyCount > 0 ? 'DISCREPANCY_FOUND' : 'BALANCED',
        completedDate: new Date(),
        itemsCounted: entryCount,
        discrepancies: discrepancyCount
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedSession.id,
        sessionNumber: updatedSession.countNumber,
        sessionDate: updatedSession.scheduledDate,
        countedBy: updatedSession.conductedBy,
        status: updatedSession.status,
        remarks: updatedSession.remarks,
        createdAt: updatedSession.createdAt
      },
      message: 'Count session completed successfully'
    });
  } catch (error) {
    console.error('Error completing count session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete count session',
      error: error.message
    });
  }
});

// POST create adjustment from discrepancies
router.post('/sessions/:id/adjust', async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustmentReason } = req.body;

    const session = await prisma.PhysicalCount.findUnique({
      where: { id: parseInt(id) }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Count session not found'
      });
    }

    if (session.status !== 'DISCREPANCY_FOUND' && session.status !== 'BALANCED') {
      return res.status(400).json({
        success: false,
        message: 'Can only create adjustments for completed sessions'
      });
    }

    // Get all entries with discrepancies
    const allEntries = await prisma.PhysicalCountItem.findMany({
      where: { countId: parseInt(id) },
      include: { item: true }
    });

    const discrepancies = allEntries.filter(entry => {
      const variance = (entry.actualQuantity || 0) - entry.systemQuantity;
      return variance !== 0;
    });

    if (discrepancies.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No discrepancies found to adjust'
      });
    }

    // Create stock movements for each discrepancy
    const movements = [];
    for (const entry of discrepancies) {
      const variance = (entry.actualQuantity || 0) - entry.systemQuantity;
      
      const movement = await prisma.stockMovement.create({
        data: {
          itemId: entry.itemId,
          movementType: 'ADJUSTMENT',
          quantity: variance, // Positive for overage, negative for shortage
          reference: `Physical Count: ${session.countNumber}`,
          movementDate: new Date(),
          remarks: adjustmentReason || `Physical count adjustment - System: ${entry.systemQuantity}, Actual: ${entry.actualQuantity || 0}`
        }
      });
      movements.push(movement);

      // Mark adjustment made
      await prisma.PhysicalCountItem.update({
        where: { id: entry.id },
        data: { adjustmentMade: true }
      });
    }

    // Update session status
    await prisma.PhysicalCount.update({
      where: { id: parseInt(id) },
      data: { status: 'COMPLETED' }
    });

    res.json({
      success: true,
      data: {
        adjustmentsCreated: movements.length,
        movements
      },
      message: 'Stock adjustments created successfully'
    });
  } catch (error) {
    console.error('Error creating adjustments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create adjustments',
      error: error.message
    });
  }
});

module.exports = router;
