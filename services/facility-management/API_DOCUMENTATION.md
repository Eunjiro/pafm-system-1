# Facility Management Service - API Documentation

## Base URL
```
http://localhost:3004
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get a token by logging in via `/api/auth/login`.

---

## 📁 Authentication Endpoints

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "staff1@facility.gov",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "staff1@facility.gov",
    "firstName": "Maria",
    "lastName": "Santos",
    "role": "STAFF"
  }
}
```

### Register Staff User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "newstaff@facility.gov",
  "password": "password123",
  "firstName": "Pedro",
  "lastName": "Garcia",
  "role": "STAFF"
}
```

---

## 👥 Citizen Endpoints (Public)

### Get All Facilities
```http
GET /api/citizen/facilities
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Main Conference Hall",
    "type": "Conference Hall",
    "capacity": 200,
    "description": "Large conference hall with modern facilities",
    "amenities": ["Projector", "Sound System", "Air Conditioning", "WiFi"],
    "location": "Building A, 2nd Floor",
    "hourlyRate": 2500.00
  }
]
```

### Check Availability
```http
POST /api/citizen/check-availability
```

**Request Body:**
```json
{
  "facilityId": 1,
  "scheduleStart": "2025-11-15T08:00:00Z",
  "scheduleEnd": "2025-11-15T17:00:00Z"
}
```

**Response:**
```json
{
  "available": true,
  "conflicts": [],
  "blackouts": []
}
```

### Submit Facility Request
```http
POST /api/citizen/facility-request
Content-Type: multipart/form-data
```

**Form Data:**
```
applicantName: "Juan Dela Cruz"
organizationName: "ABC Organization"
contactPerson: "Juan Dela Cruz"
contactNumber: "09171234567"
email: "juan@email.com"
facilityId: 1
activityType: "SEMINAR"
activityPurpose: "Employee Training"
scheduleStart: "2025-11-20T08:00:00Z"
scheduleEnd: "2025-11-20T17:00:00Z"
estimatedParticipants: 100
layoutRequirements: "Theater style"
equipmentNeeds: "Projector, microphones"
eventType: "PRIVATE"
governmentPermit: [file]
barangayEndorsement: [file]
```

**Response:**
```json
{
  "message": "Facility request submitted successfully",
  "requestNumber": "FR-2025-0005",
  "request": { ... }
}
```

### Get My Requests
```http
GET /api/citizen/my-requests?email=juan@email.com
GET /api/citizen/my-requests?contactNumber=09171234567
```

### Get Request Details
```http
GET /api/citizen/request/FR-2025-0001
```

### Cancel Request
```http
PUT /api/citizen/cancel-request/1
```

**Request Body:**
```json
{
  "reason": "Schedule conflict",
  "contactNumber": "09171234567"
}
```

---

## 👨‍💼 Staff Endpoints (Requires Authentication)

### Get Staff Dashboard
```http
GET /api/staff/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "stats": {
    "pendingReview": 5,
    "awaitingRequirements": 2,
    "awaitingPayment": 3,
    "approved": 10,
    "todayEvents": 2
  },
  "upcomingEvents": [ ... ]
}
```

### Get All Requests
```http
GET /api/staff/requests?status=PENDING_REVIEW&facilityId=1
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status
- `facilityId` - Filter by facility
- `startDate` - Filter by start date
- `endDate` - Filter by end date
- `search` - Search in request number, name, organization, contact

### Get Request Details
```http
GET /api/staff/request/1
Authorization: Bearer <token>
```

### Assign Request to Self
```http
PUT /api/staff/assign/1
Authorization: Bearer <token>
```

### Update Request Status
```http
PUT /api/staff/update-status/1
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "remarks": "All requirements complete. Approved for booking."
}
```

**Status Options:**
- `PENDING_REVIEW`
- `AWAITING_REQUIREMENTS`
- `AWAITING_PAYMENT`
- `APPROVED`
- `REJECTED`
- `CANCELLED`

### Upload Requirements
```http
POST /api/staff/upload-requirements/1
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
barangayEndorsement: [file]
healthClearance: [file]
otherDocuments: [file, file, ...]
```

### Set Payment Details
```http
PUT /api/staff/set-payment/1
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "paymentType": "CASH",
  "totalAmount": 25000.00
}
```

**Payment Types:**
- `CASH`
- `CHECK`
- `ONLINE_TRANSFER`
- `EXEMPTED`
- `WAIVED`

### Process Mock Payment
```http
POST /api/staff/mock-payment/1
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
paymentType: "CASH"
paymentProof: [file]
```

### Generate Gate Pass
```http
POST /api/staff/generate-gate-pass/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Gate pass generated successfully",
  "gatePass": "GP-1729600000000-ABC123XYZ",
  "request": { ... }
}
```

### Update Event Status
```http
PUT /api/staff/event-status/1
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "eventStatus": "IN_USE",
  "actualStartTime": "2025-11-15T08:15:00Z",
  "actualEndTime": null
}
```

**Event Status Options:**
- `SCHEDULED`
- `IN_USE`
- `COMPLETED`
- `NO_SHOW`
- `CANCELLED`

### Submit Post-Event Inspection
```http
POST /api/staff/inspection/1
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
hasDamages: false
damageDescription: ""
violations: ""
billingAmount: 0
remarks: "Facility in good condition"
photos: [file, file, ...]
```

---

## 🔧 Admin Endpoints (Requires Admin Role)

