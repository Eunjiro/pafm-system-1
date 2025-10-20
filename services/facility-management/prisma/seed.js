const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Users (Staff/Admin)
  console.log('Creating users...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@facility.gov' },
    update: {},
    create: {
      email: 'admin@facility.gov',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    }
  });

  const staff1 = await prisma.user.upsert({
    where: { email: 'staff1@facility.gov' },
    update: {},
    create: {
      email: 'staff1@facility.gov',
      password: hashedPassword,
      firstName: 'Maria',
      lastName: 'Santos',
      role: 'STAFF'
    }
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'staff2@facility.gov' },
    update: {},
    create: {
      email: 'staff2@facility.gov',
      password: hashedPassword,
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      role: 'STAFF'
    }
  });

  console.log(`✅ Created ${3} users`);

  // Create Facilities
  console.log('Creating facilities...');

  const conferenceHall = await prisma.facility.create({
    data: {
      name: 'Main Conference Hall',
      type: 'Conference Hall',
      capacity: 200,
      description: 'Large conference hall with modern facilities',
      amenities: ['Projector', 'Sound System', 'Air Conditioning', 'WiFi', 'Stage'],
      location: 'Building A, 2nd Floor',
      hourlyRate: 2500.00,
      isActive: true
    }
  });

  const gym = await prisma.facility.create({
    data: {
      name: 'Municipal Sports Gymnasium',
      type: 'Gym',
      capacity: 500,
      description: 'Multi-purpose gymnasium for sports and large events',
      amenities: ['Basketball Court', 'Volleyball Net', 'Bleachers', 'Sound System'],
      location: 'Sports Complex',
      hourlyRate: 3000.00,
      isActive: true
    }
  });

  const trainingRoom = await prisma.facility.create({
    data: {
      name: 'Training Room A',
      type: 'Training Room',
      capacity: 50,
      description: 'Intimate training room for seminars and workshops',
      amenities: ['Whiteboard', 'Projector', 'Tables and Chairs', 'Air Conditioning', 'WiFi'],
      location: 'Building B, 3rd Floor',
      hourlyRate: 1500.00,
      isActive: true
    }
  });

  const auditorium = await prisma.facility.create({
    data: {
      name: 'Grand Auditorium',
      type: 'Auditorium',
      capacity: 800,
      description: 'Grand auditorium for major events and ceremonies',
      amenities: ['Stage', 'Orchestra Pit', 'Sound System', 'Lighting System', 'Green Rooms', 'WiFi'],
      location: 'Main Building',
      hourlyRate: 5000.00,
      isActive: true
    }
  });

  const culturalCenter = await prisma.facility.create({
    data: {
      name: 'Cultural Center',
      type: 'Cultural Center',
      capacity: 300,
      description: 'Cultural center for exhibits and cultural events',
      amenities: ['Exhibit Spaces', 'Sound System', 'Air Conditioning', 'WiFi', 'Display Boards'],
      location: 'Cultural District',
      hourlyRate: 2000.00,
      isActive: true
    }
  });

  console.log(`✅ Created ${5} facilities`);

  // Create Blackout Dates
  console.log('Creating blackout dates...');

  await prisma.blackoutDate.create({
    data: {
      facilityId: gym.id,
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-11-05'),
      reason: 'Annual sports festival - LGU exclusive event',
      type: 'LGU_ONLY'
    }
  });

  await prisma.blackoutDate.create({
    data: {
      facilityId: conferenceHall.id,
      startDate: new Date('2025-10-28'),
      endDate: new Date('2025-10-30'),
      reason: 'Maintenance and renovation',
      type: 'MAINTENANCE'
    }
  });

  console.log(`✅ Created blackout dates`);

  // Create Sample Facility Requests
  console.log('Creating sample facility requests...');

  // Approved Government Event
  const req1 = await prisma.facilityRequest.create({
    data: {
      requestNumber: 'FR-2025-0001',
      applicantName: 'Department of Education',
      organizationName: 'DepEd Division Office',
      contactPerson: 'Dr. Roberto Gonzales',
      contactNumber: '09171234567',
      email: 'roberto.gonzales@deped.gov.ph',
      facilityId: conferenceHall.id,
      activityType: 'SEMINAR',
      activityPurpose: 'Teachers Training Seminar on New Curriculum',
      scheduleStart: new Date('2025-11-15T08:00:00'),
      scheduleEnd: new Date('2025-11-15T17:00:00'),
      estimatedParticipants: 150,
      layoutRequirements: 'Theater style seating, stage setup',
      equipmentNeeds: 'Projector, microphones, sound system',
      eventType: 'GOVERNMENT',
      status: 'APPROVED',
      paymentStatus: 'EXEMPTED',
      paymentType: 'EXEMPTED',
      totalAmount: 0,
      handledById: staff1.id,
      reviewedAt: new Date('2025-10-22'),
      approvedAt: new Date('2025-10-22'),
      eventStatus: 'SCHEDULED',
      gatePass: 'GP-1729600000000-ABC123XYZ'
    }
  });

  await prisma.statusHistory.createMany({
    data: [
      {
        requestId: req1.id,
        fromStatus: null,
        toStatus: 'PENDING_REVIEW',
        changedBy: 'SYSTEM',
        remarks: 'Request submitted'
      },
      {
        requestId: req1.id,
        fromStatus: 'PENDING_REVIEW',
        toStatus: 'APPROVED',
        changedBy: staff1.email,
        remarks: 'Government event - Exempted from payment'
      }
    ]
  });

  // Pending Private Event
  const req2 = await prisma.facilityRequest.create({
    data: {
      requestNumber: 'FR-2025-0002',
      applicantName: 'Maria Theresa Cruz',
      organizationName: 'Barangay Malanday Youth Organization',
      contactPerson: 'Maria Theresa Cruz',
      contactNumber: '09189876543',
      email: 'mariacruz@email.com',
      facilityId: gym.id,
      activityType: 'SPORTS',
      activityPurpose: 'Inter-Barangay Basketball Tournament',
      scheduleStart: new Date('2025-11-20T08:00:00'),
      scheduleEnd: new Date('2025-11-20T18:00:00'),
      estimatedParticipants: 300,
      layoutRequirements: 'Basketball court setup with bleachers',
      equipmentNeeds: 'Sound system, scoreboard',
      barangayEndorsement: 'uploads/endorsements/barangay-endorsement-sample.pdf',
      eventType: 'PRIVATE',
      status: 'AWAITING_PAYMENT',
      paymentStatus: 'PENDING',
      totalAmount: 30000.00,
      handledById: staff2.id,
      reviewedAt: new Date('2025-10-21')
    }
  });

  await prisma.statusHistory.createMany({
    data: [
      {
        requestId: req2.id,
        fromStatus: null,
        toStatus: 'PENDING_REVIEW',
        changedBy: 'SYSTEM',
        remarks: 'Request submitted'
      },
      {
        requestId: req2.id,
        fromStatus: 'PENDING_REVIEW',
        toStatus: 'AWAITING_PAYMENT',
        changedBy: staff2.email,
        remarks: 'Payment order issued'
      }
    ]
  });

  // Completed Event with Inspection
  const req3 = await prisma.facilityRequest.create({
    data: {
      requestNumber: 'FR-2025-0003',
      applicantName: 'Marikina Cultural Society',
      organizationName: 'Marikina Cultural Society',
      contactPerson: 'Antonio Reyes',
      contactNumber: '09123456789',
      email: 'areyes@culture.org',
      facilityId: culturalCenter.id,
      activityType: 'CULTURAL_EVENT',
      activityPurpose: 'Art Exhibition - Local Artists Showcase',
      scheduleStart: new Date('2025-10-18T09:00:00'),
      scheduleEnd: new Date('2025-10-18T19:00:00'),
      estimatedParticipants: 200,
      layoutRequirements: 'Exhibition booths, display panels',
      equipmentNeeds: 'Lighting, display boards',
      eventType: 'PRIVATE',
      status: 'APPROVED',
      paymentStatus: 'PAID',
      paymentType: 'CASH',
      paymentProof: 'uploads/payments/payment-receipt-001.jpg',
      totalAmount: 20000.00,
      paidAt: new Date('2025-10-15'),
      handledById: staff1.id,
      reviewedAt: new Date('2025-10-12'),
      approvedAt: new Date('2025-10-15'),
      eventStatus: 'COMPLETED',
      gatePass: 'GP-1729000000000-XYZ789ABC',
      actualStartTime: new Date('2025-10-18T09:15:00'),
      actualEndTime: new Date('2025-10-18T19:30:00')
    }
  });

  await prisma.inspection.create({
    data: {
      requestId: req3.id,
      inspectedById: staff1.id,
      inspectionDate: new Date('2025-10-18T20:00:00'),
      hasDamages: false,
      status: 'NO_ISSUES',
      billingAmount: 0,
      remarks: 'Facility in good condition. No damages observed.'
    }
  });

  // Pending Review
  const req4 = await prisma.facilityRequest.create({
    data: {
      requestNumber: 'FR-2025-0004',
      applicantName: 'St. Mary Academy',
      organizationName: 'St. Mary Academy',
      contactPerson: 'Sr. Lucia Fernandez',
      contactNumber: '09171112222',
      email: 'contact@stmary.edu.ph',
      facilityId: auditorium.id,
      activityType: 'MEETING',
      activityPurpose: 'Parents-Teachers Conference',
      scheduleStart: new Date('2025-11-25T08:00:00'),
      scheduleEnd: new Date('2025-11-25T12:00:00'),
      estimatedParticipants: 500,
      layoutRequirements: 'Auditorium seating',
      equipmentNeeds: 'Sound system, projector',
      eventType: 'PRIVATE',
      status: 'PENDING_REVIEW',
      paymentStatus: 'PENDING',
      totalAmount: 0
    }
  });

  console.log(`✅ Created ${4} sample facility requests`);

  console.log('');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Users: 3`);
  console.log(`   - Facilities: 5`);
  console.log(`   - Facility Requests: 4`);
  console.log('');
  console.log('🔐 Default Login Credentials:');
  console.log('   Admin: admin@facility.gov / admin123');
  console.log('   Staff: staff1@facility.gov / admin123');
  console.log('   Staff: staff2@facility.gov / admin123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
