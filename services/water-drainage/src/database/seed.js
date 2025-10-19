const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Quezon City Barangays (sample from different districts)
const barangays = [
  { name: 'Bagbag', district: 'District 1', population: 73500 },
  { name: 'Batasan Hills', district: 'District 1', population: 161409 },
  { name: 'Commonwealth', district: 'District 1', population: 198295 },
  { name: 'Fairview', district: 'District 5', population: 198560 },
  { name: 'Novaliches Proper', district: 'District 1', population: 47207 },
  { name: 'Pasong Tamo', district: 'District 1', population: 47207 },
  { name: 'Payatas', district: 'District 2', population: 85298 },
  { name: 'Project 8', district: 'District 3', population: 51248 },
  { name: 'Quezon City Hall', district: 'District 2', population: 3215 },
  { name: 'Tandang Sora', district: 'District 5', population: 84030 }
];

const sampleDrainageRequests = [
  {
    requesterName: 'Maria Santos',
    contactNumber: '09171234567',
    email: 'maria.santos@email.com',
    issueType: 'CLOGGED_DRAIN',
    description: 'Main drainage clogged causing water overflow during heavy rain',
    location: 'Main Street cor. 5th Avenue',
    barangay: 'Bagbag',
    specificAddress: '123 Main Street, Bagbag, Novaliches, Quezon City',
    status: 'PENDING',
    priority: 'HIGH',
    photos: []
  },
  {
    requesterName: 'Juan Dela Cruz',
    contactNumber: '09187654321',
    issueType: 'FLOODING',
    description: 'Severe flooding in the area after moderate rain',
    location: 'Tandang Sora Avenue',
    barangay: 'Tandang Sora',
    specificAddress: '456 Tandang Sora Ave, Quezon City',
    status: 'FOR_APPROVAL',
    priority: 'URGENT',
    photos: []
  },
  {
    requesterName: 'Ana Reyes',
    contactNumber: '09191112222',
    email: 'ana.reyes@email.com',
    issueType: 'BROKEN_PIPE',
    description: 'Broken drainage pipe leaking near residential area',
    location: 'Commonwealth Avenue',
    barangay: 'Commonwealth',
    specificAddress: '789 Commonwealth Ave, Quezon City',
    status: 'ONGOING',
    priority: 'MEDIUM',
    assignedEngineerName: 'Engr. Pedro Garcia',
    assignedAt: new Date(),
    photos: []
  }
];

const sampleWaterConnections = [
  {
    applicantFirstName: 'Jose',
    applicantLastName: 'Rizal',
    applicantMiddleName: 'Protacio',
    contactNumber: '09171234567',
    email: 'jose.rizal@email.com',
    propertyAddress: '100 Rizal Street, Fairview',
    barangay: 'Fairview',
    propertyType: 'OWNED',
    connectionType: 'RESIDENTIAL',
    numberOfOccupants: 5,
    validIdUrl: '/uploads/id-sample.jpg',
    proofOfOwnershipUrl: '/uploads/title-sample.pdf',
    connectionFee: 5000.00,
    status: 'PENDING',
    inspectionPhotos: [],
    installationPhotos: []
  },
  {
    applicantFirstName: 'Andres',
    applicantLastName: 'Bonifacio',
    contactNumber: '09187654321',
    email: 'a.bonifacio@email.com',
    propertyAddress: '200 Bonifacio St, Project 8',
    barangay: 'Project 8',
    propertyType: 'OWNED',
    connectionType: 'COMMERCIAL',
    businessName: 'Bonifacio Retail Store',
    businessType: 'Retail',
    validIdUrl: '/uploads/id-sample2.jpg',
    businessPermitUrl: '/uploads/permit-sample.pdf',
    connectionFee: 15000.00,
    status: 'FOR_INSPECTION',
    inspectorName: 'Insp. Carlos Mendoza',
    inspectionPhotos: [],
    installationPhotos: []
  },
  {
    applicantFirstName: 'Emilio',
    applicantLastName: 'Aguinaldo',
    contactNumber: '09191112222',
    propertyAddress: '300 Aguinaldo Ave, Batasan Hills',
    barangay: 'Batasan Hills',
    propertyType: 'OWNED',
    connectionType: 'RESIDENTIAL',
    numberOfOccupants: 4,
    validIdUrl: '/uploads/id-sample3.jpg',
    proofOfOwnershipUrl: '/uploads/title-sample3.pdf',
    connectionFee: 5000.00,
    status: 'ACTIVE',
    meterNumber: 'MTR-2024-001',
    connectionSize: '1/2 inch',
    activatedAt: new Date(),
    inspectionPhotos: [],
    installationPhotos: []
  }
];

