# Carbon Credit Retirement Protocol - UI Requirements Specification

## Document Information
- **Version**: 1.0
- **Status**: Draft
- **Last Updated**: 2024
- **Classification**: Technical Specification

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Retirement Dashboard](#2-retirement-dashboard)
3. [Retirement Workflow UI](#3-retirement-workflow-ui)
4. [Registry-Specific Interfaces](#4-registry-specific-interfaces)
5. [Beneficiary Management](#5-beneficiary-management)
6. [Serial Number Tracking](#6-serial-number-tracking)
7. [Retirement Certificates](#7-retirement-certificates)
8. [Batch Retirement Operations](#8-batch-retirement-operations)
9. [OTC and Bilateral Retirement](#9-otc-and-bilateral-retirement)
10. [Compliance and Audit](#10-compliance-and-audit)
11. [Notifications and Reporting](#11-notifications-and-reporting)
12. [Integration Requirements](#12-integration-requirements)
13. [Security and Access Control](#13-security-and-access-control)

---

## 1. Executive Summary

### 1.1 Purpose
This document specifies the comprehensive UI requirements for carbon credit retirement protocol functionality across multiple registries (Verra, Gold Standard, Puro, Isometric) and OTC bilateral channels.

### 1.2 Scope
- Multi-registry retirement workflow management
- Beneficiary designation and tracking
- Serial number traceability
- Certificate generation and verification
- Batch retirement operations
- Compliance and audit capabilities

### 1.3 Target Users
- Corporate sustainability managers
- Carbon credit traders and brokers
- Registry account administrators
- Compliance officers
- Project developers
- Retail platform operators

---

## 2. Retirement Dashboard

### 2.1 Overview Section

#### 2.1.1 Credit Inventory Summary Card
```
┌─────────────────────────────────────────────────────────────┐
│ CREDIT INVENTORY OVERVIEW                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   VERRA     │  │   GOLD      │  │    PURO     │         │
│  │    VCUs     │  │  STANDARD   │  │    CORCs    │         │
│  │             │  │   Credits   │  │             │         │
│  │   12,450    │  │    8,320    │  │    5,100    │         │
│  │  Available  │  │  Available  │  │  Available  │         │
│  │             │  │             │  │             │         │
│  │ [Retire →]  │  │ [Retire →]  │  │ [Retire →]  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │  ISOMETRIC  │  │    OTC      │                          │
│  │   Credits   │  │  Pending    │                          │
│  │             │  │             │                          │
│  │    3,200    │  │    2,500    │                          │
│  │  Available  │  │  Settlement │                          │
│  │             │  │             │                          │
│  │ [Retire →]  │  │ [View →]    │                          │
│  └─────────────┘  └─────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**UI Elements:**
- Registry-specific credit count cards with visual indicators
- Quick-action retirement buttons per registry
- Color-coded status indicators (green = available, yellow = pending, red = restricted)
- Hover tooltips showing vintage distribution
- Click-through to detailed inventory views

#### 2.1.2 Retirement Activity Timeline
```
┌─────────────────────────────────────────────────────────────┐
│ RECENT RETIREMENT ACTIVITY                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Filter: All Registries ▼] [Date Range ▼] [Export]        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ● 2024-01-15 14:32  Verra      500 VCUs  COMPLETED │   │
│  │   Project: VCS-VCUs-1523  Beneficiary: Acme Corp   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ● 2024-01-14 09:15  Gold Std   250 GS   PENDING    │   │
│  │   Project: GS-1234-5678  Beneficiary: GreenTech    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ● 2024-01-12 16:45  Puro       100 CORCs COMPLETED │   │
│  │   Project: PURO-2023-001  Beneficiary: Retail Co   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [View All Activity →]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**UI Elements:**
- Chronological activity feed with status indicators
- Expandable entries for detailed transaction information
- Filter controls by registry, date, status, beneficiary
- Export functionality for reporting
- Real-time updates via WebSocket

### 2.2 Available Credits for Retirement

#### 2.2.1 Credit Inventory Table
```
┌────────────────────────────────────────────────────────────────────────────┐
│ AVAILABLE CREDITS FOR RETIREMENT                                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [Registry: All ▼] [Vintage: All ▼] [Project Type: All ▼] [Search...]     │
│                                                                            │
│  Select All │ [Retire Selected] [Export] [Batch Operations ▼]             │
│                                                                            │
│  ┌────────┬─────────────┬──────────┬─────────┬──────────┬────────┬────────┐│
│  │ □      │ Registry    │ Project  │ Vintage │ Quantity │ Serial │ Action ││
│  ├────────┼─────────────┼──────────┼─────────┼──────────┼────────┼────────┤│
│  │ [✓]    │ Verra       │ VCS-1523 │ 2022    │ 500      │ Range  │[Retire]││
│  │        │             │          │         │          │View    │        ││
│  ├────────┼─────────────┼──────────┼─────────┼──────────┼────────┼────────┤│
│  │ [✓]    │ Gold Std    │ GS-5678  │ 2021    │ 250      │ Range  │[Retire]││
│  │        │             │          │         │          │View    │        ││
│  ├────────┼─────────────┼──────────┼─────────┼──────────┼────────┼────────┤│
│  │ [ ]    │ Puro        │ PURO-001 │ 2023    │ 100      │ Range  │[Retire]││
│  │        │             │          │         │          │View    │        ││
│  └────────┴─────────────┴──────────┴─────────┴──────────┴────────┴────────┘│
│                                                                            │
│  Showing 1-10 of 47 credits    [< Prev] [1] [2] [3] [4] [5] [Next >]      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**UI Elements:**
- Multi-select checkboxes for batch operations
- Sortable columns (registry, project, vintage, quantity)
- Serial number range viewer with expand option
- Individual and bulk retirement action buttons
- Advanced filter panel with save filter option
- Pagination with customizable page sizes

### 2.3 Retirement History and Status

**Status Indicators:**
- **Draft**: Retirement initiated but not submitted
- **Pending**: Submitted to registry, awaiting confirmation
- **Processing**: Registry processing retirement request
- **Completed**: Retirement confirmed by registry
- **Failed**: Retirement failed, requires retry or manual intervention
- **Cancelled**: Retirement cancelled before completion

### 2.4 Pending Retirement Transactions

#### 2.4.1 Pending Transactions Panel
```
┌─────────────────────────────────────────────────────────────┐
│ PENDING RETIREMENT TRANSACTIONS                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠ PENDING APPROVAL                                  │   │
│  │                                                     │   │
│  │  Gold Standard - 250 GS Credits                     │   │
│  │  Initiated: 2024-01-14 09:15                        │   │
│  │  Awaiting: Secondary approval required              │   │
│  │                                                     │   │
│  │  [Approve] [Reject] [View Details]                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⏳ PROCESSING                                       │   │
│  │                                                     │   │
│  │  Verra - 1,000 VCUs                                 │   │
│  │  Submitted: 2024-01-14 16:20                        │   │
│  │  Status: Awaiting registry confirmation             │   │
│  │  ETA: 2-4 hours                                     │   │
│  │                                                     │   │
│  │  [Check Status] [Cancel if Pending]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Retirement Workflow UI

### 3.1 Registry Selection Interface

#### 3.1.1 Registry Selection Screen
```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: SELECT REGISTRY                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Choose the registry where you want to retire credits:     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ○ Verra Registry                                   │   │
│  │    ├─ Available: 12,450 VCUs                        │   │
│  │    ├─ Account: Connected ✓                          │   │
│  │    └─ Last Sync: 5 minutes ago                      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ○ Gold Standard Impact Registry                    │   │
│  │    ├─ Available: 8,320 GS Credits                   │   │
│  │    ├─ Account: Connected ✓                          │   │
│  │    └─ Last Sync: 12 minutes ago                     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ○ Puro Registry                                    │   │
│  │    ├─ Available: 5,100 CORCs                        │   │
│  │    ├─ Account: Connected ✓                          │   │
│  │    └─ Last Sync: 8 minutes ago                      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ○ Isometric Registry                               │   │
│  │    ├─ Available: 3,200 Credits                      │   │
│  │    ├─ Account: Connected ✓                          │   │
│  │    └─ Last Sync: 15 minutes ago                     │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ○ OTC / Bilateral Channel                          │   │
│  │    ├─ Pending Settlements: 2,500 credits            │   │
│  │    └─ Requires contract linking                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [? Registry Comparison Guide]                              │
│                                                             │
│              [Cancel]              [Continue →]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Credit Selection and Batching

#### 3.2.1 Credit Selection Interface
```
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: SELECT CREDITS - Verra Registry                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Available Credits: 12,450 VCUs                             │
│                                                             │
│  [Project: All ▼] [Vintage: All ▼] [Methodology: All ▼]   │
│                                                             │
│  SELECTION MODE:                                            │
│  (•) Select Individual Credits    ( ) Select by Batch      │
│                                                             │
│  ┌────────┬─────────────────┬─────────┬────────┬──────────┐│
│  │ □      │ Project Name    │ Vintage │ Serial │ Quantity ││
│  ├────────┼─────────────────┼─────────┼────────┼──────────┤│
│  │ [✓]    │ Amazon Reforest │ 2022    │ View   │ 500      ││
│  ├────────┼─────────────────┼─────────┼────────┼──────────┤│
│  │ [✓]    │ Wind Farm India │ 2021    │ View   │ 1,000    ││
│  ├────────┼─────────────────┼─────────┼────────┼──────────┤│
│  │ [ ]    │ Solar Project   │ 2023    │ View   │ 750      ││
│  └────────┴─────────────────┴─────────┴────────┴──────────┘│
│                                                             │
│  SELECTED: 1,500 VCUs                                       │
│                                                             │
│  [Clear Selection]  [Select All Visible]  [Smart Select ▼] │
│                                                             │
│              [← Back]              [Continue →]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Serial Number Management

#### 3.3.1 Serial Number Display
```
┌─────────────────────────────────────────────────────────────┐
│ SERIAL NUMBERS - 1,500 VCUs Selected                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DISPLAY MODE:                                              │
│  [Summary] [Detailed List] [Visual Map] [Export]           │
│                                                             │
│  SERIAL NUMBER RANGES:                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Project: Amazon Reforestation (500 VCUs)            │   │
│  │ Range: VCS-VCUs-1523-2012-VCU-152-MER-5-1-...       │   │
│  │        to VCS-VCUs-1523-2012-VCU-152-MER-5-500-...  │   │
│  │ [View Individual Serials] [Download CSV]            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Project: Wind Farm India (1,000 VCUs)               │   │
│  │ Range: VCS-VCUs-2847-2012-VCU-284-MER-12-1-...      │   │
│  │        to VCS-VCUs-2847-2012-VCU-284-MER-12-1000-..│   │
│  │ [View Individual Serials] [Download CSV]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  TRACEABILITY:                                              │
│  [View Chain of Custody]  [Verify in Registry]             │
│                                                             │
│              [← Back]              [Continue →]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Beneficiary Designation Forms

#### 3.4.1 Beneficiary Selection
```
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: DESIGNATE BENEFICIARY                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BENEFICIARY TYPE:                                          │
│  (•) Organization        ( ) Individual                    │
│                                                             │
│  SELECT BENEFICIARY:                                        │
│  [Search existing beneficiaries...                    ▼]   │
│                                                             │
│  OR CREATE NEW BENEFICIARY:                                 │
│  [+ Create New Beneficiary Profile]                        │
│                                                             │
│  SELECTED BENEFICIARY:                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Acme Corporation                                   │   │
│  │  ├─ Type: Organization                              │   │
│  │  ├─ Country: United States                          │   │
│  │  ├─ Industry: Technology                            │   │
│  │  └─ Verification: Verified ✓                        │   │
│  │                                                     │   │
│  │  [View Profile] [Edit] [Change]                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  BENEFICIARY ALLOCATION:                                    │
│  (•) 100% to single beneficiary                            │
│  ( ) Split across multiple beneficiaries                   │
│                                                             │
│              [← Back]              [Continue →]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3.4.2 New Beneficiary Creation Form
```
┌─────────────────────────────────────────────────────────────┐
│ CREATE NEW BENEFICIARY PROFILE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BENEFICIARY TYPE: (*) Organization  ( ) Individual        │
│                                                             │
│  ORGANIZATION DETAILS:                                      │
│  ─────────────────────────────────────────────────────────  │
│  Organization Name *:                                       │
│  [________________________________________]                │
│                                                             │
│  Country/Region *:                                          │
│  [Select Country...                                     ▼] │
│                                                             │
│  Industry/Sector:                                           │
│  [Select Industry...                                    ▼] │
│                                                             │
│  CONTACT INFORMATION:                                       │
│  ─────────────────────────────────────────────────────────  │
│  Primary Contact Name:                                      │
│  [________________________________________]                │
│                                                             │
│  Contact Email:                                             │
│  [________________________________________]                │
│                                                             │
│  PUBLIC DISCLOSURE:                                         │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Allow name to appear on public retirement records     │
│  [ ] Use anonymous designation (private only)              │
│                                                             │
│  [Cancel]  [Save Beneficiary Profile]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 Retirement Reason/Use Case Selection

#### 3.5.1 Retirement Reason Form
```
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: RETIREMENT PURPOSE                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RETIREMENT REASON CATEGORY *:                              │
│  [Select primary purpose...                             ▼] │
│                                                             │
│  OPTIONS:                                                   │
│  ├── Voluntary Carbon Offsetting                          │
│  │   ├── Scope 1 Emissions Offset                        │
│  │   ├── Scope 2 Emissions Offset                        │
│  │   ├── Scope 3 Emissions Offset                        │
│  │   └── General Corporate Offset                        │
│  ├── Compliance Obligation                                │
│  │   ├── CORSIA                                          │
│  │   ├── ETS/Compliance Scheme                           │
│  │   └── National Compliance Program                     │
│  ├── Product/Service Carbon Neutral                       │
│  │   ├── Product Carbon Neutral                          │
│  │   ├── Service Carbon Neutral                          │
│  │   └── Event Carbon Neutral                            │
│  └── Supply Chain Decarbonization                         │
│                                                             │
│  REPORTING PERIOD (if applicable):                          │
│  From: [____] To: [____]                                   │
│                                                             │
│  EMISSIONS SCOPE (if applicable):                           │
│  [✓] Scope 1  [✓] Scope 2  [ ] Scope 3                     │
│                                                             │
│              [← Back]              [Continue →]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.6 Review and Confirmation Screens

#### 3.6.1 Retirement Review Screen
```
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: REVIEW AND CONFIRM                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Please review all retirement details before confirming:   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  RETIREMENT SUMMARY                                 │   │
│  │  ═════════════════════════════════════════════════  │   │
│  │                                                     │   │
│  │  Registry:          Verra Registry                  │   │
│  │  Instrument:        Verified Carbon Units (VCUs)    │   │
│  │  Total Quantity:    1,500 VCUs                      │   │
│  │                                                     │   │
│  │  CREDITS:                                           │   │
│  │  • Amazon Reforestation (VCS-1523): 500 VCUs       │   │
│  │    Vintage: 2022 | Methodology: VM0015             │   │
│  │  • Wind Farm India (VCS-2847): 1,000 VCUs          │   │
│  │    Vintage: 2021 | Methodology: VM0022             │   │
│  │                                                     │   │
│  │  BENEFICIARY:                                       │   │
│  │  Acme Corporation (United States)                   │   │
│  │                                                     │   │
│  │  RETIREMENT PURPOSE:                                │   │
│  │  Voluntary Carbon Offset - Scope 1 Emissions       │   │
│  │  Reporting Period: FY 2024                          │   │
│  │                                                     │   │
│  │  SERIAL NUMBERS:                                    │   │
│  │  [View 1,500 serial numbers]                        │   │
│  │                                                     │   │
│  │  ESTIMATED PROCESSING TIME: 2-4 hours               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Edit Credits] [Edit Beneficiary] [Edit Purpose]          │
│                                                             │
│  ⚠ This action cannot be undone once submitted.            │
│                                                             │
│              [← Back]              [Confirm Retirement →]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.7 Retirement Execution and Tracking

#### 3.7.1 Retirement Submission Progress
```
┌─────────────────────────────────────────────────────────────┐
│ RETIREMENT IN PROGRESS                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RETIREMENT ID: RT-2024-001234                              │
│                                                             │
│  STATUS: Processing                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [✓] Validating credit availability                │   │
│  │  [✓] Verifying beneficiary details                 │   │
│  │  [✓] Preparing retirement package                  │   │
│  │  [⟳] Submitting to Verra Registry...               │   │
│  │  [ ] Awaiting registry confirmation                │   │
│  │  [ ] Generating retirement certificate             │   │
│  │                                                     │   │
│  │  Progress: 60%                                      │   │
│  │  [████████████████████░░░░░░░░░░░░]                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Estimated time remaining: 3-5 minutes                      │
│                                                             │
│  [View Details]  [Check Registry Directly]  [Cancel]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Registry-Specific Interfaces

### 4.1 Verra Registry Interface

#### 4.1.1 Verra Account Connection
```
┌─────────────────────────────────────────────────────────────┐
│ CONNECT VERRA REGISTRY ACCOUNT                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ACCOUNT TYPE:                                              │
│  (•) Organization Account    ( ) Individual Account        │
│                                                             │
│  ⚠ Note: Individual accounts cannot be created directly    │
│    with Verra. Individuals must use an intermediary.       │
│                                                             │
│  VERIFICATION METHOD:                                       │
│  (•) API Key Authentication                                │
│  ( ) OAuth 2.0 (Redirect to Verra)                         │
│  ( ) Manual Upload (Registry Reports)                      │
│                                                             │
│  API CREDENTIALS:                                           │
│  ─────────────────────────────────────────────────────────  │
│  API Key:        [________________________________]        │
│  API Secret:     [________________________________]        │
│  Account Number: [________________________________]        │
│                                                             │
│  [Test Connection]                                          │
│                                                             │
│  SYNC SETTINGS:                                             │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Auto-sync inventory (every 15 minutes)                │
│  [✓] Auto-sync retirement status                           │
│  [✓] Notify on new credit issuance                         │
│                                                             │
│  [Cancel]  [Connect Account]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Verra Retirement Form
```
┌─────────────────────────────────────────────────────────────┐
│ VERRA REGISTRY RETIREMENT FORM                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REQUIRED VERRA METADATA:                                   │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  1. QUANTITY *                                              │
│     [________] VCUs (Max available: 12,450)                │
│                                                             │
│  2. BATCH SELECTION *                                       │
│     [Select VCU batch...                                ▼] │
│                                                             │
│  3. RETIREMENT REASON / USE CASE *                          │
│     [Select Verra use case...                           ▼] │
│     └── Additional context:                                 │
│         [                                                ] │
│                                                             │
│  4. ACCOUNT DETAILS *                                       │
│     Retiring Account: [Your Verra Account - 12345]        │
│                                                             │
│  5. BENEFICIARY INFORMATION *                               │
│     Beneficiary Name: [________________________________]   │
│     Beneficiary Type: [Organization ▼]                     │
│     Country: [Select...                                 ▼] │
│                                                             │
│  6. SERIAL NUMBER CONFIRMATION                              │
│     [View assigned serial numbers]                         │
│     [✓] I confirm these serial numbers are correct         │
│                                                             │
│  7. PUBLIC DISCLOSURE                                       │
│     [✓] Display beneficiary name in public registry        │
│     [ ] Keep beneficiary information private               │
│                                                             │
│  [Save Draft]  [Preview]  [Submit to Verra →]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Gold Standard Impact Registry Interface

#### 4.2.1 Gold Standard Account Connection
```
┌─────────────────────────────────────────────────────────────┐
│ CONNECT GOLD STANDARD IMPACT REGISTRY                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  IMPACT REGISTRY ACCOUNT:                                   │
│  ─────────────────────────────────────────────────────────  │
│  Account Email:    [________________________________]      │
│  Password:         [________________________________]      │
│                                                             │
│  OR API INTEGRATION:                                        │
│  ─────────────────────────────────────────────────────────  │
│  API Key:          [________________________________]      │
│  Organization ID:  [________________________________]      │
│                                                             │
│  [Test Connection]                                          │
│                                                             │
│  PERMISSIONS REQUESTED:                                     │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Read credit holdings                                  │
│  [✓] Read retirement history                               │
│  [✓] Submit retirement requests                            │
│  [✓] Access impact certificates                            │
│                                                             │
│  [Cancel]  [Authorize Access]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Gold Standard Retirement Form
```
┌─────────────────────────────────────────────────────────────┐
│ GOLD STANDARD IMPACT REGISTRY RETIREMENT                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REQUIRED GS METADATA:                                      │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  1. CREDIT SELECTION *                                      │
│     [Select GS credits...                               ▼] │
│     └── Impact Product: [GS VER | GS CER | etc.]          │
│                                                             │
│  2. USING ENTITY *                                          │
│     Entity Name: [______________________________________]  │
│     Entity Country: [Select...                          ▼] │
│                                                             │
│  3. SERIAL NUMBERS *                                        │
│     [View and confirm serial numbers]                      │
│     Project/Vintage Traceability:                          │
│     • Project: [GS-1234-5678]                              │
│     • Vintage: [2022]                                      │
│                                                             │
│  4. IMPACT ATTRIBUTION (Optional)                          │
│     [Select SDG impacts to highlight...               ▼]   │
│     └── [✓] SDG 13 - Climate Action                        │
│         [✓] SDG 15 - Life on Land                          │
│                                                             │
│  [Save Draft]  [Preview Impact Certificate]  [Submit →]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Puro Registry Interface

#### 4.3.1 Puro Account Connection
```
┌─────────────────────────────────────────────────────────────┐
│ CONNECT PURO REGISTRY                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PURO REGISTRY CREDENTIALS:                                 │
│  ─────────────────────────────────────────────────────────  │
│  Username / Email: [________________________________]      │
│  Password:         [________________________________]      │
│                                                             │
│  OR API TOKEN:                                              │
│  ─────────────────────────────────────────────────────────  │
│  API Token:        [________________________________]      │
│                                                             │
│  SUPPLIER INFORMATION (if applicable):                      │
│  ─────────────────────────────────────────────────────────  │
│  Supplier ID:      [________________________________]      │
│                                                             │
│  [Authenticate with Puro]                                   │
│                                                             │
│  CONNECTION STATUS:                                         │
│  ─────────────────────────────────────────────────────────  │
│  [Test] Connected as: [Supplier Name]                       │
│  Available CORCs: 5,100                                     │
│  Last Sync: 8 minutes ago                                   │
│                                                             │
│  [Cancel]  [Save Connection]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3.2 Puro Retirement Form
```
┌─────────────────────────────────────────────────────────────┐
│ PURO REGISTRY RETIREMENT                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REQUIRED PURO METADATA:                                    │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  1. CORC SELECTION *                                        │
│     [Select CORC batch...                               ▼] │
│     └── Methodology: [Biochar | DAC | Enhanced Weathering] │
│                                                             │
│  2. BENEFICIARY *                                           │
│     Beneficiary Name: [________________________________]   │
│     Beneficiary Type: [Organization ▼]                     │
│                                                             │
│  3. COUNTRY/LOCATION OF CONSUMPTION *                       │
│     [Select country...                                  ▼] │
│     Location Details: [City, Region, etc.]                 │
│     [________________________________________]             │
│                                                             │
│  4. CONSUMPTION PERIOD *                                    │
│     From: [________] To: [________]                        │
│                                                             │
│  5. USAGE TYPE *                                            │
│     [Select usage type...                               ▼] │
│     ├── Corporate Offset                                   │
│     ├── Product Carbon Neutral                             │
│     ├── Service Carbon Neutral                             │
│     ├── Supply Chain                                       │
│     ├── Investment Holding                                 │
│     └── Other: [________]                                  │
│                                                             │
│  6. RETIREMENT PURPOSE *                                    │
│     [Detailed description of retirement purpose...         ]│
│     [                                                        ]│
│                                                             │
│  ⚠ IMPORTANT: Retired CORCs cannot be traded or sold       │
│    onwards. This retirement is final.                       │
│                                                             │
│  [Save Draft]  [Preview Statement]  [Submit to Puro →]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Isometric Registry Interface

#### 4.4.1 Isometric Account Connection
```
┌─────────────────────────────────────────────────────────────┐
│ CONNECT ISOMETRIC REGISTRY                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ISOMETRIC REGISTRY ACCESS:                                 │
│  ─────────────────────────────────────────────────────────  │
│  Organization Email: [________________________________]    │
│  Access Token:       [________________________________]    │
│                                                             │
│  OR                                                        │
│                                                             │
│  Request Access from Isometric:                            │
│  [Submit Access Request]                                    │
│                                                             │
│  WORKFLOW PARTICIPATION:                                    │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Buyer/Offtaker                                        │
│  [ ] Supplier                                              │
│  [ ] Intermediary                                          │
│                                                             │
│  [Test Connection]  [Cancel]  [Connect]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4.2 Isometric Retirement Form
```
┌─────────────────────────────────────────────────────────────┐
│ ISOMETRIC REGISTRY RETIREMENT                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REQUIRED ISOMETRIC METADATA:                               │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  1. CREDIT SELECTION *                                      │
│     [Select Isometric credits...                        ▼] │
│     └── Protocol-compliant Issuance ID: [ISO-2023-001]    │
│                                                             │
│  2. BUYER TRACEABILITY *                                    │
│     Buyer Organization: [________________________________] │
│     Buyer Contact: [____________________________________]  │
│     Purchase Agreement Ref: [____________________________] │
│                                                             │
│  3. RETIREMENT/CANCELLATION INSTRUCTION *                   │
│     Instruction Type:                                        │
│     (•) Permanent Retirement                               │
│     ( ) Cancellation for Compliance                        │
│     ( ) Other: [________]                                  │
│                                                             │
│  4. END USE DESIGNATION                                     │
│     End Use Category: [Select...                        ▼] │
│     ├── Corporate Net Zero                                 │
│     ├── Product Carbon Neutral                             │
│     ├── Supply Chain Decarbonization                       │
│     └── Investment Portfolio                               │
│                                                             │
│  ⚠ Retired credits are fixed to end use and removed        │
│    from trading circulation permanently.                    │
│                                                             │
│  [Save Draft]  [Submit to Isometric →]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 Error Handling and Retry Mechanisms

#### 4.5.1 Registry Error Display
```
┌─────────────────────────────────────────────────────────────┐
│ REGISTRY ERROR - ACTION REQUIRED                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠ RETIREMENT SUBMISSION FAILED                             │
│                                                             │
│  Error Code: VERRA-INSUFFICIENT-BALANCE                     │
│                                                             │
│  ERROR DETAILS:                                             │
│  ─────────────────────────────────────────────────────────  │
│  The requested retirement quantity (1,500 VCUs) exceeds    │
│  the available balance in your Verra account.              │
│                                                             │
│  Requested: 1,500 VCUs                                      │
│  Available: 1,250 VCUs                                      │
│  Shortfall: 250 VCUs                                        │
│                                                             │
│  POSSIBLE SOLUTIONS:                                        │
│  ─────────────────────────────────────────────────────────  │
│  1. [Adjust quantity to 1,250 VCUs]                        │
│  2. [Refresh credit inventory] - Credits may have been     │
│     transferred or retired since last sync                 │
│  3. [Contact Verra Support] if balance appears incorrect   │
│                                                             │
│  LAST SUCCESSFUL SYNC: 15 minutes ago                       │
│                                                             │
│  [Retry with Adjusted Quantity]  [Cancel Retirement]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.5.2 Retry Queue Management
```
┌─────────────────────────────────────────────────────────────┐
│ RETRY QUEUE MANAGEMENT                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PENDING RETRY OPERATIONS:                                  │
│  ┌────────┬──────────┬──────────┬───────────┬────────────┐│
│  │ ID     │ Registry │ Quantity │ Error     │ Retry      ││
│  ├────────┼──────────┼──────────┼───────────┼────────────┤│
│  │ RT-001 │ Verra    │ 500 VCUs │ Timeout   │ Auto: 5min ││
│  ├────────┼──────────┼──────────┼───────────┼────────────┤│
│  │ RT-002 │ Gold Std │ 250 GS   │ API Error │ Manual     ││
│  └────────┴──────────┴──────────┴───────────┴────────────┘│
│                                                             │
│  RETRY SETTINGS:                                            │
│  ─────────────────────────────────────────────────────────  │
│  Automatic Retries: [✓] Enabled                             │
│  Max Retry Attempts: [3 ▼]                                  │
│  Retry Interval: [5 minutes ▼]                              │
│  Escalate After: [3 failed attempts ▼]                     │
│                                                             │
│  [Process All Retries]  [Clear Queue]  [Export Log]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Beneficiary Management

### 5.1 Beneficiary Profile Management

#### 5.1.1 Beneficiary List View
```
┌────────────────────────────────────────────────────────────────────────────┐
│ BENEFICIARY MANAGEMENT                                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [+ Create New Beneficiary]  [Import Beneficiaries]  [Export List]        │
│                                                                            │
│  [Search beneficiaries...]  [Type: All ▼] [Status: All ▼] [Verified ▼]   │
│                                                                            │
│  ┌─────────────────┬──────────┬─────────┬───────────┬────────┬──────────┐│
│  │ Beneficiary     │ Type     │ Country │ Retirements│ Status │ Actions  ││
│  ├─────────────────┼──────────┼─────────┼───────────┼────────┼──────────┤│
│  │ Acme Corp       │ Org      │ USA     │ 12        │ ✓ Ver. │[View][Edit││
│  ├─────────────────┼──────────┼─────────┼───────────┼────────┼──────────┤│
│  │ GreenTech Sol   │ Org      │ UK      │ 8         │ ✓ Ver. │[View][Edit││
│  ├─────────────────┼──────────┼─────────┼───────────┼────────┼──────────┤│
│  │ John Smith      │ Indiv    │ Canada  │ 3         │ Pending│[View][Edit││
│  ├─────────────────┼──────────┼─────────┼───────────┼────────┼──────────┤│
│  │ RetailCo Inc    │ Org      │ Germany │ 15        │ ✓ Ver. │[View][Edit││
│  └─────────────────┴──────────┴─────────┴───────────┴────────┴──────────┘│
│                                                                            │
│  Showing 1-10 of 47 beneficiaries                                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Beneficiary Validation and Verification

#### 5.2.1 Verification Workflow
```
┌─────────────────────────────────────────────────────────────┐
│ BENEFICIARY VERIFICATION                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BENEFICIARY: GreenTech Solutions                           │
│                                                             │
│  VERIFICATION STATUS: Pending Review                        │
│                                                             │
│  VERIFICATION CHECKLIST:                                    │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [✓] Organization name verified against registry          │
│  [✓] Country/region confirmed                              │
│  [✓] Contact email validated                               │
│  [ ] Legal registration verified (optional)                │
│  [ ] Industry classification confirmed                     │
│                                                             │
│  VERIFICATION METHOD:                                       │
│  (•) Automated (registry cross-reference)                  │
│  ( ) Manual review                                         │
│  ( ) Document upload                                         │
│                                                             │
│  SUPPORTING DOCUMENTS:                                      │
│  [Upload registration certificate, articles of             │
│   incorporation, or other verification documents]          │
│                                                             │
│  [Request Manual Review]  [Mark as Verified]  [Reject]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Multiple Beneficiary Allocation

#### 5.3.1 Allocation Interface
```
┌─────────────────────────────────────────────────────────────┐
│ MULTI-BENEFICIARY ALLOCATION                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TOTAL CREDITS: 10,000 VCUs                                 │
│  REMAINING: 0 ✓                                             │
│                                                             │
│  ALLOCATION METHOD:                                         │
│  (•) Percentage Split    ( ) Fixed Quantity    ( ) Custom  │
│                                                             │
│  ALLOCATION TABLE:                                          │
│  ┌─────────────────────┬────────────┬──────────┬──────────┐│
│  │ Beneficiary         │ Allocation │ Quantity │ Notes    ││
│  ├─────────────────────┼────────────┼──────────┼──────────┤│
│  │ Acme Corporation    │    40%     │  4,000   │ Scope 1  ││
│  │ Subsidiary A        │    30%     │  3,000   │ Scope 2  ││
│  │ Subsidiary B        │    30%     │  3,000   │ Scope 3  ││
│  ├─────────────────────┼────────────┼──────────┼──────────┤│
│  │ TOTAL               │   100%     │  10,000  │          ││
│  └─────────────────────┴────────────┴──────────┴──────────┘│
│                                                             │
│  [+ Add Beneficiary]                                        │
│                                                             │
│  ALLOCATION VISUALIZATION:                                  │
│  [Pie chart showing distribution]                          │
│                                                             │
│  [Save Allocation Template]  [Clear All]  [Confirm →]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Serial Number Tracking

### 6.1 Serial Number Display and Search

#### 6.1.1 Serial Number Explorer
```
┌────────────────────────────────────────────────────────────────────────────┐
│ SERIAL NUMBER EXPLORER                                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  SEARCH: [________________________________________] [Advanced Search]     │
│                                                                            │
│  VIEW MODE: [Summary ▼] [List ▼] [Visual ▼]                               │
│                                                                            │
│  FILTERS: [Registry: All ▼] [Status: All ▼] [Vintage: All ▼]             │
│                                                                            │
│  SERIAL NUMBER SUMMARY:                                                    │
│  ┌─────────────────┬─────────────┬────────────┬───────────┬─────────────┐│
│  │ Registry        │ Total       │ Available  │ Retired   │ Transferred ││
│  ├─────────────────┼─────────────┼────────────┼───────────┼─────────────┤│
│  │ Verra           │ 25,000      │ 12,450     │ 10,000    │ 2,550       ││
│  ├─────────────────┼─────────────┼────────────┼───────────┼─────────────┤│
│  │ Gold Standard   │ 15,000      │ 8,320      │ 5,500     │ 1,180       ││
│  ├─────────────────┼─────────────┼────────────┼───────────┼─────────────┤│
│  │ Puro            │ 8,000       │ 5,100      │ 2,500     │ 400         ││
│  └─────────────────┴─────────────┴────────────┴───────────┴─────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Chain of Custody Visualization

#### 6.2.1 Custody Chain View
```
┌─────────────────────────────────────────────────────────────┐
│ CHAIN OF CUSTODY - Serial: VCS-VCUs-1523-...-42            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Timeline View] [Network View] [Table View]               │
│                                                             │
│  TIMELINE VISUALIZATION:                                    │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  Mar 2022                                                   │
│    │                                                        │
│    ├─[Issuance]──────────────────────────────────────┐    │
│    │  Verra Registry                                   │    │
│    │  ↓                                                │    │
│    │  Project Developer (Origin)                       │    │
│    └───────────────────────────────────────────────────┘    │
│    │                                                        │
│  Jun 2022                                                   │
│    │                                                        │
│    ├─[Transfer]────────────────────────────────────────┐    │
│    │  Carbon Trader Inc. (Broker)                      │    │
│    └───────────────────────────────────────────────────┘    │
│    │                                                        │
│  Jan 2023                                                   │
│    │                                                        │
│    ├─[Transfer]────────────────────────────────────────┐    │
│    │  Your Organization (Current Holder)               │    │
│    └───────────────────────────────────────────────────┘    │
│    │                                                        │
│  Jan 2024                                                   │
│    │                                                        │
│    ├─[RETIREMENT]──────────────────────────────────────┐    │
│    │  ✓ Acme Corporation (Beneficiary)                 │    │
│    │  Retirement ID: RT-2024-001234                    │    │
│    └───────────────────────────────────────────────────┘    │
│                                                             │
│  [Download Custody Report]  [Verify Each Step]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Retirement Certificates

### 7.1 Certificate Generation and Display

#### 7.1.1 Certificate Viewer
```
┌─────────────────────────────────────────────────────────────┐
│ RETIREMENT CERTIFICATE                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CERTIFICATE ID: CERT-2024-001234                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │              [REGISTRY LOGO]                        │   │
│  │                                                     │   │
│  │           RETIREMENT CERTIFICATE                    │   │
│  │                                                     │   │
│  │  ═══════════════════════════════════════════════   │   │
│  │                                                     │   │
│  │  This certifies that:                               │   │
│  │                                                     │   │
│  │  1,500 Verified Carbon Units (VCUs)                │   │
│  │                                                     │   │
│  │  have been permanently retired from circulation    │   │
│  │  on behalf of:                                      │   │
│  │                                                     │   │
│  │  Acme Corporation                                   │   │
│  │                                                     │   │
│  │  CREDIT DETAILS:                                    │   │
│  │  • Serial Numbers: [View Range]                     │   │
│  │  • Projects: Amazon Reforestation, Wind Farm India │   │
│  │  • Vintage: 2021-2022                               │   │
│  │  • Methodologies: VM0015, VM0022                    │   │
│  │                                                     │   │
│  │  Retirement Date: January 15, 2024                  │   │
│  │  Registry Transaction: VCS-RT-2024-001234          │   │
│  │                                                     │   │
│  │  [QR CODE]                                          │   │
│  │  Scan to verify authenticity                        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Download PDF]  [Download PNG]  [Share]  [Print]  [Verify]│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Certificate Verification

#### 7.2.1 Verification Interface
```
┌─────────────────────────────────────────────────────────────┐
│ VERIFY CERTIFICATE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ENTER CERTIFICATE DETAILS:                                 │
│  ─────────────────────────────────────────────────────────  │
│  Certificate ID:                                            │
│  [________________________________________]                │
│                                                             │
│  OR                                                         │
│                                                             │
│  Upload Certificate:                                        │
│  [Drag and drop or click to upload PDF/PNG]                │
│                                                             │
│  OR                                                         │
│                                                             │
│  Scan QR Code:                                              │
│  [📷 Open Camera]                                          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  VERIFICATION RESULT:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  ✓ CERTIFICATE VERIFIED                             │   │
│  │                                                     │   │
│  │  Certificate ID: CERT-2024-001234                  │   │
│  │  Status: Valid and Active                           │   │
│  │                                                     │   │
│  │  Registry: Verra                                    │   │
│  │  Quantity: 1,500 VCUs                               │   │
│  │  Retirement Date: January 15, 2024                  │   │
│  │  Beneficiary: Acme Corporation                      │   │
│  │                                                     │   │
│  │  [View in Registry] [View Full Details]            │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Certificate Sharing Options

#### 7.3.1 Share Configuration
```
┌─────────────────────────────────────────────────────────────┐
│ SHARE CERTIFICATE                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SHARING OPTIONS:                                           │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [📧 Email]  [🔗 Link]  [📱 Social Media]  [📄 Embed]      │
│                                                             │
│  EMAIL:                                                     │
│  ─────────────────────────────────────────────────────────  │
│  To: [________________________________________]            │
│  Subject: Carbon Retirement Certificate - Acme Corp        │
│  Message:                                                   │
│  [                                                        ]│
│  [ Please find attached our carbon retirement             ]│
│  [ certificate for 1,500 VCUs retired on January 15, 2024]│
│  [                                                        ]│
│                                                             │
│  [✓] Include PDF attachment                                │
│  [✓] Include verification link                             │
│                                                             │
│  [Send Email]                                               │
│                                                             │
│  PUBLIC LINK:                                               │
│  ─────────────────────────────────────────────────────────  │
│  https://platform.com/verify/CERT-2024-001234              │
│  [Copy Link]  [Regenerate Link]  [Set Expiration]          │
│                                                             │
│  SOCIAL MEDIA:                                              │
│  ─────────────────────────────────────────────────────────  │
│  [Share on LinkedIn]  [Share on Twitter]  [Share on Web]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Batch Retirement Operations

### 8.1 Multi-Credit Selection Interfaces

#### 8.1.1 Batch Selection Dashboard
```
┌────────────────────────────────────────────────────────────────────────────┐
│ BATCH RETIREMENT OPERATIONS                                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [Start New Batch]  [Load Template]  [Scheduled Batches]                  │
│                                                                            │
│  ACTIVE BATCHES:                                                           │
│  ┌────────┬─────────────┬──────────┬───────────┬───────────┬────────────┐│
│  │ Batch  │ Description │ Credits  │ Status    │ Created   │ Action     ││
│  ├────────┼─────────────┼──────────┼───────────┼───────────┼────────────┤│
│  │ B-001  │ Q1 2024     │ 5,000    │ Draft     │ Jan 10    │[Edit][Sub] ││
│  │ B-002  │ Scope 1     │ 2,500    │ Pending   │ Jan 12    │[View][Can] ││
│  │ B-003  │ Product     │ 1,000    │ Complete  │ Jan 08    │[View][Cert]││
│  └────────┴─────────────┴──────────┴───────────┴───────────┴────────────┘│
│                                                                            │
│  BATCH TEMPLATES:                                                          │
│  ┌─────────────────┬─────────────────┬────────────┬─────────────────────┐│
│  │ Template Name   │ Configuration   │ Last Used  │ Actions             ││
│  ├─────────────────┼─────────────────┼────────────┼─────────────────────┤│
│  │ Monthly Offset  │ Verra, Scope 1  │ Jan 01     │[Use][Edit][Delete]  ││
│  │ Product Neutral │ Mixed registry  │ Dec 15     │[Use][Edit][Delete]  ││
│  └─────────────────┴─────────────────┴────────────┴─────────────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Bulk Retirement Workflows

#### 8.2.1 Bulk Retirement Wizard
```
┌─────────────────────────────────────────────────────────────┐
│ BULK RETIREMENT WIZARD                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1/5: UPLOAD CREDIT LIST                               │
│                                                             │
│  Upload a CSV or Excel file with credits to retire:        │
│                                                             │
│  [Drag and drop file here] or [Browse Files]               │
│                                                             │
│  REQUIRED COLUMNS:                                          │
│  • serial_number OR batch_id                               │
│  • quantity (if using batch_id)                            │
│  • beneficiary_name                                        │
│  • retirement_reason                                       │
│                                                             │
│  OPTIONAL COLUMNS:                                          │
│  • beneficiary_country, reporting_period, notes            │
│                                                             │
│  [Download Template CSV]  [View Example]                   │
│                                                             │
│  UPLOADED FILE: credits_to_retire.csv                       │
│  Status: ✓ Validated                                        │
│  Records: 50 credits across 3 registries                    │
│  Total Quantity: 10,000 tonnes                              │
│                                                             │
│  [Preview Data]  [Continue →]                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Scheduled Retirement Options

#### 8.3.1 Schedule Configuration
```
┌─────────────────────────────────────────────────────────────┐
│ SCHEDULE RETIREMENT                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SCHEDULING OPTIONS:                                        │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  (•) One-time scheduled retirement                         │
│  ( ) Recurring retirement                                  │
│                                                             │
│  ONE-TIME SCHEDULE:                                         │
│  ─────────────────────────────────────────────────────────  │
│  Execute On: [Date/Time Picker]                            │
│  [January 31, 2024 at 11:59 PM]                            │
│                                                             │
│  RECURRING SCHEDULE:                                        │
│  ─────────────────────────────────────────────────────────  │
│  Frequency: [Monthly ▼]                                     │
│  Day of Month: [Last day ▼]                                 │
│  Start Date: [________]                                     │
│  End Date: [________] (Optional)                            │
│                                                             │
│  CREDIT SELECTION:                                          │
│  ─────────────────────────────────────────────────────────  │
│  (•) Use template selection criteria                       │
│  ( ) Manually select credits before each execution         │
│  ( ) Auto-select optimal credits                           │
│                                                             │
│  NOTIFICATIONS:                                             │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Notify 24 hours before execution                      │
│  [✓] Notify on completion                                  │
│  [✓] Notify on failure                                     │
│                                                             │
│  [Preview Schedule]  [Save Scheduled Retirement]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. OTC and Bilateral Retirement

### 9.1 Contract Linking to Retirement

#### 9.1.1 Contract Association
```
┌─────────────────────────────────────────────────────────────┐
│ LINK CONTRACT TO RETIREMENT                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CONTRACT SELECTION:                                        │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [Search contracts...                                  ▼]  │
│                                                             │
│  OR                                                         │
│                                                             │
│  [+ Create New Contract Record]                            │
│                                                             │
│  SELECTED CONTRACT:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Contract #OTC-2024-0056                            │   │
│  │  Counterparty: Carbon Supplier Ltd.                 │   │
│  │  Contract Date: December 15, 2023                   │   │
│  │  Delivery Terms: FOB Registry                       │   │
│  │  Credit Type: Verra VCUs                            │   │
│  │  Quantity: 2,500                                    │   │
│  │  Price: $12.50 / tonne                              │   │
│  │  Status: Delivered, Pending Retirement              │   │
│  │                                                     │   │
│  │  [View Full Contract]  [View Delivery Docs]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  CREDITS TO RETIRE:                                         │
│  [________] of 2,500 available                              │
│                                                             │
│  SETTLEMENT CONFIRMATION:                                   │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Payment confirmed                                      │
│  [✓] Credits transferred to registry account               │
│  [ ] Retirement completed (this action)                    │
│                                                             │
│  [Proceed to Retirement →]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Counterparty Management

#### 9.2.1 Counterparty Directory
```
┌────────────────────────────────────────────────────────────────────────────┐
│ COUNTERPARTY MANAGEMENT                                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [+ Add Counterparty]  [Import Directory]  [Export List]                  │
│                                                                            │
│  [Search counterparties...]  [Type: All ▼] [Tier: All ▼]                 │
│                                                                            │
│  ┌─────────────────┬──────────┬─────────┬───────────┬────────┬──────────┐│
│  │ Counterparty    │ Type     │ Country │ Contracts │ Status │ Actions  ││
│  ├─────────────────┼──────────┼─────────┼───────────┼────────┼──────────┤│
│  │ Carbon Supplier │ Supplier │ Brazil  │ 5         │ Active │[View][Ed]││
│  ├─────────────────┼──────────┼─────────┼───────────┼────────┼──────────┤│
│  │ Green Brokers   │ Broker   │ UK      │ 12        │ Active │[View][Ed]││
│  ├─────────────────┼──────────┼─────────┼───────────┼────────┼──────────┤│
│  │ Eco Projects    │ Project  │ India   │ 3         │ Active │[View][Ed]││
│  └─────────────────┴──────────┴─────────┴───────────┴────────┴──────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Settlement Tracking

#### 9.3.1 Settlement Status
```
┌─────────────────────────────────────────────────────────────┐
│ SETTLEMENT TRACKING                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CONTRACT: OTC-2024-0056                                    │
│  Counterparty: Carbon Supplier Ltd.                         │
│                                                             │
│  SETTLEMENT TIMELINE:                                       │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [✓] 2023-12-15  Contract executed                         │
│  [✓] 2023-12-20  Payment initiated                         │
│  [✓] 2023-12-22  Payment confirmed                         │
│  [✓] 2024-01-05  Credits delivered to registry             │
│  [✓] 2024-01-05  Credits verified in account               │
│  [⟳] 2024-01-10  Retirement pending                        │
│                                                             │
│  SETTLEMENT DETAILS:                                        │
│  ─────────────────────────────────────────────────────────  │
│  Quantity: 2,500 VCUs                                       │
│  Price: $12.50/tonne                                        │
│  Total Value: $31,250                                       │
│  Payment Method: Wire Transfer                              │
│  Delivery: FOB Registry                                     │
│                                                             │
│  [Initiate Retirement]  [View Documents]  [Contact Counterparty]│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.4 Claim Substantiation Workflow

#### 9.4.1 Claim Verification
```
┌─────────────────────────────────────────────────────────────┐
│ CLAIM SUBSTANTIATION                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CLAIM: Carbon Neutral Operations - FY2024                  │
│  Organization: Acme Corporation                             │
│                                                             │
│  SUBSTANTIATION REQUIREMENTS:                               │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [✓] 1. Registry retirement completed                      │
│  [✓] 2. Serial numbers documented                          │
│  [✓] 3. Retirement certificates obtained                   │
│  [✓] 4. Beneficiary information recorded                   │
│  [✓] 5. Retirement purpose documented                      │
│  [✓] 6. Quantity matches emissions claim                   │
│                                                             │
│  SUPPORTING EVIDENCE:                                       │
│  ─────────────────────────────────────────────────────────  │
│  • Retirement Certificate: [View CERT-2024-001234]        │
│  • Registry Record: [View in Verra]                        │
│  • Serial Number List: [Download CSV]                      │
│  • Contract Documentation: [View OTC-2024-0056]           │
│                                                             │
│  CLAIM STATUS: ✓ SUBSTANTIATED                              │
│                                                             │
│  [Generate Audit Package]  [Share with Verifier]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Compliance and Audit

### 10.1 Retirement Audit Trail

#### 10.1.1 Audit Log Viewer
```
┌────────────────────────────────────────────────────────────────────────────┐
│ RETIREMENT AUDIT TRAIL                                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [Export Audit Log]  [Filter by Date]  [Filter by User]  [Filter by Type] │
│                                                                            │
│  RETIREMENT: RT-2024-001234                                                │
│                                                                            │
│  ┌───────────────┬─────────────────┬───────────────┬─────────────────────┐│
│  │ Timestamp     │ User            │ Action        │ Details             ││
│  ├───────────────┼─────────────────┼───────────────┼─────────────────────┤│
│  │ 2024-01-15    │ john.smith      │ INITIATED     │ Retirement workflow ││
│  │ 14:30:12      │                 │               │ started             ││
│  ├───────────────┼─────────────────┼───────────────┼─────────────────────┤│
│  │ 2024-01-15    │ john.smith      │ CREDITS       │ 1,500 VCUs selected ││
│  │ 14:31:05      │                 │ SELECTED      │ from 2 projects     ││
│  ├───────────────┼─────────────────┼───────────────┼─────────────────────┤│
│  │ 2024-01-15    │ john.smith      │ BENEFICIARY   │ Acme Corporation    ││
│  │ 14:31:45      │                 │ DESIGNATED    │ designated          ││
│  ├───────────────┼─────────────────┼───────────────┼─────────────────────┤│
│  │ 2024-01-15    │ john.smith      │ MFA VERIFIED  │ Authenticator app   ││
│  │ 14:32:10      │                 │               │ verification passed ││
│  ├───────────────┼─────────────────┼───────────────┼─────────────────────┤│
│  │ 2024-01-15    │ system          │ SUBMITTED     │ Sent to Verra       ││
│  │ 14:32:30      │                 │ TO REGISTRY   │ Registry API        ││
│  ├───────────────┼─────────────────┼───────────────┼─────────────────────┤│
│  │ 2024-01-15    │ verra-registry  │ CONFIRMED     │ Registry            ││
│  │ 14:40:15      │                 │               │ transaction ID      ││
│  │               │                 │               │ VCS-RT-2024-001234  ││
│  ├───────────────┼─────────────────┼───────────────┼─────────────────────┤│
│  │ 2024-01-15    │ system          │ CERTIFICATE   │ Certificate         ││
│  │ 14:41:00      │                 │ GENERATED     │ CERT-2024-001234    ││
│  └───────────────┴─────────────────┴───────────────┴─────────────────────┘│
│                                                                            │
│  [View Full Details]  [Download CSV]  [Print Report]                      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Compliance Checking Interface

#### 10.2.1 Compliance Dashboard
```
┌────────────────────────────────────────────────────────────────────────────┐
│ COMPLIANCE CHECKING                                                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  COMPLIANCE FRAMEWORK: [GHG Protocol ▼] [ISO 14064 ▼] [SBTi ▼]           │
│                                                                            │
│  RETIREMENT COMPLIANCE CHECK:                                              │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  Retirement: RT-2024-001234                                                │
│  Registry: Verra                                                           │
│  Quantity: 1,500 VCUs                                                      │
│                                                                            │
│  CHECKS:                                                                   │
│  ┌────────────────────────────────┬──────────┬───────────────────────────┐│
│  │ Requirement                    │ Status   │ Details                   ││
│  ├────────────────────────────────┼──────────┼───────────────────────────┤│
│  │ Vintage requirement (<=5 yrs)  │ ✓ Pass   │ Vintage: 2021-2022        ││
│  ├────────────────────────────────┼──────────┼───────────────────────────┤│
│  │ Avoidance vs removal           │ ✓ Pass   │ Mix acceptable            ││
│  ├────────────────────────────────┼──────────┼───────────────────────────┤│
│  │ Additionality verified         │ ✓ Pass   │ Verra certified           ││
│  ├────────────────────────────────┼──────────┼───────────────────────────┤│
│  │ No double counting             │ ✓ Pass   │ Unique serial numbers     ││
│  ├────────────────────────────────┼──────────┼───────────────────────────┤│
│  │ Permanence criteria            │ ✓ Pass   │ Forestry + renewable      ││
│  ├────────────────────────────────┼──────────┼───────────────────────────┤│
│  │ Registry retirement confirmed  │ ✓ Pass   │ Verra registry verified   ││
│  └────────────────────────────────┴──────────┴───────────────────────────┘│
│                                                                            │
│  OVERALL STATUS: ✓ COMPLIANT                                               │
│                                                                            │
│  [Generate Compliance Report]  [Export for Audit]  [View Details]         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Regulatory Reporting

#### 10.3.1 Report Generation
```
┌─────────────────────────────────────────────────────────────┐
│ REGULATORY REPORTING                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REPORT TYPE:                                               │
│  [Select report type...                                 ▼] │
│                                                             │
│  REPORTING PERIOD:                                          │
│  From: [________] To: [________]                           │
│                                                             │
│  REGISTRIES:                                                │
│  [✓] Verra  [✓] Gold Standard  [✓] Puro  [ ] Isometric     │
│                                                             │
│  REPORT FORMAT:                                             │
│  (•) Excel (.xlsx)                                         │
│  ( ) PDF                                                   │
│  ( ) CSV                                                   │
│  ( ) XML (for regulatory submission)                       │
│                                                             │
│  INCLUDE:                                                   │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Serial numbers                                        │
│  [✓] Project details                                       │
│  [✓] Beneficiary information                               │
│  [✓] Retirement purpose                                    │
│  [✓] Methodology information                               │
│  [ ] Cost information (internal only)                      │
│                                                             │
│  [Preview Report]  [Generate and Download]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.4 Due Diligence Documentation

#### 10.4.1 Due Diligence Checklist
```
┌─────────────────────────────────────────────────────────────┐
│ DUE DILIGENCE DOCUMENTATION                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PROJECT: Amazon Reforestation (VCS-1523)                  │
│                                                             │
│  DUE DILIGENCE CHECKLIST:                                   │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  PROJECT VALIDATION:                                        │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Project validated by Verra                            │
│  [✓] Validation report available                           │
│  [✓] Monitoring reports current                            │
│  [✓] Verification completed                                │
│                                                             │
│  METHODOLOGY COMPLIANCE:                                    │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Approved methodology (VM0015)                         │
│  [✓] Methodology version current                           │
│  [✓] Applicability conditions met                          │
│                                                             │
│  CREDIT INTEGRITY:                                          │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Serial numbers verified                               │
│  [✓] No double counting risk                               │
│  [✓] Ownership chain documented                            │
│  [✓] Legal title confirmed                                 │
│                                                             │
│  DOCUMENTATION:                                             │
│  ─────────────────────────────────────────────────────────  │
│  [View PDD] [View Validation Report] [View Monitoring]    │
│  [View Verification] [View Registry Record]               │
│                                                             │
│  DUE DILIGENCE STATUS: ✓ COMPLETE                           │
│                                                             │
│  [Export Due Diligence Package]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.5 Legal Review Checkpoints

#### 10.5.1 Legal Review Workflow
```
┌─────────────────────────────────────────────────────────────┐
│ LEGAL REVIEW CHECKPOINT                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RETIREMENT REQUIRES LEGAL REVIEW                           │
│                                                             │
│  Trigger: Retirement value exceeds $50,000                 │
│                                                             │
│  RETIREMENT DETAILS:                                        │
│  ─────────────────────────────────────────────────────────  │
│  Quantity: 5,000 VCUs                                       │
│  Estimated Value: $62,500                                   │
│  Registry: Verra                                            │
│  Beneficiary: Acme Corporation                              │
│                                                             │
│  LEGAL CHECKLIST:                                           │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [ ] Authority to retire verified                          │
│  [ ] Beneficiary representation confirmed                  │
│  [ ] Retirement terms reviewed                             │
│  [ ] Public disclosure approved                            │
│  [ ] Regulatory compliance verified                        │
│                                                             │
│  ASSIGNED LEGAL REVIEWER:                                   │
│  [Assign reviewer...                                    ▼] │
│                                                             │
│  REVIEW NOTES:                                              │
│  [                                                        ]│
│  [                                                        ]│
│                                                             │
│  [Request Review]  [Skip Review (requires override)]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Notifications and Reporting

### 11.1 Retirement Confirmation Notifications

#### 11.1.1 Notification Settings
```
┌─────────────────────────────────────────────────────────────┐
│ NOTIFICATION SETTINGS                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  NOTIFICATION CHANNELS:                                     │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  Email: [✓] Enabled  [Configure →]                         │
│  SMS:   [ ] Disabled [Configure →]                         │
│  In-App: [✓] Enabled                                       │
│  Webhook: [ ] Disabled [Configure →]                       │
│                                                             │
│  NOTIFICATION EVENTS:                                       │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Retirement Events:                                         │
│  [✓] Retirement initiated                                  │
│  [✓] Retirement submitted to registry                      │
│  [✓] Retirement completed                                  │
│  [✓] Retirement failed                                     │
│  [✓] Certificate generated                                 │
│                                                             │
│  Approval Events:                                           │
│  [✓] Approval requested                                    │
│  [✓] Approval received                                     │
│  [✓] Approval rejected                                     │
│                                                             │
│  System Events:                                             │
│  [✓] Registry sync completed                               │
│  [ ] New credits available                                 │
│  [✓] Scheduled retirement executed                         │
│                                                             │
│  [Save Settings]  [Test Notifications]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Status Update Alerts

#### 11.2.1 Alert Configuration
```
┌─────────────────────────────────────────────────────────────┐
│ STATUS ALERT CONFIGURATION                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ALERT RULES:                                               │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  Rule 1: Retirement Processing Delay                        │
│  ─────────────────────────────────────────────────────────  │
│  Condition: Retirement pending > 24 hours                  │
│  Severity: Warning                                          │
│  Action: Notify admin + check registry status              │
│  [Edit] [Delete]                                           │
│                                                             │
│  Rule 2: Large Retirement Approval                          │
│  ─────────────────────────────────────────────────────────  │
│  Condition: Retirement value > $25,000                     │
│  Severity: Info                                             │
│  Action: Require secondary approval                        │
│  [Edit] [Delete]                                           │
│                                                             │
│  Rule 3: Registry Sync Failure                              │
│  ─────────────────────────────────────────────────────────  │
│  Condition: Sync failed 3 consecutive times                │
│  Severity: Critical                                         │
│  Action: Notify admin + escalate to support                │
│  [Edit] [Delete]                                           │
│                                                             │
│  [+ Add Alert Rule]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.3 Retirement Summary Reports

#### 11.3.1 Report Dashboard
```
┌────────────────────────────────────────────────────────────────────────────┐
│ RETIREMENT SUMMARY REPORTS                                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [Generate New Report]  [Schedule Reports]  [Report Templates]            │
│                                                                            │
│  SAVED REPORTS:                                                            │
│  ┌─────────────────┬─────────────────┬────────────┬─────────────────────┐│
│  │ Report Name     │ Period          │ Generated  │ Actions             ││
│  ├─────────────────┼─────────────────┼────────────┼─────────────────────┤│
│  │ Q4 2023 Summary │ Oct-Dec 2023    │ Jan 05     │[View][DL][Share]    ││
│  │ FY2023 Annual   │ Jan-Dec 2023    │ Jan 10     │[View][DL][Share]    ││
│  │ Monthly Jan 24  │ Jan 2024        │ Feb 01     │[View][DL][Share]    ││
│  └─────────────────┴─────────────────┴────────────┴─────────────────────┘│
│                                                                            │
│  QUICK STATS:                                                              │
│  ═══════════════════════════════════════════════════════════════════════  │
│                                                                            │
│  Year to Date:                                                             │
│  • Total Retirements: 15,500 credits                                       │
│  • Total Value: $186,000                                                   │
│  • Registries Used: 4                                                      │
│  • Projects Supported: 12                                                  │
│  • Beneficiaries: 3 organizations                                          │
│                                                                            │
│  [View Detailed Breakdown]  [Export YTD Report]                           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 11.4 Claims Support Documentation

#### 11.4.1 Claims Documentation Generator
```
┌─────────────────────────────────────────────────────────────┐
│ CLAIMS SUPPORT DOCUMENTATION                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CLAIM TYPE:                                                │
│  [Select claim type...                                  ▼] │
│  ├── Carbon Neutral Operations Claimed (GHG Protocol)           │
│  ├── Net Zero Progress Claim                               │
│  ├── Science-Based Target Achievement                      │
│  └── Product Carbon Neutral Claim                          │
│                                                             │
│  REPORTING PERIOD:                                          │
│  From: [________] To: [________]                           │
│                                                             │
│  DOCUMENTATION PACKAGE:                                     │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [✓] Retirement certificates                               │
│  [✓] Serial number verification                            │
│  [✓] Registry transaction records                          │
│  [✓] Project documentation                                 │
│  [✓] Methodology compliance evidence                       │
│  [✓] Due diligence documentation                           │
│                                                             │
│  [Generate Claims Package]  [Preview]  [Save Template]     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.5 Stakeholder Notifications

#### 11.5.1 Stakeholder Communication
```
┌─────────────────────────────────────────────────────────────┐
│ STAKEHOLDER NOTIFICATIONS                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RETIREMENT: RT-2024-001234                                 │
│  Quantity: 1,500 VCUs                                       │
│  Beneficiary: Acme Corporation                              │
│                                                             │
│  STAKEHOLDER GROUPS:                                        │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  Internal Stakeholders:                                     │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Sustainability Team                                   │
│  [✓] Finance Team                                          │
│  [✓] Executive Leadership                                  │
│  [ ] Legal Team                                            │
│                                                             │
│  External Stakeholders:                                     │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Customers (public announcement)                       │
│  [ ] Investors                                             │
│  [ ] Media                                                 │
│  [ ] NGO Partners                                          │
│                                                             │
│  NOTIFICATION CONTENT:                                      │
│  ─────────────────────────────────────────────────────────  │
│  Subject: Carbon Retirement Completed - 1,500 tonnes       │
│  [                                                        ]│
│  [ We are pleased to announce the retirement of 1,500    ]│
│  [ tonnes of carbon credits on behalf of Acme Corp...    ]│
│  [                                                        ]│
│                                                             │
│  [Preview]  [Schedule Send]  [Send Now]  [Save Draft]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Integration Requirements

### 12.1 Registry API Integration Specs

#### 12.1.1 Verra API Integration

```yaml
Registry: Verra (Verified Carbon Standard)
API Version: v1.2
Base URL: https://api.verra.org/v1

Authentication:
  Type: OAuth 2.0 + API Key
  Endpoints:
    Token: POST /auth/token
    Refresh: POST /auth/refresh

Core Endpoints:
  Account Management:
    GET /accounts/{account_id}
    GET /accounts/{account_id}/holdings
    GET /accounts/{account_id}/transactions
  
  Credit Operations:
    GET /credits/{serial_number}
    GET /credits/batch/{batch_id}
    POST /credits/query
  
  Retirement Operations:
    POST /retirements
      Request Body:
        account_id: string
        quantity: integer
        beneficiary_name: string
        beneficiary_country: string
        retirement_reason: enum
        serial_numbers: array[string]
        public_disclosure: boolean
    
    GET /retirements/{retirement_id}
    GET /retirements/{retirement_id}/status
    GET /retirements/{retirement_id}/certificate
  
  Webhook Subscriptions:
    POST /webhooks/subscribe
    DELETE /webhooks/{subscription_id}

Rate Limits:
  Standard: 100 requests/minute
  Retirement: 10 requests/minute
  
Error Codes:
  VERRA-001: Invalid credentials
  VERRA-002: Insufficient balance
  VERRA-003: Invalid serial number
  VERRA-004: Serial number already retired
  VERRA-005: Invalid beneficiary
  VERRA-006: Rate limit exceeded
  VERRA-007: Registry maintenance
```

#### 12.1.2 Gold Standard API Integration

```yaml
Registry: Gold Standard Impact Registry
API Version: v2.0
Base URL: https://api.goldstandard.org/impact/v2

Authentication:
  Type: OAuth 2.0
  Scopes:
    - credits:read
    - retirement:write
    - certificate:read

Core Endpoints:
  Credit Holdings:
    GET /holdings
    GET /holdings/{holding_id}
  
  Retirement:
    POST /retirements
      Request Body:
        credits: array[{
          holding_id: string
          quantity: integer
        }]
        using_entity: string
        using_entity_country: string
        impact_claims: array[enum]
        generate_certificate: boolean
    
    GET /retirements/{retirement_id}
    GET /retirements/{retirement_id}/impact-certificate
  
  Impact Data:
    GET /projects/{project_id}/sdg-impacts
    GET /projects/{project_id}/co-benefits

Webhooks:
  Events:
    - retirement.completed
    - retirement.failed
    - credit.transferred
```

#### 12.1.3 Puro API Integration

```yaml
Registry: Puro.earth
API Version: v1.0
Base URL: https://api.puro.earth/v1

Authentication:
  Type: API Token (Bearer)
  Header: Authorization: Bearer {token}

Core Endpoints:
  Supplier Operations:
    GET /suppliers/{supplier_id}
    GET /suppliers/{supplier_id}/corcs
  
  CORC Management:
    GET /corcs/{corc_id}
    GET /corcs/batch/{batch_id}
  
  Retirement:
    POST /retirements
      Request Body:
        corc_ids: array[string]
        beneficiary: string
        country_of_consumption: string
        consumption_period_start: date
        consumption_period_end: date
        usage_type: enum
        purpose: string
    
    GET /retirements/{retirement_id}
    GET /retirements/{retirement_id}/statement

Rate Limits:
  Read: 1000 requests/hour
  Write: 100 requests/hour
```

#### 12.1.4 Isometric API Integration

```yaml
Registry: Isometric
API Version: v1.0
Base URL: https://api.isometric.com/v1

Authentication:
  Type: OAuth 2.0 Client Credentials

Core Endpoints:
  Credits:
    GET /credits
    GET /credits/{issuance_id}
    GET /credits/{issuance_id}/traceability
  
  Retirement:
    POST /retirements
      Request Body:
        issuance_id: string
        buyer_organization: string
        buyer_contact: string
        retirement_type: enum
        end_use_category: enum
        purchase_agreement_ref: string
    
    GET /retirements/{retirement_id}
    GET /retirements/{retirement_id}/confirmation
```

### 12.2 Authentication and Authorization Flows

#### 12.2.1 OAuth 2.0 Flow

```
┌──────────────┐                                    ┌─────────────────┐
│   User       │────(1) Authorization Request────→│   Registry      │
│   Browser    │                                    │   OAuth Server  │
└──────────────┘                                    └─────────────────┘
       │                                                    │
       │←───(2) Authorization Code + Redirect───────────────│
       │                                                    │
       │────(3) Exchange Code for Token────────────────────→│
       │                                                    │
       │←────────(4) Access Token + Refresh Token───────────│
       │                                                    │
       │────(5) API Request with Bearer Token──────────────→│
       │                                                    │
       │←──────────────(6) API Response─────────────────────│
```

**UI Implementation:**
- "Connect Registry" button initiates OAuth flow
- Popup window for registry authentication
- Automatic token refresh before expiration
- Secure token storage (encrypted at rest)
- Clear connection status indicators

#### 12.2.2 API Key Management

```
┌─────────────────────────────────────────────────────────────┐
│ API KEY MANAGEMENT                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SAVED API KEYS:                                            │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  Verra Registry:                                            │
│  Status: ✓ Active                                          │
│  Key: ****-****-****-1234 (Last 4)                         │
│  Expires: 2024-12-31                                       │
│  [Rotate Key] [Revoke] [Test]                              │
│                                                             │
│  Gold Standard:                                             │
│  Status: ✓ Active                                          │
│  Key: ****-****-****-5678                                  │
│  Expires: Never (refresh token)                            │
│  [Refresh Token] [Revoke] [Test]                           │
│                                                             │
│  ADD NEW API KEY:                                           │
│  ─────────────────────────────────────────────────────────  │
│  Registry: [Select...                                   ▼] │
│  Key Name: [________________________________________]      │
│  API Key:  [________________________________________]      │
│  Secret:   [________________________________________]      │
│                                                             │
│  [Save Key]                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 12.3 Real-time vs Batch Synchronization

#### 12.3.1 Sync Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ SYNCHRONIZATION SETTINGS                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  REAL-TIME SYNCHRONIZATION:                                 │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [✓] Enable real-time updates (WebSocket)                  │
│                                                             │
│  Events to sync in real-time:                               │
│  [✓] Credit transfers                                      │
│  [✓] Retirement confirmations                              │
│  [✓] New credit issuance                                   │
│  [ ] Price updates                                         │
│                                                             │
│  BATCH SYNCHRONIZATION:                                     │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  Inventory Sync:                                            │
│  Frequency: [Every 15 minutes ▼]                           │
│  Schedule: [Continuous ▼]                                  │
│                                                             │
│  Transaction History Sync:                                  │
│  Frequency: [Every hour ▼]                                 │
│  Lookback Period: [90 days ▼]                              │
│                                                             │
│  Full Reconciliation:                                       │
│  Frequency: [Daily at 2:00 AM ▼]                           │
│                                                             │
│  [Save Settings]  [Force Full Sync Now]  [View Sync Log]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 12.4 Error Handling and Recovery

#### 12.4.1 Error Classification

| Error Code | Category | Severity | Retry Strategy |
|------------|----------|----------|----------------|
| TIMEOUT | Network | Medium | Auto-retry 3x with backoff |
| RATE_LIMIT | API | Low | Queue for next window |
| INVALID_CREDENTIALS | Auth | High | Alert admin, halt sync |
| INSUFFICIENT_BALANCE | Business | High | Alert user, manual review |
| SERIAL_NOT_FOUND | Data | Critical | Log for investigation |
| REGISTRY_MAINTENANCE | System | Low | Queue for retry |
| INVALID_REQUEST | Validation | High | Alert user, don't retry |
| UNKNOWN_ERROR | System | Critical | Log, alert, manual review |

#### 12.4.2 Recovery Procedures

```
┌─────────────────────────────────────────────────────────────┐
│ ERROR RECOVERY DASHBOARD                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ACTIVE ERRORS:                                             │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  ┌────────┬──────────┬────────────┬──────────┬───────────┐│
│  │ Error  │ Registry │ Occurred   │ Status   │ Action    ││
│  ├────────┼──────────┼────────────┼──────────┼───────────┤│
│  │ E-001  │ Verra    │ 2024-01-15 │ Retrying │[View][Fix]││
│  │ E-002  │ Gold Std │ 2024-01-15 │ Manual   │[View][Fix]││
│  └────────┴──────────┴────────────┴──────────┴───────────┘│
│                                                             │
│  ERROR DETAILS - E-001:                                     │
│  ─────────────────────────────────────────────────────────  │
│  Type: Timeout during retirement submission                 │
│  Impact: 1 retirement pending (500 VCUs)                   │
│  Retry Count: 2/3                                          │
│  Next Retry: 2024-01-15 15:45:00                           │
│                                                             │
│  RECOVERY OPTIONS:                                          │
│  [Force Retry Now]  [Cancel and Refund]  [Manual Process]  │
│                                                             │
│  [View Error Log]  [Export for Support]  [Clear Resolved]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 12.5 Webhook and Callback Handling

#### 12.5.1 Webhook Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ WEBHOOK CONFIGURATION                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WEBHOOK ENDPOINT:                                          │
│  URL: https://platform.com/webhooks/registry-events        │
│  Status: ✓ Active                                          │
│  Secret: ****-****-****-webhook (for signature)            │
│                                                             │
│  SUBSCRIBED EVENTS:                                         │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  Verra Events:                                              │
│  [✓] retirement.completed                                  │
│  [✓] retirement.failed                                     │
│  [✓] credit.transferred                                    │
│  [✓] credit.issued                                         │
│                                                             │
│  Gold Standard Events:                                      │
│  [✓] retirement.completed                                  │
│  [✓] impact.certificate.generated                          │
│  [ ] credit.transferred                                    │
│                                                             │
│  DELIVERY SETTINGS:                                         │
│  ─────────────────────────────────────────────────────────  │
│  Retry Attempts: [5 ▼]                                      │
│  Retry Interval: [Exponential backoff ▼]                   │
│  Timeout: [30 seconds ▼]                                   │
│                                                             │
│  [Test Webhook]  [View Delivery Log]  [Regenerate Secret]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Security and Access Control

### 13.1 Role-Based Retirement Permissions

#### 13.1.1 Permission Matrix

| Role | View Credits | Initiate Retirement | Approve Retirement | Admin Functions |
|------|-------------|---------------------|-------------------|-----------------|
| Viewer | ✓ | ✗ | ✗ | ✗ |
| Trader | ✓ | ✓ (< $10K) | ✗ | ✗ |
| Senior Trader | ✓ | ✓ (< $50K) | ✓ (< $25K) | ✗ |
| Sustainability Manager | ✓ | ✓ (< $100K) | ✓ (< $50K) | ✗ |
| Finance Manager | ✓ | ✗ | ✓ (< $100K) | ✗ |
| Admin | ✓ | ✓ (Unlimited) | ✓ (Unlimited) | ✓ |

#### 13.1.2 Role Management Interface

```
┌─────────────────────────────────────────────────────────────┐
│ ROLE-BASED ACCESS CONTROL                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  USER ROLES:                                                │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  ┌───────────────┬─────────────────┬──────────┬───────────┐│
│  │ Role          │ Users Assigned  │ Retire   │ Approve   ││
│  ├───────────────┼─────────────────┼──────────┼───────────┤│
│  │ Viewer        │ 12              │ No       │ No        ││
│  ├───────────────┼─────────────────┼──────────┼───────────┤│
│  │ Trader        │ 5               │ <$10K    │ No        ││
│  ├───────────────┼─────────────────┼──────────┼───────────┤│
│  │ Senior Trader │ 3               │ <$50K    │ <$25K     ││
│  ├───────────────┼─────────────────┼──────────┼───────────┤│
│  │ Sustainability│ 2               │ <$100K   │ <$50K     ││
│  ├───────────────┼─────────────────┼──────────┼───────────┤│
│  │ Admin         │ 2               │ Unlimited│ Unlimited ││
│  └───────────────┴─────────────────┴──────────┴───────────┘│
│                                                             │
│  [+ Create Custom Role]  [Edit Role]  [Assign Users]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 13.2 Multi-Factor Authentication for Retirement

#### 13.2.1 MFA Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ MULTI-FACTOR AUTHENTICATION                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MFA REQUIREMENTS:                                          │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  Retirement Value Thresholds:                               │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Require MFA for retirements > $5,000                  │
│  [✓] Require MFA for retirements > $25,000                 │
│  [✓] Require MFA for ALL retirements                       │
│                                                             │
│  MFA Methods (in order of preference):                      │
│  ─────────────────────────────────────────────────────────  │
│  1. [✓] Authenticator App (TOTP)                           │
│  2. [✓] SMS Code                                           │
│  3. [✓] Email Code                                         │
│  4. [ ] Hardware Security Key                              │
│  5. [ ] Biometric                                          │
│                                                             │
│  USER MFA STATUS:                                           │
│  ─────────────────────────────────────────────────────────  │
│  john.smith@company.com: ✓ MFA Enabled (Authenticator)     │
│  jane.doe@company.com: ✓ MFA Enabled (SMS)                 │
│  bob.wilson@company.com: ⚠ MFA Not Enabled                 │
│                                                             │
│  [Enforce MFA for All Users]  [View MFA Audit Log]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 13.3 Approval Workflows for Large Retirements

#### 13.3.1 Approval Workflow Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ APPROVAL WORKFLOW CONFIGURATION                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WORKFLOW RULES:                                            │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  Rule 1: Standard Retirement                                │
│  ─────────────────────────────────────────────────────────  │
│  Condition: Value < $10,000                                │
│  Approvers: Initiator only                                 │
│  [Edit] [Delete]                                           │
│                                                             │
│  Rule 2: Large Retirement                                   │
│  ─────────────────────────────────────────────────────────  │
│  Condition: Value $10,000 - $50,000                        │
│  Approvers:                                                │
│    1. Direct Manager (required)                            │
│    2. Sustainability Manager (required)                    │
│  [Edit] [Delete]                                           │
│                                                             │
│  Rule 3: Major Retirement                                   │
│  ─────────────────────────────────────────────────────────  │
│  Condition: Value > $50,000                                │
│  Approvers:                                                │
│    1. Direct Manager (required)                            │
│    2. Sustainability Manager (required)                    │
│    3. Finance Director (required)                          │
│    4. Legal Review (optional)                              │
│  [Edit] [Delete]                                           │
│                                                             │
│  [+ Add Workflow Rule]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 13.3.2 Approval Request Interface

```
┌─────────────────────────────────────────────────────────────┐
│ APPROVAL REQUEST                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠ APPROVAL REQUIRED                                        │
│                                                             │
│  A retirement requires your approval:                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  RETIREMENT REQUEST                                 │   │
│  │  ═════════════════════════════════════════════════  │   │
│  │                                                     │   │
│  │  Requested By: John Smith                          │   │
│  │  Date: January 15, 2024                            │   │
│  │                                                     │   │
│  │  Registry: Verra                                    │   │
│  │  Quantity: 5,000 VCUs                               │   │
│  │  Estimated Value: $62,500                           │   │
│  │                                                     │   │
│  │  Beneficiary: Acme Corporation                      │   │
│  │  Purpose: Scope 1 Emissions Offset - FY2024        │   │
│  │                                                     │   │
│  │  Credits:                                           │   │
│  │  • Project A: 2,500 VCUs (2022)                    │   │
│  │  • Project B: 2,500 VCUs (2021)                    │   │
│  │                                                     │   │
│  │  [View Full Details] [View Serial Numbers]         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  APPROVAL DECISION:                                         │
│  ─────────────────────────────────────────────────────────  │
│  (•) Approve                                               │
│  ( ) Reject                                                │
│  ( ) Request More Information                              │
│                                                             │
│  COMMENTS:                                                  │
│  [                                                        ]│
│                                                             │
│  [Submit Decision]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 13.4 Audit Logging Requirements

#### 13.4.1 Audit Log Schema

```json
{
  "audit_event": {
    "event_id": "uuid",
    "timestamp": "ISO 8601 datetime",
    "event_type": "retirement.initiated | retirement.submitted | retirement.completed | ...",
    "user": {
      "user_id": "string",
      "email": "string",
      "ip_address": "string",
      "session_id": "string"
    },
    "resource": {
      "type": "retirement | credit | beneficiary | ...",
      "id": "string"
    },
    "action": {
      "type": "CREATE | READ | UPDATE | DELETE | EXECUTE",
      "details": "json object"
    },
    "context": {
      "registry": "verra | gold_standard | puro | isometric",
      "quantity": "number",
      "value": "number",
      "mfa_verified": "boolean"
    },
    "result": {
      "status": "success | failure",
      "error_code": "string (if failure)"
    }
  }
}
```

#### 13.4.2 Audit Log Viewer

```
┌────────────────────────────────────────────────────────────────────────────┐
│ AUDIT LOG                                                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [Export Log]  [Filter]  [Search]  [Date Range]  [User Filter]            │
│                                                                            │
│  ┌─────────────────┬─────────────┬──────────────┬──────────┬─────────────┐│
│  │ Timestamp       │ User        │ Event        │ Resource │ Result      ││
│  ├─────────────────┼─────────────┼──────────────┼──────────┼─────────────┤│
│  │ 2024-01-15      │ john.smith  │ RETIREMENT   │ RT-2024  │ SUCCESS     ││
│  │ 14:32:30        │             │ SUBMITTED    │ -001234  │             ││
│  ├─────────────────┼─────────────┼──────────────┼──────────┼─────────────┤│
│  │ 2024-01-15      │ jane.doe    │ APPROVAL     │ RT-2024  │ APPROVED    ││
│  │ 14:35:15        │             │ GRANTED      │ -001234  │             ││
│  ├─────────────────┼─────────────┼──────────────┼──────────┼─────────────┤│
│  │ 2024-01-15      │ system      │ RETIREMENT   │ RT-2024  │ SUCCESS     ││
│  │ 14:40:00        │             │ COMPLETED    │ -001234  │             ││
│  └─────────────────┴─────────────┴──────────────┴──────────┴─────────────┘│
│                                                                            │
│  [View Details]  [Export Selection]  [Archive Old Logs]                   │
│                                                                            │
│  RETENTION: Logs retained for 7 years per regulatory requirements.        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 13.5 Data Privacy Compliance

#### 13.5.1 Privacy Controls

```
┌─────────────────────────────────────────────────────────────┐
│ DATA PRIVACY COMPLIANCE                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DATA SUBJECT RIGHTS:                                       │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  [View Data Subject Requests]  [Process New Request]       │
│                                                             │
│  PRIVACY SETTINGS:                                          │
│  ═══════════════════════════════════════════════════════   │
│                                                             │
│  Beneficiary Data:                                          │
│  ─────────────────────────────────────────────────────────  │
│  [✓] Encrypt beneficiary contact information              │
│  [✓] Anonymize after 7 years                               │
│  [✓] Allow beneficiaries to request data deletion         │
│                                                             │
│  Public Registry Data:                                      │
│  ─────────────────────────────────────────────────────────  │
│  Default beneficiary visibility: [Show name only ▼]        │
│  Allow anonymous retirement: [✓] Yes                       │
│                                                             │
│  DATA RETENTION:                                            │
│  ─────────────────────────────────────────────────────────  │
│  Retirement records: [7 years ▼]                           │
│  Audit logs: [7 years ▼]                                   │
│  User activity: [3 years ▼]                                │
│                                                             │
│  COMPLIANCE FRAMEWORKS:                                     │
│  ─────────────────────────────────────────────────────────  │
│  [✓] GDPR (EU)                                             │
│  [✓] CCPA (California)                                     │
│  [✓] SOC 2 Type II                                         │
│  [ ] ISO 27001                                             │
│                                                             │
│  [Save Settings]  [Generate Compliance Report]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Appendix A: Registry Comparison Matrix

| Feature | Verra | Gold Standard | Puro | Isometric |
|---------|-------|---------------|------|-----------|
| **Instrument** | VCU | GS Credit | CORC | Isometric Credit |
| **API Available** | Yes | Yes | Yes | Yes |
| **Real-time Sync** | Yes | Yes | Limited | Yes |
| **Batch Retirement** | Yes | Yes | Yes | Limited |
| **Certificate Type** | PDF/PNG | PDF with SDGs | Statement | Confirmation |
| **Public Registry** | Yes | Yes | Yes | Limited |
| **Individual Accounts** | No* | Yes | Limited | Limited |
| **MFA Support** | N/A | N/A | N/A | N/A |
| **Webhook Events** | Yes | Yes | Limited | Yes |

*Individuals must use intermediaries

---

## Appendix B: UI Component Library

### Common Components for Retirement UI

1. **RegistrySelector** - Radio button group with connection status
2. **CreditInventoryTable** - Sortable, filterable data table
3. **SerialNumberViewer** - Expandable serial number display
4. **BeneficiaryForm** - Dynamic form with validation
5. **RetirementProgress** - Step indicator with status
6. **CertificateViewer** - PDF/image viewer with download
7. **AuditLogTable** - Timestamped event log
8. **ApprovalWorkflow** - Multi-step approval interface
9. **BatchUploader** - CSV/Excel upload with validation
10. **NotificationPanel** - Real-time status updates

---

## Appendix C: Error Code Reference

| Code | Description | User Action | System Action |
|------|-------------|-------------|---------------|
| RET-001 | Invalid credit selection | Review selection | Log, notify user |
| RET-002 | Insufficient credits | Reduce quantity | Log, suggest available |
| RET-003 | Beneficiary validation failed | Update beneficiary | Log, highlight field |
| RET-004 | Registry connection lost | Retry connection | Auto-retry, escalate |
| RET-005 | MFA verification failed | Retry MFA | Log, limit attempts |
| RET-006 | Approval required | Wait for approval | Notify approvers |
| RET-007 | Registry timeout | Wait or retry | Auto-retry 3x |
| RET-008 | Serial number conflict | Contact support | Log, queue for review |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | UI/UX Team | Initial specification |

---

*End of Document*
