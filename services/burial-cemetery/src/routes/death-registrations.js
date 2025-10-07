const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireCitizen, requireEmployee } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// TODO: Implement death registration endpoints
// - POST / - Create new death registration
// - GET / - List death registrations
// - GET /:id - Get specific death registration
// - PUT /:id - Update death registration
// - POST /:id/documents - Upload documents
// - PUT /:id/status - Update status (employee/admin only)

router.get('/', requireCitizen, async (req, res) => {
  res.json({ message: 'Death registrations endpoint - Coming soon' });
});

module.exports = router;