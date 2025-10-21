#!/bin/bash

# PAFM System - Digital Ocean Deployment Script
# This script automates the deployment process on your droplet

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       PAFM System - Digital Ocean Deployment              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo systemctl start docker
    sudo systemctl enable docker
    echo -e "${GREEN}✓ Docker installed${NC}"
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed!${NC}"
    echo "Please install Docker Compose manually"
    exit 1
fi

echo -e "${BLUE}📦 Pulling latest changes from Git...${NC}"
git pull origin master || echo -e "${YELLOW}⚠ Git pull skipped (not a git repo or no changes)${NC}"

echo ""
echo -e "${BLUE}🔧 Setting up environment variables...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ No .env file found. Creating from template...${NC}"
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -hex 32)
    NEXTAUTH_SECRET=$(openssl rand -hex 32)
    
    cat > .env << EOF
# Database
POSTGRES_USER=pafm_user
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=pafm_db

# JWT Secret
JWT_SECRET=${JWT_SECRET}

# NextAuth
NEXTAUTH_URL=http://$(curl -s ifconfig.me):3000
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Google OAuth (IMPORTANT: Replace with your own credentials!)
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE

# Service URLs (for frontend)
NEXT_PUBLIC_API_URL=http://$(curl -s ifconfig.me):3001
NEXT_PUBLIC_ASSET_API_URL=http://$(curl -s ifconfig.me):3003
NEXT_PUBLIC_FACILITY_API_URL=http://$(curl -s ifconfig.me):3005
NEXT_PUBLIC_PARKS_API_URL=http://$(curl -s ifconfig.me):3004
NEXT_PUBLIC_WATER_API_URL=http://$(curl -s ifconfig.me):3006
EOF
    
    echo -e "${GREEN}✓ Environment file created${NC}"
else
    echo -e "${GREEN}✓ Using existing .env file${NC}"
fi

echo ""
echo -e "${BLUE}🐳 Stopping existing containers...${NC}"
docker compose down

echo ""
echo -e "${BLUE}🏗️ Building Docker images...${NC}"
docker compose build --no-cache

echo ""
echo -e "${BLUE}🚀 Starting services...${NC}"
docker compose up -d

echo ""
echo -e "${BLUE}⏳ Waiting for services to be healthy (60s)...${NC}"
sleep 60

echo ""
echo -e "${BLUE}📊 Checking service status...${NC}"
docker compose ps

echo ""
echo -e "${YELLOW}🌱 Do you want to seed the database with demo data? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${BLUE}🌱 Seeding database...${NC}"
    docker compose run --rm db-seed || docker compose exec burial-cemetery npx prisma db seed
    
    echo ""
    echo -e "${GREEN}✓ Database seeded!${NC}"
    echo ""
    echo "📋 Default credentials:"
    echo "   Admin: admin@cemetery.qc.gov.ph / admin123"
    echo "   Employee: employee@cemetery.qc.gov.ph / employee123"
    echo "   Citizen: citizen@example.com / citizen123"
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Your application is now running at:"
echo "   Frontend: http://$(curl -s ifconfig.me):3000"
echo "   Burial API: http://$(curl -s ifconfig.me):3001/health"
echo "   Asset API: http://$(curl -s ifconfig.me):3003/health"
echo "   Facility API: http://$(curl -s ifconfig.me):3005/health"
echo ""
echo "📊 To view logs:"
echo "   docker compose logs -f [service-name]"
echo ""
echo "🔄 To restart a service:"
echo "   docker compose restart [service-name]"
echo ""
echo "🛑 To stop all services:"
echo "   docker compose down"
echo ""
echo "💡 Remember to:"
echo "   1. Configure your firewall to allow ports 3000-3006"
echo "   2. Set up SSL/HTTPS for production"
echo "   3. Change default passwords"
echo "   4. Set up automated backups"
echo ""
