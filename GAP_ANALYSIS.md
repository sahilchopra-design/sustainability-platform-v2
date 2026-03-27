# Sustainability Platform — Functional Gap Analysis
**Repository:** `sahilchopra-design/sustainability-platform`
**Date:** 2026-03-01
**Analyst:** Claude Code (claude-sonnet-4-6)
**Purpose:** Investor-grade readiness assessment for financial institutions, energy developers, real estate, supply chain, and technology sectors

---

## Executive Summary

The platform is a meaningful starting point — a FastAPI/PostgreSQL backend (Python 61.9%) with a React frontend (JavaScript 37.7%), 729 commits, and 437 source files. It has functional calculation engines for carbon footprinting, CBAM compliance, stranded assets, nature risk (TNFD LEAP), green building certifications, and traditional real estate valuation.

However, the platform has **critical structural gaps** that prevent institutional deployment:

| Severity | Count | Category |
|---|---|---|
| P0 — Blocks Production | 6 | Mock data masquerading as real analytics, no authentication/RBAC, no audit trail |
| P1 — Blocks Institutional Use | 14 | Missing sector modules, regulatory frameworks, DB relational design |
| P2 — Required for Investor Grade | 22+ | Calculation rigor, UI completeness, external data integrations |

---

## Section 1: What Is Built (Confirmed Functional)

### Backend Calculation Engines

| Engine | File | Size | Status | Notes |
|---|---|---|---|---|
| Carbon Calculator v1 | `services/carbon_calculator.py` | 16K | Functional | Scope 1/2/3 basics |
| Carbon Calculator v2 | `services/carbon_calculator_v2.py` | 33K | Functional | Enhanced methodology |
| CBAM Calculator | `services/cbam_calculator.py` | 16K | Functional | EU Articles 7, 21, 31 |
| Stranded Asset Calculator | `services/stranded_asset_calculator.py` | 64K | Functional | Reserves, power plants, infrastructure, tech disruption |
| Nature Risk Calculator | `services/nature_risk_calculator.py` | 35K | Functional | TNFD LEAP, water risk, biodiversity |
| Real Estate Valuation Engine | `services/real_estate_valuation_engine.py` | 36K | Functional | Income / Cost / Sales Comparison |
| Scenario Analysis Engine | `services/scenario_analysis_engine.py` | 41K | Functional | NGFS v2 scenarios |
| PD Calculator | `services/pd_calculator.py` | 13K | Partial | PD only — no LGD/EAD/ECL |
| Methodology Engine | `services/methodology_engine.py` | 68K | Functional | 56+ CDM/VCS/Gold Standard methodologies |
| Sustainability Calculator | `services/sustainability_calculator.py` | 41K | Functional | GRESB, LEED, BREEAM, WELL, NABERS, CASBEE |
| Portfolio Analytics Engine | `services/portfolio_analytics_engine.py` | 63K | **MOCKED** | Uses `get_sample_portfolios()` + `import random` — not connected to DB |

### Database Migrations (Applied)

| Migration | Tables Created | Status |
|---|---|---|
| 133e9046d191 — Initial Schema | `portfolios`, `scenarios`, base entities | Applied |
| 001 — CBAM | CBAM products, suppliers, embedded emissions, country risk, certificate prices | Applied |
| 002 — Stranded Assets | Reserves, power plants, infrastructure assets | Applied |
| 003 — Nature Risk | `nature_risk_assessment`, site assessments, species data (lat/lng, not PostGIS) | Applied |
| 004 — Real Estate Valuation | Property records, income/cost/sales approaches | Applied |
| 005 — Portfolio Analytics | `portfolio_analytics`, `portfolio_property_holdings` | Applied |

### Frontend Pages Deployed

`AlertsPage`, `Analysis`, `CBAMPage`, `ComparisonPage`, `CustomBuilderPage`, `Dashboard`, `DataHub`, `ImpactCalculatorPage`, `LoginPage`, `NGFSScenariosPage`, `PortfolioDetail`, `PortfolioManagerPage`, `Portfolios`, `Results`, `ScenarioBrowserPage`, `ScenarioBuilder`, `ScenarioData`, `SubAnalysisPage`

---

## Section 2: Critical P0 Gaps — Blocks Any Production Use

### P0-1: Portfolio Analytics Engine Is Entirely Mocked

