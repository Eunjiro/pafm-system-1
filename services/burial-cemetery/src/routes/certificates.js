const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireCitizen, requireEmployee } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// TODO: Implement certificate request endpoints
// - POST / - Create new certificate request
// - GET / - List certificate requests
// - GET /:id - Get specific certificate request
// - PUT /:id - Update certificate request
// - POST /:id/documents - Upload documents
// - PUT /:id/status - Update status (employee/admin only)

router.get('/', requireCitizen, async (req, res) => {
  res.json({ message: 'Certificates endpoint - Coming soon' });
});

module.exports = router;