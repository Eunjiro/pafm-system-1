# PAFM System - Digital Ocean Deployment Guide

## System Requirements
- Digital Ocean Droplet: Basic Plan, 4 GiB RAM, 2 CPUs, 80 GiB SSD ($24/mo)
- Docker & Docker Compose installed
- Domain name (optional but recommended)

## Pre-Deployment Checklist

### 1. Generate Secrets
Generate strong random secrets for production:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate POSTGRES_PASSWORD
openssl rand -base64 32
```

### 2. Create Production Environment File
```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with your secrets
nano .env.production
```

Update these critical values in `.env.production`:
- `POSTGRES_PASSWORD` - Use generated password
- `JWT_SECRET` - Use generated secret
- `NEXTAUTH_SECRET` - Use generated secret
- `NEXTAUTH_URL` - Your droplet IP or domain (e.g., http://143.198.123.45:3000)
- `DATABASE_URL` - Update with your postgres password

## Deployment Steps

### Step 1: Set Up Digital Ocean Droplet

1. **Create Droplet**
   - Choose Ubuntu 22.04 LTS
   - Select Basic plan: 4GB RAM, 2 CPUs, 80GB SSD
   - Choose datacenter region closest to your users
   - Add SSH key for secure access

2. **Connect to Droplet**
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Update System**
   ```bash
   apt update && apt upgrade -y
   ```

### Step 2: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version
```

### Step 3: Set Up Application

1. **Clone or Upload Your Repository**
   ```bash
   # Option A: Clone from GitHub
   git clone https://github.com/Eunjiro/pafm-system-1.git
   cd pafm-system-1

   # Option B: Upload via SCP (from your local machine)
   scp -r ./pafm-system-1 root@your_droplet_ip:/root/
   ```

2. **Create Production Environment File**
   ```bash
   cd /root/pafm-system-1
   cp .env.production.example .env.production
   nano .env.production
   ```
   
   Update all the secrets and URLs as mentioned above.

3. **Create Uploads Directories (if needed)**
   ```bash
   mkdir -p services/burial-cemetery/uploads/{documents,permits}
   mkdir -p services/facility-management/uploads/permits
   ```

### Step 4: Build and Start Services

1. **Build Docker Images**
   ```bash
   docker compose build
   ```
   
   This will take 5-10 minutes depending on your connection.

2. **Start All Services**
   ```bash
   docker compose up -d
   ```

3. **Check Service Status**
   ```bash
   docker compose ps
   ```
   
   All services should show "running" status.

4. **View Logs**
   ```bash
   # All services
   docker compose logs -f

   # Specific service
   docker compose logs -f frontend
   docker compose logs -f burial-cemetery
   docker compose logs -f postgres
   ```

### Step 5: Initialize Database

The database will be automatically initialized with migrations when each service starts.

To manually run migrations if needed:
```bash
# Burial Cemetery Service
docker compose exec burial-cemetery npx prisma migrate deploy

# Asset Inventory Service
docker compose exec asset-inventory npx prisma migrate deploy

# Facility Management Service
docker compose exec facility-management npx prisma migrate deploy
```

### Step 6: Create Admin User

```bash
# Access the burial-cemetery container
docker compose exec burial-cemetery node create-admin.js
```

Or create manually via the database:
```bash
docker compose exec postgres psql -U pafm_user -d pafm_db
```

### Step 7: Configure Firewall

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP (port 3000 for frontend)
ufw allow 3000/tcp

# If using custom domain with Nginx (port 80/443)
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

### Step 8: Set Up Domain (Optional)

If you have a domain name:

1. **Point Domain to Droplet**
   - Add A record: `@` → `your_droplet_ip`
   - Add A record: `www` → `your_droplet_ip`

2. **Install Nginx as Reverse Proxy**
   ```bash
   apt install nginx -y
   ```

