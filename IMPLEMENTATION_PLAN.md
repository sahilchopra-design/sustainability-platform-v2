# Implementation Plan — Gap Resolution Across Three Categories

> **Document Type:** Technical Implementation Plan
> **Scope:** All gaps identified in USER_STORY_DBS.md (Financial Investment Expert) and USER_STORY_ENERGY_EXPERT.md (Sustainable Energy Expert)
> **Platform:** A2 Intelligence — Risk Analytics Platform
> **Date:** 2026-03-03
> **Author:** A2 Intelligence Engineering

---

## Overview

Twenty-two distinct capability and data gaps have been identified across both user stories. This plan resolves them across three precisely defined tracks:

| Track | Description | Responsibility |
|-------|-------------|----------------|
| **Category A** | Gaps solvable by publicly available data — resolved via a **separate A2 Data Hub application** that aggregates, normalises and serves public data via API to the main platform | Separate application build |
| **Category B** | Gaps that are computation/logic deficits — resolved by **building new features directly in the main A2 Intelligence platform** | Main platform development |
| **Category C** | Gaps that require **client-proprietary data** — resolved by building structured data intake UI (wizards, upload forms, guided entry screens) within the main platform | Main platform — data intake layer |

All three tracks run in parallel. Category B features that depend on data from Category A are clearly flagged with a [NEEDS DATA HUB] dependency marker.

---

## CATEGORY A — A2 Data Hub: Separate Data Aggregation Application

### A.1 Application Purpose

The A2 Data Hub is a standalone microservice responsible for:
1. **Ingesting** publicly available datasets from 20+ free sources on defined schedules
2. **Normalising** all data into canonical schemas aligned to the main platform's data model
3. **Caching** processed data in a PostgreSQL database for fast retrieval
4. **Serving** structured data to the main A2 Intelligence platform via a versioned REST API

The main platform **never calls public APIs directly** for reference data. It calls the Data Hub instead. This decouples data sourcing from analytics logic and allows independent scaling and refresh of each data source.

---

### A.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    A2 Data Hub (Port 8002)                       │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  Ingestion   │   │  Normaliser  │   │   REST API Layer     │ │
│  │  Pipelines   │──▶│  & Validator │──▶│   /api/v1/           │ │
│  │  (scheduled) │   │              │   │   FastAPI            │ │
│  └──────────────┘   └──────────────┘   └──────────────────────┘ │
│         │                                         │              │
│  ┌──────▼──────────────────────────────────────── ▼────────────┐ │
│  │               PostgreSQL  (data_hub schema)                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │  REST API calls
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              A2 Intelligence Platform (Port 8001)                │
│  calls  http://localhost:8002/api/v1/{endpoint}                  │
│  on:    entity lookup, glidepath fetch, sanctions check, etc.    │
└─────────────────────────────────────────────────────────────────┘
```

**Technology stack:**
- **Backend:** FastAPI (Python 3.12) — same stack as main platform; runs as a separate process
- **Database:** PostgreSQL (shared Supabase instance, separate `data_hub` schema) OR dedicated schema within the existing DB
- **Task scheduler:** APScheduler (in-process) for refresh jobs; upgradeable to Celery + Redis
- **Cache layer:** Redis (optional — for sub-second API responses on hot endpoints like sanctions screening)
- **Port:** 8002 (configurable via environment variable `DATA_HUB_PORT`)
- **Auth:** Internal API key (`DATA_HUB_API_KEY` env variable) — main platform passes this key in every request header; no external exposure

**File location:** `data_hub/` directory at the project root, parallel to `backend/`

```
data_hub/
├── server.py                    # FastAPI app entry point
├── db/
│   ├── models.py                # SQLAlchemy models for all hub tables
│   └── migrations/              # Alembic migrations (dh_001 onwards)
├── ingestion/
│   ├── base.py                  # BaseIngester abstract class
│   ├── global_energy_monitor.py
│   ├── ngfs_scenarios.py
│   ├── climate_trace.py
│   ├── gleif_lei.py
│   ├── sanctions.py             # OFAC + EU FSL + UN SC
│   ├── violation_tracker.py
│   ├── gdelt.py
│   ├── sec_edgar.py
│   ├── owid.py
│   ├── world_bank.py
│   ├── wwf_risk_filter.py
│   ├── crrem.py
│   ├── irena_lcoe.py
│   ├── sbti_targets.py
│   ├── acled.py
│   ├── influencemap.py
│   ├── grid_emission_factors.py
│   └── scheduler.py             # APScheduler job definitions
├── api/
│   └── v1/
│       ├── routes/
│       │   ├── entities.py
│       │   ├── emissions.py
│       │   ├── glidepaths.py
│       │   ├── coal_plants.py
│       │   ├── nature_risk.py
│       │   ├── sanctions.py
│       │   ├── controversy.py
│       │   ├── financials.py
│       │   ├── carbon_price.py
│       │   ├── lcoe.py
│       │   └── health.py
│       └── router.py
├── requirements.txt
└── README.md
```

---

### A.3 Data Sources — Ingestion Schedule and Gaps Resolved

| Source | Refresh | Gaps Resolved | Commercial License | Priority |
|--------|---------|---------------|--------------------|----------|
| **Global Energy Monitor (GCPT + renewables)** | Quarterly | Stranded Assets pre-load, Power Plant benchmarks, Steel/Shipping plant data | Open | P0 |
| **NGFS Scenarios Portal** | Annual (phase updates) | NZBA glidepaths, ITR reference curves, carbon price trajectories, physical risk | Free & open | P0 |
| **Climate TRACE** | Annual | Portfolio emissions benchmarks (PCAF DQS 4 fallback), WACI computation | CC BY 4.0 | P0 |
| **GLEIF LEI bulk database** | Daily | PCAF counterparty identification, entity resolution, corporate hierarchies | Free & open | P0 |
| **OFAC SDN + EU FSL + UN SC** | Daily | Sanctions screening (regulatory compliance gap) | Free & open | P0 |
| **Our World in Data (CO₂, energy)** | Monthly | Sector emission intensity benchmarks (IEA commercial-safe alt.) | CC BY 4.0 | P0 |
| **SEC EDGAR XBRL/JSON API** | Real-time on demand | PCAF EVIC denominator for US-listed borrowers, financial statements | Public domain | P0 |
| **yfinance + FMP** | Real-time on demand | PCAF EVIC for globally-listed borrowers | Free (yfinance) / 250 req/day (FMP) | P0 |
| **World Bank ESG DataBank** | Annual | Country-level sovereign ESG, macro risk context for Portfolio Analytics | Open API | P1 |
| **Violation Tracker (US + UK + Global)** | Monthly | Controversy screening for portfolio ESG score | Free & open | P1 |
| **GDELT (BigQuery)** | 15-min events | ESG event monitoring, controversy detection, media tone scoring | Free & open | P1 |
| **InfluenceMap / LobbyMap** | Weekly | Transition risk — climate lobbying grade per company | Free (public profiles) | P1 |
| **SBTi Target Registry** | Weekly | Counterparty engagement tracker — announced targets vs. DBS/lender expectations | Free | P1 |
| **CRREM Pathways** | Per version release | Real estate CRREM glidepath curves (by country + asset type) | No redistribution — internal use | P1 |
| **IRENA LCOE Statistics** | Annual | Power Plant LCOE benchmarks by technology and country | Free download | P1 |
| **WDPA (Protected Areas)** | Semi-annual | TNFD LEAP spatial layer — protected area boundaries | CC BY | P1 |
| **Global Forest Watch** | Near real-time | Nature risk deforestation layer, EUDR compliance, supply chain | CC BY 4.0 | P1 |
| **WWF Risk Filter Suite** | Periodic | Biodiversity + water risk scores for TNFD LEAP | Non-commercial free (confirm commercial) | P1 |
| **ACLED conflict events** | Weekly | Country-level political/conflict risk for physical risk overlay | Free (registration) | P2 |
| **Grid emission factors (SEA)** | Quarterly | Carbon Calculator baseline — Philippines DOE, Indonesia MEMR, Singapore EMA, Vietnam MOIT | Free (regulator publications) | P2 |
| **Verra CCCI / ETC methodology reference** | Per methodology update | Carbon Calculator ETC revenue model — baseline factors, additionality criteria | Free | P2 |
| **NGFS Climate Impact Explorer** | Annual | Physical risk time series by country — chronic + acute | Free API | P1 |
| **WorldSteel Association statistics** | Annual | Steel sector emission intensities (BF-BOF, EAF) — Steel Sector Module | Free download | P2 |
| **IMO GHG Study / CII methodology** | Per IMO update | Shipping Sector Module methodology reference | Free | P2 |

---

### A.4 API Contract — Endpoints

All endpoints require `X-API-Key: {DATA_HUB_API_KEY}` header. Base URL: `http://localhost:8002/api/v1`

#### A.4.1 Entity Resolution

```
GET  /entities/lei/{lei}
     → { lei, legal_name, jurisdiction, status, parent_lei, ultimate_parent_lei }

GET  /entities/search?name={name}&country={iso2}
     → [{ lei, legal_name, jurisdiction, match_score }]

GET  /entities/isin-to-lei/{isin}
     → { isin, lei, legal_name }
```

#### A.4.2 Emissions & ESG

```
GET  /emissions/{lei_or_name}?year={year}
     → { entity, year, scope1_tco2e, scope2_tco2e, scope3_tco2e, source, dqs_level, confidence }

GET  /emissions/sector-benchmark/{sector}?year={year}
     → { sector, year, intensity_tco2e_per_unit, unit, source }

GET  /emissions/climate-trace/{asset_id}
     → { asset_id, asset_name, lat, lng, sector, annual_tco2e, methodology }
```

#### A.4.3 Glidepaths & Scenarios

```
GET  /glidepaths/nze/{sector}?scenario={ngfs_scenario}
     → [{ year, value, unit, metric_type }]   # annual points 2020–2050

GET  /glidepaths/crrem/{country}/{asset_type}
     → [{ year, intensity_kgco2_m2 }]

GET  /scenarios/carbon-price/{scenario}/{country}?start={year}&end={year}
     → [{ year, usd_per_tco2e }]

GET  /scenarios/ngfs-variables/{scenario}/{country}
     → { gdp_growth, temp_rise_2100, energy_mix, ... }   # full NGFS variable set
```

#### A.4.4 Coal & Energy Infrastructure

```
GET  /coal-plants?country={iso2}&status={operating|retired|pipeline}
     → [{ gem_id, name, capacity_mw, technology, commissioning_year, owner, annual_tco2e, country, lat, lng, status }]

GET  /coal-plants/{gem_id}
     → { full record + unit-level detail }

GET  /power-plants/lcoe-benchmark?technology={solar|wind|geothermal|...}&country={iso2}
     → { technology, country, lcoe_usd_mwh_p50, lcoe_usd_mwh_p10, lcoe_usd_mwh_p90, year, source }

GET  /energy/grid-emission-factor/{country}?year={year}
     → { country, ef_tco2e_mwh, source, period }
```

#### A.4.5 Nature Risk (Spatial — requires PostGIS on main platform)

```
GET  /nature/protected-areas?lat={lat}&lng={lng}&radius_km={r}
     → [{ wdpa_id, name, category, distance_km }]

GET  /nature/deforestation-risk?lat={lat}&lng={lng}&radius_km={r}
     → { tree_cover_loss_ha, fire_alerts, deforestation_driver }

GET  /nature/wwf-risk?lat={lat}&lng={lng}
     → { water_risk_score, biodiversity_intactness, watershed_id }
```

#### A.4.6 Sanctions & Compliance

```
POST /sanctions/check
     Body: { "entities": [{ "name": "...", "country": "..." }] }
     → [{ name, match_found, list_name, match_score, matched_entry }]

GET  /sanctions/lists
     → { ofac_updated, eu_fsl_updated, un_sc_updated }
```

#### A.4.7 Controversy & ESG Events

```
GET  /controversy/{lei_or_name}
     → { entity, violations: [...], gdelt_tone_score, influencemap_grade, sbti_target_status }

GET  /controversy/violations/{lei_or_name}?country={iso2}
     → [{ agency, penalty_usd, category, year, case_description }]

GET  /controversy/gdelt/{entity_name}?days={n}
     → { avg_tone, event_count, top_themes: [...] }
```

#### A.4.8 Financial Data (EVIC for PCAF)

```
GET  /financials/evic/{ticker_or_lei}
     → { ticker, lei, total_equity_mktcap, total_debt, cash, evic, currency, as_of_date, source }

GET  /financials/statements/{ticker_or_lei}?period={annual|quarterly}
     → { revenue, ebitda, total_assets, total_debt, equity, year, source }
```

#### A.4.9 Carbon Credits & ETC

```
GET  /carbon/vcs-methodology/{methodology_id}
     → { methodology_id, name, sector, baseline_approach, additionality_criteria }

GET  /carbon/etc-revenue-estimate?generation_mwh={n}&grid_ef={ef}&carbon_price_usd={p}
     → { annual_credits_tco2e, etc_revenue_usd, calculation_methodology }
```

#### A.4.10 Health

```
GET  /health
     → { status, db_connected, last_ingestion_runs: { source: timestamp } }
```

---

### A.5 Integration with Main Platform

#### A.5.1 Environment Configuration

Add to `backend/.env`:
```
DATA_HUB_URL=http://localhost:8002/api/v1
DATA_HUB_API_KEY=<generated-secret>
DATA_HUB_TIMEOUT=10     # seconds; fail gracefully if hub is unavailable
```

#### A.5.2 Main Platform Client Module

Create `backend/services/data_hub_client.py`:
```python
# Thin HTTP client — wraps all Data Hub API calls
# All calls use httpx with timeout; returns None on failure (main platform degrades gracefully)
# Usage: from services.data_hub_client import DataHubClient
# client = DataHubClient()
# evic = await client.get_evic("US0378331005")
```

#### A.5.3 Graceful Degradation

The main platform must never fail if the Data Hub is unavailable. Every call to `data_hub_client` wraps in try/except with a fallback:
- Emissions lookup → fallback to sector average from local config
- EVIC → fallback to book value (DQS 4)
- Sanctions check → flag as "unverified" (not "clean")
- Glidepath → fallback to pre-cached glidepath snapshot in main DB

#### A.5.4 Integration Points (Main Platform modules that call Data Hub)

