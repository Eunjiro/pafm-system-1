# Storage Page Fix - Items API 500 Error

## Issue Fixed: Storage Page Loading Error

**Date:** October 20, 2025  
**Error:** `GET http://localhost:3000/api/asset-inventory/items 500 (Internal Server Error)`  
**Location:** Storage page (`/admin/asset-inventory/storage`)

---

## Root Cause

The backend items API route (`/services/asset-inventory/src/routes/items.js`) had **incorrect Prisma model names**:

1. **Wrong Model Casing**: `prisma.Item` (PascalCase) ❌  
   **Should be**: `prisma.item` (camelCase) ✅

2. **Wrong Related Model Names**:
   - `prisma.StockMovement` ❌ → `prisma.stockMovement` ✅

3. **Non-existent Database View**: Code was querying `vw_current_stock` view which doesn't exist

4. **Wrong Field Names**: `unitPrice` and `status` fields don't exist in Item model

---

## Solution Implemented

### Fixed `/services/asset-inventory/src/routes/items.js`

#### 1. GET `/api/items` - List All Items

**Before (BROKEN):**
```javascript
const items = await prisma.Item.findMany({  // Wrong casing!
  where,
  // ...
})

// Using non-existent view
const stockView = await prisma.$queryRaw`
  SELECT * FROM vw_current_stock WHERE item_id = ${item.id}
`
```

**After (FIXED):**
```javascript
const items = await prisma.item.findMany({  // Correct camelCase!
  where,
  // ...
})

// Calculate stock from stock movements
const stockMovements = await prisma.stockMovement.findMany({
  where: { itemId: item.id },
  orderBy: { createdAt: 'desc' },
  take: 1
})

const currentStock = stockMovements.length > 0 
  ? parseInt(stockMovements[0].balanceAfter) 
  : 0
```

#### 2. GET `/api/items/:id` - Get Single Item

**Before (BROKEN):**
```javascript
const item = await prisma.Item.findUnique({  // Wrong casing!
  // ...
})

// Using non-existent view
const stockView = await prisma.$queryRaw`...`
```

**After (FIXED):**
```javascript
const item = await prisma.item.findUnique({  // Correct camelCase!
  // ...
})

// Get stock from latest movement
const latestMovement = await prisma.stockMovement.findFirst({
  where: { itemId: item.id },
  orderBy: { createdAt: 'desc' }
})

const currentStock = latestMovement 
  ? parseInt(latestMovement.balanceAfter) 
  : 0
```

#### 3. POST `/api/items` - Create Item

**Before (BROKEN):**
```javascript
const existing = await prisma.Item.findUnique({...})  // Wrong!
const item = await prisma.Item.create({
  data: {
    // ...
    unitPrice: unitPrice || 0,  // Wrong field name!
    status: status || 'AVAILABLE'  // Field doesn't exist!
  }
})
```

**After (FIXED):**
```javascript
const existing = await prisma.item.findUnique({...})  // Correct!
const item = await prisma.item.create({
  data: {
    // ...
    unitCost: unitPrice || 0,  // Correct field name!
    reorderLevel: reorderLevel || 10
    // No status field - using isActive instead (default true)
  }
})
```

#### 4. PUT `/api/items/:id` - Update Item

**Before (BROKEN):**
```javascript
const item = await prisma.Item.update({  // Wrong!
  data: {
    unitPrice,  // Wrong field name!
    status  // Field doesn't exist!
  }
})
```

**After (FIXED):**
```javascript
const item = await prisma.item.update({  // Correct!
  data: {
    unitCost: unitPrice,  // Correct field name!
    reorderLevel
    // No status field
  }
})
```

#### 5. DELETE `/api/items/:id` - Delete Item

**Before (BROKEN):**
```javascript
const movements = await prisma.StockMovement.count({...})  // Wrong!
await prisma.Item.delete({...})  // Wrong!
```

