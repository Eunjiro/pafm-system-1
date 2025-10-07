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
    ];

    for (const deceased of deceasedRecords) {
      await prisma.deceasedRecord.create({
        data: deceased,
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