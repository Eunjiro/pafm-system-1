# Facility Management Service - Quick Setup Guide

## 🚀 Getting Started on a New Device

Follow these steps to set up the Facility Management service from scratch:

### Step 1: Navigate to Service Directory
```bash
cd services/facility-management
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Database

1. Make sure PostgreSQL is running on your device
2. Create a new database:
```sql
CREATE DATABASE facility_management;
```

3. Copy the environment file and update credentials:
```bash
cp .env.example .env
```

4. Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/facility_management"
PORT=3004
NODE_ENV=development
JWT_SECRET=your-secret-key-here-change-in-production
```

### Step 4: Apply Database Schema
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations (creates all tables)
npx prisma migrate dev
```

### Step 5: Seed Sample Data
```bash
npm run seed
```

This will create:
- ✅ 3 user accounts (1 admin, 2 staff)
- ✅ 5 facilities
- ✅ 4 sample facility requests
- ✅ 2 blackout dates
- ✅ 1 inspection record

### Step 6: Start the Service
```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

### Step 7: Verify Setup

1. **Health Check**
```bash
curl http://localhost:3004/health
```

Expected response:
```json
{
  "status": "OK",
  "service": "Facility Management Service",
  "timestamp": "2025-10-21T..."
}
```

2. **Test Login**
```bash
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@facility.gov","password":"admin123"}'
```

You should receive a JWT token in the response.

3. **View Database** (Optional)
```bash
npx prisma studio
```

This opens a browser-based database viewer at `http://localhost:5555`

---

## 📋 Default Login Credentials

After seeding, you can login with:

| Email | Password | Role |
|-------|----------|------|
| admin@facility.gov | admin123 | ADMIN |
| staff1@facility.gov | admin123 | STAFF |
| staff2@facility.gov | admin123 | STAFF |

⚠️ **Important**: Change these passwords in production!

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"
**Solution**: 
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Test connection: `psql -U postgres -d facility_management`

### Issue: "Prisma Client not generated"
**Solution**:
```bash
npx prisma generate
```

### Issue: "Migration failed"
**Solution**:
```bash
# Reset and start fresh
npx prisma migrate reset
npx prisma migrate dev
npm run seed
```

### Issue: "Port 3004 already in use"
**Solution**:
- Change PORT in `.env` to another port (e.g., 3014)
- Or kill the process using port 3004

### Issue: "JWT_SECRET not found"
**Solution**:
- Make sure `.env` file exists
- Check JWT_SECRET is set in `.env`

---

## 📂 Directory Structure

```
facility-management/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.js            # Seed data
│   └── migrations/        # Migration files
├── src/
│   ├── server.js          # Main server file
│   ├── database/
│   │   └── db.js          # Database utilities
│   ├── middleware/
│   │   ├── auth.js        # Authentication
│   │   └── upload.js      # File upload
│   └── routes/
│       ├── auth.js        # Auth endpoints
│       ├── citizen.js     # Citizen endpoints
│       ├── staff.js       # Staff endpoints
│       └── admin.js       # Admin endpoints
├── uploads/               # File storage (auto-created)
├── .env                   # Environment config
├── package.json
└── README.md
```

---

## 🧪 Testing the API

### 1. Get All Facilities (Public)
```bash
curl http://localhost:3004/api/citizen/facilities
```

### 2. Login as Staff
```bash
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff1@facility.gov","password":"admin123"}'
```

Save the token from response.

### 3. Get Staff Dashboard (Requires Auth)
```bash
curl http://localhost:3004/api/staff/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Get Admin Dashboard (Requires Admin)
```bash
curl http://localhost:3004/api/admin/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

---

## 📚 Next Steps

1. **Explore the API**: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. **Integrate with Frontend**: Connect Next.js app to this service
3. **Customize**: Add/modify facilities, adjust pricing, etc.
4. **Deploy**: Set up for production with proper security

---

## 🔄 Common Commands

```bash
# Install dependencies
npm install

# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed database
npm run seed

# Start development server
npm run dev

# Start production server
npm start

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Format Prisma schema
npx prisma format
```

---

## 🌐 Service Endpoints Summary

- **Base URL**: `http://localhost:3004`
- **Health**: `/health`
- **Auth**: `/api/auth/*`
- **Citizen**: `/api/citizen/*` (public)
- **Staff**: `/api/staff/*` (auth required)
- **Admin**: `/api/admin/*` (admin only)

---

## ✅ Setup Checklist

- [ ] PostgreSQL installed and running
- [ ] Node.js v16+ installed
- [ ] Navigated to `services/facility-management`
- [ ] Ran `npm install`
- [ ] Created `.env` file with correct DATABASE_URL
- [ ] Ran `npx prisma generate`
- [ ] Ran `npx prisma migrate dev`
- [ ] Ran `npm run seed`
- [ ] Started service with `npm run dev`
- [ ] Verified health check works
- [ ] Tested login endpoint
- [ ] Ready to develop! 🎉

---

Need help? Check the main [README.md](README.md) or [API_DOCUMENTATION.md](API_DOCUMENTATION.md).
