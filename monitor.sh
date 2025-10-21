#!/bin/bash

# PAFM System - Monitoring Script
# This script helps you monitor the health and performance of your deployed system

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          PAFM System - Health Monitor                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local name=$1
    local url=$2
    
    if curl -sf "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name is healthy"
        return 0
    else
        echo -e "${RED}✗${NC} $name is NOT responding"
        return 1
    fi
}

echo "🔍 Checking Docker Services..."
echo "─────────────────────────────────────────────────"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running!${NC}"
    exit 1
fi

# Check container status
echo ""
echo "📦 Container Status:"
echo "─────────────────────────────────────────────────"
docker compose ps

echo ""
echo "🏥 Service Health Checks:"
echo "─────────────────────────────────────────────────"

# Check each service
check_service "Frontend" "http://localhost:3000/api/health"
check_service "Burial & Cemetery" "http://localhost:3001/health"
check_service "Asset Inventory" "http://localhost:3003/health"
check_service "Facility Management" "http://localhost:3005/health"
check_service "Parks & Recreation" "http://localhost:3004/health"
check_service "Water & Drainage" "http://localhost:3006/health"

echo ""
echo "💾 Resource Usage:"
echo "─────────────────────────────────────────────────"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "📊 Disk Usage:"
echo "─────────────────────────────────────────────────"
docker system df

echo ""
echo "🔌 Network Connectivity:"
echo "─────────────────────────────────────────────────"
docker network inspect pafm-network --format '{{range .Containers}}{{.Name}} - {{.IPv4Address}}{{"\n"}}{{end}}'

echo ""
echo "📝 Recent Logs (Last 5 lines per service):"
echo "─────────────────────────────────────────────────"
for service in frontend burial-cemetery asset-inventory facility-management parks-recreation water-drainage; do
    echo ""
    echo "▸ $service:"
    docker compose logs --tail=5 $service 2>/dev/null | tail -5
done

echo ""
echo "✅ Monitoring complete!"
echo ""
echo "💡 Useful commands:"
echo "   • Watch logs:       docker compose logs -f"
echo "   • Restart service:  docker compose restart [service]"
echo "   • Check status:     docker compose ps"
echo "   • View resources:   docker stats"
echo ""