3. **Configure Nginx**
   ```bash
   nano /etc/nginx/sites-available/pafm
   ```
   
   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com www.your_domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Enable Site**
   ```bash
   ln -s /etc/nginx/sites-available/pafm /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

5. **Install SSL Certificate (Let's Encrypt)**
   ```bash
   apt install certbot python3-certbot-nginx -y
   certbot --nginx -d your_domain.com -d www.your_domain.com
   ```

## Monitoring & Maintenance

### Check Service Health
```bash
# View all containers
docker compose ps

# Check resource usage
docker stats

# Check logs
docker compose logs -f
```

### Restart Services
```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart frontend
docker compose restart burial-cemetery
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d
```

### Backup Database
```bash
# Create backup
docker compose exec postgres pg_dump -U pafm_user pafm_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker compose exec -T postgres psql -U pafm_user -d pafm_db < backup_file.sql
```

### Clean Up Docker Resources
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup (be careful!)
docker system prune -a
```

## Performance Optimization

### For 4GB RAM Setup

1. **Limit Container Memory**
   Add to `docker-compose.yml` under each service:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
   ```

2. **Optimize PostgreSQL**
   Add to docker-compose.yml postgres service:
   ```yaml
   command:
     - postgres
     - -c
     - max_connections=100
     - -c
     - shared_buffers=256MB
     - -c
     - effective_cache_size=1GB
     - -c
     - work_mem=4MB
   ```

3. **Enable Swap**
   ```bash
   fallocate -l 2G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   echo '/swapfile none swap sw 0 0' >> /etc/fstab
   ```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker compose logs service_name

# Check if port is in use
netstat -tuln | grep PORT_NUMBER

# Rebuild specific service
docker compose build --no-cache service_name
docker compose up -d service_name
```

### Out of Memory
```bash
# Check memory usage
free -h
docker stats

# Restart services to free memory
docker compose restart
```

### Database Connection Issues
```bash
# Check if postgres is running
docker compose ps postgres

# Check postgres logs
docker compose logs postgres

# Verify DATABASE_URL is correct
docker compose exec burial-cemetery env | grep DATABASE_URL
```

### Cannot Access Application
```bash
# Check if services are running
docker compose ps

# Check firewall
ufw status

# Check nginx (if using)
systemctl status nginx
nginx -t
```

## Important URLs

After deployment, access your application at:
- **Frontend**: http://your_droplet_ip:3000
- **Burial & Cemetery API**: http://your_droplet_ip:3001/health
- **Asset Inventory API**: http://your_droplet_ip:3003/health
- **Facility Management API**: http://your_droplet_ip:3005/health

## Security Recommendations

1. **Change all default passwords and secrets**
2. **Use environment variables for sensitive data**
3. **Set up automatic security updates**
   ```bash
   apt install unattended-upgrades
   dpkg-reconfigure --priority=low unattended-upgrades
   ```
4. **Regular backups** (set up cron job)
5. **Monitor logs** for suspicious activity
6. **Use SSL certificate** (Let's Encrypt)
7. **Keep Docker images updated**
   ```bash
   docker compose pull
   docker compose up -d
   ```

## Demo Preparation Checklist

- [ ] All services running and healthy
- [ ] Database populated with sample data
- [ ] Admin user created and tested
- [ ] All main features tested
- [ ] Backup created
- [ ] Logs cleared of sensitive information
- [ ] System resources monitored (RAM, CPU, Disk)
- [ ] Domain name configured (if applicable)
- [ ] SSL certificate installed (if applicable)
- [ ] Presentation materials ready

## Support

For issues during deployment:
1. Check logs: `docker compose logs -f`
2. Verify environment variables: `docker compose config`
3. Check system resources: `docker stats` and `free -h`
4. Review error messages in service logs

## Quick Commands Reference

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart all services
docker compose restart

# View logs
docker compose logs -f

# Check status
docker compose ps

# Update and restart
git pull && docker compose down && docker compose build && docker compose up -d

# Backup database
docker compose exec postgres pg_dump -U pafm_user pafm_db > backup.sql

# Access database
docker compose exec postgres psql -U pafm_user -d pafm_db

# Check resource usage
docker stats
```

Good luck with your capstone demo! 🚀
