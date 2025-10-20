const express = require('express');
const router = express.Router();
const prisma = require('../database/prisma');

// GET /api/dashboard - Dashboard overview statistics
router.get('/', async (req, res) => {
  try {
    // Get total items in stock
    const totalItemsInStock = await prisma.item.count({
      where: { isActive: true }
    });

    // Get total deliveries
    const totalDeliveries = await prisma.deliveryReceipt.count();
    
    // Pending verification deliveries
    const pendingVerification = await prisma.deliveryReceipt.count({
      where: { status: 'PENDING_VERIFICATION' }
    });

    // Total RIS requests by status
    const risPending = await prisma.rISRequest.count({
      where: { status: 'PENDING_APPROVAL' }
    });
    
    const risApproved = await prisma.rISRequest.count({
      where: { status: 'APPROVED' }
    });
    
    const risIssued = await prisma.rISRequest.count({
      where: { status: 'ISSUED' }
    });

    // Low stock items
    const lowStockItems = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Item" i
      LEFT JOIN (
        SELECT "itemId", SUM(quantity) as total
        FROM "StockLocation"
        GROUP BY "itemId"
      ) sl ON i.id = sl."itemId"
      WHERE COALESCE(sl.total, 0) <= i."reorderLevel"
      AND i."isActive" = true
    `;

    // Recent activities (last 10)
    const recentActivities = await prisma.stockMovement.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          select: {
            itemCode: true,
            itemName: true
          }
        }
      }
    });

    // Stock summary by category
    const stockByCategory = await prisma.$queryRaw`
      SELECT 
        i.category,
        COUNT(DISTINCT i.id) as itemCount,
        COALESCE(SUM(sl.quantity), 0) as totalQuantity
      FROM "Item" i
      LEFT JOIN "StockLocation" sl ON i.id = sl."itemId"
      WHERE i."isActive" = true
      GROUP BY i.category
    `;

    // Monthly stock movements (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyMovements = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        "movementType",
        SUM("quantityIn") as totalIn,
        SUM("quantityOut") as totalOut
      FROM "StockMovement"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM'), "movementType"
      ORDER BY month DESC
    `;

    res.json({
      success: true,
      data: {
        summary: {
          totalItemsInStock,
          totalDeliveries,
          pendingVerification,
          risRequests: {
            pending: risPending,
            approved: risApproved,
            issued: risIssued,
            total: risPending + risApproved + risIssued
          },
          lowStockItems: parseInt(lowStockItems[0]?.count || 0)
        },
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          type: activity.movementType,
          itemCode: activity.item.itemCode,
          itemName: activity.item.itemName,
          quantityIn: activity.quantityIn,
          quantityOut: activity.quantityOut,
          balance: activity.balanceAfter,
          performedBy: activity.performedBy,
          createdAt: activity.createdAt
        })),
        stockByCategory: stockByCategory.map(cat => ({
          category: cat.category,
          itemCount: parseInt(cat.itemcount),
          totalQuantity: parseInt(cat.totalquantity)
        })),
        monthlyMovements
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/dashboard/alerts - Get system alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = [];

    // Check for low stock items
    const lowStock = await prisma.$queryRaw`
      SELECT i.id, i."itemCode", i."itemName", COALESCE(SUM(sl.quantity), 0) as currentStock, i."reorderLevel"
      FROM "Item" i
      LEFT JOIN "StockLocation" sl ON i.id = sl."itemId"
      WHERE i."isActive" = true
      GROUP BY i.id
      HAVING COALESCE(SUM(sl.quantity), 0) <= i."reorderLevel"
    `;

    lowStock.forEach(item => {
      alerts.push({
        type: 'LOW_STOCK',
        severity: parseInt(item.currentstock) === 0 ? 'critical' : 'warning',
        message: `${item.itemName} (${item.itemCode}) is ${parseInt(item.currentstock) === 0 ? 'out of stock' : 'low on stock'}`,
        data: {
          itemId: item.id,
          currentStock: parseInt(item.currentstock),
          reorderLevel: item.reorderlevel
        }
      });
    });

    // Check for pending verifications
    const pendingDR = await prisma.deliveryReceipt.count({
      where: { status: 'PENDING_VERIFICATION' }
    });

    if (pendingDR > 0) {
      alerts.push({
        type: 'PENDING_VERIFICATION',
        severity: 'info',
        message: `${pendingDR} delivery receipt(s) pending verification`,
        data: { count: pendingDR }
      });
    }

    // Check for pending RIS approvals
    const pendingRIS = await prisma.rISRequest.count({
      where: { status: 'PENDING_APPROVAL' }
    });

    if (pendingRIS > 0) {
      alerts.push({
        type: 'PENDING_APPROVAL',
        severity: 'info',
        message: `${pendingRIS} RIS request(s) pending approval`,
        data: { count: pendingRIS }
      });
    }

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
