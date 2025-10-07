# Cemetery & Burial Management System

This is a capstone project Public assets and facilities management 1st service currently in development.

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd pafm-system-1

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../services/burial-cemetery
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb cemetery_management

# Copy environment files
cp .env.example .env
cp ../../frontend/.env.local.example ../../frontend/.env.local

# Edit .env files gamit yung database credentials niyo
# Backend: services/burial-cemetery/.env
# Frontend: frontend/.env.local
```

### 3. Initialize Database
```bash
# In services/burial-cemetery directory
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start Services
```bash
# Terminal 1: Start backend (from services/burial-cemetery)
npm run dev

# Terminal 2: Start frontend (from frontend)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Sample Login Credentials

After running the seed script, you can use these credentials:

- **Admin**: admin@cemetery.qc.gov.ph / admin123
- **Employee**: employee@cemetery.qc.gov.ph / employee123
- **Citizen**: citizen@example.com / citizen123

## System Features

### Authentication & Authorization
- NextAuth.js with multiple providers (Google, Facebook, Credentials)
- Role-based access control (Admin, Employee, Citizen)
- JWT token-based authentication
- Social login integration
- Protected routes with middleware

### User Management
- User registration and login
- Role-based dashboards
- Profile management
- User activity tracking

### Death Registration (In Development)
- Regular death registration
- Delayed death registration
- Document upload and verification
- Payment processing
- Status tracking

### Permit Management (In Development)
- Burial permits
- Cremation permits
- Exhumation permits
- Document requirements validation
- Fee calculation

### Certificate Issuance (In Development)
- Death certificate requests
- Online processing
- Pickup scheduling
- Digital verification

### Cemetery Management (In Development)
- Plot mapping and assignment
- Interactive cemetery map
- AI-powered plot search
- Availability tracking

## Architecture

### Frontend (Next.js)
```
frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── admin/              # Admin dashboard
│   │   ├── employee/           # Employee dashboard
│   │   ├── citizen/            # Citizen portal
│   │   ├── auth/               # Authentication pages
│   │   └── api/auth/           # NextAuth configuration
│   ├── components/             # Reusable components
│   │   └── providers/          # Context providers
│   └── middleware.ts           # Route protection
```

### Backend (Node.js/Express)
```
services/burial-cemetery/
├── src/
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Auth & error handling
│   ├── database/               # Database utilities
│   └── server.js               # Main server file
├── prisma/
│   └── schema.prisma           # Database schema
```

## Development

### Adding New Features
1. Create database models in `prisma/schema.prisma`
2. Run `npx prisma migrate dev` to apply changes
3. Implement API endpoints in `src/routes/`
4. Add frontend pages and components
5. Update middleware for route protection

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://username:password@localhost:5432/cemetery_management"
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env.local)**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
BACKEND_URL=http://localhost:3001
```

### Database Commands
```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name migration_name

# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset

# Seed database
npm run db:seed
```
## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Security headers with Helmet
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

**Note**: This system is currently in development. Some features are not yet implemented but the foundation is established for future development.