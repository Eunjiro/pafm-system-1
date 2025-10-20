const express = require('express')
const router = express.Router()

// Placeholder - similar to amenity reservations
router.get('/', (req, res) => {
  res.json({ success: true, data: [], message: 'Venue bookings endpoint' })
})

module.exports = router
