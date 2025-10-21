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

# Check if containers are running
if ! docker compose ps | grep -q "pafm-burial-cemetery.*Up"; then
    echo -e "${YELLOW}⚠ Burial-cemetery service is not running!${NC}"
    echo "Starting services first..."
    docker compose up -d
    echo "Waiting for services to be ready (30s)..."
    sleep 30
fi

# Seed using the profile service (preferred method)
echo -e "${YELLOW}📦 Seeding database...${NC}"
if docker compose run --rm db-seed 2>/dev/null; then
    echo -e "${GREEN}✓ Database seeded successfully using db-seed service${NC}"
else
    echo -e "${YELLOW}⚠ db-seed service not available, using direct method...${NC}"
    
    # Fallback: Seed directly through burial-cemetery service
    if docker compose exec -T burial-cemetery npx prisma db seed; then
        echo -e "${GREEN}✓ Database seeded successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Prisma seed failed, trying manual seed...${NC}"
        
        # Manual seed as last resort
        docker compose exec -T burial-cemetery node -e "
            const { PrismaClient } = require('@prisma/client');
            const bcrypt = require('bcryptjs');
            const prisma = new PrismaClient();
            
            async function seed() {
                try {
                    const hashedPassword = await bcrypt.hash('admin123', 10);
                    
                    const admin = await prisma.user.upsert({
                        where: { email: 'admin@cemetery.qc.gov.ph' },
                        update: {},
                        create: {
                            email: 'admin@cemetery.qc.gov.ph',
                            passwordHash: hashedPassword,
                            role: 'ADMIN',
                            fullNameFirst: 'System',
                            fullNameLast: 'Administrator',
                            contactNo: '09171234567',
                            isActive: true
                        }
                    });
                    console.log('✓ Admin created:', admin.email);
                    
                    const employee = await prisma.user.upsert({
                        where: { email: 'employee@cemetery.qc.gov.ph' },
                        update: {},
                        create: {
                            email: 'employee@cemetery.qc.gov.ph',
                            passwordHash: hashedPassword,
                            role: 'EMPLOYEE',
                            fullNameFirst: 'Test',
                            fullNameLast: 'Employee',
                            contactNo: '09181234567',
                            isActive: true
                        }
                    });
                    console.log('✓ Employee created:', employee.email);
                    
                    const citizen = await prisma.user.upsert({
                        where: { email: 'citizen@example.com' },
                        update: {},
                        create: {
                            email: 'citizen@example.com',
                            passwordHash: hashedPassword,
                            role: 'CITIZEN',
                            fullNameFirst: 'Juan',
                            fullNameLast: 'Dela Cruz',
                            contactNo: '09191234567',
                            isActive: true
                        }
                    });
                    console.log('✓ Citizen created:', citizen.email);
                    
                    await prisma.\$disconnect();
                } catch (error) {
                    console.error('Error:', error.message);
                    process.exit(1);
                }
            }
            
            seed();
        "
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Manual seed completed${NC}"
        else
            echo -e "${RED}❌ All seed methods failed${NC}"
            exit 1
        fi
    fi
fi

echo ""
echo -e "${GREEN}✅ Seeding complete!${NC}"
echo ""
echo "📋 Default credentials:"
echo "   Admin:"
echo "     Email: admin@cemetery.qc.gov.ph"
echo "     Password: admin123"
echo ""
echo "   Employee:"
echo "     Email: employee@cemetery.qc.gov.ph"
echo "     Password: employee123"
echo ""
echo "   Citizen:"
echo "     Email: citizen@example.com"
echo "     Password: citizen123"
echo ""
echo "💡 Remember to change these passwords in production!"
echo ""
