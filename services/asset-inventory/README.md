# Asset Inventory & Warehouse Management Service

## 🏢 Overview
Complete asset management system for PAFM-Gov handling supply receiving, storage, RIS requests, issuance, physical inventory, and reporting.

## 📁 Service Structure

```
services/asset-inventory/
├── prisma/
│   ├── schema.prisma          ✅ Complete schema with all models
│   ├── seed.js                ⏳ Sample data seeding
│   └── migrations/            ⏳ Database migrations
├── src/
│   ├── server.js              ✅ Express server setup
│   ├── database/
│   │   └── prisma.js          ✅ Database connection
│   ├── routes/
│   │   ├── dashboard.js       ✅ Dashboard statistics & alerts
│   │   ├── suppliers.js       ⏳ Supplier CRUD
│   │   ├── purchaseOrders.js  ⏳ PO management
│   │   ├── deliveryReceipts.js ⏳ DR receiving & verification
│   │   ├── items.js           ⏳ Item master data
│   │   ├── storage.js         ⏳ Warehouse zones & racks
│   │   ├── stock.js           ⏳ Stock location management
│   │   ├── risRequests.js     ⏳ RIS request & approval
│   │   ├── issuances.js       ⏳ Asset issuance
│   │   ├── physicalCounts.js  ⏳ Physical inventory
│   │   └── reports.js         ⏳ Report generation
│   └── middleware/
│       ├── auth.js            ⏳ Authentication
│       ├── upload.js          ⏳ File upload handling
│       └── validation.js      ⏳ Request validation
├── uploads/                   📁 Uploaded documents storage
├── package.json               ✅ Dependencies defined
├── .env                       ✅ Environment variables
└── README.md                  ✅ This file
```

## 🗄️ Database Schema

### Core Models:
- **Supplier** - Vendor information
- **PurchaseOrder** & **POItem** - Purchase orders and line items
- **DeliveryReceipt** & **DeliveryItem** - Delivery verification
- **Item** - Master item catalog
- **StorageZone** & **StorageRack** - Warehouse layout
- **StockLocation** - Item storage locations with QR codes
- **RISRequest** & **RISItem** - Requisition requests
- **Issuance** & **IssuanceItem** - Asset release records
- **StockMovement** - Ledger-style transaction log
- **PhysicalCount** & **PhysicalCountItem** - Inventory validation
- **InventoryReport** - Automated reports for CAO/COA

### Key Enums:
- `DeliveryStatus`: PENDING_VERIFICATION, VERIFIED, STORED, REJECTED
- `StockStatus`: IN_STOCK, RESERVED, ISSUED, LOW_STOCK, OUT_OF_STOCK
- `RISStatus`: PENDING_APPROVAL, APPROVED, REJECTED, NO_STOCK, ISSUED, COMPLETED
- `MovementType`: RECEIVED, ISSUED, ADJUSTED, TRANSFERRED, RETURNED
- `ItemCategory`: OFFICE_SUPPLIES, FURNITURE, EQUIPMENT, ELECTRONICS, etc.

## 🔌 API Endpoints

### Dashboard
- `GET /api/dashboard` - Overview statistics
- `GET /api/dashboard/alerts` - System alerts (low stock, pending tasks)

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Deactivate supplier

### Purchase Orders
- `GET /api/purchase-orders` - List POs
- `GET /api/purchase-orders/:id` - Get PO details
- `POST /api/purchase-orders` - Create PO
- `PUT /api/purchase-orders/:id` - Update PO

### Delivery Receipts (Receiving)
- `GET /api/delivery-receipts` - List all DRs
- `GET /api/delivery-receipts/:id` - Get DR details
- `POST /api/delivery-receipts` - Create DR
- `PUT /api/delivery-receipts/:id/verify` - Verify delivery
- `PUT /api/delivery-receipts/:id/store` - Mark as stored
- `POST /api/delivery-receipts/upload` - Upload DR documents

### Items
- `GET /api/items` - List items with search/filter
- `GET /api/items/:id` - Get item details
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `GET /api/items/:id/stock-status` - Current stock levels

### Storage
- `GET /api/storage/zones` - List storage zones
- `GET /api/storage/racks` - List racks by zone
- `POST /api/storage/zones` - Create zone
- `POST /api/storage/racks` - Create rack
- `GET /api/storage/layout` - Warehouse visualization data

### Stock
- `GET /api/stock` - Current stock levels (from vw_current_stock)
- `GET /api/stock/locations` - Stock by location (from vw_location_stock)
- `POST /api/stock/assign` - Assign item to rack with QR tag
- `PUT /api/stock/move` - Move item between locations
- `POST /api/stock/adjust` - Manual stock adjustment

