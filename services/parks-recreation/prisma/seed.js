const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create Parks first
  const park1 = await prisma.park.create({
    data: {
      name: 'San Jose Memorial Park',
      location: 'San Jose, Batangas',
      address: '123 Memorial Drive, San Jose, Batangas',
      size: '5 hectares',
      description: 'A beautiful memorial park with water amenities and picnic areas perfect for family gatherings. Open Monday-Sunday: 6:00 AM - 8:00 PM. Contact: 043-123-4567',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
      isActive: true
    }
  })

  const park2 = await prisma.park.create({
    data: {
      name: 'Batangas City Sports Complex',
      location: 'Batangas City',
      address: '456 Sports Avenue, Batangas City',
      size: '10 hectares',
      description: 'Modern sports complex with indoor and outdoor facilities for various sports and events. Open Tuesday-Sunday: 7:00 AM - 10:00 PM, Monday: Closed for Maintenance. Contact: 043-987-6543',
      imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211',
      isActive: true
    }
  })

  console.log('✅ Created 2 parks')

  // Create Amenities
  const amenities = await prisma.amenity.createMany({
    data: [
      // Water Park Amenities
      {
        name: 'Family Cottage #1',
        type: 'COTTAGE',
        description: 'Spacious cottage perfect for family gatherings with seating for 10-15 people. Includes tables, chairs, and BBQ grill access. Located at San Jose Memorial Park.',
        capacity: 15,
        hourlyRate: 250.00,
        dailyRate: 1500.00,
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
        isActive: true
      },
      {
        name: 'Family Cottage #2',
        type: 'COTTAGE',
        description: 'Comfortable cottage with scenic view, perfect for small families. Accommodates 8-12 people. Located at San Jose Memorial Park.',
        capacity: 12,
        hourlyRate: 200.00,
        dailyRate: 1200.00,
        imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d',
        isActive: true
      },
      {
        name: 'Premium Cabana',
        type: 'PAVILION',
        description: 'Luxury cabana with premium amenities including mini-fridge, cushioned seating, and direct pool access. Located at San Jose Memorial Park.',
        capacity: 8,
        hourlyRate: 500.00,
        dailyRate: 3000.00,
        imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
        isActive: true
      },
      {
        name: 'Pool Area - Kiddie Section',
        type: 'POOL_AREA',
        description: 'Safe shallow pool area designed for children ages 3-10. Lifeguard on duty. Maximum 50 swimmers. Located at San Jose Memorial Park.',
        capacity: 50,
        hourlyRate: 50.00,
        dailyRate: 300.00,
        imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7',
        isActive: true
      },
      {
        name: 'Pool Area - Olympic Size',
        type: 'POOL_AREA',
        description: 'Professional 50-meter Olympic-sized swimming pool. Ideal for training and competitions. Located at San Jose Memorial Park.',
        capacity: 100,
        hourlyRate: 100.00,
        dailyRate: 600.00,
        imageUrl: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9',
        isActive: true
      },
      {
        name: 'Picnic Table Set #1',
        type: 'TABLE',
        description: 'Standard picnic table set with umbrella shade. Seats 6-8 people comfortably. Located at San Jose Memorial Park.',
        capacity: 8,
        hourlyRate: 100.00,
        dailyRate: 500.00,
        imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
        isActive: true
      },

      // Sports Complex Amenities
      {
        name: 'Basketball Court A',
        type: 'OTHER',
        description: 'Full-size indoor basketball court with professional flooring and scoring system. Located at Batangas City Sports Complex.',
        capacity: 100,
        hourlyRate: 800.00,
        dailyRate: 5000.00,
        imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc',
        isActive: true
      },
      {
        name: 'Tennis Court #1',
        type: 'OTHER',
        description: 'Well-maintained outdoor tennis court with night lighting. Located at Batangas City Sports Complex.',
        capacity: 4,
        hourlyRate: 400.00,
        dailyRate: 2500.00,
        imageUrl: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6',
        isActive: true
      },
      {
        name: 'Multipurpose Hall',
        type: 'ROOM',
        description: 'Air-conditioned multipurpose hall suitable for seminars, meetings, and indoor events. Capacity: 200 pax. Located at Batangas City Sports Complex.',
        capacity: 200,
        hourlyRate: 1500.00,
        dailyRate: 10000.00,
        imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04',
        isActive: true
      },
      {
        name: 'VIP Function Room',
        type: 'ROOM',
        description: 'Elegant function room with catering kitchen, AV equipment, and restrooms. Perfect for private events. Located at Batangas City Sports Complex.',
        capacity: 50,
        hourlyRate: 2000.00,
        dailyRate: 15000.00,
        imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f29da8a43f',
        isActive: true
      }
    ]
  })

  console.log(`✅ Created ${amenities.count} amenities`)

  // Create Venues
  const venues = await prisma.venue.createMany({
    data: [
      {
        name: 'Grand Pavilion',
        type: 'PICNIC_GROUND',
        description: 'Large outdoor pavilion perfect for weddings, birthdays, and corporate events. Can accommodate up to 300 guests. Located at San Jose Memorial Park.',
        capacity: 300,
        hourlyRate: 3000.00,
        dailyRate: 25000.00,
        imageUrl: 'https://images.unsplash.com/photo-1519167758481-83f29da8a43f',
        requiresPermit: true,
        isActive: true
      },
      {
        name: 'Garden Event Space',
        type: 'PICNIC_GROUND',
        description: 'Beautiful garden venue with natural landscaping, perfect for intimate gatherings and garden parties. Located at San Jose Memorial Park.',
        capacity: 150,
        hourlyRate: 1800.00,
        dailyRate: 15000.00,
        imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3',
        requiresPermit: true,
        isActive: true
      },
      {
        name: 'Sports Complex Main Hall',
        type: 'MULTIPURPOSE_HALL',
        description: 'Spacious indoor hall with stage, sound system, and lighting. Ideal for conventions, concerts, and large gatherings. Located at Batangas City Sports Complex.',
        capacity: 500,
        hourlyRate: 6000.00,
        dailyRate: 50000.00,
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
        requiresPermit: true,
        isActive: true
      },
      {
        name: 'Conference Center',
        type: 'FUNCTION_ROOM',
        description: 'Professional conference facility with breakout rooms, AV equipment, and catering services. Located at Batangas City Sports Complex.',
        capacity: 200,
        hourlyRate: 3500.00,
        dailyRate: 30000.00,
        imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
        requiresPermit: false,
        isActive: true
      }
    ]
  })

  console.log(`✅ Created ${venues.count} venues`)

  // Create sample reservations
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const allAmenities = await prisma.amenity.findMany()

  const reservation1 = await prisma.amenityReservation.create({
    data: {
      bookingCode: `AMN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      amenityId: allAmenities[0].id,
      requesterName: 'Juan Dela Cruz',
      requesterEmail: 'juan.delacruz@email.com',
      requesterPhone: '0917-123-4567',
      requesterType: 'RESIDENT',
      reservationDate: tomorrow,
      startTime: '09:00',
      endTime: '17:00',
      numberOfGuests: 12,
      specialRequests: 'Family Reunion - Need extra chairs and tables',
      totalAmount: 1500.00,
      status: 'PENDING_REVIEW',
      paymentStatus: 'UNPAID'
    }
  })

  const reservation2 = await prisma.amenityReservation.create({
    data: {
      bookingCode: `AMN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
      amenityId: allAmenities[2].id,
      requesterName: 'Maria Santos',
      requesterEmail: 'maria.santos@email.com',
      requesterPhone: '0918-987-6543',
      requesterType: 'RESIDENT',
      reservationDate: nextWeek,
      startTime: '10:00',
      endTime: '18:00',
      numberOfGuests: 6,
      specialRequests: 'Birthday Party - Turning 50',
      totalAmount: 3000.00,
      status: 'APPROVED',
      paymentStatus: 'PAID',
      paidAt: new Date(),
      paymentMethod: 'GCash',
      approvedBy: 'Admin',
      approvedAt: new Date()
    }
  })

  console.log('✅ Created 2 sample reservations')

  console.log('\n🎉 Seed completed successfully!')
  console.log(`
📊 Summary:
  - Parks: 2
  - Amenities: ${amenities.count}
  - Venues: ${venues.count}
  - Reservations: 2
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
