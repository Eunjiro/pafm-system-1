# Facility Management Service

A comprehensive microservice for managing government-owned facilities, handling bookings, reservations, and usage analytics. Patterned after Quezon City MICE coordination practices (2024).

## 🏢 Features

### Citizen Portal
- Browse available facilities
- Check real-time availability
- Submit facility reservation requests
- Upload required documents
- Track request status
- Cancel pending requests
- View booking history

### Staff Portal
- Dashboard with pending requests overview
- Request intake and validation
- Schedule conflict checking
- Requirements verification
- Mock payment processing
- Approval/rejection workflow
- Gate pass generation
- Event day operations tracking
- Post-event inspection logging

### Admin Portal
- Comprehensive analytics dashboard
- Facility CRUD operations
- Blackout date management
- Request reassignment
- Status override capabilities
- Revenue tracking
- Utilization reports
- Export to CSV/JSON
- User management

## 📋 Database Schema

### Models
- **User** - Staff and admin accounts
- **Facility** - Facility information and amenities
- **FacilityRequest** - Booking requests
- **BlackoutDate** - Maintenance and restricted dates
- **Inspection** - Post-event inspection reports
- **StatusHistory** - Audit trail for status changes

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### 1. Install Dependencies
```bash
cd services/facility-management
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update with your database credentials:

```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/facility_management"
PORT=3004
NODE_ENV=development
JWT_SECRET=your-secret-key-here-change-in-production
```

### 3. Initialize Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with sample data
npm run seed
```

### 4. Start the Service
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will run on `http://localhost:3004`

## 🔑 Default Credentials

After seeding, use these credentials to login:

- **Admin**: `admin@facility.gov` / `admin123`
- **Staff 1**: `staff1@facility.gov` / `admin123`
- **Staff 2**: `staff2@facility.gov` / `admin123`

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /login` - Staff/Admin login
- `POST /register` - Register new staff user

### Citizen Routes (`/api/citizen`)
- `GET /facilities` - Get all available facilities
- `POST /check-availability` - Check facility availability
- `POST /facility-request` - Submit new booking request
- `GET /my-requests` - Get citizen's requests by email/contact
- `GET /request/:requestNumber` - Get specific request details
- `PUT /cancel-request/:id` - Cancel pending request

### Staff Routes (`/api/staff`) 🔒
*Requires authentication*

- `GET /dashboard` - Staff dashboard stats
- `GET /requests` - Get all requests (with filters)
- `GET /request/:id` - Get request details
- `PUT /assign/:id` - Assign request to self
- `PUT /update-status/:id` - Update request status
- `POST /upload-requirements/:id` - Upload additional documents
- `PUT /set-payment/:id` - Set payment details
- `POST /mock-payment/:id` - Process mock payment
- `POST /generate-gate-pass/:id` - Generate access code
- `PUT /event-status/:id` - Update event status (In Use, Completed, No Show)
- `POST /inspection/:id` - Submit post-event inspection

### Admin Routes (`/api/admin`) 🔒
*Requires admin role*

- `GET /dashboard` - Comprehensive analytics dashboard
- `GET /facilities` - Get all facilities with stats
- `POST /facility` - Create new facility
- `PUT /facility/:id` - Update facility
- `DELETE /facility/:id` - Delete facility
- `POST /blackout-date` - Create blackout date
- `GET /blackout-dates` - Get all blackout dates
- `DELETE /blackout-date/:id` - Delete blackout date
- `GET /all-requests` - Get all requests (advanced filters)
- `PUT /override-status/:id` - Override request status
- `PUT /reassign/:id` - Reassign request handler
- `GET /reports/export` - Export data (CSV/JSON)
- `GET /users` - Get all staff users

## 📊 Request Status Flow

```
PENDING_REVIEW
    ↓
AWAITING_REQUIREMENTS (optional)
    ↓
AWAITING_PAYMENT
    ↓
APPROVED → SCHEDULED → IN_USE → COMPLETED
    ↓
REJECTED / CANCELLED
```

## 🎫 Event Status Flow

```
SCHEDULED → IN_USE → COMPLETED
         ↘ NO_SHOW
         ↘ CANCELLED
```

## 💰 Payment Handling

- **Government Events**: Auto-exempted (no payment required)
- **Private Events**: Calculated based on hourly rate × hours
- **Payment Types**: CASH, CHECK, ONLINE_TRANSFER, EXEMPTED, WAIVED
- **Mock Payment**: Staff can upload receipt or mark as paid for testing

## 📁 File Uploads

Supported file types: JPG, PNG, PDF, DOC, DOCX

Upload categories:
- Government permits
- Barangay endorsements
- Health clearances
- Payment proofs
- Inspection photos
- Other documents

Files are stored in `uploads/` directory with organized subdirectories.

## 🔔 Automatic Features

- **Auto Request Number Generation**: FR-{YEAR}-{SEQUENCE}
- **Availability Checking**: Real-time conflict detection
- **Blackout Date Validation**: Prevents booking during maintenance/restricted periods
- **Auto-Cancellation**: Cancels requests after 48 hours without payment (can be configured)
- **Status History**: Automatic audit trail for all status changes
- **Gate Pass Generation**: Unique access codes for approved events

## 🎨 Facility Types

- Conference Hall
- Gymnasium
- Training Room
- Auditorium
- Cultural Center
- (Customizable via admin panel)

## 📈 Analytics & Reports

The admin dashboard provides:
- Total requests breakdown
- Revenue tracking (paid vs exempted)
- Government vs private event ratio
- Facility utilization rates
- Most requested facilities
- Activity type distribution
- Monthly trend analysis
- No-show statistics
- Cancellation rates

Export options: CSV, JSON

## 🛡️ Security Features

- JWT authentication
- Role-based authorization (STAFF, ADMIN, SUPERVISOR)
- Password hashing with bcrypt
- File type validation
- File size limits
- SQL injection protection (Prisma ORM)

## 🧪 Testing

Sample data includes:
- 5 facilities (various types)
- 4 sample requests (different statuses)
- 3 staff/admin users
- 2 blackout dates
- 1 completed inspection

## 🔧 Development Tools

```bash
# View database in browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Format Prisma schema
npx prisma format

# Generate migration
npx prisma migrate dev --name migration_name
```

## 📞 Service Information

- **Port**: 3004
- **Service Name**: Facility Management Service
- **Version**: 1.0.0
- **Health Check**: `GET /health`

## 📝 Notes

- Citizen requests don't require authentication (identified by email/contact number)
- Staff must be logged in to process requests
- Admin can override any status and reassign handlers
- All timestamps are in UTC
- File paths are relative to the `uploads/` directory
- Gate passes are unique codes (can be upgraded to QR codes)

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional context (development only)"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## 🔄 Integration

This service can be integrated with:
- SMS notifications (configure SMS_API_KEY)
- Email notifications (configure EMAIL_API_KEY)
- Payment gateways (replace mock payment)
- QR code generation libraries
- Calendar systems
- Document management systems

## 📚 Related Services

Part of the PAFM (Philippine AFPSLAI Marikina Municipal System):
- Burial & Cemetery Service (Port 3000)
- Water & Drainage Service (Port 3002)
- Parks & Recreation Service (Port 3003)
- Asset Inventory Service (Port 3005)
- **Facility Management Service (Port 3004)** ← You are here

## 📄 License

MIT License

---

For questions or support, contact the PAFM development team.