**Location:** `backend/services/portfolio_analytics_engine.py`
**Evidence:** Engine imports `import random`, defines `get_sample_portfolios()` with hardcoded dict literals, and `init_sample_data()`. All KPI cards, risk metrics, and concentration analysis use hardcoded or randomly generated values.
**Impact:** Portfolio managers and investment teams see fake numbers. This is the core module for portfolio-level reporting.
**Fix Required:**
- Wire `portfolio_analytics` and `portfolio_property_holdings` (Migration 005 tables) to all engine methods
- Remove all `import random` usage from analytics calculations
- Build real DB query layer: `get_portfolio(db, id)`, `get_holdings(db, portfolio_id)`, aggregation queries
- Replace `get_sample_portfolios()` with `db.query(PortfolioAnalytics).all()`

---

### P0-2: No Authentication or Role-Based Access Control

**Location:** `backend/api/auth.py`, `backend/api/auth_pg.py` — deferred per `plan.md`
**Impact:** No institutional client can connect without user identity, permissions, or data isolation. A portfolio manager at Bank A would see Bank B's data.
**Fix Required:**
- Implement JWT + OAuth2 with scopes (read, write, admin per module)
- Add `org_id` / `tenant_id` foreign key to every table
- RBAC: Portfolio Manager, Risk Analyst, Read-Only Viewer, System Admin, Compliance Officer roles
- Row-level security (PostgreSQL RLS) per `org_id`

---

### P0-3: No Audit Trail

**Location:** No `audit_log` table in any migration
**Impact:** Financial institutions (banks, insurance companies, asset managers) are subject to regulatory audit requirements (BCBS 239, GDPR, MiFID II). Every calculation, input change, and export must be traceable.
**Fix Required:**
- Create `audit_log` table: `(id, org_id, user_id, action, entity_type, entity_id, old_values JSONB, new_values JSONB, ip_address, timestamp)`
- Implement FastAPI middleware to intercept all POST/PUT/DELETE operations
- Immutable audit records (append-only, no updates/deletes)
- Calculation audit: capture every engine run with inputs, parameters, output, engine version

---

### P0-4: No Cross-Module Data Linkage

**Location:** All modules use isolated, unlinked tables
**Evidence:** Carbon module (`db/models/carbon.py`), CBAM (`db/models/cbam.py`), Stranded Assets (migration 002), Nature Risk (migration 003), Real Estate (migration 004), Portfolio (migration 005) share no foreign keys
**Impact:** A financial institution cannot run an integrated climate risk assessment across a portfolio that combines real estate, fossil fuel exposure, and supply chain — the core use case.
**Fix Required:**
- Introduce `entities` table as universal anchor: `(id UUID, org_id, entity_type ENUM [company/asset/portfolio/fund/counterparty], name, sector, country_iso, ...)`
- Add `entity_id` FK to every module's assessment tables
- Portfolio → holdings → entity → module assessments (hierarchical join)
- Build cross-module `climate_risk_summary` view

---

### P0-5: Nature Risk Uses lat/lng Floats — No Spatial Query Capability

**Location:** `backend/alembic/versions/003_add_nature_risk_tables.py`
**Evidence:** Migration comment: *"PostGIS geometry columns replaced with latitude/longitude float columns... For production PostGIS deployments, these can be migrated to native geometry types."*
**Impact:** Spatial intersection queries (asset location vs. biodiversity hotspot, flood zone, water stress area) are not performable at scale with float columns. Aqueduct water risk, WDPA protected areas, and KBA data all require spatial joins.
**Fix Required:**
- Enable PostGIS extension on PostgreSQL
- Migrate lat/lng columns to `geometry(Point, 4326)` with spatial index
- Add spatial reference layers: flood zones (Fathom/JBA), biodiversity (WDPA, KBA), water stress (WRI Aqueduct)
- ST_Within / ST_Intersects queries for asset-to-hazard mapping

---

### P0-6: No Time-Series Architecture

**Location:** `plan.md` mentions TimescaleDB as optional; not implemented
**Impact:** Forward-looking climate risk requires storing scenario trajectories, carbon price paths, valuation time series, and portfolio evolution over time. Flat tables cannot serve forecasting teams efficiently.
**Fix Required:**
- Enable TimescaleDB extension or use partitioned tables by `assessment_date`
- Add `scenario_trajectory_points` table: `(scenario_id, variable, year, value, confidence_interval_low, confidence_interval_high)`
- Hypertable on `assessment_date` for all time-series-heavy tables
- Implement time-window APIs: rolling 12M VaR, trailing 3Y transition risk

---

## Section 3: P1 Gaps — Missing Sector Modules

### 3.1 Financial Sector Module (Banks, Insurance, Asset Managers)

**Current State:** PD calculator exists (`pd_calculator.py`). No other credit risk or regulatory capital modules.

#### 3.1.1 Credit Risk — Climate-Adjusted ECL (IFRS 9)

**Gap:** No Loss Given Default (LGD), Exposure at Default (EAD), or Expected Credit Loss (ECL) models incorporating climate risk
**Required Additions:**
```
POST /api/v1/financial/ecl/calculate
  inputs: counterparty_id, exposure_type, sector, region, scenario_id, horizon_years
  outputs: pd_adjusted, lgd_climate_adjusted, ead, ecl_stage1, ecl_stage2, ecl_stage3
  methodology: BCBS climate risk PD/LGD overlay, EBA GL/2022/16
```
- Climate PD uplift using sector transition risk scores (aligned with EBA stress test methodology)
- Physical risk LGD haircut based on collateral location flood/heat exposure
- Stage migration probability under climate scenarios (1P → 2P → 3P)
- IFRS 9 ECL disclosure output (IAS 39 comparison available)

#### 3.1.2 Regulatory Capital — Climate Pillar 2 (Basel III/IV)

**Gap:** No ICAAP climate risk capital add-on calculation
**Required:**
- Climate risk RWA overlay (EBA Discussion Paper 2021)
- Pillar 2 capital buffer recommendation based on transition + physical risk exposure
- Climate stress scenario capital adequacy test
- Concentration risk in carbon-intensive sectors

#### 3.1.3 Insurance Module

**Gap:** Entirely absent
**Required:**
- Catastrophe (CAT) risk model integration (for physical risk underwriting)
- Climate-adjusted technical provisions (Solvency II Article 44a)
- Reserve adequacy under 1.5°C / 2°C / 3°C physical scenarios
- Underwriting ESG screening (coal exclusion, oil sands exclusion policies)
- Reinsurance protection gap analysis

#### 3.1.4 Asset Management / Fund-Level

**Gap:** No SFDR fund classification or PAI reporting
**Required:**
- Fund-level SFDR Article 6/8/9 classification engine
- 14 mandatory PAI (Principal Adverse Impact) indicators:
  - GHG intensity, carbon footprint, GHG intensity of investee companies
  - Exposure to fossil fuels, non-renewable energy, energy consumption intensity
  - Board gender diversity, GHG intensity of sovereign bonds, etc.
- 46 optional PAI indicators (select by strategy)
- SFDR periodic report template generator
- EU Taxonomy alignment % (turnover, capex, opex)

#### 3.1.5 Green Finance Assessment

**Gap:** No green bond / sustainability-linked bond (SLB) module
**Required:**
- ICMA Green Bond Principles alignment checker
- SLB KPI selection and target calibration
- Use of proceeds tracker
- Second Party Opinion (SPO) checklist
- Transition bond eligibility (Climate Bonds Initiative taxonomy)

---

### 3.2 Energy Sector Module

**Current State:** Stranded assets well covered. Missing project-level energy finance.

**Required Additions:**
- **Renewable Energy Project Finance:** LCOE (Levelized Cost of Energy) calculator, P50/P90 energy yield, IRR sensitivity to carbon prices, PPA (Power Purchase Agreement) risk metrics
- **Power Grid Risk:** Interconnection queue risk, curtailment risk, transmission constraint scoring
- **Energy Storage:** Battery degradation model, round-trip efficiency loss, replacement capex under climate scenarios
- **Hydrogen Economy:** Green/blue/grey hydrogen cost pathways, electrolyzer utilization, demand scenario modeling
- **Oil & Gas Scope 3 Category 11:** End-use combustion emissions for lenders / investors (mandatory under GHG Protocol)
- **Energy Efficiency Retrofit:** Cost-benefit analysis for energy efficiency improvements, payback period, NPV of retrofit vs. stranding

---

### 3.3 Supply Chain Module (Entirely Missing)

**Current State:** No supply chain module exists in any form.

**Required Modules:**
```
/api/v1/supply-chain/
  /scope3-mapping          # GHG Protocol Category 1-15 supply chain emissions
  /supplier-scoring        # ESG risk score per Tier 1/2/3 supplier
  /disruption-modeling     # Climate disruption probability by geography
  /deforestation-risk      # EUDR (EU Deforestation Regulation) compliance
  /forced-labor-screening  # Modern Slavery Act, LkSG (Germany), CSDD
  /water-intensity         # Supplier water stress exposure mapping
```

**Database Tables Required:**
- `supply_chain_entities` (suppliers, sub-suppliers, tier mapping)
- `scope3_categories` (Category 1-15 with emissions by category)
- `supplier_esg_scores` (environmental, social, governance scores)
- `supply_chain_disruptions` (historical + modeled disruption events)
- `supplier_locations` (PostGIS geometry for climate hazard overlay)

---

### 3.4 Technology Sector Module (Entirely Missing)

**Current State:** No technology-specific ESG module.

**Required:**
- **Data Center Emissions:** PUE (Power Usage Effectiveness) based Scope 2 calculator, server lifecycle emissions (embodied carbon), cooling system assessment
- **Cloud Computing:** Scope 3 Category 1 emissions from cloud providers (AWS, Azure, GCP carbon intensity by region)
- **Semiconductor Supply Chain:** Water intensity (TSMC-level: 156L per wafer), rare earth minerals risk
- **AI Model Carbon Footprint:** Training + inference emissions, model efficiency metrics
- **Hardware Lifecycle:** Electronics recycling rate, e-waste, circular economy metrics
- **Digital Product Carbon Labeling:** ISO 14044 LCA for software products

---

### 3.5 Agriculture & Food Module

**Current State:** Referenced in methodology engine (CDM/VCS carbon credits for agriculture). No dedicated module.

**Required:**
- Crop yield climate risk (temperature + precipitation scenarios per IPCC AR6)
- Deforestation risk scoring (EUDR compliance tracker)
- Soil carbon sequestration calculator
- Water stress impact on agricultural output
- Food security risk index
- Regenerative agriculture transition pathways

---

### 3.6 Mining & Extractives Module

**Current State:** Referenced in methodology engine (mine methane CDM). No dedicated module.

**Required:**
- Tailings facility risk assessment (GISTM standard)
- Water use intensity (megalitres per tonne of ore)
- Acid mine drainage risk
- Community impact assessment (Free Prior and Informed Consent — FPIC)
- Mine closure cost provisioning under stranding scenario
- Critical minerals supply security (lithium, cobalt, nickel for energy transition)

---

## Section 4: P1 Gaps — Regulatory Framework Coverage

| Framework | Region | Deadline | Status | Gap |
|---|---|---|---|---|
| SFDR (Sustainable Finance Disclosure Regulation) | EU | Live | Missing | No PAI templates, no Art. 6/8/9 classification |
| EU Taxonomy | EU | Live | Missing | No alignment assessment across all 6 environmental objectives |
| CSRD (Corporate Sustainability Reporting Directive) | EU | 2024–2028 phased | Missing | No double materiality assessment tool |
| TCFD | Global | Live | Partial | Scenario analysis exists; TCFD 11-recommendation structure absent |
| ISSB IFRS S1/S2 | Global | 2024+ | Missing | No disclosure template aligned with S1 (general) or S2 (climate) |
| SEC Climate Disclosure Rule | USA | 2025+ | Missing | No Scope 1/2 disclosure workflow, no material risk narrative |
| UK TCFD (mandatory) | UK | Live | Missing | No UK-specific TCFD report output |
| APRA CPG 229 | Australia | Live | Missing | No prudential climate risk framework |
| MAS Notice 657 | Singapore | Live | Missing | No MAS-aligned climate risk categorisation |
| GRI 305 (Emissions) | Global | Live | Missing | No GRI-structured emissions reporting |
| SASB Industry Standards | Global | Live | Missing | No sector-specific SASB metrics (77 industry standards) |
| CBAM | EU | Live (Oct 2023) | **Built** | Full implementation — Articles 7, 21, 31 |
| TNFD (Nature) | Global | 2023 | Partial | LEAP built; no full TNFD disclosure template |
| EUDR | EU | 2025 | Missing | No deforestation commodity traceability |
| EU ETS (Phase 4) | EU | Live | Missing | No allowance allocation or auction price forecasting |

---

## Section 5: P2 Gaps — Real Estate Sector Deep-Dive

### 5.1 What's Built

- Traditional valuation: Income Approach (DCF/Cap Rate), Cost Approach, Sales Comparison Approach
- Green building certification value impact: GRESB, LEED, BREEAM, NABERS, WELL
- Property type coverage: Office, Retail, Industrial, Multifamily, Hotel, Healthcare, Data Center, Mixed Use

### 5.2 Critical Real Estate Gaps

#### 5.2.1 Climate Value-at-Risk (CLVaR)

