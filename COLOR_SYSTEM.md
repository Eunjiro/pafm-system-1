# Color System Documentation

## Overview
This document describes the unified color system used across the PAFM System to ensure visual consistency and a professional appearance.

## Primary Colors

### System Colors
- **Primary (Green)**: `#4CAF50` - Main actions, success states, cemetery services
- **Secondary (Blue)**: `#4A90E2` - Information, links, water & drainage services
- **Accent (Orange/Amber)**: `#FDA811` - Highlights, warnings, asset inventory
- **Purple**: `#9C27B0` - Special features, facility management
- **Background**: `#FBFBFB` - Main background color

## Color Usage Guide

### 1. Service/Module Colors
Each microservice has a dedicated color for visual identification:

```typescript
- Cemetery & Burial Management: #4CAF50 (Green)
- Water Supply & Drainage: #4A90E2 (Blue)
- Asset Inventory System: #FDA811 (Orange)
- Facility Management: #9C27B0 (Purple)
- Parks & Recreation: #43A047 (Green variant)
```

### 2. Status Colors

#### Application Workflow States
- **Success/Completed**: Green (#4CAF50)
  - `bg-green-100`, `text-green-800`, `border-green-200`
  
- **Info/Processing**: Blue (#4A90E2)
  - `bg-blue-100`, `text-blue-800`, `border-blue-200`
  
- **Warning/Pending**: Yellow/Amber (#FDD835)
  - `bg-yellow-100`, `text-yellow-800`, `border-yellow-200`
  
- **Attention/Payment**: Orange (#FDA811)
  - `bg-orange-100`, `text-orange-800`, `border-orange-200`
  
- **Error/Rejected**: Red (#F44336)
  - `bg-red-100`, `text-red-800`, `border-red-200`
  
- **Processing/Registered**: Purple (#9C27B0)
  - `bg-purple-100`, `text-purple-800`, `border-purple-200`
  
- **Neutral/Inactive**: Gray (#9E9E9E)
  - `bg-gray-100`, `text-gray-800`, `border-gray-200`

### 3. Gradient Combinations

#### Dashboard Headers
```css
/* Primary Gradient */
background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);

/* Secondary Gradient */
background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);

/* Hero Gradient (Primary + Secondary) */
background: linear-gradient(135deg, #4CAF50 0%, #4A90E2 100%);

/* Rainbow (All Services) */
background: linear-gradient(90deg, #4CAF50 0%, #4A90E2 35%, #FDA811 70%, #9C27B0 100%);
```

## Implementation

### Using the Color System

#### 1. Import the Color Constants
```typescript
import { COLORS, STATUS_COLORS, SERVICE_COLORS, getStatusColor } from '@/lib/colors'
```

#### 2. Apply Colors in Components
```tsx
// Using hex colors
<div style={{ backgroundColor: COLORS.primary.DEFAULT }}>...</div>

// Using Tailwind classes
<div className="bg-primary-500 text-white">...</div>

// Using status colors
const statusStyle = getStatusColor('PENDING')
<span className={`${statusStyle.bg} ${statusStyle.text}`}>Pending</span>
```

#### 3. Card Styling Presets
```tsx
import { CARD_STYLES, BUTTON_STYLES } from '@/lib/colors'

<div className={CARD_STYLES.default}>...</div>
<button className={BUTTON_STYLES.primary}>Submit</button>
```

## Dashboard Components

### Reusable Components Created
1. **DashboardHeader**: Unified header with gradient and time display
2. **StatCard**: Statistics card with consistent icon and color scheme
3. **ServiceCard**: Service/microservice status card
4. **QuickActionCard**: Quick action buttons with hover effects

### Usage Example
```tsx
import { DashboardHeader } from '@/components/ui/DashboardHeader'
import { StatCard, ServiceCard } from '@/components/ui/DashboardCards'

<DashboardHeader 
  title="System Dashboard"
  subtitle="Manage your services"
  userName={session.user?.name}
  currentTime={new Date()}
  gradientType="hero"
/>

<StatCard 
  title="Pending Review"
  value={stats.pending}
  icon={FiClock}
  color="accent"
  badge="Urgent"
/>
```

## Dashboard Consistency

### Admin Dashboard
- **Header**: Rainbow gradient (#4CAF50 → #4A90E2 → #FDA811 → #9C27B0)
- **Stats Cards**: Individual service colors
- **Service Cards**: Matching service colors with hover effects

### Employee Dashboard
- **Header**: Green-Blue gradient (Hero)
- **Stats Cards**: 
  - Pending: Orange (#FDA811)
  - Processing: Blue (#4A90E2)
  - Completed: Green (#4CAF50)
  - Ready: Purple-Pink gradient

### Citizen Dashboard
- **Header**: Green-Blue gradient (Hero)
- **Service Card**: Blue accent (#4A90E2)
- **Applications Card**: Green accent (#4CAF50)
- **Status Indicators**: Matching system status colors

## Best Practices

### DO's
✅ Use the centralized color constants from `@/lib/colors`
✅ Apply consistent status colors for workflow states
✅ Use service colors to identify different modules
✅ Maintain gradient directions (135deg for hero, 90deg for rainbow)
✅ Use reusable dashboard components for consistency

### DON'Ts
❌ Don't hardcode color values directly in components
❌ Don't use random colors outside the defined palette
❌ Don't mix different shades inconsistently
❌ Don't override primary colors without updating the system

## Accessibility

### Color Contrast
All color combinations meet WCAG AA standards:
- Text on colored backgrounds: Minimum 4.5:1 contrast ratio
- Large text (18pt+): Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio

### Color Blindness Considerations
- Icons accompany color-coded statuses
- Text labels provided for all status indicators
- Patterns/shapes used in addition to color

## Future Enhancements
- Dark mode color palette
- Theme customization options
- Dynamic color adjustments based on user preferences
- Color blind-friendly mode

## File References
- Color System: `/frontend/src/lib/colors.ts`
- Tailwind Config: `/frontend/tailwind.config.ts`
- Global Styles: `/frontend/src/app/globals.css`
- Dashboard Components: `/frontend/src/components/ui/DashboardCards.tsx`
- Dashboard Header: `/frontend/src/components/ui/DashboardHeader.tsx`

## Last Updated
October 21, 2025
