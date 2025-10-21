#!/bin/bash

# PAFM System - Database Seeding Script for Docker
# This script seeds all services with initial data

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          PAFM System - Database Seeding                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌱 Starting database seeding...${NC}"
echo ""

# Seed Burial Cemetery Service
echo -e "${YELLOW}📦 Seeding Burial & Cemetery Service...${NC}"
if docker compose exec -T burial-cemetery npx prisma db seed 2>/dev/null; then
    echo -e "${GREEN}✓ Burial & Cemetery seeded successfully${NC}"
else
    echo -e "${YELLOW}⚠ Burial & Cemetery seed script not found or failed${NC}"
    echo "   Creating admin user instead..."
    docker compose exec -T burial-cemetery node -e "
        const { PrismaClient } = require('@prisma/client');
        const bcrypt = require('bcryptjs');
        const prisma = new PrismaClient();
        
        async function createAdmin() {
            try {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const admin = await prisma.user.upsert({
                    where: { email: 'admin@pafm.gov.ph' },
                    update: {},
                    create: {
                        email: 'admin@pafm.gov.ph',
                        passwordHash: hashedPassword,
                        role: 'ADMIN',
                        fullNameFirst: 'System',
                        fullNameLast: 'Administrator',
                        contactNo: '09171234567',
                        isActive: true
                    }
                });
                console.log('Admin user created:', admin.email);
                
                const citizen = await prisma.user.upsert({
                    where: { email: 'citizen@example.com' },
                    update: {},
                    create: {
                        email: 'citizen@example.com',
                        passwordHash: hashedPassword,
                        role: 'CITIZEN',
                        fullNameFirst: 'Juan',
                        fullNameLast: 'Dela Cruz',
                        contactNo: '09181234567',
                        isActive: true
                    }
                });
                console.log('Citizen user created:', citizen.email);
                
                await prisma.\$disconnect();
            } catch (error) {
                console.error('Error creating users:', error);
                process.exit(1);
            }
        }
        
        createAdmin();
    " && echo -e "${GREEN}✓ Admin and demo users created${NC}"
fi

echo ""

# Seed Asset Inventory Service
echo -e "${YELLOW}📦 Seeding Asset Inventory Service...${NC}"
if docker compose exec -T asset-inventory npx prisma db seed 2>/dev/null; then
    echo -e "${GREEN}✓ Asset Inventory seeded successfully${NC}"
else
    echo -e "${YELLOW}⚠ Asset Inventory seed script not found${NC}"
fi

echo ""

# Seed Facility Management Service
echo -e "${YELLOW}📦 Seeding Facility Management Service...${NC}"
if docker compose exec -T facility-management npx prisma db seed 2>/dev/null; then
    echo -e "${GREEN}✓ Facility Management seeded successfully${NC}"
else
    echo -e "${YELLOW}⚠ Facility Management seed script not found${NC}"
fi

echo ""
echo -e "${GREEN}✅ Seeding complete!${NC}"
echo ""
echo "📋 Default credentials:"
echo "   Admin:"
echo "     Email: admin@pafm.gov.ph"
echo "     Password: admin123"
echo ""
echo "   Citizen:"
echo "     Email: citizen@example.com"
echo "     Password: admin123"
echo ""
echo "💡 Remember to change these passwords in production!"
echo ""
