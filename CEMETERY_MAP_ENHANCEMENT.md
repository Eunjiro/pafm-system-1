# Enhanced Cemetery Management System

## Overview

This enhanced cemetery management system provides comprehensive tools for administrative cemetery management and citizen search functionality. The system allows administrators to manage cemetery layouts, sections, blocks, and plots with detailed deceased and gravestone information, while providing citizens with powerful search capabilities and AI navigation features.

## Features

### Administrative Features (`/admin/cemetery-map`)

#### 1. Cemetery Layout Management
- **Create Cemetery Boundary**: Draw and define the overall cemetery perimeter
- **Edit Cemetery Information**: Name, description, and boundary modifications
- **Visual Map Interface**: Interactive map for drawing and managing cemetery areas

#### 2. Section Management
- **Add Sections**: Draw section boundaries within the cemetery
- **Section Information**: Name, description, and color coding
- **Hierarchical Organization**: Sections contain multiple blocks

#### 3. Block Management  
- **Add Blocks**: Draw block boundaries within sections
- **Block Assignment**: Associate blocks with parent sections
- **Color Coding**: Visual identification of different blocks

#### 4. Plot Management
- **Individual Plot Creation**: Draw precise plot boundaries
- **Plot Details**: Lot numbers, sizes, and status tracking
- **Status Management**: Vacant, Occupied, Reserved, Unavailable
- **Plot Assignment**: Link plots to specific blocks

#### 5. Deceased Information Management
- **Personal Details**: Full name, birth/death dates, age, gender
- **Additional Information**: Cause of death, place of death, notes
- **Plot Assignment**: Automatically link deceased to specific plots
- **Status Updates**: Auto-update plot status to "occupied"

#### 6. Gravestone Information Management
- **Physical Details**: Material, dimensions, condition
- **Inscription Recording**: Full gravestone text documentation
- **Installation Tracking**: Date installed and maintenance notes
- **Condition Monitoring**: Excellent, Good, Fair, Poor, Damaged status

#### 7. Management Sidebar
- **Cemetery Overview**: Statistics and summary information
- **Hierarchical Navigation**: Browse sections → blocks → plots
- **Quick Actions**: Direct access to deceased and gravestone forms
- **Real-time Updates**: Live status indicators

### Citizen Features (`/citizen/cemetery-search`)

#### 1. Comprehensive Search
- **Multi-type Search**: Deceased persons, plots, sections, blocks, gravestones
- **Flexible Queries**: Name, lot number, section, inscription search
- **Advanced Filtering**: Filter by search type or view all results
- **Real-time Results**: Instant search with 2+ character queries

#### 2. Search Results Display
- **Deceased Persons**: Full names, birth-death dates, plot locations
- **Cemetery Plots**: Location details, status, occupant information
- **Gravestones**: Material, condition, inscription details
- **Visual Status Indicators**: Color-coded plot status display

#### 3. Navigation System
- **Plot Coordinates**: Precise latitude/longitude positioning
- **Detailed Information**: Complete plot, deceased, and gravestone data
- **AI Navigation Ready**: OpenRouteService integration foundation
- **Turn-by-turn Directions**: Future implementation for cemetery navigation

## Technical Implementation

### API Endpoints

#### Cemetery Layout
- `GET /api/cemetery-layout` - Retrieve cemetery layout
- `POST /api/cemetery-layout` - Create new layout
- `PUT /api/cemetery-layout` - Update existing layout

#### Sections
- `GET /api/cemetery-sections` - List all sections
- `POST /api/cemetery-sections` - Create new section
- `PUT /api/cemetery-sections` - Update section
- `DELETE /api/cemetery-sections` - Remove section

#### Blocks  
- `GET /api/cemetery-blocks` - List blocks (optionally by section)
- `POST /api/cemetery-blocks` - Create new block
- `PUT /api/cemetery-blocks` - Update block
- `DELETE /api/cemetery-blocks` - Remove block

#### Plots
- `GET /api/cemetery-plots` - List plots (with filters)
- `POST /api/cemetery-plots` - Create new plot
- `PUT /api/cemetery-plots` - Update plot information
- `DELETE /api/cemetery-plots` - Remove plot