### RIS Requests
- `GET /api/ris-requests` - List RIS with filters
- `GET /api/ris-requests/:id` - Get RIS details
- `POST /api/ris-requests` - Submit new RIS
- `PUT /api/ris-requests/:id/approve` - Approve RIS
- `PUT /api/ris-requests/:id/reject` - Reject RIS
- `GET /api/ris-requests/:id/print` - Generate printable RIS with QR

### Issuances
- `GET /api/issuances` - List issuances
- `GET /api/issuances/:id` - Get issuance details
- `POST /api/issuances` - Create issuance from approved RIS
- `PUT /api/issuances/:id/acknowledge` - Acknowledge receipt

### Physical Counts
- `GET /api/physical-counts` - List count sessions
- `POST /api/physical-counts` - Create count session
- `PUT /api/physical-counts/:id/start` - Start counting
- `PUT /api/physical-counts/:id/items/:itemId` - Update count
- `PUT /api/physical-counts/:id/complete` - Finalize count
- `GET /api/physical-counts/:id/discrepancies` - Get variance report

### Reports
- `GET /api/reports` - List generated reports
- `POST /api/reports/generate` - Generate report (weekly/monthly/quarterly/annual)
- `GET /api/reports/:id/download` - Download report PDF
- `POST /api/reports/:id/submit` - Submit to CAO/COA

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Navigate to service directory
cd services/asset-inventory

# Install dependencies
npm install

# Set up database
npx prisma migrate dev --name init

# Seed initial data (optional)
npm run seed

# Start development server
npm run dev
```

### Environment Variables

```env
NODE_ENV=development
PORT=3003
DATABASE_URL="postgresql://user:password@localhost:5432/asset_inventory_db"
JWT_SECRET=your-secret-key
UPLOAD_DIR=./uploads
```

## 📊 Frontend Integration

### Admin Routes (Next.js)
```
/admin/asset-inventory/
├── dashboard              - Overview & alerts
├── receiving              - Delivery receipt management
├── storage                - Warehouse layout & stock locations
├── ris                    - RIS request management
├── issuance               - Asset issuance records
├── physical-count         - Inventory validation
└── reports                - Report generation & viewing
```

### API Proxy (Next.js)
Create proxy routes in `/frontend/src/app/api/asset-inventory/` to handle:
- Authentication
- Rate limiting
- Request logging
- Error normalization

## 🎨 UI Components Needed

### Receiving Page
- Document upload (PO, DR, Notice of Delivery)
- Supplier dropdown with autocomplete
- Item verification table with accept/reject
- Status timeline component

### Storage Dashboard
- Interactive warehouse map (grid layout)
- Drag-and-drop item assignment
- QR code generation for tags
- Real-time stock table

### RIS Management
- Department request form
- Multi-item selection with justifications
- Approval workflow buttons (Approve/Reject/Pending)
- Printable RIS with QR code

### Physical Count
- Split-view: System vs Actual
- Scan or manual entry
- Discrepancy highlighting (red/green)
- Adjustment confirmation modal

### Reports Dashboard
- Date range picker
- Export buttons (PDF/CSV/Excel)
- Chart components (stock trends, movements)
- Auto-submit to CAO/COA toggle

## 🔐 Security

- Role-based access control (warehouse_staff, approver, admin, requester)
- File upload validation and sanitization
- SQL injection prevention via Prisma ORM
- XSS protection with helmet
- Rate limiting on sensitive endpoints
- Audit trail for all inventory movements

## 📝 Next Steps

1. ✅ Create database schema and migrations
2. ⏳ Implement remaining API routes
3. ⏳ Add file upload middleware (multer)
4. ⏳ Create frontend admin pages
5. ⏳ Integrate with authentication system
6. ⏳ Add QR code generation
7. ⏳ Implement report generation (PDF)
8. ⏳ Add comprehensive testing
9. ⏳ Deploy and configure

## 📚 Documentation

API documentation will be available at:
- Swagger/OpenAPI: `http://localhost:3003/api-docs`
- Postman Collection: `/docs/postman-collection.json`

## 🤝 Integration with Other Modules

This service integrates with:
- **Authentication Service** - User verification and roles
- **Notification Service** - Alerts for approvals, low stock
- **Reporting Service** - Consolidated government reports
- **Main PAFM Dashboard** - System-wide overview

---

**Status**: 🚧 In Development
**Last Updated**: October 19, 2025
**Port**: 3003
