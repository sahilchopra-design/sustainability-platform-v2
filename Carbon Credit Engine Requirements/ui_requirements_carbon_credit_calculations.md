# UI Module Requirements Specification
## Activity-Level Carbon Credit Calculation System
### Version 1.0 | Comprehensive Methodology Coverage

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Dashboard and Navigation](#2-dashboard-and-navigation)
3. [Activity Creation Workflow](#3-activity-creation-workflow)
4. [Data Input Modules by Cluster](#4-data-input-modules-by-cluster)
   - 4.1 Nature-based Solutions (ARR, IFM, REDD+, Wetlands)
   - 4.2 Agriculture (Soil Carbon, Livestock Methane, Rice Cultivation)
   - 4.3 Energy (Grid Renewables, Distributed Energy, Clean Cooking, Energy Efficiency)
   - 4.4 Waste (Landfill Gas, Wastewater Methane, Organic Waste)
   - 4.5 Industrial (Industrial Gases, CCS/CCUS, Biochar)
   - 4.6 Engineered Removals (Mineralization, DAC, BiCRS)
5. [Calculation Interface](#5-calculation-interface)
6. [Monitoring and MRV Interface](#6-monitoring-and-mrv-interface)
7. [Results and Reporting](#7-results-and-reporting)
8. [User Management and Access Control](#8-user-management-and-access-control)
9. [Integration Requirements](#9-integration-requirements)
10. [Responsive Design Requirements](#10-responsive-design-requirements)
11. [Specific UI Components](#11-specific-ui-components)
12. [Appendices](#12-appendices)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Purpose
This document provides comprehensive UI/UX requirements for an activity-level carbon credit calculation system covering 20 distinct activity clusters across 6 project families. The system enables project developers, verifiers, and administrators to:

- Create and configure carbon credit activities using standardized methodologies
- Input activity data with intelligent validation and guidance
- Execute real-time carbon credit calculations
- Monitor project performance and MRV (Measurement, Reporting, Verification) requirements
- Generate audit-ready reports and documentation

### 1.2 Scope Coverage

| Project Family | Activity Clusters | Methodology Types |
|---------------|-------------------|-------------------|
| Nature-based | 4 | ARR, IFM, REDD+, Wetlands |
| Agriculture | 3 | Soil Carbon, Livestock, Rice |
| Energy | 4 | Grid Renewables, Distributed, Cooking, Efficiency |
| Waste | 3 | Landfill Gas, Wastewater, Organic Waste |
| Industrial | 3 | Industrial Gases, CCS/CCUS, Biochar |
| Engineered Removals | 3 | Mineralization, DAC, BiCRS |

### 1.3 User Personas

#### Primary Users
- **Project Developer**: Creates activities, inputs data, runs calculations, generates reports
- **Technical Analyst**: Configures methodologies, validates calculations, manages uncertainty
- **Verifier**: Reviews activities, audits calculations, approves credits
- **Administrator**: Manages users, configures system, monitors platform health

#### Secondary Users
- **Registry Operator**: Receives credit issuance data
- **Investor/Stakeholder**: Views project dashboards and reports (read-only)
- **Field Technician**: Inputs monitoring data from site visits

---

## 2. DASHBOARD AND NAVIGATION

### 2.1 Main Dashboard Layout

#### Wireframe Description
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | Global Search | Notifications | User Profile | Help         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ QUICK STATS ROW                                                     │   │
│  │ [Active Projects: 24] [Pending Calc: 8] [Credits Generated: 45,230] │   │
│  │ [Verification Due: 3] [Alerts: 2]                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ PROJECT STATUS           │  │ ACTIVITY BY CLUSTER (Donut Chart)      │  │
│  │ ┌─────────┐              │  │                                        │  │
│  │ │ Draft   │ 8  ████████  │  │    Nature: 35%                         │  │
│  │ │ Active  │ 12 ██████████│  │    Agriculture: 20%                    │  │
│  │ │ Pending │ 5  ████      │  │    Energy: 25%                         │  │
│  │ │ Verified│ 7  █████     │  │    Waste: 10%                          │  │
│  │ │ Expired │ 2  ██        │  │    Industrial: 5%                      │  │
│  │ └─────────┘              │  │    Removals: 5%                        │  │
│  └──────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ RECENT ACTIVITIES (Sortable Table)                                   │  │
│  │ Activity Name | Cluster | Status | Last Updated | Credits | Actions  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ QUICK ACTIONS            │  │ NOTIFICATIONS & ALERTS                 │  │
│  │ [+ New Activity]         │  │ ⚠️ Verification due in 5 days          │  │
│  │ [Import Data]            │  │ 📊 Monthly report ready                │  │
│  │ [Run Batch Calc]         │  │ ✅ Activity #1234 approved             │  │
│  │ [Generate Report]        │  │ ⚠️ Missing monitoring data             │  │
│  └──────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Component Specifications

##### Quick Stats Row
- **Purpose**: At-a-glance system health and workload indicators
- **Components**: 
  - Metric cards with trend indicators (up/down arrows)
  - Click-to-filter functionality
  - Color-coded status (green=normal, yellow=warning, red=critical)
- **Data Refresh**: Real-time for critical metrics, 5-minute interval for others
- **Responsive**: Collapses to 2x3 grid on tablet, vertical stack on mobile

##### Project Status Widget
- **Purpose**: Visual breakdown of project lifecycle stages
- **Components**:
  - Horizontal bar chart with status categories
  - Click to filter main activity table
  - Percentage and absolute count display
- **Interactions**: Hover shows tooltip with project names

##### Activity by Cluster Visualization
- **Purpose**: Distribution of activities across methodology families
- **Chart Type**: Donut chart with interactive segments
- **Interactions**:
  - Click segment to filter activities
  - Hover shows count and percentage
  - Legend toggle to show/hide clusters
- **Color Coding**: 
  - Nature-based: Forest Green (#228B22)
  - Agriculture: Goldenrod (#DAA520)
  - Energy: Electric Blue (#00BFFF)
  - Waste: Slate Gray (#708090)
  - Industrial: Steel Blue (#4682B4)
  - Removals: Purple (#800080)

##### Recent Activities Table
- **Purpose**: Quick access to recently modified activities
- **Columns**:
  - Activity Name (clickable to open)
  - Cluster (with icon)
  - Status (badge with color)
  - Last Updated (relative time)
  - Credits (formatted number)
  - Actions (edit, calculate, export)
- **Pagination**: 10 items per page, infinite scroll option
- **Sorting**: Click column headers, multi-column sort supported
- **Filtering**: Global search + column-specific filters

##### Quick Actions Panel
- **Purpose**: One-click access to common workflows
- **Buttons**:
  - "+ New Activity" (primary CTA, prominent styling)
  - "Import Data" (secondary)
  - "Run Batch Calculation" (secondary)
  - "Generate Report" (secondary)
- **Permissions**: Buttons show/hide based on user role

##### Notifications Panel
- **Purpose**: Alert users to time-sensitive actions
- **Types**:
  - Verification deadlines
  - Missing data alerts
  - Calculation completion
  - Approval/rejection notifications
- **Interactions**:
  - Click to navigate to relevant activity
  - Dismiss individual or clear all
  - Settings to configure notification preferences

### 2.2 Activity Cluster Navigation

#### Sidebar Navigation Structure
```
📊 Dashboard
│
├─ 🌳 Nature-based Solutions
│  ├─ 🌱 ARR (Afforestation/Reforestation)
│  ├─ 🌲 IFM (Improved Forest Management)
│  ├─ 🛡️ REDD+ (Deforestation Avoidance)
│  └─ 💧 Wetlands & Blue Carbon
│
├─ 🌾 Agriculture
│  ├─ 🪱 Soil Carbon
│  ├─ 🐄 Livestock Methane
│  └─ 🍚 Rice Cultivation
│
├─ ⚡ Energy
│  ├─ 🔌 Grid Renewables
│  ├─ 🏘️ Distributed Energy
│  ├─ 🔥 Clean Cooking
│  └─ 💡 Energy Efficiency
│
├─ 🗑️ Waste
│  ├─ ⛽ Landfill Gas
│  ├─ 💦 Wastewater Methane
│  └─ ♻️ Organic Waste
│
├─ 🏭 Industrial
│  ├─ ☁️ Industrial Gases
│  ├─ 🧪 CCS / CCUS
│  └─ ⚫ Biochar
│
├─ 🔬 Engineered Removals
│  ├─ 🪨 Mineralization
│  ├─ 🌪️ Direct Air Capture
│  └─ 📦 BiCRS / Biomass Storage
│
├─ 📈 Reports & Analytics
├─ 👥 User Management
└─ ⚙️ Settings
```

#### Navigation Behavior
- **Collapse/Expand**: Click family headers to toggle cluster visibility
- **Active State**: Highlight current cluster with accent color
- **Badge Indicators**: Show count of activities in each cluster
- **Search**: Type to filter navigation items
- **Favorites**: Star frequently accessed clusters for quick access
- **Recent**: Show last 5 accessed activities at top of sidebar

### 2.3 Global Search

#### Search Interface
- **Position**: Top navigation bar, always visible
- **Placeholder**: "Search activities, projects, methodologies..."
- **Behavior**:
  - Type-ahead suggestions after 3 characters
  - Categorized results (Activities, Projects, Methodologies, Documents)
  - Recent searches displayed on focus
  - Keyboard navigation (arrow keys, enter, escape)
- **Advanced Search**: Expandable panel with filters
  - Date range
  - Cluster/family
  - Status
  - Geographic region
  - Credit range

### 2.4 Breadcrumb Navigation

#### Structure
```
Home > Nature-based > ARR > Amazon Reforestation Project > Calculation #3
```

#### Behavior
- Each segment clickable to navigate up hierarchy
- Current page not clickable (plain text)
- Truncate long names with ellipsis
- Show full name on hover
- Mobile: Show only parent and current

---

## 3. ACTIVITY CREATION WORKFLOW

### 3.1 Wizard Overview

The activity creation process uses a multi-step wizard pattern to guide users through complex methodology configuration. The wizard adapts dynamically based on selected cluster and methodology.

#### Wizard Steps (Standard Flow)
1. **Select Cluster & Methodology** (Required)
2. **Project Information** (Required)
3. **Geographic Boundaries** (Required)
4. **Baseline Scenario** (Required)
5. **Activity Data Input** (Required)
6. **Review & Calculate** (Required)
7. **Save & Submit** (Required)

#### Wizard Navigation
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                    Save as Draft │ Next → │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1      Step 2      Step 3      Step 4      Step 5        │
│  [====]──────[    ]──────[    ]──────[    ]──────[    ]        │
│  Complete    Pending    Pending    Pending    Pending          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                    STEP CONTENT                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step Progress Indicators
- **Completed**: Green checkmark, clickable to revisit
- **Current**: Blue highlight with progress animation
- **Pending**: Gray, disabled until prerequisites met
- **Error**: Red indicator with error count badge
- **Validation**: Real-time validation with inline error messages

### 3.2 Step 1: Select Cluster & Methodology

#### Purpose
Guide user to select the appropriate methodology for their carbon credit activity.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ SELECT ACTIVITY TYPE                                            │
│                                                                 │
│  Filter: [All Families ▼] [Search methodologies...    ]        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🌳 NATURE-BASED SOLUTIONS                               │   │
│  │                                                         │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │   │
│  │  │ 🌱 ARR      │ │ 🌲 IFM      │ │ 🛡️ REDD+    │       │   │
│  │  │             │ │             │ │             │       │   │
│  │  │ Afforest-   │ │ Improved    │ │ Reduce      │       │   │
│  │  │ ation &     │ │ Forest      │ │ Emissions   │       │   │
│  │  │ Reforest-   │ │ Management  │ │ from        │       │   │
│  │  │ ation       │ │             │ │ Deforest-   │       │   │
│  │  │             │ │             │ │ ation       │       │   │
│  │  │ [Select ▼]  │ │ [Select ▼]  │ │ [Select ▼]  │       │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ METHODOLOGY DETAILS                                     │   │
│  │                                                         │   │
│  │ Selected: VM0047 - Afforestation, Reforestation and     │   │
│  │           Revegetation (ARR) v2.0                       │   │
│  │                                                         │   │
│  │ Applicability: Projects that establish forest cover on  │   │
│  │ previously non-forested land...                         │   │
│  │                                                         │   │
│  │ Required Data:                                          │   │
│  │  • Geographic boundaries (polygon)                      │   │
│  │  • Species composition and planting density             │   │
│  │  • Growth curves or allometric equations                │   │
│  │  • Soil carbon baseline (optional)                      │   │
│  │                                                         │   │
│  │ Estimated Time: 45-60 minutes                           │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Cluster Selection Cards
- **Visual Design**: Large clickable cards with icon, title, description
- **Interactions**:
  - Hover: Elevate card, show shadow
  - Click: Expand to show methodology options
  - Select: Highlight with border, show details panel
- **Content**:
  - Icon representing cluster
  - Cluster name and acronym
  - Brief description (2 lines max)
  - Dropdown for methodology selection
  - Activity count (if existing activities)

#### Methodology Selection Dropdown
- **Content**: Versioned methodology list
- **Grouping**: By standard (VCS, Gold Standard, CAR, etc.)
- **Search**: Filter within dropdown
- **Details**: Show applicability conditions, required data, estimated time

#### Validation Rules
- Cluster selection required
- Methodology selection required
- Compatibility check with user permissions

### 3.3 Step 2: Project Information

#### Purpose
Capture essential project metadata and organizational details.

#### Form Fields

| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| Activity Name | Text | Yes | 3-100 chars, unique | - |
| Project ID | Text | No | Alphanumeric | Auto-generated |
| Project Developer | Text | Yes | - | Org name |
| Contact Person | Text | Yes | - | Current user |
| Contact Email | Email | Yes | Valid email format | User email |
| Project Start Date | Date | Yes | Not future date | - |
| Project End Date | Date | Yes | After start date | +20 years |
| Crediting Period | Number | Yes | 1-30 years | 10 |
| Project Description | Textarea | Yes | 50-2000 chars | - |
| Standard/Registry | Select | Yes | VCS, GS, CAR, ACR | VCS |
| Host Country | Select | Yes | ISO country list | - |
| Project Scale | Select | Yes | Micro, Small, Large | - |
| Previous Registration | Checkbox | No | Boolean | False |
| Previous ID | Text | Conditional | If checkbox true | - |

#### Form Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT INFORMATION                                             │
│                                                                 │
│  BASIC DETAILS                                          [?]    │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │ Activity Name *         │  │ Project ID              │      │
│  │ [                     ] │  │ [AUTO-12345      ]      │      │
│  │ Required, unique name   │  │ Auto-generated          │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │ Project Developer *     │  │ Contact Person *        │      │
│  │ [                     ] │  │ [                     ] │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │ Contact Email *         │  │ Host Country *          │      │
│  │ [                     ] │  │ [Select Country    ▼]   │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                 │
│  PROJECT TIMELINE                                       [?]    │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │ Start Date *            │  │ End Date *              │      │
│  │ [📅 01/01/2024  ]       │  │ [📅 12/31/2043  ]       │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                 │
│  ┌─────────────────────────┐                                    │
│  │ Crediting Period (years)│                                    │
│  │ [◄ 10 ►]                │                                    │
│  │ Slider: 1-30 years      │                                    │
│  └─────────────────────────┘                                    │
│                                                                 │
│  REGISTRATION DETAILS                                   [?]    │
│  ┌─────────────────────────┐  ┌─────────────────────────┐      │
│  │ Standard/Registry *     │  │ Project Scale *         │      │
│  │ [VCS ▼]                 │  │ [Large ▼]               │      │
│  └─────────────────────────┘  └─────────────────────────┘      │
│                                                                 │
│  [ ] This project was previously registered                    │
│      Previous Registration ID: [                  ]            │
│                                                                 │
│  PROJECT DESCRIPTION                                    [?]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Describe the project activities, objectives, and       │   │
│  │ expected outcomes...                                    │   │
│  │                                                         │   │
│  │                                                         │   │
│  │                              0/2000 characters          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Field Help Tooltips
- **Activity Name**: "Choose a descriptive name that uniquely identifies this activity"
- **Crediting Period**: "The time period over which carbon credits will be issued"
- **Project Scale**: "Determines validation requirements and fee structure"

#### Validation Messages
- Inline validation on blur
- Error summary at top of form
- Prevent progression until all errors resolved
- Warning for unusual values (e.g., crediting period > 20 years)

### 3.4 Step 3: Geographic Boundaries

#### Purpose
Define the spatial extent of the project activity.

#### Interface Components

##### Map Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ GEOGRAPHIC BOUNDARIES                                           │
│                                                                 │
│  ┌─────────────────────────────────────┐  ┌─────────────────┐  │
│  │                                     │  │ BOUNDARY TYPE   │  │
│  │         INTERACTIVE MAP             │  │                 │  │
│  │                                     │  │ ○ Project Area  │  │
│  │    ┌─────────┐                      │  │ ● Leakage Belt  │  │
│  │    │ POLYGON │                      │  │ ○ Buffer Zone   │  │
│  │    │  DRAW   │                      │  │                 │  │
│  │    └─────────┘                      │  │ COORDINATES     │  │
│  │                                     │  │                 │  │
│  │  [Satellite] [Terrain] [Street]    │  │ Lat: -3.4567    │  │
│  │                                     │  │ Long: -60.1234  │  │
│  │  [+] [-] [⌂] [↔]                   │  │                 │  │
│  │                                     │  │ Area: 1,250 ha  │  │
│  └─────────────────────────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ UPLOAD BOUNDARY FILE                                    │   │
│  │                                                         │   │
│  │ Drag & drop GeoJSON, Shapefile (.zip), or KML          │   │
│  │ [Browse Files]                                          │   │
│  │                                                         │   │
│  │ Supported formats: GeoJSON, Shapefile, KML, GeoPackage │   │
│  │ Max file size: 50 MB                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ BOUNDARY SUMMARY                                        │   │
│  │                                                         │   │
│  │ Total Area: 1,250 hectares                              │   │
│  │ Perimeter: 45.2 km                                      │   │
│  │ Centroid: -3.4567°S, -60.1234°W                         │   │
│  │ Overlap Check: ✓ No conflicts detected                  │   │
│  │                                                         │   │
│  │ [View Details] [Edit Polygon] [Clear All]              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Map Drawing Tools
- **Polygon Tool**: Click to create vertices, double-click to close
- **Rectangle Tool**: Drag to create rectangular boundary
- **Circle Tool**: Define center point and radius
- **Edit Mode**: Drag vertices to adjust shape
- **Delete Mode**: Remove vertices or entire shapes

##### Coordinate Input Table
| Point | Latitude | Longitude | Elevation (m) | Actions |
|-------|----------|-----------|---------------|---------|
| 1 | -3.4567 | -60.1234 | 145 | [Edit] [Delete] |
| 2 | -3.4578 | -60.1245 | 148 | [Edit] [Delete] |
| 3 | -3.4589 | -60.1234 | 142 | [Edit] [Delete] |
| ... | ... | ... | ... | ... |

##### File Upload Specifications
- **Formats**: GeoJSON (.geojson), Shapefile (.zip), KML (.kml), GeoPackage (.gpkg)
- **Max Size**: 50 MB
- **Validation**:
  - Valid geometry (no self-intersections)
  - Coordinate system (auto-detect, convert if needed)
  - Attribute table (optional, map to project fields)
  - Topology check (no overlaps with existing projects)

##### Area Calculations
- Auto-calculate area in hectares and acres
- Display on map with label
- Update in real-time as polygon edited
- Warning if area outside typical range for methodology

### 3.5 Step 4: Baseline Scenario Configuration

#### Purpose
Define the counterfactual scenario against which emission reductions will be measured.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ BASELINE SCENARIO CONFIGURATION                                 │
│                                                                 │
│  BASELINE APPROACH                                        [?]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ Historical baseline (observed pre-project data)       │   │
│  │ ● Project-specific baseline (modeled counterfactual)    │   │
│  │ ○ Performance standard (technology-based benchmark)     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  HISTORICAL LAND USE                                      [?]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ What was the land use prior to project implementation?  │   │
│  │                                                         │   │
│  │ [Select land use type ▼]                                │   │
│  │                                                         │   │
│  │ ○ Primary forest       ○ Secondary forest              │   │
│  │ ○ Cropland             ○ Grassland                     │   │
│  │ ○ Degraded land        ○ Shrubland                     │   │
│  │ ○ Other: [Specify                                    ] │   │
│  │                                                         │   │
│  │ Years at this land use state: [    ] years             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  BASELINE CARBON STOCKS                                   [?]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Carbon Pool                        | tCO2e/ha | Source  │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Above-ground biomass               | [      ] | [▼]    │   │
│  │ Below-ground biomass               | [      ] | [▼]    │   │
│  │ Dead wood                          | [      ] | [▼]    │   │
│  │ Litter                             | [      ] | [▼]    │   │
│  │ Soil organic carbon (0-30cm)       | [      ] | [▼]    │   │
│  │ Soil organic carbon (30-100cm)     | [      ] | [▼]    │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Total Baseline Carbon Stock        | 0.00     |         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  CARBON STOCK SOURCE OPTIONS                              [?]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Field measurements (inventory data)                   │   │
│  │ • Remote sensing analysis                               │   │
│  │ • Default values (IPCC Tier 1)                          │   │
│  │ • Published literature                                  │   │
│  │ • National forest inventory                             │   │
│  │ • Other: [Specify                                     ] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  BASELINE SCENARIO DESCRIPTION                            [?]    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Describe the most likely baseline scenario without     │   │
│  │ the project intervention...                             │   │
│  │                                                         │   │
│  │                                                         │   │
│  │                              0/1000 characters          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Baseline Approach Selection
- **Historical**: Use observed pre-project data
- **Project-specific**: Model counterfactual based on local conditions
- **Performance standard**: Use technology or practice benchmark

#### Carbon Pool Configuration
- Toggle pools on/off based on methodology requirements
- Input values with unit conversion (tCO2e/ha, tC/ha, Mg/ha)
- Source selection with documentation requirement
- Auto-calculate totals
- Uncertainty input for each pool

#### Default Value Library
- IPCC default values by region and land use type
- Searchable database
- Citation and uncertainty information
- Apply with one click

### 3.6 Step 5: Activity Data Input

This step is methodology-specific and varies significantly by cluster. See Section 4 for detailed specifications for each of the 20 activity clusters.

### 3.7 Step 6: Review & Calculate

#### Purpose
Review all inputs before executing calculation.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ REVIEW & CALCULATE                                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ COMPLETENESS CHECK                                      │   │
│  │                                                         │   │
│  │ ✓ Step 1: Cluster & Methodology    Complete            │   │
│  │ ✓ Step 2: Project Information      Complete            │   │
│  │ ✓ Step 3: Geographic Boundaries    Complete            │   │
│  │ ✓ Step 4: Baseline Scenario        Complete            │   │
│  │ ✓ Step 5: Activity Data            Complete            │   │
│  │                                                         │   │
│  │ All required information provided. Ready to calculate. │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ INPUT SUMMARY                                           │   │
│  │                                                         │   │
│  │ Activity: Amazon Reforestation Project                  │   │
│  │ Methodology: VM0047 ARR v2.0                            │   │
│  │ Area: 1,250 hectares                                    │   │
│  │ Crediting Period: 20 years                              │   │
│  │ Species: Acacia mangium, Eucalyptus grandis             │   │
│  │ Planting Density: 1,100 trees/ha                        │   │
│  │                                                         │   │
│  │ [View All Inputs] [Edit Any Step]                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CALCULATION OPTIONS                                     │   │
│  │                                                         │   │
│  │ [✓] Include uncertainty analysis                        │   │
│  │ [✓] Generate detailed report                            │   │
│  │ [ ] Sensitivity analysis (may take longer)              │   │
│  │                                                         │   │
│  │ Confidence Level: [95% ▼]                               │   │
│  │                                                         │   │
│  │ Estimated Calculation Time: 2-3 minutes                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                    [    RUN CALCULATION    ]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Pre-Calculation Validation
- Completeness check for all required fields
- Data range validation
- Cross-field consistency checks
- Warning for unusual values
- Error list with links to fix

#### Calculation Options
- Uncertainty analysis toggle
- Sensitivity analysis toggle
- Confidence level selection (90%, 95%, 99%)
- Report generation options

### 3.8 Step 7: Save & Submit

#### Purpose
Finalize activity and save to system.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ CALCULATION COMPLETE                                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ RESULTS SUMMARY                                         │   │
│  │                                                         │   │
│  │ Total Carbon Credits: 45,230 tCO2e                      │   │
│  │ (over 20-year crediting period)                         │   │
│  │                                                         │   │
│  │ Average Annual Credits: 2,262 tCO2e/year                │   │
│  │                                                         │   │
│  │ Uncertainty Range: 40,700 - 49,760 tCO2e (95% CI)       │   │
│  │                                                         │   │
│  │ [View Detailed Results] [Download Report]              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ NEXT STEPS                                              │   │
│  │                                                         │   │
│  │ What would you like to do with this activity?          │   │
│  │                                                         │   │
│  │ [Save as Draft]                                         │   │
│  │    Continue editing later. Not visible to verifiers.   │   │
│  │                                                         │   │
│  │ [Submit for Review]                                     │   │
│  │    Send to internal technical review.                  │   │
│  │                                                         │   │
│  │ [Submit for Verification]                               │   │
│  │    Send to third-party verifier for audit.             │   │
│  │                                                         │   │
│  │ [Create Another Activity]                               │   │
│  │    Start a new activity using similar inputs.          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---


## 4. DATA INPUT MODULES BY CLUSTER

### 4.1 NATURE-BASED SOLUTIONS

---

#### 4.1.1 ARR - Afforestation, Reforestation, Revegetation

##### Overview
ARR activities involve establishing forest cover on previously non-forested or degraded land. The UI must support multiple planting scenarios, growth modeling, and carbon pool tracking.

##### Input Form Structure

###### Section A: Planting Configuration

| Field | Type | Required | Validation | Unit |
|-------|------|----------|------------|------|
| Planting Date | Date | Yes | Not future | - |
| Planting Method | Select | Yes | - | - |
| Total Planting Area | Number | Yes | > 0 | hectares |
| Number of Strata | Number | Yes | 1-20 | count |

**Planting Method Options:**
- Direct seeding
- Seedling planting (containerized)
- Seedling planting (bare root)
- Natural regeneration (assisted)
- Enrichment planting
- Agroforestry (mixed)

###### Section B: Stratum Definition (Repeatable)

```
┌─────────────────────────────────────────────────────────────────┐
│ STRATUM 1: Primary Planting Area                                │
│                                                                 │
│  Stratum Name: [Primary Planting Area                    ]     │
│  Area: [1,000] hectares                                         │
│  Percent of Total: 80%                                          │
│                                                                 │
│  SPECIES COMPOSITION                                            │
│  ┌─────────────────┬─────────────┬────────────┬──────────┐     │
│  │ Species         │ Percentage  │ Density    │ Actions  │     │
│  ├─────────────────┼─────────────┼────────────┼──────────┤     │
│  │ Acacia mangium  │ 60%         │ 660/ha     │ [Edit]   │     │
│  │ Eucalyptus gra..│ 40%         │ 440/ha     │ [Edit]   │     │
│  ├─────────────────┼─────────────┼────────────┼──────────┤     │
│  │ Total           │ 100%        │ 1,100/ha   │ [+ Add]  │     │
│  └─────────────────┴─────────────┴────────────┴──────────┘     │
│                                                                 │
│  GROWTH MODEL                                                   │
│  [Select Growth Model ▼]                                        │
│  ○ Use default IPCC growth curves                               │
│  ● Upload custom allometric equations                           │
│  ○ Use published regional equations                             │
│                                                                 │
│  [Upload Allometric Equations]                                  │
│  File: allometric_equations_stratum1.xlsx (Uploaded)           │
│                                                                 │
│  [+ Add Another Stratum]  [Remove Stratum]                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Species Input Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Species Name | Search/Select | Yes | Link to species database |
| Scientific Name | Auto | - | Populated from database |
| Percentage | Number | Yes | 0-100%, must sum to 100% |
| Planting Density | Number | Yes | trees/hectare |
| Survival Rate | Number | Yes | 0-100%, default 85% |
| Wood Density | Number | Conditional | t/m³, auto from database |
| Biomass Expansion | Number | Conditional | Auto from database |
| Root:Shoot Ratio | Number | Conditional | Auto from database |

###### Section C: Growth Curve Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ GROWTH CURVE: Acacia mangium                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │     Biomass (tCO2e/ha)                                  │   │
│  │  200 ┤                                          ╭────    │   │
│  │      │                                    ╭────╯        │   │
│  │  150 ┤                              ╭────╯             │   │
│  │      │                        ╭────╯                    │   │
│  │  100 ┤                  ╭────╯                         │   │
│  │      │            ╭────╯                              │   │
│  │   50 ┤      ╭────╯                                   │   │
│  │      │ ╭────╯                                        │   │
│  │    0 ┼─┴────┬────┬────┬────┬────┬────┬────┬────┬────┤   │
│  │      0    5   10   15   20   25   30   35   40   45   │   │
│  │                    Age (years)                        │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  GROWTH CURVE DATA TABLE                                        │
│  ┌──────┬─────────────────┬─────────────────┬────────────────┐ │
│  │ Age  │ Above-ground    │ Below-ground    │ Total          │ │
│  │ (yr) │ (tCO2e/ha)      │ (tCO2e/ha)      │ (tCO2e/ha)     │ │
│  ├──────┼─────────────────┼─────────────────┼────────────────┤ │
│  │ 0    │ 0.0             │ 0.0             │ 0.0            │ │
│  │ 5    │ 25.4            │ 5.1             │ 30.5           │ │
│  │ 10   │ 78.2            │ 15.6            │ 93.8           │ │
│  │ 15   │ 142.6           │ 28.5            │ 171.1          │ │
│  │ 20   │ 189.3           │ 37.9            │ 227.2          │ │
│  │ ...  │ ...             │ ...             │ ...            │ │
│  └──────┴─────────────────┴─────────────────┴────────────────┘ │
│                                                                 │
│  [Edit Values] [Import from File] [Use Default] [Export]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Growth Curve Input Options:**
- Manual entry (year-by-year)
- Import from CSV/Excel
- Use default curves (by species and region)
- Fit curve to measured data points
- Chapman-Richards, Logistic, or Gompertz models

###### Section D: Carbon Pools

| Carbon Pool | Required | Input Method | Default |
|-------------|----------|--------------|---------|
| Above-ground biomass | Yes | Growth curve | - |
| Below-ground biomass | Yes | Root:shoot ratio | 0.20 |
| Dead wood | Optional | Default or measured | 0 |
| Litter | Optional | Default or measured | 0 |
| Soil organic carbon | Optional | Sampling or default | Regional |
| Harvested wood products | Optional | Fate analysis | 0 |

###### Section E: Disturbance Events

```
┌─────────────────────────────────────────────────────────────────┐
│ DISTURBANCE EVENTS                                              │
│                                                                 │
│  [+ Add Disturbance Event]                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Event 1: Fire (2025)                                    │   │
│  │                                                         │   │
│  │ Date: [📅 03/15/2025  ]                                 │   │
│  │ Type: [Fire ▼]                                          │   │
│  │ Affected Area: [250] hectares                           │   │
│  │ Severity: [High ▼]                                      │   │
│  │ Carbon Impact: -12,450 tCO2e                            │   │
│  │                                                         │   │
│  │ Documentation: fire_report_2025.pdf (Uploaded)         │   │
│  │                                                         │   │
│  │ [Edit] [Remove]                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Disturbance Types: Fire, Pest/Disease, Windthrow, Harvest,    │
│                     Drought, Flood, Other                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Species percentage | Sum must equal 100% | "Species percentages must total 100%" |
| Planting density | 50-10,000 trees/ha | "Density outside typical range" |
| Survival rate | 0-100% | "Survival rate must be between 0-100%" |
| Growth curve | Must cover crediting period | "Growth curve must extend to year {end}" |
| Stratum area | Sum must equal total area | "Stratum areas must sum to total area" |
| Disturbance area | Cannot exceed stratum area | "Disturbance area exceeds stratum area" |

##### Batch Import Template

CSV columns for ARR batch import:
```
project_id, stratum_name, species_name, percentage, planting_density, 
survival_rate, planting_date, area_hectares, growth_curve_source
```

---

#### 4.1.2 IFM - Improved Forest Management

##### Overview
IFM activities enhance carbon stocks through improved forest management practices including extended rotations, reduced impact logging, and conversion avoidance.

##### Input Form Structure

###### Section A: Management Practice Selection

| Practice | Description | Required Data |
|----------|-------------|---------------|
| Extended Rotation | Lengthen harvest cycles | Current/max rotation, growth rates |
| Reduced Impact Logging | Minimize damage during harvest | Logging intensity, damage factors |
| Conversion Avoidance | Prevent deforestation | Threat analysis, baseline scenario |
| Stocking Enhancement | Increase stand density | Current/target stocking, growth |
| Other | Custom practice | Practice description, parameters |

```
┌─────────────────────────────────────────────────────────────────┐
│ MANAGEMENT PRACTICE                                             │
│                                                                 │
│  Select the improved forest management practice(s):            │
│                                                                 │
│  [✓] Extended rotation length                                   │
│  [✓] Reduced impact logging                                    │
│  [ ] Conversion avoidance                                       │
│  [ ] Stocking density enhancement                               │
│  [ ] Other: [Specify practice                           ]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Stand Characteristics

```
┌─────────────────────────────────────────────────────────────────┐
│ STAND CHARACTERISTICS                                           │
│                                                                 │
│  STAND INVENTORY DATA                                           │
│  ┌─────────────────┬─────────────┬────────────┬──────────┐     │
│  │ Parameter       │ Baseline    │ Project    │ Unit     │     │
│  ├─────────────────┼─────────────┼────────────┼──────────┤     │
│  │ Stand Age       │ [45       ] │ [45      ] │ years    │     │
│  │ Basal Area      │ [28.5     ] │ [28.5    ] │ m²/ha    │     │
│  │ Mean DBH        │ [32.4     ] │ [32.4    ] │ cm       │     │
│  │ Stocking Density│ [450      ] │ [450     ] │ trees/ha │     │
│  │ Standing Volume │ [245      ] │ [245     ] │ m³/ha    │     │
│  │ Site Index      │ [18.5     ] │ [18.5    ] │ m        │     │
│  └─────────────────┴─────────────┴────────────┴──────────┘     │
│                                                                 │
│  SPECIES COMPOSITION (Top 5 species by volume)                 │
│  ┌─────────────────┬─────────────┬─────────────────────────┐   │
│  │ Species         │ Volume %    │ Wood Density (t/m³)     │   │
│  ├─────────────────┼─────────────┼─────────────────────────┤   │
│  │ [Search...    ] │ [45       ]│ [0.55      ]            │   │
│  │ [Search...    ] │ [30       ]│ [0.48      ]            │   │
│  │ [Search...    ] │ [15       ]│ [0.62      ]            │   │
│  │ [Search...    ] │ [7        ]│ [0.50      ]            │   │
│  │ [Search...    ] │ [3        ]│ [0.58      ]            │   │
│  └─────────────────┴─────────────┴─────────────────────────┘   │
│                                                                 │
│  [Import Inventory Data] [Download Template]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Extended Rotation Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ EXTENDED ROTATION CONFIGURATION                                 │
│                                                                 │
│  Baseline Rotation Length: [60] years                          │
│  Project Rotation Length: [80] years                           │
│  Extension: +20 years                                           │
│                                                                 │
│  HARVEST SCHEDULE COMPARISON                                    │
│  ┌──────────┬─────────────────────┬─────────────────────┐      │
│  │ Harvest  │ Baseline Scenario   │ Project Scenario    │      │
│  ├──────────┼─────────────────────┼─────────────────────┤      │
│  │ 1        │ Year 60             │ Year 80             │      │
│  │ 2        │ Year 120            │ Year 160            │      │
│  │ 3        │ Year 180            │ Year 240            │      │
│  └──────────┴─────────────────────┴─────────────────────┘      │
│                                                                 │
│  VOLUME COMPARISON                                              │
│  ┌──────────┬─────────────┬─────────────┬──────────────────┐   │
│  │ Scenario │ Harvest Vol │ Remaining   │ Total Carbon     │   │
│  │          │ (m³/ha)     │ Stock       │ Stock (tCO2e/ha) │   │
│  ├──────────┼─────────────┼─────────────┼──────────────────┤   │
│  │ Baseline │ 245         │ 0           │ 445              │   │
│  │ Project  │ 312         │ 89          │ 623              │   │
│  │ Difference│ +67        │ +89         │ +178             │   │
│  └──────────┴─────────────┴─────────────┴──────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section D: Reduced Impact Logging Parameters

| Parameter | Input | Unit | Default |
|-----------|-------|------|---------|
| Logging Intensity | Number | m³/ha | - |
| Harvested Volume | Number | m³/ha | - |
| Skid Trail Width | Number | meters | 4 |
| Skid Trail Length | Number | m/ha | 150 |
| Landing Area | Number | m²/ha | 200 |
| Canopy Opening | Number | percent | 15 |
| Damage Factor (residual) | Number | percent | 25 |
| Damage Factor (RIL) | Number | percent | 10 |

```
┌─────────────────────────────────────────────────────────────────┐
│ REDUCED IMPACT LOGGING PARAMETERS                               │
│                                                                 │
│  BASELINE (Conventional Logging)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Logging Intensity: [35] m³/ha                           │   │
│  │ Canopy Opening: [35] %                                  │   │
│  │ Residual Stand Damage: [45] %                           │   │
│  │ Soil Compaction Area: [12] %                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  PROJECT (Reduced Impact Logging)                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Logging Intensity: [35] m³/ha (same)                    │   │
│  │ Canopy Opening: [18] %                                  │   │
│  │ Residual Stand Damage: [18] %                           │   │
│  │ Soil Compaction Area: [5] %                             │   │
│  │                                                         │   │
│  │ RIL Techniques Applied:                                 │   │
│  │ [✓] Pre-harvest inventory                               │   │
│  │ [✓] Vine cutting                                        │   │
│  │ [✓] Directional felling                                 │   │
│  │ [✓] Planned skid trails                                 │   │
│  │ [✓] Winching instead of skidding where possible        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Expected Emission Reduction: 12.5 tCO2e/ha per harvest        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Rotation extension | Project > Baseline | "Project rotation must exceed baseline" |
| Logging intensity | < Standing volume | "Harvest cannot exceed standing volume" |
| Damage factors | 0-100% | "Damage factor must be 0-100%" |
| Species volume % | Sum = 100% | "Species composition must total 100%" |

---

#### 4.1.3 REDD+ - Reducing Emissions from Deforestation and Forest Degradation

##### Overview
REDD+ activities prevent deforestation and forest degradation. The UI must support multiple REDD+ approaches (frontier, mosaic, planned) and handle complex baseline/reference level calculations.

##### Input Form Structure

###### Section A: REDD+ Approach Selection

```
┌─────────────────────────────────────────────────────────────────┐
│ REDD+ APPROACH TYPE                                             │
│                                                                 │
│  Select the REDD+ implementation approach:                      │
│                                                                 │
│  ○ Frontier Deforestation                                       │
│    Large-scale clearing at forest edge, typically for           │
│    agriculture or pasture                                       │
│                                                                 │
│  ● Mosaic Deforestation                                         │
│    Patchy clearing within forest matrix, smallholder            │
│    agriculture, selective logging                               │
│                                                                 │
│  ○ Planned Deforestation                                        │
│    Large infrastructure projects, settlements, mining           │
│                                                                 │
│  ○ Nested REDD+                                                 │
│    Multiple sub-projects under a jurisdictional program         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Reference Level / Baseline

```
┌─────────────────────────────────────────────────────────────────┐
│ REFERENCE LEVEL CALCULATION                                     │
│                                                                 │
│  HISTORICAL DEFORESTATION RATE                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Historical Period: [2000] to [2020]                     │   │
│  │                                                         │   │
│  │ Historical Deforestation Rate: [1.25] %/year            │   │
│  │ Source: [Remote sensing analysis ▼]                     │   │
│  │                                                         │   │
│  │ [Upload Historical Analysis]                            │   │
│  │ File: historical_deforestation_2000_2020.zip           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  REFERENCE LEVEL ADJUSTMENTS                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Adjustment Factor                                       │   │
│  │                                                         │   │
│  │ [✓] Adjust for national circumstances                   │   │
│  │     Factor: [0.85] (85% of historical rate)            │   │
│  │                                                         │   │
│  │ [✓] Adjust for development needs                        │   │
│  │     Factor: [1.10] (110% of historical rate)           │   │
│  │                                                         │   │
│  │ Final Reference Level: [1.17] %/year                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  CARBON STOCK IN DEFORESTED AREAS                               │
│  ┌─────────────────────────┬─────────────┬──────────────────┐  │
│  │ Land Use Class          │ Area (ha)   │ Carbon (tCO2e/ha)│  │
│  ├─────────────────────────┼─────────────┼──────────────────┤  │
│  │ Primary forest          │ [5,000    ] │ [185        ]   │  │
│  │ Secondary forest        │ [3,500    ] │ [95         ]   │  │
│  │ Degraded forest         │ [1,500    ] │ [45         ]   │  │
│  └─────────────────────────┴─────────────┴──────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Activity Data (Deforestation Monitoring)

```
┌─────────────────────────────────────────────────────────────────┐
│ DEFORESTATION MONITORING DATA                                   │
│                                                                 │
│  MONITORING PERIOD: 2020-2024                                   │
│                                                                 │
│  ┌──────┬─────────────────┬───────────────┬──────────────────┐ │
│  │ Year │ Forest Area (ha)│ Deforested(ha)│ Annual Rate (%)  │ │
│  ├──────┼─────────────────┼───────────────┼──────────────────┤ │
│  │ 2020 │ 10,000.0        │ -             │ -                │ │
│  │ 2021 │ 9,875.0         │ 125.0         │ 1.25             │ │
│  │ 2022 │ 9,753.1         │ 121.9         │ 1.23             │ │
│  │ 2023 │ 9,635.6         │ 117.5         │ 1.21             │ │
│  │ 2024 │ 9,521.4         │ 114.2         │ 1.19             │ │
│  └──────┴─────────────────┴───────────────┴──────────────────┘ │
│                                                                 │
│  MONITORING METHOD: [Remote sensing (Landsat/Sentinel) ▼]      │
│  VALIDATION: [Ground truthing sample ▼]                        │
│  UNCERTAINTY: [±8.5] %                                          │
│                                                                 │
│  [Upload Monitoring Data] [Download Template]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section D: Leakage Assessment

```
┌─────────────────────────────────────────────────────────────────┐
│ LEAKAGE ASSESSMENT                                              │
│                                                                 │
│  Leakage Belt Width: [10] km                                   │
│  Leakage Belt Area: [15,250] hectares                          │
│                                                                 │
│  LEAKAGE MONITORING                                             │
│  ┌──────┬─────────────────┬─────────────────┬────────────────┐ │
│  │ Year │ Leakage Belt    │ Deforestation   │ Leakage Factor │ │
│  │      │ Forest Area (ha)│ Rate (%)        │                │ │
│  ├──────┼─────────────────┼─────────────────┼────────────────┤ │
│  │ 2020 │ 15,250          │ 1.30            │ Baseline       │ │
│  │ 2021 │ 15,041          │ 1.37            │ 1.05           │ │
│  │ 2022 │ 14,835          │ 1.37            │ 1.05           │ │
│  │ 2023 │ 14,632          │ 1.37            │ 1.05           │ │
│  │ 2024 │ 14,431          │ 1.37            │ 1.05           │ │
│  └──────┴─────────────────┴─────────────────┴────────────────┘ │
│                                                                 │
│  Leakage Deduction: [5.2] %                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Historical period | Minimum 10 years | "Historical period must be at least 10 years" |
| Deforestation rate | 0-100% | "Deforestation rate must be 0-100%" |
| Forest area | Decreasing or equal | "Forest area cannot increase without restoration" |
| Leakage factor | >= 1.0 | "Leakage factor must be >= 1.0" |

---

#### 4.1.4 Wetlands & Blue Carbon

##### Overview
Wetlands and blue carbon activities include mangrove restoration, peatland conservation, tidal marsh restoration, and seagrass protection. These ecosystems have unique carbon dynamics including significant soil carbon stocks.

##### Input Form Structure

###### Section A: Ecosystem Type Selection

```
┌─────────────────────────────────────────────────────────────────┐
│ WETLAND / BLUE CARBON ECOSYSTEM TYPE                            │
│                                                                 │
│  Select the ecosystem type:                                     │
│                                                                 │
│  ○ Mangrove Forest                                              │
│  ○ Tidal Freshwater Forest                                      │
│  ● Peatland (Tropical)                                          │
│  ○ Peatland (Temperate/Boreal)                                  │
│  ○ Tidal Marsh (Salt Marsh)                                     │
│  ○ Tidal Marsh (Freshwater)                                     │
│  ○ Seagrass Meadow                                              │
│  ○ Other: [Specify ecosystem type                      ]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Peatland-Specific Inputs (Example)

```
┌─────────────────────────────────────────────────────────────────┐
│ PEATLAND CHARACTERISTICS                                        │
│                                                                 │
│  PEAT PHYSICAL PROPERTIES                                       │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Peat Depth (average)        │ [3.5      ] │ meters         ││
│  │ Peat Depth (range)          │ [2.0-5.5  ] │ meters         ││
│  │ Bulk Density                │ [0.12     ] │ g/cm³          ││
│  │ Organic Carbon Content      │ [48       ] │ %              ││
│  │ Ash Content                 │ [8        ] │ %              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  HYDROLOGICAL CONDITIONS                                        │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Water Table Depth (dry)     │ [-0.8     ] │ meters         ││
│  │ Water Table Depth (wet)     │ [+0.1     ] │ meters         ││
│  │ Drainage Status             │ [Partially drained ▼]        ││
│  │ Drainage Canal Density      │ [250      ] │ m/km²          ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  EMISSION FACTORS                                               │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ CO2 Emission Factor         │ [15.2     ] │ tCO2e/ha/yr    ││
│  │ CH4 Emission Factor         │ [0.8      ] │ tCO2e/ha/yr    ││
│  │ Source                      │ [IPCC Wetlands ▼]            ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Mangrove-Specific Inputs

```
┌─────────────────────────────────────────────────────────────────┐
│ MANGROVE CHARACTERISTICS                                        │
│                                                                 │
│  STAND CHARACTERISTICS                                          │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Baseline    │ Project        ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Canopy Cover (%)            │ [35       ] │ [75       ]   ││
│  │ Stem Density (stems/ha)     │ [2,500    ] │ [8,000    ]   ││
│  │ Mean Height (m)             │ [3.5      ] │ [8.2      ]   ││
│  │ Mean DBH (cm)               │ [4.2      ] │ [9.8      ]   ││
│  │ Basal Area (m²/ha)          │ [3.5      ] │ [12.5     ]   ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  SPECIES COMPOSITION                                            │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Species                     │ Baseline %  │ Project %      ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Rhizophora mangle           │ [60       ] │ [45       ]   ││
│  │ Avicennia germinans         │ [30       ] │ [40       ]   ││
│  │ Laguncularia racemosa       │ [10       ] │ [15       ]   ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  SOIL CARBON POOL                                               │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Soil Carbon Stock (0-30cm)  │ [185      ] │ [185      ]   ││
│  │ Soil Carbon Stock (30-100cm)│ [285      ] │ [285      ]   ││
│  │ Soil Carbon Stock (100+cm)  │ [420      ] │ [420      ]   ││
│  │ Total Soil Carbon           │ [890      ] │ [890      ]   ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│  Units: tCO2e/ha                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section D: Restoration/Conservation Activities

```
┌─────────────────────────────────────────────────────────────────┐
│ RESTORATION/CONSERVATION ACTIVITIES                             │
│                                                                 │
│  ACTIVITY TYPE                                                  │
│  ○ Rewetting (blocking drains, raising water table)            │
│  ● Revegetation (planting native species)                      │
│  ○ Hydrological restoration (removing barriers)                │
│  ○ Sustainable use (paludiculture)                             │
│  ○ Fire prevention and control                                 │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  RESTORATION TIMELINE                                           │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Activity                    │ Start Date  │ Area (ha)      ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Drain blocking - Block 1    │ [2020-03  ] │ [150      ]   ││
│  │ Drain blocking - Block 2    │ [2021-05  ] │ [200      ]   ││
│  │ Native planting - Zone A    │ [2020-06  ] │ [100      ]   ││
│  │ Native planting - Zone B    │ [2021-09  ] │ [150      ]   ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  [+ Add Activity]                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Peat depth | 0.3-20 meters | "Peat depth outside valid range" |
| Bulk density | 0.02-0.3 g/cm³ | "Bulk density outside typical range" |
| Carbon content | 20-60% | "Carbon content outside typical range" |
| Water table | -3 to +1 meters | "Water table depth outside valid range" |
| Species % | Sum = 100% | "Species composition must total 100%" |

---

### 4.2 AGRICULTURE

---

#### 4.2.1 Soil Carbon - Cropland & Grazing Management

##### Overview
Soil carbon activities enhance carbon sequestration in agricultural soils through practices like cover cropping, reduced tillage, regenerative grazing, and nutrient management.

##### Input Form Structure

###### Section A: Land Use and Management System

```
┌─────────────────────────────────────────────────────────────────┐
│ LAND USE AND MANAGEMENT SYSTEM                                  │
│                                                                 │
│  PRIMARY LAND USE                                               │
│  ○ Cropland (annual crops)                                      │
│  ● Cropland (perennial crops)                                   │
│  ○ Grazing land (rangeland)                                     │
│  ○ Grazing land (pasture)                                       │
│  ○ Mixed crop-livestock                                         │
│  ○ Rice paddy (see Rice Cultivation module)                     │
│                                                                 │
│  MANAGEMENT PRACTICES IMPLEMENTED                               │
│  [✓] Cover crops / green manures                               │
│  [✓] Reduced tillage / no-till                                 │
│  [ ] Organic amendments (compost, manure)                      │
│  [✓] Crop residue retention                                    │
│  [ ] Rotational grazing                                        │
│  [ ] Nutrient management optimization                          │
│  [ ] Agroforestry integration                                  │
│  [ ] Other: [Specify                                     ]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Field/Parcel Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ FIELD CONFIGURATION                                             │
│                                                                 │
│  NUMBER OF FIELDS/PARCELS: [15]                                │
│  TOTAL AREA: [450] hectares                                    │
│                                                                 │
│  FIELD INVENTORY                                                │
│  ┌──────────┬──────────┬─────────────────┬───────────────────┐ │
│  │ Field ID │ Area(ha) │ Soil Type       │ Management Zone   │ │
│  ├──────────┼──────────┼─────────────────┼───────────────────┤ │
│  │ F001     │ [35    ] │ [Sandy loam ▼]  │ [Zone A ▼]        │ │
│  │ F002     │ [42    ] │ [Clay loam ▼]   │ [Zone A ▼]        │ │
│  │ F003     │ [28    ] │ [Silty clay ▼]  │ [Zone B ▼]        │ │
│  │ ...      │ ...      │ ...             │ ...               │ │
│  └──────────┴──────────┴─────────────────┴───────────────────┘ │
│                                                                 │
│  [Import Field Map] [Download Template] [+ Add Field]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Soil Carbon Baseline

```
┌─────────────────────────────────────────────────────────────────┐
│ SOIL CARBON BASELINE                                            │
│                                                                 │
│  SAMPLING PROTOCOL                                              │
│  Sampling Depth: [100] cm                                      │
│  Number of Samples: [45]                                       │
│  Sampling Date: [📅 01/15/2020  ]                              │
│                                                                 │
│  SOIL CARBON STOCK BY DEPTH                                     │
│  ┌──────────────────┬───────────────┬───────────────┬─────────┐│
│  │ Depth Layer      │ Bulk Density  │ Carbon %      │ Stock   ││
│  ├──────────────────┼───────────────┼───────────────┼─────────┤│
│  │ 0-10 cm          │ [1.25      ]  │ [2.8       ]  │ [51.5] ││
│  │ 10-30 cm         │ [1.35      ]  │ [1.9       ]  │ [62.4] ││
│  │ 30-50 cm         │ [1.42      ]  │ [1.2       ]  │ [41.4] ││
│  │ 50-100 cm        │ [1.48      ]  │ [0.6       ]  │ [43.6] ││
│  ├──────────────────┼───────────────┼───────────────┼─────────┤│
│  │ TOTAL            │               │               │ [198.9]││
│  └──────────────────┴───────────────┴───────────────┴─────────┘│
│  Units: tCO2e/ha                                                │
│                                                                 │
│  [Upload Lab Results] [Use Default Values] [View Map]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section D: Management Practice Details

```
┌─────────────────────────────────────────────────────────────────┐
│ MANAGEMENT PRACTICE DETAILS                                     │
│                                                                 │
│  COVER CROPS                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Baseline: [No cover crops ▼]                            │   │
│  │ Project: [Multi-species mix ▼]                          │   │
│  │                                                         │   │
│  │ Cover Crop Species:                                     │   │
│  │ [✓] Cereal rye          [✓] Crimson clover             │   │
│  │ [✓] Hairy vetch         [ ] Austrian winter pea        │   │
│  │ [ ] Other: [Specify                                 ]   │   │
│  │                                                         │   │
│  │ Planting Date: [📅 10/15/2020  ]                        │   │
│  │ Termination Date: [📅 04/01/2021  ]                     │   │
│  │ Growth Period: [168] days                               │   │
│  │ Biomass Production: [3.5] t DM/ha                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TILLAGE PRACTICE                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Baseline: [Conventional tillage (moldboard plow) ▼]    │   │
│  │ Project: [No-till ▼]                                    │   │
│  │                                                         │   │
│  │ Tillage Events per Year:                                │   │
│  │ Baseline: [3]    Project: [0]                           │   │
│  │                                                         │   │
│  │ Tillage Depth:                                          │   │
│  │ Baseline: [25] cm    Project: [0] cm                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ORGANIC AMENDMENTS                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Amendment Type: [Compost ▼]                             │   │
│  │ Application Rate: [5] t/ha (dry weight)                 │   │
│  │ Application Frequency: [Annual ▼]                       │   │
│  │ Carbon Content: [35] %                                  │   │
│  │ Stability Factor: [0.15] (15% remains after 100 years) │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Field area | Sum = total area | "Field areas must sum to total" |
| Soil carbon % | 0.1-50% | "Carbon % outside valid range" |
| Bulk density | 0.5-2.0 g/cm³ | "Bulk density outside valid range" |
| Tillage depth | 0-50 cm | "Tillage depth outside valid range" |
| Amendment rate | 0-50 t/ha | "Application rate outside typical range" |

---

#### 4.2.2 Livestock Methane - Digesters, Manure Management, Enteric

##### Overview
Livestock methane activities reduce emissions through anaerobic digesters, improved manure management, feed additives, and other enteric fermentation interventions.

##### Input Form Structure

###### Section A: Livestock Inventory

```
┌─────────────────────────────────────────────────────────────────┐
│ LIVESTOCK INVENTORY                                             │
│                                                                 │
│  ANIMAL TYPE: [Dairy Cattle ▼]                                  │
│                                                                 │
│  HERD COMPOSITION                                               │
│  ┌──────────────────┬─────────────┬─────────────┬──────────────┐│
│  │ Animal Category  │ Baseline    │ Project     │ Weight (kg)  ││
│  ├──────────────────┼─────────────┼─────────────┼──────────────┤│
│  │ Mature Dairy Cows│ [500      ] │ [500      ] │ [650      ] ││
│  │ Heifers (>2yr)   │ [120      ] │ [120      ] │ [450      ] ││
│  │ Heifers (1-2yr)  │ [150      ] │ [150      ] │ [320      ] ││
│  │ Calves (<1yr)    │ [200      ] │ [200      ] │ [180      ] ││
│  │ Bulls            │ [15       ] │ [15       ] │ [850      ] ││
│  ├──────────────────┼─────────────┼─────────────┼──────────────┤│
│  │ Total            │ [985      ] │ [985      ] │              ││
│  └──────────────────┴─────────────┴─────────────┴──────────────┘│
│                                                                 │
│  ANIMAL DAYS PER YEAR                                           │
│  Average days on farm: [365] (account for turnover)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Manure Management System

```
┌─────────────────────────────────────────────────────────────────┐
│ MANURE MANAGEMENT SYSTEM                                        │
│                                                                 │
│  BASELINE MANURE MANAGEMENT                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Management System: [Anaerobic lagoon ▼]                 │   │
│  │                                                         │   │
│  │ Manure Allocation (%):                                  │   │
│  │ Anaerobic Lagoon: [60] %                                │   │
│  │ Liquid/Slurry: [25] %                                   │   │
│  │ Solid Storage: [10] %                                   │   │
│  │ Daily Spread: [5] %                                     │   │
│  │ Pasture/Range: [0] %                                    │   │
│  │ Other: [0] %                                            │   │
│  │                                                         │   │
│  │ Average Annual Temperature: [18] °C                     │   │
│  │ Volatile Solids Excretion: [5.2] kg/head/day            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  PROJECT MANURE MANAGEMENT                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [✓] Anaerobic Digester Installed                        │   │
│  │                                                         │   │
│  │ Digester Type: [Covered lagoon ▼]                       │   │
│  │ Installation Date: [📅 03/01/2021  ]                    │   │
│  │ Digester Volume: [15,000] m³                            │   │
│  │ Hydraulic Retention Time: [25] days                     │   │
│  │ Operating Temperature: [35] °C (mesophilic)             │   │
│  │                                                         │   │
│  │ Biogas Collection:                                      │   │
│  │ [✓] Flaring only                                        │   │
│  │ [ ] Electricity generation                              │   │
│  │ [ ] Biogas upgrading to biomethane                      │   │
│  │                                                         │   │
│  │ Methane Destruction Efficiency: [90] %                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Enteric Fermentation Interventions

```
┌─────────────────────────────────────────────────────────────────┐
│ ENTERIC FERMENTATION INTERVENTIONS                              │
│                                                                 │
│  [✓] Feed Additive Implemented                                 │
│                                                                 │
│  Additive Type: [3-NOP (3-nitrooxypropanol) ▼]                 │
│  Application Rate: [60] mg/kg DM                               │
│  Application Method: [Mixed in TMR ▼]                          │
│  Start Date: [📅 06/01/2022  ]                                 │
│                                                                 │
│  METHANE REDUCTION                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Baseline Enteric CH4: [120] kg CH4/head/year            │   │
│  │ Project Enteric CH4: [96] kg CH4/head/year              │   │
│  │ Reduction: [20] %                                       │   │
│  │                                                         │   │
│  │ Source of reduction factor:                             │   │
│  │ [Peer-reviewed study ▼]                                 │   │
│  │ Citation: [Hristov et al., 2015, PNAS]                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  FEED CHARACTERISTICS                                           │
│  ┌──────────────────┬─────────────┬─────────────┬──────────────┐│
│  │ Parameter        │ Baseline    │ Project     │ Unit         ││
│  ├──────────────────┼─────────────┼─────────────┼──────────────┤│
│  │ Dry Matter Intake│ [22       ] │ [22       ] │ kg/head/day ││
│  │ Crude Fat        │ [3.5      ] │ [4.2      ] │ % of DM     ││
│  │ NDF              │ [38       ] │ [36       ] │ % of DM     ││
│  │ Starch           │ [28       ] │ [29       ] │ % of DM     ││
│  └──────────────────┴─────────────┴─────────────┴──────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Manure allocation | Sum = 100% | "Manure allocation must total 100%" |
| Digester HRT | 10-100 days | "HRT outside typical range" |
| Methane destruction | 80-99% | "Destruction efficiency outside valid range" |
| Enteric reduction | 0-50% | "Reduction outside validated range" |
| DMI | 5-40 kg/day | "DMI outside typical range for animal type" |

---

#### 4.2.3 Rice Cultivation - AWD and Methane Reduction

##### Overview
Rice cultivation activities reduce methane emissions through alternate wetting and drying (AWD), improved water management, and other practices that reduce anaerobic conditions in paddy fields.

##### Input Form Structure

###### Section A: Rice Paddy Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ RICE PADDY CONFIGURATION                                        │
│                                                                 │
│  TOTAL PADDY AREA: [250] hectares                              │
│  NUMBER OF FIELDS: [12]                                        │
│  GROWING SEASONS PER YEAR: [2]                                 │
│                                                                 │
│  FIELD CHARACTERISTICS                                          │
│  ┌──────────┬──────────┬───────────────┬───────────┬──────────┐│
│  │ Field ID │ Area(ha) │ Soil Type     │ Elevation │ Water    ││
│  │          │          │               │ (m)       │ Source   ││
│  ├──────────┼──────────┼───────────────┼───────────┼──────────┤│
│  │ R001     │ [25    ] │ [Clay ▼]      │ [15     ] │ [Irrig ▼]││
│  │ R002     │ [30    ] │ [Clay loam ▼] │ [18     ] │ [Rain ▼] ││
│  │ ...      │ ...      │ ...           │ ...       │ ...      ││
│  └──────────┴──────────┴───────────────┴───────────┴──────────┘│
│                                                                 │
│  [Import Field Map] [+ Add Field]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Water Management Practice

```
┌─────────────────────────────────────────────────────────────────┐
│ WATER MANAGEMENT PRACTICE                                       │
│                                                                 │
│  BASELINE WATER MANAGEMENT                                      │
│  ○ Continuous flooding (entire season)                          │
│  ● Intermittent flooding (farmer practice)                      │
│  ○ Rainfed (no water control)                                   │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  Baseline Flooding Duration: [90] % of growing season          │
│                                                                 │
│  PROJECT WATER MANAGEMENT                                       │
│  ● Alternate Wetting and Drying (AWD)                           │
│  ○ Single drainage                                              │
│  ○ Multiple drainage                                            │
│  ○ Mid-season drainage                                          │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  AWD IMPLEMENTATION DETAILS                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Number of Drying Cycles: [3]                            │   │
│  │                                                         │   │
│  │ Water Level Threshold for Re-wetting: [-15] cm         │   │
│  │ (below soil surface)                                    │   │
│  │                                                         │   │
│  │ Flooding Duration: [45] % of growing season            │   │
│  │                                                         │   │
│  │ [✓] Percolation gauge (pani pipe) installed            │   │
│  │ Number of gauges: [24] (2 per field)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  WATER MANAGEMENT SCHEDULE (Example Season)                     │
│  ┌──────────────┬───────────────┬───────────────┬─────────────┐│
│  │ Growth Stage │ Days Flooded  │ Days Drained  │ Water Level ││
│  ├──────────────┼───────────────┼───────────────┼─────────────┤│
│  │ Land prep    │ [10         ] │ [5          ] │ [5        ] ││
│  │ Transplant   │ [7          ] │ [0          ] │ [5        ] ││
│  │ Tillering    │ [10         ] │ [12         ] │ [-15      ] ││
│  │ Panicle init │ [8          ] │ [0          ] │ [5        ] ││
│  │ Flowering    │ [10         ] │ [0          ] │ [5        ] ││
│  │ Maturation   │ [0          ] │ [15         ] │ [-30      ] ││
│  ├──────────────┼───────────────┼───────────────┼─────────────┤│
│  │ Total        │ [45         ] │ [32         ] │             ││
│  └──────────────┴───────────────┴───────────────┴─────────────┘│
│  Units: days; water level in cm (+ above, - below surface)     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Organic Amendments and Straw Management

```
┌─────────────────────────────────────────────────────────────────┐
│ ORGANIC AMENDMENTS AND STRAW MANAGEMENT                         │
│                                                                 │
│  ORGANIC AMENDMENTS                                             │
│  ┌──────────────────┬─────────────┬─────────────┬──────────────┐│
│  │ Amendment        │ Baseline    │ Project     │ Unit         ││
│  ├──────────────────┼─────────────┼─────────────┼──────────────┤│
│  │ Compost          │ [2.0      ] │ [2.0      ] │ t/ha/season ││
│  │ Green manure     │ [0        ] │ [1.5      ] │ t/ha/season ││
│  │ Farmyard manure  │ [1.0      ] │ [0.5      ] │ t/ha/season ││
│  │ Biochar          │ [0        ] │ [0.5      ] │ t/ha/season ││
│  └──────────────────┴─────────────┴─────────────┴──────────────┘│
│                                                                 │
│  STRAW MANAGEMENT                                               │
│  Baseline: [Incorporated in field ▼]                           │
│  Project: [Removed and composted ▼]                            │
│                                                                 │
│  Straw Production: [5.5] t/ha (dry weight)                     │
│  Straw C/N Ratio: [65]                                         │
│                                                                 │
│  METHANE EMISSION FACTORS                                       │
│  ┌──────────────────┬─────────────┬─────────────┬──────────────┐│
│  │ Source           │ Baseline    │ Project     │ Unit         ││
│  ├──────────────────┼─────────────┼─────────────┼──────────────┤│
│  │ Flooded rice     │ [180      ] │ [95       ] │ kg CH4/ha   ││
│  │ Organic amendment│ [45       ] │ [35       ] │ kg CH4/ha   ││
│  │ Straw            │ [25       ] │ [10       ] │ kg CH4/ha   ││
│  ├──────────────────┼─────────────┼─────────────┼──────────────┤│
│  │ Total            │ [250      ] │ [140      ] │ kg CH4/ha   ││
│  └──────────────────┴─────────────┴─────────────┴──────────────┘│
│                                                                 │
│  Emission Reduction: [44] %                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Flooding duration | 0-100% | "Flooding duration must be 0-100%" |
| Water level | -50 to +30 cm | "Water level outside valid range" |
| Growing season | 60-200 days | "Season length outside typical range" |
| Organic amendments | >= 0 | "Amendment rate cannot be negative" |
| Straw C/N | 20-150 | "C/N ratio outside typical range" |

---


### 4.3 ENERGY

---

#### 4.3.1 Grid Renewables - Solar, Wind, Hydro, Geothermal

##### Overview
Grid-connected renewable energy projects displace fossil fuel-based electricity generation. The UI must support various renewable technologies and handle grid emission factor calculations.

##### Input Form Structure

###### Section A: Renewable Technology Selection

```
┌─────────────────────────────────────────────────────────────────┐
│ RENEWABLE ENERGY TECHNOLOGY                                     │
│                                                                 │
│  TECHNOLOGY TYPE                                                │
│  ● Solar PV (utility-scale)                                     │
│  ○ Solar PV (rooftop/commercial)                                │
│  ○ Onshore Wind                                                 │
│  ○ Offshore Wind                                                │
│  ○ Hydroelectric (run-of-river)                                 │
│  ○ Hydroelectric (reservoir)                                    │
│  ○ Geothermal                                                   │
│  ○ Biomass power                                                │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  CAPACITY AND PERFORMANCE                                       │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Installed Capacity          │ [50       ] │ MW             ││
│  │ Annual Generation           │ [105,000  ] │ MWh/year       ││
│  │ Capacity Factor             │ [24.0     ] │ %              ││
│  │ Design Life                 │ [25       ] │ years          ││
│  │ Commercial Operation Date   │ [📅 06/01/2022  ]           ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Grid Connection and Baseline

```
┌─────────────────────────────────────────────────────────────────┐
│ GRID CONNECTION AND BASELINE EMISSIONS                          │
│                                                                 │
│  GRID CHARACTERISTICS                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Grid System: [National Grid - Country X ▼]              │   │
│  │                                                         │   │
│  │ Grid Emission Factor:                                   │   │
│  │ [✓] Use published grid emission factor                 │   │
│  │     Value: [0.52] tCO2e/MWh                            │   │
│  │     Source: [IEA 2022 ▼]                               │   │
│  │                                                         │   │
│  │ [ ] Calculate project-specific baseline                │   │
│  │     (requires marginal cost analysis)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  BASELINE SCENARIO                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Without the project, electricity would be generated by: │   │
│  │                                                         │   │
│  │ [✓] Grid-connected fossil fuel power plants            │   │
│  │ [ ] Captive diesel generators                          │   │
│  │ [ ] Other: [Specify                                 ]   │   │
│  │                                                         │   │
│  │ Baseline Technology Mix:                                │   │
│  │ Coal: [45] %    Natural Gas: [30] %    Oil: [15] %     │   │
│  │ Other fossil: [10] %                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ANNUAL GENERATION AND EMISSIONS                                │
│  ┌──────────┬───────────────┬───────────────┬─────────────────┐│
│  │ Year     │ Generation    │ Grid EF       │ Baseline        ││
│  │          │ (MWh)         │ (tCO2e/MWh)   │ Emissions       ││
│  ├──────────┼───────────────┼───────────────┼─────────────────┤│
│  │ 2022     │ [52,500     ] │ [0.52      ]  │ [27,300      ] ││
│  │ 2023     │ [105,000    ] │ [0.50      ]  │ [52,500      ] ││
│  │ 2024     │ [105,000    ] │ [0.48      ]  │ [50,400      ] ││
│  │ ...      │ ...           │ ...           │ ...             ││
│  └──────────┴───────────────┴───────────────┴─────────────────┘│
│  Units: tCO2e/year for baseline emissions                      │
│                                                                 │
│  [Import Generation Data] [Download Template]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Solar PV Specific Inputs

```
┌─────────────────────────────────────────────────────────────────┐
│ SOLAR PV SYSTEM DETAILS                                         │
│                                                                 │
│  SYSTEM CONFIGURATION                                           │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Module Type                 │ [Monocrystalline ▼]          ││
│  │ Module Efficiency           │ [20.5     ] │ %              ││
│  │ Total Module Area           │ [300,000  ] │ m²             ││
│  │ Inverter Efficiency         │ [98.0     ] │ %              ││
│  │ Performance Ratio           │ [82.0     ] │ %              ││
│  │ Degradation Rate            │ [0.5      ] │ %/year         ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  SITE CONDITIONS                                                │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Average Solar Irradiance    │ [1,850    ] │ kWh/m²/year  ││
│  │ Latitude                    │ [15.2     ] │ degrees        ││
│  │ Tilt Angle                  │ [15       ] │ degrees        ││
│  │ Azimuth                     │ [0        ] │ degrees (S=0)  ││
│  │ Average Temperature         │ [28       ] │ °C             ││
│  │ Soiling Loss                │ [3.0      ] │ %              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  GENERATION PROFILE                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Generation (MWh)                                       │   │
│  │  12k ┤    ╭─╮    ╭─╮    ╭─╮    ╭─╮    ╭─╮    ╭─╮      │   │
│  │      │   ╭╯ ╰╮  ╭╯ ╰╮  ╭╯ ╰╮  ╭╯ ╰╮  ╭╯ ╰╮  ╭╯ ╰╮     │   │
│  │   8k ┤  ╭╯   ╰╮╭╯   ╰╮╭╯   ╰╮╭╯   ╰╮╭╯   ╰╮╭╯   ╰╮    │   │
│  │      │ ╭╯     ╰╯     ╰╯     ╰╯     ╰╯     ╰╯     ╰╮   │   │
│  │   4k ┤╭╯                                           ╰╮  │   │
│  │      ┼─┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬─│   │
│  │      J  F   M   A   M   J   J   A   S   O   N   D      │   │
│  │                                                         │   │
│  │  Monthly Generation Profile (kWh/kW installed)          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section D: Wind Power Specific Inputs

```
┌─────────────────────────────────────────────────────────────────┐
│ WIND POWER SYSTEM DETAILS                                       │
│                                                                 │
│  TURBINE SPECIFICATIONS                                         │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Turbine Model               │ [Vestas V150 ▼]              ││
│  │ Number of Turbines          │ [20       ] │ units          ││
│  │ Rated Capacity (each)       │ [2.5      ] │ MW             ││
│  │ Rotor Diameter              │ [150      ] │ m              ││
│  │ Hub Height                  │ [105      ] │ m              ││
│  │ Cut-in Wind Speed           │ [3.0      ] │ m/s            ││
│  │ Rated Wind Speed            │ [12.0     ] │ m/s            ││
│  │ Cut-out Wind Speed          │ [25.0     ] │ m/s            ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  WIND RESOURCE                                                  │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Average Wind Speed (hub)    │ [7.2      ] │ m/s            ││
│  │ Weibull Shape Factor (k)    │ [2.1      ] │ -              ││
│  │ Weibull Scale Factor (c)    │ [8.1      ] │ m/s            ││
│  │ Wind Power Density          │ [450      ] │ W/m²           ││
│  │ Air Density                 │ [1.225    ] │ kg/m³          ││
│  │ Measurement Height          │ [80       ] │ m              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  POWER CURVE                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  Power (kW)                                             │   │
│  │ 2500┤                    ╭──────────────────────────    │   │
│  │     │                 ╭──╯                              │   │
│  │ 2000┤              ╭──╯                                 │   │
│  │     │           ╭──╯                                    │   │
│  │ 1500┤        ╭──╯                                       │   │
│  │     │     ╭──╯                                          │   │
│  │ 1000┤  ╭──╯                                             │   │
│  │     │╭─╯                                                │   │
│  │  500┤╯                                                   │   │
│  │   0 ┼─┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬───│   │
│  │     0  3  4  5  6  7  8  9 10 11 12 13 14 15 20 25      │   │
│  │                    Wind Speed (m/s)                     │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Upload Power Curve] [Use Manufacturer Default]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Capacity factor | 5-95% | "Capacity factor outside valid range" |
| Grid EF | 0-2.0 tCO2e/MWh | "Grid emission factor outside valid range" |
| Module efficiency | 10-30% | "Efficiency outside valid range" |
| Wind speed | 1-30 m/s | "Wind speed outside valid range" |
| Generation | > 0 | "Generation must be positive" |

---

#### 4.3.2 Distributed Energy - Mini-grids, SHS, Rural Electrification

##### Overview
Distributed renewable energy systems provide electricity to off-grid or underserved communities. The UI must handle baseline scenarios of diesel generators, kerosene lamps, and grid extension alternatives.

##### Input Form Structure

###### Section A: System Type and Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ DISTRIBUTED ENERGY SYSTEM TYPE                                  │
│                                                                 │
│  SYSTEM CATEGORY                                                │
│  ● Mini-grid (solar/wind/hydro + storage)                       │
│  ○ Solar Home Systems (SHS)                                     │
│  ○ Pico-hydro systems                                           │
│  ○ Biogas generators                                            │
│  ○ Hybrid systems                                               │
│  ○ Grid extension to unconnected areas                          │
│                                                                 │
│  SYSTEM SPECIFICATIONS                                          │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ System Type                 │ [Solar + Battery ▼]          ││
│  │ Installed Capacity          │ [500      ] │ kW             ││
│  │ Battery Capacity            │ [2,000    ] │ kWh            ││
│  │ Number of Connections       │ [1,250    ] │ households     ││
│  │ Average Household Size      │ [5.2      ] │ people         ││
│  │ Annual Generation           │ [750,000  ] │ kWh/year       ││
│  │ Commissioning Date          │ [📅 01/01/2021  ]           ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Baseline Scenario

```
┌─────────────────────────────────────────────────────────────────┐
│ BASELINE SCENARIO                                               │
│                                                                 │
│  PRE-PROJECT ENERGY SOURCES                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ What energy sources were used before the project?       │   │
│  │                                                         │   │
│  │ [✓] Diesel generators                                 │   │
│  │     Number of generators: [15]                          │   │
│  │     Average capacity: [25] kW each                      │   │
│  │     Average load: [18] kW each                          │   │
│  │     Operating hours: [6] hours/day                      │   │
│  │     Fuel consumption: [3.5] L/kWh                       │   │
│  │                                                         │   │
│  │ [✓] Kerosene lamps                                      │   │
│  │     Number of lamps: [1,100]                            │   │
│  │     Consumption: [150] L/year per lamp                  │   │
│  │                                                         │   │
│  │ [ ] Candles                                             │   │
│  │ [ ] Dry cell batteries                                  │   │
│  │ [ ] Car batteries (for TV/radio)                        │   │
│  │ [ ] No electricity (new connections)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  BASELINE EMISSION CALCULATION                                  │
│  ┌────────────────────┬─────────────┬─────────────┬───────────┐│
│  │ Source             │ Quantity    │ EF          │ Emissions ││
│  ├────────────────────┼─────────────┼─────────────┼───────────┤│
│  │ Diesel             │ [345,563  ] │ [2.68    ]  │ [926,109]││
│  │ Kerosene           │ [165,000  ] │ [2.54    ]  │ [419,100]││
│  ├────────────────────┼─────────────┼─────────────┼───────────┤│
│  │ Total Baseline     │             │             │ [1,345,209││
│  └────────────────────┴─────────────┴─────────────┴───────────┘│
│  Units: L/year; kgCO2e/L; kgCO2e/year                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Service Levels and Consumption

```
┌─────────────────────────────────────────────────────────────────┐
│ SERVICE LEVELS AND CONSUMPTION                                  │
│                                                                 │
│  TIER OF SERVICE (Multi-Tier Framework)                         │
│  Baseline Tier: [Tier 2 ▼] (4+ hrs/day, 200+ Wh/day)          │
│  Project Tier: [Tier 3 ▼] (8+ hrs/day, 1,000+ Wh/day)         │
│                                                                 │
│  HOUSEHOLD CONSUMPTION                                          │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Baseline    │ Project        ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Daily Consumption           │ [0.25     ] │ [1.2       ]   ││
│  │ Peak Demand                 │ [0.15     ] │ [0.4       ]   ││
│  │ Hours of Service            │ [4        ] │ [12        ]   ││
│  │ Outage Frequency            │ [N/A      ] │ [2         ]   ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│  Units: kWh/day for consumption; kW for demand                 │
│                                                                 │
│  CONSUMPTION BY END USE                                         │
│  ┌──────────────────┬─────────────┬─────────────┬──────────────┐│
│  │ End Use          │ Baseline    │ Project     │ Unit         ││
│  ├──────────────────┼─────────────┼─────────────┼──────────────┤│
│  │ Lighting         │ [40       ] │ [15       ] │ %            ││
│  │ Phone charging   │ [15       ] │ [8        ] │ %            ││
│  │ Television       │ [20       ] │ [12       ] │ %            ││
│  │ Refrigeration    │ [0        ] │ [25       ] │ %            ││
│  │ Other appliances │ [25       ] │ [40       ] │ %            ││
│  └──────────────────┴─────────────┴─────────────┴──────────────┘│
│                                                                 │
│  [Survey Results Upload] [Sample Size: 125 households]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Connections | > 0 | "Number of connections must be positive" |
| Consumption | > 0 | "Consumption must be positive" |
| Service hours | 1-24 | "Service hours must be 1-24" |
| Fuel consumption | 0.2-5.0 L/kWh | "Fuel consumption outside typical range" |
| End use % | Sum = 100% | "End use percentages must total 100%" |

---

#### 4.3.3 Clean Cooking - Improved Cookstoves, Water Purification

##### Overview
Clean cooking projects distribute improved cookstoves or clean fuels to replace traditional biomass cooking. The UI must handle baseline fuel consumption, stove efficiency, and usage monitoring.

##### Input Form Structure

###### Section A: Cookstove Technology

```
┌─────────────────────────────────────────────────────────────────┐
│ CLEAN COOKING TECHNOLOGY                                        │
│                                                                 │
│  STOVE TYPE                                                     │
│  ● Improved biomass cookstove (rocket type)                     │
│  ○ Improved biomass cookstove (gasifier)                        │
│  ○ LPG stove                                                    │
│  ○ Biogas stove                                                 │
│  ○ Ethanol stove                                                │
│  ○ Electric induction                                           │
│  ○ Solar cooker                                                 │
│  ○ Water purification (displacement of boiling)                 │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  STOVE SPECIFICATIONS                                           │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Stove Model                 │ [EcoZoom Dura ▼]             ││
│  │ Thermal Efficiency          │ [35       ] │ %              ││
│  │ Power Output                │ [3.5      ] │ kW             ││
│  │ Emission Factor (PM2.5)     │ [0.8      ] │ g/MJ delivered││
│  │ Certification               │ [ISO 19867-1 ▼]              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  DISTRIBUTION                                                   │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Number of Stoves Distributed│ [5,000    ] │ units          ││
│  │ Distribution Start Date     │ [📅 01/01/2022  ]           ││
│  │ Distribution Area           │ [Rural District X]           ││
│  │ Target Population           │ [Women 18-65]                ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Baseline Cooking Practice

```
┌─────────────────────────────────────────────────────────────────┐
│ BASELINE COOKING PRACTICE                                       │
│                                                                 │
│  BASELINE STOVE TYPE                                            │
│  ● Traditional three-stone fire                                 │
│  ○ Traditional mud stove (chulha)                               │
│  ○ Charcoal stove                                               │
│  ○ Other traditional: [Specify                         ]       │
│                                                                 │
│  BASELINE STOVE SPECIFICATIONS                                  │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Thermal Efficiency          │ [12       ] │ %              ││
│  │ Fuel Type                   │ [Firewood ▼]                 ││
│  │ Fuel Moisture Content       │ [20       ] │ %              ││
│  │ Fuel Carbon Content         │ [45       ] │ %              ││
│  │ Net Calorific Value         │ [15.0     ] │ MJ/kg          ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  BASELINE FUEL CONSUMPTION                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Survey-based fuel consumption:                          │   │
│  │                                                         │   │
│  │ Average daily fuel use: [4.5] kg firewood/household/day│   │
│  │                                                         │   │
│  │ Seasonal variation:                                     │   │
│  │ Dry season: [3.8] kg/day                                │   │
│  │ Wet season: [5.2] kg/day                                │   │
│  │                                                         │   │
│  │ Source: [Kitchen Performance Test (KPT) ▼]              │   │
│  │ Sample size: [150] households                           │   │
│  │ Survey date: [📅 11/2021  ]                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Upload KPT Results] [Download Template]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Usage and Adoption Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│ USAGE AND ADOPTION MONITORING                                   │
│                                                                 │
│  ADOPTION RATE                                                  │
│  ┌──────────┬───────────────┬───────────────┬─────────────────┐│
│  │ Period   │ Stoves Dist.  │ Active Users  │ Adoption Rate   ││
│  ├──────────┼───────────────┼───────────────┼─────────────────┤│
│  │ Year 1   │ [5,000      ] │ [4,250      ] │ [85.0       ] %││
│  │ Year 2   │ [5,000      ] │ [4,000      ] │ [80.0       ] %││
│  │ Year 3   │ [5,000      ] │ [3,750      ] │ [75.0       ] %││
│  └──────────┴───────────────┴───────────────┴─────────────────┘│
│                                                                 │
│  USAGE RATE (Among active users)                                │
│  Average daily cooking events: [2.5] per household             │
│  Average cooking duration: [1.8] hours per day                 │
│  Stacking with other stoves: [15] % of households              │
│                                                                 │
│  MONITORING METHOD                                              │
│  [✓] Temperature sensors (SUMs)                               │
│     Number with sensors: [500] (10% sample)                    │
│  [✓] Phone surveys                                            │
│     Frequency: [Quarterly ▼]                                   │
│  [ ] In-person spot checks                                    │
│  [ ] Fuel sales monitoring                                    │
│                                                                 │
│  SENSOR DATA SUMMARY                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Average daily cooking events (sensor): [2.3]            │   │
│  │ Average cooking duration: [1.6] hours                   │   │
│  │ Days with usage per month: [28.5]                       │   │
│  │                                                         │   │
│  │ [View Detailed Sensor Data] [Download Raw Data]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Thermal efficiency | 5-60% | "Efficiency outside valid range" |
| Fuel consumption | 0.5-20 kg/day | "Fuel consumption outside typical range" |
| Adoption rate | 0-100% | "Adoption rate must be 0-100%" |
| Cooking events | 1-10/day | "Cooking events outside typical range" |
| Moisture content | 5-50% | "Moisture content outside valid range" |

---

#### 4.3.4 Energy Efficiency - Industrial, Buildings, Appliances

##### Overview
Energy efficiency projects reduce electricity or fuel consumption through equipment upgrades, building improvements, or system optimizations. The UI must handle baseline consumption measurements and savings verification.

##### Input Form Structure

###### Section A: Efficiency Measure Type

```
┌─────────────────────────────────────────────────────────────────┐
│ ENERGY EFFICIENCY MEASURE TYPE                                  │
│                                                                 │
│  MEASURE CATEGORY                                               │
│  ● Industrial equipment upgrade                                 │
│  ○ Building envelope improvements                               │
│  ○ HVAC system optimization                                     │
│  ○ Lighting system upgrade                                      │
│  ○ Motor/drive optimization                                     │
│  ○ Compressed air system                                        │
│  ○ Process optimization                                         │
│  ○ Appliance efficiency program                                 │
│  ○ District heating/cooling system                              │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  APPLICATION DETAILS                                            │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Industry/Sector             │ [Textile manufacturing ▼]    ││
│  │ Facility Name               │ [ABC Textiles Ltd.     ]     ││
│  │ Facility Location           │ [City, Country         ]     ││
│  │ Measure Implementation Date │ [📅 03/01/2022  ]           ││
│  │ Project Lifetime            │ [10       ] │ years          ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Baseline and Project Equipment

```
┌─────────────────────────────────────────────────────────────────┐
│ BASELINE AND PROJECT EQUIPMENT                                  │
│                                                                 │
│  EQUIPMENT SPECIFICATIONS                                       │
│  ┌──────────────────┬─────────────────┬─────────────────┐      │
│  │ Parameter        │ Baseline        │ Project         │      │
│  ├──────────────────┼─────────────────┼─────────────────┤      │
│  │ Equipment Type   │ [Old motors ▼]  │ [VSD motors ▼]  │      │
│  │ Number of Units  │ [45           ] │ [45           ] │      │
│  │ Rated Power      │ [75           ] │ [75           ] │ kW   │
│  │ Efficiency Class │ [IE1          ] │ [IE4          ] │      │
│  │ Efficiency (%)   │ [91.0         ] │ [96.5         ] │ %    │
│  │ Load Factor      │ [75           ] │ [75           ] │ %    │
│  │ Operating Hours  │ [6,000        ] │ [6,000        ] │ hrs  │
│  └──────────────────┴─────────────────┴─────────────────┘      │
│                                                                 │
│  ENERGY CONSUMPTION                                             │
│  ┌──────────────────┬─────────────────┬─────────────────┐      │
│  │ Parameter        │ Baseline        │ Project         │      │
│  ├──────────────────┼─────────────────┼─────────────────┤      │
│  │ Annual Energy    │ [20,250,000   ] │ [18,093,750   ] │ kWh  │
│  │ Peak Demand      │ [3,375        ] │ [3,206        ] │ kW   │
│  │ Power Factor     │ [0.85         ] │ [0.92         ] │ -    │
│  └──────────────────┴─────────────────┴─────────────────┘      │
│                                                                 │
│  Annual Energy Savings: [2,156,250] kWh                         │
│  Savings Percentage: [10.6] %                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Measurement and Verification

```
┌─────────────────────────────────────────────────────────────────┐
│ MEASUREMENT AND VERIFICATION                                    │
│                                                                 │
│  M&V PROTOCOL                                                   │
│  Protocol: [IPMVP Option C (Whole Facility) ▼]                 │
│  Baseline Period: [📅 01/01/2021  ] to [📅 12/31/2021  ]       │
│  Reporting Period: [📅 01/01/2022  ] to [📅 12/31/2022  ]      │
│                                                                 │
│  ENERGY CONSUMPTION DATA                                        │
│  ┌──────────┬─────────────────┬─────────────────┬─────────────┐│
│  │ Month    │ Baseline (kWh)  │ Actual (kWh)    │ Savings     ││
│  ├──────────┼─────────────────┼─────────────────┼─────────────┤│
│  │ Jan 2022 │ [1,687,500    ] │ [1,507,813    ] │ [179,688]  ││
│  │ Feb 2022 │ [1,687,500    ] │ [1,507,813    ] │ [179,688]  ││
│  │ Mar 2022 │ [1,687,500    ] │ [1,507,813    ] │ [179,688]  ││
│  │ ...      │ ...             │ ...             │ ...         ││
│  ├──────────┼─────────────────┼─────────────────┼─────────────┤│
│  │ Total    │ [20,250,000   ] │ [18,093,750   ] │ [2,156,250]││
│  └──────────┴─────────────────┴─────────────┴─────────────────┘│
│                                                                 │
│  ADJUSTMENTS                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Weather normalization: [Applied ▼]                      │   │
│  │ Production normalization: [Applied ▼]                   │   │
│  │ Other adjustments: [None ▼]                             │   │
│  │                                                         │   │
│  │ Adjustment Factor: [0.98] (2% reduction for mild winter)│   │
│  │                                                         │   │
│  │ Adjusted Savings: [2,113,125] kWh                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Upload Utility Bills] [Upload Production Data]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Efficiency | 50-100% | "Efficiency must be 50-100%" |
| Load factor | 10-100% | "Load factor must be 10-100%" |
| Operating hours | 0-8760 | "Operating hours must be 0-8760" |
| Savings | < Baseline consumption | "Savings cannot exceed baseline" |
| Power factor | 0.5-1.0 | "Power factor must be 0.5-1.0" |

---


### 4.4 WASTE

---

#### 4.4.1 Landfill Gas - Flaring and Electricity Generation

##### Overview
Landfill gas projects capture and destroy methane from decomposing waste or use it to generate electricity. The UI must handle waste composition, decay rates, and gas collection efficiency.

##### Input Form Structure

###### Section A: Landfill Characteristics

```
┌─────────────────────────────────────────────────────────────────┐
│ LANDFILL CHARACTERISTICS                                        │
│                                                                 │
│  LANDFILL TYPE                                                  │
│  ● Municipal Solid Waste (MSW) landfill                         │
│  ○ Industrial waste landfill                                    │
│  ○ Construction & demolition debris                             │
│  ○ Inert waste landfill                                         │
│                                                                 │
│  SITE SPECIFICATIONS                                            │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Landfill Name               │ [Municipal Landfill X]       ││
│  │ Site Area                   │ [50       ] │ hectares       ││
│  │ Waste in Place              │ [2,500,000] │ tonnes         ││
│  │ Active Cell Area            │ [15       ] │ hectares       ││
│  │ Landfill Opening Date       │ [📅 01/01/2005  ]           ││
│  │ Expected Closure Date       │ [📅 12/31/2035  ]           ││
│  │ Average Annual Precipitation│ [1,200    ] │ mm             ││
│  │ Average Temperature         │ [18       ] │ °C             ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Waste Composition and Quantities

```
┌─────────────────────────────────────────────────────────────────┐
│ WASTE COMPOSITION AND QUANTITIES                                │
│                                                                 │
│  HISTORICAL WASTE INPUTS                                        │
│  ┌──────────┬───────────────┬─────────────────────────────────┐│
│  │ Year     │ Waste Inbound │ Source                          ││
│  │          │ (tonnes)      │                                 ││
│  ├──────────┼───────────────┼─────────────────────────────────┤│
│  │ 2005     │ [85,000     ] │ [Municipal records ▼]           ││
│  │ 2006     │ [87,500     ] │ [Municipal records ▼]           ││
│  │ 2007     │ [90,000     ] │ [Municipal records ▼]           ││
│  │ ...      │ ...           │ ...                             ││
│  │ 2023     │ [125,000    ] │ [Weighbridge records ▼]         ││
│  └──────────┴───────────────┴─────────────────────────────────┘│
│                                                                 │
│  WASTE COMPOSITION (by wet weight)                              │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Waste Category              │ % of Total  │ Degradable OC  ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Food waste                  │ [35       ] │ [15.0      ]   ││
│  │ Garden/park waste           │ [15       ] │ [20.0      ]   ││
│  │ Paper/cardboard             │ [20       ] │ [40.0      ]   ││
│  │ Wood                        │ [5        ] │ [43.0      ]   ││
│  │ Textiles                    │ [3        ] │ [24.0      ]   ││
│  │ Plastics                    │ [12       ] │ [0.0       ]   ││
│  │ Glass                       │ [5        ] │ [0.0       ]   ││
│  │ Metal                       │ [3        ] │ [0.0       ]   ││
│  │ Other (inert)               │ [2        ] │ [0.0       ]   ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total                       │ [100      ] │                ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│  Degradable Organic Carbon (DOC): [17.2] %                      │
│                                                                 │
│  [Upload Waste Data] [Use Default Composition]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Gas Collection System

```
┌─────────────────────────────────────────────────────────────────┐
│ LANDFILL GAS COLLECTION SYSTEM                                  │
│                                                                 │
│  COLLECTION SYSTEM SPECIFICATIONS                               │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Collection Start Date       │ [📅 06/01/2015  ]           ││
│  │ Number of Extraction Wells  │ [45       ] │ wells          ││
│  │ Well Depth (average)        │ [15       ] │ m              ││
│  │ Lateral Pipeline Length     │ [8,500    ] │ m              ││
│  │ Blower Capacity             │ [2,500    ] │ m³/hr          ││
│  │ Collection Efficiency       │ [65       ] │ %              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  GAS DESTRUCTION/UTILIZATION                                    │
│  [✓] Flaring                                                    │
│      Number of flares: [2]                                      │
│      Destruction efficiency: [99] %                             │
│  [✓] Electricity Generation                                     │
│      Generator capacity: [1,200] kW                             │
│      Annual generation: [8,500,000] kWh                         │
│      Methane destruction efficiency: [99.5] %                   │
│                                                                 │
│  MONITORED GAS FLOW AND COMPOSITION                             │
│  ┌──────────┬───────────────┬───────────────┬─────────────────┐│
│  │ Year     │ Gas Flow      │ CH4 Content   │ CH4 Destroyed   ││
│  │          │ (m³/hr)       │ (%)           │ (tonnes)        ││
│  ├──────────┼───────────────┼───────────────┼─────────────────┤│
│  │ 2020     │ [1,850      ] │ [52       ]   │ [3,245      ]  ││
│  │ 2021     │ [1,920      ] │ [51       ]   │ [3,356      ]  ││
│  │ 2022     │ [1,980      ] │ [50       ]   │ [3,425      ]  ││
│  │ 2023     │ [2,050      ] │ [49       ]   │ [3,512      ]  ││
│  └──────────┴───────────────┴───────────────┴─────────────────┘│
│                                                                 │
│  [Upload Flow Meter Data] [Upload Gas Analysis]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Waste composition | Sum = 100% | "Waste composition must total 100%" |
| DOC | 5-30% | "DOC outside typical range" |
| Collection efficiency | 0-100% | "Collection efficiency must be 0-100%" |
| Destruction efficiency | 90-100% | "Destruction efficiency must be 90-100%" |
| CH4 content | 30-65% | "CH4 content outside typical range" |

---

#### 4.4.2 Wastewater Methane - Industrial and Municipal Treatment

##### Overview
Wastewater treatment projects reduce methane emissions through anaerobic digestion with biogas capture, aerobic treatment, or process improvements. The UI must handle wastewater characteristics, treatment processes, and methane generation potential.

##### Input Form Structure

###### Section A: Wastewater Source and Characteristics

```
┌─────────────────────────────────────────────────────────────────┐
│ WASTEWATER SOURCE AND CHARACTERISTICS                           │
│                                                                 │
│  WASTEWATER TYPE                                                │
│  ● Municipal wastewater                                         │
│  ○ Food processing industry                                     │
│  ○ Beverage industry (brewery, distillery)                      │
│  ○ Pulp and paper                                               │
│  ○ Chemical/pharmaceutical                                      │
│  ○ Agricultural processing                                      │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  WASTEWATER SPECIFICATIONS                                      │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Facility Name               │ [Municipal WWTP X]           ││
│  │ Design Capacity             │ [50,000   ] │ m³/day         ││
│  │ Average Flow                │ [38,500   ] │ m³/day         ││
│  │ Peak Flow                   │ [72,000   ] │ m³/day         ││
│  │ COD Influent                │ [450      ] │ mg/L           ││
│  │ BOD Influent                │ [250      ] │ mg/L           ││
│  │ TSS Influent                │ [280      ] │ mg/L           ││
│  │ Temperature                 │ [22       ] │ °C             ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Treatment Process Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ TREATMENT PROCESS CONFIGURATION                                 │
│                                                                 │
│  BASELINE TREATMENT                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [✓] Open anaerobic lagoon                               │   │
│  │     Volume: [45,000] m³                                 │   │
│  │     Depth: [4.5] m                                      │   │
│  │     Retention time: [18] days                           │   │
│  │                                                         │   │
│  │ [ ] Aerated lagoon                                      │   │
│  │ [ ] Activated sludge (aerobic)                          │   │
│  │ [ ] Facultative pond                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  PROJECT TREATMENT                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [✓] Covered anaerobic digester                          │   │
│  │     Type: [UASB ▼]                                      │   │
│  │     Volume: [12,000] m³                                 │   │
│  │     Retention time: [8] hours                           │   │
│  │     Operating temperature: [35] °C (mesophilic)         │   │
│  │                                                         │   │
│  │ [✓] Biogas capture and flaring                          │   │
│  │     Flare capacity: [800] m³/hr                         │   │
│  │     Destruction efficiency: [99] %                      │   │
│  │                                                         │   │
│  │ [✓] Post-treatment (aerobic)                            │   │
│  │     Type: [Activated sludge ▼]                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TREATMENT PERFORMANCE                                          │
│  ┌──────────────────┬─────────────┬─────────────┬──────────────┐│
│  │ Parameter        │ Baseline    │ Project     │ Unit         ││
│  ├──────────────────┼─────────────┼─────────────┼──────────────┤│
│  │ COD Removal      │ [75       ] │ [85       ] │ %            ││
│  │ BOD Removal      │ [80       ] │ [92       ] │ %            ││
│  │ Effluent COD     │ [112      ] │ [68       ] │ mg/L         ││
│  │ Effluent BOD     │ [50       ] │ [20       ] │ mg/L         ││
│  └──────────────────┴─────────────┴─────────────┴──────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Methane Generation and Capture

```
┌─────────────────────────────────────────────────────────────────┐
│ METHANE GENERATION AND CAPTURE                                  │
│                                                                 │
│  METHANE GENERATION POTENTIAL                                   │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ COD Removed                 │ [14,726   ] │ kg COD/day     ││
│  │ Methane Generation Potential│ [0.25     ] │ kg CH4/kg COD  ││
│  │ Maximum Methane Generation  │ [3,682    ] │ kg CH4/day     ││
│  │ Methane Correction Factor   │ [0.8      ] │ -              ││
│  │ Actual Methane Generation   │ [2,945    ] │ kg CH4/day     ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  BIOGAS CAPTURE AND DESTRUCTION                               │
│  ┌──────────┬───────────────┬───────────────┬─────────────────┐│
│  │ Year     │ Biogas Flow   │ CH4 Content   │ CH4 Destroyed   ││
│  │          │ (m³/day)      │ (%)           │ (tonnes/year)   ││
│  ├──────────┼───────────────┼───────────────┼─────────────────┤│
│  │ 2020     │ [2,850      ] │ [62       ]   │ [645        ]  ││
│  │ 2021     │ [3,120      ] │ [61       ]   │ [698        ]  ││
│  │ 2022     │ [3,350      ] │ [60       ]   │ [738        ]  ││
│  │ 2023     │ [3,580      ] │ [59       ]   │ [778        ]  ││
│  └──────────┴───────────────┴───────────────┴─────────────────┘│
│                                                                 │
│  METHANE EMISSION REDUCTION                                     │
│  Baseline Emissions: [1,075] tonnes CH4/year                   │
│  Project Emissions: [11] tonnes CH4/year (unburned + fugitive) │
│  Emission Reduction: [1,064] tonnes CH4/year (99%)             │
│                                                                 │
│  [Upload Monitoring Data] [Upload Lab Results]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| COD/BOD | COD > BOD | "COD should be greater than BOD" |
| Flow | < Design capacity | "Flow exceeds design capacity" |
| Removal efficiency | 0-100% | "Removal efficiency must be 0-100%" |
| CH4 generation | 0.1-0.4 kg/kg COD | "CH4 potential outside typical range" |
| MCF | 0-1.0 | "MCF must be 0-1.0" |

---

#### 4.4.3 Organic Waste - Diversion, Composting, Digestion

##### Overview
Organic waste management projects divert waste from landfills to composting, anaerobic digestion, or other beneficial uses. The UI must track waste streams, processing methods, and emission reductions from avoided landfill methane.

##### Input Form Structure

###### Section A: Waste Stream Characterization

```
┌─────────────────────────────────────────────────────────────────┐
│ WASTE STREAM CHARACTERIZATION                                   │
│                                                                 │
│  WASTE SOURCES                                                  │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Source                      │ Quantity    │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Residential food waste      │ [8,500    ] │ tonnes/year    ││
│  │ Commercial food waste       │ [12,000   ] │ tonnes/year    ││
│  │ Agricultural residues       │ [25,000   ] │ tonnes/year    ││
│  │ Landscaping/green waste     │ [6,500    ] │ tonnes/year    ││
│  │ Food processing waste       │ [18,000   ] │ tonnes/year    ││
│  │ Sewage sludge               │ [5,000    ] │ tonnes/year    ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total Organic Waste         │ [75,000   ] │ tonnes/year    ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  WASTE COMPOSITION                                              │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Component                   │ % by Weight │ Moisture %     ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Food waste                  │ [45       ] │ [78       ]   ││
│  │ Yard waste                  │ [25       ] │ [60       ]   ││
│  │ Wood/paper                  │ [15       ] │ [25       ]   ││
│  │ Agricultural residues       │ [12       ] │ [45       ]   ││
│  │ Other organics              │ [3        ] │ [50       ]   ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total                       │ [100      ] │ [62       ]   ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Processing Methods

```
┌─────────────────────────────────────────────────────────────────┐
│ ORGANIC WASTE PROCESSING METHODS                                │
│                                                                 │
│  WASTE ALLOCATION                                               │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Processing Method           │ Quantity    │ % of Total     ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Aerobic composting          │ [30,000   ] │ [40       ]   ││
│  │ Anaerobic digestion         │ [35,000   ] │ [47       ]   ││
│  │ Animal feed                 │ [5,000    ] │ [7        ]   ││
│  │ Land application            │ [3,000    ] │ [4        ]   ││
│  │ Other: [Specify       ]     │ [2,000    ] │ [2        ]   ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total Diverted              │ [75,000   ] │ [100      ]   ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  COMPOSTING FACILITY                                            │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Composting Method           │ [Windrow ▼] │                ││
│  │ Facility Capacity           │ [40,000   ] │ tonnes/year    ││
│  │ Composting Period           │ [12       ] │ weeks          ││
│  │ Turning Frequency           │ [Weekly ▼]  │                ││
│  │ Compost Yield               │ [35       ] │ % of input     ││
│  │ N2O Emission Factor         │ [0.01     ] │ kg N2O-N/kg N  ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  ANAEROBIC DIGESTION FACILITY                                   │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Digester Type               │ [CSTR ▼]    │                ││
│  │ Digester Volume             │ [6,000    ] │ m³             ││
│  │ Organic Loading Rate        │ [3.5      ] │ kg VS/m³/day   ││
│  │ Hydraulic Retention Time    │ [25       ] │ days           ││
│  │ Operating Temperature       │ [38       ] │ °C             ││
│  │ Biogas Production           │ [120      ] │ m³/tonne waste ││
│  │ Methane Content             │ [58       ] │ %              ││
│  │ Biogas Utilization          │ [Electricity generation ▼]   ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Emission Reduction Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│ EMISSION REDUCTION CALCULATION                                  │
│                                                                 │
│  AVOIDED LANDFILL EMISSIONS                                     │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Waste Diverted from Landfill│ [75,000   ] │ tonnes/year    ││
│  │ Degradable Organic Carbon   │ [18       ] │ %              ││
│  │ DOC Dissimilated            │ [50       ] │ %              ││
│  │ Methane Generation Potential│ [2,850    ] │ tonnes CH4     ││
│  │ Collection Efficiency       │ [65       ] │ %              ││
│  │ Oxidation Factor            │ [10       ] │ %              ││
│  │ Avoided CH4 Emissions       │ [1,663    ] │ tonnes CH4     ││
│  │ Avoided CO2e Emissions      │ [41,575   ] │ tonnes CO2e    ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  PROJECT EMISSIONS                                              │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Source                      │ Emissions   │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Composting N2O              │ [45       ] │ tonnes CO2e    ││
│  │ Composting CH4              │ [12       ] │ tonnes CO2e    ││
│  │ AD fugitive emissions       │ [85       ] │ tonnes CO2e    ││
│  │ Transportation              │ [125      ] │ tonnes CO2e    ││
│  │ Energy consumption          │ [180      ] │ tonnes CO2e    ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total Project Emissions     │ [447      ] │ tonnes CO2e    ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  NET EMISSION REDUCTION: [41,128] tonnes CO2e/year             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Waste allocation | Sum = 100% | "Waste allocation must total 100%" |
| Moisture content | 5-95% | "Moisture content outside valid range" |
| Compost yield | 10-60% | "Compost yield outside typical range" |
| HRT | 10-60 days | "HRT outside typical range" |
| Biogas production | 20-300 m³/tonne | "Biogas production outside typical range" |

---


### 4.5 INDUSTRIAL

---

#### 4.5.1 Industrial Gases - N2O, HFCs, Process Gas Destruction

##### Overview
Industrial gas projects destroy or abate emissions of high-global warming potential gases including N2O from adipic acid and nitric acid production, HFCs from various applications, and other process gases.

##### Input Form Structure

###### Section A: Industrial Process and Gas Type

```
┌─────────────────────────────────────────────────────────────────┐
│ INDUSTRIAL PROCESS AND GAS TYPE                                 │
│                                                                 │
│  GAS TYPE                                                       │
│  ● N2O (nitrous oxide)                                          │
│  ○ HFCs (hydrofluorocarbons)                                    │
│  ○ PFCs (perfluorocarbons)                                      │
│  ○ SF6 (sulfur hexafluoride)                                    │
│  ○ NF3 (nitrogen trifluoride)                                   │
│  ○ Other fluorinated gases                                      │
│                                                                 │
│  SOURCE PROCESS                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ N2O Source: [Adipic acid production ▼]                  │   │
│  │                                                         │   │
│  │ Facility Name: [Chemical Plant X]                       │   │
│  │ Production Capacity: [150,000] tonnes adipic acid/year  │   │
│  │ Abatement Technology: [Catalytic decomposition ▼]       │   │
│  │ Installation Date: [📅 03/01/2020  ]                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ABATEMENT SYSTEM SPECIFICATIONS                                │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Abatement Technology        │ [Catalytic ▼]                ││
│  │ Number of Abatement Units   │ [2        ] │ units          ││
│  │ Design Flow Rate            │ [15,000   ] │ Nm³/hr         ││
│  │ Operating Temperature       │ [450      ] │ °C             ││
│  │ Destruction Efficiency      │ [99.5     ] │ %              ││
│  │ Uptime/Availability         │ [95       ] │ %              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Baseline and Project Emissions

```
┌─────────────────────────────────────────────────────────────────┐
│ BASELINE AND PROJECT EMISSIONS                                  │
│                                                                 │
│  BASELINE EMISSION FACTOR                                       │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ N2O Emission Factor         │ [0.30     ] │ kg N2O/tonne AA││
│  │ Source of EF                │ [Historical data ▼]          ││
│  │ Historical Period           │ [2015-2019] │ years          ││
│  │ Average Annual Production   │ [145,000  ] │ tonnes AA      ││
│  │ Baseline N2O Emissions      │ [43,500   ] │ tonnes N2O     ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│  AA = adipic acid                                               │
│                                                                 │
│  MONITORED EMISSIONS                                            │
│  ┌──────────┬───────────────┬───────────────┬─────────────────┐│
│  │ Year     │ Production    │ N2O Emissions │ Destruction     ││
│  │          │ (tonnes AA)   │ (tonnes N2O)  │ Rate (%)        ││
│  ├──────────┼───────────────┼───────────────┼─────────────────┤│
│  │ 2020     │ [148,000    ] │ [222        ] │ [99.5       ] %││
│  │ 2021     │ [152,000    ] │ [228        ] │ [99.5       ] %││
│  │ 2022     │ [150,000    ] │ [225        ] │ [99.5       ] %││
│  │ 2023     │ [155,000    ] │ [233        ] │ [99.5       ] %││
│  └──────────┴───────────────┴───────────────┴─────────────────┘│
│                                                                 │
│  EMISSION REDUCTION CALCULATION                                 │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Baseline N2O Emissions      │ [46,500   ] │ tonnes N2O     ││
│  │ Project N2O Emissions       │ [233      ] │ tonnes N2O     ││
│  │ N2O Emission Reduction      │ [46,267   ] │ tonnes N2O     ││
│  │ GWP (N2O)                   │ [298      ] │ -              ││
│  │ CO2e Emission Reduction     │ [13,787,566│ tonnes CO2e    ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  [Upload CEMS Data] [Upload Production Records]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Continuous Emissions Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│ CONTINUOUS EMISSIONS MONITORING (CEMS)                          │
│                                                                 │
│  MONITORING SYSTEM SPECIFICATIONS                               │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ CEMS Manufacturer           │ [Siemens ▼] │                ││
│  │ Analyzer Type               │ [NDIR ▼]    │                ││
│  │ Measurement Range           │ [0-1000   ] │ ppmv           ││
│  │ Detection Limit             │ [0.1      ] │ ppmv           ││
│  │ Calibration Frequency       │ [Daily ▼]   │                ││
│  │ QA/QC Protocol              │ [EPA 40 CFR 60 ▼]            ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  MONITORING DATA SUMMARY                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  N2O Concentration (ppmv)                               │   │
│  │  50 ┤                                                   │   │
│  │     │  ╭─╮                                                │   │
│  │  40 ┤ ╭╯ ╰╮                                               │   │
│  │     │╭╯   ╰╮                                              │   │
│  │  30 ┤╯     ╰╮                                             │   │
│  │     │       ╰╮                                            │   │
│  │  20 ┤        ╰╮                                           │   │
│  │     │         ╰╮                                          │   │
│  │  10 ┤          ╰────────                                  │   │
│  │   0 ┼─┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬───│   │
│  │     J  F  M  A  M  J  J  A  S  O  N  D                   │   │
│  │                                                         │   │
│  │  Monthly Average N2O Concentration (2023)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Data Availability: [99.2] % (target: >95%)                    │
│  [View Detailed CEMS Data] [Download Raw Data]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Destruction efficiency | 90-99.99% | "Destruction efficiency outside valid range" |
| Availability | 50-100% | "Availability must be 50-100%" |
| GWP | Use IPCC values | "Use approved GWP values" |
| CEMS data availability | > 95% | "CEMS data availability below 95%" |

---

#### 4.5.2 CCS / CCUS - Carbon Capture, Transport and Storage

##### Overview
Carbon Capture, Utilization and Storage (CCUS) projects capture CO2 from industrial sources, transport it, and store it permanently underground or use it in products. The UI must handle capture rates, transport emissions, and storage verification.

##### Input Form Structure

###### Section A: CO2 Capture System

```
┌─────────────────────────────────────────────────────────────────┐
│ CO2 CAPTURE SYSTEM                                              │
│                                                                 │
│  SOURCE FACILITY                                                │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Facility Name               │ [Power Plant X]              ││
│  │ Industry Type               │ [Coal power generation ▼]    ││
│  │ Facility Location           │ [City, State, Country]       ││
│  │ Gross CO2 Emissions         │ [3,500,000] │ tonnes CO2/year││
│  │ Capture Start Date          │ [📅 06/01/2023  ]           ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  CAPTURE TECHNOLOGY                                             │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Capture Technology          │ [Post-combustion amine ▼]    ││
│  │ Capture Capacity            │ [1,200,000] │ tonnes CO2/year││
│  │ Capture Rate                │ [90       ] │ % of flue gas  ││
│  │ CO2 Purity                  │ [99.9     ] │ %              ││
│  │ Energy Penalty              │ [18       ] │ % of output    ││
│  │ Capture Efficiency          │ [92       ] │ %              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  CAPTURE MONITORING                                             │
│  ┌──────────┬───────────────┬───────────────┬─────────────────┐│
│  │ Month    │ Flue Gas CO2  │ Captured CO2  │ Capture Rate    ││
│  │          │ (tonnes)      │ (tonnes)      │ (%)             ││
│  ├──────────┼───────────────┼───────────────┼─────────────────┤│
│  │ Jun 2023 │ [291,667    ] │ [268,333    ] │ [92.0       ] %││
│  │ Jul 2023 │ [291,667    ] │ [270,000    ] │ [92.5       ] %││
│  │ Aug 2023 │ [291,667    ] │ [269,167    ] │ [92.3       ] %││
│  │ ...      │ ...           │ ...           │ ...             ││
│  └──────────┴───────────────┴───────────────┴─────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: CO2 Transport

```
┌─────────────────────────────────────────────────────────────────┐
│ CO2 TRANSPORT                                                   │
│                                                                 │
│  TRANSPORT METHOD                                               │
│  ● Pipeline                                                     │
│  ○ Truck (tanker)                                               │
│  ○ Rail (tank car)                                              │
│  ○ Ship (tanker)                                                │
│  ○ Combination: [Specify                               ]       │
│                                                                 │
│  PIPELINE SPECIFICATIONS                                        │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Pipeline Length             │ [85       ] │ km             ││
│  │ Pipeline Diameter           │ [12       ] │ inches         ││
│  │ Operating Pressure          │ [150      ] │ bar            ││
│  │ CO2 Phase                   │ [Dense phase ▼]              ││
│  │ Transport Emissions         │ [2,500    ] │ tonnes CO2/year││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  TRANSPORT EMISSIONS                                            │
│  ┌──────────────────┬─────────────┬─────────────┬──────────────┐│
│  │ Source           │ Fuel/Energy │ Emissions   │ Unit         ││
│  ├──────────────────┼─────────────┼─────────────┼──────────────┤│
│  │ Pipeline pumps   │ [15,000   ] │ [2,250    ] │ tonnes CO2   ││
│  │ Booster stations │ [2,000    ] │ [250      ] │ tonnes CO2   ││
│  │ Other            │ [0        ] │ [0        ] │ tonnes CO2   ││
│  ├──────────────────┼─────────────┼─────────────┼──────────────┤│
│  │ Total Transport  │             │ [2,500    ] │ tonnes CO2   ││
│  └──────────────────┴─────────────┴─────────────┴──────────────┘│
│  Units: MWh/year for energy; tonnes CO2/year for emissions     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: CO2 Storage or Utilization

```
┌─────────────────────────────────────────────────────────────────┐
│ CO2 STORAGE OR UTILIZATION                                      │
│                                                                 │
│  STORAGE/UTILIZATION TYPE                                       │
│  ● Geologic storage (saline aquifer)                            │
│  ○ Geologic storage (depleted oil/gas field)                    │
│  ○ Enhanced oil recovery (EOR)                                  │
│  ○ Enhanced water recovery                                      │
│  ○ Mineral carbonation                                          │
│  ○ Utilization in products (concrete, chemicals)                │
│                                                                 │
│  STORAGE SITE SPECIFICATIONS                                    │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Storage Site Name           │ [Saline Aquifer X]           ││
│  │ Storage Formation           │ [Deep sandstone ▼]           ││
│  │ Storage Depth               │ [2,500    ] │ m              ││
│  │ Storage Capacity            │ [500,000,000│ tonnes CO2     ││
│  │ Injection Rate              │ [3,500    ] │ tonnes/day     ││
│  │ Number of Injection Wells   │ [3        ] │ wells          ││
│  │ Monitoring Wells            │ [5        ] │ wells          ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  STORAGE MONITORING AND VERIFICATION                            │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Monitoring Activity         │ Frequency   │ Status         ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Injection pressure/temp     │ Continuous  │ [Active]       ││
│  │ CO2 plume tracking          │ Quarterly   │ [Active]       ││
│  │ Microseismic monitoring     │ Continuous  │ [Active]       ││
│  │ Groundwater monitoring      │ Quarterly   │ [Active]       ││
│  │ Soil gas monitoring         │ Monthly     │ [Active]       ││
│  │ Atmospheric monitoring      │ Continuous  │ [Active]       ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  CO2 MASS BALANCE                                               │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ CO2 Captured                │ [1,200,000] │ tonnes CO2     ││
│  │ CO2 Transported             │ [1,200,000] │ tonnes CO2     ││
│  │ CO2 Injected                │ [1,200,000] │ tonnes CO2     ││
│  │ Transport Emissions         │ [2,500    ] │ tonnes CO2     ││
│  │ Fugitive Emissions          │ [500      ] │ tonnes CO2     ││
│  │ Net CO2 Stored              │ [1,197,000] │ tonnes CO2     ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  [Upload Injection Data] [View Monitoring Reports]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Capture rate | 50-99% | "Capture rate outside valid range" |
| CO2 purity | > 95% | "CO2 purity must be > 95%" |
| Mass balance | Captured ≈ Injected | "Mass balance discrepancy detected" |
| Storage depth | > 800 m | "Storage depth must be > 800m for supercritical" |
| Injection rate | < Well capacity | "Injection rate exceeds well capacity" |

---

#### 4.5.3 Biochar - Pyrolysis and Carbon Storage

##### Overview
Biochar projects produce biochar through pyrolysis of biomass and apply it to soil or use it in durable products. The UI must handle feedstock characteristics, pyrolysis conditions, biochar properties, and application methods.

##### Input Form Structure

###### Section A: Feedstock and Pyrolysis

```
┌─────────────────────────────────────────────────────────────────┐
│ FEEDSTOCK AND PYROLYSIS                                         │
│                                                                 │
│  FEEDSTOCK CHARACTERISTICS                                      │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Feedstock Type              │ [Wood chips ▼]               ││
│  │ Feedstock Source            │ [Sawmill residues ▼]         ││
│  │ Annual Feedstock Input      │ [15,000   ] │ tonnes (dry)   ││
│  │ Moisture Content            │ [15       ] │ %              ││
│  │ Carbon Content (dry)        │ [48       ] │ %              ││
│  │ Ash Content                 │ [2        ] │ %              │
│  │ Bulk Density                │ [250      ] │ kg/m³          ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  PYROLYSIS SYSTEM                                               │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Reactor Type                │ [Continuous rotary kiln ▼]   ││
│  │ Pyrolysis Temperature       │ [550      ] │ °C             ││
│  │ Residence Time              │ [45       ] │ minutes        ││
│  │ Heating Rate                │ [50       ] │ °C/min         ││
│  │ Operation Mode              │ [Slow pyrolysis ▼]           ││
│  │ Start Date                  │ [📅 04/01/2022  ]           ││
│  │ Operating Hours             │ [6,500    ] │ hours/year     ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  MASS AND ENERGY BALANCE                                        │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Output Stream               │ Yield       │ Quantity       ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Biochar                     │ [30       ] │ [4,500    ]    ││
│  │ Pyrolysis oil               │ [35       ] │ [5,250    ]    ││
│  │ Syngas (non-condensable)    │ [30       ] │ [4,500    ]    ││
│  │ Process heat (recovered)    │ [5        ] │ [750      ]    ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│  Units: % of dry feedstock input; tonnes/year for quantity     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Biochar Properties

```
┌─────────────────────────────────────────────────────────────────┐
│ BIOCHAR PROPERTIES                                              │
│                                                                 │
│  PHYSICAL AND CHEMICAL PROPERTIES                               │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Carbon Content (dry)        │ [75       ] │ %              ││
│  │ Hydrogen Content            │ [3.5      ] │ %              ││
│  │ Oxygen Content              │ [12       ] │ %              ││
│  │ Nitrogen Content            │ [0.8      ] │ %              ││
│  │ Ash Content                 │ [8.7      ] │ %              ││
│  │ pH                          │ [9.2      ] │ -              ││
│  │ Surface Area (BET)          │ [350      ] │ m²/g           ││
│  │ Bulk Density                │ [180      ] │ kg/m³          ││
│  │ Particle Size (majority)    │ [2-10     ] │ mm             ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  STABILITY ASSESSMENT                                           │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Stability Indicator         │ Value       │ Method         ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ H/C Molar Ratio             │ [0.56     ] │ Elemental      ││
│  │ O/C Molar Ratio             │ [0.12     ] │ Elemental      ││
│  │ Fixed Carbon                │ [82       ] │ Proximate      ││
│  │ Volatile Matter             │ [12       ] │ Proximate      ││
│  │ Labile Carbon Fraction      │ [15       ] │ Oxidation      ││
│  │ Recalcitrant C Fraction     │ [85       ] │ Oxidation      ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  [Upload Lab Analysis] [View Certification]                     │
│                                                                 │
│  ESTIMATED PERSISTENCE                                          │
│  Based on H/C ratio of 0.56: Mean residence time ~500 years    │
│  Carbon stability class: [High ▼]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Biochar Application

```
┌─────────────────────────────────────────────────────────────────┐
│ BIOCHAR APPLICATION                                             │
│                                                                 │
│  APPLICATION METHODS                                            │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Application Type            │ Quantity    │ % of Total     ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Agricultural soil           │ [3,150    ] │ [70       ]   ││
│  │ Horticultural use           │ [675      ] │ [15       ]   ││
│  │ Animal bedding              │ [450      ] │ [10       ]   ││
│  │ Compost additive            │ [225      ] │ [5        ]   ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total Applied               │ [4,500    ] │ [100      ]   ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│  Units: tonnes/year                                             │
│                                                                 │
│  AGRICULTURAL APPLICATION DETAILS                               │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Application Rate            │ [10       ] │ tonnes/ha      ││
│  │ Application Area            │ [315      ] │ hectares       ││
│  │ Crop Type                   │ [Corn ▼]    │                ││
│  │ Soil Type                   │ [Loam ▼]    │                ││
│  │ Application Method          │ [Broadcast + tillage ▼]      ││
│  │ Application Date            │ [📅 04/15/2023  ]           ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  CARBON ACCOUNTING                                              │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Feedstock Carbon            │ [6,900    ] │ tonnes C       ││
│  │ Biochar Carbon              │ [3,375    ] │ tonnes C       ││
│  │ Carbon Conversion           │ [48.9     ] │ %              ││
│  │ Stable Carbon (85%)         │ [2,869    ] │ tonnes C       ││
│  │ Stable CO2 Equivalent       │ [10,520   ] │ tonnes CO2e    ││
│  │ Process Emissions           │ [450      ] │ tonnes CO2e    ││
│  │ Transport Emissions         │ [180      ] │ tonnes CO2e    ││
│  │ Net Carbon Removal          │ [9,890    ] │ tonnes CO2e    ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  [Upload Application Records] [View Field Locations]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Yield sum | ≈ 100% | "Yield percentages should total ~100%" |
| H/C ratio | 0.3-1.0 | "H/C ratio outside typical range" |
| Carbon content | 50-95% | "Carbon content outside typical range" |
| Pyrolysis temp | 300-800°C | "Temperature outside typical range" |
| Application rate | 1-50 t/ha | "Application rate outside typical range" |

---


### 4.6 ENGINEERED REMOVALS

---

#### 4.6.1 Mineralization - Concrete Carbonation, ERW, Mine Tailings

##### Overview
Mineralization projects accelerate natural weathering processes to permanently sequester CO2 in stable mineral forms. The UI must handle feedstock properties, reaction conditions, and carbonation verification.

##### Input Form Structure

###### Section A: Mineralization Pathway

```
┌─────────────────────────────────────────────────────────────────┐
│ MINERALIZATION PATHWAY                                          │
│                                                                 │
│  TECHNOLOGY TYPE                                                │
│  ● Enhanced Rock Weathering (ERW) - agricultural application    │
│  ○ Enhanced Rock Weathering (ERW) - coastal application         │
│  ○ Concrete carbonation (cured concrete)                        │
│  ○ Concrete carbonation (CO2-cured concrete)                    │
│  ○ Mine tailings carbonation                                    │
│  ○ Industrial waste carbonation (steel slag, cement kiln dust)  │
│  ○ Ex-situ mineralization (reactor-based)                       │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  PROJECT SPECIFICATIONS                                         │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Project Name                │ [Agricultural ERW Project X] ││
│  │ Feedstock Type              │ [Basalt rock dust ▼]         ││
│  │ Feedstock Source            │ [Quarry Y, Region Z]         ││
│  │ Annual Feedstock Quantity   │ [50,000   ] │ tonnes         ││
│  │ Project Start Date          │ [📅 01/01/2023  ]           ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Feedstock Characterization

```
┌─────────────────────────────────────────────────────────────────┐
│ FEEDSTOCK CHARACTERIZATION                                      │
│                                                                 │
│  MINERALOGICAL COMPOSITION                                      │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Mineral/Component           │ Content     │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ SiO2                        │ [48.5     ] │ %              ││
│  │ Al2O3                       │ [15.2     ] │ %              ││
│  │ Fe2O3                       │ [12.8     ] │ %              ││
│  │ CaO                         │ [9.5      ] │ %              ││
│  │ MgO                         │ [6.8      ] │ %              ││
│  │ Na2O                        │ [3.2      ] │ %              ││
│  │ K2O                         │ [1.5      ] │ %              ││
│  │ Other                       │ [2.5      ] │ %              ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total                       │ [100      ] │ %              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  REACTIVE ELEMENTS                                              │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total CaO + MgO             │ [16.3     ] │ %              ││
│  │ Reactive CaO + MgO          │ [12.5     ] │ %              ││
│  │ Particle Size (d50)         │ [75       ] │ μm             ││
│  │ Surface Area                │ [2.5      ] │ m²/g           ││
│  │ Bulk Density                │ [1,450    ] │ kg/m³          ││
│  │ Moisture Content            │ [2        ] │ %              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  [Upload XRD Analysis] [Upload Geochemical Analysis]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Application and Reaction Conditions

```
┌─────────────────────────────────────────────────────────────────┐
│ APPLICATION AND REACTION CONDITIONS                             │
│                                                                 │
│  APPLICATION DETAILS (ERW - Agricultural)                       │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Application Rate            │ [10       ] │ tonnes/ha      ││
│  │ Application Area            │ [5,000    ] │ hectares       ││
│  │ Application Method          │ [Broadcast + incorporation ▼]││
│  │ Application Depth           │ [15       ] │ cm             ││
│  │ Crop Type                   │ [Soybeans ▼]│                ││
│  │ Soil Type                   │ [Sandy loam ▼]               ││
│  │ Application Frequency       │ [Annual ▼]  │                ││
│  │ First Application Date      │ [📅 03/15/2023  ]           ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  ENVIRONMENTAL CONDITIONS                                       │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Mean Annual Temperature     │ [18       ] │ °C             ││
│  │ Mean Annual Precipitation   │ [1,200    ] │ mm             ││
│  │ Average Soil pH             │ [6.2      ] │ -              ││
│  │ Soil Moisture (field cap.)  │ [25       ] │ %              ││
│  │ Elevation                   │ [450      ] │ m              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  WEATHERING RATE PARAMETERS                                     │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Source         ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Dissolution Rate (r0)       │ [1.2e-11]   │ mol/m²/s       ││
│  │ Rate Source                 │ [Lab study ▼]                ││
│  │ Activation Energy           │ [55       ] │ kJ/mol         ││
│  │ pH Dependence Factor        │ [0.3      ] │ -              ││
│  │ Temperature Dependence      │ [Applied ▼] │                ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section D: Carbon Removal Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│ CARBON REMOVAL CALCULATION                                      │
│                                                                 │
│  THEORETICAL CARBON REMOVAL POTENTIAL                           │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Feedstock Quantity          │ [50,000   ] │ tonnes         ││
│  │ Reactive CaO + MgO          │ [12.5     ] │ %              ││
│  │ Molar Mass CaO + MgO        │ [56/40    ] │ g/mol          ││
│  │ Stoichiometric CO2 Capacity │ [0.785    ] │ tCO2/t rock    ││
│  │ Theoretical Max Removal     │ [39,250   ] │ tonnes CO2     ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  REALIZED CARBON REMOVAL                                        │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Weathering Efficiency       │ [8        ] │ % (Year 1)     ││
│  │ Cumulative Efficiency (5yr) │ [25       ] │ %              ││
│  │ Realized Removal (Year 1)   │ [3,140    ] │ tonnes CO2     ││
│  │ Realized Removal (5 years)  │ [9,813    ] │ tonnes CO2     ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  EMISSIONS AND NET REMOVAL                                      │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Source                      │ Emissions   │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Mining and crushing         │ [750      ] │ tonnes CO2e    ││
│  │ Transport to site           │ [1,250    ] │ tonnes CO2e    ││
│  │ Application (equipment)     │ [180      ] │ tonnes CO2e    ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total Project Emissions     │ [2,180    ] │ tonnes CO2e    ││
│  │ Gross Carbon Removal        │ [3,140    ] │ tonnes CO2     ││
│  │ Net Carbon Removal          │ [960      ] │ tonnes CO2e    ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  [Upload Field Measurements] [View Soil Analysis Results]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Mineral composition | Sum ≈ 100% | "Composition should total ~100%" |
| Reactive CaO+MgO | < Total CaO+MgO | "Reactive cannot exceed total" |
| Weathering efficiency | 0-100% | "Efficiency must be 0-100%" |
| Application rate | 1-100 t/ha | "Application rate outside typical range" |
| Particle size | 10-500 μm | "Particle size outside typical range" |

---

#### 4.6.2 DAC - Direct Air Capture with Durable Storage

##### Overview
Direct Air Capture (DAC) projects use engineered systems to capture CO2 directly from ambient air and store it permanently. The UI must handle capture system performance, energy consumption, and storage verification.

##### Input Form Structure

###### Section A: DAC System Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│ DAC SYSTEM CONFIGURATION                                        │
│                                                                 │
│  DAC TECHNOLOGY TYPE                                            │
│  ● Solid sorbent (temperature-vacuum swing)                     │
│  ○ Liquid solvent (temperature swing)                           │
│  ○ Moisture swing (passive)                                     │
│  ○ Electrochemical                                              │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  SYSTEM SPECIFICATIONS                                          │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Facility Name               │ [DAC Facility X]             ││
│  │ Facility Location           │ [Region Y, Country Z]        ││
│  │ Manufacturer/Technology     │ [Company A - Model B ▼]      ││
│  │ Number of Contactors        │ [12       ] │ units          ││
│  │ Contactor Area (each)       │ [2,000    ] │ m²             ││
│  │ Design Capture Capacity     │ [1,000    ] │ tonnes CO2/year││
│  │ Commissioning Date          │ [📅 06/01/2023  ]           ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  SORBENT/SOLVENT CHARACTERISTICS                                │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Sorbent Type                │ [Amine-functionalized ▼]     ││
│  │ Sorbent Loading             │ [2.5      ] │ mmol CO2/g     ││
│  │ Cycle Time                  │ [45       ] │ minutes        ││
│  │ Regeneration Temperature    │ [95       ] │ °C             ││
│  │ Sorbent Lifetime            │ [5        ] │ years          ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Capture Performance

```
┌─────────────────────────────────────────────────────────────────┐
│ CAPTURE PERFORMANCE                                             │
│                                                                 │
│  OPERATING CONDITIONS                                           │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Ambient CO2 Concentration   │ [420      ] │ ppm            ││
│  │ Air Flow Rate               │ [50,000   ] │ m³/hr          ││
│  │ Capture Efficiency          │ [75       ] │ %              ││
│  │ Operating Hours             │ [7,500    ] │ hrs/year       ││
│  │ Capacity Factor             │ [85       ] │ %              ││
│  │ Availability                │ [92       ] │ %              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  CAPTURE OUTPUT                                                 │
│  ┌──────────┬───────────────┬───────────────┬─────────────────┐│
│  │ Month    │ Operating     │ CO2 Captured  │ Capture Rate    ││
│  │          │ Hours         │ (tonnes)      │ (tCO2/hr)       ││
│  ├──────────┼───────────────┼───────────────┼─────────────────┤│
│  │ Jun 2023 │ [620        ] │ [85         ] │ [0.137      ]  ││
│  │ Jul 2023 │ [680        ] │ [92         ] │ [0.135      ]  ││
│  │ Aug 2023 │ [650        ] │ [88         ] │ [0.135      ]  ││
│  │ ...      │ ...           │ ...           │ ...             ││
│  ├──────────┼───────────────┼───────────────┼─────────────────┤│
│  │ Total    │ [7,500      ] │ [1,012      ] │ [0.135      ]  ││
│  └──────────┴───────────────┴───────────────┴─────────────────┘│
│                                                                 │
│  CO2 PRODUCT SPECIFICATIONS                                     │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ CO2 Purity                  │ [99.9     ] │ %              ││
│  │ Water Content               │ [<100     ] │ ppm            ││
│  │ Delivery Pressure           │ [150      ] │ bar            ││
│  │ Delivery Temperature        │ [25       ] │ °C             ││
│  │ Phase                       │ [Supercritical ▼]            ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Energy Consumption and Emissions

```
┌─────────────────────────────────────────────────────────────────┐
│ ENERGY CONSUMPTION AND EMISSIONS                                │
│                                                                 │
│  ENERGY INPUTS                                                  │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Energy Source               │ Consumption │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Electricity (fans, pumps)   │ [4,500    ] │ MWh/year       ││
│  │ Heat (regeneration)         │ [8,500    ] │ MWh/year       ││
│  │ Heat Source                 │ [Renewable ▼]                ││
│  │ ─────────────────────────────────────────────────────────  ││
│  │ Total Primary Energy        │ [13,000   ] │ MWh/year       ││
│  │ Specific Energy Consumption │ [12.8     ] │ GJ/tCO2        ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  ELECTRICITY DETAILS                                            │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Grid Connection             │ [Yes ▼]     │                ││
│  │ Grid Emission Factor        │ [0.35     ] │ tCO2e/MWh      ││
│  │ On-site Renewables          │ [50       ] │ % of total     ││
│  │ Renewable Source            │ [Solar PV ▼]│                ││
│  │ PPA for remainder           │ [Yes ▼]     │                ││
│  │ PPA Emission Factor         │ [0.05     ] │ tCO2e/MWh      ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  EMISSIONS CALCULATION                                          │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Source                      │ Emissions   │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Electricity (grid portion)  │ [788      ] │ tonnes CO2e    ││
│  │ Electricity (PPA portion)   │ [113      ] │ tonnes CO2e    ││
│  │ Heat generation             │ [0        ] │ tonnes CO2e    ││
│  │ Sorbent production          │ [150      ] │ tonnes CO2e    ││
│  │ Other process emissions     │ [50       ] │ tonnes CO2e    ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total Lifecycle Emissions   │ [1,101    ] │ tonnes CO2e    ││
│  │ Gross CO2 Captured          │ [1,012    ] │ tonnes CO2     ││
│  │ Net Carbon Removal          │ [-89      ] │ tonnes CO2e    ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  ⚠️ Current configuration results in net positive emissions.   │
│     Consider increasing renewable energy share.                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section D: CO2 Storage

```
┌─────────────────────────────────────────────────────────────────┐
│ CO2 STORAGE                                                     │
│                                                                 │
│  STORAGE METHOD                                                 │
│  ● Geologic storage (saline aquifer)                            │
│  ○ Geologic storage (basalt formation)                          │
│  ○ Mineral carbonation                                          │
│  ○ Concrete curing                                              │
│  ○ Other durable storage                                        │
│                                                                 │
│  STORAGE VERIFICATION                                           │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Storage Site                │ [Saline Aquifer X]           ││
│  │ Injection Date              │ [📅 06/15/2023  ]           ││
│  │ Quantity Injected           │ [85       ] │ tonnes CO2     ││
│  │ Injection Well              │ [DAC-001  ] │                ││
│  │ Monitoring Wells            │ [3        ] │                ││
│  │ Monitoring Plan             │ [Approved ▼]│                ││
│  │ Third-Party Verification    │ [Pending ▼] │                ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  MASS BALANCE VERIFICATION                                      │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ CO2 Captured                │ [85       ] │ tonnes         ││
│  │ CO2 Transported             │ [85       ] │ tonnes         ││
│  │ CO2 Injected                │ [85       ] │ tonnes         ││
│  │ Mass Balance Closure        │ [100      ] │ %              ││
│  │ Measurement Uncertainty     │ [±2       ] │ %              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  [View Injection Records] [Download Monitoring Data]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Capture efficiency | 50-95% | "Capture efficiency outside valid range" |
| CO2 purity | > 95% | "CO2 purity must be > 95%" |
| Specific energy | 5-30 GJ/tCO2 | "Energy consumption outside typical range" |
| Mass balance | 95-105% | "Mass balance outside acceptable range" |
| Capacity factor | 50-100% | "Capacity factor must be 50-100%" |

---

#### 4.6.3 BiCRS / Biomass Storage - BiCRS, Geological Storage

##### Overview
Biomass Carbon Removal and Storage (BiCRS) projects convert biomass to durable carbon products or store biomass carbon geologically. The UI must handle biomass sourcing, conversion processes, and storage durability.

##### Input Form Structure

###### Section A: BiCRS Pathway

```
┌─────────────────────────────────────────────────────────────────┐
│ BiCRS PATHWAY                                                   │
│                                                                 │
│  CARBON REMOVAL PATHWAY                                         │
│  ● Biomass to bio-oil for geological storage                    │
│  ○ Biomass to biochar (see Biochar module)                      │
│  ○ Biomass to hydrogen + CO2 capture                            │
│  ○ Biomass combustion + CCS                                     │
│  ○ Biomass gasification + CCS                                   │
│  ○ Algae cultivation + burial                                   │
│  ○ Woody biomass burial/storage                                 │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  PROJECT SPECIFICATIONS                                         │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Project Name                │ [Biomass to Bio-oil Project] ││
│  │ Facility Location           │ [Region Y, Country Z]        ││
│  │ Technology Provider         │ [Company A ▼]                ││
│  │ Annual Biomass Input        │ [100,000  ] │ tonnes (dry)   ││
│  │ Project Start Date          │ [📅 01/01/2024  ]           ││
│  │ Design Life                 │ [20       ] │ years          ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section B: Biomass Feedstock

```
┌─────────────────────────────────────────────────────────────────┐
│ BIOMASS FEEDSTOCK                                               │
│                                                                 │
│  FEEDSTOCK TYPE                                                 │
│  ● Agricultural residues                                        │
│  ○ Forestry residues                                            │
│  ○ Energy crops (dedicated)                                     │
│  ○ Woody biomass (sawmill waste)                                │
│  ○ Municipal green waste                                        │
│  ○ Algae/biomass cultivated for removal                         │
│  ○ Other: [Specify                                     ]       │
│                                                                 │
│  FEEDSTOCK CHARACTERISTICS                                      │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Feedstock Type              │ [Corn stover ▼]              ││
│  │ Annual Quantity (wet)       │ [125,000  ] │ tonnes         ││
│  │ Moisture Content            │ [20       ] │ %              ││
│  │ Annual Quantity (dry)       │ [100,000  ] │ tonnes         ││
│  │ Carbon Content (dry)        │ [45       ] │ %              ││
│  │ Ash Content                 │ [8        ] │ %              ││
│  │ Higher Heating Value        │ [18       ] │ MJ/kg          ││
│  │ Lower Heating Value         │ [16.5     ] │ MJ/kg          ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  SUSTAINABILITY CRITERIA                                        │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Criterion                   │ Status      │ Documentation  ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ No competition with food    │ [Verified]  │ [View Cert.]   ││
│  │ No deforestation risk       │ [Verified]  │ [View Cert.]   ││
│  │ Sustainable harvesting      │ [Verified]  │ [View Cert.]   ││
│  │ Chain of custody            │ [Verified]  │ [View Cert.]   ││
│  │ Lifecycle assessment        │ [Verified]  │ [View LCA]     ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  [Upload Sustainability Certificate] [View Supply Chain Map]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section C: Conversion Process

```
┌─────────────────────────────────────────────────────────────────┐
│ CONVERSION PROCESS                                              │
│                                                                 │
│  PROCESS TECHNOLOGY                                             │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Technology                  │ [Fast pyrolysis ▼]           ││
│  │ Reactor Type                │ [Fluidized bed ▼]            ││
│  │ Operating Temperature       │ [500      ] │ °C             ││
│  │ Residence Time              │ [2        ] │ seconds        ││
│  │ Heating Rate                │ [1,000    ] │ °C/s           ││
│  │ Pressure                    │ [Atmospheric ▼]              ││
│  │ Operating Hours             │ [7,500    ] │ hrs/year       ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  PRODUCT YIELDS                                                 │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Product                     │ Yield       │ Quantity       ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Bio-oil                     │ [65       ] │ [65,000   ]    ││
│  │ Biochar                     │ [20       ] │ [20,000   ]    ││
│  │ Non-condensable gas         │ [12       ] │ [12,000   ]    ││
│  │ Aqueous phase               │ [3        ] │ [3,000    ]    ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Total                       │ [100      ] │ [100,000  ]    ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│  Units: % of dry feedstock; tonnes/year for quantity           │
│                                                                 │
│  BIO-OIL CHARACTERISTICS                                        │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Carbon Content              │ [55       ] │ %              ││
│  │ Hydrogen Content            │ [7        ] │ %              ││
│  │ Oxygen Content              │ [37       ] │ %              ││
│  │ Moisture Content            │ [25       ] │ %              ││
│  │ Higher Heating Value        │ [22       ] │ MJ/kg          ││
│  │ Viscosity (40°C)            │ [125      ] │ cSt            ││
│  │ pH                          │ [2.8      ] │ -              ││
│  │ Density                     │ [1,200    ] │ kg/m³          ││
│  │ Stability                   │ [Stable ▼]  │                ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

###### Section D: Carbon Storage and Accounting

```
┌─────────────────────────────────────────────────────────────────┐
│ CARBON STORAGE AND ACCOUNTING                                   │
│                                                                 │
│  STORAGE METHOD                                                 │
│  ● Geological injection (depleted oil field)                    │
│  ○ Geological injection (saline aquifer)                        │
│  ○ Subsurface injection (approved well)                         │
│  ○ Ocean storage (if permitted)                                 │
│  ○ Other durable storage                                        │
│                                                                 │
│  CARBON FLOW ANALYSIS                                           │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Biomass Carbon Input        │ [41,250   ] │ tonnes C       ││
│  │ Bio-oil Carbon              │ [35,750   ] │ tonnes C       ││
│  │ Biochar Carbon              │ [15,000   ] │ tonnes C       ││
│  │ Gas Phase Carbon            │ [3,600    ] │ tonnes C       ││
│  │ Aqueous Phase Carbon        │ [900      ] │ tonnes C       ││
│  │ Carbon Conversion Efficiency│ [86.7     ] │ %              ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  DURABILITY ASSESSMENT                                          │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Storage Method              │ [Geological injection ▼]     ││
│  │ Expected Storage Duration   │ [10,000   ] │ years          ││
│  │ Monitoring Required         │ [100      ] │ years          ││
│  │ Leakage Risk Assessment     │ [Very Low ▼]│                ││
│  │ Third-Party Verification    │ [Required ▼]│                ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  NET CARBON REMOVAL                                             │
│  ┌─────────────────────────────┬─────────────┬────────────────┐│
│  │ Parameter                   │ Value       │ Unit           ││
│  ├─────────────────────────────┼─────────────┼────────────────┤│
│  │ Biomass Carbon              │ [41,250   ] │ tonnes C       ││
│  │ Stored as Bio-oil           │ [35,750   ] │ tonnes C       ││
│  │ Stored as Biochar           │ [15,000   ] │ tonnes C       ││
│  │ Total Carbon Stored         │ [50,750   ] │ tonnes C       ││
│  │ CO2 Equivalent              │ [186,083  ] │ tonnes CO2e    ││
│  │ Process Emissions           │ [25,000   ] │ tonnes CO2e    ││
│  │ Transport Emissions         │ [8,000    ] │ tonnes CO2e    ││
│  │ Biomass Production Emissions│ [12,000   ] │ tonnes CO2e    ││
│  │ Total Project Emissions     │ [45,000   ] │ tonnes CO2e    ││
│  │ Net Carbon Removal          │ [141,083  ] │ tonnes CO2e    ││
│  └─────────────────────────────┴─────────────┴────────────────┘│
│                                                                 │
│  [View Storage Verification] [Download LCA Report]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| Yield sum | ≈ 100% | "Yield percentages should total ~100%" |
| Carbon balance | Input ≈ Output | "Carbon balance discrepancy detected" |
| Storage duration | > 100 years | "Storage duration must be > 100 years" |
| Sustainability | All verified | "All sustainability criteria must be verified" |
| Moisture content | 5-60% | "Moisture content outside typical range" |

---


## 5. CALCULATION INTERFACE

### 5.1 Real-Time Calculation Preview

#### Purpose
Provide users with immediate feedback on carbon credit calculations as they input data, enabling iterative refinement before final submission.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ REAL-TIME CALCULATION PREVIEW                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CALCULATION STATUS                                      │   │
│  │                                                         │   │
│  │ Status: ● Ready to Calculate                            │   │
│  │ Last Updated: Just now                                  │   │
│  │                                                         │   │
│  │ [    RUN CALCULATION    ]    [Auto-calculate: ✓ On]    │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ QUICK RESULTS            │  │ CREDIT BREAKDOWN         │    │
│  │                          │  │                          │    │
│  │ Total Credits:           │  │ ┌──────────────────────┐ │    │
│  │ 45,230 tCO2e             │  │ │ Above-ground biomass │ │    │
│  │                          │  │ │ ████████████ 52%     │ │    │
│  │ Annual Average:          │  │ │ Below-ground biomass │ │    │
│  │ 2,262 tCO2e/year         │  │ │ ███████ 31%          │ │    │
│  │                          │  │ │ Soil carbon          │ │    │
│  │ Crediting Period:        │  │ │ ████ 17%             │ │    │
│  │ 20 years                 │  │ └──────────────────────┘ │    │
│  │                          │  │                          │    │
│  │ Uncertainty: ±8.5%       │  │                          │    │
│  │                          │  │                          │    │
│  │ Confidence Level: 95%    │  │                          │    │
│  │                          │  │                          │    │
│  │ [View Details]           │  │                          │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ YEAR-BY-YEAR CREDIT PROJECTION                          │   │
│  │                                                         │   │
│  │  Credits (tCO2e/year)                                   │   │
│  │  3k ┤      ╭─╮                                            │   │
│  │     │     ╭╯ ╰╮                                           │   │
│  │ 2.5k┤    ╭╯   ╰╮                                          │   │
│  │     │   ╭╯     ╰──────────────                            │   │
│  │  2k ┤  ╭╯                                                 │   │
│  │     │ ╭╯                                                  │   │
│  │ 1.5k┤╭╯                                                   │   │
│  │     ┼─┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬───│   │
│  │     1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17   │   │
│  │                    Year of Project                        │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ VALIDATION STATUS                                       │   │
│  │                                                         │   │
│  │ ✓ All required fields completed                        │   │
│  │ ✓ Data ranges validated                                │   │
│  │ ⚠ One warning: Planting density above typical range    │   │
│  │ ✓ Methodology requirements met                         │   │
│  │                                                         │   │
│  │ [View All Warnings]                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Auto-Calculation Settings
- **Trigger**: On field change (with debounce), manual button, or scheduled
- **Debounce Delay**: 500ms after last keystroke
- **Minimum Interval**: 5 seconds between calculations
- **Background Processing**: Show loading indicator for calculations > 2 seconds

#### Calculation Results Display
- **Total Credits**: Prominent display with trend indicator
- **Annual Average**: Context for crediting period
- **Uncertainty Range**: Confidence interval display
- **Year-by-Year Projection**: Interactive line/bar chart
- **Credit Breakdown**: Stacked bar or pie chart by carbon pool

### 5.2 Parameter Adjustment and Sensitivity Analysis

#### Purpose
Allow users to explore how changes in key parameters affect credit calculations.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ SENSITIVITY ANALYSIS                                            │
│                                                                 │
│  SELECT PARAMETERS TO ANALYZE                                   │
│  [✓] Growth rate (biomass accumulation)                        │
│  [✓] Survival rate                                            │
│  [ ] Wood density                                             │
│  [✓] Baseline carbon stock                                    │
│  [ ] Discount rate                                            │
│                                                                 │
│  PARAMETER RANGES                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Growth Rate                                             │   │
│  │                                                         │   │
│  │ Base Value: 5.2 tCO2e/ha/year                          │   │
│  │                                                         │   │
│  │ Range: [◄────●───────────►]                            │   │
│  │        -30%   Base    +30%                              │   │
│  │                                                         │   │
│  │ Min: [3.6]    Max: [6.8]    Step: [0.5]                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Survival Rate                                           │   │
│  │                                                         │   │
│  │ Base Value: 85%                                        │   │
│  │                                                         │   │
│  │ Range: [◄────●───────────►]                            │   │
│  │        70%    85%     95%                               │   │
│  │                                                         │   │
│  │ Min: [70]     Max: [95]     Step: [5]                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                    [    RUN SENSITIVITY ANALYSIS    ]          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SENSITIVITY RESULTS                                     │   │
│  │                                                         │   │
│  │ Tornado Chart: Impact on Total Credits                  │   │
│  │                                                         │   │
│  │  Growth Rate        ████████████████████  ±23%         │   │
│  │  Survival Rate      ██████████████        ±18%         │   │
│  │  Baseline C Stock   ██████████            ±12%         │   │
│  │  Wood Density       ██████                 ±8%         │   │
│  │                                                         │   │
│  │ [View Detailed Results] [Export Data]                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Sensitivity Analysis Features
- **Parameter Selection**: Multi-select from key inputs
- **Range Configuration**: Slider or numeric input for min/max/step
- **Analysis Type**: One-at-a-time or multi-parameter
- **Visualization**: Tornado chart, spider chart, or heat map
- **Export**: CSV or Excel with all scenarios

### 5.3 Calculation History and Versioning

#### Purpose
Track all calculation runs for an activity, enabling comparison and audit trail.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ CALCULATION HISTORY                                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ FILTER & SEARCH                                         │   │
│  │ Date Range: [📅 01/01/2024  ] to [📅 12/31/2024  ]     │   │
│  │ User: [All Users ▼]    Status: [All ▼]                 │   │
│  │                                                         │   │
│  │ [Apply Filters] [Clear] [Export History]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CALCULATION RUNS                                        │   │
│  │                                                         │   │
│  │ Run #  │ Date       │ User      │ Credits   │ Status   │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 15     │ 2024-03-15 │ J. Smith  │ 45,230    │ Current  │   │
│  │ 14     │ 2024-03-10 │ J. Smith  │ 44,850    │ Archived │   │
│  │ 13     │ 2024-02-28 │ A. Lee    │ 43,200    │ Archived │   │
│  │ 12     │ 2024-02-15 │ J. Smith  │ 42,500    │ Archived │   │
│  │ ...    │ ...        │ ...       │ ...       │ ...      │   │
│  │ 1      │ 2023-06-01 │ J. Smith  │ 38,000    │ Baseline │   │
│  │                                                         │   │
│  │ [Compare Selected] [Restore Version] [View Details]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ VERSION COMPARISON (Run #15 vs Run #14)                 │   │
│  │                                                         │   │
│  │ Parameter          │ Run #14    │ Run #15    │ Change   │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Total Credits      │ 44,850     │ 45,230     │ +380     │   │
│  │ Planting Density   │ 1,050/ha   │ 1,100/ha   │ +50      │   │
│  │ Survival Rate      │ 82%        │ 85%        │ +3%      │   │
│  │ Growth Rate        │ 4.8        │ 5.2        │ +0.4     │   │
│  │                                                     │   │
│  │ [View Full Comparison] [Export Diff Report]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Version Control Features
- **Automatic Versioning**: Each calculation creates new version
- **Version Labeling**: User-defined labels (e.g., "Draft", "Final", "Revised")
- **Comparison Tool**: Side-by-side diff of any two versions
- **Restore**: Roll back to previous version
- **Baseline**: Mark official baseline version
- **Comments**: Add notes to each version

---

## 6. MONITORING AND MRV INTERFACE

### 6.1 Monitoring Data Entry Forms

#### Purpose
Structured data entry for periodic monitoring requirements across all activity types.

#### Common Monitoring Fields

| Field | Type | Frequency | Validation |
|-------|------|-----------|------------|
| Monitoring Period | Date Range | Per reporting | Within crediting period |
| Monitoring Date | Date | Per measurement | Not future date |
| Monitor Name | Text | Per report | Required |
| Data Source | Select | Per measurement | Required |
| Quality Flag | Select | Per measurement | Required |

#### Monitoring Data Table
```
┌─────────────────────────────────────────────────────────────────┐
│ MONITORING DATA ENTRY                                           │
│                                                                 │
│  MONITORING PERIOD: [📅 01/01/2024  ] to [📅 12/31/2024  ]     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ FOREST INVENTORY DATA                                   │   │
│  │                                                         │   │
│  │ Plot │ Date       │ Species  │ DBH   │ Height │ Status │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ P001 │ 2024-03-15 │ Acacia   │ 12.5  │ 8.2    │ Live   │   │
│  │ P001 │ 2024-03-15 │ Eucalypt │ 15.2  │ 10.5   │ Live   │   │
│  │ P002 │ 2024-03-16 │ Acacia   │ 8.3   │ 6.1    │ Live   │   │
│  │ ...  │ ...        │ ...      │ ...   │ ...    │ ...    │   │
│  │                                                         │   │
│  │ [+ Add Measurement] [Import from Device] [Bulk Upload] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ DATA QUALITY INDICATORS                                 │   │
│  │                                                         │   │
│  │ Completeness: [████████░░] 85%                         │   │
│  │ Accuracy: [██████████] 95%                             │   │
│  │ Precision: [█████████░] 90%                            │   │
│  │ Timeliness: [██████████] 100%                          │   │
│  │                                                         │   │
│  │ [View Quality Report]                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Verification Evidence Upload

#### Purpose
Centralized document management for verification evidence and supporting documentation.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ VERIFICATION EVIDENCE                                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ UPLOAD DOCUMENTS                                        │   │
│  │                                                         │   │
│  │ Drag and drop files here, or [Browse Files]            │   │
│  │                                                         │   │
│  │ Supported formats: PDF, DOC, XLS, JPG, PNG, GeoTIFF    │   │
│  │ Maximum file size: 100 MB per file                      │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  DOCUMENT CATEGORIES                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │ 📁 Field Measurement Records (12 files)                │   │
│  │    └─ Inventory data, DBH measurements, plot photos    │   │
│  │                                                         │   │
│  │ 📁 Remote Sensing Data (5 files)                       │   │
│  │    └─ Satellite imagery, classification results        │   │
│  │                                                         │   │
│  │ 📁 Laboratory Analysis (8 files)                       │   │
│  │    └─ Soil carbon, biomass, wood density tests         │   │
│  │                                                         │   │
│  │ 📁 Third-Party Reports (3 files)                       │   │
│  │    └─ Validation reports, audit findings               │   │
│  │                                                         │   │
│  │ 📁 Supporting Documentation (15 files)                 │   │
│  │    └─ Maps, permits, land tenure documents             │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ RECENT UPLOADS                                          │   │
│  │                                                         │   │
│  │ File Name              │ Category      │ Date    │ Size │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ inventory_2024_q1.xlsx │ Field Meas.   │ 03/15   │ 2.5MB│   │
│  │ plot_photos.zip        │ Field Meas.   │ 03/15   │ 45MB │   │
│  │ soil_analysis_lab.pdf  │ Lab Analysis  │ 03/10   │ 1.2MB│   │
│  │ ...                    │ ...           │ ...     │ ...  │   │
│  │                                                         │   │
│  │ [View All] [Download Selected] [Delete Selected]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Document Management Features
- **Categorization**: Auto-suggest category based on file type and name
- **Version Control**: Track document versions with comments
- **Metadata**: Capture upload date, user, file size, checksum
- **Search**: Full-text search within documents (PDF, DOC)
- **Preview**: In-browser preview for common formats
- **Download**: Individual or bulk download as ZIP

### 6.3 Timeline and Milestone Tracking

#### Purpose
Visual tracking of project milestones, monitoring schedules, and verification deadlines.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT TIMELINE                                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  2024        2025        2026        2027        2028   │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │                                                         │   │
│  │  ●──────────●──────────●──────────●──────────●         │   │
│  │  │          │          │          │          │          │   │
│  │  │          │          │          │          │          │   │
│  │  ▼          ▼          ▼          ▼          ▼          │   │
│  │ [P]       [M]        [V]        [M]        [V]          │   │
│  │ Planting  Monitor    Verify    Monitor    Verify        │   │
│  │           Due: 03/15  Due: 06/30 Due: 03/15 Due: 06/30  │   │
│  │                                                     │   │
│  │  Legend: [P] Project Event  [M] Monitoring  [V] Verify │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ UPCOMING MILESTONES                                     │   │
│  │                                                         │   │
│  │ Date       │ Milestone              │ Status    │ Days │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 2024-03-15 │ Q1 Monitoring Due      │ ⚠️ Due in 5 days│   │
│  │ 2024-06-30 │ Annual Verification    │ ● Upcoming      │   │
│  │ 2024-09-15 │ Q3 Monitoring Due      │ ● Upcoming      │   │
│  │ 2024-12-31 │ Year-end Report        │ ● Upcoming      │   │
│  │                                                         │   │
│  │ [View Calendar] [Add Reminder] [Export Schedule]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Third-Party Validator Integration

#### Purpose
Interface for external verifiers to access project data, submit findings, and issue verification statements.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ VERIFICATION PORTAL                                             │
│                                                                 │
│  VERIFIER: [Verra Approved Verifier ▼]                         │
│  VERIFICATION STATUS: [In Progress ▼]                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PROJECT DATA ACCESS                                     │   │
│  │                                                         │   │
│  │ The following data packages are available for review:  │   │
│  │                                                         │   │
│  │ [✓] Project Documentation (15 files)                   │   │
│  │ [✓] Calculation Models and Parameters                  │   │
│  │ [✓] Monitoring Data (2020-2024)                        │   │
│  │ [✓] Supporting Evidence and Maps                       │   │
│  │ [✓] Previous Verification Reports                      │   │
│  │                                                         │   │
│  │ [Download All] [Request Additional Data]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ VERIFICATION FINDINGS                                   │   │
│  │                                                         │   │
│  │ Finding #  │ Category    │ Status      │ Priority      │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 001        │ Methodology │ Closed      │ Low           │   │
│  │ 002        │ Data        │ Open        │ Medium        │   │
│  │ 003        │ Boundary    │ Open        │ High          │   │
│  │                                                         │   │
│  │ [View Details] [Add Finding] [Submit Response]         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ VERIFICATION STATEMENT                                  │   │
│  │                                                         │   │
│  │ Status: [Draft ▼]                                       │   │
│  │                                                         │   │
│  │ Verified Credits: [45,230] tCO2e                       │   │
│  │ Verification Date: [📅 2024-06-30  ]                    │   │
│  │ Valid Until: [📅 2029-06-30  ]                          │   │
│  │                                                         │   │
│  │ [Upload Statement] [Preview] [Submit for Approval]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. RESULTS AND REPORTING

### 7.1 Credit Calculation Results Display

#### Purpose
Comprehensive display of calculation results with drill-down capabilities.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ CALCULATION RESULTS                                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ EXECUTIVE SUMMARY                                       │   │
│  │                                                         │   │
│  │ Activity: Amazon Reforestation Project                  │   │
│  │ Calculation Date: March 15, 2024                        │   │
│  │ Methodology: VM0047 ARR v2.0                            │   │
│  │                                                         │   │
│  │ ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐│   │
│  │ │ Total Credits   │  │ Annual Average  │  │ Period    ││   │
│  │ │                 │  │                 │  │           ││   │
│  │ │ 45,230          │  │ 2,262           │  │ 20 years  ││   │
│  │ │ tCO2e           │  │ tCO2e/year      │  │           ││   │
│  │ └─────────────────┘  └─────────────────┘  └───────────┘│   │
│  │                                                         │   │
│  │ Uncertainty Range: 41,400 - 49,060 tCO2e (95% CI)      │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │ CARBON POOL BREAKDOWN    │  │ YEARLY PROJECTION        │    │
│  │                          │  │                          │    │
│  │ Above-ground: 52%        │  │ ┌──────────────────────┐ │    │
│  │ ████████████████         │  │ │ Year 1:  1,250       │ │    │
│  │                          │  │ │ Year 5:  2,180       │ │    │
│  │ Below-ground: 31%        │  │ │ Year 10: 2,650       │ │    │
│  │ ██████████               │  │ │ Year 15: 2,450       │ │    │
│  │                          │  │ │ Year 20: 2,120       │ │    │
│  │ Soil carbon: 17%         │  │ └──────────────────────┘ │    │
│  │ ██████                   │  │                          │    │
│  │                          │  │ [View Full Table]        │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ KEY ASSUMPTIONS AND PARAMETERS                          │   │
│  │                                                         │   │
│  │ Parameter              │ Value    │ Source              │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Planting density       │ 1,100/ha │ Project design      │   │
│  │ Survival rate          │ 85%      │ Regional average    │   │
│  │ Growth rate (Acacia)   │ 12 m³/ha │ Local study         │   │
│  │ Wood density           │ 0.55     │ IPCC default        │   │
│  │ Root:shoot ratio       │ 0.24     │ Published value     │   │
│  │                                                        │   │
│  │ [View All Parameters] [Edit Assumptions]               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Download Report] [Export Data] [Share Results] [Print]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Report Generation and Export

#### Purpose
Generate standardized reports in multiple formats for different stakeholders.

#### Report Types

| Report Type | Format | Audience | Content |
|-------------|--------|----------|---------|
| Executive Summary | PDF | Management | High-level results, key metrics |
| Technical Report | PDF | Verifiers | Full methodology, all parameters |
| Data Export | Excel | Analysts | Raw data, calculations, assumptions |
| Verification Package | PDF/Zip | Verifiers | All evidence, formatted per standard |
| Registry Submission | XML/PDF | Registry | Standard format for credit issuance |

#### Report Generation Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ GENERATE REPORT                                                 │
│                                                                 │
│  REPORT TYPE                                                    │
│  ○ Executive Summary                                            │
│  ● Technical Report                                             │
│  ○ Data Export (Excel)                                          │
│  ○ Verification Package                                         │
│  ○ Registry Submission                                          │
│  ○ Custom Report                                                │
│                                                                 │
│  REPORT OPTIONS                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [✓] Include executive summary                          │   │
│  │ [✓] Include all input data                             │   │
│  │ [✓] Include calculation details                        │   │
│  │ [✓] Include uncertainty analysis                       │   │
│  │ [✓] Include sensitivity analysis                       │   │
│  │ [✓] Include charts and visualizations                  │   │
│  │ [ ] Include appendices                                 │   │
│  │ [✓] Include audit trail                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  OUTPUT FORMAT                                                  │
│  ● PDF (formatted)                                              │
│  ○ Word (editable)                                              │
│  ○ Excel (data tables)                                          │
│  ○ CSV (raw data)                                               │
│  ○ XML (machine-readable)                                       │
│                                                                 │
│  LANGUAGE                                                       │
│  ● English                                                      │
│  ○ Spanish                                                      │
│  ○ French                                                       │
│  ○ Portuguese                                                   │
│  ○ Other: [Select                                     ]        │
│                                                                 │
│  [    GENERATE REPORT    ]                                      │
│                                                                 │
│  Estimated generation time: 2-3 minutes                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Audit Trail Viewing

#### Purpose
Complete history of all changes to an activity for audit and compliance purposes.

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ AUDIT TRAIL                                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ FILTER                                                  │   │
│  │ Date Range: [All Time ▼]  User: [All Users ▼]          │   │
│  │ Action Type: [All ▼]  Entity: [All ▼]                  │   │
│  │                                                         │   │
│  │ [Apply] [Reset] [Export Audit Log]                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ AUDIT LOG                                               │   │
│  │                                                         │   │
│  │ Date/Time        │ User      │ Action    │ Entity      │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 2024-03-15 14:32 │ J. Smith  │ Created   │ Activity    │   │
│  │ 2024-03-15 14:45 │ J. Smith  │ Updated   │ Planting    │   │
│  │ 2024-03-15 15:10 │ J. Smith  │ Calculated│ Results     │   │
│  │ 2024-03-16 09:22 │ A. Lee    │ Reviewed  │ Activity    │   │
│  │ 2024-03-16 10:15 │ A. Lee    │ Approved  │ Activity    │   │
│  │ 2024-03-20 11:30 │ J. Smith  │ Uploaded  │ Document    │   │
│  │ ...              │ ...       │ ...       │ ...         │   │
│  │                                                         │   │
│  │ [View Details] [Compare Versions] [Export Selected]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CHANGE DETAILS (2024-03-15 14:45)                       │   │
│  │                                                         │   │
│  │ User: J. Smith                                          │   │
│  │ Action: Updated Planting Density                        │   │
│  │                                                         │   │
│  │ Field: planting_density                                 │   │
│  │ Old Value: 1,050 trees/ha                               │   │
│  │ New Value: 1,100 trees/ha                               │   │
│  │ Reason: Updated based on field survey results           │   │
│  │                                                         │   │
│  │ [View Before/After] [Revert Change]                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. USER MANAGEMENT AND ACCESS CONTROL

### 8.1 User Roles

#### Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| Administrator | System administration | Full access, user management, configuration |
| Project Developer | Creates and manages activities | Create, edit, calculate own activities |
| Technical Analyst | Reviews and validates calculations | View all, edit with approval, run reports |
| Verifier | External verification | Read-only access, submit findings, upload reports |
| Viewer | Read-only access | View assigned activities and reports |
| Field Technician | Inputs monitoring data | Data entry only for assigned activities |

### 8.2 Project-Level Permissions

#### Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT PERMISSIONS                                             │
│                                                                 │
│  PROJECT: Amazon Reforestation Project                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ USER ACCESS                                             │   │
│  │                                                         │   │
│  │ User           │ Role        │ Access Level │ Status   │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ J. Smith       │ Developer   │ Owner        │ Active   │   │
│  │ A. Lee         │ Analyst     │ Edit         │ Active   │   │
│  │ M. Johnson     │ Viewer      │ Read-only    │ Active   │   │
│  │ Verifier Corp  │ Verifier    │ Read-only    │ Pending  │   │
│  │                                                         │   │
│  │ [Add User] [Edit Permissions] [Remove Access]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ACCESS LEVELS                                           │   │
│  │                                                         │   │
│  │ Owner: Full control, can manage permissions            │   │
│  │ Edit: Can modify data and run calculations             │   │
│  │ Read-only: Can view but not modify                     │   │
│  │ Data Entry: Can input monitoring data only             │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Approval Workflows

#### Workflow Stages

| Stage | Action | Approver | Notification |
|-------|--------|----------|--------------|
| Draft | Save work in progress | None | - |
| Review | Submit for internal review | Technical Analyst | Email + In-app |
| Revision | Address review comments | Project Developer | Email + In-app |
| Verification | Submit to verifier | External Verifier | Email + Portal |
| Verified | Approval for issuance | Registry | Email + API |
| Rejected | Return for corrections | Previous stage | Email + In-app |

#### Workflow Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ APPROVAL WORKFLOW                                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ WORKFLOW STATUS                                         │   │
│  │                                                         │   │
│  │ Current Status: ● Under Review                          │   │
│  │                                                         │   │
│  │ Draft → Review → Revision → Verification → Verified    │   │
│  │  ✓       ●                                                │   │
│  │                                                         │   │
│  │ Assigned to: A. Lee (Technical Analyst)                 │   │
│  │ Due Date: 2024-03-25                                    │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ APPROVAL HISTORY                                        │   │
│  │                                                         │   │
│  │ Date       │ From       │ To         │ By      │ Notes  │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ 2024-03-15 │ -          │ Draft      │ J.Smith │ Created│   │
│  │ 2024-03-20 │ Draft      │ Review     │ J.Smith │ Submit │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ACTIONS                                                 │   │
│  │                                                         │   │
│  │ [Approve and Forward] [Request Changes] [Reject]       │   │
│  │                                                         │   │
│  │ Comments:                                               │   │
│  │ ┌─────────────────────────────────────────────────────┐ │   │
│  │ │                                                     │ │   │
│  │ └─────────────────────────────────────────────────────┘ │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. INTEGRATION REQUIREMENTS

### 9.1 Registry System Integration

#### Integration Points

| Function | API Endpoint | Data Format | Frequency |
|----------|--------------|-------------|-----------|
| Project Registration | POST /projects | JSON/XML | On creation |
| Credit Issuance Request | POST /issuance | JSON/XML | On verification |
| Status Updates | GET /status/{id} | JSON | Real-time poll |
| Document Upload | POST /documents | Multipart | On submission |
| Report Retrieval | GET /reports/{id} | PDF/XML | On demand |

### 9.2 Calculation Engine API Integration

#### API Specification
```
┌─────────────────────────────────────────────────────────────────┐
│ CALCULATION ENGINE API                                          │
│                                                                 │
│  ENDPOINT: /api/v1/calculate                                    │
│  METHOD: POST                                                   │
│                                                                 │
│  REQUEST BODY:                                                  │
│  {                                                              │
│    "activity_type": "ARR",                                      │
│    "methodology": "VM0047",                                     │
│    "version": "2.0",                                            │
│    "parameters": {                                              │
│      "planting_area": 1250,                                     │
│      "planting_density": 1100,                                  │
│      "survival_rate": 0.85,                                     │
│      "growth_curve": [...],                                     │
│      "crediting_period": 20                                     │
│    },                                                           │
│    "options": {                                                 │
│      "include_uncertainty": true,                               │
│      "confidence_level": 0.95,                                  │
│      "sensitivity_analysis": false                              │
│    }                                                            │
│  }                                                              │
│                                                                 │
│  RESPONSE:                                                      │
│  {                                                              │
│    "status": "success",                                         │
│    "calculation_id": "calc_12345",                              │
│    "results": {                                                 │
│      "total_credits": 45230,                                    │
│      "annual_average": 2262,                                    │
│      "uncertainty_range": {                                     │
│        "lower": 41400,                                          │
│        "upper": 49060                                           │
│      },                                                         │
│      "yearly_projection": [...],                                │
│      "carbon_pools": {...}                                      │
│    },                                                           │
│    "processing_time_ms": 2450                                   │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Document Management System Integration

#### Features
- **Upload**: Direct upload to cloud storage (S3, Azure Blob, GCS)
- **Version Control**: Track document versions with metadata
- **Access Control**: Role-based access to documents
- **Search**: Full-text indexing and search
- **Preview**: In-browser document preview

### 9.4 Notification System Integration

#### Notification Channels

| Channel | Use Case | Configuration |
|---------|----------|---------------|
| Email | Critical alerts, summaries | SMTP/API integration |
| In-app | Real-time notifications | WebSocket/SSE |
| SMS | Urgent alerts only | Twilio/similar |
| Webhook | System-to-system | Custom endpoint |

#### Notification Events
- Calculation completed
- Verification due
- Approval required
- Data quality issues
- System maintenance

---

## 10. RESPONSIVE DESIGN REQUIREMENTS

### 10.1 Breakpoints

| Breakpoint | Width | Target Devices |
|------------|-------|----------------|
| Mobile | < 640px | Smartphones |
| Tablet | 640-1024px | Tablets, small laptops |
| Desktop | 1024-1440px | Standard monitors |
| Wide | > 1440px | Large monitors |

### 10.2 Mobile Adaptations

#### Dashboard Mobile View
```
┌─────────────────────────┐
│ ☰  Dashboard      👤   │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ Quick Stats         │ │
│ │ Swipe for more →    │ │
│ │                     │ │
│ │ Active: 24          │ │
│ │ Pending: 8          │ │
│ │ Credits: 45,230     │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Recent Activities   │ │
│ │                     │ │
│ │ Amazon Reforest...  │ │
│ │ Status: Active      │ │
│ │                     │ │
│ │ Solar Farm X        │ │
│ │ Status: Pending     │ │
│ │                     │ │
│ │ [View All]          │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Quick Actions       │ │
│ │                     │ │
│ │ [+ New Activity]    │ │
│ │ [Run Calculation]   │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────┐ ┌─────┐ ┌─────┐ │
│ │ 🌳  │ │ 🌾  │ │ ⚡  │ │
│ │Nature│ │Agri │ │Energy│
│ └─────┘ └─────┘ └─────┘ │
│                         │
└─────────────────────────┘
```

### 10.3 Accessibility Requirements (WCAG 2.1 AA)

#### Compliance Checklist

| Requirement | Implementation |
|-------------|----------------|
| Color Contrast | Minimum 4.5:1 for text |
| Keyboard Navigation | Full functionality without mouse |
| Screen Reader Support | ARIA labels, semantic HTML |
| Focus Indicators | Visible focus states |
| Alt Text | All images and charts |
| Form Labels | Associated with inputs |
| Error Identification | Clear, specific error messages |
| Resizable Text | Support up to 200% zoom |

### 10.4 Internationalization Support

#### Supported Languages
- English (default)
- Spanish
- French
- Portuguese
- Mandarin Chinese
- Arabic
- Other languages on request

#### Localization Features
- Date/number formats
- Currency symbols
- Right-to-left (RTL) support
- Time zone handling
- Unit conversions (metric/imperial)

### 10.5 Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load | < 3 seconds | Lighthouse |
| Time to Interactive | < 5 seconds | Lighthouse |
| Calculation Response | < 5 seconds | API timing |
| Report Generation | < 60 seconds | User feedback |
| Concurrent Users | 500+ | Load testing |

---


## 11. SPECIFIC UI COMPONENTS

### 11.1 Form Builders for Dynamic Methodology Fields

#### Purpose
Generate input forms dynamically based on methodology requirements, enabling rapid addition of new methodologies without code changes.

#### Component Specification
```
┌─────────────────────────────────────────────────────────────────┐
│ DYNAMIC FORM BUILDER                                            │
│                                                                 │
│  FORM CONFIGURATION (Admin View)                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Field Name     │ Type    │ Required │ Validation │ Order│   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ planting_date  │ date    │ Yes      │ not_future │ 1    │   │
│  │ area_hectares  │ number  │ Yes      │ >0         │ 2    │   │
│  │ species_mix    │ table   │ Yes      │ sum=100    │ 3    │   │
│  │ growth_curve   │ chart   │ No       │ -          │ 4    │   │
│  │ documents      │ upload  │ No       │ <50MB      │ 5    │   │
│  │                                                         │   │
│  │ [+ Add Field] [Edit] [Delete] [Reorder]                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  FIELD TYPE OPTIONS                                             │
│  • Text (single line)                                           │
│  • Textarea (multi-line)                                        │
│  • Number (integer/decimal)                                     │
│  • Date / DateTime                                              │
│  • Select (dropdown)                                            │
│  • Multi-select (checkboxes)                                    │
│  • Radio buttons                                                │
│  • Table (repeatable rows)                                      │
│  • File upload                                                  │
│  • Chart/graph input                                            │
│  • Map/polygon input                                            │
│  • Calculated field                                             │
│  • Conditional field (show/hide)                                │
│                                                                 │
│  VALIDATION RULES                                               │
│  • Required/Optional                                            │
│  • Min/Max values                                               │
│  • Regex pattern                                                │
│  • Custom formula                                               │
│  • Cross-field validation                                       │
│  • Data type validation                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Dynamic Form Rendering
```javascript
// Example form schema
{
  "methodology_id": "VM0047",
  "version": "2.0",
  "fields": [
    {
      "id": "planting_date",
      "type": "date",
      "label": "Planting Date",
      "required": true,
      "validation": {
        "not_future": true
      },
      "help_text": "Date when planting was completed"
    },
    {
      "id": "area_hectares",
      "type": "number",
      "label": "Planting Area",
      "required": true,
      "unit": "hectares",
      "validation": {
        "min": 0.1,
        "max": 100000
      }
    },
    {
      "id": "species_composition",
      "type": "table",
      "label": "Species Composition",
      "required": true,
      "columns": [
        {"id": "species", "type": "search", "source": "species_db"},
        {"id": "percentage", "type": "number", "unit": "%"},
        {"id": "density", "type": "number", "unit": "trees/ha"}
      ],
      "validation": {
        "sum_equals": 100,
        "sum_field": "percentage"
      }
    }
  ]
}
```

### 11.2 Map Interfaces for Geographic Boundaries

#### Purpose
Interactive map components for defining and editing project boundaries, viewing spatial data, and visualizing results.

#### Component Features
```
┌─────────────────────────────────────────────────────────────────┐
│ MAP INTERFACE                                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                    INTERACTIVE MAP                      │   │
│  │                                                         │   │
│  │    ┌─────────────────────────────────────────────┐     │   │
│  │    │                                             │     │   │
│  │    │         [Satellite View]                    │     │   │
│  │    │                                             │     │   │
│  │    │      ╭─────────────────╮                    │     │   │
│  │    │     ╱   PROJECT AREA    ╲                   │     │   │
│  │    │    │    (1,250 ha)       │                  │     │   │
│  │    │     ╲                    ╱                  │     │   │
│  │    │      ╰─────────────────╯                    │     │   │
│  │    │                                             │     │   │
│  │    │  [+] [-] [⌂] [↔] [📐] [🗑️] [💾]           │     │   │
│  │    │                                             │     │   │
│  │    └─────────────────────────────────────────────┘     │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  DRAWING TOOLS                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Polygon] [Rectangle] [Circle] [Freehand] [Edit] [Clear]│   │
│  │                                                         │   │
│  │ Current Tool: Polygon                                   │   │
│  │ Instructions: Click to add points, double-click to close│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  LAYERS                                                         │
│  [✓] Project Boundary                                         │
│  [✓] Basemap (Satellite)                                      │
│  [ ] Forest Cover (2020)                                      │
│  [ ] Forest Cover (2024)                                      │
│  [ ] Soil Carbon Map                                          │
│  [ ] Administrative Boundaries                                │
│                                                                 │
│  COORDINATE DISPLAY                                             │
│  Lat: -3.4567°  Long: -60.1234°  Zoom: 14                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Map Component Specifications

| Feature | Description | Library |
|---------|-------------|---------|
| Basemaps | Satellite, terrain, street | Mapbox, Google Maps, OSM |
| Drawing | Polygon, rectangle, circle, freehand | Leaflet Draw, Mapbox GL Draw |
| Import | GeoJSON, Shapefile, KML, GPX | Custom parsers |
| Export | GeoJSON, KML, Shapefile | Custom exporters |
| Measurement | Area, distance, coordinates | Turf.js |
| Overlay | Raster tiles, WMS layers | Leaflet, Mapbox GL |
| Clustering | Point clustering for large datasets | Leaflet.markercluster |

### 11.3 Calendar and Timeline Components

#### Purpose
Visual representation of project timelines, monitoring schedules, and milestone tracking.

#### Component Types

##### Calendar View
```
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT CALENDAR                                                │
│                                                                 │
│  March 2024                                                     │
│  ┌────┬────┬────┬────┬────┬────┬────┐                          │
│  │ Sun│ Mon│ Tue│ Wed│ Thu│ Fri│ Sat│                          │
│  ├────┼────┼────┼────┼────┼────┼────┤                          │
│  │    │    │    │    │    │ 1  │ 2  │                          │
│  │    │    │    │    │    │    │    │                          │
│  ├────┼────┼────┼────┼────┼────┼────┤                          │
│  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │ 9  │                          │
│  │    │    │    │    │    │    │    │                          │
│  ├────┼────┼────┼────┼────┼────┼────┤                          │
│  │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │ 16 │                          │
│  │    │    │    │    │    │📊  │    │                          │
│  ├────┼────┼────┼────┼────┼────┼────┤                          │
│  │ 17 │ 18 │ 19 │ 20 │ 21 │ 22 │ 23 │                          │
│  │    │    │    │    │    │    │    │                          │
│  ├────┼────┼────┼────┼────┼────┼────┤                          │
│  │ 24 │ 25 │ 26 │ 27 │ 28 │ 29 │ 30 │                          │
│  │    │    │    │    │    │    │    │                          │
│  ├────┼────┼────┼────┼────┼────┼────┤                          │
│  │ 31 │    │    │    │    │    │    │                          │
│  │    │    │    │    │    │    │    │                          │
│  └────┴────┴────┴────┴────┴────┴────┘                          │
│                                                                 │
│  Legend: 📊 Monitoring Due  ⚠️ Verification Due  ✅ Completed   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Timeline/Gantt View
```
┌─────────────────────────────────────────────────────────────────┐
│ PROJECT TIMELINE                                                │
│                                                                 │
│  Activity                    │ 2024      │ 2025      │ 2026    │
│  ─────────────────────────────────────────────────────────────  │
│  Project Setup               │████       │           │         │
│  Planting (Phase 1)          │  ████     │           │         │
│  Planting (Phase 2)          │    ████   │           │         │
│  Monitoring - Year 1         │    ████████│████      │         │
│  Verification - Year 1       │          █│██         │         │
│  Monitoring - Year 2         │           │███████████│██       │
│  Verification - Year 2       │           │          █│██       │
│  Monitoring - Year 3         │           │           │█████████│
│                                                                 │
│  ████ = Active Period  ░░░░ = Planned  ▒▒▒▒ = Completed         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 11.4 Data Table Components with Filtering/Sorting

#### Purpose
Display tabular data with advanced filtering, sorting, and pagination capabilities.

#### Component Features
```
┌─────────────────────────────────────────────────────────────────┐
│ DATA TABLE                                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ FILTER & SEARCH                                           │   │
│  │                                                         │   │
│  │ Search: [                                          ]   │   │
│  │ Status: [All ▼]  Type: [All ▼]  Date: [All Time ▼]     │   │
│  │                                                         │   │
│  │ [Apply] [Clear] [Save Filter] [Export]                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ACTIVITIES (Showing 1-10 of 156)                        │   │
│  │                                                         │   │
│  │ Name ▼    │ Type    │ Status  │ Credits  │ Date   │ ⚙️ │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Amazon R..│ ARR     │ Active  │ 45,230   │ 03/15  │ ⚙️ │   │
│  │ Solar F.. │ Solar   │ Pending │ 12,500   │ 03/14  │ ⚙️ │   │
│  │ Landfill..│ LFG     │ Verified│ 89,000   │ 03/10  │ ⚙️ │   │
│  │ ...       │ ...     │ ...     │ ...      │ ...    │ ⚙️ │   │
│  │                                                         │   │
│  │ [◀ Prev] [1] [2] [3] ... [16] [Next ▶] [50/page ▼]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  COLUMN OPTIONS                                                 │
│  [✓] Name    [✓] Type    [✓] Status    [✓] Credits    [✓] Date │
│  [ ] Owner   [ ] Region  [ ] Methodology  [ ] Created By        │
│                                                                 │
│  [Apply Columns] [Reset to Default]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Table Component Specifications

| Feature | Description |
|---------|-------------|
| Sorting | Click column header, multi-column sort |
| Filtering | Per-column filters, global search |
| Pagination | Page size options, jump to page |
| Selection | Single/multi-row selection |
| Actions | Row-level actions (edit, delete, view) |
| Export | CSV, Excel, PDF export |
| Column Visibility | Show/hide columns |
| Column Reordering | Drag to reorder |
| Row Expansion | Expand for additional details |
| Infinite Scroll | Alternative to pagination |

### 11.5 Chart and Graph Components

#### Purpose
Visualize carbon credit data, trends, and comparisons through various chart types.

#### Chart Types

##### Line Chart (Time Series)
```
┌─────────────────────────────────────────────────────────────────┐
│ CARBON CREDITS OVER TIME                                        │
│                                                                 │
│  Credits (tCO2e)                                                │
│  50k ┤                                          ╭─────────    │
│      │                                    ╭─────╯              │
│  40k ┤                              ╭────╯                    │
│      │                         ╭────╯                         │
│  30k ┤                   ╭────╯                              │
│      │              ╭────╯                                   │
│  20k ┤         ╭────╯                                        │
│      │    ╭────╯                                             │
│  10k ┤╭───╯                                                  │
│    0 ┼─┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───  │
│      2020  2021  2022  2023  2024  2025  2026  2027  2028    │
│                                                                 │
│  ─── Cumulative Credits    ─ ─ Baseline Scenario                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Bar Chart (Comparison)
```
┌─────────────────────────────────────────────────────────────────┐
│ CREDITS BY CLUSTER                                              │
│                                                                 │
│  Nature-based    ████████████████████████████  35% (158,305)   │
│  Agriculture     ████████████████              20% (90,460)    │
│  Energy          ██████████████████████        25% (113,075)   │
│  Waste           ██████████████                10% (45,230)    │
│  Industrial      ███████                        5% (22,615)    │
│  Removals        ███████                        5% (22,615)    │
│                                                                 │
│  Total: 452,300 tCO2e                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

##### Stacked Area Chart (Carbon Pools)
```
┌─────────────────────────────────────────────────────────────────┐
│ CARBON POOL ACCUMULATION                                        │
│                                                                 │
│  Carbon Stock (tCO2e/ha)                                        │
│  250 ┤                                          ╭─────────    │
│      │                                    ╭─────╯▓▓▓▓▓▓▓▓▓▓   │
│  200 ┤                              ╭────╯▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│      │                         ╭────╯▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│  150 ┤                   ╭────╯░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│      │              ╭────╯░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│  100 ┤         ╭────╯████████████████░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│      │    ╭────╯████████████████████████░░░░░░▓▓▓▓▓▓▓▓▓▓▓   │
│   50 ┤╭───╯████████████████████████████████░░░░░░▓▓▓▓▓▓▓▓▓   │
│    0 ┼─┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───  │
│      0   2   4   6   8   10  12  14  16  18  20               │
│                        Project Year                             │
│                                                                 │
│  ▓▓▓▓ Soil Carbon    ░░░░ Below-ground    ████ Above-ground    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Chart Component Specifications

| Feature | Description | Library |
|---------|-------------|---------|
| Interactive | Hover tooltips, click actions | Chart.js, D3.js, Plotly |
| Responsive | Auto-resize with container | All modern libraries |
| Export | PNG, SVG, PDF export | Built-in or custom |
| Animation | Smooth transitions | CSS/JS animations |
| Accessibility | Screen reader support | ARIA labels |
| Themes | Light/dark mode | CSS variables |

### 11.6 Document Viewer and Annotation Tools

#### Purpose
View, annotate, and collaborate on project documents within the platform.

#### Component Features
```
┌─────────────────────────────────────────────────────────────────┐
│ DOCUMENT VIEWER                                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TOOLBAR                                                 │   │
│  │                                                         │   │
│  │ [◀] [▶] [🔍+] [🔍-] [⌂] [🖊️] [💬] [✓] [💾] [⬇️] [❌]  │   │
│  │                                                         │   │
│  │ Page: [5] / 24    Zoom: [100% ▼]    Mode: [View ▼]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │                          │  │ ANNOTATIONS              │    │
│  │    DOCUMENT PREVIEW      │  │                          │    │
│  │                          │  │ 💬 J. Smith (03/15)      │    │
│  │  ┌──────────────────┐    │  │ "Check this calculation" │    │
│  │  │                  │    │  │ [View] [Reply] [Resolve] │    │
│  │  │  [Page 5 of 24]  │    │  │                          │    │
│  │  │                  │    │  │ ✓ A. Lee (03/16)         │    │
│  │  │  Lorem ipsum...  │    │  │ "Verified and approved"  │    │
│  │  │                  │    │  │ [View]                   │    │
│  │  │  [📄 PDF Content]│    │  │                          │    │
│  │  │                  │    │  │ 🖊️ J. Smith (03/15)      │    │
│  │  │                  │    │  │ "Highlighted section 3.2"│    │
│  │  └──────────────────┘    │  │ [View]                   │    │
│  │                          │  │                          │    │
│  │  [Thumbnail Navigation]  │  │ [+ Add Comment]          │    │
│  │                          │  │                          │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│                                                                 │
│  METADATA                                                       │
│  File: verification_report_2024.pdf    Size: 2.5 MB            │
│  Uploaded: 2024-03-15 by J. Smith    Category: Verification    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Annotation Types
- **Highlight**: Mark important sections
- **Comment**: Add text comments
- **Stamp**: Apply approval/rejection stamps
- **Drawing**: Freehand annotations
- **Text Box**: Add text overlays
- **Shapes**: Arrows, rectangles, circles

---

## 12. APPENDICES

### Appendix A: Common Field Definitions

#### Standard Fields Used Across Clusters

| Field Name | Data Type | Unit | Validation | Description |
|------------|-----------|------|------------|-------------|
| project_name | String | - | 3-100 chars | Human-readable project name |
| project_id | String | - | Unique ID | System-generated identifier |
| start_date | Date | - | Not future | Project commencement date |
| end_date | Date | - | After start | Project completion date |
| total_area | Number | hectares | > 0 | Total project area |
| geographic_boundary | GeoJSON | - | Valid polygon | Project boundary coordinates |
| baseline_carbon_stock | Number | tCO2e/ha | ≥ 0 | Pre-project carbon stock |
| crediting_period | Number | years | 1-30 | Years for credit issuance |
| monitoring_frequency | String | - | Annual/Quarterly | Data collection frequency |

### Appendix B: Unit Conversion Reference

#### Common Unit Conversions

| From | To | Conversion Factor |
|------|----|-------------------|
| tonnes C | tonnes CO2e | × 3.664 |
| kg CH4 | kg CO2e | × 28 (GWP-100) |
| kg N2O | kg CO2e | × 265 (GWP-100) |
| hectares | acres | × 2.471 |
| m³ | ft³ | × 35.315 |
| kg | lbs | × 2.205 |
| km | miles | × 0.621 |
| °C | °F | (× 9/5) + 32 |

### Appendix C: Error Messages and Codes

#### Standard Error Codes

| Code | Message | Severity | Action Required |
|------|---------|----------|-----------------|
| E001 | Required field missing | Error | Complete missing field |
| E002 | Value outside valid range | Error | Enter valid value |
| E003 | Invalid date format | Error | Use YYYY-MM-DD format |
| E004 | File upload failed | Error | Retry upload |
| E005 | Calculation timeout | Warning | Retry or contact support |
| E006 | Invalid geometry | Error | Check boundary coordinates |
| E007 | Duplicate entry | Error | Use unique value |
| W001 | Value above typical range | Warning | Verify value is correct |
| W002 | Missing optional data | Info | Consider adding for accuracy |
| I001 | Calculation completed | Info | Review results |

### Appendix D: Methodology Mapping

#### Cluster to Methodology Quick Reference

| Cluster | Common Methodologies | Standard |
|---------|---------------------|----------|
| ARR | VM0047, AR-ACM0003 | VCS |
| IFM | VM0036, VM0035 | VCS |
| REDD+ | VM0015, VM0034 | VCS |
| Wetlands | VM0033, VM0024 | VCS |
| Soil Carbon | VM0042, VM0017 | VCS |
| Livestock | VM0043, AMS-III.AU | VCS/GS |
| Rice | AMS-III.AU, VM0043 | VCS/GS |
| Grid Renewables | ACM0002, AMS-I.D | CDM/GS |
| Distributed | AMS-I.L, AMS-I.C | CDM/GS |
| Clean Cooking | GS TPDDTEC, VMR0006 | Gold Standard |
| Energy Efficiency | AMS-II.C, ACM0012 | CDM/VCS |
| Landfill Gas | ACM0001, AMS-III.G | CDM/GS |
| Wastewater | AMS-III.H, ACM0014 | CDM/VCS |
| Organic Waste | AMS-III.AF, VM0044 | CDM/VCS |
| Industrial Gases | AM0021, AM0023 | CDM |
| CCS | VM0045 | VCS |
| Biochar | VM0044 | VCS |
| Mineralization | Puro.earth, Isometric | Various |
| DAC | Puro.earth, Isometric | Various |
| BiCRS | Puro.earth | Various |

### Appendix E: Glossary

#### Key Terms

| Term | Definition |
|------|------------|
| Activity | A specific carbon credit project or intervention |
| Baseline | The counterfactual scenario without the project |
| Carbon Pool | A reservoir of carbon (e.g., biomass, soil) |
| Crediting Period | The time period over which credits are issued |
| Ex-ante | Credits calculated before project implementation |
| Ex-post | Credits calculated based on actual monitored data |
| Leakage | Emissions displaced outside project boundary |
| MRV | Measurement, Reporting, and Verification |
| tCO2e | Tonnes of CO2 equivalent |
| VVB | Validation and Verification Body |

---

## DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | UI/UX Requirements Team | Initial release |

---

*End of Document*
