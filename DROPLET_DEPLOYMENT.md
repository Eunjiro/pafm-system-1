# Digital Ocean Deployment - Quick Reference

## 🚀 Initial Deployment

### 1. Create Droplet
- Ubuntu 22.04 LTS
- 4GB RAM / 2 CPUs (minimum)
- Choose datacenter region
- Add SSH key

### 2. Connect to Droplet
```bash
ssh root@YOUR_DROPLET_IP
```

### 3. Upload Your Code
**Option A: Using Git (Recommended)**
```bash
git clone https://github.com/YOUR_USERNAME/pafm-system-1.git
cd pafm-system-1
```

**Option B: Using SCP from your local machine**
```bash
scp -r ./pafm-system-1 root@YOUR_DROPLET_IP:/root/
```

### 4. Run Deployment Script
```bash
chmod +x deploy-droplet.sh
./deploy-droplet.sh
```

The script will:
- ✅ Install Docker if needed
- ✅ Create environment variables
- ✅ Build all containers
- ✅ Start services
- ✅ Prompt you to seed database

---

## 🌱 Seeding Database

### Method 1: During Deployment
The `deploy-droplet.sh` script will ask if you want to seed.

### Method 2: After Deployment
```bash
./seed-docker.sh
```

### Method 3: Manual Seed
```bash
# Using the seed profile
docker compose run --rm db-seed

# Or directly
docker compose exec burial-cemetery npx prisma db seed
```

---

## 📊 Common Commands

### Check Service Status
```bash
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f burial-cemetery
docker compose logs -f frontend
```

### Restart Services
```bash
# All services
docker compose restart

# Specific service
docker compose restart burial-cemetery
```

### Stop Everything
```bash
docker compose down
```

### Rebuild and Restart
```bash
docker compose down
docker compose up -d --build
```

### Check Database Users
```bash
docker compose exec postgres psql -U pafm_user -d pafm_db -c "SELECT id, email, role FROM users;"
```

---

## 🔥 Firewall Setup

### Allow Required Ports
```bash
# Frontend
ufw allow 3000/tcp

# Backend Services (if accessed externally)
ufw allow 3001/tcp  # Burial Cemetery
ufw allow 3003/tcp  # Asset Inventory
ufw allow 3005/tcp  # Facility Management
ufw allow 3004/tcp  # Parks & Recreation
ufw allow 3006/tcp  # Water & Drainage

# SSH (important!)
ufw allow 22/tcp

# Enable firewall
ufw enable
```

---

## 🔒 Security Best Practices

1. **Change Default Passwords**
   - Login and change admin, employee, citizen passwords
   - Update database password in `.env`

2. **Set up SSL/HTTPS**
   ```bash
   # Install Nginx
   apt install nginx
   
   # Install Certbot for SSL
   apt install certbot python3-certbot-nginx
   
   # Get SSL certificate
   certbot --nginx -d yourdomain.com
   ```

3. **Regular Backups**
   ```bash
   # Backup database
   docker compose exec postgres pg_dump -U pafm_user pafm_db > backup_$(date +%Y%m%d).sql
   
   # Restore database
   docker compose exec -T postgres psql -U pafm_user pafm_db < backup_20250121.sql
   ```

---

## 🆘 Troubleshooting

### Service Won't Start
```bash
# Check logs
docker compose logs [service-name]

# Rebuild container
docker compose up -d --no-deps --build [service-name]
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Can't Login
```bash
# Check if users exist
docker compose exec postgres psql -U pafm_user -d pafm_db -c "SELECT * FROM users;"

# Re-seed database
./seed-docker.sh
```

### Out of Memory
```bash
# Check memory usage
docker stats

# Restart services one by one
docker compose restart postgres
docker compose restart burial-cemetery
# ... etc
```

---

## 📝 Default Credentials

After seeding, use these to login:

**Admin:**
- Email: `admin@cemetery.qc.gov.ph`
- Password: `admin123`

**Employee:**
- Email: `employee@cemetery.qc.gov.ph`
- Password: `employee123`

**Citizen:**
- Email: `citizen@example.com`
- Password: `citizen123`

⚠️ **CHANGE THESE IN PRODUCTION!**

---

## 🔄 Updating Your Application

```bash
# Pull latest changes
git pull origin master

# Rebuild and restart
docker compose down
docker compose up -d --build

# Check status
docker compose ps
```

---

## 💾 Database Management

### Access Database
```bash
docker compose exec postgres psql -U pafm_user -d pafm_db
```

### Create Backup
```bash
mkdir -p backups
docker compose exec postgres pg_dump -U pafm_user pafm_db | gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from Backup
```bash
gunzip -c backups/backup_20250121_120000.sql.gz | docker compose exec -T postgres psql -U pafm_user pafm_db
```

### Reset Database (⚠️ DANGER)
```bash
docker compose down -v  # Removes volumes (deletes data!)
docker compose up -d
./seed-docker.sh
```

---

## 📱 Accessing Your Application

**Local Access (on droplet):**
- http://localhost:3000

**External Access:**
- http://YOUR_DROPLET_IP:3000

**With Domain:**
- http://yourdomain.com (after Nginx setup)

---

## 📞 Support

If something goes wrong:

1. Check logs: `docker compose logs -f`
2. Check service status: `docker compose ps`
3. Restart services: `docker compose restart`
4. Check this guide's troubleshooting section
5. Check Digital Ocean droplet monitoring dashboard

---

## ✅ Pre-Demo Checklist

Before your capstone presentation:

- [ ] All services are running (`docker compose ps`)
- [ ] Can access frontend (http://YOUR_IP:3000)
- [ ] Can login with all user types (admin, employee, citizen)
- [ ] Database is seeded with demo data
- [ ] All health checks are passing
- [ ] Firewall is configured
- [ ] Screenshots/videos prepared as backup

---

Good luck with your demo! 🎉