**After (FIXED):**
```javascript
const movements = await prisma.stockMovement.count({...})  // Correct!
await prisma.item.delete({...})  // Correct!
```

#### 6. GET `/api/items/:id/history` - Get Stock History

**Before (BROKEN):**
```javascript
const movements = await prisma.StockMovement.findMany({...})  // Wrong!
```

**After (FIXED):**
```javascript
const movements = await prisma.stockMovement.findMany({...})  // Correct!
```

---

## Prisma Model Reference

### Correct Model Names (from schema.prisma)

```prisma
model Item {
  id              Int       @id @default(autoincrement())
  itemCode        String    @unique
  itemName        String
  description     String?
  category        ItemCategory
  unitOfMeasure   UnitOfMeasure
  
  reorderLevel    Int       @default(10)
  unitCost        Decimal?  @db.Decimal(10, 2)  // NOT unitPrice!
  
  isActive        Boolean   @default(true)  // NOT status!
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  deliveryItems   DeliveryItem[]
  stockLocations  StockLocation[]
  stockMovements  StockMovement[]
  risItems        RISItem[]
}

model StockMovement {
  id              Int       @id @default(autoincrement())
  itemId          Int
  item            Item      @relation(fields: [itemId], references: [id])
  
  movementType    MovementType
  quantityIn      Int       @default(0)
  quantityOut     Int       @default(0)
  balanceAfter    Int       // Current stock balance
  
  referenceNumber String?
  performedBy     String
  remarks         String?
  
  createdAt       DateTime  @default(now())
}
```

### Prisma Naming Convention

✅ **Models in Prisma Client**: Use **camelCase**
- `prisma.item` not `prisma.Item`
- `prisma.stockMovement` not `prisma.StockMovement`
- `prisma.deliveryReceipt` not `prisma.DeliveryReceipt`

❌ **Schema Definition**: Uses **PascalCase**
- `model Item {}`
- `model StockMovement {}`

---

## Files Modified

1. **`/services/asset-inventory/src/routes/items.js`**
   - Fixed all 12 instances of incorrect model names
   - Removed database view queries (replaced with stock movement queries)
   - Fixed field name: `unitPrice` → `unitCost`
   - Removed non-existent `status` field
   - Lines affected: 26, 88, 162, 173, 216, 252, 262, 288

---

## Testing Steps

### 1. Restart Asset-Inventory Service

```bash
cd services/asset-inventory
# Kill existing process if running
npm start
```

### 2. Test Storage Page

1. Navigate to `/admin/asset-inventory/storage`
2. Page should load without errors
3. Items list should display (even if empty)
4. Console should show no 500 errors

### 3. Test Items API Directly

```bash
# Test GET all items
curl http://localhost:3003/api/items

# Expected response:
{
  "success": true,
  "data": [...]
}
```

### 4. Create Test Item

```bash
curl -X POST http://localhost:3003/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "itemCode": "TEST-001",
    "itemName": "Test Item",
    "description": "Test description",
    "category": "OFFICE_SUPPLIES",
    "unitOfMeasure": "PIECE",
    "unitPrice": 100,
    "reorderLevel": 10
  }'
```

---

## Related Issues Fixed

This fix also resolves similar issues in:
- Deliveries page (`deliveries.js` - already fixed)
- Suppliers page (already working)

**Pattern**: Always use **camelCase** for Prisma model names in JavaScript/TypeScript code!

---

## Prevention

1. **Use TypeScript** - Type checking catches these errors
2. **Check Prisma Client docs** - Always reference camelCase model names
3. **Test API endpoints** individually before frontend integration
4. **Use linting** - ESLint can catch undefined properties
5. **Review Prisma schema** before writing queries

---

## Status

✅ **FIXED**  
✅ **All Prisma model names corrected**  
✅ **Database view queries removed**  
✅ **Field names corrected**  
✅ **Ready for testing**

**Date Fixed:** October 20, 2025  
**Next Step:** Restart asset-inventory service and test storage page
