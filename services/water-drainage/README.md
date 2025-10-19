# Water & Drainage Management Service

This microservice handles **Water Supply Services** and **Drainage Requests** for the PAFM Government System.

## Service Information

- **Port**: 3002
- **Database**: PostgreSQL (`pafm_water_drainage`)
- **Framework**: Express.js
- **ORM**: Prisma

## Modules

### 1. Drainage Requests (`/api/drainage`)
- Citizens can report drainage issues (clogged drains, flooding, pipe breaks, etc.)
- Admin can assign engineers, track status, and manage repairs
- Photo uploads for documentation
- Priority-based handling (LOW, MEDIUM, HIGH, URGENT)

### 2. Water Supply - Connection Requests (`/api/water-connections`)
- New water connection applications
- Document uploads (IDs, property proofs, business permits)
- Inspection scheduling and approval workflow
- Installation tracking and meter assignment
- Billing and payment management

### 3. Water Supply - Issue Reporting (`/api/water-issues`)
- Citizens report water supply problems
- Issues: No water, low pressure, leaks, dirty water, meter problems
- Assignment to maintenance staff
- Resolution tracking with photos

## Setup Instructions

### 1. Install Dependencies
```bash
cd services/water-drainage
npm install
```

### 2. Configure Database
Edit `.env` file:
```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/pafm_water_drainage?schema=public"
PORT=3002
```

### 3. Run Migrations
```bash
npm run db:generate
npm run db:migrate
```

### 4. Seed Data (Optional)
```bash
npm run db:seed
```

### 5. Start Service
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Drainage Requests
- `GET /api/drainage` - List all requests (with filters)
- `GET /api/drainage/:id` - Get single request
- `POST /api/drainage` - Create new request
- `PUT /api/drainage/:id` - Update request
- `POST /api/drainage/:id/updates` - Add status update
- `DELETE /api/drainage/:id` - Delete request
- `GET /api/drainage/stats/summary` - Get statistics

### Water Connections
- `GET /api/water-connections` - List all requests
- `GET /api/water-connections/:id` - Get single request
- `POST /api/water-connections` - Create new request
- `PUT /api/water-connections/:id` - Update request
- `POST /api/water-connections/:id/updates` - Add status update
- `DELETE /api/water-connections/:id` - Delete request
- `GET /api/water-connections/stats/summary` - Get statistics

### Water Issues
- `GET /api/water-issues` - List all issues
- `GET /api/water-issues/:id` - Get single issue
- `POST /api/water-issues` - Create new issue
- `PUT /api/water-issues/:id` - Update issue
- `POST /api/water-issues/:id/updates` - Add status update
- `DELETE /api/water-issues/:id` - Delete issue
- `GET /api/water-issues/stats/summary` - Get statistics

### Barangays
- `GET /api/barangays` - List all barangays
- `POST /api/barangays` - Add barangay

## Query Parameters

### Filtering
- `status` - Filter by status
- `barangay` - Filter by barangay
- `issueType` / `connectionType` - Filter by type
- `priority` - Filter by priority
- `search` - Full-text search

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

## Status Workflows

### Drainage Request Statuses
1. PENDING → Request submitted
2. FOR_APPROVAL → Under review
3. APPROVED → Approved for work
4. ONGOING → Work in progress
5. COMPLETED → Work completed
6. REJECTED / CANCELLED

### Water Connection Statuses
1. PENDING → Application submitted
2. FOR_INSPECTION → Assigned to inspector
3. INSPECTION_SCHEDULED → Date set
4. INSPECTION_COMPLETED → Site inspected
5. AWAITING_PAYMENT → Awaiting fees
6. PAYMENT_CONFIRMED → Payment received
7. FOR_INSTALLATION → Ready for install
8. INSTALLATION_SCHEDULED → Date set
9. INSTALLATION_COMPLETED → Meter installed
10. ACTIVE → Connection active
11. REJECTED / CANCELLED

### Water Issue Statuses
1. PENDING → Issue reported
2. ACKNOWLEDGED → Staff aware
3. ASSIGNED → Staff assigned
4. IN_PROGRESS → Work ongoing
5. RESOLVED → Issue fixed
6. CLOSED → Case closed
7. CANCELLED

## Integration with Frontend

The Next.js frontend communicates with this service through API routes in `/app/api/`:
- `/app/api/water-drainage/*`
- `/app/api/water-connections/*`
- `/app/api/water-issues/*`

These routes proxy requests to this backend service running on port 3002.

## Admin Pages

### Drainage Admin (`/admin/drainage`)
- View all drainage requests
- Filter by status, barangay, issue type
- Assign engineers
- Update status
- View photos in modal
- Generate reports

### Water Supply Admin (`/admin/water-supply`)
Two tabs:
1. **Connection Requests**
   - View all applications
   - Filter by status, barangay, type
   - Assign inspectors/installers
   - View documents
   - Track billing
   - Generate reports

2. **Issue Reporting**
   - View all issues
   - Filter by status, type, priority
   - Assign maintenance staff
   - Add repair notes
   - View photos
   - Track resolution

## Testing

Health check:
```bash
curl http://localhost:3002/health
```

Create drainage request:
```bash
curl -X POST http://localhost:3002/api/drainage \
  -H "Content-Type: application/json" \
  -d '{
    "requesterName": "Juan Dela Cruz",
    "contactNumber": "09171234567",
    "issueType": "CLOGGED_DRAIN",
    "description": "Clogged drainage causing flooding",
    "location": "Main Street",
    "barangay": "Bagbag",
    "specificAddress": "123 Main St, Bagbag, Novaliches",
    "priority": "HIGH"
  }'
```

## References

Water connection forms based on:
- Davao City Water District
- Baguio City Water District

Drainage data references:
- Quezon City LGU public information
- RRL standards

## Notes

- All photo uploads should be handled by a separate file upload service or cloud storage
- SMS/Email notifications are mocked for now
- Authentication middleware can be added as needed
- Role-based access control: citizen, employee, admin
