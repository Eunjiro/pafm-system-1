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

    // Create sample cemetery plots
    const plots = [];
    for (let section = 1; section <= 5; section++) {
      for (let block = 1; block <= 10; block++) {
        for (let lot = 1; lot <= 20; lot++) {
          plots.push({
            cemeteryName: 'Quezon City Public Cemetery',
            section: `Section ${section}`,
            block: `Block ${block}`,
            lot: `Lot ${lot}`,
            plotCode: `SEC${section}-BLK${block}-LOT${lot.toString().padStart(2, '0')}`,
            size: lot % 3 === 0 ? 'Family' : lot % 2 === 0 ? 'Adult' : 'Child',
            latitude: 14.6760 + (Math.random() - 0.5) * 0.01, // Random coords around Quezon City
            longitude: 121.0437 + (Math.random() - 0.5) * 0.01,
            status: Math.random() > 0.7 ? 'OCCUPIED' : 'VACANT',
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
      }
    ];

    for (const registration of deathRegistrations) {
      await prisma.deathRegistration.create({
        data: registration,
      });
    }

    // Create audit log for seeding
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'DATABASE_SEEDED',
        moduleName: 'SYSTEM',
        details: 'Database seeded with initial data',
      },
    });

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Created:');
    console.log(`👤 Users: ${await prisma.user.count()}`);
    console.log(`⚰️  Deceased Records: ${await prisma.deceasedRecord.count()}`);
    console.log(`📋 Death Registrations: ${await prisma.deathRegistration.count()}`);
    console.log(`🏞️  Cemetery Plots: ${await prisma.cemeteryPlot.count()}`);
    console.log('\n🔐 Sample Login Credentials:');
    console.log('Admin: admin@cemetery.qc.gov.ph / admin123');
    console.log('Employee: employee@cemetery.qc.gov.ph / employee123');
    console.log('Citizen: citizen@example.com / citizen123');

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