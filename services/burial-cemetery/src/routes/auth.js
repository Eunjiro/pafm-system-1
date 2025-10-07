const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('fullNameFirst').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('fullNameLast').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').optional().isIn(['CITIZEN', 'EMPLOYEE', 'ADMIN']).withMessage('Invalid role'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

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
});

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const {
      email,
      password,
      fullNameFirst,
      fullNameMiddle,
      fullNameLast,
      nameSuffix,
      contactNo,
      address,
      organization,
      role = 'CITIZEN',
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists',
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullNameFirst,
        fullNameMiddle,
        fullNameLast,
        nameSuffix,
        contactNo,
        address,
        organization,
        role,
      },
    });

    // Generate token
    const token = generateToken(user);

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'USER_REGISTERED',
        moduleName: 'AUTH',
        referenceId: user.id,
        details: `User registered with email: ${email}`,
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration',
    });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.',
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user);

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'USER_LOGIN',
        moduleName: 'AUTH',
        referenceId: user.id,
        details: `User logged in with email: ${email}`,
      },
    });

    res.json({
      message: 'Login successful',
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login',
    });
  }
});

// Social login (for NextAuth integration)
router.post('/social-login', async (req, res) => {
  try {
    const { 
      email, 
      providerId, 
      provider, 
      fullNameFirst, 
      fullNameLast,
      fullNameMiddle,
    } = req.body;

    if (!email || !providerId || !provider) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, providerId, and provider are required',
      });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user for social login
      const providerIdField = provider === 'google' ? 'googleId' : 'facebookId';
      
      user = await prisma.user.create({
        data: {
          email,
          fullNameFirst: fullNameFirst || '',
          fullNameMiddle,
          fullNameLast: fullNameLast || '',
          role: 'CITIZEN',
          [providerIdField]: providerId,
        },
      });

      // Log audit trail
      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'SOCIAL_USER_CREATED',
          moduleName: 'AUTH',
          referenceId: user.id,
          details: `User created via ${provider} login: ${email}`,
        },
      });
    } else {
      // Update provider ID if not set
      const providerIdField = provider === 'google' ? 'googleId' : 'facebookId';
      
      if (!user[providerIdField]) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { [providerIdField]: providerId },
        });
      }

      // Log audit trail
      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'SOCIAL_USER_LOGIN',
          moduleName: 'AUTH',
          referenceId: user.id,
          details: `User logged in via ${provider}: ${email}`,
        },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.',
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Social login successful',
      user: formatUserResponse(user),
      token,
    });
  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      error: 'Social login failed',
      message: 'An error occurred during social login',
    });
  }
});

// Verify token (for NextAuth callbacks)
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization token is required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is invalid or user is inactive',
      });
    }

    res.json({
      message: 'Token is valid',
      user: formatUserResponse(user),
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Token has expired',
      });
    }
    
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: 'An error occurred during token verification',
    });
  }
});

module.exports = router;