const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/dashboard - Get cemetery & burial dashboard statistics
router.get('/', async (req, res) => {
  try {
    // Get death registrations stats
    const totalDeathRegistrations = await prisma.deathRegistration.count();
    const pendingDeathRegistrations = await prisma.deathRegistration.count({
      where: { status: 'SUBMITTED' }
    });
    const approvedDeathRegistrations = await prisma.deathRegistration.count({
      where: { status: 'REGISTERED' }
    });

    // Get this month's death registrations
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const deathRegistrationsThisMonth = await prisma.deathRegistration.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth
        }
      }
    });

    // Get permits stats
    const totalPermits = await prisma.permitRequest.count();
    const burialPermits = await prisma.permitRequest.count({
      where: { permitType: 'BURIAL' }
    });
    const exhumationPermits = await prisma.permitRequest.count({
      where: { permitType: 'EXHUMATION' }
    });
    const cremationPermits = await prisma.permitRequest.count({
      where: { permitType: 'CREMATION' }
    });
    const pendingPermits = await prisma.permitRequest.count({
      where: { status: 'SUBMITTED' }
    });
    const approvedPermits = await prisma.permitRequest.count({
      where: { status: 'ISSUED' }
    });

    // Get certificates stats
    const totalCertificates = await prisma.certificateRequest.count();
    const pendingCertificates = await prisma.certificateRequest.count({
      where: { status: 'SUBMITTED' }
    });
    const issuedCertificates = await prisma.certificateRequest.count({
      where: { status: 'CLAIMED' }
    });
    const certificatesThisMonth = await prisma.certificateRequest.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth
        }
      }
    });

    // Get cemetery and plot stats
    const totalCemeteries = await prisma.cemetery.count();
    const totalPlots = await prisma.cemeteryPlot.count();
    const occupiedPlots = await prisma.cemeteryPlot.count({
      where: { status: 'OCCUPIED' }
    });
    const availablePlots = await prisma.cemeteryPlot.count({
      where: { status: 'VACANT' }
    });

    // Get recent activities
    const recentDeathRegistrations = await prisma.deathRegistration.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        deceased: true
      }
    });

    const recentPermits = await prisma.permitRequest.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        deceased: true
      }
    });

    const recentCertificates = await prisma.certificateRequest.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        deceased: true
      }
    });

    // Combine and format recent activities
    const recentActivities = [
      ...recentDeathRegistrations.map(dr => ({
        id: dr.id,
        type: 'death-registration',
        description: `Death registration for ${dr.deceased.firstName} ${dr.deceased.lastName}`,
        status: dr.status.toLowerCase(),
        createdAt: dr.createdAt
      })),
      ...recentPermits.map(p => ({
        id: p.id,
        type: 'permit',
        description: `${p.permitType.charAt(0) + p.permitType.slice(1).toLowerCase()} permit for ${p.deceased.firstName} ${p.deceased.lastName}`,
        status: p.status.toLowerCase(),
        createdAt: p.createdAt
      })),
      ...recentCertificates.map(c => ({
        id: c.id,
        type: 'certificate',
        description: `Certificate request for ${c.deceased.firstName} ${c.deceased.lastName}`,
        status: c.status.toLowerCase(),
        createdAt: c.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

    res.json({
      success: true,
      data: {
        summary: {
          deathRegistrations: {
            total: totalDeathRegistrations,
            pending: pendingDeathRegistrations,
            approved: approvedDeathRegistrations,
            thisMonth: deathRegistrationsThisMonth
          },
          permits: {
            total: totalPermits,
            burial: burialPermits,
            exhumation: exhumationPermits,
            cremation: cremationPermits,
            pending: pendingPermits,
            approved: approvedPermits
          },
          certificates: {
            total: totalCertificates,
            pending: pendingCertificates,
            issued: issuedCertificates,
            thisMonth: certificatesThisMonth
          },
          cemeteries: {
            total: totalCemeteries,
            totalPlots: totalPlots,
            occupiedPlots: occupiedPlots,
            availablePlots: availablePlots
          }
        },
        recentActivities: recentActivities
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
