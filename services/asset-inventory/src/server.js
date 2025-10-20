const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'asset-inventory-service',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/items', require('./routes/items'));
app.use('/api/storage', require('./routes/storage'));
app.use('/api/ris', require('./routes/ris'));
app.use('/api/physical-inventory', require('./routes/physical-inventory'));
app.use('/api/issuances', require('./routes/issuances'));
// app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
// app.use('/api/delivery-receipts', require('./routes/deliveryReceipts'));
// app.use('/api/stock', require('./routes/stock'));
// app.use('/api/reports', require('./routes/reports'));

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏢 Asset Inventory Service running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