**Gap:** No climate-adjusted VaR on property values
**Required Calculation Engine:**
```
CLVaR = Physical_VaR + Transition_VaR
Physical_VaR   = Σ(hazard_prob × damage_fraction × asset_value × exposure_factor)
Transition_VaR = Σ(carbon_cost_path × energy_intensity × floor_area × years_to_horizon)
```
- Physical hazards: flood (1:20, 1:100, 1:200 year return periods), heat stress (cooling demand uplift), wind (1% AEP), sea level rise (RCP 2.6 / 4.5 / 8.5)
- Transition hazards: EPC stranding risk, carbon pricing pass-through, energy retrofit capex
- Framework references: ECB climate risk stress test, NGFS physical risk scenarios, Black Knight/MSCI CLVaR

#### 5.2.2 CRREM Carbon Risk Real Estate Monitor

**Gap:** No CRREM pathway integration
**Required:**
- CRREM 1.5°C and 2°C decarbonisation pathways by property type and country
- Stranding year calculation: when asset's energy intensity crosses the pathway threshold
- Retrofit gap: energy intensity delta between current and pathway, capex estimate
- CRREM public dataset integration (downloadable Excel → DB import)

#### 5.2.3 EPC (Energy Performance Certificate) Integration

**Gap:** No EPC data or transition risk from EPC regulatory changes
**Required:**
- EPC rating input (A-G across EU, A+–G in UK, 1–6 in Australia)
- EPC transition risk: regulatory minimum EPC threshold timelines by jurisdiction
- Stranding probability: % of portfolio below minimum EPC threshold in each regulation year
- EPC improvement cost model: retrofit cost by rating band and property type
- Link to public EPC registries (where available via API: England & Wales EPC Register, Dutch EP Online, etc.)

#### 5.2.4 Physical Risk — Asset-Level Hazard Mapping

**Gap:** No physical hazard overlay on property locations
**Required Hazard Layers:**
- **Flood:** Fathom Global Flood Model or JBA Risk Management (100-year fluvial + coastal flood depth)
- **Heat Stress:** WBGT (Wet Bulb Globe Temperature), cooling degree days, overheating risk (CIBSE TM59)
- **Wildfire:** FIRMS (NASA Fire Information), WUI (Wildland Urban Interface) zones
- **Sea Level Rise:** NOAA / Copernicus SLR projections by scenario
- **Tropical Cyclone / Wind:** IBTrACS historical + NatCat modelled wind speed
- **Subsidence / Soil:** BGS GeoSure (UK), BRGM (France) for clay shrink-swell
**Required Output:** Physical risk score (0–100) per asset, annual probability of loss, probable maximum loss (PML)

#### 5.2.5 Green Premium / Brown Discount Quantification

**Gap:** No empirical green premium / brown discount module
**Required:**
- Hedonic regression-based premium calculator (configurable coefficients by market)
- Reference data: JLL Green Building Premium research, MSCI IPD green premium dataset references
- Brown discount: quantified rental and capital value discount for sub-EPC-D assets post-2030
- Sensitivity: premium/discount as function of carbon price trajectory

#### 5.2.6 Nature Assessment for Real Estate

**Gap:** Nature risk calculator exists as standalone; not integrated with real estate valuation
**Required:**
- Biodiversity net gain assessment per development site (UK BNG regulation, EU Nature Restoration Law)
- Proximity to protected areas (WDPA, Natura 2000, Ramsar) — value impact factor
- Green infrastructure value uplift (parks, green corridors within 400m)
- Water risk impact on property value (WRI Aqueduct — rental income at risk from water disruption)

#### 5.2.7 RICS Red Book ESG Integration (PS 1/2, VPS 4)

**Gap:** No RICS-compliant ESG valuation narrative or adjustment methodology
**Required:**
- RICS Professional Standard PS 1 (effective January 2022) checklist integration
- ESG factor adjustment documentation: narrative output per RICS VPS 4 requirements
- Comparable selection methodology: RICS guidance on ESG-adjusted comparables
- Uncertainty disclosure: RICS uncertainty in valuations guidance (VPG3)
- IVSC IVS 104/400 ESG factor integration commentary

#### 5.2.8 Residential Real Estate Module

**Gap:** Property types only cover commercial (Office, Retail, Industrial, etc.)
**Required:**
- Residential property subtypes: Single Family, Multi-Family, Social Housing, Purpose-Built Student Accommodation (PBSA)
- Residential-specific valuation (comparable sales method, Automated Valuation Model [AVM] integration hooks)
- Mortgage portfolio climate risk: LTV climate stress, mortgage book EPC distribution
- Affordable housing decarbonisation pathways

---

## Section 6: P2 Gaps — Calculation Engine Quality & Rigor

### 6.1 Mock / Random Data in Production Engines

| File | Issue | Evidence |
|---|---|---|
| `portfolio_analytics_engine.py` | `import random` for metric generation | `random.uniform()` calls in KPI calculations |
| `portfolio_analytics_engine.py` | Hardcoded sample portfolios | `get_sample_portfolios()` dict literals |
| `portfolio_analytics_engine.py` | No DB session parameter | Functions call `init_sample_data()` not `db.query()` |

### 6.2 Missing Validation Summaries per Calculation

**Gap:** No per-calculation validation output showing inputs, methodology, parameters, and outputs
**Required for every engine endpoint:**
```json
{
  "validation_summary": {
    "calculation_id": "uuid",
    "engine_version": "1.2.3",
    "methodology_reference": "RICS Red Book 2022 / CRREM 2023 v2",
    "inputs_captured": { "property_type": "office", "floor_area_m2": 5000, ... },
    "parameters_applied": { "cap_rate": 0.0575, "vacancy_adjustment": 0.08, ... },
    "data_sources": ["CoStar Q4 2025", "CRREM 2023 pathways", "EPC England Register"],
    "data_quality_flags": ["EPC rating interpolated — no direct match"],
    "outputs": { "income_value": 15200000, "cost_value": 14800000, "reconciled_value": 15000000 },
    "confidence_score": 0.82,
    "timestamp": "2026-03-01T10:00:00Z",
    "computed_by": "user_uuid"
  }
}
```

### 6.3 No Monte Carlo / Uncertainty Quantification

**Gap:** All engines return point estimates. No probabilistic outputs.
**Required:**
- Monte Carlo simulation wrapper (10,000 iterations minimum) for key engines: CLVaR, PD, stranded asset impairment
- Output: P5, P25, P50, P75, P95 percentile values per metric
- Tornado chart data: parameter sensitivity ranking
- Bootstrap confidence intervals on regression-based metrics

### 6.4 No Backtesting Framework

**Gap:** No validation of model outputs against observed historical outcomes
**Required:**
- Historical climate event dataset for physical risk model backtesting
- PD model validation: Gini coefficient, KS statistic, Brier score, AUC-ROC
- Carbon price model: out-of-sample forecast error (RMSE, MAE)
- Reporting: annual model performance report per engine

### 6.5 Parameter Governance

**Gap:** Hardcoded parameters scattered across engine files (e.g., `CO2_FACTOR = Decimal("3.664")` in two separate calculators; cap rates, discount rates, emission factors embedded in code)
**Required:**
- `parameters` table in DB: `(id, name, category, value, unit, effective_date, source, approved_by, is_active)`
- Parameter versioning and approval workflow
- Override mechanism: users can propose parameter changes; compliance officer approves
- Parameter audit trail (which parameters were used in each calculation)

---

## Section 7: Database Relational Design Enhancement

### 7.1 Missing Core Tables

```sql
-- Universal entity anchor
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id),
  entity_type VARCHAR(50) NOT NULL, -- company | asset | portfolio | fund | counterparty
  name VARCHAR(500) NOT NULL,
  sector_gics VARCHAR(10),          -- GICS sector code
  sector_sasb VARCHAR(50),          -- SASB industry
  country_iso CHAR(3),
  region VARCHAR(100),
  isin VARCHAR(12),                  -- for listed entities
  lei VARCHAR(20),                   -- Legal Entity Identifier (mandatory for EU)
  nace_code VARCHAR(6),             -- EU classification
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-tenancy
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  org_type VARCHAR(50),              -- bank | insurance | asset_manager | energy | real_estate
  jurisdiction VARCHAR(3),          -- primary regulatory jurisdiction
  subscription_tier VARCHAR(20),    -- basic | professional | institutional
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users with RBAC
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id),
  email VARCHAR(320) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,         -- admin | portfolio_manager | risk_analyst | viewer | compliance
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immutable audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,      -- CREATE | UPDATE | DELETE | CALCULATE | EXPORT
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Parameter governance
CREATE TABLE calculation_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organisations(id),   -- NULL = platform default
  parameter_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  value NUMERIC NOT NULL,
  unit VARCHAR(50),
  effective_date DATE NOT NULL,
  expiry_date DATE,
  source TEXT,
  methodology_reference TEXT,
  approved_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regulatory reporting
CREATE TABLE regulatory_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id),
  framework VARCHAR(50) NOT NULL,    -- SFDR | TCFD | CSRD | ISSB | SEC | APRA
  report_period_start DATE,
  report_period_end DATE,
  status VARCHAR(30),                -- draft | under_review | approved | submitted
  submitted_at TIMESTAMPTZ,
  content JSONB,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-module climate risk summary
CREATE TABLE entity_climate_risk_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id),
  assessment_date DATE NOT NULL,
  scenario_id UUID,
  -- Physical risk
  physical_risk_score NUMERIC(5,2),
  flood_risk_score NUMERIC(5,2),
  heat_risk_score NUMERIC(5,2),
  wildfire_risk_score NUMERIC(5,2),
  -- Transition risk
  transition_risk_score NUMERIC(5,2),
  stranded_asset_value_at_risk NUMERIC(20,2),
  carbon_cost_exposure NUMERIC(20,2),
  -- Financial impact
  pd_adjustment_bps NUMERIC(8,2),
  lgd_adjustment_pct NUMERIC(8,4),
  value_at_risk_pct NUMERIC(8,4),
  -- Nature
  nature_risk_score NUMERIC(5,2),
  biodiversity_impact_score NUMERIC(5,2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_id, assessment_date, scenario_id)
);
```

