#!/bin/bash

# PAFM System - Quick Start Script
# This script helps you quickly set up and run the entire system with Docker

set -e

echo "🚀 PAFM System - Docker Setup"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "📝 Creating .env.production file..."
    cp .env.production.example .env.production
    
    # Generate secrets
    JWT_SECRET=$(openssl rand -base64 32)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    
    # Update .env.production with generated secrets
    sed -i "s/CHANGE_THIS_STRONG_PASSWORD/${POSTGRES_PASSWORD}/g" .env.production
    sed -i "s/CHANGE_THIS_TO_A_VERY_STRONG_RANDOM_SECRET_KEY/${JWT_SECRET}/g" .env.production
    sed -i "s/CHANGE_THIS_TO_ANOTHER_STRONG_RANDOM_SECRET_KEY/${NEXTAUTH_SECRET}/g" .env.production
    sed -i "s|http://your-droplet-ip:3000|http://localhost:3000|g" .env.production
    
    echo "✅ Generated secure secrets"
else
    echo "✅ .env.production already exists"
fi

echo ""
echo "🏗️  Building Docker images..."
echo "   This may take 5-10 minutes on first run..."
docker compose build

echo ""
echo "🚀 Starting all services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ PAFM System is now running!"
echo ""
echo "📍 Access your application at:"
echo "   Frontend:              http://localhost:3000"
echo "   Burial & Cemetery:     http://localhost:3001/health"
echo "   Asset Inventory:       http://localhost:3003/health"
echo "   Facility Management:   http://localhost:3005/health"
echo "   Parks & Recreation:    http://localhost:3004/health"
echo "   Water & Drainage:      http://localhost:3006/health"
echo ""
echo "📝 Useful commands:"
echo "   View logs:        docker compose logs -f"
echo "   Stop services:    docker compose down"
echo "   Restart:          docker compose restart"
echo "   Check status:     docker compose ps"
echo ""
echo "🎉 Setup complete! Your system is ready for demo."
