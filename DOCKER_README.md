# PAFM System - Docker Setup

This guide explains how to run the entire PAFM (Public Asset and Facility Management) system using Docker containers.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 20GB free disk space

## Quick Start (Local Development)

### Windows
```bash
.\start.bat
```

### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

## Manual Setup

### 1. Create Environment File

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and update the following variables:
- `POSTGRES_PASSWORD` - Strong database password
- `JWT_SECRET` - Random secret for JWT tokens
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `NEXTAUTH_URL` - Your application URL

Generate secrets:
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

### 2. Build and Start Services

**For local development:**
```bash
docker compose up -d
```

**For production:**
```bash
docker compose -f docker-compose.prod.yml up -d
```

### 3. Check Service Status

```bash
docker compose ps
```

All services should show "running" status.

### 4. View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f frontend
```

## Services

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Burial & Cemetery | 3001 | http://localhost:3001/health |
| Asset Inventory | 3003 | http://localhost:3003/health |
| Facility Management | 3005 | http://localhost:3005/health |
| Parks & Recreation | 3004 | http://localhost:3004/health |
| Water & Drainage | 3006 | http://localhost:3006/health |
| PostgreSQL | 5432 | Internal only |

## Common Commands

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### Restart Services
```bash
docker compose restart
```

### Rebuild Services
```bash
docker compose build --no-cache
docker compose up -d
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f burial-cemetery

# Last 100 lines
docker compose logs --tail=100
```

### Check Resource Usage
```bash
docker stats
```

### Access Database
```bash
docker compose exec postgres psql -U pafm_user -d pafm_db
```

### Run Migrations
```bash
# Burial Cemetery
docker compose exec burial-cemetery npx prisma migrate deploy

# Asset Inventory
docker compose exec asset-inventory npx prisma migrate deploy

# Facility Management
docker compose exec facility-management npx prisma migrate deploy
```

## Database Backup & Restore

### Backup
```bash
# Create backup
docker compose exec postgres pg_dump -U pafm_user pafm_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Or with gzip compression
docker compose exec postgres pg_dump -U pafm_user pafm_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore
```bash
# From SQL file
docker compose exec -T postgres psql -U pafm_user -d pafm_db < backup.sql

# From compressed file
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U pafm_user -d pafm_db
```

## Troubleshooting

### Services Won't Start

Check if ports are already in use:
```bash
# Windows
netstat -ano | findstr "3000 3001 3003 3004 3005 3006 5432"

# Linux/Mac
lsof -i :3000 -i :3001 -i :3003 -i :3004 -i :3005 -i :3006 -i :5432
```

### Out of Memory

Check memory usage:
```bash
docker stats
```

If services are using too much memory, restart them:
```bash
docker compose restart
```

### Database Connection Errors

1. Check if PostgreSQL is running:
```bash
docker compose ps postgres
```

2. Check PostgreSQL logs:
```bash
docker compose logs postgres
```

3. Verify DATABASE_URL:
```bash
docker compose exec burial-cemetery env | grep DATABASE_URL
```

### Cannot Access Application

1. Check if all services are running:
```bash
docker compose ps
```

2. Check service logs for errors:
```bash
docker compose logs frontend
```

3. Test service health endpoints:
```bash
curl http://localhost:3001/health
curl http://localhost:3003/health
curl http://localhost:3005/health
```

### Build Errors

Clean rebuild:
```bash
docker compose down -v
docker system prune -a
docker compose build --no-cache
docker compose up -d
```

## Development vs Production

### Development Mode
- Uses `docker-compose.yml`
- Hot reload enabled
- Debug logging
- Development dependencies included

### Production Mode
- Uses `docker-compose.prod.yml`
- Optimized builds
- Memory limits set
- Production dependencies only
- Health checks enabled
- Automatic restart on failure

## Resource Limits (Production)

For 4GB RAM deployment:
- PostgreSQL: 512MB limit
- Frontend: 768MB limit
- Each Backend Service: 384MB limit

Total: ~3.5GB (with 500MB buffer)

## Monitoring

### Check Container Health
```bash
docker compose ps
```

### View Resource Usage
```bash
docker stats --no-stream
```

### Check Disk Usage
```bash
docker system df
```

### Cleanup Unused Resources
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (be careful!)
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

## Security Best Practices

1. ✅ Use strong passwords for database
2. ✅ Use random secrets for JWT and NextAuth
3. ✅ Don't commit `.env.production` to git
4. ✅ Use SSL/TLS in production
5. ✅ Keep Docker images updated
6. ✅ Limit container resources
7. ✅ Use non-root users in containers
8. ✅ Regular database backups
9. ✅ Monitor logs for suspicious activity
10. ✅ Set up firewall rules

## Support

For deployment issues:
1. Check service logs: `docker compose logs -f`
2. Verify environment variables: `docker compose config`
3. Check container health: `docker compose ps`
4. Review system resources: `docker stats`

## License

MIT License - See LICENSE file for details
