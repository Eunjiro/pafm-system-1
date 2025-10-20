const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3004

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Parks & Recreation Service is running',
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.use('/api/amenities', require('./routes/amenities'))
app.use('/api/amenity-reservations', require('./routes/amenityReservations'))
app.use('/api/venues', require('./routes/venues'))
app.use('/api/venue-bookings', require('./routes/venueBookings'))
app.use('/api/parks', require('./routes/parks'))
app.use('/api/maintenance-requests', require('./routes/maintenanceRequests'))
app.use('/api/dashboard', require('./routes/dashboard'))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🏞️  Parks & Recreation Service running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
})

module.exports = app
