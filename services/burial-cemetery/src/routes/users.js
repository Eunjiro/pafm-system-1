const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { requireAdmin, requireEmployee } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to format user response
const formatUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  fullName: `${user.fullNameFirst} ${user.fullNameLast}`,
  fullNameFirst: user.fullNameFirst,
  fullNameMiddle: user.fullNameMiddle,
  fullNameLast: user.fullNameLast,
  nameSuffix: user.nameSuffix,
  contactNo: user.contactNo,
  address: user.address,
  organization: user.organization,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Get all users (Admin and Employee only)
router.get('/', 
  requireEmployee,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['CITIZEN', 'EMPLOYEE', 'ADMIN']),
    query('search').optional().trim(),
    query('isActive').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const {
        page = 1,
        limit = 10,
        role,
        search,
        isActive,
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where = {};
      
      if (role) {
        where.role = role;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      
      if (search) {
        where.OR = [
          { fullNameFirst: { contains: search, mode: 'insensitive' } },
          { fullNameLast: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { organization: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        users: users.map(formatUserResponse),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        error: 'Failed to retrieve users',
        message: 'An error occurred while fetching users',
      });
    }
  }
);

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    // Users can only view their own profile unless they're employee/admin
    if (parseInt(id) !== requestingUser.id && 
        !['EMPLOYEE', 'ADMIN'].includes(requestingUser.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own profile',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with this ID does not exist',
      });
    }

    res.json({ user: formatUserResponse(user) });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user',
      message: 'An error occurred while fetching user',
    });
  }
});

// Update user
router.put('/:id',
  [
    body('fullNameFirst').optional().trim().isLength({ min: 1 }),
    body('fullNameLast').optional().trim().isLength({ min: 1 }),
    body('fullNameMiddle').optional().trim(),
    body('nameSuffix').optional().trim(),
    body('contactNo').optional().trim(),
    body('address').optional().trim(),
    body('organization').optional().trim(),
    body('role').optional().isIn(['CITIZEN', 'EMPLOYEE', 'ADMIN']),
    body('isActive').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const requestingUser = req.user;
      const updateData = req.body;

      // Check permissions
      const isOwnProfile = parseInt(id) === requestingUser.id;
      const isAdmin = requestingUser.role === 'ADMIN';
      const isEmployee = requestingUser.role === 'EMPLOYEE';

      if (!isOwnProfile && !isAdmin && !isEmployee) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own profile',
        });
      }

      // Only admins can change roles and active status
      if (!isAdmin) {
        delete updateData.role;
        delete updateData.isActive;
      }

      // Employees can't change their own role or deactivate themselves
      if (isEmployee && isOwnProfile) {
        delete updateData.role;
        delete updateData.isActive;
      }

      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User with this ID does not exist',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      // Log audit trail
      await prisma.auditLog.create({
        data: {
          actorUserId: requestingUser.id,
          action: 'USER_UPDATED',
          moduleName: 'USERS',
          referenceId: parseInt(id),
          details: `User profile updated by ${requestingUser.role}`,
        },
      });

      res.json({
        message: 'User updated successfully',
        user: formatUserResponse(updatedUser),
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        error: 'Failed to update user',
        message: 'An error occurred while updating user',
      });
    }
  }
);

// Delete user (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    // Prevent admin from deleting themselves
    if (parseInt(id) === requestingUser.id) {
      return res.status(400).json({
        error: 'Cannot delete own account',
        message: 'You cannot delete your own account',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User with this ID does not exist',
      });
    }

    // Soft delete by deactivating instead of hard delete
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: requestingUser.id,
        action: 'USER_DEACTIVATED',
        moduleName: 'USERS',
        referenceId: parseInt(id),
        details: `User deactivated by admin`,
      },
    });

    res.json({
      message: 'User deactivated successfully',
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'An error occurred while deleting user',
    });
  }
});

// Get user statistics (Admin only)
router.get('/stats/overview', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      citizenCount,
      employeeCount,
      adminCount,
      newUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    res.json({
      statistics: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        roleDistribution: {
          citizens: citizenCount,
          employees: employeeCount,
          admins: adminCount,
        },
        newUsersThisMonth,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user statistics',
      message: 'An error occurred while fetching user statistics',
    });
  }
});

module.exports = router;