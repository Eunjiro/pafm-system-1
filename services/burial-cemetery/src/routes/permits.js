const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireCitizen, requireEmployee } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// TODO: Implement permit request endpoints
// - POST / - Create new permit request
// - GET / - List permit requests
// - GET /:id - Get specific permit request
// - PUT /:id - Update permit request
// - POST /:id/documents - Upload documents
// - PUT /:id/status - Update status (employee/admin only)

router.get('/', requireCitizen, async (req, res) => {
  res.json({ message: 'Permits endpoint - Coming soon' });
});

module.exports = router;