### Get Admin Dashboard
```http
GET /api/admin/dashboard?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "overview": {
    "totalRequests": 150,
    "approvedRequests": 100,
    "rejectedRequests": 10,
    "cancelledRequests": 15,
    "pendingRequests": 25,
    "activeRequests": 30,
    "facilitiesCount": 5
  },
  "revenue": {
    "totalRevenue": 500000,
    "exemptedRevenue": 100000,
    "paidRevenue": 400000
  },
  "usage": {
    "governmentEvents": 40,
    "privateEvents": 110,
    "noShows": 5,
    "utilizationRate": "66.67"
  },
  "facilityUtilization": [ ... ],
  "mostRequestedFacilities": [ ... ],
  "activityBreakdown": [ ... ],
  "monthlyTrend": [ ... ]
}
```

### Facility Management

#### Get All Facilities
```http
GET /api/admin/facilities
Authorization: Bearer <token>
```

#### Create Facility
```http
POST /api/admin/facility
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "New Training Room",
  "type": "Training Room",
  "capacity": 50,
  "description": "Modern training facility",
  "amenities": ["Projector", "WiFi", "Air Conditioning"],
  "location": "Building C, 1st Floor",
  "hourlyRate": 1500.00
}
```

#### Update Facility
```http
PUT /api/admin/facility/1
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Conference Hall",
  "capacity": 250,
  "isActive": true,
  "hourlyRate": 3000.00
}
```

#### Delete Facility
```http
DELETE /api/admin/facility/1
Authorization: Bearer <token>
```

### Blackout Date Management

#### Create Blackout Date
```http
POST /api/admin/blackout-date
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "facilityId": 1,
  "startDate": "2025-12-01T00:00:00Z",
  "endDate": "2025-12-05T23:59:59Z",
  "reason": "Annual maintenance",
  "type": "MAINTENANCE"
}
```

**Blackout Types:**
- `MAINTENANCE`
- `LGU_ONLY`
- `SPECIAL_EVENT`

#### Get Blackout Dates
```http
GET /api/admin/blackout-dates?facilityId=1
Authorization: Bearer <token>
```

#### Delete Blackout Date
```http
DELETE /api/admin/blackout-date/1
Authorization: Bearer <token>
```

### Request Management

#### Get All Requests
```http
GET /api/admin/all-requests?status=APPROVED&eventType=PRIVATE
Authorization: Bearer <token>
```

#### Override Request Status
```http
PUT /api/admin/override-status/1
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "APPROVED",
  "remarks": "Admin override - Priority request"
}
```

#### Reassign Request
```http
PUT /api/admin/reassign/1
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "handlerId": 2
}
```

### Reports & Export

#### Export Data
```http
GET /api/admin/reports/export?startDate=2025-01-01&endDate=2025-12-31&format=csv
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` - Start date filter
- `endDate` - End date filter
- `format` - Export format (`csv` or `json`)

**Response (CSV):**
```csv
Request Number,Applicant Name,Organization,Facility,...
FR-2025-0001,Department of Education,DepEd Division,...
```

#### Get Staff Users
```http
GET /api/admin/users
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "email": "staff1@facility.gov",
    "firstName": "Maria",
    "lastName": "Santos",
    "role": "STAFF",
    "createdAt": "2025-10-21T00:00:00Z",
    "_count": {
      "handledRequests": 15
    }
  }
]
```

---

## 📊 Enumerations

### User Roles
- `STAFF` - Regular staff member
- `ADMIN` - Administrator
- `SUPERVISOR` - Supervisor

### Activity Types
- `MEETING`
- `SEMINAR`
- `SPORTS`
- `TRAINING`
- `EXHIBIT`
- `OUTREACH`
- `CULTURAL_EVENT`
- `OTHERS`

### Event Types
- `GOVERNMENT` - Government event (payment exempt)
- `PRIVATE` - Private event (requires payment)

### Request Status
- `PENDING_REVIEW` - Newly submitted
- `AWAITING_REQUIREMENTS` - Needs additional documents
- `AWAITING_PAYMENT` - Payment pending
- `APPROVED` - Approved and scheduled
- `REJECTED` - Rejected
- `CANCELLED` - Cancelled

### Payment Status
- `PENDING` - Payment not received
- `PAID` - Payment received
- `EXEMPTED` - Government exemption
- `WAIVED` - Payment waived
- `VERIFIED` - Payment verified

### Event Status
- `SCHEDULED` - Event scheduled
- `IN_USE` - Event in progress
- `COMPLETED` - Event completed
- `NO_SHOW` - No show
- `CANCELLED` - Cancelled

### Inspection Status
- `NO_ISSUES` - No damages or violations
- `WITH_DAMAGES` - Damages found
- `WITH_VIOLATIONS` - Violations found
- `PENDING_BILLING` - Billing pending

---

## 🔐 Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 💡 Tips

1. **File Uploads**: Use `multipart/form-data` for endpoints that accept files
2. **Dates**: Use ISO 8601 format (e.g., `2025-11-15T08:00:00Z`)
3. **Authentication**: Include JWT token in all staff/admin requests
4. **Pagination**: Not implemented yet (returns all results)
5. **Rate Limiting**: Not implemented yet

---

## 🧪 Testing with cURL

### Login Example
```bash
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff1@facility.gov","password":"admin123"}'
```

### Get Facilities
```bash
curl http://localhost:3004/api/citizen/facilities
```

### Submit Request (with token)
```bash
curl -X POST http://localhost:3004/api/staff/update-status/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED","remarks":"Approved for booking"}'
```

---

For more information, see the main [README.md](README.md).
