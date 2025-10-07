# Cemetery & Burial Management Service

A Node.js microservice for managing cemetery and burial operations, providing APIs for death registration, permit requests, certificate issuance, and cemetery plot management.

## Features

- **User Authentication & Authorization**: JWT-based auth with role-based access control
- **Death Registration**: Regular and delayed death registration processing
- **Permit Management**: Burial, exhumation, and cremation permits
- **Certificate Requests**: Death certificate issuance and tracking
- **Cemetery Plot Management**: Digital mapping and plot assignment
- **Document Management**: File upload and storage handling
- **Audit Logging**: Complete activity tracking
- **Payment Integration**: Payment tracking and validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs
- **Validation**: express-validator, Zod
- **Security**: Helmet, CORS, Rate limiting

## Project Structure

```
src/
├── server.js              # Main application entry point
├── middleware/             # Custom middleware
│   ├── auth.js            # Authentication & authorization
│   └── errorHandler.js    # Global error handling
├── routes/                # API route handlers
│   ├── auth.js           # Authentication endpoints
│   ├── users.js          # User management
│   ├── death-registrations.js
│   ├── permits.js
│   ├── certificates.js
│   └── plots.js
└── database/             # Database related files
    └── seed.js           # Database seeding
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   cd services/burial-cemetery
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3001
   DATABASE_URL="postgresql://username:password@localhost:5432/cemetery_management"
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Database Setup**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Seed database (optional)
   npm run db:seed
   ```

4. **Start the service**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The service will be available at `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/social-login` - Social media login
- `GET /api/auth/verify` - Verify JWT token

### Users

- `GET /api/users` - List users (Admin/Employee only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user (Admin only)
- `GET /api/users/stats/overview` - User statistics (Admin only)

### Death Registrations (Coming Soon)

- `POST /api/death-registrations` - Create death registration
- `GET /api/death-registrations` - List registrations
- `GET /api/death-registrations/:id` - Get registration details
- `PUT /api/death-registrations/:id` - Update registration

### Permits (Coming Soon)

- `POST /api/permits` - Create permit request
- `GET /api/permits` - List permit requests
- `GET /api/permits/:id` - Get permit details
- `PUT /api/permits/:id` - Update permit

### Certificates (Coming Soon)

- `POST /api/certificates` - Request certificate
- `GET /api/certificates` - List certificate requests
- `GET /api/certificates/:id` - Get certificate details

### Cemetery Plots (Coming Soon)

- `GET /api/plots` - List cemetery plots
- `GET /api/plots/:id` - Get plot details
- `PUT /api/plots/:id` - Update plot information

## Authentication & Authorization

The service uses JWT-based authentication with role-based access control:

### Roles

- **CITIZEN**: Can create and view their own requests
- **EMPLOYEE**: Can process requests and manage data
- **ADMIN**: Full system access and user management

### Authorization Headers

Include the JWT token in requests:
```
Authorization: Bearer <your-jwt-token>
```

## Database Schema

The service uses Prisma ORM with PostgreSQL. Key entities include:

- **Users**: System users with role-based access
- **DeathRegistration**: Death registration records
- **DeceasedRecord**: Deceased person information
- **PermitRequest**: Burial/cremation/exhumation permits
- **CertificateRequest**: Certificate issuance requests
- **CemeteryPlot**: Cemetery plot management
- **Payment**: Payment tracking
- **AuditLog**: Activity logging

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different permissions for different user roles
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Comprehensive request validation
- **Password Hashing**: Secure password storage with bcrypt
- **CORS Configuration**: Cross-origin request protection
- **Security Headers**: Helmet.js for security headers

## Error Handling

The service includes comprehensive error handling:

- **Validation Errors**: Detailed field-level validation messages
- **Authentication Errors**: Clear auth failure messages
- **Database Errors**: Prisma error handling and mapping
- **Global Error Handler**: Centralized error processing

## Development

### Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Database Management

Use Prisma Studio for database visualization:
```bash
npx prisma studio
```

### API Testing

Health check endpoint:
```bash
curl http://localhost:3001/health
```

## Integration with Frontend

This service is designed to integrate with NextAuth.js in the frontend:

1. **Social Login**: Use `/api/auth/social-login` endpoint
2. **Token Verification**: Use `/api/auth/verify` for NextAuth callbacks
3. **User Management**: Frontend can call user endpoints for profile management

## Deployment

### Environment Variables

Ensure all production environment variables are set:

- `NODE_ENV=production`
- `DATABASE_URL` - Production database connection
- `JWT_SECRET` - Strong secret key
- `CORS_ORIGIN` - Frontend domain

### Database Migration

Run migrations in production:
```bash
npx prisma migrate deploy
```

## Contributing

1. Follow the existing code structure
2. Add proper validation for new endpoints
3. Include error handling
4. Update documentation
5. Add tests for new features

## License

MIT License