# 🎨 PAFM System - Unified Color Palette

## Core System Colors

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIMARY SYSTEM COLORS                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🟢 PRIMARY (Green)      #4CAF50                             │
│     • Main actions & success states                          │
│     • Cemetery & Burial services                             │
│     • Positive confirmations                                 │
│                                                              │
│  🔵 SECONDARY (Blue)     #4A90E2                             │
│     • Information & links                                    │
│     • Water & Drainage services                              │
│     • Processing states                                      │
│                                                              │
│  🟠 ACCENT (Orange)      #FDA811                             │
│     • Warnings & attention                                   │
│     • Asset Inventory services                               │
│     • Payment reminders                                      │
│                                                              │
│  🟣 PURPLE               #9C27B0                             │
│     • Special features                                       │
│     • Facility Management services                           │
│     • Premium/registered states                              │
│                                                              │
│  ⚪ BACKGROUND           #FBFBFB                             │
│     • Main page background                                   │
│     • Neutral canvas                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Status Color Mapping

```
APPLICATION LIFECYCLE STATES:
═══════════════════════════════════════════════════════════════

📝 DRAFT / SUBMITTED          🟡 Yellow    #FDD835
   ├─ Initial submission
   └─ Awaiting review

🔍 PENDING_VERIFICATION       🟡 Yellow    #FDD835
   ├─ Under review
   └─ Verification in progress

✓  VERIFIED                   🔵 Blue      #4A90E2
   ├─ Documents verified
   └─ Ready for next step

💳 FOR_PAYMENT                🟠 Orange    #FDA811
   ├─ Awaiting payment
   └─ Payment processing

💰 PAID                       🟣 Purple    #9C27B0
   ├─ Payment received
   └─ Ready for processing

⚙️  PROCESSING                🔵 Blue      #4A90E2
   ├─ Currently processing
   └─ Work in progress

📋 REGISTERED / ISSUED        🟣 Purple    #9C27B0
   ├─ Officially registered
   └─ Certificate issued

📦 FOR_PICKUP                 🟢 Green     #4CAF50
   ├─ Ready for collection
   └─ Available now

✅ COMPLETED / CLAIMED        ⚫ Gray      #9E9E9E
   ├─ Process complete
   └─ Successfully claimed

❌ REJECTED / CANCELLED       🔴 Red       #F44336
   ├─ Application denied
   └─ Process terminated
```

## Service Color Coding

```
MICROSERVICES IDENTIFICATION:
═══════════════════════════════════════════════════════════════

🪦 CEMETERY & BURIAL MANAGEMENT
   Color: #4CAF50 (Green)
   ├─ Death Registration
   ├─ Burial Permits
   ├─ Certificates
   └─ Plot Management

💧 WATER SUPPLY & DRAINAGE
   Color: #4A90E2 (Blue)
   ├─ Water Connections
   ├─ Billing & Payments
   ├─ Maintenance Requests
   └─ Issue Reporting

📦 ASSET INVENTORY SYSTEM
   Color: #FDA811 (Orange)
   ├─ Asset Tracking
   ├─ Physical Count
   ├─ Issuance Management
   └─ Reports

🏢 FACILITY MANAGEMENT
   Color: #9C27B0 (Purple)
   ├─ Space Booking
   ├─ Maintenance Scheduling
   ├─ Resource Allocation
   └─ Compliance Tracking

🌳 PARKS & RECREATION
   Color: #43A047 (Green Variant)
   ├─ Amenity Reservations
   ├─ Event Permits
   ├─ Maintenance
   └─ Public Spaces
```

## Dashboard Gradient Guide

```
HEADER GRADIENTS:
═══════════════════════════════════════════════════════════════

ADMIN DASHBOARD (Rainbow):
linear-gradient(90deg, 
  #4CAF50 0%,    ← Green
  #4A90E2 35%,   ← Blue
  #FDA811 70%,   ← Orange
  #9C27B0 100%   ← Purple
)

EMPLOYEE DASHBOARD (Hero):
linear-gradient(135deg,
  #4CAF50 0%,    ← Green
  #4A90E2 100%   ← Blue
)

CITIZEN DASHBOARD (Hero):
linear-gradient(135deg,
  #4CAF50 0%,    ← Green
  #4A90E2 100%   ← Blue
)

SERVICE CARDS (Individual):
linear-gradient(135deg,
  [Service Color] 0%,
  [Darker Shade] 100%
)
```

## UI Component Standards

```
CARDS & CONTAINERS:
═══════════════════════════════════════════════════════════════

Standard Card:
├─ Background: white (#FFFFFF)
├─ Border: 2px solid gray-100
├─ Border Radius: 16px (rounded-2xl)
├─ Shadow: shadow-lg
└─ Hover: shadow-xl + translate-y-1

Stat Card:
├─ Icon Background: [Color]15 (15% opacity)
├─ Icon Color: [Service Color]
├─ Badge: [Color]500
└─ Padding: 24px (p-6)

Service Card:
├─ Border: 2px solid gray-100
├─ Icon Container: [Color]15
├─ Status Badge: green-100/red-100
└─ Hover: shadow-2xl + translate-y-1

BUTTONS:
═══════════════════════════════════════════════════════════════

Primary Button:
├─ Background: green-600
├─ Hover: green-700
├─ Text: white
├─ Border Radius: 8px (rounded-lg)
└─ Shadow: shadow-md → shadow-lg

Secondary Button:
├─ Background: blue-600
├─ Hover: blue-700
├─ Text: white
└─ Border Radius: 8px

Accent Button:
├─ Background: orange-500
├─ Hover: orange-600
├─ Text: white
└─ Border Radius: 8px

Ghost Button:
├─ Background: transparent
├─ Hover: gray-100
├─ Text: gray-700
└─ Border Radius: 8px
```

## Accessibility Standards

```
COLOR CONTRAST RATIOS (WCAG AA):
═══════════════════════════════════════════════════════════════

Text on Colored Backgrounds:
├─ Normal Text: ≥ 4.5:1 ✓
├─ Large Text (18pt+): ≥ 3:1 ✓
└─ UI Components: ≥ 3:1 ✓

Status Indicators:
├─ Icons accompany all colors
├─ Text labels provided
└─ Patterns/shapes used

Color Blind Support:
├─ Green-Red distinction avoided
├─ Multiple visual cues
└─ High contrast maintained
```

## Quick Reference

```
TAILWIND CLASSES:
═══════════════════════════════════════════════════════════════

Primary (Green):
bg-primary-500    text-primary-600    border-primary-200
bg-green-50       text-green-800      border-green-200

Secondary (Blue):
bg-secondary-500  text-secondary-600  border-secondary-200
bg-blue-50        text-blue-800       border-blue-200

Accent (Orange):
bg-accent-500     text-accent-600     border-accent-200
bg-orange-50      text-orange-800     border-orange-200

Purple:
bg-purple-500     text-purple-600     border-purple-200
bg-purple-50      text-purple-800     border-purple-200

Status Light Backgrounds:
bg-green-100      bg-blue-100         bg-orange-100
bg-yellow-100     bg-red-100          bg-purple-100
bg-gray-100
```

---

**Last Updated**: October 21, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
