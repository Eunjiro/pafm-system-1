const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@cemetery.qc.gov.ph' },
      update: {},
      create: {
        email: 'admin@cemetery.qc.gov.ph',
        passwordHash: adminPassword,
        role: 'ADMIN',
        fullNameFirst: 'System',
        fullNameLast: 'Administrator',
        contactNo: '+63-912-345-6789',
        organization: 'Quezon City Government',
        isActive: true,
      },
    });

    // Create employee user
    const employeePassword = await bcrypt.hash('employee123', 12);
    const employee = await prisma.user.upsert({
      where: { email: 'employee@cemetery.qc.gov.ph' },
      update: {},
      create: {
        email: 'employee@cemetery.qc.gov.ph',
        passwordHash: employeePassword,
        role: 'EMPLOYEE',
        fullNameFirst: 'Maria',
        fullNameLast: 'Santos',
        contactNo: '+63-917-123-4567',
        organization: 'Civil Registry Office',
        isActive: true,
      },
    });

    // Create sample citizen user
    const citizenPassword = await bcrypt.hash('citizen123', 12);
    const citizen = await prisma.user.upsert({
      where: { email: 'citizen@example.com' },
      update: {},
      create: {
        email: 'citizen@example.com',
        passwordHash: citizenPassword,
        role: 'CITIZEN',
        fullNameFirst: 'Juan',
        fullNameLast: 'Dela Cruz',
        fullNameMiddle: 'Santos',
        contactNo: '+63-905-987-6543',
        address: '123 Main Street, Quezon City',
        isActive: true,
      },
    });

    // Create sample cemetery
    const cemetery = await prisma.cemetery.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Quezon City Public Cemetery',
        description: 'Main public cemetery serving Quezon City residents',
        address: 'Araneta Avenue, Quezon City',
        city: 'Quezon City',
        postalCode: '1100',
        establishedDate: new Date('1950-01-01'),
        totalArea: '50000', // 50,000 square meters
        standardPrice: 5000.00,
        largePrice: 8000.00,
        familyPrice: 15000.00,
        nichePrice: 3000.00,
        maintenanceFee: 500.00,
        isActive: true,
      },
    });

    // Create cemetery sections
    const sections = [];
    for (let i = 1; i <= 5; i++) {
      const section = await prisma.cemeterySection.upsert({
        where: { id: i },
        update: {},
        create: {
          cemeteryId: cemetery.id,
          name: `Section ${i}`,
          description: `Cemetery Section ${i} - Ground burial plots`,
          capacity: 200, // 200 plots per section
        },
      });
      sections.push(section);
    }

    // Create cemetery blocks
    const blocks = [];
    for (const section of sections) {
      for (let j = 1; j <= 10; j++) {
        const block = await prisma.cemeteryBlock.upsert({
          where: { id: (section.id - 1) * 10 + j },
          update: {},
          create: {
            sectionId: section.id,
            name: `Block ${j}`,
            blockType: j <= 8 ? 'STANDARD' : j === 9 ? 'PREMIUM' : 'FAMILY',
            capacity: 20, // 20 plots per block
          },
        });
        blocks.push(block);
      }
    }

    // Create sample cemetery plots
    const plots = [];
    for (let section = 1; section <= 5; section++) {
      const sectionRecord = sections[section - 1];
      for (let block = 1; block <= 10; block++) {
        const blockRecord = blocks[(section - 1) * 10 + (block - 1)];
        for (let lot = 1; lot <= 20; lot++) {
          plots.push({
            cemeteryId: cemetery.id,
            blockId: blockRecord.id,
            plotNumber: `LOT${lot.toString().padStart(2, '0')}`,
            section: `Section ${section}`, // Keep for backward compatibility
            block: `Block ${block}`, // Keep for backward compatibility
            lot: `Lot ${lot}`,
            plotCode: `SEC${section}-BLK${block}-LOT${lot.toString().padStart(2, '0')}`,
            size: lot % 3 === 0 ? 'FAMILY' : lot % 2 === 0 ? 'LARGE' : 'STANDARD',
            length: lot % 3 === 0 ? 3.0 : lot % 2 === 0 ? 2.5 : 2.0,
            width: lot % 3 === 0 ? 2.0 : 1.0,
            depth: 1.5,
            latitude: 14.6760 + (Math.random() - 0.5) * 0.01, // Random coords around Quezon City
            longitude: 121.0437 + (Math.random() - 0.5) * 0.01,
            status: Math.random() > 0.7 ? 'OCCUPIED' : 'VACANT',
            baseFee: lot % 3 === 0 ? 15000.00 : lot % 2 === 0 ? 8000.00 : 5000.00,
            maintenanceFee: 500.00,
            orientation: ['NORTH', 'SOUTH', 'EAST', 'WEST'][lot % 4],
            accessibility: true,
            maxLayers: 3,
            notes: `Plot in ${sectionRecord.name}, ${blockRecord.name}`,
          });
        }
      }
    }

    // Insert plots in batches
    const batchSize = 100;
    for (let i = 0; i < plots.length; i += batchSize) {
      const batch = plots.slice(i, i + batchSize);
      await prisma.cemeteryPlot.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    // Create sample deceased records
    const deceasedRecords = [
      {
        firstName: 'Jose',
        lastName: 'Rizal',
        middleName: 'Protasio',
        sex: 'Male',
        dateOfBirth: new Date('1861-06-19'),
        dateOfDeath: new Date('1896-12-30'),
        age: 35,
        placeOfDeath: 'Bagumbayan, Manila',
        residenceAddress: 'Calamba, Laguna',
        citizenship: 'Filipino',
        civilStatus: 'Single',
        occupation: 'Writer, Doctor',
        causeOfDeath: 'Execution by firing squad',
        covidRelated: false,
      },
      {
        firstName: 'Andres',
        lastName: 'Bonifacio',
        middleName: 'Deodato',
        sex: 'Male',
        dateOfBirth: new Date('1863-11-30'),
        dateOfDeath: new Date('1897-05-10'),
        age: 33,
        placeOfDeath: 'Mount Buntis, Maragondon, Cavite',
        residenceAddress: 'Tondo, Manila',
        citizenship: 'Filipino',
        civilStatus: 'Married',
        occupation: 'Revolutionary Leader',
        causeOfDeath: 'Execution',
        covidRelated: false,
      },
      {
        firstName: 'Maria',
        lastName: 'Clara',
        middleName: 'Santos',
        sex: 'Female',
        dateOfBirth: new Date('1985-03-15'),
        dateOfDeath: new Date('2024-10-08'),
        age: 39,
        placeOfDeath: 'Quezon City General Hospital',
        residenceAddress: '456 Sampaguita Street, Quezon City',
        citizenship: 'Filipino',
        civilStatus: 'Married',
        occupation: 'Teacher',
        causeOfDeath: 'Heart Disease',
        covidRelated: false,
      },
      {
        firstName: 'Roberto',
        lastName: 'Santos',
        middleName: 'Garcia',
        sex: 'Male',
        dateOfBirth: new Date('1945-12-25'),
        dateOfDeath: new Date('2024-10-09'),
        age: 78,
        placeOfDeath: 'St. Luke\'s Medical Center',
        residenceAddress: '789 Rose Street, Quezon City',
        citizenship: 'Filipino',
        civilStatus: 'Widowed',
        occupation: 'Retired Engineer',
        causeOfDeath: 'Pneumonia',
        covidRelated: true,
      },
      {
        firstName: 'Ana',
        lastName: 'Dela Cruz',
        middleName: 'Morales',
        sex: 'Female',
        dateOfBirth: new Date('1992-07-20'),
        dateOfDeath: new Date('2024-10-10'),
        age: 32,
        placeOfDeath: 'Philippine Heart Center',
        residenceAddress: '321 Lily Avenue, Quezon City',
        citizenship: 'Filipino',
        civilStatus: 'Single',
        occupation: 'Nurse',
        causeOfDeath: 'Cardiac Arrest',
        covidRelated: false,
      },
    ];

    const createdDeceased = [];
    for (const deceased of deceasedRecords) {
      const created = await prisma.deceasedRecord.create({
        data: deceased,
      });
      createdDeceased.push(created);
    }

    // Create sample death registrations with different statuses
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const deathRegistrations = [
      {
        registrationType: 'REGULAR',
        deceasedId: createdDeceased[2].id, // Maria Clara
        submittedBy: citizen.id,
        informantName: 'Juan Santos (Husband)',
        informantRelationship: 'Spouse',
        informantContact: '+63-917-555-0123',
        status: 'SUBMITTED',
        amountDue: 500.00,
        pickupRequired: true,
        pickupStatus: 'NOT_READY',
        createdAt: today,
        remarks: 'Regular death registration - documents complete'
      },
      {
        registrationType: 'REGULAR',
        deceasedId: createdDeceased[3].id, // Roberto Santos
        submittedBy: citizen.id,
        informantName: 'Carmen Santos (Daughter)',
        informantRelationship: 'Child',
        informantContact: '+63-918-555-0124',
        status: 'PROCESSING',
        amountDue: 500.00,
        pickupRequired: true,
        pickupStatus: 'NOT_READY',
        createdAt: yesterday,
        remarks: 'Under review - pending medical certificate verification'
      },
      {
        registrationType: 'DELAYED',
        deceasedId: createdDeceased[4].id, // Ana Dela Cruz
        submittedBy: citizen.id,
        informantName: 'Pedro Dela Cruz (Father)',
        informantRelationship: 'Parent',
        informantContact: '+63-919-555-0125',
        status: 'PROCESSING',
        amountDue: 1000.00,
        pickupRequired: true,
        pickupStatus: 'NOT_READY',
        createdAt: lastWeek,
        remarks: 'Delayed registration - additional documents required'
      },
      {
        registrationType: 'REGULAR',
        deceasedId: createdDeceased[0].id, // Jose Rizal (historical)
        submittedBy: employee.id,
        informantName: 'Historical Registry Office',
        informantRelationship: 'Government Office',
        informantContact: '+63-912-345-6789',
        status: 'REGISTERED',
        amountDue: 0.00,
        pickupRequired: false,
        pickupStatus: 'CLAIMED',
        registeredAt: today,
        registeredBy: employee.id,
        createdAt: lastWeek,
        remarks: 'Historical record - digitization project'
      },
      {
        registrationType: 'REGULAR',
        deceasedId: createdDeceased[1].id, // Andres Bonifacio (historical)
        submittedBy: employee.id,
        informantName: 'Historical Registry Office',
        informantRelationship: 'Government Office',
        informantContact: '+63-912-345-6789',
        status: 'FOR_PICKUP',
        amountDue: 0.00,
        pickupRequired: true,
        pickupStatus: 'READY_FOR_PICKUP',
        registeredAt: yesterday,
        registeredBy: employee.id,
        createdAt: lastWeek,
        remarks: 'Historical record - ready for archival'
      },
      // Additional registrations for better statistics
      {
        registrationType: 'REGULAR',
        submittedBy: citizen.id,
        informantName: 'Sample Informant 1',
        informantRelationship: 'Relative',
        informantContact: '+63-920-555-0126',
        status: 'SUBMITTED',
        amountDue: 500.00,
        pickupRequired: true,
        pickupStatus: 'NOT_READY',
        createdAt: today,
        remarks: 'Pending initial review'
      },
      {
        registrationType: 'REGULAR',
        submittedBy: citizen.id,
        informantName: 'Sample Informant 2',
        informantRelationship: 'Relative',
        informantContact: '+63-921-555-0127',
        status: 'SUBMITTED',
        amountDue: 500.00,
        pickupRequired: true,
        pickupStatus: 'NOT_READY',
        createdAt: today,
        remarks: 'Awaiting document verification'
      },
      {
        registrationType: 'DELAYED',
        submittedBy: citizen.id,
        informantName: 'Sample Informant 3',
        informantRelationship: 'Relative',
        informantContact: '+63-922-555-0128',
        status: 'PROCESSING',
        amountDue: 1000.00,
        pickupRequired: true,
        pickupStatus: 'NOT_READY',
        createdAt: yesterday,
        remarks: 'Delayed registration under review'
      },
      {
        registrationType: 'REGULAR',
        submittedBy: citizen.id,
        informantName: 'Sample Informant 4',
        informantRelationship: 'Relative',
        informantContact: '+63-923-555-0129',
        status: 'REGISTERED',
        amountDue: 500.00,
        pickupRequired: false,
        pickupStatus: 'CLAIMED',
        registeredAt: today,
        registeredBy: employee.id,
        createdAt: lastWeek,
        remarks: 'Completed - certificate issued'
      },
      {
        registrationType: 'REGULAR',
        submittedBy: citizen.id,
        informantName: 'Sample Informant 5',
        informantRelationship: 'Relative',
        informantContact: '+63-924-555-0130',
        status: 'FOR_PICKUP',
        amountDue: 500.00,
        pickupRequired: true,
        pickupStatus: 'READY_FOR_PICKUP',
        registeredAt: yesterday,
        registeredBy: employee.id,
        createdAt: lastWeek,
        remarks: 'Ready for pickup - certificate available'
      },
      // Registrations that might need admin override
      {
        registrationType: 'REGULAR',
        submittedBy: citizen.id,
        informantName: 'Emergency Contact',
        informantRelationship: 'Friend',
        informantContact: '+63-925-555-0131',
        status: 'REJECTED',
        amountDue: 500.00,
        pickupRequired: true,
        pickupStatus: 'NOT_READY',
        createdAt: lastWeek,
        remarks: 'Rejected due to incomplete documentation - may need admin override'
      },
      {
        registrationType: 'DELAYED',
        submittedBy: citizen.id,
        informantName: 'Legal Representative',
        informantRelationship: 'Attorney',
        informantContact: '+63-926-555-0132',
        status: 'RETURNED',
        amountDue: 1000.00,
        pickupRequired: true,
        pickupStatus: 'NOT_READY',
        createdAt: lastWeek,
        remarks: 'Returned for corrections - complex case requiring admin review'
      },
      {
        registrationType: 'REGULAR',
        submittedBy: citizen.id,
        informantName: 'Family Member',
        informantRelationship: 'Sibling',
        informantContact: '+63-927-555-0133',
        status: 'PENDING_VERIFICATION',
        amountDue: 500.00,
        pickupRequired: true,
        pickupStatus: 'NOT_READY',
        createdAt: yesterday,
        remarks: 'Pending verification - awaiting hospital records confirmation'
      },
      {
        registrationType: 'REGULAR',
        submittedBy: citizen.id,
        informantName: 'Emergency Services',
        informantRelationship: 'Government Agency',
        informantContact: '+63-928-555-0134',
        status: 'SUBMITTED',
        amountDue: 0.00, // Fee waiver candidate
        pickupRequired: true,
        pickupStatus: 'NOT_READY',
        createdAt: today,
        remarks: 'Emergency case - potential fee waiver required'
      }
    ];

    for (const registration of deathRegistrations) {
      await prisma.deathRegistration.create({
        data: registration,
      });
    }

    // Create sample permits
    console.log('🏛️  Creating sample permits...');
    
    const permits = [
      {
        permitType: 'BURIAL',
        status: 'SUBMITTED',
        amountDue: 500.00,
        deathId: deceasedRecords[0].id,
        citizenUserId: citizen.id,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        remarks: 'Standard burial permit application'
      },
      {
        permitType: 'BURIAL',
        status: 'PENDING_VERIFICATION',
        amountDue: 500.00,
        orNumber: 'OR-2024-001234',
        deathId: deceasedRecords[1].id,
        citizenUserId: citizen.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        remarks: 'Payment received, pending document review'
      },
      {
        permitType: 'EXHUMATION',
        status: 'PAID',
        amountDue: 1000.00,
        orNumber: 'OR-2024-001235',
        deathId: deceasedRecords[2].id,
        citizenUserId: citizen.id,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        remarks: 'Approved with court order - family relocation'
      },
      {
        permitType: 'CREMATION',
        status: 'ISSUED',
        amountDue: 750.00,
        orNumber: 'OR-2024-001236',
        deathId: deceasedRecords[3].id,
        citizenUserId: citizen.id,
        issuedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        pickupStatus: 'READY_FOR_PICKUP',
        remarks: 'Permit issued - ready for crematorium processing'
      },
      {
        permitType: 'BURIAL',
        status: 'REJECTED',
        amountDue: 500.00,
        deathId: deceasedRecords[4].id,
        citizenUserId: citizen.id,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        remarks: 'Rejected - incomplete documentation, missing signatures'
      },
      {
        permitType: 'EXHUMATION',
        status: 'SUBMITTED',
        amountDue: 1000.00,
        deathId: deceasedRecords[0].id,
        citizenUserId: citizen.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        remarks: 'Awaiting court order for family dispute resolution'
      },
      {
        permitType: 'CREMATION',
        status: 'FOR_PICKUP',
        amountDue: 750.00,
        orNumber: 'OR-2024-001237',
        deathId: deceasedRecords[1].id,
        citizenUserId: citizen.id,
        issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        pickupStatus: 'READY_FOR_PICKUP',
        remarks: 'Permit ready for pickup at Civil Registry Office'
      },
      {
        permitType: 'BURIAL',
        status: 'CANCELLED',
        amountDue: 500.00,
        deathId: deceasedRecords[2].id,
        citizenUserId: citizen.id,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        remarks: 'Cancelled by family - opted for cremation instead'
      }
    ];

    for (const permit of permits) {
      await prisma.permitRequest.create({
        data: permit,
      });
    }

    console.log('🏛️  Creating sample certificate requests...');
    
    // Create sample certificate requests
    const certificateRequests = [
      {
        certRequestType: 'DEATH',
        deathId: createdDeceased[0].id, // John Doe
        requesterUserId: citizen.id,
        relationshipToDeceased: 'Son',
        purpose: 'Insurance claim',
        copies: 2,
        status: 'SUBMITTED',
        amountDue: 100.00,
        pickupStatus: 'NOT_READY',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        remarks: 'Initial request for death certificate'
      },
      {
        certRequestType: 'DEATH',
        deathId: createdDeceased[1].id, // Maria Clara
        requesterUserId: citizen.id,
        relationshipToDeceased: 'Husband',
        purpose: 'SSS benefits processing',
        copies: 1,
        status: 'PROCESSING',
        amountDue: 50.00,
        pickupStatus: 'NOT_READY',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        remarks: 'Under review by registry office'
      },
      {
        certRequestType: 'DEATH',
        deathId: createdDeceased[2].id, // Roberto Santos
        requesterUserId: citizen.id,
        relationshipToDeceased: 'Daughter',
        purpose: 'Legal proceedings',
        copies: 3,
        status: 'READY_FOR_PICKUP',
        amountDue: 150.00,
        paymentOrderNo: 'OR-2024-001301',
        pickupStatus: 'READY_FOR_PICKUP',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        remarks: 'Certificate ready for pickup at Civil Registry'
      },
      {
        certRequestType: 'BIRTH',
        requesterUserId: citizen.id,
        relationshipToDeceased: 'Self',
        purpose: 'Passport application',
        copies: 1,
        status: 'FOR_PAYMENT',
        amountDue: 30.00,
        pickupStatus: 'NOT_READY',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        remarks: 'Awaiting payment confirmation'
      },
      {
        certRequestType: 'DEATH',
        deathId: createdDeceased[3].id, // Ana Dela Cruz
        requesterUserId: citizen.id,
        relationshipToDeceased: 'Sister',
        purpose: 'Bank account closure',
        copies: 1,
        status: 'REJECTED',
        amountDue: 50.00,
        pickupStatus: 'NOT_READY',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        remarks: 'Insufficient documentation provided'
      },
      {
        certRequestType: 'MARRIAGE',
        requesterUserId: citizen.id,
        relationshipToDeceased: 'Self',
        purpose: 'Visa application',
        copies: 2,
        status: 'PAID',
        amountDue: 80.00,
        paymentOrderNo: 'OR-2024-001298',
        pickupStatus: 'NOT_READY',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        remarks: 'Payment confirmed, processing started'
      },
      {
        certRequestType: 'DEATH',
        deathId: createdDeceased[0].id, // John Doe (another request)
        requesterUserId: citizen.id,
        relationshipToDeceased: 'Wife',
        purpose: 'Property transfer',
        copies: 4,
        status: 'CLAIMED',
        amountDue: 200.00,
        paymentOrderNo: 'OR-2024-001295',
        pickupStatus: 'CLAIMED',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        remarks: 'Certificate successfully claimed'
      },
      {
        certRequestType: 'CNR',
        requesterUserId: citizen.id,
        relationshipToDeceased: 'Self',
        purpose: 'Employment verification',
        copies: 1,
        status: 'SUBMITTED',
        amountDue: 25.00,
        pickupStatus: 'NOT_READY',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        remarks: 'New request pending initial review'
      },
      {
        certRequestType: 'DEATH',
        deathId: createdDeceased[1].id, // Maria Clara (expedited)
        requesterUserId: citizen.id,
        relationshipToDeceased: 'Daughter',
        purpose: 'Emergency travel',
        copies: 1,
        status: 'PROCESSING',
        amountDue: 75.00, // Expedited fee
        pickupStatus: 'NOT_READY',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        remarks: 'Expedited processing requested'
      },
      {
        certRequestType: 'BIRTH',
        requesterUserId: citizen.id,
        relationshipToDeceased: 'Parent',
        purpose: 'School enrollment',
        copies: 2,
        status: 'READY_FOR_PICKUP',
        amountDue: 60.00,
        paymentOrderNo: 'OR-2024-001302',
        pickupStatus: 'READY_FOR_PICKUP',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        remarks: 'Birth certificate ready for collection'
      }
    ];

    for (const certificate of certificateRequests) {
      await prisma.certificateRequest.create({
        data: certificate,
      });
    }

    // Create audit log for seeding
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'DATABASE_SEEDED',
        moduleName: 'SYSTEM',
        details: 'Database seeded with initial data including permits and certificates',
      },
    });

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Created:');
    console.log(`👤 Users: ${await prisma.user.count()}`);
    console.log(`⚰️  Deceased Records: ${await prisma.deceasedRecord.count()}`);
    console.log(`📋 Death Registrations: ${await prisma.deathRegistration.count()}`);
    console.log(`🏛️  Permits: ${await prisma.permitRequest.count()}`);
    console.log(`📜 Certificate Requests: ${await prisma.certificateRequest.count()}`);
    console.log(`🏞️  Cemeteries: ${await prisma.cemetery.count()}`);
    console.log(`📍 Cemetery Sections: ${await prisma.cemeterySection.count()}`);
    console.log(`🏢 Cemetery Blocks: ${await prisma.cemeteryBlock.count()}`);
    console.log(`🗺️  Cemetery Plots: ${await prisma.cemeteryPlot.count()}`);
    console.log(`🪦 Gravestones: ${await prisma.gravestone.count()}`);
    console.log(`📝 Audit Logs: ${await prisma.auditLog.count()}`);
    
    // Show plot status breakdown
    const plotStatusCounts = await prisma.cemeteryPlot.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    console.log('\n�️  Cemetery Plot Status Breakdown:');
    plotStatusCounts.forEach(item => {
      console.log(`   ${item.status}: ${item._count.status}`);
    });
    
    console.log('\n🔐 Sample Login Credentials:');
    console.log('Admin: admin@cemetery.qc.gov.ph / admin123');
    console.log('Employee: employee@cemetery.qc.gov.ph / employee123');
    console.log('Citizen: citizen@example.com / citizen123');
    
    // Show permit status breakdown
    const permitStatusCounts = await prisma.permitRequest.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    console.log('\n🏛️  Permit Status Breakdown:');
    permitStatusCounts.forEach(item => {
      console.log(`   ${item.status}: ${item._count.status}`);
    });

    // Show certificate status breakdown
    const certificateStatusCounts = await prisma.certificateRequest.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    console.log('\n� Certificate Request Status Breakdown:');
    certificateStatusCounts.forEach(item => {
      console.log(`   ${item.status}: ${item._count.status}`);
    });

    console.log('\n�🔧 Admin Override Test Cases Available:');
    console.log('Death Registrations:');
    console.log('- Rejected registrations for approval override');
    console.log('- Returned registrations for status reset');
    console.log('- Pending registrations for expedited approval');
    console.log('- Zero-amount registrations for fee waiver testing');
    console.log('\nPermits:');
    console.log('- Rejected permit for admin approval');
    console.log('- Submitted permits for expedited processing');
    console.log('- Fee adjustment and waiver testing available');
    console.log('\nCertificate Requests:');
    console.log('- Rejected certificate request for admin approval');
    console.log('- Submitted requests for expedited processing');
    console.log('- Fee waiver and adjustment testing available');
    console.log('- Multiple certificate types for testing');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });