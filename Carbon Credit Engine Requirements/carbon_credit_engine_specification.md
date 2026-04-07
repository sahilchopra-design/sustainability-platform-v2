# Carbon Credit Engine Platform
## Technical Specification Document

**Version:** 1.0  
**Date:** January 2025  
**Classification:** Technical Architecture & Data Model

---

## Table of Contents

1. [Entity Relationship Data Model](#1-entity-relationship-data-model)
2. [API Specifications](#2-api-specifications)
3. [System Architecture](#3-system-architecture)
4. [Integration Patterns](#4-integration-patterns)
5. [Security Requirements](#5-security-requirements)
6. [Performance & Scalability](#6-performance--scalability)
7. [Database Schema (SQL DDL)](#7-database-schema-sql-ddl)
8. [Event-Driven Architecture](#8-event-driven-architecture)

---

## 1. ENTITY RELATIONSHIP DATA MODEL

### 1.1 Core Entity Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CARBON CREDIT ENGINE DATA MODEL                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │ Organization│◄───│   Project   │◄───│  Activity   │◄───│ Calculation │   │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘   │
│         │                  │                  │                  │          │
│         │    ┌─────────────┘                  │                  │          │
│         │    │                                │                  │          │
│         ▼    ▼                                ▼                  ▼          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │    User     │    │ Methodology │    │   Credit    │    │   Result    │   │
│  │   (Account) │    │             │    │             │    │             │   │
│  └──────┬──────┘    └─────────────┘    └──────┬──────┘    └─────────────┘   │
│         │                                      │                             │
│         │         ┌────────────────────────────┘                             │
│         │         │                                                          │
│         ▼         ▼                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Role/Perm │    │   Registry  │◄───│  Retirement │◄───│ Beneficiary │   │
│  └─────────────┘    └──────┬──────┘    └──────┬──────┘    └─────────────┘   │
│                            │                  │                              │
│                            │    ┌─────────────┘                              │
│                            │    │                                            │
│                            ▼    ▼                                            │
│                     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│                     │Verification │    │   Document  │    │    Batch    │   │
│                     └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Entity Definitions

#### 1.2.1 ORGANIZATION

**Purpose:** Represents companies, entities, or organizations participating in the carbon credit platform.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| organization_id | UUID | PK | Unique identifier |
| org_code | VARCHAR(50) | UNIQUE, NOT NULL | Business identifier (e.g., ORG-2024-001) |
| name | VARCHAR(255) | NOT NULL | Organization name |
| legal_name | VARCHAR(255) | | Legal registered name |
| registration_number | VARCHAR(100) | | Business registration number |
| tax_id | VARCHAR(50) | | Tax/VAT identifier |
| organization_type | ENUM | NOT NULL | PROJECT_DEVELOPER, VERIFIER, BUYER, BROKER, REGISTRY |
| status | ENUM | NOT NULL | ACTIVE, SUSPENDED, INACTIVE, PENDING_VERIFICATION |
| address_line_1 | VARCHAR(255) | | Street address |
| address_line_2 | VARCHAR(255) | | Additional address |
| city | VARCHAR(100) | | City |
| state_province | VARCHAR(100) | | State/Province |
| postal_code | VARCHAR(20) | | Postal/ZIP code |
| country_code | CHAR(2) | FK | ISO 3166-1 alpha-2 |
| phone | VARCHAR(50) | | Contact phone |
| email | VARCHAR(255) | | Contact email |
| website | VARCHAR(255) | | Organization website |
| primary_contact_id | UUID | FK | Reference to primary user |
| kyc_status | ENUM | | PENDING, VERIFIED, REJECTED |
| kyc_verified_at | TIMESTAMP | | KYC verification timestamp |
| credit_balance | DECIMAL(20,6) | DEFAULT 0 | Total credit balance |
| metadata | JSONB | | Additional organization data |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| version | INTEGER | NOT NULL | Optimistic locking version |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Relationships:**
- 1:N with PROJECT (an organization can have multiple projects)
- 1:N with USER/ACCOUNT (an organization has multiple users)
- 1:N with RETIREMENT (an organization can execute retirements)
- 1:N with CREDIT (credits owned by organization)

---

#### 1.2.2 USER (ACCOUNT)

**Purpose:** Platform users with authentication and authorization capabilities.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| user_id | UUID | PK | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email address |
| password_hash | VARCHAR(255) | | Bcrypt hashed password |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| display_name | VARCHAR(200) | | Display name |
| phone | VARCHAR(50) | | Phone number |
| job_title | VARCHAR(100) | | Job title |
| department | VARCHAR(100) | | Department |
| organization_id | UUID | FK, NOT NULL | Parent organization |
| status | ENUM | NOT NULL | ACTIVE, INACTIVE, SUSPENDED, PENDING |
| email_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| email_verified_at | TIMESTAMP | | Email verification timestamp |
| mfa_enabled | BOOLEAN | DEFAULT FALSE | Multi-factor auth enabled |
| mfa_secret | VARCHAR(255) | | Encrypted MFA secret |
| last_login_at | TIMESTAMP | | Last login timestamp |
| last_login_ip | INET | | Last login IP address |
| failed_login_attempts | INTEGER | DEFAULT 0 | Failed login counter |
| locked_until | TIMESTAMP | | Account lockout expiry |
| password_changed_at | TIMESTAMP | | Last password change |
| password_expires_at | TIMESTAMP | | Password expiry |
| timezone | VARCHAR(50) | DEFAULT 'UTC' | User timezone |
| locale | VARCHAR(10) | DEFAULT 'en' | User locale |
| preferences | JSONB | | User preferences |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Relationships:**
- N:1 with ORGANIZATION (user belongs to one organization)
- M:N with ROLE (user has multiple roles)
- 1:N with AUDIT_LOG (user actions logged)
- 1:N with SESSION (active sessions)

---

#### 1.2.3 ROLE & PERMISSION

**Purpose:** Role-based access control for the platform.

**ROLE Entity:**

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| role_id | UUID | PK | Unique identifier |
| role_code | VARCHAR(50) | UNIQUE, NOT NULL | Role code (e.g., ADMIN, PROJECT_MANAGER) |
| name | VARCHAR(100) | NOT NULL | Role name |
| description | TEXT | | Role description |
| scope | ENUM | NOT NULL | PLATFORM, ORGANIZATION, PROJECT |
| is_system | BOOLEAN | DEFAULT FALSE | System-defined role |
| permissions | JSONB | NOT NULL | Array of permission codes |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**PERMISSION Entity:**

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| permission_id | UUID | PK | Unique identifier |
| permission_code | VARCHAR(100) | UNIQUE, NOT NULL | Permission code |
| name | VARCHAR(100) | NOT NULL | Permission name |
| description | TEXT | | Permission description |
| resource_type | VARCHAR(50) | NOT NULL | Resource (project, credit, retirement, etc.) |
| action_type | ENUM | NOT NULL | CREATE, READ, UPDATE, DELETE, EXECUTE |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**USER_ROLE Junction Table:**

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| user_role_id | UUID | PK | Unique identifier |
| user_id | UUID | FK, NOT NULL | Reference to user |
| role_id | UUID | FK, NOT NULL | Reference to role |
| organization_id | UUID | FK | Scope organization |
| project_id | UUID | FK | Scope project |
| granted_at | TIMESTAMP | NOT NULL | When role was granted |
| granted_by | UUID | FK | Who granted the role |
| expires_at | TIMESTAMP | | Role expiry |

---

#### 1.2.4 PROJECT

**Purpose:** Carbon credit projects that generate credits through activities.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| project_id | UUID | PK | Unique identifier |
| project_code | VARCHAR(50) | UNIQUE, NOT NULL | Business identifier (e.g., PROJ-2024-001) |
| organization_id | UUID | FK, NOT NULL | Owning organization |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | | Project description |
| project_family | ENUM | NOT NULL | NATURE_BASED, AGRICULTURE, ENERGY, WASTE, INDUSTRIAL, ENGINEERED_CDR, CROSS_CUTTING |
| project_type | VARCHAR(100) | | Specific project type |
| status | ENUM | NOT NULL | DRAFT, PENDING, ACTIVE, PAUSED, COMPLETED, ARCHIVED |
| registry_id | UUID | FK | Associated registry |
| external_registry_id | VARCHAR(100) | | ID in external registry |
| external_project_id | VARCHAR(100) | | Project ID in external system |
| country_code | CHAR(2) | NOT NULL | Project location country |
| region | VARCHAR(100) | | Region/State |
| latitude | DECIMAL(10,8) | | Project location latitude |
| longitude | DECIMAL(11,8) | | Project location longitude |
| area_hectares | DECIMAL(15,4) | | Project area in hectares |
| start_date | DATE | | Project start date |
| end_date | DATE | | Project end date |
| crediting_period_start | DATE | | Crediting period start |
| crediting_period_end | DATE | | Crediting period end |
| baseline_scenario | TEXT | | Baseline description |
| project_scenario | TEXT | | Project scenario description |
| additionality_proof | TEXT | | Additionality justification |
| leakage_assessment | TEXT | | Leakage considerations |
| permanence_period_years | INTEGER | | Permanence commitment |
| buffer_contribution_pct | DECIMAL(5,2) | | Buffer pool contribution % |
| total_credits_issued | DECIMAL(20,6) | DEFAULT 0 | Total credits issued |
| total_credits_retired | DECIMAL(20,6) | DEFAULT 0 | Total credits retired |
| current_credit_balance | DECIMAL(20,6) | DEFAULT 0 | Current balance |
| verification_body_id | UUID | FK | Assigned verification body |
| verification_status | ENUM | | PENDING, IN_PROGRESS, VERIFIED, REJECTED |
| last_verification_date | DATE | | Last verification date |
| next_verification_date | DATE | | Next verification due |
| documents | JSONB | | Associated document IDs |
| metadata | JSONB | | Additional project data |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| version | INTEGER | NOT NULL | Optimistic locking version |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Relationships:**
- N:1 with ORGANIZATION (project owned by organization)
- 1:N with ACTIVITY (project has multiple activities)
- N:1 with REGISTRY (project registered with registry)
- 1:N with CREDIT (project generates credits)
- 1:N with DOCUMENT (project has documents)
- 1:N with VERIFICATION (project verifications)

---

#### 1.2.5 METHODOLOGY

**Purpose:** Calculation methodologies for different project types.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| methodology_id | UUID | PK | Unique identifier |
| methodology_code | VARCHAR(50) | UNIQUE, NOT NULL | Methodology code (e.g., VM0015, GS-VER-001) |
| name | VARCHAR(255) | NOT NULL | Methodology name |
| description | TEXT | | Methodology description |
| version | VARCHAR(20) | NOT NULL | Methodology version |
| project_family | ENUM | NOT NULL | NATURE_BASED, AGRICULTURE, ENERGY, WASTE, INDUSTRIAL, ENGINEERED_CDR, CROSS_CUTTING |
| activity_cluster | VARCHAR(100) | NOT NULL | Activity cluster classification |
| standard_body | ENUM | NOT NULL | VERRA, GOLD_STANDARD, ACR, CAR, CDM, PURO, ISOMETRIC, PROPRIETARY |
| applicability_conditions | JSONB | | Conditions for methodology applicability |
| baseline_parameters | JSONB | | Required baseline parameters |
| project_parameters | JSONB | | Required project parameters |
| leakage_parameters | JSONB | | Leakage calculation parameters |
| emission_factors | JSONB | | Default emission factors |
| calculation_logic | JSONB | NOT NULL | Calculation formula/expression |
| validation_rules | JSONB | | Input validation rules |
| required_documents | JSONB | | Required supporting documents |
| uncertainty_provisions | JSONB | | Uncertainty handling rules |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| effective_date | DATE | | When methodology becomes effective |
| expiry_date | DATE | | Methodology expiry date |
| superseded_by | UUID | FK | Newer methodology version |
| documentation_url | VARCHAR(500) | | Link to methodology documentation |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| version | INTEGER | NOT NULL | Optimistic locking version |

**Activity Cluster Mapping:**

| Project Family | Activity Clusters | Methodology Examples |
|----------------|-------------------|---------------------|
| NATURE_BASED | ARR, IFM, REDD+, Wetlands, Blue Carbon | VM0015, VM0033, VM0007 |
| AGRICULTURE | Soil Carbon, Livestock Methane, Rice Cultivation | VM0042, VM0038, VM0017 |
| ENERGY | Grid Renewables, Distributed Energy, Clean Cooking, Energy Efficiency | ACM0002, AMS-I.D, GS-VER-001 |
| WASTE | Landfill Gas, Wastewater Methane, Organic Waste | ACM0001, AMS-III.H, VM0018 |
| INDUSTRIAL | Industrial Gases, CCS/CCUS | AM0023, VM0043 |
| ENGINEERED_CDR | Biochar, Mineralization, DAC, BiCRS | Puro-BIOCHAR, Isometric-DAC |
| CROSS_CUTTING | Multi-sector methodologies | Various |

---

#### 1.2.6 ACTIVITY

**Purpose:** Activity-level data for carbon credit calculations.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| activity_id | UUID | PK | Unique identifier |
| activity_code | VARCHAR(50) | UNIQUE, NOT NULL | Business identifier (e.g., ACT-2024-001) |
| project_id | UUID | FK, NOT NULL | Parent project |
| methodology_id | UUID | FK, NOT NULL | Applied methodology |
| name | VARCHAR(255) | NOT NULL | Activity name |
| description | TEXT | | Activity description |
| activity_type | VARCHAR(100) | NOT NULL | Type of activity |
| status | ENUM | NOT NULL | DRAFT, PENDING_REVIEW, APPROVED, REJECTED, ARCHIVED |
| monitoring_period_start | DATE | NOT NULL | Monitoring period start |
| monitoring_period_end | DATE | NOT NULL | Monitoring period end |
| baseline_data | JSONB | | Baseline scenario data |
| project_data | JSONB | | Project scenario data |
| leakage_data | JSONB | | Leakage calculation data |
| uncertainty_data | JSONB | | Uncertainty adjustments |
| input_parameters | JSONB | NOT NULL | Activity input parameters |
| calculated_emissions | JSONB | | Calculated emission reductions |
| net_credits_calculated | DECIMAL(20,6) | | Net credits from calculation |
| buffer_deduction | DECIMAL(20,6) | | Buffer pool deduction |
| issuance_request_amount | DECIMAL(20,6) | | Amount requested for issuance |
| verification_status | ENUM | | PENDING, IN_PROGRESS, VERIFIED, REJECTED |
| verified_by | UUID | FK | Verifier user |
| verified_at | TIMESTAMP | | Verification timestamp |
| verification_notes | TEXT | | Verifier notes |
| calculation_run_id | UUID | FK | Associated calculation run |
| documents | JSONB | | Associated document IDs |
| metadata | JSONB | | Additional activity data |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| version | INTEGER | NOT NULL | Optimistic locking version |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Relationships:**
- N:1 with PROJECT (activity belongs to project)
- N:1 with METHODOLOGY (activity uses methodology)
- 1:N with CALCULATION (activity has calculation runs)
- 1:N with CREDIT (activity generates credits)
- 1:N with DOCUMENT (activity has supporting documents)

---

#### 1.2.7 CALCULATION

**Purpose:** Calculation runs for activity-level carbon credit quantification.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| calculation_id | UUID | PK | Unique identifier |
| calculation_code | VARCHAR(50) | UNIQUE, NOT NULL | Business identifier (e.g., CALC-2024-001) |
| activity_id | UUID | FK, NOT NULL | Parent activity |
| methodology_id | UUID | FK, NOT NULL | Methodology used |
| calculation_type | ENUM | NOT NULL | BASELINE, PROJECT, LEAKAGE, NET, FULL |
| status | ENUM | NOT NULL | PENDING, RUNNING, COMPLETED, FAILED, CANCELLED |
| input_data | JSONB | NOT NULL | Complete input dataset |
| calculation_steps | JSONB | | Step-by-step calculation log |
| intermediate_results | JSONB | | Intermediate calculation values |
| final_results | JSONB | | Final calculation results |
| baseline_emissions | DECIMAL(20,6) | | Baseline emissions (tCO2e) |
| project_emissions | DECIMAL(20,6) | | Project emissions (tCO2e) |
| leakage_emissions | DECIMAL(20,6) | | Leakage emissions (tCO2e) |
| net_emission_reductions | DECIMAL(20,6) | | Net emission reductions |
| uncertainty_adjustment | DECIMAL(20,6) | | Uncertainty deduction |
| adjusted_reductions | DECIMAL(20,6) | | After uncertainty adjustment |
| buffer_contribution | DECIMAL(20,6) | | Buffer pool contribution |
| credits_generated | DECIMAL(20,6) | | Final credits generated |
| calculation_engine_version | VARCHAR(50) | | Calculation engine version |
| started_at | TIMESTAMP | | Calculation start time |
| completed_at | TIMESTAMP | | Calculation completion time |
| duration_seconds | INTEGER | | Calculation duration |
| error_message | TEXT | | Error details if failed |
| error_stack | TEXT | | Stack trace if failed |
| validated_by | UUID | FK | Validator user |
| validated_at | TIMESTAMP | | Validation timestamp |
| validation_notes | TEXT | | Validation notes |
| is_current | BOOLEAN | DEFAULT FALSE | Is current valid calculation |
| superseded_by | UUID | FK | Newer calculation |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| version | INTEGER | NOT NULL | Optimistic locking version |

**Relationships:**
- N:1 with ACTIVITY (calculation for activity)
- N:1 with METHODOLOGY (calculation uses methodology)
- 1:N with CREDIT (calculation results in credits)

---

#### 1.2.8 CREDIT

**Purpose:** Issued carbon credits representing verified emission reductions.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| credit_id | UUID | PK | Unique identifier |
| credit_code | VARCHAR(50) | UNIQUE, NOT NULL | Business identifier (e.g., CRED-2024-001) |
| serial_number | VARCHAR(100) | UNIQUE | Registry serial number |
| batch_id | UUID | FK | Credit batch |
| project_id | UUID | FK, NOT NULL | Source project |
| activity_id | UUID | FK, NOT NULL | Source activity |
| calculation_id | UUID | FK, NOT NULL | Source calculation |
| registry_id | UUID | FK, NOT NULL | Issuing registry |
| methodology_id | UUID | FK, NOT NULL | Applied methodology |
| vintage_year | INTEGER | NOT NULL | Credit vintage year |
| credit_type | ENUM | NOT NULL | VCU, GS_VER, CORC, ACR_CRT, CDR, OTC |
| status | ENUM | NOT NULL | ISSUED, AVAILABLE, RESERVED, RETIRED, TRANSFERRED, EXPIRED, CANCELLED |
| quantity | DECIMAL(20,6) | NOT NULL | Credit quantity (tCO2e) |
| current_owner_id | UUID | FK, NOT NULL | Current owner organization |
| original_owner_id | UUID | FK, NOT NULL | Original owner organization |
| issuance_date | DATE | NOT NULL | Date of issuance |
| expiry_date | DATE | | Credit expiry date |
| verification_standard | VARCHAR(50) | | Verification standard applied |
| verification_body | VARCHAR(100) | | Verifier organization |
| monitoring_period_start | DATE | | Monitoring period start |
| monitoring_period_end | DATE | | Monitoring period end |
| co_benefits | JSONB | | SDG co-benefits |
| corresponding_adjustment | BOOLEAN | DEFAULT FALSE | Article 6 corresponding adjustment |
| corresponding_adjustment_country | CHAR(2) | | Host country for adjustment |
| is_buffer_pool | BOOLEAN | DEFAULT FALSE | Is buffer pool credit |
| buffer_type | VARCHAR(50) | | Type of buffer (pooled, project, etc.) |
| parent_credit_id | UUID | FK | Parent credit (for splits) |
| child_credit_ids | JSONB | | Child credits (if split) |
| external_registry_data | JSONB | | Data from external registry |
| external_transaction_id | VARCHAR(100) | | Transaction ID in external system |
| metadata | JSONB | | Additional credit data |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| version | INTEGER | NOT NULL | Optimistic locking version |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

**Relationships:**
- N:1 with PROJECT (credit from project)
- N:1 with ACTIVITY (credit from activity)
- N:1 with CALCULATION (credit from calculation)
- N:1 with REGISTRY (credit issued by registry)
- N:1 with BATCH (credit in batch)
- 1:N with RETIREMENT (credit can be retired)
- Self-referential for splits/merges

---

#### 1.2.9 BATCH

**Purpose:** Batches of credits for issuance and tracking.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| batch_id | UUID | PK | Unique identifier |
| batch_code | VARCHAR(50) | UNIQUE, NOT NULL | Business identifier (e.g., BATCH-2024-001) |
| project_id | UUID | FK, NOT NULL | Source project |
| registry_id | UUID | FK, NOT NULL | Target registry |
| methodology_id | UUID | FK, NOT NULL | Applied methodology |
| vintage_year | INTEGER | NOT NULL | Batch vintage |
| status | ENUM | NOT NULL | DRAFT, SUBMITTED, PENDING_VERIFICATION, VERIFIED, ISSUED, REJECTED |
| total_quantity | DECIMAL(20,6) | NOT NULL | Total batch quantity |
| number_of_credits | INTEGER | NOT NULL | Number of individual credits |
| serial_number_start | VARCHAR(100) | | Starting serial number |
| serial_number_end | VARCHAR(100) | | Ending serial number |
| monitoring_period_start | DATE | NOT NULL | Monitoring period start |
| monitoring_period_end | DATE | NOT NULL | Monitoring period end |
| verification_body_id | UUID | FK | Assigned verifier |
| verification_submitted_at | TIMESTAMP | | When submitted for verification |
| verification_completed_at | TIMESTAMP | | When verification completed |
| issuance_submitted_at | TIMESTAMP | | When submitted for issuance |
| issuance_completed_at | TIMESTAMP | | When issuance completed |
| external_batch_id | VARCHAR(100) | | Batch ID in external registry |
| external_issuance_id | VARCHAR(100) | | Issuance ID in external registry |
| documents | JSONB | | Associated documents |
| metadata | JSONB | | Additional batch data |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| version | INTEGER | NOT NULL | Optimistic locking version |

**Relationships:**
- N:1 with PROJECT (batch from project)
- N:1 with REGISTRY (batch for registry)
- 1:N with CREDIT (batch contains credits)

---

#### 1.2.10 REGISTRY

**Purpose:** External carbon credit registry systems.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| registry_id | UUID | PK | Unique identifier |
| registry_code | VARCHAR(50) | UNIQUE, NOT NULL | Registry code (VERRA, GOLD_STANDARD, etc.) |
| name | VARCHAR(255) | NOT NULL | Registry name |
| description | TEXT | | Registry description |
| registry_type | ENUM | NOT NULL | VERRA_VCS, GOLD_STANDARD, ACR, CAR, PURO, ISOMETRIC, OTC, CUSTOM |
| status | ENUM | NOT NULL | ACTIVE, INACTIVE, MAINTENANCE, DEGRADED |
| api_base_url | VARCHAR(500) | | Base URL for API |
| api_version | VARCHAR(20) | | API version |
| auth_type | ENUM | | OAUTH2, API_KEY, CERTIFICATE, BASIC |
| auth_config | JSONB | | Authentication configuration (encrypted) |
| webhook_url | VARCHAR(500) | | Webhook endpoint for registry |
| webhook_secret | VARCHAR(255) | | Webhook verification secret (encrypted) |
| rate_limit_requests | INTEGER | | Max requests per period |
| rate_limit_period | INTEGER | | Rate limit period (seconds) |
| sync_enabled | BOOLEAN | DEFAULT FALSE | Enable automatic sync |
| sync_frequency_minutes | INTEGER | | Sync frequency |
| last_sync_at | TIMESTAMP | | Last successful sync |
| last_sync_status | ENUM | | SUCCESS, PARTIAL, FAILED |
| last_sync_error | TEXT | | Last sync error message |
| supported_operations | JSONB | | List of supported operations |
| credit_types | JSONB | | Supported credit types |
| configuration | JSONB | | Registry-specific configuration |
| metadata | JSONB | | Additional registry data |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| version | INTEGER | NOT NULL | Optimistic locking version |

**Registry-Specific Configurations:**

| Registry | Credit Types | Key Features |
|----------|--------------|--------------|
| Verra VCS | VCU | Serial tracking, vintage, program codes |
| Gold Standard | GS VER | SDG linkage, impact certification |
| Puro.earth | CORC | Beneficiary statements, removal focus |
| Isometric | CDR | Buyer traceability, durability tracking |
| ACR | CRT | US-focused, compliance markets |
| OTC | Various | Multi-registry coordination |

---

#### 1.2.11 RETIREMENT

**Purpose:** Credit retirement transactions.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| retirement_id | UUID | PK | Unique identifier |
| retirement_code | VARCHAR(50) | UNIQUE, NOT NULL | Business identifier (e.g., RET-2024-001) |
| organization_id | UUID | FK, NOT NULL | Retiring organization |
| beneficiary_id | UUID | FK | Retirement beneficiary |
| retirement_type | ENUM | NOT NULL | VOLUNTARY, COMPLIANCE, CLAIM, CANCELLATION |
| status | ENUM | NOT NULL | DRAFT, PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED |
| retirement_reason | ENUM | NOT NULL | OFFSET_EMISSIONS, INVESTMENT, GIFT, COMPLIANCE, OTHER |
| retirement_use_case | VARCHAR(255) | | Specific use case |
| retirement_date | DATE | NOT NULL | Retirement effective date |
| total_credits | DECIMAL(20,6) | NOT NULL | Total credits retired |
| total_value | DECIMAL(20,2) | | Total value if purchased |
| currency | VARCHAR(3) | | Currency code |
| certificate_url | VARCHAR(500) | | Retirement certificate URL |
| certificate_number | VARCHAR(100) | | Certificate number |
| external_retirement_id | VARCHAR(100) | | ID in external registry |
| beneficiary_statement | TEXT | | Public beneficiary statement |
| private_note | TEXT | | Private retirement note |
| emissions_claim_period_start | DATE | | Claim period start |
| emissions_claim_period_end | DATE | | Claim period end |
| emissions_claim_quantity | DECIMAL(20,6) | | Emissions being offset |
| scope_1_emissions | DECIMAL(20,6) | | Scope 1 emissions offset |
| scope_2_emissions | DECIMAL(20,6) | | Scope 2 emissions offset |
| scope_3_emissions | DECIMAL(20,6) | | Scope 3 emissions offset |
| verification_standard | VARCHAR(50) | | Standard for verification |
| third_party_verified | BOOLEAN | DEFAULT FALSE | Third-party verified |
| retirement_metadata | JSONB | | Additional retirement data |
| submitted_at | TIMESTAMP | | When submitted |
| completed_at | TIMESTAMP | | When completed |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| version | INTEGER | NOT NULL | Optimistic locking version |

**Relationships:**
- N:1 with ORGANIZATION (retirement by organization)
- N:1 with BENEFICIARY (retirement for beneficiary)
- 1:N with RETIREMENT_CREDIT (credits in retirement)
- 1:N with REGISTRY_RETIREMENT (registry-specific retirements)

---

#### 1.2.12 RETIREMENT_CREDIT (Junction)

**Purpose:** Links credits to retirement transactions.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| retirement_credit_id | UUID | PK | Unique identifier |
| retirement_id | UUID | FK, NOT NULL | Parent retirement |
| credit_id | UUID | FK, NOT NULL | Retired credit |
| quantity | DECIMAL(20,6) | NOT NULL | Quantity retired from this credit |
| serial_number | VARCHAR(100) | | Credit serial number |
| project_id | UUID | FK | Source project |
| vintage_year | INTEGER | | Credit vintage |
| registry_id | UUID | FK | Source registry |
| external_retirement_id | VARCHAR(100) | | Retirement ID in external registry |
| retirement_status | ENUM | NOT NULL | PENDING, CONFIRMED, FAILED |
| confirmed_at | TIMESTAMP | | When confirmed |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

---

#### 1.2.13 REGISTRY_RETIREMENT

**Purpose:** Registry-specific retirement execution records.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| registry_retirement_id | UUID | PK | Unique identifier |
| retirement_id | UUID | FK, NOT NULL | Parent retirement |
| registry_id | UUID | FK, NOT NULL | Target registry |
| status | ENUM | NOT NULL | PENDING, SUBMITTED, PROCESSING, COMPLETED, FAILED |
| external_retirement_id | VARCHAR(100) | | Retirement ID in registry |
| external_status | VARCHAR(50) | | Status from registry |
| submitted_at | TIMESTAMP | | When submitted to registry |
| completed_at | TIMESTAMP | | When completed |
| request_payload | JSONB | | API request sent |
| response_payload | JSONB | | API response received |
| error_message | TEXT | | Error details |
| retry_count | INTEGER | DEFAULT 0 | Number of retries |
| next_retry_at | TIMESTAMP | | Next retry scheduled |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

#### 1.2.14 BENEFICIARY

**Purpose:** Beneficiaries of credit retirements.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| beneficiary_id | UUID | PK | Unique identifier |
| beneficiary_code | VARCHAR(50) | UNIQUE, NOT NULL | Business identifier |
| organization_id | UUID | FK | Owning organization |
| name | VARCHAR(255) | NOT NULL | Beneficiary name |
| beneficiary_type | ENUM | NOT NULL | INDIVIDUAL, ORGANIZATION, PRODUCT, EVENT, CAMPAIGN |
| display_name | VARCHAR(255) | | Public display name |
| description | TEXT | | Beneficiary description |
| logo_url | VARCHAR(500) | | Logo image URL |
| website | VARCHAR(255) | | Website URL |
| email | VARCHAR(255) | | Contact email |
| is_public | BOOLEAN | DEFAULT TRUE | Public visibility |
| statement_template | TEXT | | Default statement template |
| total_retirements | INTEGER | DEFAULT 0 | Total retirement count |
| total_credits_retired | DECIMAL(20,6) | DEFAULT 0 | Total credits retired |
| metadata | JSONB | | Additional beneficiary data |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| version | INTEGER | NOT NULL | Optimistic locking version |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

---

#### 1.2.15 VERIFICATION

**Purpose:** Third-party verification records.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| verification_id | UUID | PK | Unique identifier |
| verification_code | VARCHAR(50) | UNIQUE, NOT NULL | Business identifier |
| project_id | UUID | FK | Project being verified |
| activity_id | UUID | FK | Activity being verified |
| batch_id | UUID | FK | Batch being verified |
| verifier_organization_id | UUID | FK, NOT NULL | Verifying organization |
| verifier_user_id | UUID | FK | Assigned verifier |
| verification_type | ENUM | NOT NULL | VALIDATION, VERIFICATION, PERFORMANCE_REVIEW |
| verification_standard | VARCHAR(50) | NOT NULL | Standard applied |
| status | ENUM | NOT NULL | PENDING, IN_PROGRESS, COMPLETED, REJECTED |
| requested_at | TIMESTAMP | NOT NULL | When verification requested |
| started_at | TIMESTAMP | | When verification started |
| completed_at | TIMESTAMP | | When verification completed |
| monitoring_period_start | DATE | | Period covered start |
| monitoring_period_end | DATE | | Period covered end |
| findings_summary | TEXT | | Summary of findings |
| non_conformities | JSONB | | Identified non-conformities |
| corrective_actions | JSONB | | Required corrective actions |
| verification_statement | TEXT | | Verification statement |
| verification_report_url | VARCHAR(500) | | Report document URL |
| verification_opinion | ENUM | | POSITIVE, QUALIFIED, NEGATIVE |
| credits_verified | DECIMAL(20,6) | | Credits verified |
| credits_issued | DECIMAL(20,6) | | Credits issued |
| external_verification_id | VARCHAR(100) | | ID in external system |
| documents | JSONB | | Associated documents |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| created_by | UUID | FK | User who created |
| updated_by | UUID | FK | User who last updated |
| version | INTEGER | NOT NULL | Optimistic locking version |

---

#### 1.2.16 DOCUMENT

**Purpose:** Supporting documents for projects, activities, and verifications.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| document_id | UUID | PK | Unique identifier |
| document_code | VARCHAR(50) | UNIQUE, NOT NULL | Business identifier |
| entity_type | VARCHAR(50) | NOT NULL | PROJECT, ACTIVITY, VERIFICATION, RETIREMENT |
| entity_id | UUID | NOT NULL | ID of related entity |
| document_type | VARCHAR(100) | NOT NULL | Type of document |
| name | VARCHAR(255) | NOT NULL | Document name |
| description | TEXT | | Document description |
| file_name | VARCHAR(255) | NOT NULL | Original file name |
| file_size | BIGINT | NOT NULL | File size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | MIME type |
| storage_path | VARCHAR(500) | NOT NULL | Storage location |
| storage_provider | VARCHAR(50) | NOT NULL | S3, AZURE_BLOB, GCS |
| checksum_sha256 | VARCHAR(64) | | File checksum |
| encryption_status | ENUM | | UNENCRYPTED, ENCRYPTED |
| version_number | INTEGER | DEFAULT 1 | Document version |
| previous_version_id | UUID | FK | Previous version |
| is_public | BOOLEAN | DEFAULT FALSE | Public visibility |
| access_control | JSONB | | Access control rules |
| uploaded_by | UUID | FK, NOT NULL | Uploader user |
| uploaded_at | TIMESTAMP | NOT NULL | Upload timestamp |
| expires_at | TIMESTAMP | | Document expiry |
| metadata | JSONB | | Additional document data |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |
| deleted_at | TIMESTAMP | | Soft delete timestamp |

---

#### 1.2.17 AUDIT_LOG

**Purpose:** Comprehensive audit trail for all platform actions.

| Attribute | Data Type | Constraints | Description |
|-----------|-----------|-------------|-------------|
| audit_id | UUID | PK | Unique identifier |
| audit_timestamp | TIMESTAMP | NOT NULL | When action occurred |
| action_type | VARCHAR(50) | NOT NULL | CREATE, UPDATE, DELETE, VIEW, EXECUTE, LOGIN, LOGOUT |
| entity_type | VARCHAR(50) | NOT NULL | Type of entity affected |
| entity_id | UUID | | ID of affected entity |
| user_id | UUID | FK | User who performed action |
| organization_id | UUID | FK | Organization context |
| session_id | VARCHAR(100) | | User session ID |
| ip_address | INET | | Client IP address |
| user_agent | TEXT | | Client user agent |
| request_id | VARCHAR(100) | | API request ID |
| request_method | VARCHAR(10) | | HTTP method |
| request_path | VARCHAR(500) | | API endpoint |
| request_body | JSONB | | Request payload (sanitized) |
| response_status | INTEGER | | HTTP response status |
| changes | JSONB | | Before/after values |
| description | TEXT | | Human-readable description |
| severity | ENUM | DEFAULT INFO | DEBUG, INFO, WARN, ERROR, CRITICAL |
| metadata | JSONB | | Additional audit data |
| retention_until | DATE | | Data retention deadline |

---

### 1.3 Entity Relationship Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIP MATRIX                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Entity          │ Parent    │ Children      │ Many-to-Many                  │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Organization    │ -         │ Users,        │ -                             │
│                  │           │ Projects,     │                               │
│                  │           │ Credits       │                               │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  User            │ Org       │ Sessions,     │ Roles                         │
│                  │           │ AuditLogs     │                               │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Project         │ Org       │ Activities,   │ Documents                     │
│                  │           │ Credits,      │                               │
│                  │           │ Batches       │                               │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Activity        │ Project   │ Calculations, │ Documents                     │
│                  │           │ Credits       │                               │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Methodology     │ -         │ Activities,   │ -                             │
│                  │           │ Calculations  │                               │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Calculation     │ Activity  │ Credits       │ -                             │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Credit          │ Project,  │ Retirements   │ -                             │
│                  │ Activity, │               │                               │
│                  │ Batch     │               │                               │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Batch           │ Project   │ Credits       │ -                             │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Retirement      │ Org       │ Retirement    │ Credits                       │
│                  │           │ Credits,      │                               │
│                  │           │ RegistryRets  │                               │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Registry        │ -         │ Projects,     │ -                             │
│                  │           │ Credits,      │                               │
│                  │           │ Batches       │                               │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Beneficiary     │ Org       │ Retirements   │ -                             │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Verification    │ Project/  │ -             │ Documents                     │
│                  │ Activity  │               │                               │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Document        │ Various   │ -             │ -                             │
│  ────────────────┼───────────┼───────────────┼────────────────────────────── │
│  Role            │ -         │ UserRoles     │ Users, Permissions            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```



---

## 2. API SPECIFICATIONS

### 2.1 API Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              ┌─────────────┐                                 │
│                              │   Client    │                                 │
│                              │ Applications│                                 │
│                              └──────┬──────┘                                 │
│                                     │                                        │
│                              ┌──────▼──────┐                                 │
│                              │  API Gateway │                                │
│                              │  (Kong/AWS   │                                │
│                              │   API GW)    │                                │
│                              └──────┬──────┘                                 │
│                                     │                                        │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         │                          │                          │             │
│    ┌────▼────┐              ┌──────▼──────┐            ┌──────▼──────┐      │
│    │ Internal│              │   Internal  │            │   External  │      │
│    │  APIs   │              │   APIs      │            │   Registry  │      │
│    │ (Public)│              │ (Private)   │            │    APIs     │      │
│    └────┬────┘              └──────┬──────┘            └──────┬──────┘      │
│         │                          │                          │             │
│    ┌────▼──────────────────────────▼──────────────────────────▼────┐        │
│    │                    Microservices Layer                        │        │
│    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │        │
│    │  │ Project │ │Activity │ │Calculate│ │ Credit  │ │Retire-  │ │        │
│    │  │ Service │ │ Service │ │ Service │ │ Service │ │  ment   │ │        │
│    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │        │
│    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │        │
│    │  │  User   │ │Reporting│ │  File   │ │Webhook  │ │  Audit  │ │        │
│    │  │ Service │ │ Service │ │ Service │ │ Service │ │ Service │ │        │
│    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │        │
│    └───────────────────────────────────────────────────────────────┘        │
│                                                                              │
│    ┌───────────────────────────────────────────────────────────────┐        │
│    │              External Registry Integration Layer               │        │
│    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │        │
│    │  │ Verra   │ │  Gold   │ │  Puro   │ │Isometric│ │   OTC   │ │        │
│    │  │ Adapter │ │Standard │ │ Adapter │ │ Adapter │ │ Adapter │ │        │
│    │  │         │ │ Adapter │ │         │ │         │ │         │ │        │
│    │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │        │
│    └───────────────────────────────────────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Authentication & Authorization

All APIs use OAuth 2.0 / OpenID Connect for authentication with JWT tokens.

**Token Specifications:**
- Access Token: JWT, RS256 signed, 15-minute expiry
- Refresh Token: Opaque, 7-day expiry
- ID Token: JWT, user identity claims

**Authorization Header:**
```
Authorization: Bearer <access_token>
```

**Required Scopes:**
| Scope | Description |
|-------|-------------|
| `read:projects` | Read project data |
| `write:projects` | Create/update projects |
| `read:activities` | Read activity data |
| `write:activities` | Create/update activities |
| `execute:calculations` | Run calculations |
| `read:credits` | Read credit data |
| `write:credits` | Issue/transfer credits |
| `execute:retirements` | Execute retirements |
| `read:retirements` | Read retirement data |
| `admin:*` | Administrative access |

### 2.3 Internal APIs

#### 2.3.1 Calculation Engine API

**Base URL:** `/api/v1/calculations`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/calculate` | POST | Execute new calculation | Yes |
| `/calculate/{id}` | GET | Get calculation result | Yes |
| `/calculate/{id}/status` | GET | Get calculation status | Yes |
| `/calculate/{id}/cancel` | POST | Cancel running calculation | Yes |
| `/calculate/batch` | POST | Execute batch calculations | Yes |
| `/methodologies` | GET | List available methodologies | Yes |
| `/methodologies/{id}` | GET | Get methodology details | Yes |
| `/methodologies/{id}/validate` | POST | Validate inputs against methodology | Yes |
| `/activities/{id}/calculate` | POST | Calculate for specific activity | Yes |
| `/templates/{methodologyId}` | GET | Get calculation template | Yes |

**POST /api/v1/calculations/calculate**

Request:
```json
{
  "activity_id": "uuid",
  "methodology_id": "uuid",
  "calculation_type": "FULL",
  "input_data": {
    "baseline_parameters": {
      "forest_area_ha": 1000.5,
      "carbon_stock_tco2e_per_ha": 150.0,
      "deforestation_rate": 0.02
    },
    "project_parameters": {
      "forest_area_ha": 1000.5,
      "carbon_stock_tco2e_per_ha": 185.0,
      "forest_growth_rate": 0.05
    },
    "leakage_parameters": {
      "activity_shifting_leakage": 0.05,
      "market_effects_leakage": 0.02
    },
    "monitoring_period": {
      "start_date": "2024-01-01",
      "end_date": "2024-12-31"
    }
  },
  "options": {
    "include_intermediate_results": true,
    "uncertainty_confidence_level": 0.90
  }
}
```

Response (202 Accepted - Async):
```json
{
  "calculation_id": "uuid",
  "calculation_code": "CALC-2024-001",
  "status": "PENDING",
  "estimated_completion": "2024-01-15T10:30:00Z",
  "callback_url": "https://api.example.com/webhooks/calculations/uuid",
  "_links": {
    "self": "/api/v1/calculations/uuid",
    "status": "/api/v1/calculations/uuid/status",
    "cancel": "/api/v1/calculations/uuid/cancel"
  }
}
```

Response (200 OK - Sync):
```json
{
  "calculation_id": "uuid",
  "calculation_code": "CALC-2024-001",
  "activity_id": "uuid",
  "methodology_id": "uuid",
  "status": "COMPLETED",
  "calculation_type": "FULL",
  "input_data": { ... },
  "calculation_steps": [
    {
      "step": 1,
      "name": "Baseline Emissions",
      "formula": "Area * Stock * Rate",
      "inputs": { ... },
      "result": 3010.0,
      "unit": "tCO2e"
    }
  ],
  "results": {
    "baseline_emissions": 3010.0,
    "project_emissions": 500.0,
    "leakage_emissions": 150.5,
    "net_emission_reductions": 2359.5,
    "uncertainty_adjustment": 117.98,
    "adjusted_reductions": 2241.52,
    "buffer_contribution": 224.15,
    "credits_generated": 2017.37
  },
  "started_at": "2024-01-15T10:00:00Z",
  "completed_at": "2024-01-15T10:05:30Z",
  "duration_seconds": 330
}
```

**GET /api/v1/calculations/{id}**

Response:
```json
{
  "calculation_id": "uuid",
  "calculation_code": "CALC-2024-001",
  "status": "COMPLETED",
  "results": { ... },
  "is_current": true,
  "created_at": "2024-01-15T10:00:00Z",
  "created_by": {
    "user_id": "uuid",
    "email": "user@example.com"
  }
}
```

**Error Responses:**

```json
{
  "error": {
    "code": "CALCULATION_ERROR",
    "message": "Calculation failed due to invalid input",
    "details": {
      "field": "baseline_parameters.forest_area_ha",
      "issue": "Value must be greater than 0"
    },
    "trace_id": "uuid",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

#### 2.3.2 Activity Management API

**Base URL:** `/api/v1/activities`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | List activities | Yes |
| `/` | POST | Create activity | Yes |
| `/{id}` | GET | Get activity | Yes |
| `/{id}` | PUT | Update activity | Yes |
| `/{id}` | DELETE | Delete activity | Yes |
| `/{id}/submit` | POST | Submit for review | Yes |
| `/{id}/approve` | POST | Approve activity | Yes |
| `/{id}/reject` | POST | Reject activity | Yes |
| `/{id}/calculations` | GET | Get activity calculations | Yes |
| `/{id}/documents` | GET | Get activity documents | Yes |
| `/{id}/documents` | POST | Attach document | Yes |

**POST /api/v1/activities/**

Request:
```json
{
  "project_id": "uuid",
  "methodology_id": "uuid",
  "name": "Q1 2024 Forest Monitoring",
  "description": "First quarter monitoring data for reforestation project",
  "activity_type": "MONITORING",
  "monitoring_period": {
    "start_date": "2024-01-01",
    "end_date": "2024-03-31"
  },
  "input_parameters": {
    "measured_area_ha": 1000.5,
    "measured_carbon_stock": 185.0,
    "measurement_method": "FIELD_INVENTORY",
    "measurement_date": "2024-03-15"
  },
  "documents": ["doc-uuid-1", "doc-uuid-2"]
}
```

Response:
```json
{
  "activity_id": "uuid",
  "activity_code": "ACT-2024-001",
  "project_id": "uuid",
  "methodology_id": "uuid",
  "name": "Q1 2024 Forest Monitoring",
  "status": "DRAFT",
  "created_at": "2024-01-15T10:00:00Z",
  "created_by": {
    "user_id": "uuid",
    "email": "user@example.com"
  },
  "_links": {
    "self": "/api/v1/activities/uuid",
    "project": "/api/v1/projects/uuid",
    "calculations": "/api/v1/activities/uuid/calculations"
  }
}
```

#### 2.3.3 Project Management API

**Base URL:** `/api/v1/projects`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | List projects | Yes |
| `/` | POST | Create project | Yes |
| `/{id}` | GET | Get project | Yes |
| `/{id}` | PUT | Update project | Yes |
| `/{id}` | DELETE | Delete project | Yes |
| `/{id}/activities` | GET | Get project activities | Yes |
| `/{id}/activities` | POST | Create activity | Yes |
| `/{id}/credits` | GET | Get project credits | Yes |
| `/{id}/batches` | GET | Get project batches | Yes |
| `/{id}/documents` | GET | Get project documents | Yes |
| `/{id}/verifications` | GET | Get project verifications | Yes |
| `/{id}/submit` | POST | Submit for validation | Yes |
| `/{id}/stats` | GET | Get project statistics | Yes |

**GET /api/v1/projects/{id}**

Response:
```json
{
  "project_id": "uuid",
  "project_code": "PROJ-2024-001",
  "organization_id": "uuid",
  "name": "Amazon Reforestation Initiative",
  "description": "Large-scale reforestation project in the Amazon basin",
  "project_family": "NATURE_BASED",
  "project_type": "ARR",
  "status": "ACTIVE",
  "location": {
    "country_code": "BR",
    "region": "Amazonas",
    "latitude": -3.4653,
    "longitude": -62.2159,
    "area_hectares": 10000.0
  },
  "timeline": {
    "start_date": "2020-01-01",
    "end_date": "2050-12-31",
    "crediting_period_start": "2020-01-01",
    "crediting_period_end": "2030-12-31"
  },
  "credits": {
    "total_issued": 50000.0,
    "total_retired": 5000.0,
    "current_balance": 45000.0
  },
  "methodology": {
    "methodology_id": "uuid",
    "methodology_code": "VM0015",
    "name": "Afforestation, Reforestation and Revegetation"
  },
  "registry": {
    "registry_id": "uuid",
    "registry_code": "VERRA",
    "external_project_id": "VCS-VCU-1523"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

#### 2.3.4 Credit Management API

**Base URL:** `/api/v1/credits`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | List credits | Yes |
| `/{id}` | GET | Get credit | Yes |
| `/{id}/history` | GET | Get credit history | Yes |
| `/inventory` | GET | Get credit inventory | Yes |
| `/inventory/summary` | GET | Get inventory summary | Yes |
| `/transfer` | POST | Transfer credits | Yes |
| `/split` | POST | Split credit | Yes |
| `/merge` | POST | Merge credits | Yes |
| `/batches` | GET | List batches | Yes |
| `/batches` | POST | Create batch | Yes |
| `/batches/{id}` | GET | Get batch | Yes |
| `/batches/{id}/issue` | POST | Issue batch | Yes |

**GET /api/v1/credits/inventory**

Query Parameters:
- `organization_id` (optional): Filter by organization
- `vintage_year` (optional): Filter by vintage
- `registry_id` (optional): Filter by registry
- `project_id` (optional): Filter by project
- `status` (optional): Filter by status

Response:
```json
{
  "inventory": [
    {
      "credit_id": "uuid",
      "serial_number": "VCS-VCU-1523-20150101-20151231-1",
      "project": {
        "project_id": "uuid",
        "name": "Amazon Reforestation Initiative"
      },
      "vintage_year": 2015,
      "credit_type": "VCU",
      "quantity": 1000.0,
      "status": "AVAILABLE",
      "registry": {
        "registry_id": "uuid",
        "registry_code": "VERRA"
      },
      "issuance_date": "2016-03-15",
      "co_benefits": ["SDG13", "SDG15"]
    }
  ],
  "summary": {
    "total_credits": 45000.0,
    "by_vintage": {
      "2015": 10000.0,
      "2016": 15000.0,
      "2017": 20000.0
    },
    "by_registry": {
      "VERRA": 30000.0,
      "GOLD_STANDARD": 15000.0
    },
    "by_status": {
      "AVAILABLE": 40000.0,
      "RESERVED": 5000.0
    }
  },
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total_items": 45,
    "total_pages": 1
  }
}
```

#### 2.3.5 Retirement API

**Base URL:** `/api/v1/retirements`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | List retirements | Yes |
| `/` | POST | Create retirement | Yes |
| `/{id}` | GET | Get retirement | Yes |
| `/{id}` | PUT | Update retirement | Yes |
| `/{id}/cancel` | POST | Cancel retirement | Yes |
| `/{id}/execute` | POST | Execute retirement | Yes |
| `/{id}/certificate` | GET | Get certificate | Yes |
| `/{id}/status` | GET | Get retirement status | Yes |
| `/beneficiaries` | GET | List beneficiaries | Yes |
| `/beneficiaries` | POST | Create beneficiary | Yes |
| `/preview` | POST | Preview retirement | Yes |

**POST /api/v1/retirements/**

Request:
```json
{
  "organization_id": "uuid",
  "beneficiary_id": "uuid",
  "retirement_type": "VOLUNTARY",
  "retirement_reason": "OFFSET_EMISSIONS",
  "retirement_use_case": "2024 Corporate Carbon Neutrality",
  "retirement_date": "2024-12-31",
  "credits": [
    {
      "credit_id": "uuid",
      "quantity": 500.0
    },
    {
      "credit_id": "uuid",
      "quantity": 500.0
    }
  ],
  "emissions_claim": {
    "period_start": "2024-01-01",
    "period_end": "2024-12-31",
    "scope_1_emissions": 300.0,
    "scope_2_emissions": 400.0,
    "scope_3_emissions": 300.0
  },
  "beneficiary_statement": "This retirement represents Company XYZ's commitment to carbon neutrality for FY2024.",
  "private_note": "Internal tracking reference: CN-2024-001",
  "notify_beneficiary": true
}
```

Response:
```json
{
  "retirement_id": "uuid",
  "retirement_code": "RET-2024-001",
  "organization_id": "uuid",
  "beneficiary_id": "uuid",
  "status": "PENDING",
  "retirement_type": "VOLUNTARY",
  "retirement_reason": "OFFSET_EMISSIONS",
  "total_credits": 1000.0,
  "credits": [
    {
      "retirement_credit_id": "uuid",
      "credit_id": "uuid",
      "serial_number": "VCS-VCU-1523-20150101-20151231-1",
      "quantity": 500.0,
      "project_name": "Amazon Reforestation Initiative",
      "vintage_year": 2015,
      "retirement_status": "PENDING"
    }
  ],
  "estimated_completion": "2024-01-15T12:00:00Z",
  "created_at": "2024-01-15T10:00:00Z",
  "_links": {
    "self": "/api/v1/retirements/uuid",
    "status": "/api/v1/retirements/uuid/status",
    "execute": "/api/v1/retirements/uuid/execute",
    "cancel": "/api/v1/retirements/uuid/cancel"
  }
}
```

#### 2.3.6 User Management API

**Base URL:** `/api/v1/users`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | List users | Yes (Admin) |
| `/` | POST | Create user | Yes (Admin) |
| `/{id}` | GET | Get user | Yes |
| `/{id}` | PUT | Update user | Yes |
| `/{id}` | DELETE | Delete user | Yes (Admin) |
| `/{id}/roles` | GET | Get user roles | Yes |
| `/{id}/roles` | POST | Assign role | Yes (Admin) |
| `/{id}/roles/{roleId}` | DELETE | Remove role | Yes (Admin) |
| `/me` | GET | Get current user | Yes |
| `/me` | PUT | Update current user | Yes |
| `/me/password` | PUT | Change password | Yes |
| `/me/sessions` | GET | Get active sessions | Yes |
| `/me/sessions/{id}` | DELETE | Revoke session | Yes |

#### 2.3.7 Reporting API

**Base URL:** `/api/v1/reports`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | List reports | Yes |
| `/` | POST | Create report | Yes |
| `/{id}` | GET | Get report | Yes |
| `/{id}/download` | GET | Download report | Yes |
| `/inventory` | GET | Inventory report | Yes |
| `/retirements` | GET | Retirement report | Yes |
| `/issuances` | GET | Issuance report | Yes |
| `/projects` | GET | Project report | Yes |
| `/custom` | POST | Custom report | Yes |

### 2.4 External Registry APIs

#### 2.4.1 Verra Registry API Integration

**Adapter Service:** `/api/v1/registry/verra`

**Verra API Endpoints (External):**

| Verra Endpoint | Method | Purpose |
|----------------|--------|---------|
| `/v1/projects` | GET | List projects |
| `/v1/projects/{id}` | GET | Get project details |
| `/v1/vcus` | GET | List VCUs |
| `/v1/vcus/{serial}` | GET | Get VCU details |
| `/v1/retirements` | POST | Execute retirement |
| `/v1/retirements/{id}` | GET | Get retirement status |
| `/v1/accounts/{id}/inventory` | GET | Get account inventory |

**Internal Adapter Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sync/projects` | POST | Sync projects from Verra |
| `/sync/vcus` | POST | Sync VCUs from Verra |
| `/sync/inventory` | POST | Sync inventory |
| `/retirements` | POST | Execute Verra retirement |
| `/retirements/{id}/status` | GET | Get retirement status |
| `/webhooks/verra` | POST | Verra webhook handler |

**Verra Retirement Request:**

```json
{
  "serial_numbers": [
    "VCS-VCU-1523-20150101-20151231-1"
  ],
  "quantity": 1000.0,
  "retirement_reason": "VOLUNTARY",
  "retirement_details": {
    "beneficiary_name": "Company XYZ",
    "beneficiary_address": "123 Green Street, Eco City",
    "beneficiary_contact": "sustainability@companyxyz.com",
    "retirement_reason_detail": "Carbon neutrality commitment FY2024"
  },
  "external_reference": "RET-2024-001"
}
```

**Verra Retirement Response:**

```json
{
  "retirement_id": "VRA-2024-12345",
  "status": "PENDING",
  "serial_numbers": ["VCS-VCU-1523-20150101-20151231-1"],
  "quantity": 1000.0,
  "retirement_date": "2024-01-15",
  "certificate_url": "https://registry.verra.org/certificate/VRA-2024-12345",
  "estimated_completion": "2024-01-15T12:00:00Z"
}
```

#### 2.4.2 Gold Standard API Integration

**Adapter Service:** `/api/v1/registry/gold-standard`

**Gold Standard API Endpoints (External):**

| GS Endpoint | Method | Purpose |
|-------------|--------|---------|
| `/api/projects` | GET | List projects |
| `/api/impacts` | GET | List impact certifications |
| `/api/credits` | GET | List credits |
| `/api/retirements` | POST | Execute retirement |
| `/api/accounts/{id}/holdings` | GET | Get account holdings |

**Gold Standard Retirement Request:**

```json
{
  "credit_ids": ["GS123456789"],
  "quantity": 1000.0,
  "beneficiary": {
    "name": "Company XYZ",
    "type": "ORGANIZATION",
    "statement": "Offsetting 2024 emissions"
  },
  "sdg_contributions": ["SDG13", "SDG15"],
  "external_reference": "RET-2024-001"
}
```

#### 2.4.3 Puro.earth API Integration

**Adapter Service:** `/api/v1/registry/puro`

**Puro API Endpoints (External):**

| Puro Endpoint | Method | Purpose |
|---------------|--------|---------|
| `/v1/corcs` | GET | List CORCs |
| `/v1/corcs/{id}` | GET | Get CORC details |
| `/v1/retirements` | POST | Execute retirement |
| `/v1/beneficiaries` | POST | Create beneficiary |
| `/v1/accounts/{id}/inventory` | GET | Get inventory |

**Puro Retirement Request:**

```json
{
  "corc_ids": ["CORC-2024-001"],
  "quantity": 1000.0,
  "beneficiary": {
    "name": "Company XYZ",
    "statement": "Carbon removal commitment 2024",
    "public": true
  },
  "delivery_method": "BENEFICIARY_STATEMENT",
  "external_reference": "RET-2024-001"
}
```

#### 2.4.4 Isometric Registry API Integration

**Adapter Service:** `/api/v1/registry/isometric`

**Isometric API Endpoints (External):**

| Isometric Endpoint | Method | Purpose |
|-------------------|--------|---------|
| `/v1/cdrs` | GET | List CDRs |
| `/v1/cdrs/{id}` | GET | Get CDR details |
| `/v1/retirements` | POST | Execute retirement |
| `/v1/buyers` | POST | Register buyer |
| `/v1/accounts/{id}/holdings` | GET | Get holdings |

**Isometric Retirement Request:**

```json
{
  "cdr_ids": ["CDR-2024-001"],
  "quantity": 1000.0,
  "buyer": {
    "name": "Company XYZ",
    "traceability_consent": true
  },
  "durability_preference": "PERMANENT",
  "external_reference": "RET-2024-001"
}
```

### 2.5 Webhook Specifications

#### 2.5.1 Webhook Event Types

| Event Type | Description | Payload |
|------------|-------------|---------|
| `calculation.completed` | Calculation finished | Calculation result |
| `calculation.failed` | Calculation failed | Error details |
| `credit.issued` | Credits issued | Credit details |
| `credit.transferred` | Credits transferred | Transfer details |
| `retirement.pending` | Retirement initiated | Retirement details |
| `retirement.completed` | Retirement completed | Certificate info |
| `retirement.failed` | Retirement failed | Error details |
| `verification.submitted` | Verification submitted | Verification details |
| `verification.completed` | Verification completed | Results |
| `batch.issued` | Batch issued | Batch details |
| `inventory.updated` | Inventory changed | Change details |
| `user.action` | User performed action | Action details |

#### 2.5.2 Webhook Payload Structure

```json
{
  "event_id": "uuid",
  "event_type": "retirement.completed",
  "timestamp": "2024-01-15T12:00:00Z",
  "organization_id": "uuid",
  "data": {
    "retirement_id": "uuid",
    "retirement_code": "RET-2024-001",
    "status": "COMPLETED",
    "total_credits": 1000.0,
    "certificate_url": "https://api.example.com/retirements/uuid/certificate",
    "completed_at": "2024-01-15T12:00:00Z"
  },
  "signature": "sha256=..."
}
```

#### 2.5.3 Webhook Security

- HMAC-SHA256 signature verification
- Timestamp validation (reject if > 5 minutes old)
- HTTPS only
- Retry with exponential backoff
- Dead letter queue for failed deliveries

### 2.6 Rate Limiting

| API Category | Rate Limit | Burst |
|--------------|------------|-------|
| Public APIs | 100 req/min | 150 |
| Authenticated APIs | 1000 req/min | 1500 |
| Calculation APIs | 100 req/min | 150 |
| Registry APIs | 60 req/min | 100 |
| Webhooks (incoming) | 1000 req/min | 2000 |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

### 2.7 Error Handling

**Standard Error Response:**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "issue": "Specific issue description"
    },
    "documentation_url": "https://docs.example.com/errors/ERROR_CODE",
    "trace_id": "uuid",
    "timestamp": "2024-01-15T12:00:00Z"
  }
}
```

**HTTP Status Codes:**

| Status | Code | Description |
|--------|------|-------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 202 | Accepted | Async operation started |
| 204 | No Content | Success, no body |
| 400 | Bad Request | Invalid request |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |
| 502 | Bad Gateway | Registry error |
| 503 | Service Unavailable | Maintenance |



---

## 3. SYSTEM ARCHITECTURE

### 3.1 Architecture Decision: Microservices vs Monolith

**Recommendation: Hybrid Architecture**

Given the complexity and domain boundaries of the carbon credit platform, a **hybrid approach** is recommended:

| Component | Architecture | Rationale |
|-----------|--------------|-----------|
| Core Domain Services | Microservices | Independent scaling, team autonomy |
| Calculation Engine | Microservice | Intensive compute, specialized scaling |
| Registry Adapters | Microservices | Independent release cycles |
| User Management | Microservice | Shared across all services |
| Reporting | Microservice | Read-heavy, separate scaling |
| Audit & Logging | Microservice | Centralized, compliance-critical |
| Frontend | SPA | Single unified interface |
| API Gateway | Service Mesh | Unified entry point |

### 3.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HIGH-LEVEL SYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         CLIENT LAYER                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │   Web App    │  │  Mobile App  │  │  API Clients │              │    │
│  │  │   (React)    │  │  (React Native)│  │              │              │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │    │
│  └─────────┼────────────────┼────────────────┼────────────────────────┘    │
│            │                │                │                              │
│            └────────────────┴────────────────┘                              │
│                              │                                              │
│  ┌───────────────────────────▼──────────────────────────────────────────┐   │
│  │                      API GATEWAY LAYER                                │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Kong/AWS API Gateway / Azure API Management                   │  │   │
│  │  │  - Authentication/Authorization                                │  │   │
│  │  │  - Rate Limiting                                               │  │   │
│  │  │  - Request Routing                                             │  │   │
│  │  │  - Load Balancing                                              │  │   │
│  │  │  - Caching                                                     │  │   │
│  │  │  - SSL Termination                                             │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────▼────────────────────────────────────┐   │
│  │                    SERVICE MESH (Istio/Linkerd)                       │   │
│  │  - Service Discovery                                                │   │
│  │  - Traffic Management                                               │   │
│  │  - mTLS Between Services                                            │   │
│  │  - Circuit Breaking                                                 │   │
│  │  - Observability                                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────▼────────────────────────────────────┐   │
│  │                   MICROSERVICES LAYER                                 │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Project   │  │  Activity   │  │ Calculation │  │   Credit    │  │   │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service   │  │   │
│  │  │  (Node.js)  │  │  (Node.js)  │  │  (Python)   │  │  (Node.js)  │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  │         │                │                │                │         │   │
│  │  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  │   │
│  │  │ Retirement  │  │    User     │  │  Reporting  │  │   Audit     │  │   │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service   │  │   │
│  │  │  (Node.js)  │  │  (Node.js)  │  │  (Node.js)  │  │  (Node.js)  │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  │         │                │                │                │         │   │
│  │  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────┴──────┐  │   │
│  │  │   File      │  │  Webhook    │  │ Notification│  │   Search    │  │   │
│  │  │  Service    │  │   Service   │  │   Service   │  │   Service   │  │   │
│  │  │   (Go)      │  │  (Node.js)  │  │  (Node.js)  │  │  (Go/ES)    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────▼────────────────────────────────────┐   │
│  │              REGISTRY INTEGRATION LAYER                               │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Verra     │  │    Gold     │  │    Puro     │  │  Isometric  │  │   │
│  │  │   Adapter   │  │  Standard   │  │   Adapter   │  │   Adapter   │  │   │
│  │  │  (Node.js)  │  │   Adapter   │  │  (Node.js)  │  │  (Node.js)  │  │   │
│  │  │             │  │  (Node.js)  │  │             │  │             │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────▼────────────────────────────────────┐   │
│  │                    DATA & MESSAGING LAYER                             │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  PostgreSQL │  │    Redis    │  │    Kafka    │  │Elasticsearch│  │   │
│  │  │  (Primary)  │  │   (Cache)   │  │  (Events)   │  │   (Search)  │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   MinIO/    │  │   ClickHouse│  │   MongoDB   │  │   InfluxDB  │  │   │
│  │  │    S3       │  │ (Analytics) │  │  (Documents)│  │  (Metrics)  │  │   │
│  │  │  (Files)    │  │             │  │             │  │             │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Service Boundaries & Responsibilities

#### 3.3.1 Project Service

**Responsibilities:**
- Project CRUD operations
- Project lifecycle management
- Project metadata management
- Project verification coordination
- Project statistics and analytics

**APIs:** REST, gRPC (internal)
**Database:** PostgreSQL (projects table)
**Cache:** Redis (project metadata)
**Events:** Publishes project.created, project.updated, project.status_changed

#### 3.3.2 Activity Service

**Responsibilities:**
- Activity CRUD operations
- Activity workflow management
- Activity data validation
- Activity-document associations
- Activity status transitions

**APIs:** REST, gRPC (internal)
**Database:** PostgreSQL (activities table)
**Cache:** Redis (activity data)
**Events:** Publishes activity.created, activity.submitted, activity.approved

#### 3.3.3 Calculation Service

**Responsibilities:**
- Execute carbon credit calculations
- Methodology application
- Calculation result storage
- Calculation versioning
- Batch calculations

**Technology:** Python (NumPy, Pandas, scientific computing libraries)
**APIs:** REST, gRPC (internal), Async job queue
**Database:** PostgreSQL (calculations table)
**Queue:** Redis/RabbitMQ (calculation jobs)
**Events:** Publishes calculation.started, calculation.completed, calculation.failed

**Calculation Engine Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    CALCULATION SERVICE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   REST API   │    │  gRPC API    │    │  Job Queue   │      │
│  │   (Sync)     │    │   (Sync)     │    │   (Async)    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                    │              │
│         └───────────────────┴────────────────────┘              │
│                             │                                    │
│                    ┌────────▼────────┐                          │
│                    │  Calculation    │                          │
│                    │   Orchestrator  │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│  ┌──────▼──────┐   ┌───────▼───────┐   ┌───────▼───────┐       │
│  │  Baseline   │   │    Project    │   │    Leakage    │       │
│  │  Calculator │   │   Calculator  │   │   Calculator  │       │
│  └─────────────┘   └───────────────┘   └───────────────┘       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Methodology Plugin System                   │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │    │
│  │  │  VM0015 │ │ VM0033  │ │ VM0042  │ │  GS-001 │  ...  │    │
│  │  │  (ARR)  │ │ (REDD+) │ │(Soil C) │ │(Renew)  │       │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3.4 Credit Service

**Responsibilities:**
- Credit lifecycle management
- Credit inventory tracking
- Credit transfers
- Credit splits/merges
- Batch management

**APIs:** REST, gRPC (internal)
**Database:** PostgreSQL (credits, batches tables)
**Cache:** Redis (inventory, hot credits)
**Events:** Publishes credit.issued, credit.transferred, credit.retired

#### 3.3.5 Retirement Service

**Responsibilities:**
- Retirement transaction management
- Multi-registry retirement coordination
- Beneficiary management
- Certificate generation
- Retirement reporting

**APIs:** REST, gRPC (internal)
**Database:** PostgreSQL (retirements, beneficiaries tables)
**Events:** Publishes retirement.pending, retirement.completed, retirement.failed

#### 3.3.6 User Service

**Responsibilities:**
- User authentication/authorization
- Organization management
- Role and permission management
- Session management
- User preferences

**APIs:** REST, gRPC (internal)
**Database:** PostgreSQL (users, organizations, roles tables)
**Cache:** Redis (sessions, permissions)
**Events:** Publishes user.created, user.login, user.logout

#### 3.3.7 Registry Adapter Services

**Responsibilities (per registry):**
- API authentication with registry
- Credit inventory synchronization
- Retirement execution
- Webhook handling
- Error handling and retry

**APIs:** REST (internal), External registry APIs
**Database:** PostgreSQL (registry-specific tables)
**Cache:** Redis (inventory cache)
**Events:** Publishes and consumes registry-specific events

### 3.4 Communication Patterns

#### 3.4.1 Synchronous Communication

**Use Cases:**
- User-facing read operations
- Simple CRUD operations
- Real-time validation

**Implementation:**
- REST APIs for external clients
- gRPC for internal service communication
- Timeout: 30 seconds
- Circuit breaker: 5 failures in 60 seconds

#### 3.4.2 Asynchronous Communication

**Use Cases:**
- Calculation execution
- Credit issuance
- Retirement processing
- Report generation
- Registry synchronization

**Implementation:**
- Message queue (Kafka/RabbitMQ)
- Event-driven architecture
- Sagas for distributed transactions
- Outbox pattern for data consistency

**Async Flow Example - Retirement:**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│   Retirement │────▶│    Event     │
│              │     │   Service    │     │    Bus       │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
        ┌─────────────────────────────────────────┼─────────┐
        │                                         │         │
        ▼                                         ▼         ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Verra      │     │Gold Standard │     │    Puro      │
│   Adapter    │     │   Adapter    │     │   Adapter    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 3.5 Data Flow Diagrams

#### 3.5.1 Credit Issuance Flow

```
┌─────────┐   ┌──────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────┐
│ Activity│──▶│Calculate │──▶│  Calculate  │──▶│   Credit    │──▶│  Batch  │
│  Data   │   │  Engine  │   │   Result    │   │   Service   │   │ Service │
└─────────┘   └──────────┘   └─────────────┘   └─────────────┘   └────┬────┘
                                                                       │
                                                                       ▼
┌─────────┐   ┌──────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────┐
│  Credit │◀──│  Credit  │◀──│   Credit    │◀──│   Registry  │◀──│  Issue  │
│ Issued  │   │  Record  │   │   Created   │   │   Adapter   │   │ Request │
└─────────┘   └──────────┘   └─────────────┘   └─────────────┘   └─────────┘
```

#### 3.5.2 Retirement Flow

```
┌─────────┐   ┌──────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────┐
│Retirement│──▶│ Validate │──▶│   Reserve   │──▶│   Execute   │──▶│ Registry│
│ Request │   │  Credits │   │   Credits   │   │  Retirement │   │  APIs   │
└─────────┘   └──────────┘   └─────────────┘   └─────────────┘   └────┬────┘
                                                                       │
                                                                       ▼
┌─────────┐   ┌──────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────┐
│Complete │◀──│ Generate │◀──│   Confirm   │◀──│   Process   │◀──│ Registry│
│         │   │Certificate│  │   Retirement│   │   Response  │   │ Response│
└─────────┘   └──────────┘   └─────────────┘   └─────────────┘   └─────────┘
```

#### 3.5.3 Calculation Flow

```
┌─────────┐   ┌──────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────┐
│ Activity│──▶│ Validate │──▶│   Load      │──▶│   Execute   │──▶│  Store  │
│  Data   │   │  Inputs  │   │ Methodology │   │ Calculation │   │ Result  │
└─────────┘   └──────────┘   └─────────────┘   └─────────────┘   └────┬────┘
                                                                       │
                                                                       ▼
┌─────────┐   ┌──────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────┐
│ Notify  │◀──│  Publish │◀──│   Validate  │◀──│   Apply     │◀──│ Calculate│
│ Client  │   │  Event   │   │   Result    │   │ Uncertainty │   │  Totals │
└─────────┘   └──────────┘   └─────────────┘   └─────────────┘   └─────────┘
```

### 3.6 Component Architecture Details

#### 3.6.1 Frontend Architecture

**Technology:** React 18+ with TypeScript

**Architecture Pattern:** Feature-based modular architecture

```
src/
├── components/          # Shared UI components
│   ├── common/         # Buttons, inputs, modals
│   ├── data-display/   # Tables, charts, cards
│   └── layout/         # Navigation, headers, footers
├── features/           # Feature modules
│   ├── projects/       # Project management
│   ├── activities/     # Activity management
│   ├── calculations/   # Calculation workflows
│   ├── credits/        # Credit management
│   ├── retirements/    # Retirement workflows
│   └── reporting/      # Reports and analytics
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── store/              # State management (Zustand/Redux)
├── utils/              # Utility functions
└── types/              # TypeScript type definitions
```

**State Management:**
- Server state: React Query/TanStack Query
- Client state: Zustand
- Form state: React Hook Form

#### 3.6.2 API Gateway Configuration

**Kong/AWS API Gateway Configuration:**

```yaml
services:
  - name: project-service
    url: http://project-service:8080
    routes:
      - name: project-routes
        paths:
          - /api/v1/projects
    plugins:
      - name: rate-limiting
        config:
          minute: 1000
      - name: jwt
        config:
          uri_param_names: []
          cookie_names: []
      - name: cors
        config:
          origins:
            - "https://app.example.com"
```

#### 3.6.3 Database Architecture

**Primary Database:** PostgreSQL 15+

**Read Replicas:**
- 2 read replicas for reporting queries
- 1 read replica for analytics

**Connection Pooling:** PgBouncer
- Max connections: 1000
- Pool mode: transaction

**Sharding Strategy:**
- Shard by organization_id for multi-tenant tables
- 16 shards for horizontal scaling

#### 3.6.4 Cache Architecture

**Redis Cluster:**
- 3 master nodes
- 3 replica nodes
- Max memory: 16GB per node

**Cache Strategies:**

| Data Type | TTL | Strategy |
|-----------|-----|----------|
| User sessions | 24 hours | Write-through |
| Project metadata | 1 hour | Cache-aside |
| Credit inventory | 5 minutes | Write-through |
| Calculation results | 1 hour | Cache-aside |
| API responses | 5 minutes | Cache-aside |

#### 3.6.5 Message Queue Architecture

**Kafka Cluster:**
- 3 brokers
- Replication factor: 3
- Min ISR: 2

**Topic Structure:**

| Topic | Partitions | Retention |
|-------|------------|-----------|
| calculations | 12 | 7 days |
| retirements | 12 | 30 days |
| credits | 12 | 30 days |
| activities | 6 | 7 days |
| projects | 6 | 7 days |
| notifications | 6 | 1 day |
| audit-events | 24 | 90 days |

#### 3.6.6 File Storage Architecture

**MinIO/S3 Configuration:**
- Buckets: documents, exports, certificates, temp
- Encryption: AES-256
- Versioning: Enabled for documents
- Lifecycle: Temp files deleted after 7 days

**Document Storage Structure:**
```
/documents/
  /{organization_id}/
    /projects/
      /{project_id}/
        /{document_id}/{version}/{filename}
    /activities/
      /{activity_id}/
        /{document_id}/{version}/{filename}
    /verifications/
      /{verification_id}/
        /{document_id}/{version}/{filename}
```



---

## 4. INTEGRATION PATTERNS

### 4.1 Registry Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REGISTRY INTEGRATION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    PLATFORM CORE SERVICES                            │    │
│  │                                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│    │
│  │  │   Credit    │  │  Retirement │  │   Project   │  │   Batch     ││    │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service   ││    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘│    │
│  │         │                │                │                │       │    │
│  │         └────────────────┴────────────────┴────────────────┘       │    │
│  │                                   │                                 │    │
│  │                    ┌──────────────▼──────────────┐                 │    │
│  │                    │   Registry Integration Hub  │                 │    │
│  │                    │                             │                 │    │
│  │                    │  - Unified Credit Interface │                 │    │
│  │                    │  - Unified Retirement API   │                 │    │
│  │                    │  - Inventory Sync Manager   │                 │    │
│  │                    │  - Error Handling & Retry   │                 │    │
│  │                    └──────────────┬──────────────┘                 │    │
│  └───────────────────────────────────┼────────────────────────────────┘    │
│                                      │                                      │
│  ┌───────────────────────────────────▼────────────────────────────────┐    │
│  │                    REGISTRY ADAPTER LAYER                           │    │
│  │                                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│    │
│  │  │   Verra     │  │    Gold     │  │    Puro     │  │  Isometric  ││    │
│  │  │   Adapter   │  │  Standard   │  │   Adapter   │  │   Adapter   ││    │
│  │  │             │  │   Adapter   │  │             │  │             ││    │
│  │  │ - VCS API   │  │ - GS API    │  │ - CORC API  │  │ - CDR API   ││    │
│  │  │ - Serial Mgr│  │ - SDG Link  │  │ - Statement │  │ - Buyer Tr  ││    │
│  │  │ - Vintage Tr│  │ - Impact Tr │  │ - Delivery  │  │ - Durability││    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘│    │
│  │         │                │                │                │       │    │
│  └─────────┼────────────────┼────────────────┼────────────────┼───────┘    │
│            │                │                │                │            │
│  ┌─────────▼────────────────▼────────────────▼────────────────▼─────────┐  │
│  │                    EXTERNAL REGISTRY APIs                             │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ Verra VCS   │  │Gold Standard│  │ Puro.earth  │  │  Isometric  │  │  │
│  │  │  Registry   │  │   Impact    │  │   Registry  │  │   Registry  │  │  │
│  │  │             │  │  Registry   │  │             │  │             │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Synchronization Patterns

#### 4.2.1 Real-Time vs Batch Synchronization

| Aspect | Real-Time Sync | Batch Sync |
|--------|----------------|------------|
| **Use Cases** | Retirement execution, credit transfers | Inventory updates, historical data |
| **Latency** | < 5 seconds | Minutes to hours |
| **Consistency** | Strong consistency | Eventual consistency |
| **Complexity** | High (error handling) | Medium |
| **Registry APIs** | Verra, Gold Standard | All registries |
| **Implementation** | Webhooks + Polling | Scheduled jobs |

#### 4.2.2 Credit Inventory Synchronization

**Sync Strategy by Registry:**

| Registry | Sync Method | Frequency | Scope |
|----------|-------------|-----------|-------|
| Verra | Webhook + Polling | Real-time + 5 min | Account inventory |
| Gold Standard | Polling | 15 minutes | Account holdings |
| Puro.earth | Webhook + Polling | Real-time + 10 min | CORC inventory |
| Isometric | API + Polling | 10 minutes | CDR inventory |
| OTC | Manual/Scheduled | On-demand | Multi-registry |

**Inventory Sync Flow:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Trigger   │────▶│   Fetch     │────▶│   Compare   │────▶│   Update    │
│  (Schedule/ │     │   Registry  │     │   Deltas    │     │   Platform  │
│   Webhook)  │     │   Inventory │     │             │     │   Inventory │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Notify    │◀────│   Publish   │◀────│   Log       │◀────│   Store     │
│   Clients   │     │   Event     │     │   Changes   │     │   Changes   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 4.3 Retirement Transaction Flow

#### 4.3.1 Single Registry Retirement

```
┌─────────┐    ┌──────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐
│  User   │───▶│ Retirement│───▶│   Validate  │───▶│   Reserve   │───▶│  Credit │
│ Request │    │  Service  │    │   Request   │    │   Credits   │    │ Service │
└─────────┘    └──────────┘    └─────────────┘    └─────────────┘    └────┬────┘
                                                                           │
┌─────────┐    ┌──────────┐    ┌─────────────┐    ┌─────────────┐         │
│  User   │◀───│  Notify  │◀───│   Process   │◀───│   Execute   │◀────────┘
│         │    │  Result  │    │   Response  │    │  Retirement │
└─────────┘    └──────────┘    └─────────────┘    └──────┬──────┘
                                                         │
                              ┌──────────────────────────┘
                              │
┌─────────┐    ┌──────────┐   │  ┌─────────────┐    ┌─────────────┐
│Registry │◀───│  Adapter │◀──┘  │   Submit    │    │   Registry  │
│         │    │          │      │  Retirement │───▶│     API     │
└─────────┘    └──────────┘      └─────────────┘    └─────────────┘
```

#### 4.3.2 Multi-Registry Retirement (OTC)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-REGISTRY RETIREMENT FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐                                                                 │
│  │  User   │────┐                                                            │
│  │ Request │    │                                                            │
│  └─────────┘    │                                                            │
│                 ▼                                                            │
│  ┌─────────────────────────────────────────┐                                 │
│  │         Retirement Service              │                                 │
│  │  - Parse multi-registry request         │                                 │
│  │  - Group credits by registry            │                                 │
│  │  - Create sub-retirements               │                                 │
│  │  - Coordinate execution                 │                                 │
│  └──────────────────┬──────────────────────┘                                 │
│                     │                                                        │
│         ┌───────────┼───────────┐                                            │
│         │           │           │                                            │
│         ▼           ▼           ▼                                            │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                                  │
│  │  Verra    │ │   Gold    │ │   Puro    │                                  │
│  │Retirement │ │Retirement │ │Retirement │                                  │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘                                  │
│        │             │             │                                         │
│        ▼             ▼             ▼                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                                  │
│  │   Verra   │ │   Gold    │ │   Puro    │                                  │
│  │  Adapter  │ │  Adapter  │ │  Adapter  │                                  │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘                                  │
│        │             │             │                                         │
│        └─────────────┴─────────────┘                                         │
│                      │                                                       │
│                      ▼                                                       │
│  ┌─────────────────────────────────────────┐                                 │
│  │         Saga Orchestrator               │                                 │
│  │  - Monitor all sub-retirements          │                                 │
│  │  - Handle partial failures              │                                 │
│  │  - Compensating transactions            │                                 │
│  │  - Aggregate results                    │                                 │
│  └──────────────────┬──────────────────────┘                                 │
│                     │                                                        │
│                     ▼                                                        │
│  ┌─────────────────────────────────────────┐                                 │
│  │         Final Result                    │                                 │
│  │  - Combined certificate                 │                                 │
│  │  - Unified retirement record            │                                 │
│  │  - Multi-registry metadata              │                                 │
│  └─────────────────────────────────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Error Handling and Retry Logic

#### 4.4.1 Retry Strategy

| Error Type | Retry Count | Backoff Strategy | Action |
|------------|-------------|------------------|--------|
| Network timeout | 5 | Exponential (1s, 2s, 4s, 8s, 16s) | Continue |
| Rate limit (429) | 10 | Exponential + jitter | Continue |
| Server error (5xx) | 3 | Linear (5s) | Alert + Continue |
| Auth error (401) | 1 | None | Refresh token + Retry |
| Validation error (400) | 0 | None | Fail immediately |
| Not found (404) | 0 | None | Fail immediately |

#### 4.4.2 Circuit Breaker Configuration

```yaml
circuit_breaker:
  failure_threshold: 5
  success_threshold: 3
  timeout: 60s
  half_open_max_calls: 3
  
  states:
    closed:
      - Normal operation
      - Count failures
    
    open:
      - Reject requests immediately
      - Return cached response or error
      - Wait for timeout
    
    half_open:
      - Allow limited requests
      - Test if service recovered
      - Transition to closed or open
```

#### 4.4.3 Dead Letter Queue

**Configuration:**
- Max retries: 5
- DLQ retention: 30 days
- Alert on: 10 messages in DLQ
- Manual intervention required for: Retirement failures

**DLQ Message Structure:**
```json
{
  "original_message": { ... },
  "error": {
    "code": "REGISTRY_ERROR",
    "message": "Verra API returned 500",
    "stack_trace": "..."
  },
  "retry_count": 5,
  "first_failure": "2024-01-15T10:00:00Z",
  "last_failure": "2024-01-15T10:30:00Z",
  "registry": "VERRA",
  "operation": "retirement",
  "manual_intervention_required": true
}
```

### 4.5 Idempotency Requirements

#### 4.5.1 Idempotency Key Pattern

All mutation operations must support idempotency:

```
Idempotency-Key: {uuid}
```

**Idempotency Key Storage:**
- Storage: Redis
- TTL: 24 hours
- Key format: `idempotency:{key}`

**Idempotency Behavior:**

| Scenario | Action |
|----------|--------|
| First request | Execute operation, store response |
| Same key, in-progress | Return 409 Conflict |
| Same key, completed | Return cached response |
| Same key, different payload | Return 422 Unprocessable |

#### 4.5.2 Registry-Specific Idempotency

| Registry | Idempotency Support | Implementation |
|----------|---------------------|----------------|
| Verra | Yes | External reference field |
| Gold Standard | Yes | Client reference field |
| Puro.earth | Yes | External reference field |
| Isometric | Yes | Client order ID |

### 4.6 Third-Party Integrations

#### 4.6.1 Identity Provider Integration

**Supported Providers:**
- Auth0
- Okta
- Azure AD
- Google Workspace
- Custom OIDC

**Integration Pattern:**
```
┌─────────┐    ┌──────────┐    ┌─────────────┐    ┌─────────────┐
│  User   │───▶│  Login   │───▶│    IDP      │───▶│   Token     │
│         │    │  Request │    │  (Auth0)    │    │   Exchange  │
└─────────┘    └──────────┘    └─────────────┘    └──────┬──────┘
                                                         │
┌─────────┐    ┌──────────┐    ┌─────────────┐          │
│  User   │◀───│  Token   │◀───│   Platform  │◀─────────┘
│         │    │  Response│    │   Session   │
└─────────┘    └──────────┘    └─────────────┘
```

#### 4.6.2 Payment Processor Integration

**Supported Processors:**
- Stripe
- PayPal
- Bank transfer (manual)

**Integration Points:**
- Credit purchase
- Retirement fees
- Subscription billing
- Invoice generation

#### 4.6.3 Document Storage Integration

**Providers:**
- AWS S3 (primary)
- Azure Blob (backup)
- MinIO (on-premise option)

**Features:**
- Automatic virus scanning
- Content type validation
- Size limits (100MB max)
- Encryption at rest
- Versioning
- Lifecycle policies

#### 4.6.4 Notification Services

**Channels:**
- Email (SendGrid/AWS SES)
- SMS (Twilio)
- Push notifications (Firebase)
- In-app notifications (WebSocket)

**Notification Types:**

| Event | Channels | Priority |
|-------|----------|----------|
| Calculation completed | Email, In-app | Normal |
| Credit issued | Email, In-app | Normal |
| Retirement completed | Email, In-app, SMS | High |
| Retirement failed | Email, SMS | Critical |
| Verification required | Email, In-app | High |
| Security alert | Email, SMS | Critical |

#### 4.6.5 Monitoring and Logging

**Monitoring Stack:**
- Metrics: Prometheus + Grafana
- Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
- Tracing: Jaeger/Zipkin
- APM: Datadog/New Relic (optional)

**Key Metrics:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API response time (p95) | < 500ms | > 1s |
| API error rate | < 0.1% | > 1% |
| Calculation throughput | > 100/hour | < 50/hour |
| Retirement success rate | > 99% | < 95% |
| Registry sync latency | < 5 min | > 15 min |
| Database connections | < 80% | > 90% |



---

## 5. SECURITY REQUIREMENTS

### 5.1 Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SECURITY ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         PERIMETER SECURITY                           │    │
│  │                                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│    │
│  │  │    WAF      │  │   DDoS      │  │   Rate      │  │   Bot       ││    │
│  │  │  (AWS/Cloud │  │  Protection │  │  Limiting   │  │  Protection ││    │
│  │  │  flare)     │  │             │  │             │  │             ││    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│  ┌───────────────────────────────────▼──────────────────────────────────┐   │
│  │                      ACCESS CONTROL LAYER                             │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │    MFA      │  │   OAuth2    │  │    RBAC     │  │   API Key   │  │   │
│  │  │             │  │  /OIDC      │  │             │  │   Mgmt      │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│  ┌───────────────────────────────────▼──────────────────────────────────┐   │
│  │                      DATA SECURITY LAYER                              │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  TLS 1.3    │  │   AES-256   │  │   Field-    │  │   Token     │  │   │
│  │  │   Transit   │  │   At Rest   │  │   Level     │  │   Vault     │  │   │
│  │  │             │  │             │  │ Encryption  │  │  (Hashi)    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│  ┌───────────────────────────────────▼──────────────────────────────────┐   │
│  │                    AUDIT & MONITORING LAYER                           │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Audit     │  │   SIEM      │  │  Intrusion  │  │  Vuln       │  │   │
│  │  │   Logging   │  │  (Splunk)   │  │  Detection  │  │  Scanning   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Authentication & Authorization

#### 5.2.1 OAuth 2.0 / OpenID Connect Implementation

**Identity Provider Flow:**

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌─────────────┐
│  User   │────▶│  Client  │────▶│  Auth       │────▶│  Identity   │
│         │     │   App    │     │  Server     │     │  Provider   │
└─────────┘     └──────────┘     └─────────────┘     └──────┬──────┘
                                                            │
┌─────────┐     ┌──────────┐     ┌─────────────┐           │
│  User   │◀────│  Token   │◀────│   Token     │◀──────────┘
│         │     │ Response │     │   Exchange  │
└─────────┘     └──────────┘     └─────────────┘
```

**OAuth 2.0 Grant Types Supported:**
- Authorization Code (with PKCE)
- Client Credentials (service-to-service)
- Refresh Token

**OIDC Configuration:**
```json
{
  "issuer": "https://auth.carbonengine.io",
  "authorization_endpoint": "https://auth.carbonengine.io/oauth/authorize",
  "token_endpoint": "https://auth.carbonengine.io/oauth/token",
  "userinfo_endpoint": "https://auth.carbonengine.io/oauth/userinfo",
  "jwks_uri": "https://auth.carbonengine.io/.well-known/jwks.json",
  "scopes_supported": ["openid", "profile", "email", "carbon:read", "carbon:write"],
  "response_types_supported": ["code", "token", "id_token"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"]
}
```

#### 5.2.2 JWT Token Management

**Access Token Structure:**
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-1"
  },
  "payload": {
    "iss": "https://auth.carbonengine.io",
    "sub": "user-uuid",
    "aud": "carbon-engine-api",
    "exp": 1640995200,
    "iat": 1640994300,
    "jti": "unique-token-id",
    "org_id": "organization-uuid",
    "roles": ["project_manager", "credit_officer"],
    "permissions": [
      "read:projects",
      "write:projects",
      "read:credits",
      "execute:retirements"
    ],
    "mfa_verified": true,
    "auth_time": 1640994000
  }
}
```

**Token Lifetimes:**
| Token Type | Lifetime | Refreshable |
|------------|----------|-------------|
| Access Token | 15 minutes | No |
| ID Token | 15 minutes | No |
| Refresh Token | 7 days | Yes (single use) |
| Session Token | 24 hours | Yes |

**Token Security:**
- RS256 signing (asymmetric)
- Key rotation: 90 days
- Secure storage: HttpOnly cookies or secure storage
- Binding: Device fingerprint validation

#### 5.2.3 Role-Based Access Control (RBAC)

**Role Hierarchy:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROLE HIERARCHY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                 │
│  │  Platform   │  - Full system access                           │
│  │   Admin     │  - User/Org management                          │
│  │             │  - System configuration                         │
│  └──────┬──────┘                                                 │
│         │                                                        │
│  ┌──────┴──────┐                                                 │
│  │  Org Admin  │  - Organization management                      │
│  │             │  - User management within org                   │
│  │             │  - Billing access                               │
│  └──────┬──────┘                                                 │
│         │                                                        │
│  ┌──────┴──────┐                                                 │
│  │  Project    │  - Project CRUD                                 │
│  │   Manager   │  - Activity management                          │
│  │             │  - Calculation execution                        │
│  └──────┬──────┘                                                 │
│         │                                                        │
│  ┌──────┴──────┐                                                 │
│  │   Credit    │  - Credit inventory view                        │
│  │   Officer   │  - Transfer credits                             │
│  │             │  - Execute retirements                          │
│  └──────┬──────┘                                                 │
│         │                                                        │
│  ┌──────┴──────┐                                                 │
│  │   Viewer    │  - Read-only access                             │
│  │             │  - Reports and dashboards                       │
│  └─────────────┘                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Permission Matrix:**

| Permission | Platform Admin | Org Admin | Project Manager | Credit Officer | Viewer |
|------------|----------------|-----------|-----------------|----------------|--------|
| read:projects | ✓ | ✓ | ✓ | ✓ | ✓ |
| write:projects | ✓ | ✓ | ✓ | ✗ | ✗ |
| delete:projects | ✓ | ✓ | ✗ | ✗ | ✗ |
| read:activities | ✓ | ✓ | ✓ | ✓ | ✓ |
| write:activities | ✓ | ✓ | ✓ | ✗ | ✗ |
| execute:calculations | ✓ | ✓ | ✓ | ✗ | ✗ |
| read:credits | ✓ | ✓ | ✓ | ✓ | ✓ |
| write:credits | ✓ | ✓ | ✗ | ✓ | ✗ |
| execute:retirements | ✓ | ✓ | ✗ | ✓ | ✗ |
| read:retirements | ✓ | ✓ | ✓ | ✓ | ✓ |
| admin:users | ✓ | ✓ | ✗ | ✗ | ✗ |
| admin:orgs | ✓ | ✗ | ✗ | ✗ | ✗ |
| admin:system | ✓ | ✗ | ✗ | ✗ | ✗ |

#### 5.2.4 Multi-Factor Authentication (MFA)

**MFA Methods Supported:**
- TOTP (Google Authenticator, Authy)
- SMS OTP
- Hardware security keys (WebAuthn/FIDO2)
- Push notifications

**MFA Requirements:**

| User Role | MFA Required | Methods Allowed |
|-----------|--------------|-----------------|
| Platform Admin | Required | TOTP + Hardware Key |
| Org Admin | Required | TOTP or Hardware Key |
| Project Manager | Optional | Any |
| Credit Officer | Required | TOTP or SMS |
| Viewer | Optional | Any |

**MFA Enforcement:**
- Enforced at organization level
- Grace period: 7 days for setup
- Backup codes: 10 generated at setup
- Recovery process: Email + identity verification

#### 5.2.5 API Key Management

**API Key Types:**

| Type | Use Case | Permissions | Rotation |
|------|----------|-------------|----------|
| Service | Service-to-service | Scoped to service | 90 days |
| Integration | External integrations | Scoped to integration | 180 days |
| Reporting | Read-only reports | Read-only | 365 days |

**API Key Format:**
```
ce_live_{32_char_random}_{8_char_checksum}
```

**API Key Security:**
- Stored as bcrypt hash
- Only displayed once on creation
- Rate limited per key
- IP allowlist optional
- Audit all usage

### 5.3 Data Security

#### 5.3.1 Encryption in Transit

**TLS Configuration:**
- Minimum version: TLS 1.2
- Preferred version: TLS 1.3
- Cipher suites:
  - TLS_AES_256_GCM_SHA384
  - TLS_CHACHA20_POLY1305_SHA256
  - TLS_AES_128_GCM_SHA256
- HSTS enabled
- Certificate pinning for mobile apps

**Service-to-Service Communication:**
- mTLS required between services
- Service mesh (Istio) manages certificates
- Certificate validity: 24 hours
- Automatic rotation

#### 5.3.2 Encryption at Rest

**Database Encryption:**
- PostgreSQL: Transparent Data Encryption (TDE)
- Field-level encryption for PII
- Encryption keys managed by HashiCorp Vault

**File Storage Encryption:**
- S3: SSE-S3 or SSE-KMS
- Azure Blob: Microsoft-managed or customer-managed keys
- MinIO: AES-256-GCM

**Backup Encryption:**
- All backups encrypted
- Separate encryption keys from production
- Backup keys stored in separate vault

#### 5.3.3 Field-Level Encryption

**Encrypted Fields:**

| Entity | Fields | Encryption |
|--------|--------|------------|
| User | password_hash, mfa_secret | bcrypt, AES-256 |
| Organization | tax_id, registration_number | AES-256 |
| Registry | auth_config, webhook_secret | AES-256 |
| Document | storage_path (if sensitive) | AES-256 |
| Audit Log | request_body (PII fields) | AES-256 |

**Key Management:**
- Master key in HashiCorp Vault
- Data encryption keys (DEKs) rotated every 90 days
- Key encryption keys (KEKs) rotated every year

#### 5.3.4 PII Handling and Data Privacy

**PII Classification:**

| Category | Examples | Handling |
|----------|----------|----------|
| Sensitive | SSN, Tax ID, Financial data | Encrypt, access log, 2-year retention |
| Personal | Name, Email, Phone | Encrypt, consent required, 5-year retention |
| Business | Company name, Registration | Access log, 7-year retention |
| Public | Project name, Credit serials | No special handling |

**Data Minimization:**
- Collect only necessary data
- Anonymize where possible
- Pseudonymize analytics data

**Consent Management:**
- Explicit consent for data processing
- Granular consent options
- Consent withdrawal mechanism
- Consent audit trail

### 5.4 Audit Logging

#### 5.4.1 Audit Log Requirements

**Events to Log:**

| Category | Events | Retention |
|----------|--------|-----------|
| Authentication | login, logout, failed_login, mfa_challenge | 7 years |
| Authorization | permission_denied, role_changed | 7 years |
| Data Access | read, write, delete (sensitive data) | 7 years |
| Credit Operations | issue, transfer, retire, split | 10 years |
| Calculation | execute, validate, approve | 10 years |
| System | config_change, backup, restore | 3 years |

**Audit Log Format:**
```json
{
  "audit_id": "uuid",
  "timestamp": "2024-01-15T12:00:00Z",
  "event_type": "credit.retired",
  "severity": "INFO",
  "actor": {
    "user_id": "uuid",
    "email": "user@example.com",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "session_id": "sess-uuid"
  },
  "target": {
    "entity_type": "credit",
    "entity_id": "uuid",
    "organization_id": "org-uuid"
  },
  "action": {
    "type": "RETIRE",
    "description": "Credit retired",
    "before": {
      "status": "AVAILABLE",
      "quantity": 1000.0
    },
    "after": {
      "status": "RETIRED",
      "quantity": 0.0,
      "retirement_id": "ret-uuid"
    }
  },
  "context": {
    "request_id": "req-uuid",
    "api_endpoint": "/api/v1/retirements",
    "registry": "VERRA"
  },
  "compliance": {
    "retention_until": "2034-01-15",
    "data_classification": "BUSINESS_CRITICAL"
  }
}
```

#### 5.4.2 Audit Log Storage

**Storage Architecture:**
- Hot storage: Elasticsearch (30 days)
- Warm storage: S3 (1 year)
- Cold storage: Glacier (7+ years)

**Integrity Protection:**
- Cryptographic hashing of log entries
- Blockchain anchoring for critical events (optional)
- Tamper-evident logging

### 5.5 Secure Credential Storage

#### 5.5.1 HashiCorp Vault Integration

**Secrets Managed:**

| Secret Type | Path | Rotation |
|-------------|------|----------|
| Database credentials | database/creds/{role} | 24 hours |
| API keys | api-keys/{service} | 90 days |
| Registry credentials | registries/{registry} | 180 days |
| Encryption keys | encryption/{key-type} | 90-365 days |
| TLS certificates | certificates/{service} | 90 days |

**Vault Configuration:**
```hcl
# Database credentials
path "database/creds/app" {
  capabilities = ["read"]
}

# API keys
path "api-keys/*" {
  capabilities = ["read"]
}

# Registry credentials
path "registries/*" {
  capabilities = ["read"]
}
```

#### 5.5.2 Credential Rotation

**Automatic Rotation:**
- Database passwords: Every 24 hours
- Service API keys: Every 90 days
- Registry credentials: Every 180 days
- TLS certificates: Every 90 days

**Rotation Process:**
1. Generate new credential
2. Update consuming services
3. Grace period (old credential valid for 1 hour)
4. Revoke old credential
5. Verify all services using new credential

### 5.6 Compliance Requirements

#### 5.6.1 SOC 2 Considerations

**Trust Service Criteria:**

| Criteria | Implementation |
|----------|----------------|
| Security | All security controls above |
| Availability | 99.9% uptime SLA, redundancy |
| Processing Integrity | Audit logs, data validation |
| Confidentiality | Encryption, access controls |
| Privacy | PII handling, consent management |

**SOC 2 Evidence:**
- Automated compliance monitoring
- Quarterly access reviews
- Annual penetration testing
- Continuous vulnerability scanning
- Change management documentation

#### 5.6.2 GDPR Compliance

**GDPR Requirements:**

| Requirement | Implementation |
|-------------|----------------|
| Lawful basis | Consent or legitimate interest |
| Data minimization | Collect only necessary data |
| Purpose limitation | Use data only for stated purposes |
| Storage limitation | Defined retention periods |
| Accuracy | User self-service updates |
| Integrity/Confidentiality | Encryption, access controls |
| Accountability | Audit logs, documentation |

**Data Subject Rights:**

| Right | Implementation |
|-------|----------------|
| Access | Self-service data export |
| Rectification | Self-service profile editing |
| Erasure | Account deletion with 30-day grace |
| Restriction | Pause data processing |
| Portability | JSON/CSV export |
| Objection | Opt-out of non-essential processing |

#### 5.6.3 Carbon Market Regulations

**Applicable Regulations:**

| Regulation | Scope | Compliance |
|------------|-------|------------|
| Article 6 (Paris Agreement) | International transfers | Corresponding adjustment tracking |
| CORSIA | Aviation offsets | Eligibility verification |
| ICROA | Voluntary market | Code of practice adherence |
| National regulations | Jurisdiction-specific | Local compliance |

**Compliance Tracking:**
- Registry-specific requirements
- Credit eligibility verification
- Transfer restrictions
- Retirement documentation

### 5.7 Security Monitoring

#### 5.7.1 Intrusion Detection

**Detection Capabilities:**
- Failed login attempts (> 5 in 5 minutes)
- Unusual API access patterns
- Privilege escalation attempts
- Data exfiltration patterns
- Registry API anomalies

**Alerting:**
- PagerDuty integration for critical alerts
- Slack notifications for warnings
- Email digests for informational

#### 5.7.2 Vulnerability Management

**Scanning Schedule:**
- Daily: Dependency vulnerability scan
- Weekly: Container image scan
- Monthly: Infrastructure scan
- Quarterly: Penetration test

**SLA for Remediation:**

| Severity | SLA | Examples |
|----------|-----|----------|
| Critical | 24 hours | RCE, SQL injection |
| High | 7 days | XSS, auth bypass |
| Medium | 30 days | Information disclosure |
| Low | 90 days | Best practice violations |



---

## 6. PERFORMANCE & SCALABILITY

### 6.1 Performance Targets

#### 6.1.1 API Response Times

| Endpoint Category | p50 Target | p95 Target | p99 Target |
|-------------------|------------|------------|------------|
| Authentication | < 100ms | < 200ms | < 500ms |
| Project CRUD | < 200ms | < 500ms | < 1s |
| Activity CRUD | < 200ms | < 500ms | < 1s |
| Credit Inventory | < 300ms | < 800ms | < 1.5s |
| Calculation (sync) | < 2s | < 5s | < 10s |
| Calculation (async) | < 100ms | < 200ms | < 500ms |
| Retirement | < 500ms | < 1s | < 2s |
| Reports | < 1s | < 3s | < 10s |
| Search | < 200ms | < 500ms | < 1s |

#### 6.1.2 Calculation Throughput

| Metric | Target | Peak Capacity |
|--------|--------|---------------|
| Concurrent calculations | 50 | 100 |
| Calculations per hour | 500 | 1000 |
| Batch size max | 100 activities | 500 activities |
| Calculation queue depth | 1000 | 5000 |

#### 6.1.3 Concurrent User Support

| Metric | Target | Peak Capacity |
|--------|--------|---------------|
| Concurrent users | 1000 | 5000 |
| Concurrent sessions | 2000 | 10000 |
| API requests per second | 1000 | 5000 |
| Registry operations per minute | 100 | 300 |

#### 6.1.4 Data Retention Policies

| Data Type | Hot Storage | Warm Storage | Cold Storage |
|-----------|-------------|--------------|--------------|
| Audit logs | 30 days | 1 year | 7 years |
| Credit transactions | 2 years | 5 years | 10 years |
| Calculation results | 1 year | 3 years | 7 years |
| User activity | 90 days | 1 year | 3 years |
| System logs | 30 days | 90 days | 1 year |
| Documents | Always hot | - | After 5 years |

### 6.2 Scalability Patterns

#### 6.2.1 Horizontal Scaling

**Service Scaling Configuration:**

| Service | Min Replicas | Max Replicas | Scale Metric |
|---------|--------------|--------------|--------------|
| API Gateway | 2 | 10 | CPU > 70% |
| Project Service | 2 | 8 | CPU > 70% |
| Activity Service | 2 | 8 | CPU > 70% |
| Calculation Service | 2 | 20 | Queue depth > 50 |
| Credit Service | 2 | 10 | CPU > 70% |
| Retirement Service | 2 | 8 | CPU > 70% |
| User Service | 2 | 6 | CPU > 70% |
| Registry Adapters | 2 | 6 | CPU > 70% |

**Auto-scaling Configuration:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: calculation-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: calculation-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: calculation_queue_depth
      target:
        type: AverageValue
        averageValue: "50"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

#### 6.2.2 Database Sharding Strategy

**Sharding Approach:**
- Shard key: organization_id
- Number of shards: 16
- Shard mapping: Consistent hashing

**Sharded Tables:**
- projects
- activities
- calculations
- credits
- retirements
- documents
- audit_logs

**Shard Distribution:**
```
Shard 0: org_id % 16 = 0
Shard 1: org_id % 16 = 1
...
Shard 15: org_id % 16 = 15
```

**Cross-Shard Queries:**
- Aggregated reports: Fan-out to all shards
- Global search: Elasticsearch
- Cross-organization: Application-level join

#### 6.2.3 Read Replica Strategy

**Replica Configuration:**
- Primary: 1 (write + read)
- Read replicas: 3
- Async replication lag target: < 100ms

**Query Routing:**
| Query Type | Target | Routing Logic |
|------------|--------|---------------|
| Write operations | Primary | Always |
| Read by ID | Replica | Round-robin |
| List queries | Replica | Round-robin |
| Reports | Dedicated replica | Always |
| Real-time queries | Primary | Configurable |

**Replication Monitoring:**
- Lag alert threshold: 1 second
- Automatic failover: Enabled
- Promote replica on primary failure: < 30 seconds

### 6.3 Caching Strategies

#### 6.3.1 Multi-Level Cache Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MULTI-LEVEL CACHE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    L1: In-Memory Cache (Caffeine)                    │    │
│  │  - Per-service local cache                                          │    │
│  │  - TTL: 5 minutes                                                   │    │
│  │  - Max size: 10,000 entries                                         │    │
│  │  - Use case: Hot data, frequent access                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────┐   │
│  │                    L2: Distributed Cache (Redis)                     │   │
│  │  - Shared across services                                            │   │
│  │  - TTL: 1 hour (configurable per key type)                          │   │
│  │  - Max memory: 16GB per node                                        │   │
│  │  - Use case: Session data, inventory, metadata                      │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────┐   │
│  │                    L3: CDN (CloudFlare/AWS CloudFront)               │   │
│  │  - Static assets, API responses                                     │   │
│  │  - TTL: 1 hour for API, 24 hours for static                         │   │
│  │  - Use case: Documents, certificates, static content                │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.3.2 Cache Key Patterns

| Data Type | Cache Key | TTL |
|-----------|-----------|-----|
| User session | `session:{session_id}` | 24h |
| User permissions | `permissions:{user_id}` | 1h |
| Project metadata | `project:{project_id}:meta` | 1h |
| Credit inventory | `inventory:{org_id}` | 5m |
| Calculation result | `calculation:{calc_id}` | 1h |
| Methodology config | `methodology:{meth_id}` | 24h |
| API response | `api:{endpoint}:{params_hash}` | 5m |

#### 6.3.3 Cache Invalidation

**Invalidation Strategies:**

| Strategy | Use Case | Implementation |
|----------|----------|----------------|
| Time-based | Most data | Redis TTL |
| Event-based | Inventory, credits | Pub/Sub on change |
| Manual | Emergency | Admin API |
| Version-based | Config data | Version in key |

**Cache-Aside Pattern:**
```
1. Check cache
2. If hit, return
3. If miss, load from DB
4. Store in cache
5. Return data
```

**Write-Through Pattern:**
```
1. Write to DB
2. Write to cache
3. Return success
```

### 6.4 CDN Configuration

#### 6.4.1 Static Asset Caching

| Asset Type | Cache Duration | Compression |
|------------|----------------|-------------|
| JavaScript/CSS | 1 year (versioned) | Brotli/Gzip |
| Images | 30 days | Optimized |
| Fonts | 1 year | Brotli |
| Documents | 1 hour | - |
| Certificates | 1 year | - |

#### 6.4.2 API Response Caching

| Endpoint | Cache Duration | Vary By |
|----------|----------------|---------|
| GET /methodologies | 1 hour | - |
| GET /projects/{id} | 5 minutes | Authorization |
| GET /credits/inventory | 1 minute | Authorization |
| GET /reports/* | 5 minutes | Authorization, params |

### 6.5 Database Performance Optimization

#### 6.5.1 Indexing Strategy

**Primary Indexes:**
```sql
-- Organization lookups
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_activities_project ON activities(project_id);
CREATE INDEX idx_credits_project ON credits(project_id);
CREATE INDEX idx_credits_owner ON credits(current_owner_id);

-- Status filtering
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_credits_status ON credits(status);

-- Date range queries
CREATE INDEX idx_activities_period ON activities(monitoring_period_start, monitoring_period_end);
CREATE INDEX idx_credits_vintage ON credits(vintage_year);
CREATE INDEX idx_retirements_date ON retirements(retirement_date);

-- Search
CREATE INDEX idx_projects_name ON projects USING gin(to_tsvector('english', name));
CREATE INDEX idx_activities_name ON activities USING gin(to_tsvector('english', name));
```

**Composite Indexes:**
```sql
-- Common query patterns
CREATE INDEX idx_credits_owner_status ON credits(current_owner_id, status);
CREATE INDEX idx_credits_registry_vintage ON credits(registry_id, vintage_year);
CREATE INDEX idx_retirements_org_date ON retirements(organization_id, retirement_date);
```

#### 6.5.2 Query Optimization

**Slow Query Threshold:** 1 second
**Query Analysis:**
- EXPLAIN ANALYZE for all new queries
- pg_stat_statements for monitoring
- Auto-explain for development

**Optimization Techniques:**
- Cursor-based pagination (avoid OFFSET)
- SELECT only needed columns
- Batch inserts (1000 rows per batch)
- Connection pooling (PgBouncer)
- Prepared statements for repeated queries

#### 6.5.3 Partitioning Strategy

**Partitioned Tables:**

| Table | Partition Key | Partition Type | Retention |
|-------|---------------|----------------|-----------|
| audit_logs | audit_timestamp | Range (monthly) | 7 years |
| calculations | created_at | Range (monthly) | 3 years |
| credit_history | created_at | Range (monthly) | 5 years |
| retirement_history | created_at | Range (monthly) | 10 years |

**Partition Maintenance:**
- Auto-create next 3 months
- Archive partitions older than retention
- Vacuum and analyze monthly

### 6.6 Load Testing Strategy

#### 6.6.1 Load Test Scenarios

| Scenario | Concurrent Users | Duration | Target |
|----------|------------------|----------|--------|
| Normal load | 1000 | 30 min | p95 < 500ms |
| Peak load | 5000 | 15 min | p95 < 1s |
| Stress test | 10000 | 10 min | No errors |
| Spike test | 0 → 5000 | 5 min | Recovery < 2 min |
| Endurance | 1000 | 24 hours | No memory leaks |

#### 6.6.2 Key Performance Indicators

| KPI | Target | Alert Threshold |
|-----|--------|-----------------|
| Error rate | < 0.1% | > 0.5% |
| CPU utilization | < 70% | > 85% |
| Memory utilization | < 80% | > 90% |
| DB connections | < 80% pool | > 90% pool |
| Cache hit rate | > 90% | < 80% |
| Queue depth | < 100 | > 500 |

### 6.7 Disaster Recovery

#### 6.7.1 RPO/RTO Targets

| Scenario | RPO | RTO |
|----------|-----|-----|
| Database failure | 5 minutes | 30 minutes |
| Service failure | 0 | 5 minutes |
| Region failure | 1 hour | 4 hours |
| Complete disaster | 24 hours | 24 hours |

#### 6.7.2 Backup Strategy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Database full | Daily | 30 days | S3 + Glacier |
| Database incremental | Hourly | 7 days | S3 |
| Database WAL | Continuous | 7 days | S3 |
| File storage | Continuous | Versioned | S3 |
| Configuration | On change | 10 versions | Git + S3 |

#### 6.7.3 Failover Procedures

**Database Failover:**
1. Detect primary failure (30 seconds)
2. Promote read replica (60 seconds)
3. Update connection strings (30 seconds)
4. Verify connectivity (60 seconds)
5. Notify on-call (immediate)

**Service Failover:**
1. Health check failure detected (10 seconds)
2. Traffic routed to healthy instances (immediate)
3. Failed instance restarted (30 seconds)
4. Investigation initiated (immediate)



---

## 7. DATABASE SCHEMA (SQL DDL)

### 7.1 Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA OVERVIEW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  CORE TABLES                                                         │    │
│  │  ├── organizations          - Organization entities                  │    │
│  │  ├── users                  - User accounts                          │    │
│  │  ├── roles                  - Role definitions                       │    │
│  │  ├── permissions            - Permission definitions                 │    │
│  │  └── user_roles             - User-role assignments                  │    │
│  │                                                                      │    │
│  │  PROJECT TABLES                                                      │    │
│  │  ├── projects               - Carbon credit projects                 │    │
│  │  ├── project_documents      - Project document links                 │    │
│  │  └── project_verifications  - Project verification records           │    │
│  │                                                                      │    │
│  │  METHODOLOGY TABLES                                                  │    │
│  │  ├── methodologies          - Calculation methodologies              │    │
│  │  └── methodology_versions   - Methodology version history            │    │
│  │                                                                      │    │
│  │  ACTIVITY TABLES                                                     │    │
│  │  ├── activities             - Activity records                       │    │
│  │  ├── activity_documents     - Activity document links                │    │
│  │  └── activity_calculations  - Activity-calculation links             │    │
│  │                                                                      │    │
│  │  CALCULATION TABLES                                                  │    │
│  │  ├── calculations           - Calculation runs                       │    │
│  │  └── calculation_results    - Detailed calculation results           │    │
│  │                                                                      │    │
│  │  CREDIT TABLES                                                       │    │
│  │  ├── credits                - Carbon credits                         │    │
│  │  ├── credit_batches         - Credit batches                         │    │
│  │  ├── credit_history         - Credit state history                  │    │
│  │  └── credit_transfers       - Credit transfer records               │    │
│  │                                                                      │    │
│  │  REGISTRY TABLES                                                     │    │
│  │  ├── registries             - Registry configurations                │    │
│  │  └── registry_sync_logs     - Registry sync history                 │    │
│  │                                                                      │    │
│  │  RETIREMENT TABLES                                                   │    │
│  │  ├── retirements            - Retirement transactions                │    │
│  │  ├── retirement_credits     - Credits in retirements                │    │
│  │  ├── registry_retirements    - Registry-specific retirements         │    │
│  │  └── beneficiaries          - Retirement beneficiaries              │    │
│  │                                                                      │    │
│  │  DOCUMENT TABLES                                                     │    │
│  │  ├── documents               - Document metadata                     │    │
│  │  └── document_versions       - Document version history             │    │
│  │                                                                      │    │
│  │  AUDIT TABLES                                                        │    │
│  │  └── audit_logs              - Audit trail (partitioned)            │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Core Tables DDL

#### 7.2.1 Organizations Table

```sql
-- =============================================
-- ORGANIZATIONS TABLE
-- =============================================
CREATE TABLE organizations (
    organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_id VARCHAR(50),
    organization_type VARCHAR(50) NOT NULL CHECK (organization_type IN (
        'PROJECT_DEVELOPER', 'VERIFIER', 'BUYER', 'BROKER', 'REGISTRY'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN (
        'ACTIVE', 'SUSPENDED', 'INACTIVE', 'PENDING_VERIFICATION'
    )),
    
    -- Address
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country_code CHAR(2),
    
    -- Contact
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    primary_contact_id UUID,
    
    -- KYC
    kyc_status VARCHAR(50) DEFAULT 'PENDING' CHECK (kyc_status IN (
        'PENDING', 'VERIFIED', 'REJECTED'
    )),
    kyc_verified_at TIMESTAMP,
    
    -- Credit tracking
    credit_balance DECIMAL(20,6) DEFAULT 0.0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_organizations_status ON organizations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_type ON organizations(organization_type);
CREATE INDEX idx_organizations_country ON organizations(country_code);
CREATE INDEX idx_organizations_kyc ON organizations(kyc_status);

-- Comments
COMMENT ON TABLE organizations IS 'Organizations participating in the carbon credit platform';
COMMENT ON COLUMN organizations.credit_balance IS 'Total credit balance across all projects';
```

#### 7.2.2 Users Table

```sql
-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    phone VARCHAR(50),
    job_title VARCHAR(100),
    department VARCHAR(100),
    
    -- Organization
    organization_id UUID NOT NULL REFERENCES organizations(organization_id),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'
    )),
    
    -- Email verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    
    -- MFA
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT, -- Encrypted
    
    -- Login tracking
    last_login_at TIMESTAMP,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_changed_at TIMESTAMP,
    password_expires_at TIMESTAMP,
    
    -- Preferences
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    preferences JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_password_expires CHECK (password_expires_at > password_changed_at)
);

-- Indexes
CREATE INDEX idx_users_org ON users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);

-- Comments
COMMENT ON TABLE users IS 'Platform users with authentication capabilities';
COMMENT ON COLUMN users.mfa_secret IS 'Encrypted TOTP secret';
```

#### 7.2.3 Roles and Permissions Tables

```sql
-- =============================================
-- ROLES TABLE
-- =============================================
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    scope VARCHAR(50) NOT NULL CHECK (scope IN ('PLATFORM', 'ORGANIZATION', 'PROJECT')),
    is_system BOOLEAN DEFAULT FALSE,
    permissions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- PERMISSIONS TABLE
-- =============================================
CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE'
    )),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- USER_ROLES TABLE
-- =============================================
CREATE TABLE user_roles (
    user_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(organization_id),
    project_id UUID,
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(user_id),
    expires_at TIMESTAMP,
    UNIQUE(user_id, role_id, organization_id, project_id)
);

-- Indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_org ON user_roles(organization_id);
```

### 7.3 Project Tables DDL

#### 7.3.1 Projects Table

```sql
-- =============================================
-- PROJECTS TABLE
-- =============================================
CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_family VARCHAR(50) NOT NULL CHECK (project_family IN (
        'NATURE_BASED', 'AGRICULTURE', 'ENERGY', 'WASTE', 
        'INDUSTRIAL', 'ENGINEERED_CDR', 'CROSS_CUTTING'
    )),
    project_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'
    )),
    
    -- Registry info
    registry_id UUID,
    external_registry_id VARCHAR(100),
    external_project_id VARCHAR(100),
    
    -- Location
    country_code CHAR(2) NOT NULL,
    region VARCHAR(100),
    latitude DECIMAL(10,8) CHECK (latitude BETWEEN -90 AND 90),
    longitude DECIMAL(11,8) CHECK (longitude BETWEEN -180 AND 180),
    area_hectares DECIMAL(15,4),
    
    -- Timeline
    start_date DATE,
    end_date DATE,
    crediting_period_start DATE,
    crediting_period_end DATE,
    
    -- Carbon accounting
    baseline_scenario TEXT,
    project_scenario TEXT,
    additionality_proof TEXT,
    leakage_assessment TEXT,
    permanence_period_years INTEGER,
    buffer_contribution_pct DECIMAL(5,2) DEFAULT 0.0,
    
    -- Credit tracking
    total_credits_issued DECIMAL(20,6) DEFAULT 0.0,
    total_credits_retired DECIMAL(20,6) DEFAULT 0.0,
    current_credit_balance DECIMAL(20,6) DEFAULT 0.0,
    
    -- Verification
    verification_body_id UUID,
    verification_status VARCHAR(50) CHECK (verification_status IN (
        'PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'
    )),
    last_verification_date DATE,
    next_verification_date DATE,
    
    -- Metadata
    documents JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_crediting_period CHECK (crediting_period_end > crediting_period_start),
    CONSTRAINT chk_project_dates CHECK (end_date > start_date)
);

-- Indexes
CREATE INDEX idx_projects_org ON projects(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_family ON projects(project_family);
CREATE INDEX idx_projects_registry ON projects(registry_id);
CREATE INDEX idx_projects_country ON projects(country_code);
CREATE INDEX idx_projects_verification ON projects(verification_status);
CREATE INDEX idx_projects_dates ON projects(crediting_period_start, crediting_period_end);

-- Full-text search
CREATE INDEX idx_projects_name_search ON projects USING gin(to_tsvector('english', name));
CREATE INDEX idx_projects_description_search ON projects USING gin(to_tsvector('english', description));

-- Comments
COMMENT ON TABLE projects IS 'Carbon credit projects that generate credits through activities';
```

### 7.4 Methodology Tables DDL

```sql
-- =============================================
-- METHODOLOGIES TABLE
-- =============================================
CREATE TABLE methodologies (
    methodology_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    methodology_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL,
    
    -- Classification
    project_family VARCHAR(50) NOT NULL CHECK (project_family IN (
        'NATURE_BASED', 'AGRICULTURE', 'ENERGY', 'WASTE', 
        'INDUSTRIAL', 'ENGINEERED_CDR', 'CROSS_CUTTING'
    )),
    activity_cluster VARCHAR(100) NOT NULL,
    standard_body VARCHAR(50) NOT NULL CHECK (standard_body IN (
        'VERRA', 'GOLD_STANDARD', 'ACR', 'CAR', 'CDM', 'PURO', 'ISOMETRIC', 'PROPRIETARY'
    )),
    
    -- Configuration
    applicability_conditions JSONB DEFAULT '{}',
    baseline_parameters JSONB DEFAULT '{}',
    project_parameters JSONB DEFAULT '{}',
    leakage_parameters JSONB DEFAULT '{}',
    emission_factors JSONB DEFAULT '{}',
    calculation_logic JSONB NOT NULL DEFAULT '{}',
    validation_rules JSONB DEFAULT '{}',
    required_documents JSONB DEFAULT '[]',
    uncertainty_provisions JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    expiry_date DATE,
    superseded_by UUID REFERENCES methodologies(methodology_id),
    documentation_url VARCHAR(500),
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT chk_methodology_dates CHECK (expiry_date > effective_date)
);

-- Indexes
CREATE INDEX idx_methodologies_family ON methodologies(project_family);
CREATE INDEX idx_methodologies_standard ON methodologies(standard_body);
CREATE INDEX idx_methodologies_active ON methodologies(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_methodologies_cluster ON methodologies(activity_cluster);
```

### 7.5 Activity Tables DDL

```sql
-- =============================================
-- ACTIVITIES TABLE
-- =============================================
CREATE TABLE activities (
    activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_code VARCHAR(50) UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(project_id),
    methodology_id UUID NOT NULL REFERENCES methodologies(methodology_id),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'
    )),
    
    -- Monitoring period
    monitoring_period_start DATE NOT NULL,
    monitoring_period_end DATE NOT NULL,
    
    -- Data
    baseline_data JSONB DEFAULT '{}',
    project_data JSONB DEFAULT '{}',
    leakage_data JSONB DEFAULT '{}',
    uncertainty_data JSONB DEFAULT '{}',
    input_parameters JSONB NOT NULL DEFAULT '{}',
    
    -- Results
    calculated_emissions JSONB DEFAULT '{}',
    net_credits_calculated DECIMAL(20,6),
    buffer_deduction DECIMAL(20,6),
    issuance_request_amount DECIMAL(20,6),
    
    -- Verification
    verification_status VARCHAR(50) CHECK (verification_status IN (
        'PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'
    )),
    verified_by UUID REFERENCES users(user_id),
    verified_at TIMESTAMP,
    verification_notes TEXT,
    
    -- Calculation reference
    calculation_run_id UUID,
    
    -- Metadata
    documents JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_monitoring_period CHECK (monitoring_period_end > monitoring_period_start)
);

-- Indexes
CREATE INDEX idx_activities_project ON activities(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_methodology ON activities(methodology_id);
CREATE INDEX idx_activities_status ON activities(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_period ON activities(monitoring_period_start, monitoring_period_end);
CREATE INDEX idx_activities_verification ON activities(verification_status);
```

### 7.6 Calculation Tables DDL

```sql
-- =============================================
-- CALCULATIONS TABLE
-- =============================================
CREATE TABLE calculations (
    calculation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_code VARCHAR(50) UNIQUE NOT NULL,
    activity_id UUID NOT NULL REFERENCES activities(activity_id),
    methodology_id UUID NOT NULL REFERENCES methodologies(methodology_id),
    
    -- Configuration
    calculation_type VARCHAR(50) NOT NULL CHECK (calculation_type IN (
        'BASELINE', 'PROJECT', 'LEAKAGE', 'NET', 'FULL'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    
    -- Input/Output
    input_data JSONB NOT NULL DEFAULT '{}',
    calculation_steps JSONB DEFAULT '[]',
    intermediate_results JSONB DEFAULT '{}',
    final_results JSONB DEFAULT '{}',
    
    -- Results
    baseline_emissions DECIMAL(20,6),
    project_emissions DECIMAL(20,6),
    leakage_emissions DECIMAL(20,6),
    net_emission_reductions DECIMAL(20,6),
    uncertainty_adjustment DECIMAL(20,6),
    adjusted_reductions DECIMAL(20,6),
    buffer_contribution DECIMAL(20,6),
    credits_generated DECIMAL(20,6),
    
    -- Execution tracking
    calculation_engine_version VARCHAR(50),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    error_message TEXT,
    error_stack TEXT,
    
    -- Validation
    validated_by UUID REFERENCES users(user_id),
    validated_at TIMESTAMP,
    validation_notes TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    superseded_by UUID REFERENCES calculations(calculation_id),
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT chk_calculation_duration CHECK (duration_seconds >= 0)
);

-- Indexes
CREATE INDEX idx_calculations_activity ON calculations(activity_id);
CREATE INDEX idx_calculations_status ON calculations(status);
CREATE INDEX idx_calculations_current ON calculations(activity_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_calculations_created ON calculations(created_at);
```

### 7.7 Credit Tables DDL

```sql
-- =============================================
-- CREDITS TABLE
-- =============================================
CREATE TABLE credits (
    credit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_code VARCHAR(50) UNIQUE NOT NULL,
    serial_number VARCHAR(100) UNIQUE,
    batch_id UUID,
    
    -- Relationships
    project_id UUID NOT NULL REFERENCES projects(project_id),
    activity_id UUID NOT NULL REFERENCES activities(activity_id),
    calculation_id UUID NOT NULL REFERENCES calculations(calculation_id),
    registry_id UUID NOT NULL REFERENCES registries(registry_id),
    methodology_id UUID NOT NULL REFERENCES methodologies(methodology_id),
    
    -- Credit details
    vintage_year INTEGER NOT NULL,
    credit_type VARCHAR(50) NOT NULL CHECK (credit_type IN (
        'VCU', 'GS_VER', 'CORC', 'ACR_CRT', 'CDR', 'OTC'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED' CHECK (status IN (
        'ISSUED', 'AVAILABLE', 'RESERVED', 'RETIRED', 'TRANSFERRED', 'EXPIRED', 'CANCELLED'
    )),
    quantity DECIMAL(20,6) NOT NULL CHECK (quantity > 0),
    
    -- Ownership
    current_owner_id UUID NOT NULL REFERENCES organizations(organization_id),
    original_owner_id UUID NOT NULL REFERENCES organizations(organization_id),
    
    -- Dates
    issuance_date DATE NOT NULL,
    expiry_date DATE,
    
    -- Verification
    verification_standard VARCHAR(50),
    verification_body VARCHAR(100),
    monitoring_period_start DATE,
    monitoring_period_end DATE,
    
    -- Co-benefits
    co_benefits JSONB DEFAULT '[]',
    
    -- Corresponding adjustment (Article 6)
    corresponding_adjustment BOOLEAN DEFAULT FALSE,
    corresponding_adjustment_country CHAR(2),
    
    -- Buffer pool
    is_buffer_pool BOOLEAN DEFAULT FALSE,
    buffer_type VARCHAR(50),
    
    -- Split/Merge tracking
    parent_credit_id UUID REFERENCES credits(credit_id),
    child_credit_ids JSONB DEFAULT '[]',
    
    -- External data
    external_registry_data JSONB DEFAULT '{}',
    external_transaction_id VARCHAR(100),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_credits_project ON credits(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_credits_owner ON credits(current_owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_credits_status ON credits(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_credits_registry ON credits(registry_id);
CREATE INDEX idx_credits_vintage ON credits(vintage_year);
CREATE INDEX idx_credits_type ON credits(credit_type);
CREATE INDEX idx_credits_serial ON credits(serial_number);
CREATE INDEX idx_credits_batch ON credits(batch_id);
CREATE INDEX idx_credits_issuance ON credits(issuance_date);
CREATE INDEX idx_credits_owner_status ON credits(current_owner_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_credits_registry_vintage ON credits(registry_id, vintage_year);

-- =============================================
-- CREDIT_BATCHES TABLE
-- =============================================
CREATE TABLE credit_batches (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code VARCHAR(50) UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(project_id),
    registry_id UUID NOT NULL REFERENCES registries(registry_id),
    methodology_id UUID NOT NULL REFERENCES methodologies(methodology_id),
    
    vintage_year INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'PENDING_VERIFICATION', 'VERIFIED', 'ISSUED', 'REJECTED'
    )),
    
    total_quantity DECIMAL(20,6) NOT NULL CHECK (total_quantity > 0),
    number_of_credits INTEGER NOT NULL CHECK (number_of_credits > 0),
    serial_number_start VARCHAR(100),
    serial_number_end VARCHAR(100),
    
    monitoring_period_start DATE NOT NULL,
    monitoring_period_end DATE NOT NULL,
    
    verification_body_id UUID REFERENCES organizations(organization_id),
    verification_submitted_at TIMESTAMP,
    verification_completed_at TIMESTAMP,
    issuance_submitted_at TIMESTAMP,
    issuance_completed_at TIMESTAMP,
    
    external_batch_id VARCHAR(100),
    external_issuance_id VARCHAR(100),
    
    documents JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    version INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX idx_batches_project ON credit_batches(project_id);
CREATE INDEX idx_batches_status ON credit_batches(status);
CREATE INDEX idx_batches_registry ON credit_batches(registry_id);
```

### 7.8 Registry Tables DDL

```sql
-- =============================================
-- REGISTRIES TABLE
-- =============================================
CREATE TABLE registries (
    registry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    registry_type VARCHAR(50) NOT NULL CHECK (registry_type IN (
        'VERRA_VCS', 'GOLD_STANDARD', 'ACR', 'CAR', 'PURO', 'ISOMETRIC', 'OTC', 'CUSTOM'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEGRADED'
    )),
    
    -- API configuration
    api_base_url VARCHAR(500),
    api_version VARCHAR(20),
    auth_type VARCHAR(50) CHECK (auth_type IN ('OAUTH2', 'API_KEY', 'CERTIFICATE', 'BASIC')),
    auth_config JSONB DEFAULT '{}', -- Encrypted
    
    -- Webhook
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255), -- Encrypted
    
    -- Rate limiting
    rate_limit_requests INTEGER,
    rate_limit_period INTEGER,
    
    -- Sync configuration
    sync_enabled BOOLEAN DEFAULT FALSE,
    sync_frequency_minutes INTEGER,
    last_sync_at TIMESTAMP,
    last_sync_status VARCHAR(50),
    last_sync_error TEXT,
    
    -- Capabilities
    supported_operations JSONB DEFAULT '[]',
    credit_types JSONB DEFAULT '[]',
    configuration JSONB DEFAULT '{}',
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    version INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX idx_registries_type ON registries(registry_type);
CREATE INDEX idx_registries_status ON registries(status);
```

### 7.9 Retirement Tables DDL

```sql
-- =============================================
-- RETIREMENTS TABLE
-- =============================================
CREATE TABLE retirements (
    retirement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retirement_code VARCHAR(50) UNIQUE NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(organization_id),
    beneficiary_id UUID REFERENCES beneficiaries(beneficiary_id),
    
    retirement_type VARCHAR(50) NOT NULL CHECK (retirement_type IN (
        'VOLUNTARY', 'COMPLIANCE', 'CLAIM', 'CANCELLATION'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    retirement_reason VARCHAR(50) NOT NULL CHECK (retirement_reason IN (
        'OFFSET_EMISSIONS', 'INVESTMENT', 'GIFT', 'COMPLIANCE', 'OTHER'
    )),
    retirement_use_case VARCHAR(255),
    retirement_date DATE NOT NULL,
    
    total_credits DECIMAL(20,6) NOT NULL CHECK (total_credits > 0),
    total_value DECIMAL(20,2),
    currency VARCHAR(3),
    
    certificate_url VARCHAR(500),
    certificate_number VARCHAR(100),
    external_retirement_id VARCHAR(100),
    
    beneficiary_statement TEXT,
    private_note TEXT,
    
    -- Emissions claim
    emissions_claim_period_start DATE,
    emissions_claim_period_end DATE,
    emissions_claim_quantity DECIMAL(20,6),
    scope_1_emissions DECIMAL(20,6),
    scope_2_emissions DECIMAL(20,6),
    scope_3_emissions DECIMAL(20,6),
    
    verification_standard VARCHAR(50),
    third_party_verified BOOLEAN DEFAULT FALSE,
    
    retirement_metadata JSONB DEFAULT '{}',
    
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    version INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX idx_retirements_org ON retirements(organization_id);
CREATE INDEX idx_retirements_status ON retirements(status);
CREATE INDEX idx_retirements_beneficiary ON retirements(beneficiary_id);
CREATE INDEX idx_retirements_date ON retirements(retirement_date);
CREATE INDEX idx_retirements_type ON retirements(retirement_type);

-- =============================================
-- RETIREMENT_CREDITS TABLE
-- =============================================
CREATE TABLE retirement_credits (
    retirement_credit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retirement_id UUID NOT NULL REFERENCES retirements(retirement_id),
    credit_id UUID NOT NULL REFERENCES credits(credit_id),
    
    quantity DECIMAL(20,6) NOT NULL CHECK (quantity > 0),
    serial_number VARCHAR(100),
    project_id UUID REFERENCES projects(project_id),
    vintage_year INTEGER,
    registry_id UUID REFERENCES registries(registry_id),
    
    external_retirement_id VARCHAR(100),
    retirement_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (retirement_status IN (
        'PENDING', 'CONFIRMED', 'FAILED'
    )),
    confirmed_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(retirement_id, credit_id)
);

-- Indexes
CREATE INDEX idx_retirement_credits_retirement ON retirement_credits(retirement_id);
CREATE INDEX idx_retirement_credits_credit ON retirement_credits(credit_id);
CREATE INDEX idx_retirement_credits_status ON retirement_credits(retirement_status);

-- =============================================
-- REGISTRY_RETIREMENTS TABLE
-- =============================================
CREATE TABLE registry_retirements (
    registry_retirement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retirement_id UUID NOT NULL REFERENCES retirements(retirement_id),
    registry_id UUID NOT NULL REFERENCES registries(registry_id),
    
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'SUBMITTED', 'PROCESSING', 'COMPLETED', 'FAILED'
    )),
    external_retirement_id VARCHAR(100),
    external_status VARCHAR(50),
    
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    request_payload JSONB DEFAULT '{}',
    response_payload JSONB DEFAULT '{}',
    error_message TEXT,
    
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(retirement_id, registry_id)
);

-- Indexes
CREATE INDEX idx_registry_retirements_retirement ON registry_retirements(retirement_id);
CREATE INDEX idx_registry_retirements_registry ON registry_retirements(registry_id);
CREATE INDEX idx_registry_retirements_status ON registry_retirements(status);
CREATE INDEX idx_registry_retirements_retry ON registry_retirements(next_retry_at) WHERE status IN ('PENDING', 'FAILED');

-- =============================================
-- BENEFICIARIES TABLE
-- =============================================
CREATE TABLE beneficiaries (
    beneficiary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_code VARCHAR(50) UNIQUE NOT NULL,
    organization_id UUID REFERENCES organizations(organization_id),
    
    name VARCHAR(255) NOT NULL,
    beneficiary_type VARCHAR(50) NOT NULL CHECK (beneficiary_type IN (
        'INDIVIDUAL', 'ORGANIZATION', 'PRODUCT', 'EVENT', 'CAMPAIGN'
    )),
    display_name VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    email VARCHAR(255),
    
    is_public BOOLEAN DEFAULT TRUE,
    statement_template TEXT,
    
    total_retirements INTEGER DEFAULT 0,
    total_credits_retired DECIMAL(20,6) DEFAULT 0.0,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_beneficiaries_org ON beneficiaries(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_beneficiaries_type ON beneficiaries(beneficiary_type);
CREATE INDEX idx_beneficiaries_public ON beneficiaries(is_public) WHERE is_public = TRUE;
```

### 7.10 Document Tables DDL

```sql
-- =============================================
-- DOCUMENTS TABLE
-- =============================================
CREATE TABLE documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_code VARCHAR(50) UNIQUE NOT NULL,
    
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'PROJECT', 'ACTIVITY', 'VERIFICATION', 'RETIREMENT'
    )),
    entity_id UUID NOT NULL,
    
    document_type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    storage_provider VARCHAR(50) NOT NULL CHECK (storage_provider IN (
        'S3', 'AZURE_BLOB', 'GCS', 'MINIO'
    )),
    
    checksum_sha256 VARCHAR(64),
    encryption_status VARCHAR(50) DEFAULT 'UNENCRYPTED' CHECK (encryption_status IN (
        'UNENCRYPTED', 'ENCRYPTED'
    )),
    
    version_number INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES documents(document_id),
    
    is_public BOOLEAN DEFAULT FALSE,
    access_control JSONB DEFAULT '{}',
    
    uploaded_by UUID NOT NULL REFERENCES users(user_id),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at);
```

### 7.11 Audit Tables DDL

```sql
-- =============================================
-- AUDIT_LOGS TABLE (Partitioned)
-- =============================================
CREATE TABLE audit_logs (
    audit_id UUID NOT NULL,
    audit_timestamp TIMESTAMP NOT NULL,
    
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    
    user_id UUID REFERENCES users(user_id),
    organization_id UUID REFERENCES organizations(organization_id),
    session_id VARCHAR(100),
    
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    request_method VARCHAR(10),
    request_path VARCHAR(500),
    request_body JSONB,
    response_status INTEGER,
    
    changes JSONB,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'INFO' CHECK (severity IN (
        'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'
    )),
    
    metadata JSONB DEFAULT '{}',
    retention_until DATE,
    
    PRIMARY KEY (audit_id, audit_timestamp)
) PARTITION BY RANGE (audit_timestamp);

-- Create monthly partitions
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... continue for all months

-- Indexes
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(audit_timestamp);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
```

### 7.12 Migration Strategy

#### 7.12.1 Migration Framework

**Tool:** Flyway or Liquibase

**Migration Naming Convention:**
```
V{version}__{description}.sql
```

Example:
```
V1__Initial_schema.sql
V2__Add_credit_history_table.sql
V3__Add_methodology_indexes.sql
```

#### 7.12.2 Migration Best Practices

1. **Backward Compatibility:**
   - Never drop columns in same release
   - Add new columns as nullable first
   - Use feature flags for schema changes

2. **Data Migrations:**
   - Separate schema and data migrations
   - Batch large data migrations
   - Run data migrations during low-traffic periods

3. **Rollback Strategy:**
   - Every migration has rollback script
   - Test rollback in staging
   - Document rollback procedures

4. **Zero-Downtime Migrations:**
   - Use expand/contract pattern
   - Blue-green deployment
   - Database per service pattern



---

## 8. EVENT-DRIVEN ARCHITECTURE

### 8.1 Event-Driven Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EVENT-DRIVEN ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       EVENT PRODUCERS                                │    │
│  │                                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│    │
│  │  │   Project   │  │  Activity   │  │ Calculation │  │   Credit    ││    │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service   ││    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘│    │
│  │         │                │                │                │       │    │
│  │         └────────────────┴────────────────┴────────────────┘       │    │
│  │                                   │                                 │    │
│  └───────────────────────────────────┼─────────────────────────────────┘    │
│                                      │                                       │
│  ┌───────────────────────────────────▼───────────────────────────────────┐   │
│  │                         EVENT BUS (Kafka)                              │   │
│  │                                                                        │   │
│  │  Topics:                                                               │   │
│  │  ├── carbon.calculations                                               │   │
│  │  ├── carbon.credits                                                    │   │
│  │  ├── carbon.retirements                                                │   │
│  │  ├── carbon.activities                                                 │   │
│  │  ├── carbon.projects                                                   │   │
│  │  ├── carbon.verifications                                              │   │
│  │  ├── carbon.registry-events                                            │   │
│  │  ├── carbon.notifications                                              │   │
│  │  └── carbon.audit-events                                               │   │
│  │                                                                        │   │
│  └───────────────────────────────────┬───────────────────────────────────┘   │
│                                      │                                       │
│  ┌───────────────────────────────────▼───────────────────────────────────┐   │
│  │                       EVENT CONSUMERS                                  │   │
│  │                                                                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│  │  │   Audit     │  │ Notification│  │   Search    │  │  Reporting  │   │   │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Service   │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│  │                                                                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│  │  │   Cache     │  │   Webhook   │  │  Analytics  │  │   Registry  │   │   │
│  │  │   Service   │  │   Service   │  │   Service   │  │   Sync      │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│  │                                                                        │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Event Types

#### 8.2.1 Domain Events

| Event Category | Event Type | Description | Producers | Consumers |
|----------------|------------|-------------|-----------|-----------|
| **Calculation** | calculation.requested | New calculation requested | Activity Service | Calculation Service |
| | calculation.started | Calculation execution started | Calculation Service | Audit, Notification |
| | calculation.completed | Calculation finished successfully | Calculation Service | Credit Service, Audit |
| | calculation.failed | Calculation failed | Calculation Service | Notification, Audit |
| | calculation.validated | Calculation validated | Calculation Service | Credit Service |
| **Credit** | credit.issued | New credits issued | Credit Service | Inventory, Audit, Notification |
| | credit.transferred | Credits transferred | Credit Service | Inventory, Audit |
| | credit.split | Credit split | Credit Service | Inventory, Audit |
| | credit.merged | Credits merged | Credit Service | Inventory, Audit |
| | credit.reserved | Credits reserved | Credit Service | Inventory |
| | credit.released | Credits released from reservation | Credit Service | Inventory |
| **Retirement** | retirement.created | Retirement transaction created | Retirement Service | Audit |
| | retirement.submitted | Retirement submitted to registry | Retirement Service | Registry Adapter |
| | retirement.pending | Retirement pending confirmation | Registry Adapter | Notification |
| | retirement.completed | Retirement completed | Registry Adapter | Certificate, Audit, Notification |
| | retirement.failed | Retirement failed | Registry Adapter | Notification, Retry Handler |
| | retirement.cancelled | Retirement cancelled | Retirement Service | Audit |
| **Activity** | activity.created | New activity created | Activity Service | Audit, Project Service |
| | activity.submitted | Activity submitted for review | Activity Service | Notification |
| | activity.approved | Activity approved | Activity Service | Calculation Service |
| | activity.rejected | Activity rejected | Activity Service | Notification |
| **Project** | project.created | New project created | Project Service | Audit |
| | project.submitted | Project submitted for validation | Project Service | Notification |
| | project.validated | Project validated | Project Service | Registry Adapter |
| | project.activated | Project activated | Project Service | Audit |
| | project.completed | Project completed | Project Service | Audit |
| **Verification** | verification.requested | Verification requested | Project Service | Verifier Notification |
| | verification.started | Verification started | Verification Service | Audit |
| | verification.completed | Verification completed | Verification Service | Credit Service |
| | verification.rejected | Verification rejected | Verification Service | Notification |
| **Registry** | registry.sync.started | Registry sync started | Scheduler | Registry Adapter |
| | registry.sync.completed | Registry sync completed | Registry Adapter | Inventory |
| | registry.sync.failed | Registry sync failed | Registry Adapter | Alerting |
| | registry.inventory.updated | Registry inventory updated | Registry Adapter | Inventory Service |
| | registry.retirement.confirmed | Registry confirmed retirement | Registry Adapter | Retirement Service |

#### 8.2.2 System Events

| Event Type | Description | Producers | Consumers |
|------------|-------------|-----------|-----------|
| user.login | User logged in | User Service | Audit, Security |
| user.logout | User logged out | User Service | Audit |
| user.password_changed | Password changed | User Service | Audit, Notification |
| user.mfa_enabled | MFA enabled | User Service | Audit |
| organization.created | Organization created | User Service | Audit |
| organization.verified | Organization verified | User Service | Notification |
| document.uploaded | Document uploaded | File Service | Audit, Virus Scan |
| document.verified | Document verified | File Service | Notification |
| export.generated | Export file generated | Reporting Service | Notification |
| report.completed | Report completed | Reporting Service | Notification |

### 8.3 Event Schema

#### 8.3.1 Standard Event Envelope

```json
{
  "event_id": "uuid",
  "event_type": "credit.issued",
  "event_version": "1.0",
  "timestamp": "2024-01-15T12:00:00Z",
  "correlation_id": "uuid",
  "causation_id": "uuid",
  "source": "credit-service",
  "organization_id": "uuid",
  "user_id": "uuid",
  "data": {
    // Event-specific payload
  },
  "metadata": {
    "trace_id": "uuid",
    "span_id": "uuid",
    "client_ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0..."
  }
}
```

#### 8.3.2 Event Payload Examples

**calculation.completed:**
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "calculation.completed",
  "event_version": "1.0",
  "timestamp": "2024-01-15T12:00:00Z",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440001",
  "causation_id": "550e8400-e29b-41d4-a716-446655440002",
  "source": "calculation-service",
  "organization_id": "org-123",
  "user_id": "user-456",
  "data": {
    "calculation_id": "calc-789",
    "calculation_code": "CALC-2024-001",
    "activity_id": "act-101",
    "methodology_id": "meth-202",
    "status": "COMPLETED",
    "results": {
      "baseline_emissions": 3010.0,
      "project_emissions": 500.0,
      "leakage_emissions": 150.5,
      "net_emission_reductions": 2359.5,
      "uncertainty_adjustment": 117.98,
      "adjusted_reductions": 2241.52,
      "buffer_contribution": 224.15,
      "credits_generated": 2017.37
    },
    "started_at": "2024-01-15T11:55:00Z",
    "completed_at": "2024-01-15T12:00:00Z",
    "duration_seconds": 300
  },
  "metadata": {
    "trace_id": "trace-abc",
    "span_id": "span-def"
  }
}
```

**credit.issued:**
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440003",
  "event_type": "credit.issued",
  "event_version": "1.0",
  "timestamp": "2024-01-15T12:05:00Z",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "causation_id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "credit-service",
  "organization_id": "org-123",
  "user_id": "user-456",
  "data": {
    "batch_id": "batch-789",
    "project_id": "proj-101",
    "activity_id": "act-202",
    "calculation_id": "calc-789",
    "registry_id": "reg-verra",
    "methodology_id": "meth-vm0015",
    "vintage_year": 2024,
    "credits": [
      {
        "credit_id": "cred-001",
        "credit_code": "CRED-2024-001",
        "serial_number": "VCS-VCU-1523-20240101-20241231-1",
        "quantity": 1000.0,
        "status": "ISSUED",
        "owner_id": "org-123"
      }
    ],
    "total_quantity": 2017.37,
    "issuance_date": "2024-01-15",
    "monitoring_period": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  },
  "metadata": {
    "trace_id": "trace-abc",
    "span_id": "span-ghi"
  }
}
```

**retirement.completed:**
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440004",
  "event_type": "retirement.completed",
  "event_version": "1.0",
  "timestamp": "2024-01-15T12:30:00Z",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440005",
  "causation_id": "550e8400-e29b-41d4-a716-446655440006",
  "source": "retirement-service",
  "organization_id": "org-123",
  "user_id": "user-456",
  "data": {
    "retirement_id": "ret-789",
    "retirement_code": "RET-2024-001",
    "beneficiary_id": "ben-101",
    "retirement_type": "VOLUNTARY",
    "retirement_reason": "OFFSET_EMISSIONS",
    "total_credits": 1000.0,
    "credits": [
      {
        "credit_id": "cred-001",
        "serial_number": "VCS-VCU-1523-20240101-20241231-1",
        "quantity": 1000.0,
        "registry": "VERRA",
        "external_retirement_id": "VRA-2024-12345"
      }
    ],
    "certificate": {
      "certificate_number": "CERT-2024-001",
      "certificate_url": "https://api.example.com/retirements/ret-789/certificate",
      "generated_at": "2024-01-15T12:30:00Z"
    },
    "completed_at": "2024-01-15T12:30:00Z",
    "beneficiary_statement": "This retirement represents Company XYZ's commitment to carbon neutrality."
  },
  "metadata": {
    "trace_id": "trace-abc",
    "span_id": "span-jkl"
  }
}
```

### 8.4 Message Queue Design

#### 8.4.1 Kafka Topic Configuration

```yaml
# Topic: carbon.calculations
name: carbon.calculations
partitions: 12
replication_factor: 3
min_isr: 2
retention_ms: 604800000  # 7 days
cleanup_policy: delete
compression_type: lz4

# Topic: carbon.credits
name: carbon.credits
partitions: 12
replication_factor: 3
min_isr: 2
retention_ms: 2592000000  # 30 days
cleanup_policy: delete
compression_type: lz4

# Topic: carbon.retirements
name: carbon.retirements
partitions: 12
replication_factor: 3
min_isr: 2
retention_ms: 2592000000  # 30 days
cleanup_policy: delete
compression_type: lz4

# Topic: carbon.activities
name: carbon.activities
partitions: 6
replication_factor: 3
min_isr: 2
retention_ms: 604800000  # 7 days
cleanup_policy: delete
compression_type: lz4

# Topic: carbon.projects
name: carbon.projects
partitions: 6
replication_factor: 3
min_isr: 2
retention_ms: 604800000  # 7 days
cleanup_policy: delete
compression_type: lz4

# Topic: carbon.registry-events
name: carbon.registry-events
partitions: 6
replication_factor: 3
min_isr: 2
retention_ms: 604800000  # 7 days
cleanup_policy: delete
compression_type: lz4

# Topic: carbon.notifications
name: carbon.notifications
partitions: 6
replication_factor: 3
min_isr: 2
retention_ms: 86400000  # 1 day
cleanup_policy: delete
compression_type: lz4

# Topic: carbon.audit-events
name: carbon.audit-events
partitions: 24
replication_factor: 3
min_isr: 2
retention_ms: 7776000000  # 90 days
cleanup_policy: delete
compression_type: lz4
```

#### 8.4.2 Consumer Group Configuration

| Consumer Group | Topics | Instances | Processing Guarantee |
|----------------|--------|-----------|---------------------|
| calculation-processor | carbon.calculations | 3-10 | At-least-once |
| credit-processor | carbon.credits | 3-6 | At-least-once |
| retirement-processor | carbon.retirements | 3-6 | At-least-once |
| audit-logger | carbon.* | 3 | At-least-once |
| notification-sender | carbon.notifications | 3 | At-least-once |
| search-indexer | carbon.credits, carbon.projects, carbon.activities | 3 | At-least-once |
| analytics-processor | carbon.* | 3 | At-least-once |
| registry-sync | carbon.registry-events | 2 | At-least-once |

### 8.5 Consumer Patterns

#### 8.5.1 Event Consumer Base Class

```typescript
// TypeScript example
abstract class EventConsumer<T> {
  protected consumer: KafkaConsumer;
  protected topic: string;
  protected consumerGroup: string;
  
  constructor(config: ConsumerConfig) {
    this.consumer = new KafkaConsumer(config);
    this.topic = config.topic;
    this.consumerGroup = config.groupId;
  }
  
  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topic });
    
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = this.parseEvent(message);
        
        try {
          await this.handleEvent(event);
          await this.commitOffset(topic, partition, message.offset);
        } catch (error) {
          await this.handleError(event, error);
        }
      }
    });
  }
  
  abstract handleEvent(event: T): Promise<void>;
  
  private parseEvent(message: KafkaMessage): T {
    return JSON.parse(message.value.toString());
  }
  
  private async commitOffset(
    topic: string, 
    partition: number, 
    offset: string
  ): Promise<void> {
    await this.consumer.commitOffsets([
      { topic, partition, offset: (parseInt(offset) + 1).toString() }
    ]);
  }
  
  private async handleError(event: T, error: Error): Promise<void> {
    logger.error('Event processing failed', { event, error });
    
    // Send to dead letter queue
    await this.sendToDLQ(event, error);
    
    // Alert if critical
    if (this.isCriticalError(error)) {
      await this.sendAlert(event, error);
    }
  }
}
```

#### 8.5.2 Idempotent Consumer Pattern

```typescript
class IdempotentConsumer<T> extends EventConsumer<T> {
  private processedEvents: Set<string> = new Set();
  
  async handleEvent(event: T & { event_id: string }): Promise<void> {
    // Check if already processed
    if (await this.isProcessed(event.event_id)) {
      logger.info('Event already processed, skipping', { event_id: event.event_id });
      return;
    }
    
    // Process event
    await this.processEvent(event);
    
    // Mark as processed
    await this.markProcessed(event.event_id);
  }
  
  private async isProcessed(eventId: string): Promise<boolean> {
    // Check Redis for idempotency
    const exists = await redis.exists(`processed:${eventId}`);
    return exists === 1;
  }
  
  private async markProcessed(eventId: string): Promise<void> {
    // Store in Redis with TTL
    await redis.setex(`processed:${eventId}`, 86400, '1');
  }
  
  abstract processEvent(event: T): Promise<void>;
}
```

### 8.6 Dead Letter Queue

#### 8.6.1 DLQ Configuration

```yaml
# Topic: carbon.dlq
name: carbon.dlq
partitions: 6
replication_factor: 3
min_isr: 2
retention_ms: 2592000000  # 30 days
cleanup_policy: delete
compression_type: lz4
```

#### 8.6.2 DLQ Message Format

```json
{
  "original_event": {
    // Original event payload
  },
  "error": {
    "message": "Error description",
    "stack_trace": "...",
    "timestamp": "2024-01-15T12:00:00Z"
  },
  "context": {
    "consumer_group": "credit-processor",
    "topic": "carbon.credits",
    "partition": 3,
    "offset": 12345,
    "retry_count": 3
  },
  "dlq_timestamp": "2024-01-15T12:00:00Z"
}
```

#### 8.6.3 DLQ Processing

| Retry Count | Action | Delay |
|-------------|--------|-------|
| 1-3 | Retry with exponential backoff | 1s, 2s, 4s |
| 4-5 | Send to DLQ | Immediate |
| DLQ | Manual review required | - |

**DLQ Monitoring:**
- Alert when > 10 messages in DLQ
- Dashboard for DLQ message analysis
- Manual retry interface
- Bulk retry capability

### 8.7 Event Sourcing (Optional)

#### 8.7.1 Event Store

For critical entities (credits, retirements), event sourcing can provide:
- Complete audit trail
- Temporal queries
- State reconstruction

**Event Store Schema:**
```sql
CREATE TABLE event_store (
    event_id UUID PRIMARY KEY,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_version INTEGER NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(aggregate_id, event_version)
);

CREATE INDEX idx_event_store_aggregate ON event_store(aggregate_type, aggregate_id);
CREATE INDEX idx_event_store_type ON event_store(event_type);
CREATE INDEX idx_event_store_occurred ON event_store(occurred_at);
```

#### 8.7.2 Snapshot Strategy

| Aggregate Type | Snapshot Frequency | Retention |
|----------------|-------------------|-----------|
| Credit | Every 100 events | All |
| Retirement | Every 50 events | All |
| Project | Every 50 events | 2 years |

### 8.8 Saga Pattern for Distributed Transactions

#### 8.8.1 Retirement Saga

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RETIREMENT SAGA ORCHESTRATION                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐                                                                │
│  │  Start  │                                                                │
│  │  Saga   │                                                                │
│  └────┬────┘                                                                │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                               │
│  │ Validate│────▶│ Reserve │────▶│ Submit  │                               │
│  │ Request │     │ Credits │     │  to     │                               │
│  └─────────┘     └─────────┘     │Registry │                               │
│       │                          └────┬────┘                               │
│       │                               │                                     │
│       │                          ┌────┴────┐                                │
│       │                          │  Wait   │                                │
│       │                          │Confirm  │                                │
│       │                          └────┬────┘                                │
│       │                               │                                     │
│       │                          ┌────┴────┐                                │
│       │                          │Complete │                                │
│       │                          │ Saga    │                                │
│       │                          └─────────┘                                │
│       │                                                                     │
│       └──────────────────────────┐                                          │
│                                  │                                          │
│                                  ▼                                          │
│                          ┌─────────────┐                                    │
│                          │   Failure   │                                    │
│                          │  Handler    │                                    │
│                          └──────┬──────┘                                    │
│                                 │                                           │
│                    ┌────────────┼────────────┐                              │
│                    │            │            │                              │
│                    ▼            ▼            ▼                              │
│             ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│             │  Cancel  │ │  Release │ │  Notify  │                         │
│             │  Request │ │  Credits │ │  User    │                         │
│             └──────────┘ └──────────┘ └──────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 8.8.2 Saga Compensation

| Step | Action | Compensation |
|------|--------|--------------|
| Validate Request | Check credits available | None |
| Reserve Credits | Mark credits as RESERVED | Release reservation |
| Submit to Registry | Call registry API | Cancel registry request |
| Wait Confirmation | Poll for status | Cancel and release |
| Complete | Generate certificate | None |

### 8.9 Outbox Pattern

#### 8.9.1 Outbox Table

```sql
CREATE TABLE outbox (
    outbox_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_payload JSONB NOT NULL,
    headers JSONB DEFAULT '{}',
    
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED')),
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT
);

CREATE INDEX idx_outbox_status ON outbox(status) WHERE status IN ('PENDING', 'FAILED');
CREATE INDEX idx_outbox_created ON outbox(created_at);
```

#### 8.9.2 Outbox Relay

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Service   │───▶│   Outbox    │───▶│   Relay     │───▶│    Kafka    │
│   Writes    │    │   Table     │    │   Process   │    │   Topic     │
│   to DB     │    │   (atomic)  │    │   (poll)    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Relay Configuration:**
- Poll interval: 100ms
- Batch size: 100 events
- Max retry: 5
- DLQ after max retry



---

## APPENDIX A: METHODOLOGY MAPPING

### A.1 Project Families and Activity Clusters

| Project Family | Activity Clusters | Methodology Examples | Registry |
|----------------|-------------------|---------------------|----------|
| **NATURE_BASED** | ARR (Afforestation, Reforestation, Revegetation) | VM0015, AR-ACM0003, GS-VER-001 | Verra, Gold Standard |
| | IFM (Improved Forest Management) | VM0033, VM0003 | Verra |
| | REDD+ (Reducing Emissions from Deforestation) | VM0007, VM0011 | Verra |
| | Wetlands | VM0036, VM0037 | Verra |
| | Blue Carbon | VM0033 (coastal), VM0024 | Verra |
| **AGRICULTURE** | Soil Carbon | VM0042, VM0017 | Verra |
| | Livestock Methane | VM0038, VM0040 | Verra |
| | Rice Cultivation | VM0017, AMS-III.AU | Verra, CDM |
| | Sustainable Agriculture | GS-VER-002 | Gold Standard |
| **ENERGY** | Grid Renewables | ACM0002, AMS-I.D | CDM, Gold Standard |
| | Distributed Energy | AMS-I.C, AMS-I.F | CDM, Gold Standard |
| | Clean Cooking | GS TPDDTEC, VMR0006 | Gold Standard, Verra |
| | Energy Efficiency | ACM0012, AMS-II.C | CDM, Gold Standard |
| **WASTE** | Landfill Gas | ACM0001, AMS-III.G | CDM, Gold Standard |
| | Wastewater Methane | AMS-III.H, VM0018 | CDM, Verra |
| | Organic Waste | AMS-III.F, VM0041 | CDM, Verra |
| **INDUSTRIAL** | Industrial Gases | AM0023, AM0024 | CDM |
| | CCS/CCUS | VM0043, ISO-14064-2 | Verra |
| | Industrial Efficiency | AMS-III.Z | CDM |
| **ENGINEERED_CDR** | Biochar | Puro-BIOCHAR, EBC | Puro.earth |
| | Mineralization | Puro-ERW, Isometric-ERW | Puro.earth, Isometric |
| | DAC (Direct Air Capture) | Isometric-DAC | Isometric |
| | BiCRS (Biomass Carbon Removal) | Puro-BiCRS | Puro.earth |
| | Private CDR | Custom methodologies | Various |
| **CROSS_CUTTING** | Multi-sector | Various | Multiple |

### A.2 Calculation Parameters by Methodology Type

#### Nature-Based (ARR Example)
```json
{
  "baseline_parameters": {
    "forest_area_ha": "decimal",
    "carbon_stock_tco2e_per_ha": "decimal",
    "deforestation_rate": "decimal (0-1)",
    "forest_type": "string (enum)",
    "region": "string"
  },
  "project_parameters": {
    "forest_area_ha": "decimal",
    "carbon_stock_tco2e_per_ha": "decimal",
    "forest_growth_rate": "decimal",
    "planting_density": "decimal",
    "species_mix": "array[string]"
  },
  "leakage_parameters": {
    "activity_shifting_leakage": "decimal (0-1)",
    "market_effects_leakage": "decimal (0-1)",
    "ecological_leakage": "decimal (0-1)"
  },
  "uncertainty_parameters": {
    "confidence_level": "decimal (0-1)",
    "measurement_error": "decimal",
    "model_uncertainty": "decimal"
  }
}
```

#### Energy (Grid Renewables Example)
```json
{
  "baseline_parameters": {
    "grid_emission_factor_tco2e_mwh": "decimal",
    "baseline_generation_mwh": "decimal",
    "operating_margin": "decimal",
    "build_margin": "decimal"
  },
  "project_parameters": {
    "project_generation_mwh": "decimal",
    "metered_data": "array[monthly_mwh]",
    "capacity_mw": "decimal",
    "capacity_factor": "decimal"
  },
  "leakage_parameters": {
    "transmission_losses": "decimal (0-1)",
    "standby_power": "decimal"
  }
}
```

---

## APPENDIX B: REGISTRY API SPECIFICATIONS

### B.1 Verra Registry API

**Base URL:** `https://api.verra.org/v1`

**Authentication:** OAuth 2.0 Client Credentials

**Key Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/accounts/{accountId}/inventory` | GET | Get VCU inventory |
| `/vcus/{serialNumber}` | GET | Get VCU details |
| `/retirements` | POST | Execute retirement |
| `/retirements/{retirementId}` | GET | Get retirement status |
| `/projects/{projectId}` | GET | Get project details |

**Retirement Request:**
```json
{
  "accountId": "string",
  "vcus": [
    {
      "serialNumber": "string",
      "quantity": "decimal"
    }
  ],
  "retirementReason": "VOLUNTARY|COMPLIANCE|OTHER",
  "retirementReasonDetail": "string",
  "beneficiary": {
    "name": "string",
    "address": "string",
    "contact": "string"
  },
  "externalReference": "string"
}
```

### B.2 Gold Standard API

**Base URL:** `https://api.goldstandard.org/v1`

**Authentication:** API Key

**Key Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/holdings` | GET | Get credit holdings |
| `/credits/{creditId}` | GET | Get credit details |
| `/retirements` | POST | Execute retirement |
| `/impacts` | GET | Get impact certifications |

**Retirement Request:**
```json
{
  "creditIds": ["string"],
  "quantity": "decimal",
  "beneficiary": {
    "name": "string",
    "type": "INDIVIDUAL|ORGANIZATION",
    "statement": "string"
  },
  "sdgContributions": ["SDG13", "SDG15"],
  "clientReference": "string"
}
```

### B.3 Puro.earth API

**Base URL:** `https://api.puro.earth/v1`

**Authentication:** API Key

**Key Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/corcs` | GET | List CORCs |
| `/corcs/{corcId}` | GET | Get CORC details |
| `/retirements` | POST | Execute retirement |
| `/beneficiaries` | POST | Create beneficiary |

**Retirement Request:**
```json
{
  "corcIds": ["string"],
  "quantity": "decimal",
  "beneficiary": {
    "name": "string",
    "statement": "string",
    "public": "boolean"
  },
  "deliveryMethod": "BENEFICIARY_STATEMENT|CERTIFICATE",
  "externalReference": "string"
}
```

### B.4 Isometric API

**Base URL:** `https://api.isometric.com/v1`

**Authentication:** OAuth 2.0

**Key Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cdrs` | GET | List CDRs |
| `/cdrs/{cdrId}` | GET | Get CDR details |
| `/retirements` | POST | Execute retirement |
| `/buyers` | POST | Register buyer |

**Retirement Request:**
```json
{
  "cdrIds": ["string"],
  "quantity": "decimal",
  "buyer": {
    "name": "string",
    "traceabilityConsent": "boolean"
  },
  "durabilityPreference": "PERMANENT|LONG_TERM",
  "clientOrderId": "string"
}
```

---

## APPENDIX C: GLOSSARY

| Term | Definition |
|------|------------|
| **Activity** | A specific action or set of actions within a project that generates carbon credits |
| **ARR** | Afforestation, Reforestation, and Revegetation |
| **Baseline** | The scenario of greenhouse gas emissions that would occur without the project |
| **Batch** | A group of carbon credits issued together |
| **Beneficiary** | The entity on whose behalf carbon credits are retired |
| **Buffer Pool** | A reserve of credits set aside to cover potential reversals |
| **CDR** | Carbon Dioxide Removal |
| **CORC** | CO2 Removal Certificate (Puro.earth) |
| **Crediting Period** | The time period during which a project can generate credits |
| **Durability** | The permanence of carbon storage |
| **IFM** | Improved Forest Management |
| **Leakage** | Emissions that occur outside the project boundary as a result of the project |
| **Methodology** | A set of rules for quantifying emission reductions |
| **Monitoring Period** | The period during which project data is collected |
| **Permanence** | The long-term storage of carbon |
| **Project** | A carbon credit project that implements activities to reduce emissions |
| **REDD+** | Reducing Emissions from Deforestation and Forest Degradation |
| **Registry** | A system for tracking carbon credits |
| **Retirement** | The permanent removal of carbon credits from circulation |
| **Serial Number** | A unique identifier for a carbon credit |
| **tCO2e** | Tonnes of CO2 equivalent |
| **VCU** | Verified Carbon Unit (Verra) |
| **Verification** | The process of confirming that emission reductions have occurred |
| **Vintage** | The year in which emission reductions occurred |

---

## APPENDIX D: COMPLIANCE MATRIX

### D.1 SOC 2 Trust Service Criteria Mapping

| Criteria | Implementation | Evidence |
|----------|----------------|----------|
| **Security (CC6.1)** | Logical access controls | RBAC implementation |
| **Security (CC6.2)** | Authentication | OAuth2/OIDC, MFA |
| **Security (CC6.3)** | Authorization | Permission matrix |
| **Security (CC6.6)** | Encryption | TLS 1.3, AES-256 |
| **Security (CC6.7)** | Key management | HashiCorp Vault |
| **Availability (A1.2)** | System monitoring | Prometheus/Grafana |
| **Availability (A1.3)** | Incident response | PagerDuty integration |
| **Processing Integrity (PI1.3)** | Input validation | API validation rules |
| **Processing Integrity (PI1.4)** | Data processing | Calculation audit trail |
| **Confidentiality (C1.1)** | Data classification | PII handling procedures |
| **Privacy (P1.1)** | Notice | Privacy policy |
| **Privacy (P2.1)** | Choice and consent | Consent management |
| **Privacy (P3.1)** | Collection | Data minimization |
| **Privacy (P4.1)** | Use and retention | Retention policies |

### D.2 GDPR Article Mapping

| Article | Requirement | Implementation |
|---------|-------------|----------------|
| 5 | Principles | Data minimization, purpose limitation |
| 6 | Lawfulness | Consent management |
| 7 | Conditions for consent | Granular consent options |
| 12-14 | Transparent information | Privacy notices |
| 15 | Right of access | Self-service data export |
| 16 | Right to rectification | Profile editing |
| 17 | Right to erasure | Account deletion |
| 18 | Right to restriction | Processing pause |
| 20 | Right to portability | JSON/CSV export |
| 21 | Right to object | Opt-out mechanisms |
| 25 | Data protection by design | Privacy-by-design principles |
| 30 | Records of processing | Processing activity register |
| 32 | Security of processing | Security controls |
| 33 | Breach notification | Incident response plan |

---

## DOCUMENT REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-15 | Architecture Team | Initial release |

---

## APPROVALS

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Chief Architect | | | |
| CTO | | | |
| CISO | | | |
| Product Owner | | | |

---

*End of Document*

