# Death Registration Status Mapping

## Frontend Pages → Backend Prisma Status

| Frontend Page | Prisma Status | Description |
|---------------|---------------|-------------|
| **Pending** (`/pending`) | `SUBMITTED` | Newly submitted applications awaiting review |
| **Under Review** (`/under-review`) | `PENDING_VERIFICATION` | Applications currently being verified |
| **Approved** (`/approved`) | `PROCESSING` | Applications approved and being processed |
| **Completed** (`/completed`) | `REGISTERED` | Fully processed and registered applications |
| **Delayed** (`/delayed`) | `registrationType=DELAYED` | Applications filed beyond standard period |

## Complete Prisma Status Enum

```prisma
enum DeathRegistrationStatus {
  DRAFT
  SUBMITTED          ← Pending page
  PENDING_VERIFICATION ← Under Review page  
  FOR_PAYMENT
  PAID
  PROCESSING         ← Approved page
  REGISTERED         ← Completed page
  FOR_PICKUP
  CLAIMED
  RETURNED
  REJECTED
  EXPIRED
}
```

## API Endpoints

- **All registrations**: `/api/death-registrations`
- **Pending**: `/api/death-registrations?status=SUBMITTED`
- **Under Review**: `/api/death-registrations?status=PENDING_VERIFICATION`
- **Approved**: `/api/death-registrations?status=PROCESSING`
- **Completed**: `/api/death-registrations?status=REGISTERED`
- **Delayed**: `/api/death-registrations?registrationType=DELAYED`

## Status Workflow

1. **SUBMITTED** → Newly submitted, pending initial review
2. **PENDING_VERIFICATION** → Under review by staff
3. **FOR_PAYMENT** → Approved, awaiting payment
4. **PAID** → Payment received
5. **PROCESSING** → Being processed
6. **REGISTERED** → Registration complete
7. **FOR_PICKUP** → Ready for pickup
8. **CLAIMED** → Certificate claimed