| Main Platform Module | Data Hub Endpoint Called | When |
|---------------------|--------------------------|------|
| PCAF Panel — add counterparty | `/entities/search`, `/financials/evic`, `/emissions/{lei}` | On entity creation |
| Portfolio Analytics — WACI/ITR | `/glidepaths/nze/{sector}`, `/emissions/sector-benchmark` | On portfolio run |
| Regulatory — sanctions screening | `/sanctions/check` | On entity onboarding |
| Stranded Assets — coal fleet | `/coal-plants?country=...` | On module open (pre-populate) |
| Power Plant Assessment — LCOE benchmark | `/power-plants/lcoe-benchmark` | On plant creation |
| Nature Risk — TNFD LEAP | `/nature/protected-areas`, `/nature/deforestation-risk` | On coordinate entry |
| Scenario Analysis | `/scenarios/carbon-price`, `/scenarios/ngfs-variables` | On scenario run |
| Carbon Calculator — ETC | `/carbon/etc-revenue-estimate`, `/energy/grid-emission-factor` | On ETC calculation |
| Portfolio Analytics — controversy | `/controversy/{lei}` | On portfolio overview load |
| CRREM real estate | `/glidepaths/crrem/{country}/{asset_type}` | On asset entry |

---

### A.6 Data Hub Build Roadmap

**Sprint 1 (Weeks 1–2) — Core Infrastructure**
- `data_hub/server.py` — FastAPI app, health endpoint, API key auth middleware
- DB schema: `data_hub` PostgreSQL schema with base tables
- `DataHubClient` in main platform with graceful degradation
- Ingestion: GLEIF LEI, OFAC+EU+UN sanctions, Global Energy Monitor GCPT

**Sprint 2 (Weeks 3–4) — Emissions & Glidepaths**
- Ingestion: Climate TRACE, OWID, NGFS Scenarios Portal
- Endpoints: `/emissions`, `/glidepaths`, `/scenarios/carbon-price`
- Main platform integration: PCAF EVIC auto-fetch, Portfolio Analytics glidepath reference

**Sprint 3 (Weeks 5–6) — Nature, Controversy & Financial**
- Ingestion: WDPA, GFW, Violation Tracker, GDELT (BigQuery), InfluenceMap, SBTi, SEC EDGAR XBRL
- Endpoints: `/nature/...`, `/controversy/...`, `/financials/evic`
- Main platform integration: Nature Risk spatial data, PCAF EVIC, controversy screening

**Sprint 4 (Weeks 7–8) — Energy & Reference Data**
- Ingestion: IRENA LCOE, WorldSteel, IMO CII references, CRREM, Grid EFs, Verra CCCI
- Endpoints: `/power-plants/lcoe-benchmark`, `/carbon/...`, `/energy/grid-emission-factor`
- Main platform integration: Power Plant LCOE benchmark, Carbon Calculator ETC, Steel/Shipping sector modules

---

## CATEGORY B — Platform Capabilities: Features to Build in A2 Intelligence

These are computation, logic, and UI gaps that exist regardless of data availability. The main platform needs new code for each.

### B.1 Critical Priority (P0) — Build First

---

#### B.1.1 Fix Portfolio Analytics Engine — Replace Mocked Data with Real Computation

**Gap:** `import random` and hardcoded seed data in portfolio analytics. WACI, ITR, and all KPIs are fake.

**Resolution:**

Replace the mocked Portfolio Analytics Engine with a real computation engine.

**Files to create/modify:**
- `backend/services/portfolio_analytics_engine.py` — new real computation engine
- `backend/api/v1/routes/portfolio_analytics.py` — update route handlers to call real engine
- `frontend/src/pages/PortfolioAnalyticsPage.jsx` — no change; already wired to correct endpoint

**Core calculations to implement:**

```python
# WACI = sum(portfolio_weight_i × carbon_intensity_i)
# portfolio_weight_i = market_value_i / total_portfolio_value
# carbon_intensity_i = financed_emissions_i / revenue_i  (tCO2e / USD M revenue)

# ITR (Implied Temperature Rise):
# ITR_i = budget_exceedance_i mapped to temperature via NGFS glidepath
# budget_exceedance_i = cumulative_emissions_i (2020-2050) / sector_carbon_budget_i

# PCAF Attribution Factor:
# AF_i = outstanding_loan_i / EVIC_i
# Financed_emissions_i = AF_i × borrower_scope1_scope2_i

# Portfolio PCAF total = sum(AF_i × borrower_emissions_i)
```

**Data Hub dependency:** [NEEDS DATA HUB] — calls `/financials/evic` and `/emissions/{lei}` for entities where internal data is absent (DQS 3/4 fallback). If Data Hub is unavailable, uses internal uploaded data only.

**DB tables used:** `portfolios_pg`, `assets` (add `evic`, `scope1_tco2e`, `scope2_tco2e`, `pcaf_dqs`, `attribution_factor` columns via migration)

---

#### B.1.2 DSCR / Project Finance Model

**Gap:** Power Plant Assessment has LCOE but no debt service model.

**Resolution:** Add a Project Finance sub-module to the Power Plant Assessment panel.

**Files to create:**
- `backend/services/project_finance_engine.py`
- `backend/api/v1/routes/project_finance.py`
- `frontend/src/components/SectorAssessments/ProjectFinancePanel.jsx`

**Calculations to implement:**
```python
# Annual Debt Service = Principal repayment + Interest
# DSCR = Net Operating Income / Annual Debt Service
# LLCR = NPV(Cash flows over loan life) / Outstanding debt
# PLCR = NPV(Cash flows over project life) / Outstanding debt
# Equity IRR: NPV(equity cash flows) = 0 → solve for r
# Min DSCR flagging: if min(DSCR_t) < 1.25 → flag
# DSRA sizing: 6 months debt service for DSCR < 1.30
```

**Inputs (from Power Plant Assessment form + new fields):**
- Total CAPEX (USD), Debt:Equity ratio, Loan tenor (years), Interest rate (% pa), Grace period (months), Revenue: PPA price × generation (from capacity factor), OPEX (USD/year), ETC revenue stream (from Carbon Calculator module)

**Outputs:** Year-by-year cash flow waterfall table, DSCR chart, IRR, DSRA recommendation

---

#### B.1.3 PPA Revenue Modelling

**Gap:** No offtake contract parameters in Power Plant financial model.

**Resolution:** Add a PPA input panel within the Project Finance sub-module.

**New fields in ProjectFinancePanel:**
- PPA price (USD/MWh), PPA tenor (years), Price escalation (% pa, fixed/CPI-linked), Capacity factor (% — use P50 for base case, P90 for stress)
- Curtailment risk (% generation loss), Force majeure provision (yes/no), Off-taker credit grade

**Calculations:**
```python
# Annual Revenue = generation_mwh × ppa_price × (1 - curtailment_pct)
# generation_mwh = capacity_kw × capacity_factor × 8760
# Stress revenue (P90) = capacity_kw × cf_p90 × 8760 × ppa_price
# PPA expiry residual value: merchant price assumption post-PPA
```

---

#### B.1.4 PostGIS Spatial Architecture

**Gap:** Nature risk uses lat/lng floats; no spatial queries.

**Resolution:** Enable PostGIS on the Supabase PostgreSQL instance and add spatial columns/indexes to relevant tables.

**Migration:** `backend/alembic/versions/017_enable_postgis.py`
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE nature_risk_sites ADD COLUMN location GEOGRAPHY(POINT, 4326);
CREATE INDEX idx_nature_risk_sites_location ON nature_risk_sites USING GIST(location);
-- Same for: real_estate_assets, power_plant_assets, cat_risk_properties
```

**New spatial queries (backend/services/spatial_queries.py):**
```python
# Protected areas within radius:
# SELECT * FROM wdpa_boundaries
# WHERE ST_DWithin(boundary, ST_MakePoint(lng, lat)::GEOGRAPHY, radius_m)

# Flood zone intersection:
# SELECT * FROM flood_hazard_polygons
# WHERE ST_Intersects(polygon, ST_MakePoint(lng, lat)::GEOGRAPHY)
```

**Data Hub dependency:** [NEEDS DATA HUB] — spatial layers (WDPA, GFW) are ingested by the Data Hub and served via `/nature/...` endpoints; main platform calls Data Hub API rather than storing spatial data locally (avoids large data duplication).

---

#### B.1.5 Time-Series Architecture

**Gap:** No multi-year glidepath tracking (2020–2050) — required for NZBA, PCAF trend, and CRREM compliance.

**Migration:** `backend/alembic/versions/018_time_series_tables.py`
```sql
CREATE TABLE pcaf_time_series (
    id SERIAL PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios_pg(id),
    sector VARCHAR(100),
    metric_type VARCHAR(50),   -- 'absolute_tco2e' | 'intensity_tco2e_unit' | 'waci' | 'itr'
    reporting_year INTEGER,
    actual_value NUMERIC,
    glidepath_value NUMERIC,   -- populated from Data Hub NGFS reference
    target_value NUMERIC,
    unit VARCHAR(50),
    dqs_weighted_avg NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pcaf_ts_portfolio_sector_year ON pcaf_time_series(portfolio_id, sector, reporting_year);
```

This table feeds the NZBA Glidepath Tracker, the Paris Alignment bars in the Interactive Dashboard, and the regulatory disclosure exports.

---

### B.2 High Priority (P1)

---

#### B.2.1 PCAF Data Quality Score (DQS) — Field + Aggregation

**Files:** Alembic migration (add `pcaf_dqs` columns), PCAF Panel frontend update, PCAF computation engine

**DQS logic:**
```python
# DQS 1: Primary data (metered/direct measurement) — borrower upload
# DQS 2: Verified annual report (CDP, audited CSR report)
# DQS 3: Unverified self-reported data
# DQS 4: Sector average (OWID/Climate TRACE/Data Hub fallback)
# DQS 5: Modelled estimate (platform scenario output)

# Aggregate DQS = weighted average by financed emissions share
# Display: pie chart of portfolio by DQS level + weighted avg score
```

---

#### B.2.2 NZBA Glidepath Tracker

**File:** `frontend/src/components/PortfolioAnalytics/GlidepathTracker.jsx`

**Features:**
- Sector selector (O&G, Power, Steel, Shipping, Real Estate, Automotive, Aviation, Food & Agri, Chemicals)
- Chart: Actual trajectory (from `pcaf_time_series`) vs. NZBA target glidepath (from Data Hub NGFS) vs. IEA NZE reference
- RAG status per sector per year
- Colour-coded: Green (on track), Amber (within 10% of glidepath), Red (>10% off-track)
- Export: glidepath table for TCFD Metrics & Targets disclosure

[NEEDS DATA HUB] — glidepath curves from `/glidepaths/nze/{sector}` and CRREM from `/glidepaths/crrem/{country}/{asset_type}`

---

#### B.2.3 MAS-Specific Regulatory Module

**File:** `frontend/src/components/Regulatory/MASPanel.jsx`, `backend/api/v1/routes/mas_regulatory.py`

**Sections to build:**
1. **MAS Environmental Risk Management Guidelines (Dec 2020)** — self-assessment checklist (Governance, Strategy, Risk Management, Scenario Analysis, Disclosure) with RAG status per requirement
2. **MAS Notice 637 Pillar 2** — climate risk capital add-on estimation (qualitative + quantitative)
3. **Singapore Green Finance Taxonomy** — transaction classification (4 thresholds: transformative green, green, amber, red)
4. **MAS SLGS Application Tracker** — for energy expert persona: eligible transaction checklist, SPO scope documenter, grant application status tracker

---

#### B.2.4 CRREM Pathways Live Integration

**File:** `frontend/src/components/RealEstate/CRREMPathwayChart.jsx`

**Features:**
- Asset-level plot: actual energy intensity (kWh/m² or kgCO₂/m²) vs. CRREM pathway for that country + asset type
- Stranding year indicator: the year the asset crosses the CRREM pathway (if it does)
- Green premium / brown discount calculator (RICS-aligned): ±% on valuation based on CRREM position
- Aggregate portfolio view: weighted average vs. CRREM pathway

[NEEDS DATA HUB] — pathway curves from `/glidepaths/crrem/{country}/{asset_type}`

---

#### B.2.5 Shipping Sector Module

**File:** `frontend/src/components/SectorAssessments/ShippingPanel.jsx`, `backend/services/shipping_calculator.py`

**Calculations:**
```python
# AER (Annual Efficiency Ratio) = CO2_emitted_tonnes / (DWT × nm_travelled)
# CII (Carbon Intensity Indicator) = CO2_emitted_tonnes / (capacity_tonnes × nm)
# CII Rating: A (>15% better than reference), B, C (within ±15%), D, E (>15% worse)
# EEXI (Energy Efficiency Existing Ship Index) = (SFC × P_ref) / (DWT × V_ref)
# IMO 2030 target: -40% CII vs 2008 baseline
# IMO 2050 target: -70% CII vs 2008 (net zero by 2050)
```

**Inputs:** Vessel IMO number, DWT, fuel type (HFO/LNG/methanol/ammonia), annual voyage data (nm, cargo tonnes)
**Outputs:** CII rating, AER, EEXI compliance status, projected stranding year under IMO 2050 scenario

[NEEDS DATA HUB] — IMO CII reference values and fuel emission factors from Data Hub

---

#### B.2.6 Steel Sector Module

**File:** `frontend/src/components/SectorAssessments/SteelPanel.jsx`, `backend/services/steel_calculator.py`

**Features:**
- Production route input: BF-BOF (%), EAF (%), DRI (%)
- Emission intensity: BF-BOF ~2.0 tCO₂/tSteel; EAF ~0.5 tCO₂/tSteel; DRI ~1.1 tCO₂/tSteel
- Weighted portfolio intensity vs. IEA NZE glidepath (2.0 → 0.4 tCO₂/tSteel by 2050)
- EAF transition readiness score: based on power grid decarbonisation (EAF is only green if run on renewable electricity)
- Glidepath tracker: actual intensity vs. target

[NEEDS DATA HUB] — WorldSteel benchmark intensities, company-level production routes

---

#### B.2.7 ETC / Carbon Credit Revenue Integration with Power Plant Model

**File:** `backend/services/carbon_credit_engine.py` (update), `frontend/src/components/SectorAssessments/ProjectFinancePanel.jsx`

**Integration:**
- Carbon Calculator outputs (annual tCO₂e avoided, ETC revenue) feed directly into the Project Finance cash flow model as a separate revenue line
- Toggle: "Include ETC revenue" (yes/no) — allows sensitivity analysis with/without carbon credits
- ETC revenue curve follows NGFS carbon price trajectory (from Data Hub) × 2% CCCI formula

---

#### B.2.8 SAT Coal Phase-Out Criteria Checker

**File:** `frontend/src/components/Regulatory/SATPanel.jsx` (update existing)

**Logic:**
```python
# SAT Amber (Transition) coal phase-out criteria:
# 1. Commitment to close by 2040 (hard stop) → YES/NO
# 2. Remaining operating life ≤ 25 years from FID → check commissioning year + 25 yr
# 3. FID date before 31 Dec 2021 → input field
# 4. Just transition plan in place → checkbox
# 5. No new coal financing post-Dec 2021 → checkbox
# Result: AMBER if all 5 criteria met; RED if any failed
```

---

#### B.2.9 Facilitated Emissions Module (Capital Markets)

**File:** `backend/api/v1/routes/facilitated_emissions.py`, `frontend/src/components/FinancialRisk/FacilitatedEmissionsPanel.jsx`

**Scope:** PCAF covers loans. Facilitated emissions = bond underwriting + equity issuance.

**Calculation:**
```python
# Facilitated emissions for debt underwriting:
# = (Underwritten amount / Total issuance amount) × (1/3) × Issuer scope 1+2+3 emissions

# Facilitated emissions for equity:
# = (Shares placed / Total shares outstanding) × (1/3) × Issuer scope 1+2+3 emissions
```

**Note:** "÷ 3" is the PCAF facilitated emissions factor reflecting time-in-year attribution.

---

### B.3 Medium Priority (P2)

---

#### B.3.1 Client Engagement & Transition Plan Tracker

**File:** `frontend/src/components/Engagement/EngagementTracker.jsx`, `backend/api/v1/routes/engagement.py`

**DB table (new migration 019):**
```sql
CREATE TABLE counterparty_engagement (
    id UUID PRIMARY KEY,
    entity_id UUID REFERENCES pcaf_investees(id),
    engagement_date DATE,
    engagement_type VARCHAR(100),  -- 'initial_outreach' | 'transition_plan_received' | 'escalation' | 'progress_review'
    transition_plan_status VARCHAR(50),  -- 'not_started' | 'committed' | 'plan_received' | 'validated' | 'on_track' | 'escalated'
    sbti_status VARCHAR(50),       -- from Data Hub SBTi registry
    notes TEXT,
    next_review_date DATE,
    assigned_to VARCHAR(200)       -- RM name
);
```

**Features:** Timeline view per counterparty, status dashboard across portfolio (% with validated plans), escalation flag when borrower is >10% off glidepath with no transition plan

---

#### B.3.2 Transition Finance Eligibility Engine

**File:** `frontend/src/components/Regulatory/TransitionFinancePanel.jsx`

**Classification logic per taxonomy:** SAT, ASEAN Taxonomy v2, EU Taxonomy (existing), Climate Bonds Initiative, Singapore Green Finance Centre

**Output:** Traffic light classification per applicable taxonomy for each transaction, supporting documentation checklist

---

#### B.3.3 MAS SLGS Application Module

**File:** `frontend/src/components/Regulatory/SLGSTrackerPanel.jsx`

**Features:** Eligibility checker (SAT Green/Amber required; Singapore-licensed bank required; loan tenor ≥ 1 year), framework documentation generator, SPO scope template, application status tracker (submitted / under review / approved / disbursed), grant amount calculator (up to SGD 100K)

---

#### B.3.4 Just Transition Calculator

**File:** `backend/services/just_transition_calculator.py`, `frontend/src/components/StrandedAssets/JustTransitionPanel.jsx`

**Inputs:** Number of affected workers, average wage (local), retraining duration (years), community programmes budget, 2% CCCI formula for ETC-funded just transition
**Output:** Total just transition cost estimate, breakdown (severance + retraining + community), CCCI 2% check (is ETC revenue sufficient to fund the just transition component?)

---

#### B.3.5 ETM-Specific Logic in Stranded Assets

**File:** `backend/services/stranded_assets_service.py` (update), `frontend/src/components/StrandedAssets/ETMPanel.jsx`

**New calculations:**
```python
# NPV of remaining cash flows under BAU:
# NPV_BAU = sum(CF_t / (1+r)^t) for t in remaining_operating_years

# NPV of early retirement:
# NPV_retire = residual_scrap_value - decommissioning_cost - outstanding_debt

# ETM compensation = NPV_BAU - NPV_retire
# (Concessional finance from DFI must cover this gap)

# Just transition allocation = 0.12 × ETM_compensation (12% industry standard)
# Concessional tranche sizing = ETM_compensation × concessionality_factor
```

---

#### B.3.6 Blended Finance Instrument Modelling

**File:** `frontend/src/components/ProjectFinance/BlendedFinancePanel.jsx`

**Features:** Tranche structure (senior debt, mezzanine, first-loss, grant), concessional vs. commercial terms per tranche, IRR waterfall by tranche type, minimum IRR for commercial tranche (ensures additionality), DSCR recalculation across blended structure

---

#### B.3.7 Green Hydrogen Module

**File:** `backend/services/green_hydrogen_calculator.py`, `frontend/src/components/SectorAssessments/GreenHydrogenPanel.jsx`

**Calculations:** Electrolyser efficiency (kWh H₂ / kWh electricity), LCOH (Levelised Cost of Hydrogen = LCOE + electrolyser OPEX + water + compression), SAT classification (green hydrogen = Green if powered by renewable electricity), Scope 3 supply chain (hydrogen transport and storage)

---

#### B.3.8 PCAF Listed Equity Asset Class

**File:** `backend/services/pcaf_engine.py` (extend)

**Calculation path:**
```python
# Listed equity attribution:
# AF = shares_held_value / market_cap
# Financed emissions = AF × issuer_scope1_scope2
# PCAF DQS for listed equity = same scale (1–5)
```

---

### B.4 Low Priority (P3)

| Feature | File | Description |
|---------|------|-------------|
| Geothermal Module | `frontend/src/components/SectorAssessments/GeothermalPanel.jsx` | Well flow rate, steam field depletion, LCOE for geothermal; Indonesia + Philippines focus |
| IRENA Five Pillars Assessment Template | `frontend/src/components/ProjectFinance/IRENAAssessmentPanel.jsx` | Structured bankability template: Financial Modelling, Offtake, Track Record, Technical Readiness, Paris Alignment; score per pillar |
| Absolute vs. Intensity Target Switch | `backend/services/pcaf_engine.py` (update) | Enable concurrent absolute (O&G) and intensity-based (Power, Steel) target tracking in unified glidepath view |

---

### B.5 Dependency Map

```
PostGIS (B.1.4) ──────────────────────────────▶ TNFD LEAP spatial (Nature Risk)
                                                 CRREM Pathways (B.2.4)
                                                 Physical risk overlay

Time-Series Architecture (B.1.5) ─────────────▶ NZBA Glidepath Tracker (B.2.2)
                                                 PCAF DQS aggregation (B.2.1)
                                                 Paris Alignment bars (Interactive Dashboard)

Portfolio Analytics Engine (B.1.1) ───────────▶ WACI / ITR on real data
  └── needs Data Hub: EVIC, emissions

PCAF Engine (B.1.1 + B.2.1) ──────────────────▶ Facilitated Emissions (B.2.9)
                                                 Listed Equity PCAF (B.3.8)

Project Finance Model (B.1.2) ─────────────────▶ ETC Integration (B.2.7)
  + PPA Revenue (B.1.3)                          Blended Finance (B.3.6)
  + Data Hub LCOE benchmark                      Just Transition (B.3.4)
                                                 ETM Logic (B.3.5)

Data Hub API (Category A) ─────────────────────▶ NZBA Glidepath (B.2.2)
                                                 CRREM Pathways (B.2.4)
                                                 Controversy screening
                                                 PCAF EVIC auto-fill
                                                 Coal plant pre-population
                                                 Carbon price for ETC revenue
```

---

## CATEGORY C — Client Proprietary Data: Intake UI

These are data points that no public source can provide. The client (financial institution, energy developer, or fund) holds this data internally. The platform must offer structured, validated, user-friendly intake interfaces to collect it.

**Architecture:** A new `Data Intake` section in the platform navigation. Each data type has a dedicated intake wizard.

**Route structure (new):**
```
/data-intake                    → Landing: list of all intake modules with completion status
/data-intake/portfolio          → Loan portfolio upload
/data-intake/counterparty/{id}  → Counterparty emissions wizard
/data-intake/real-estate        → Property EUI upload
/data-intake/shipping-fleet     → Vessel data upload
/data-intake/steel-borrowers    → Production route entry
/data-intake/project-finance    → Project-specific inputs (energy expert)
/data-intake/internal-config    → Internal carbon price, physical risk vendor, etc.
```

---

### C.1 Module: Loan Portfolio Upload

**Purpose:** Replace the mocked Portfolio Analytics Engine with real data by uploading the lender's actual loan book.

**UI:** Two-mode intake — (1) CSV upload, (2) Manual entry table

**CSV Template (`portfolio_upload_template.csv`):**
```csv
counterparty_id,counterparty_name,lei,isin,outstanding_loan_usd,currency,sector,asset_class,
country_of_risk,loan_maturity_date,pcaf_dqs,scope1_tco2e,scope2_tco2e,scope3_tco2e,
evic_usd,revenue_usd,stage_ifrs9,internal_credit_rating
```

**Fields and validation:**
| Field | Required | Validation | Notes |
|-------|----------|------------|-------|
| counterparty_id | Yes | Unique within upload | Internal ID |
| counterparty_name | Yes | Non-empty string | |
| lei | Conditional | 20-char alphanumeric (ISO 17442) | Triggers Data Hub entity lookup if provided |
| outstanding_loan_usd | Yes | Positive number | In USD; platform converts from local currency |
| sector | Yes | Enum: OilGas / Power / RealEstate / Steel / Shipping / Automotive / Aviation / FoodAgri / Chemicals / Other | |
| pcaf_dqs | Yes | Integer 1–5 | Must be assigned by user per PCAF standard |
| scope1_tco2e | Conditional | Positive number | Required if pcaf_dqs ≤ 3; auto-filled by Data Hub if LEI provided and DQS ≥ 3 |
| evic_usd | Conditional | Positive number | Required for DQS 1/2/3; auto-filled by Data Hub if ticker/LEI provided |
| stage_ifrs9 | Yes | 1 / 2 / 3 | For ECL module |

**UI features:**
- Column mapping step: user maps their column names to platform schema
- Validation report: counts of errors, warnings, auto-fills from Data Hub
- Preview table before commit
- Incremental update: upload delta (new loans only, or full replace)

---

### C.2 Module: Counterparty Emissions Wizard

**Purpose:** Collect borrower-specific Scope 1/2/3 data (DQS 1/2/3) that cannot be auto-filled from public sources.

**UI:** Step-by-step wizard per counterparty (or bulk CSV for large portfolios)

**Wizard steps:**
1. **Search and confirm entity** — name / LEI lookup (Data Hub auto-suggests, user confirms)
2. **Select reporting year** — which year's emissions are being entered
3. **Select data source type** — determines DQS:
   - Direct measurement/meter data → DQS 1
   - Audited annual report / CDP submission → DQS 2
   - Unverified self-reported → DQS 3
   - Sector average fallback → DQS 4 (auto-filled by platform; no input required)
4. **Enter emissions** — Scope 1, Scope 2 (market-based and location-based), Scope 3 Category 15 (if available)
5. **Upload evidence document** — PDF of the report / CSV of the meter data (optional but recommended for DQS 1/2)
6. **Confirm and save** — platform stores to `pcaf_investees` table with DQS metadata

---

### C.3 Module: Sector-Specific Data Intake

#### C.3.1 Real Estate — Property EUI Upload

**CSV Template (`real_estate_upload_template.csv`):**
```csv
asset_id,asset_name,country,city,asset_type,gross_floor_area_m2,energy_use_intensity_kwh_m2,
scope1_co2_intensity_kgco2_m2,green_certification,certification_level,loan_amount_usd,ltv_pct,
building_age,last_refurbishment_year,heating_system,cooling_system,lat,lng
```

**Key DBS-specific fields:** `crrem_country_code`, `crrem_asset_type_code` — these activate the CRREM pathway plot.

**Validation:** EUI values checked against country-average ranges; outliers flagged (e.g., EUI > 600 kWh/m² for office is flagged as likely error).

---

#### C.3.2 Shipping Fleet — Vessel Data Upload

**CSV Template (`shipping_fleet_template.csv`):**
```csv
vessel_imo,vessel_name,vessel_type,dwt,gt,fuel_type,engine_type,
build_year,flag_state,operator,annual_nm_travelled,annual_cargo_tonne_nm,
annual_co2_tonnes,annual_ch4_tonnes,cii_reported,cii_rating,
loan_outstanding_usd,loan_maturity
```

**Lookup:** If `vessel_imo` provided, platform auto-fetches from IHS/Clarksons API (if licensed) or prompts for manual entry. Data Hub can provide limited public-source data (IMO public ship register) as a starting point.

---

#### C.3.3 Steel Borrowers — Production Route Entry

**Manual entry form per borrower** (typically < 20 steel borrowers in a portfolio; not bulk upload):

| Field | Type | Notes |
|-------|------|-------|
| Company name / LEI | Text / lookup | |
| Annual crude steel production (Mt) | Number | |
| BF-BOF share (%) | Slider 0–100 | |
| EAF share (%) | Slider 0–100 | Auto-calculated: 100 - BF-BOF - DRI |
| DRI share (%) | Slider 0–100 | |
| Average electricity carbon intensity (gCO₂/kWh) | Number | For EAF emissions calculation |
| Decarbonisation plan reference | Text / URL | Links to borrower's climate plan |
| Engagement date | Date | |

---

#### C.3.4 Project Finance — Developer/Sponsor Data Inputs

**For energy expert persona — project-specific data that is in the developer's data room, not publicly available.**

**Project Finance Intake Form (`/data-intake/project-finance`):**

Step 1 — Project identification
- Project name, country, technology, stage (development / construction / operating)
- GPS coordinates (for TNFD LEAP spatial lookup)

Step 2 — Resource data (P50/P90 from site study)
- Annual generation P50 (MWh) and P90 (MWh) — upload resource study or enter directly
- Capacity factor P50 (%), P90 (%)

Step 3 — PPA / Offtake
- PPA price (USD/MWh), PPA tenor (years), price escalation (% pa)
- Curtailment risk (%), off-taker name and credit rating / country
- Merchant price assumption post-PPA (USD/MWh, used in tail DCF)

Step 4 — Capital structure
- Total CAPEX (USD), Debt (USD), Equity (USD), Debt:Equity ratio
- Loan tenor (years), interest rate (% pa, fixed or SOFR + spread)
- Grace period (months), balloon payment (%)

Step 5 — Operating costs
- OPEX (USD/year, fixed), variable O&M (USD/MWh), insurance cost
- Land lease / royalty, asset management fee

Step 6 — Carbon credits
- Include carbon credits? (Toggle)
- Mechanism: VCS / Gold Standard / ETC (Verra CCCI) / CDM
- Verified/estimated annual reduction (tCO₂e) — or auto-calculate from Carbon Calculator module

Step 7 — Biodiversity / Just Transition
- Land type: agricultural / forest / protected adjacent / urban industrial
- Workers potentially affected by project (for just transition estimation)

**On save:** Platform runs DSCR/LCOE/IRR/ETC calculation immediately and shows results + NGFS scenario stress test.

---

### C.4 Module: Internal Configuration

**Route:** `/data-intake/internal-config`

**Purpose:** Capture organisation-level configurations that are proprietary policies, not data sources.

| Configuration Item | UI Element | Description |
|-------------------|------------|-------------|
| Internal Carbon Price (ICP) | Numeric input (USD/tCO₂, per year) | Transition risk stress test calibration; DBS uses undisclosed ICP |
| Physical risk vendor | Dropdown + API key field | Jupiter / 427 Market Technology / Moody's RMS / None (use NGFS free tier) |
| PCAF DQS minimum policy | Dropdown 1–5 | Minimum acceptable DQS for portfolio inclusion; below this = data gap flag |
| NZBA interim target year | Year picker | 2030 for most NZBA signatories |
| Sector target values (custom) | Table: sector × target value × unit | Allows DBS to override default IEA glidepath with their own committed target values |
| Reporting currency | Currency dropdown | DBS = SGD; energy developer = USD |
| Physical risk threshold | Slider: low/medium/high | At what physical risk score does a flagging alert appear in portfolio view |
| Facilitated emissions inclusion | Toggle | Whether capital markets facilitated emissions are included in portfolio totals |

---

### C.5 Data Intake — Status Dashboard

**Route:** `/data-intake`

**Landing page shows:**
- Completion status for each intake module (% complete)
- Data freshness: when was each module last updated?
- Quality score: aggregate PCAF DQS distribution across the portfolio
- Data gap warnings: modules with missing critical data (e.g., "15 steel borrowers missing production route — steel sector ITR cannot be computed")
- Action items queue: prioritised list of data gaps with estimated impact on portfolio KPI accuracy

**Status indicators:**
```
Loan Portfolio         [████████████░░] 85% complete   Last updated: 2026-03-01
Counterparty Emissions [██████░░░░░░░░] 42% complete   37 entities missing DQS 1/2 data
Real Estate Assets     [████████████░░] 88% complete   4 assets missing EUI data
Steel Borrowers        [████░░░░░░░░░░] 28% complete   ALERT: Steel sector ITR invalid
Shipping Fleet         [████████░░░░░░] 56% complete   IMO data partially available
Internal Config        [██████████████] 100% complete
```

---

## Master Priority Table

### All 28 work items across 3 categories, ranked by business impact

| # | Item | Category | Priority | Weeks | Depends On | Gap It Resolves |
|---|------|----------|----------|-------|------------|-----------------|
| 1 | Data Hub: Infrastructure + GLEIF + Sanctions | A | P0 | 1–2 | — | Entity resolution; compliance |
| 2 | Data Hub: Climate TRACE + NGFS + OWID | A | P0 | 3–4 | 1 | Portfolio emissions benchmarks; glidepaths |
| 3 | Data Hub: EDGAR XBRL + yfinance + Violation Tracker | A | P0 | 3–4 | 1 | PCAF EVIC; controversy screening |
| 4 | Fix Portfolio Analytics Engine (real computation) | B | P0 | 3–4 | 2 | Mocked WACI/ITR/PCAF |
| 5 | DSCR / Project Finance Model | B | P0 | 3–4 | — | Energy expert: no DSCR model |
| 6 | PPA Revenue Modelling | B | P0 | 3–4 | 5 | Energy expert: no PPA revenue |
| 7 | PostGIS Spatial Architecture | B | P0 | 1–2 | — | TNFD LEAP; physical risk; CRREM spatial |
| 8 | Time-Series Architecture | B | P0 | 1–2 | — | NZBA glidepath tracking; multi-year PCAF |
| 9 | Loan Portfolio Upload UI | C | P0 | 1–2 | — | Unlocks all real Portfolio Analytics |
| 10 | Counterparty Emissions Wizard | C | P0 | 2–3 | — | PCAF DQS 1/2/3 data entry |
| 11 | Data Hub: WDPA + GFW + WWF | A | P1 | 5–6 | 7 | TNFD LEAP spatial layers |
| 12 | Data Hub: Global Energy Monitor | A | P1 | 5–6 | 1 | Coal plant pre-load; Stranded Assets |
| 13 | Data Hub: IRENA LCOE + CRREM + Grid EFs | A | P1 | 7–8 | 1 | Power Plant LCOE; CRREM real estate |
| 14 | PCAF DQS Field + Aggregation | B | P1 | 5 | 8 | PCAF disclosure accuracy |
| 15 | NZBA Glidepath Tracker | B | P1 | 5–6 | 8, 2 | NZBA disclosure; sector RAG status |
| 16 | MAS Regulatory Module | B | P1 | 5–6 | — | MAS ERM; Singapore Taxonomy |
| 17 | CRREM Pathways Live Integration | B | P1 | 7–8 | 7, 13 | Real estate Paris alignment |
| 18 | Shipping Sector Module | B | P1 | 7–8 | — | CII/AER/EEXI calculations |
| 19 | Steel Sector Module | B | P1 | 7–8 | — | BF-BOF/EAF analytics |
| 20 | ETC Integration with Project Finance | B | P1 | 5 | 5, 6 | ETC revenue in lender DD package |
| 21 | SAT Coal Phase-Out Criteria Checker | B | P1 | 6 | — | ETM transaction SAT classification |
| 22 | Real Estate EUI Upload | C | P1 | 5 | — | CRREM assessment on real collateral |
| 23 | Shipping Fleet Upload | C | P1 | 7 | 18 | Real CII/AER calculation |
| 24 | Steel Production Route Entry | C | P1 | 7 | 19 | Real steel sector intensity |
| 25 | Project Finance Data Intake (Energy Expert) | C | P1 | 5 | 5, 6 | Real DSCR/IRR from developer data |
| 26 | Internal Configuration Panel | C | P1 | 2 | — | ICP; DQS policy; sector targets |
| 27 | Client Engagement Tracker | B | P2 | 9–10 | 8 | NZBA engagement disclosure |
| 28 | Just Transition Calculator | B | P2 | 9–10 | 5 | ETM just transition budgeting |
| 29 | ETM-Specific Stranded Asset Logic | B | P2 | 9–10 | 12 | ETM compensation sizing |
| 30 | Blended Finance Instrument Modelling | B | P2 | 11–12 | 5 | DFI co-finance structuring |
| 31 | Facilitated Emissions (Capital Markets) | B | P2 | 11–12 | 4 | DBS capital markets emissions |
| 32 | MAS SLGS Application Module | B | P2 | 9–10 | 16 | Grant application for SEA deals |
| 33 | Transition Finance Eligibility Engine | B | P2 | 11–12 | 16 | SAT/ASEAN/EU taxonomy cross-check |
| 34 | Green Hydrogen Module | B | P2 | 13–14 | 5 | Electrolyser LCOH, H₂ supply chain |
| 35 | PCAF Listed Equity | B | P3 | 15 | 4 | Investment securities coverage |
| 36 | Geothermal Module | B | P3 | 15 | 5 | Philippines/Indonesia geothermal |
| 37 | IRENA Five Pillars Assessment Template | B | P3 | 16 | — | DFI bankability documentation |

---

## Phased Rollout — 16 Weeks

### Phase 1 — Weeks 1–4: Foundation (P0 items)

**Parallel workstreams:**

**Track A (Data Hub):**
- Week 1–2: Data Hub app scaffolding, DB schema, API key auth, health endpoint
- Week 1–2: GLEIF LEI + OFAC/EU/UN sanctions ingestion (highest priority — compliance)
- Week 3–4: Climate TRACE + NGFS + OWID ingestion
- Week 3–4: SEC EDGAR XBRL + yfinance API integration; `/financials/evic` endpoint live

**Track B (Main Platform):**
- Week 1–2: PostGIS migration (017); Time-series tables migration (018)
- Week 1–2: `DataHubClient` service in main platform (graceful degradation)
- Week 3–4: Portfolio Analytics Engine — replace random() with real WACI/ITR/PCAF computation; wire to Data Hub EVIC + emissions
- Week 3–4: DSCR + PPA Revenue Model in Project Finance Panel

**Track C (Data Intake):**
- Week 1–2: `/data-intake` landing page + status dashboard
- Week 2–3: Loan Portfolio CSV upload + validation
- Week 2–3: Internal Configuration panel
- Week 3–4: Counterparty Emissions Wizard (steps 1–6)

**Phase 1 deliverable:** A real (not mocked) portfolio analytics run is possible for any client that uploads a loan portfolio CSV. DSCR calculation is live for energy expert users. Data Hub API is operational with entity resolution and sanctions screening.

---

### Phase 2 — Weeks 5–8: Core Analytics (P1 items)

**Track A:**
- Week 5–6: WDPA + GFW + Global Energy Monitor ingestion
- Week 7–8: IRENA LCOE + CRREM + Grid EFs ingestion
- Week 7–8: Violation Tracker + GDELT + InfluenceMap ingestion

**Track B:**
- Week 5: PCAF DQS field + aggregation; ETC integration with Project Finance
- Week 5–6: NZBA Glidepath Tracker; SAT Coal Phase-Out Checker
- Week 5–6: MAS Regulatory Module (MAS ERM + Singapore Taxonomy sections)
- Week 7–8: CRREM Pathways Live (requires PostGIS + Data Hub CRREM data)
- Week 7–8: Shipping Sector Module; Steel Sector Module

**Track C:**
- Week 5: Project Finance Data Intake (energy expert)
- Week 5: Real Estate EUI Upload
- Week 7: Shipping Fleet Upload; Steel Production Route Entry

**Phase 2 deliverable:** DBS user story is 90% implementable. Energy expert lender package generation is functional end-to-end. All P1 regulatory modules are live.

---

### Phase 3 — Weeks 9–16: Advanced Features (P2/P3)

- Weeks 9–10: Client Engagement Tracker; MAS SLGS Module; Just Transition Calculator; ETM Logic
- Weeks 11–12: Blended Finance Modelling; Facilitated Emissions; Transition Finance Eligibility Engine
- Weeks 13–14: Green Hydrogen Module; Data Hub advanced ingestion (WorldSteel, ACLED, SBTi)
- Weeks 15–16: PCAF Listed Equity; Geothermal Module; IRENA Five Pillars Template

**Phase 3 deliverable:** Platform is production-ready for both DBS and Energy Expert personas. All 37 work items are resolved.

---

## Appendix — New Files Summary

### Category A — New Files (Data Hub)
```
data_hub/
├── server.py
├── db/models.py
├── db/migrations/dh_001_initial_schema.py
├── ingestion/scheduler.py
├── ingestion/gleif_lei.py
├── ingestion/sanctions.py
├── ingestion/global_energy_monitor.py
├── ingestion/ngfs_scenarios.py
├── ingestion/climate_trace.py
├── ingestion/owid.py
├── ingestion/sec_edgar.py
├── ingestion/violation_tracker.py
├── ingestion/gdelt.py
├── ingestion/crrem.py
├── ingestion/irena_lcoe.py
├── ingestion/wdpa.py
├── ingestion/global_forest_watch.py
├── ingestion/sbti_targets.py
├── ingestion/influencemap.py
├── ingestion/grid_emission_factors.py
├── api/v1/routes/entities.py
├── api/v1/routes/emissions.py
├── api/v1/routes/glidepaths.py
├── api/v1/routes/coal_plants.py
├── api/v1/routes/nature_risk.py
├── api/v1/routes/sanctions.py
├── api/v1/routes/controversy.py
├── api/v1/routes/financials.py
├── api/v1/routes/carbon_price.py
├── api/v1/routes/lcoe.py
└── api/v1/routes/health.py
```

### Category B — New/Modified Files (Main Platform)
```
backend/
├── alembic/versions/017_enable_postgis.py          [NEW]
├── alembic/versions/018_time_series_tables.py      [NEW]
├── alembic/versions/019_engagement_tracker.py      [NEW]
├── services/data_hub_client.py                     [NEW]
├── services/portfolio_analytics_engine.py          [NEW — replaces random()]
├── services/project_finance_engine.py              [NEW]
├── services/shipping_calculator.py                 [NEW]
├── services/steel_calculator.py                    [NEW]
├── services/just_transition_calculator.py          [NEW]
├── services/spatial_queries.py                     [NEW]
├── api/v1/routes/portfolio_analytics.py            [MODIFY]
├── api/v1/routes/project_finance.py                [NEW]
├── api/v1/routes/facilitated_emissions.py          [NEW]
├── api/v1/routes/engagement.py                     [NEW]
├── api/v1/routes/mas_regulatory.py                 [NEW]

frontend/src/
├── pages/DataIntakePage.jsx                        [NEW]
├── components/PortfolioAnalytics/GlidepathTracker.jsx    [NEW]
├── components/SectorAssessments/ProjectFinancePanel.jsx  [NEW]
├── components/SectorAssessments/ShippingPanel.jsx        [NEW]
├── components/SectorAssessments/SteelPanel.jsx           [NEW]
├── components/SectorAssessments/GreenHydrogenPanel.jsx   [NEW]
├── components/SectorAssessments/GeothermalPanel.jsx      [NEW]
├── components/StrandedAssets/ETMPanel.jsx                [NEW]
├── components/StrandedAssets/JustTransitionPanel.jsx     [NEW]
├── components/Regulatory/MASPanel.jsx                    [NEW]
├── components/Regulatory/SATPanel.jsx                    [MODIFY]
├── components/Regulatory/SLGSTrackerPanel.jsx            [NEW]
├── components/Regulatory/TransitionFinancePanel.jsx      [NEW]
├── components/ProjectFinance/BlendedFinancePanel.jsx     [NEW]
├── components/ProjectFinance/IRENAAssessmentPanel.jsx    [NEW]
├── components/Engagement/EngagementTracker.jsx           [NEW]
├── components/FinancialRisk/FacilitatedEmissionsPanel.jsx [NEW]
└── components/RealEstate/CRREMPathwayChart.jsx           [NEW]
```

### Category C — New Files (Data Intake UI)
```
frontend/src/
├── pages/DataIntakePage.jsx                               [NEW]
├── components/DataIntake/PortfolioUploadWizard.jsx        [NEW]
├── components/DataIntake/CounterpartyEmissionsWizard.jsx  [NEW]
├── components/DataIntake/RealEstateUploadForm.jsx         [NEW]
├── components/DataIntake/ShippingFleetUploadForm.jsx      [NEW]
├── components/DataIntake/SteelBorrowersForm.jsx           [NEW]
├── components/DataIntake/ProjectFinanceIntakeWizard.jsx   [NEW]
├── components/DataIntake/InternalConfigPanel.jsx          [NEW]
└── components/DataIntake/IntakeStatusDashboard.jsx        [NEW]

backend/
├── api/v1/routes/data_intake.py                          [NEW]
└── services/intake_validator.py                          [NEW]

assets/templates/
├── portfolio_upload_template.csv                         [NEW]
├── real_estate_upload_template.csv                       [NEW]
├── shipping_fleet_template.csv                           [NEW]
└── steel_borrowers_template.csv                          [NEW]
```
