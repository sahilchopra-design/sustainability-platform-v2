# Carbon Credit Engine - Master Requirements Document
## Comprehensive Technical Specification for Calculation Engines, UI Modules, and Retirement Protocols

---

**Document Version:** 1.0  
**Generated:** April 2025  
**Classification:** Technical Requirements Specification  
**Status:** Final

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope and Coverage](#2-scope-and-coverage)
3. [Methodology Coverage Matrix](#3-methodology-coverage-matrix)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Component Specifications](#5-component-specifications)
6. [Integration Requirements](#6-integration-requirements)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Appendices](#8-appendices)

---

## 1. Executive Summary

This document provides comprehensive technical requirements for building a **Carbon Credit Engine** platform that covers all major carbon credit methodologies as calculation engines with corresponding UI modules for activity-level calculations, plus full retirement protocol functionality through the user interface.

### 1.1 Key Capabilities

| Capability | Description |
|------------|-------------|
| **Multi-Methodology Support** | 20+ activity clusters across 7 project families |
| **Activity-Level Calculations** | Granular credit calculations at individual activity level |
| **Registry Integration** | Verra VCS, Gold Standard, ACR, Puro.earth, Isometric |
| **Retirement Protocol UI** | Complete retirement workflows for all major registries |
| **MRV Integration** | Monitoring, Reporting, and Verification data management |
| **Audit Trail** | Complete traceability from activity to retirement |

### 1.2 Document Structure

This master document references five detailed component specifications:

1. **Nature-Based & Agriculture Calculation Engine** - ARR, IFM, REDD+, Wetlands, Soil Carbon, Livestock Methane, Rice Cultivation
2. **Energy & Waste Calculation Engine** - Grid Renewables, Distributed Energy, Clean Cooking, Energy Efficiency, Landfill Gas, Wastewater, Organic Waste
3. **Industrial & Engineered CDR Calculation Engine** - Industrial Gases, CCS/CCUS, Biochar, Mineralization, DAC, BiCRS, Private CDR
4. **UI Module Specifications** - Activity-level calculation interfaces for all 20 clusters
5. **Retirement Protocol UI** - Multi-registry retirement workflows and certificate management
6. **Data Model & Integration** - Entity relationships, APIs, security, and architecture

---

## 2. Scope and Coverage

### 2.1 Project Families and Activity Clusters

| Project Family | Activity Clusters | Credit Types | Coverage Status |
|----------------|-------------------|--------------|-----------------|
| **Nature-based** | 4 | Removal / Avoidance | Mature |
| **Agriculture** | 3 | Removal / Reduction | Mature-Growing |
| **Energy** | 4 | Reduction | Mature |
| **Waste** | 3 | Reduction | Mature-Growing |
| **Industrial** | 3 | Reduction / Removal | Mature-Emerging |
| **Engineered Removals** | 3 | Removal | Emerging-Premium |

### 2.2 Supported Standards and Registries

| Registry/Standard | Instruments | Integration Type |
|-------------------|-------------|------------------|
| Verra VCS | VCUs | API + Manual |
| Gold Standard | GS Credits | API + Manual |
| ACR | ACR Credits | API + Manual |
| Puro.earth | CORCs | API + Portal |
| Isometric | CDR Credits | API + Portal |
| ART-TREES | REDD+ Credits | Jurisdictional |

---

## 3. Methodology Coverage Matrix

### 3.1 Complete Methodology Listing

| ID | Activity Cluster | Representative Activities | Standard | Credit Type | Complexity |
|----|------------------|---------------------------|----------|-------------|------------|
| N1 | ARR | Afforestation, reforestation, revegetation, ANR | VCS/ACR | Removal/Avoidance | Medium |
| N2 | IFM | Extended rotations, RIL, conversion avoidance | VCS/ACR | Removal/Avoidance | High |
| N3 | REDD+ | Frontier, mosaic, planned deforestation | VCS/ART-TREES | Avoidance | Very High |
| N4 | Wetlands & Blue Carbon | Mangroves, peatlands, tidal marsh, seagrass | VCS/Private | Removal/Avoidance | High |
| A1 | Soil Carbon | Cropland, rangelands, cover crops, regenerative | VCS/ACR/National | Removal/Reduction | Medium |
| A2 | Livestock Methane | Digesters, manure management, enteric interventions | VCS/ACR/CAR | Reduction | Medium |
| A3 | Rice Cultivation | AWD, methane reduction in paddies | VCS/GS/National | Reduction | Low |
| E1 | Grid Renewables | Solar, wind, hydro, geothermal grid-connected | VCS/GS/CDM | Reduction | Medium |
| E2 | Distributed Energy | Mini-grids, SHS, rural electrification | GS/VCS | Reduction | High |
| E3 | Clean Cooking | Improved cookstoves, water purification, biogas | GS/VCS | Reduction | High |
| E4 | Energy Efficiency | Industrial equipment, buildings, appliances | VCS/GS/ACR | Reduction | High |
| W1 | Landfill Gas | Landfill gas flaring, electricity generation | VCS/ACR | Reduction | Medium |
| W2 | Wastewater Methane | Industrial/municipal wastewater treatment | VCS/ACR | Reduction | Medium |
| W3 | Organic Waste | Composting, anaerobic digestion, organics processing | VCS/ACR/National | Reduction | High |
| I1 | Industrial Gases | N2O, HFCs, process gas destruction | VCS/CDM | Reduction | Medium |
| I2 | CCS/CCUS | Industrial capture, transport, geologic storage | VCS/ACR/Puro | Reduction/Removal | Very High |
| I3 | Biochar | Pyrolysis, biochar application, durable end use | Puro/Isometric/ACR | Removal | High |
| R1 | Mineralization | Concrete carbonation, ERW, mine tailings | Puro/Isometric | Removal | High |
| R2 | DAC | Direct air capture with durable storage | Puro/Isometric | Removal | Very High |
| R3 | BiCRS | Biogenic capture and storage, biomass burial | Isometric/Puro | Removal | High |

---

## 4. System Architecture Overview

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CARBON CREDIT ENGINE PLATFORM                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         PRESENTATION LAYER                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │   React/    │  │  Activity   │  │  Retirement │  │  Dashboard  │ │   │
│  │  │   Next.js   │  │    UI       │  │     UI      │  │    & Reports│ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           API GATEWAY                                │   │
│  │              (Authentication, Rate Limiting, Routing)                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│          ┌─────────────────────────┼─────────────────────────┐              │
│          │                         │                         │              │
│          ▼                         ▼                         ▼              │
│  ┌───────────────┐       ┌─────────────────┐       ┌─────────────────┐     │
│  │   CALCULATION │       │   ACTIVITY      │       │   RETIREMENT    │     │
│  │    ENGINE     │◄─────│   MANAGEMENT    │◄─────│    SERVICE      │     │
│  │   SERVICES    │       │    SERVICE      │       │                 │     │
│  └───────┬───────┘       └─────────────────┘       └─────────────────┘     │
│          │                                                                 │
│          │    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│          └───►│  Nature &   │    │   Energy &  │    │  Industrial │        │
│               │ Agriculture │    │    Waste    │    │    & CDR    │        │
│               └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        INTEGRATION LAYER                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │   Verra     │  │    Gold     │  │    Puro     │  │  Isometric  │ │   │
│  │  │    API      │  │  Standard   │  │   Registry  │  │   Registry  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          DATA LAYER                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │  PostgreSQL │  │    Redis    │  │   Kafka     │  │     S3      │ │   │
│  │  │  (Primary)  │  │   (Cache)   │  │  (Events)   │  │  (Files)    │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Core Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React/Next.js | User interface for all modules |
| API Gateway | Kong/AWS API Gateway | Routing, auth, rate limiting |
| Calculation Engine | Python/FastAPI | Credit calculation algorithms |
| Activity Service | Node.js/NestJS | Activity lifecycle management |
| Retirement Service | Node.js/NestJS | Retirement workflow orchestration |
| Database | PostgreSQL + TimescaleDB | Primary data storage |
| Cache | Redis | Session, cache, rate limiting |
| Message Queue | Kafka | Event streaming |
| File Storage | S3/Azure Blob | Documents, certificates |

---

## 5. Component Specifications

### 5.1 Calculation Engine Requirements

The calculation engine is organized into three domain-specific modules:

#### 5.1.1 Nature-Based & Agriculture Module

**Methodologies:** ARR, IFM, REDD+, Wetlands & Blue Carbon, Soil Carbon, Livestock Methane, Rice Cultivation

**Key Calculation Types:**
- Carbon stock change calculations
- Baseline land-use modeling
- Leakage adjustments (activity-shifting, market)
- Buffer contributions for non-permanence risk
- Uncertainty discounts

**Input Parameters:** 200+ parameters across 7 methodologies
- Project definition (area, dates, ecological zones)
- Baseline carbon stocks (AGB, BGB, SOC, deadwood, litter)
- Project scenario parameters (species, density, survival rates)
- Adjustment factors (leakage, buffer, uncertainty)

**Output:** Net credit quantification in tCO2e with uncertainty ranges

**Reference Document:** `carbon_credit_calculation_engine_requirements.md`

---

#### 5.1.2 Energy & Waste Module

**Methodologies:** Grid Renewables, Distributed Energy, Clean Cooking, Energy Efficiency, Landfill Gas, Wastewater Methane, Organic Waste

**Key Calculation Types:**
- Electricity generation × grid emission factor
- Baseline fuel displacement calculations
- Methane generation and destruction factors
- Performance adjustment factors
- Metered savings calculations

**Input Parameters:** 200+ parameters across 7 methodologies
- Energy data (generation, consumption, meter readings)
- Emission factors (grid, fuel, combined margin)
- Plant performance (capacity factor, availability)
- Waste quantities and methane content

**Output:** Emission reductions in tCO2e with monitoring evidence

**Reference Document:** `energy_waste_calculation_engine_requirements.md`

---

#### 5.1.3 Industrial & Engineered CDR Module

**Methodologies:** Industrial Gases, CCS/CCUS, Biochar, Mineralization, DAC, BiCRS, Private CDR

**Key Calculation Types:**
- High-GWP gas destruction × GWP
- Lifecycle emissions accounting (LCA)
- Durable carbon storage calculations
- Net removal after all attributable emissions
- Durability and permanence verification

**Input Parameters:** 200+ parameters across 7 methodologies
- Gas destruction quantities and efficiencies
- CO2 capture, transport, and storage data
- Biochar production and properties
- Mineralization rates and efficiencies
- Energy consumption and emission factors

**Output:** Net removals/reductions in tCO2e with durability classification

**Reference Document:** `industrial_engineered_cdr_calculation_engine_requirements.md`

---

### 5.2 UI Module Specifications

#### 5.2.1 Dashboard and Navigation

**Main Dashboard Components:**
- Quick stats row (active projects, pending calculations, credits generated)
- Project status breakdown
- Activity distribution by cluster (visualization)
- Recent activities table
- Notifications and alerts panel
- Quick action buttons

**Navigation Structure:**
- Hierarchical sidebar by project family
- Activity cluster shortcuts
- Global search functionality
- Breadcrumb navigation

**Reference Document:** `ui_requirements_carbon_credit_calculations.md` (Section 2)

---

#### 5.2.2 Activity Creation Workflow

**7-Step Wizard Pattern:**
1. **Cluster & Methodology Selection** - Choose from 20 activity clusters
2. **Project Information** - Name, description, location, dates
3. **Geographic Boundaries** - Map interface for boundary definition
4. **Baseline Scenario Configuration** - Baseline parameters by methodology
5. **Activity Data Input** - Methodology-specific data entry forms
6. **Review & Calculate** - Preview and execute calculation
7. **Save & Submit** - Store activity and trigger verification workflow

**Reference Document:** `ui_requirements_carbon_credit_calculations.md` (Section 3)

---

#### 5.2.3 Data Input Modules by Cluster

Each of the 20 activity clusters has dedicated input forms with:

| Feature | Description |
|---------|-------------|
| **Field Validation** | Real-time validation with error messaging |
| **Unit Conversion** | Automatic unit conversion and formatting |
| **Default Values** | Suggested defaults based on methodology |
| **Batch Import** | CSV/Excel import for bulk data entry |
| **Document Upload** | Supporting evidence attachment |
| **Help Tooltips** | Contextual guidance for each field |

**Reference Document:** `ui_requirements_carbon_credit_calculations.md` (Section 4)

---

#### 5.2.4 Calculation Interface

**Real-Time Calculation Preview:**
- Input parameter summary
- Intermediate calculation steps
- Preview results with uncertainty ranges
- Sensitivity analysis visualization
- What-if scenario testing

**Calculation History:**
- Version control for calculations
- Change tracking and audit trail
- Comparison between versions
- Rollback capabilities

**Reference Document:** `ui_requirements_carbon_credit_calculations.md` (Section 5)

---

#### 5.2.5 Results and Reporting

**Results Display:**
- Credit quantity with confidence intervals
- Visual charts (carbon stock changes, emission reductions)
- Uncertainty and confidence level indicators
- Methodology compliance checklist

**Report Generation:**
- PDF reports for verification
- Excel exports for analysis
- XML for registry submission
- Custom report builder

**Reference Document:** `ui_requirements_carbon_credit_calculations.md` (Section 7)

---

### 5.3 Retirement Protocol UI Specifications

#### 5.3.1 Retirement Dashboard

**Credit Inventory Overview:**
- Registry-specific credit counts (Verra, Gold Standard, Puro, Isometric)
- Available vs pending retirement status
- Vintage distribution visualization
- Quick-action retirement buttons per registry

**Retirement Activity Timeline:**
- Chronological activity feed
- Status indicators (pending, processing, completed, failed)
- Filter by registry, date, status, beneficiary
- Real-time updates via WebSocket

**Reference Document:** `carbon_credit_retirement_protocol_ui_requirements.md` (Section 2)

---

#### 5.3.2 Retirement Workflow UI

**7-Step Retirement Workflow:**
1. **Registry Selection** - Choose target registry
2. **Credit Selection** - Select credits/batches for retirement
3. **Serial Number Management** - Review and confirm serial ranges
4. **Beneficiary Designation** - Specify retirement beneficiary
5. **Retirement Reason** - Select use case and purpose
6. **Review & Confirm** - Final review before execution
7. **Execution & Tracking** - Submit and monitor status

**Reference Document:** `carbon_credit_retirement_protocol_ui_requirements.md` (Section 3)

---

#### 5.3.3 Registry-Specific Interfaces

| Registry | Key UI Features |
|----------|-----------------|
| **Verra** | VCU selection, batch management, retirement context |
| **Gold Standard** | SDG linkage, impact registry integration |
| **Puro** | CORC retirement, consumption details, beneficiary metadata |
| **Isometric** | Buyer traceability, protocol compliance verification |

**Reference Document:** `carbon_credit_retirement_protocol_ui_requirements.md` (Section 4)

---

#### 5.3.4 Beneficiary Management

**Beneficiary Profile Management:**
- Organization and individual beneficiary types
- Profile creation and editing
- Validation workflows
- Multiple beneficiary allocation
- Beneficiary history and reporting

**Reference Document:** `carbon_credit_retirement_protocol_ui_requirements.md` (Section 5)

---

#### 5.3.5 Retirement Certificates

**Certificate Features:**
- Automatic certificate generation
- PDF download
- Certificate verification
- Sharing options
- Archive and retrieval

**Certificate Contents:**
- Retirement transaction details
- Serial numbers retired
- Project and vintage information
- Beneficiary designation
- Registry confirmation

**Reference Document:** `carbon_credit_retirement_protocol_ui_requirements.md` (Section 7)

---

#### 5.3.6 Batch Retirement Operations

**Batch Features:**
- Multi-credit selection interface
- Bulk retirement workflows
- Template-based retirement
- Scheduled retirement options
- Batch status tracking

**Reference Document:** `carbon_credit_retirement_protocol_ui_requirements.md` (Section 8)

---

### 5.4 Data Model and Integration Specifications

#### 5.4.1 Core Entities

| Entity | Purpose | Key Relationships |
|--------|---------|-------------------|
| Organization | Companies/entities | 1:N with Projects, Users |
| User/Account | Platform users | N:1 with Organization, M:N with Roles |
| Project | Carbon credit projects | 1:N with Activities |
| Activity | Activity-level calculations | N:1 with Project, 1:N with Calculations |
| Methodology | Calculation methodologies | 1:N with Activities |
| Credit | Issued carbon credits | N:1 with Activity, 1:N with Retirements |
| Registry | Registry systems | 1:N with Credits |
| Retirement | Retirement transactions | N:1 with Credit, N:1 with Beneficiary |
| Beneficiary | Retirement beneficiaries | 1:N with Retirements |
| Verification | Third-party verification | 1:1 with Activity |
| Document | Supporting documents | N:N with Activities |

**Reference Document:** `carbon_credit_engine_specification.md` (Section 1)

---

#### 5.4.2 API Specifications

**Internal APIs:**
- Calculation Engine API - Execute credit calculations
- Activity Management API - CRUD operations for activities
- Project Management API - Project lifecycle management
- Credit Management API - Credit inventory and tracking
- Retirement API - Retirement workflow execution
- User Management API - Authentication and authorization
- Reporting API - Report generation and export

**External Registry APIs:**
- Verra Registry API - VCU issuance and retirement
- Gold Standard API - GS credit management
- Puro.earth API - CORC management
- Isometric API - CDR credit management

**Reference Document:** `carbon_credit_engine_specification.md` (Section 2)

---

#### 5.4.3 Security Requirements

**Authentication & Authorization:**
- OAuth2/OIDC implementation
- JWT token management
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- API key management

**Data Security:**
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- PII handling and data privacy (GDPR)
- Secure credential storage (HashiCorp Vault)
- Audit logging

**Compliance:**
- SOC 2 Type II
- GDPR compliance
- Carbon market regulations

**Reference Document:** `carbon_credit_engine_specification.md` (Section 5)

---

#### 5.4.4 Performance & Scalability

**Performance Targets:**
| Metric | Target |
|--------|--------|
| API Response Time (p95) | < 500ms |
| Simple Calculation | < 500ms |
| Complex LCA Calculation | < 3s |
| Page Load Time | < 2s |
| Concurrent Users | 10,000+ |
| Calculations/Minute | 1,000+ |

**Scalability Patterns:**
- Horizontal pod autoscaling (HPA)
- Database read replicas
- Multi-level caching (Redis)
- CDN for static assets
- Async processing for heavy calculations

**Reference Document:** `carbon_credit_engine_specification.md` (Section 6)

---

## 6. Integration Requirements

### 6.1 Registry Integration Patterns

| Registry | Integration Type | Sync Frequency | Key Operations |
|----------|------------------|----------------|----------------|
| Verra | REST API + Webhooks | Real-time + Batch | Issuance, Transfer, Retirement |
| Gold Standard | REST API + SFTP | Real-time + Batch | Credit management, SDG linking |
| Puro.earth | REST API + Portal | Real-time | CORC issuance, retirement |
| Isometric | REST API | Real-time | CDR verification, retirement |

### 6.2 Third-Party Integrations

| System | Integration Type | Purpose |
|--------|------------------|---------|
| Identity Provider | OAuth2/OIDC | Authentication |
| Payment Processor | REST API | Credit purchases |
| Document Storage | S3/Azure Blob | File storage |
| Email Service | SMTP/API | Notifications |
| Monitoring | Prometheus/Grafana | System monitoring |
| SIEM | Syslog/API | Security logging |

---

## 7. Implementation Roadmap

### 7.1 Phase 1: Foundation (Months 1-3)
- Core platform infrastructure
- User management and authentication
- Basic project and activity management
- Database schema implementation

### 7.2 Phase 2: Calculation Engines (Months 4-6)
- Nature-based & Agriculture calculation module
- Energy & Waste calculation module
- Basic UI for activity creation and calculation

### 7.3 Phase 3: Advanced Calculations (Months 7-9)
- Industrial & Engineered CDR calculation module
- Advanced UI modules for all 20 clusters
- MRV integration capabilities

### 7.4 Phase 4: Registry Integration (Months 10-12)
- Verra and Gold Standard API integration
- Credit inventory synchronization
- Basic retirement functionality

### 7.5 Phase 5: Retirement Protocol (Months 13-15)
- Full retirement workflow UI
- Multi-registry retirement support
- Certificate generation and management

### 7.6 Phase 6: Optimization (Months 16-18)
- Performance optimization
- Advanced reporting and analytics
- Mobile responsiveness
- Accessibility compliance

---

## 8. Appendices

### 8.1 Reference Documents

| Document | Description | Location |
|----------|-------------|----------|
| Nature-Based & Agriculture Calculation Engine | Detailed specs for N1-N4, A1-A3 | `carbon_credit_calculation_engine_requirements.md` |
| Energy & Waste Calculation Engine | Detailed specs for E1-E4, W1-W3 | `energy_waste_calculation_engine_requirements.md` |
| Industrial & Engineered CDR Calculation Engine | Detailed specs for I1-I3, R1-R3 | `industrial_engineered_cdr_calculation_engine_requirements.md` |
| UI Module Specifications | Activity-level UI for all 20 clusters | `ui_requirements_carbon_credit_calculations.md` |
| Retirement Protocol UI | Multi-registry retirement workflows | `carbon_credit_retirement_protocol_ui_requirements.md` |
| Data Model & Integration | Entity model, APIs, security, architecture | `carbon_credit_engine_specification.md` |

### 8.2 Glossary

| Term | Definition |
|------|------------|
| **Activity** | A specific carbon credit-generating activity within a project |
| **ARR** | Afforestation, Reforestation, Revegetation |
| **Baseline** | The scenario that would occur without the project |
| **Buffer** | Pool of credits set aside to cover reversals |
| **CCS/CCUS** | Carbon Capture and Storage / Carbon Capture, Utilization, and Storage |
| **CDR** | Carbon Dioxide Removal |
| **CORC** | CO2 Removal Certificate (Puro.earth) |
| **DAC** | Direct Air Capture |
| **IFM** | Improved Forest Management |
| **Leakage** | Emissions that occur outside the project boundary due to the project |
| **MRV** | Monitoring, Reporting, and Verification |
| **REDD+** | Reducing Emissions from Deforestation and Forest Degradation |
| **Removal** | Credits from actively removing CO2 from the atmosphere |
| **Retirement** | Permanent removal of credits from circulation |
| **VCS** | Verified Carbon Standard (Verra) |
| **VCU** | Verified Carbon Unit |

### 8.3 Standards and Methodology References

| Standard | URL |
|----------|-----|
| Verra VCS Methodologies | https://verra.org/program-methodology/vcs-program-standard/overview/ |
| Gold Standard Eligible Projects | https://www.goldstandard.org/project-developers/eligible-project-scopes |
| ACR Methodologies | https://acrcarbon.org/methodologies/approved-methodologies/ |
| Puro.earth | https://puro.earth |
| Isometric | https://isometric.com |

---

**End of Master Requirements Document**

*For detailed specifications, refer to the component documents listed in Appendix 8.1*