const sampleWaterIssues = [
  {
    reporterName: 'Pedro Gonzales',
    contactNumber: '09171234567',
    email: 'pedro.g@email.com',
    accountNumber: 'WTR-001-2024',
    issueType: 'NO_WATER_SUPPLY',
    description: 'No water supply for the past 12 hours',
    location: 'Bagbag Main Road',
    barangay: 'Bagbag',
    specificAddress: '50 Main Road, Bagbag, Quezon City',
    status: 'PENDING',
    priority: 'HIGH',
    photos: [],
    resolutionPhotos: []
  },
  {
    reporterName: 'Luisa Martinez',
    contactNumber: '09187654321',
    accountNumber: 'WTR-002-2024',
    issueType: 'LOW_PRESSURE',
    description: 'Very low water pressure, barely any water coming out',
    location: 'Tandang Sora',
    barangay: 'Tandang Sora',
    specificAddress: '125 Tandang Sora Ave, QC',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    assignedStaffName: 'Tech. Ramon Cruz',
    assignedAt: new Date(),
    photos: [],
    resolutionPhotos: []
  },
  {
    reporterName: 'Roberto Silva',
    contactNumber: '09191112222',
    email: 'roberto.silva@email.com',
    accountNumber: 'WTR-003-2024',
    issueType: 'WATER_LEAK',
    description: 'Water leaking from pipe connection, wasting water',
    location: 'Commonwealth Area',
    barangay: 'Commonwealth',
    specificAddress: '88 Commonwealth Ave, QC',
    status: 'RESOLVED',
    priority: 'MEDIUM',
    assignedStaffName: 'Tech. Miguel Santos',
    assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(),
    resolutionNotes: 'Pipe connection tightened and replaced worn gasket',
    photos: [],
    resolutionPhotos: []
  }
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.waterIssueUpdate.deleteMany();
  await prisma.waterIssue.deleteMany();
  await prisma.connectionUpdate.deleteMany();
  await prisma.waterConnection.deleteMany();
  await prisma.drainageUpdate.deleteMany();
  await prisma.drainageRequest.deleteMany();
  await prisma.barangay.deleteMany();

  // Seed Barangays
  console.log('📍 Seeding barangays...');
  for (const barangay of barangays) {
    await prisma.barangay.create({ data: barangay });
  }
  console.log(`✅ Created ${barangays.length} barangays`);

  // Seed Drainage Requests
  console.log('🚰 Seeding drainage requests...');
  for (const request of sampleDrainageRequests) {
    await prisma.drainageRequest.create({ data: request });
  }
  console.log(`✅ Created ${sampleDrainageRequests.length} drainage requests`);

  // Seed Water Connections
  console.log('💧 Seeding water connections...');
  for (const connection of sampleWaterConnections) {
    await prisma.waterConnection.create({ data: connection });
  }
  console.log(`✅ Created ${sampleWaterConnections.length} water connections`);

  // Seed Water Issues
  console.log('🔧 Seeding water issues...');
  for (const issue of sampleWaterIssues) {
    await prisma.waterIssue.create({ data: issue });
  }
  console.log(`✅ Created ${sampleWaterIssues.length} water issues`);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - ${barangays.length} Barangays`);
  console.log(`   - ${sampleDrainageRequests.length} Drainage Requests`);
  console.log(`   - ${sampleWaterConnections.length} Water Connections`);
  console.log(`   - ${sampleWaterIssues.length} Water Issues`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
