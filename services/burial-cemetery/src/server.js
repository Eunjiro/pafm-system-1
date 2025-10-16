const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const deathRegistrationRoutes = require('./routes/death-registrations');
const permitRoutes = require('./routes/permits');
const certificateRoutes = require('./routes/certificates');
const plotRoutes = require('./routes/plots-simple');
const cemeteryRoutes = require('./routes/cemeteries');
const cemeterySectionRoutes = require('./routes/cemetery-sections');
const cemeteryBlockRoutes = require('./routes/cemetery-blocks');
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting - More reasonable limits for development and testing
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000, // 5 minutes (shorter window)
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 300, // 300 requests per 5 minutes (much more reasonable)
  message: { 
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000) / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'burial-cemetery-service',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/death-registrations', authenticateToken, deathRegistrationRoutes);
app.use('/api/permits', authenticateToken, permitRoutes);
app.use('/api/certificates', authenticateToken, certificateRoutes);
app.use('/api/plots', authenticateToken, plotRoutes);
app.use('/api/cemeteries', authenticateToken, cemeteryRoutes);
app.use('/api/cemetery-sections', authenticateToken, cemeterySectionRoutes);
app.use('/api/cemetery-blocks', authenticateToken, cemeteryBlockRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Cemetery & Burial Management Service running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;