#### Deceased Records
- `GET /api/deceased` - Search deceased records
- `POST /api/deceased` - Add deceased information
- `PUT /api/deceased` - Update deceased record
- `DELETE /api/deceased` - Remove deceased record

#### Gravestone Records
- `GET /api/gravestones` - List gravestone information
- `POST /api/gravestones` - Add gravestone details
- `PUT /api/gravestones` - Update gravestone information
- `DELETE /api/gravestones` - Remove gravestone record

#### Search & Navigation
- `GET /api/cemetery-search` - Comprehensive search across all data
- `POST /api/cemetery-search` - Get navigation coordinates for plots

### Data Structure

```typescript
type CemeteryLayout = {
  id: string;
  name: string;
  description: string;
  boundary: [number, number][];
  sections: CemeterySection[];
};

type CemeterySection = {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number][];
  color: string;
  blocks: CemeteryBlock[];
};

type CemeteryBlock = {
  id: string;
  name: string;
  sectionId: string;
  coordinates: [number, number][];
  color: string;
  plots: CemeteryPlot[];
};

type CemeteryPlot = {
  id: string;
  lotNumber: string;
  blockId: string;
  size: string;
  coordinates: [number, number][];
  status: 'vacant' | 'reserved' | 'occupied' | 'unavailable';
  deceased?: DeceasedInfo;
  gravestone?: GravestoneInfo;
  dateAssigned?: string;
  permitReference?: string;
};

type DeceasedInfo = {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  dateOfBirth: string;
  dateOfDeath: string;
  age: number;
  gender: 'male' | 'female';
  causeOfDeath?: string;
  placeOfDeath?: string;
  notes?: string;
};

type GravestoneInfo = {
  id: string;
  material: string;
  inscription: string;
  dateInstalled?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  height?: number;
  width?: number;
  notes?: string;
};
```

### Key Features

#### 1. Interactive Map Drawing
- Polygon-based boundary and plot definition
- Real-time coordinate capture
- Multi-point drawing with minimum 3 points
- Cancel and save functionality

#### 2. Hierarchical Data Management
- Cemetery → Sections → Blocks → Plots
- Automatic parent-child relationships
- Cascade updates and deletions
- Real-time status propagation

#### 3. Search Capabilities
- Full-text search across multiple fields
- Case-insensitive matching
- Wildcard and partial matching
- Multi-entity search results

#### 4. Status Management
- Automatic plot status updates
- Visual status indicators
- Workflow-based state transitions
- Audit trail maintenance

#### 5. Integration Ready
- OpenRouteService API preparation
- Coordinate-based navigation
- Turn-by-turn direction foundation
- Mobile-responsive design

## Future Enhancements

### 1. AI Navigation Integration
- OpenRouteService API integration
- Real-time GPS navigation
- Augmented reality plot finding
- Voice-guided directions

### 2. Mobile Application
- Native iOS/Android apps
- Offline map access
- QR code plot identification
- Camera-based gravestone recognition

### 3. Advanced Analytics
- Cemetery utilization reports
- Burial trend analysis
- Maintenance scheduling
- Revenue tracking

### 4. Public API
- Third-party integrations
- Funeral home connections
- Government system links
- Family tree services

## Installation & Setup

1. **Database Setup**: Ensure Prisma schema includes all cemetery-related tables
2. **API Routes**: All API routes are created and configured
3. **Frontend Pages**: Admin and citizen interfaces are implemented
4. **Authentication**: Ensure proper role-based access control
5. **Map Integration**: Configure map service for coordinate plotting

## Usage Guide

### For Administrators

1. **Initial Setup**: Create cemetery layout with boundary
2. **Add Sections**: Define major cemetery areas
3. **Create Blocks**: Subdivide sections into manageable blocks
4. **Add Plots**: Create individual burial plots
5. **Manage Records**: Add deceased and gravestone information as needed

### For Citizens

1. **Search**: Use the search interface to find deceased persons or plots
2. **Browse Results**: Review detailed information in search results
3. **Get Directions**: Click "Get Directions" for navigation information
4. **View Details**: Access comprehensive plot and gravestone information

This enhanced cemetery management system provides a complete solution for modern cemetery operations with future-ready navigation capabilities.