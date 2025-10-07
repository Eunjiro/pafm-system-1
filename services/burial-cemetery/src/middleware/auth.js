const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        fullNameFirst: true,
        fullNameLast: true,
        isActive: true,
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Invalid or inactive user' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Token expired' 
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Authentication failed' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Authentication required' 
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `Role ${userRole} is not authorized for this action` 
      });
    }

    next();
  };
};

const requireAdmin = requireRole(['ADMIN']);
const requireEmployee = requireRole(['EMPLOYEE', 'ADMIN']);
const requireCitizen = requireRole(['CITIZEN', 'EMPLOYEE', 'ADMIN']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireEmployee,
  requireCitizen,
};