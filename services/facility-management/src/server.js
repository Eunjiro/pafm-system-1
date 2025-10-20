require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const citizenRoutes = require('./routes/citizen');
const staffRoutes = require('./routes/staff');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Facility Management Service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Facility Management Service',
    version: '1.0.0',
    description: 'Handle facility bookings, reservations, and usage analytics',
    endpoints: {
      auth: '/api/auth',
      citizen: '/api/citizen',
      staff: '/api/staff',
      admin: '/api/admin'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Facility Management Service running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
