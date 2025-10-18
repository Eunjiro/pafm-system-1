const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
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
        contactNo: '+63-918-123-4567',
        isActive: true,
      },
    });

    console.log('✅ Admin user created:', {
      email: 'admin@cemetery.qc.gov.ph',
      password: 'admin123',
      role: 'ADMIN'
    });
    
    console.log('✅ Employee user created:', {
      email: 'employee@cemetery.qc.gov.ph', 
      password: 'employee123',
      role: 'EMPLOYEE'
    });
    
    console.log('✅ Citizen user created:', {
      email: 'citizen@example.com',
      password: 'citizen123', 
      role: 'CITIZEN'
    });

  } catch (error) {
    console.error('❌ Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();