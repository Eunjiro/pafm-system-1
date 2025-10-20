const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate unique request number
const generateRequestNumber = async () => {
  const year = new Date().getFullYear();
  const lastRequest = await prisma.facilityRequest.findFirst({
    where: {
      requestNumber: {
        startsWith: `FR-${year}-`
      }
    },
    orderBy: {
      id: 'desc'
    }
  });

  if (!lastRequest) {
    return `FR-${year}-0001`;
  }

  const lastNumber = parseInt(lastRequest.requestNumber.split('-')[2]);
  const newNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `FR-${year}-${newNumber}`;
};

// Check facility availability
const checkAvailability = async (facilityId, startDate, endDate, excludeRequestId = null) => {
  const conflicts = await prisma.facilityRequest.findMany({
    where: {
      facilityId: facilityId,
      id: excludeRequestId ? { not: excludeRequestId } : undefined,
      status: {
        in: ['PENDING_REVIEW', 'AWAITING_REQUIREMENTS', 'AWAITING_PAYMENT', 'APPROVED']
      },
      OR: [
        {
          AND: [
            { scheduleStart: { lte: startDate } },
            { scheduleEnd: { gte: startDate } }
          ]
        },
        {
          AND: [
            { scheduleStart: { lte: endDate } },
            { scheduleEnd: { gte: endDate } }
          ]
        },
        {
          AND: [
            { scheduleStart: { gte: startDate } },
            { scheduleEnd: { lte: endDate } }
          ]
        }
      ]
    }
  });

  // Check blackout dates
  const blackouts = await prisma.blackoutDate.findMany({
    where: {
      facilityId: facilityId,
      OR: [
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: startDate } }
          ]
        },
        {
          AND: [
            { startDate: { lte: endDate } },
            { endDate: { gte: endDate } }
          ]
        },
        {
          AND: [
            { startDate: { gte: startDate } },
            { endDate: { lte: endDate } }
          ]
        }
      ]
    }
  });

  return {
    available: conflicts.length === 0 && blackouts.length === 0,
    conflicts,
    blackouts
  };
};

// Log status change
const logStatusChange = async (requestId, fromStatus, toStatus, changedBy, remarks = null) => {
  await prisma.statusHistory.create({
    data: {
      requestId,
      fromStatus,
      toStatus,
      changedBy,
      remarks
    }
  });
};

// Calculate payment amount
const calculatePaymentAmount = (facility, startDate, endDate, eventType) => {
  if (eventType === 'GOVERNMENT') {
    return 0; // Exempted
  }

  const hours = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60));
  return hours * (facility.hourlyRate || 0);
};

module.exports = {
  prisma,
  generateRequestNumber,
  checkAvailability,
  logStatusChange,
  calculatePaymentAmount
};