### 7.2 Required Foreign Key Relationships (Currently Missing)

```
entities ← carbon_assessments.entity_id
entities ← cbam_declarations.entity_id
entities ← stranded_asset_impairments.entity_id
entities ← nature_risk_assessment.entity_id
entities ← real_estate_valuations.entity_id
entities ← portfolio_property_holdings.asset_entity_id
portfolio_analytics ← portfolio_property_holdings.portfolio_id
portfolio_property_holdings ← entities.id (asset)
regulatory_reports ← entities (portfolio/fund level)
```

---

## Section 8: UI/Frontend Enhancement Requirements

### 8.1 Interactive Assessment Tool — Per Module

Each calculation module page must include:
1. **Input Panel (left 40%)** — Form with real-time field validation, tooltips with methodology references, "Load from DB" option for saved entities
2. **Calculation Engine Selector** — Dropdown to choose methodology variant (e.g., for real estate: Income vs. Cost vs. Sales Comparison vs. CLVaR)
3. **Results Panel (right 60%)** — Live-updating output charts, no page reload
4. **Validation Summary Card** — Collapsible: inputs used, parameters, methodology version, data sources, confidence score
5. **Sensitivity Tornado Chart** — Top 5 parameters driving output variance
6. **Export Bar** — PDF (RICS/TCFD/SFDR formatted), Excel (model workbook), JSON (API-ready)

### 8.2 Pending Frontend Components (from emergent_todos.json)

All the following are tracked as pending and must be built:
- `ScenarioTemplateGallery.tsx` — with filtering and search
- `ParameterConfigurator.tsx` — organized parameter groups with validation
- `TrajectoryVisualizer.tsx` — interactive charts with editable points
- `ScenarioImpactPreviewPanel.tsx` — quick impact calculation widget
- `ScenarioVersionTimeline.tsx` — version history view
- `ScenarioComparisonView.tsx` — side-by-side scenario comparison

### 8.3 Missing Dashboard Capabilities

- **Portfolio Heatmap:** Asset grid coloured by physical/transition risk (lat/lng or region)
- **Regulatory Calendar:** Timeline of reporting deadlines per framework (SFDR, CSRD, TCFD)
- **Data Quality Dashboard:** Completeness score per entity, missing field indicators
- **Alert Threshold Configuration:** User-configurable threshold rules triggering alerts (AlertsPage exists but no threshold UI)
- **Peer Benchmark View:** Portfolio vs. sector average metrics (requires benchmark data tables)

---

## Section 9: Public Data Source Integrations

| Data Source | Type | Coverage | Module | Integration Status |
|---|---|---|---|---|
| NGFS Scenarios (IIASA) | Scenario data | Climate pathways | Scenario Analysis | Partially wired |
| WRI Aqueduct | Water risk layers | Global | Nature Risk, Real Estate | Referenced; not integrated |
| WDPA (Protected Planet) | Biodiversity | Global | Nature Risk | Not integrated |
| Fathom Global | Flood risk | 200+ countries | Real Estate, Nature Risk | Not integrated |
| CRREM | RE carbon pathways | EU + global | Real Estate | Not integrated |
| IEA World Energy Outlook | Energy data | Global | Energy, Stranded Assets | Not integrated |
| EU ETS Carbon Prices (Ember) | Carbon price | EU | CBAM, Carbon | Not integrated |
| EPC Registers | Building energy ratings | UK, EU | Real Estate | Not integrated |
| Global Forest Watch | Deforestation | Global | Supply Chain | Not integrated |
| OpenBuildingMap | Building footprints | Global | Real Estate | Not integrated |
| CDP Scores | Corporate disclosure | 23,000+ companies | All sectors | Not integrated |
| World Bank Climate APIs | Macro climate data | Global | All | Not integrated |
| MSCI ESG ratings | Entity ESG scores | 14,000+ companies | Financial | Not integrated |
| S&P Trucost | Environmental cost | 15,000+ companies | Financial, Supply Chain | Not integrated |

---

## Section 10: Implementation Roadmap (Bottom-Up)

### Phase 0 — Foundation (Weeks 1–4): Prerequisite for Everything

1. `organisations` + `users` tables + JWT auth + RBAC
2. `entities` universal anchor table with LEI/ISIN/NACE
3. `audit_log` partitioned table + FastAPI middleware
4. `calculation_parameters` governance table
5. PostGIS enable + migrate nature risk lat/lng → geometry
6. Remove all `import random` + hardcoded dicts from portfolio analytics engine
7. Wire portfolio analytics to Migration 005 tables with real DB queries

### Phase 1 — Core Financial Module (Weeks 5–10)

1. Climate-adjusted ECL engine (PD + LGD + EAD + ECL staging)
2. SFDR PAI calculator (14 mandatory indicators)
3. EU Taxonomy alignment assessment tool
4. TCFD 11-recommendation structured output
5. Cross-module `entity_climate_risk_summary` table + aggregation API
6. Counterparty climate risk scoring API

### Phase 2 — Real Estate Depth (Weeks 11–16)

1. CLVaR engine (physical + transition)
2. CRREM pathway integration (CSV import + API)
3. EPC transition risk module
4. PostGIS hazard overlay: Fathom flood + WRI Aqueduct + heat stress
5. Green premium / brown discount quantification
6. RICS Red Book ESG narrative generator
7. Nature risk ↔ real estate integration

### Phase 3 — Supply Chain & Sector Modules (Weeks 17–24)

1. Supply chain entity model + Scope 3 Category 1-15 calculator
2. Supplier ESG scoring framework
3. Technology sector module (data center + cloud emissions)
4. Agriculture module (crop risk, deforestation, EUDR)
5. Insurance actuarial climate risk module
6. Energy project finance module (LCOE, PPA risk)

### Phase 4 — UI Interactive Assessment Tool (Weeks 25–30)

1. Rebuild all module pages as interactive assessment tools with:
   - Real-time calculation triggers
   - Validation summary panels
   - Sensitivity tornado charts
   - Multiple engine selector
2. Build all pending scenario builder components
3. Portfolio heatmap with asset-level drill-down
4. Regulatory reporting module (SFDR, TCFD, CSRD templates)

### Phase 5 — Data Integrations & Production Hardening (Weeks 31–36)

1. NGFS data pipeline (full integration)
2. WRI Aqueduct water risk layer
3. WDPA biodiversity layer
4. CRREM pathways automated update
5. EPC register API connectors
6. Monte Carlo simulation framework (portfolio-level)
7. Backtesting framework for PD, CLVaR
8. TimescaleDB hypertables for time-series data
9. End-to-end regression test suite

---

## Section 11: Technology Stack Recommendations

| Component | Current | Recommended Addition |
|---|---|---|
| Spatial DB | lat/lng floats | PostGIS 3.x (already PostgreSQL) |
| Time-series | Flat tables | TimescaleDB extension |
| Task Queue | None visible | Celery + Redis (long-running Monte Carlo) |
| Caching | None visible | Redis for scenario trajectories + parameter cache |
| Data Pipeline | Manual | Apache Airflow or Prefect for scheduled data feeds |
| Auth | Deferred | Auth0 or Keycloak (OIDC/OAuth2 + SAML for enterprise SSO) |
| Search | None | PostgreSQL full-text or Elasticsearch for entity search |
| Export | PDF/Excel | Apache POI (server-side Excel) + WeasyPrint (PDF) |
| Testing | `tests/` directory exists | pytest + Hypothesis (property-based) + locust (load) |

---

*This gap analysis was produced by automated codebase review. All findings are based on direct inspection of source files, migration scripts, schemas, and service implementations in commit range as of 2026-03-01.*
