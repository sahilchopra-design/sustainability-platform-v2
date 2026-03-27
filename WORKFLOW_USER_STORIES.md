# Risk Analytics Platform — Workflow, User Stories & Data Lifecycle
## Sprint D Modules + PCAF India BRSR
**Version:** 6.0 · **Date:** 2026-03-24 · **Author:** Platform Architecture Review

---

## Table of Contents
1. [Platform Cross-Module Architecture](#platform-cross-module-architecture)
2. [EP-D6 — NGFS Scenario Browser](#ep-d6--ngfs-scenario-browser)
3. [EP-D7 — Portfolio Climate VaR](#ep-d7--portfolio-climate-var)
4. [EP-D1 — Stranded Assets Analyzer](#ep-d1--stranded-assets-analyzer)
5. [EP-D3 — CSRD iXBRL Generator](#ep-d3--csrd-ixbrl-generator)
6. [EP-D4 — Pipeline Operations Dashboard](#ep-d4--pipeline-operations-dashboard)
7. [PCAF India BRSR — Financed Emissions Calculator](#pcaf-india-brsr--financed-emissions-calculator)
8. [End-to-End Transaction Lifecycle](#end-to-end-transaction-lifecycle)
9. [Regulatory Disclosure Mapping](#regulatory-disclosure-mapping)

---

## Platform Cross-Module Architecture

### Shared State Bus — `TestDataContext`
All Sprint D modules communicate through a React context acting as an in-memory shared state bus. This is the central nervous system of cross-module pre-fill.

```
┌────────────────────────────────────────────────────────────────────┐
│                      TestDataContext (Global Bus)                   │
│                                                                     │
│  selectedNgfsScenarioId  ──→  EP-D7 (scenario multiplier)          │
│                         ──→  EP-D1 (phase-out year toggle)         │
│                                                                     │
│  portfolioHoldings[]     ──→  EP-D7 (VaR calculation)              │
│                         ──→  EP-D1 (linked energy/mining exposure) │
│                         ──→  EP-D3 (CIN → company ID pre-fill)     │
│                                                                     │
│  discountRate            ──→  EP-D1 (DCF denominator)              │
│                                                                     │
│  csrdCompanyId           ──→  EP-D3 (iXBRL entity identifier)      │
│  csrdFramework           ──→  EP-D3 (active framework selector)    │
│  csrdReportingYear       ──→  EP-D3 (filing period)                │
│                                                                     │
│  lastPipelineTriggers    ──→  EP-D4 (audit trail of manual runs)   │
└────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary (Source → Destination)

| Source Module | Datapoint | Consumed By | Purpose |
|---|---|---|---|
| EP-D6 NGFS | `selectedNgfsScenarioId` | EP-D7 | Drives `SCENARIO_MULT` multiplier on sector shocks |
| EP-D6 NGFS | `selectedNgfsScenarioId` | EP-D1 | Maps to `nze/aps/steps` phase-out year column |
| EP-D7 Portfolio | `portfolioHoldings[]` | EP-D1 | Filters energy/mining holdings → `linkedExposure` |
| EP-D7 Portfolio | `holdings[].cin` | EP-D3 | Pre-populates company ID for iXBRL filing |
| EP-D4 Pipeline | Pipeline runs | All modules | Feeds BRSR/IEA/NGFS data used in calculations |

---

## EP-D6 — NGFS Scenario Browser
**Epic ID:** EP-D6 | **Regulatory Basis:** ECB SSM 2022, EBA CRD6, NGFS Phase 3, RBI Climate Risk Circular 2023

### Module Purpose
The NGFS Scenario Browser is the **scenario governance layer** of the platform. It defines *which future climate pathway the entire institution has adopted* for forward-looking risk assessment. All downstream risk calculations (VaR, stranded assets, TCFD disclosures) derive their severity parameters from the scenario selected here.

---

### User Personas & User Stories

#### Persona 1: Scenario Governance Officer / Risk Strategy Lead
**Role:** Selects and governs which NGFS scenario is used for regulatory submission. Accountable for the scenario choice in board-level TCFD reports.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D6-US-01 | As a Scenario Governance Officer, I want to browse all 8 NGFS Phase 3 scenarios with their physical/transition risk scores so I can choose the right scenario for our annual climate risk assessment | Scenario table shows temp, carbon price 2030/2050, GDP impact, stranded assets, transition risk score, physical risk score |
| D6-US-02 | As a Scenario Governance Officer, I want clicking "Select →" on a scenario to instantly propagate it to Portfolio VaR and Stranded Asset modules so all analyses are internally consistent | `ctx.setSelectedNgfsScenario(id)` fires; EP-D7 `useEffect` updates scenario; EP-D1 reads `ctxToggle` |
| D6-US-03 | As a Scenario Governance Officer, I want to see a cross-module status banner confirming which modules are now using my selected scenario | Green banner shows "Portfolio VaR (EP-D7) ✓ Synced" and "Stranded Assets (EP-D1) ✓ Synced" |
| D6-US-04 | As a Risk Strategist, I want to compare up to 3 scenarios side-by-side to explain to the board why we chose Net Zero 2050 over Delayed Transition | Compare Mode checkbox → multi-select → radar chart comparison |
| D6-US-05 | As a Risk Strategist, I want to build a probability-weighted blended scenario using slider weights to capture scenario uncertainty for ICAAP/ILAAP submissions | Blended Builder shows weighted-average carbon price 2050 and GDP impact; explicitly labeled "does NOT activate" |
| D6-US-06 | As a Data Analyst, I want to upload custom scenario CSVs from internal climate models or NGFS extensions so I can supplement the standard 8 scenarios | DataUploadPanel accepts: `scenario_id, name, category, temp_2100, carbon_2030, carbon_2050, gdp_impact, stranded_bn` |
| D6-US-07 | As an Auditor/Compliance Officer, I want to see the IEA-NGFS bridge data (which IEA WEO key maps to which NGFS scenario) so I can verify the carbon budget and phase-out parameters used in stranded asset calculations | Bridge panel shows: NGFS Scenario ID, IEA Scenario Key, Carbon Budget, Phase-Out Override, Stranded Fraction, Bridge Version |

---

### Datapoint Lifecycle — EP-D6

#### Scenario Identity Fields

| Field | Type | Source | Transformation | Destination | Regulatory Use |
|---|---|---|---|---|---|
| `id` | string | NGFS Phase 3 taxonomy (hardcoded `BASE_SCENARIOS`), or API `/api/v1/ngfs-scenarios/`, or CSV upload | Normalized to uppercase `NGFS_P3_*` format | `ctx.selectedNgfsScenarioId` → EP-D7 `SCENARIO_MULT` lookup | TCFD Scenario narrative, ECB SSM disclosure |
| `name` | string | NGFS official names | Display only | Scenario table, compare chart axis labels | Board TCFD report scenario label |
| `category` | enum | NGFS taxonomy: Orderly / Disorderly / Hot House World | Color-coded via `CAT_COLOR` | Category filter, radar chart color | EBA CRD6 scenario categorization |
| `temp` | float (°C) | NGFS Phase 3 temperature outcomes by 2100 | Display only | Scenario table, radar chart axis | 2°C/1.5°C alignment claim |

#### Scenario Economic Variables

| Field | Type | Source | Formula / Transformation | Destination | Regulatory Use |
|---|---|---|---|---|---|
| `c30` | integer ($/tCO₂) | NGFS Phase 3 carbon price pathway 2030 | Display; used in blended: `Σ(weight_i / totalWeight) × c30_i` | Blended scenario builder | EU ETS stress scenario, RBI internal carbon price |
| `c50` | integer ($/tCO₂) | NGFS Phase 3 carbon price pathway 2050 | Blended carbon price output | Board report carbon trajectory | TCFD transition pathway |
| `gdp` | float (%) | NGFS Phase 3 GDP loss vs baseline | Blended GDP: `Σ(weight_i / totalWeight) × gdp_i` | Blended scenario builder, radar chart | EBA macro-financial scenario |
| `str` | integer ($bn) | NGFS Phase 3 global stranded assets estimate | EP-D1: reference calibration for sector multipliers | Stranded asset context | TCFD physical risk, IND AS 109 ECL staging |
| `tr` | float (0–10) | Transition Risk Score (derived: `(850-c50)/85`) | Radar chart axis | Scenario comparison | Pillar 2 transition risk rating |
| `pr` | float (0–10) | Physical Risk Score (derived: `temp × 2.5`) | Radar chart axis | Scenario comparison | Pillar 2 physical risk rating |

#### Bridge Data Fields (from API `/api/v1/ngfs-scenarios/{id}/stranded-bridge`)

| Field | Type | Source | Transformation | Destination |
|---|---|---|---|---|
| `iea_scenario_key` | string | IEA WEO 2023 mapping table (server-side) | Used to look up phase-out years | EP-D1 `BASE_PHASE_OUT[scenario]` column |
| `carbon_budget_gtco2` | float | IPCC AR6 + NGFS calibration | Reference only | TCFD carbon budget narrative |
| `phase_out_override` | object | Platform calibration vs IEA defaults | Override in EP-D1 phase-out years | EP-D1 calculates `remainLife` from this |
| `stranded_fraction` | float | IEA WEO stranded fraction by asset type | Scales `IMPAIR_MULT` in EP-D1 | ECL Stage 2/3 impairment flag |

---

### Workflow Steps (Analyst Journey)

```
Step 1: Browse Pathways
   └─ User reads scenario table, reviews temp/carbon/GDP/stranded columns
   └─ Optionally filters by category (Orderly / Disorderly / Hot House World)
   └─ Opens Compare Mode to radar-chart 2–3 scenarios

Step 2: Activate Scenario
   └─ Clicks "Select →" on chosen scenario
   └─ ctx.setSelectedNgfsScenario(id, fullScenarioObject) fires
   └─ EP-D7 useEffect triggers → updates scenario multiplier
   └─ EP-D1 reads ctxToggle → switches phase-out column
   └─ Cross-module status banner turns green

Step 3: Advanced Analysis
   └─ Views NGFS-IEA Bridge data for audit trail
   └─ Builds probability-weighted blended scenario for ICAAP
   └─ Exports or screenshots for board TCFD deck
   └─ Optionally uploads custom scenario CSV
```

---

## EP-D7 — Portfolio Climate VaR
**Epic ID:** EP-D7 | **Regulatory Basis:** SEBI BRSR Core P6 FY24, RBI Draft Climate Capital Buffer 2023, PCAF v2 §2.3, TCFD

### Module Purpose
Calculates delta-normal Climate Value-at-Risk for a financial institution's loan/investment portfolio, decomposed into transition risk (carbon pricing shock) and physical risk (climate hazard). Produces regulatory capital add-on estimates under RBI's draft 1% climate buffer and SEBI BRSR Core Principle 6 disclosure figures.

---

### User Personas & User Stories

#### Persona 1: Portfolio Risk Manager
**Role:** Owns the credit portfolio's climate risk metrics; presents combined VaR to ALCO and board risk committee.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D7-US-01 | As a Portfolio Risk Manager, I want to see combined Climate VaR broken down by transition and physical components so I can explain to ALCO which risk type is driving overall exposure | KPI cards show: Transition VaR $, Physical VaR $, Combined VaR $, Combined VaR % of NAV |
| D7-US-02 | As a Portfolio Risk Manager, I want the scenario multiplier to automatically update when my Scenario Governance Officer selects a new NGFS scenario so all metrics stay consistent | `useEffect([ctx.selectedNgfsScenarioId])` updates `scenario` state; VaR recalculates via `useMemo` |
| D7-US-03 | As a Portfolio Risk Manager, I want to see which sectors are driving the most climate risk in a waterfall/bar chart so I can prioritize engagement with high-risk counterparties | Sector breakdown bar chart: x=sector, y=combined VaR USD, color-coded by SECTOR_COLOR |
| D7-US-04 | As a Portfolio Risk Manager, I want to run all 6 NGFS scenarios simultaneously to see how VaR changes across scenarios for sensitivity disclosure | "Run All Scenarios" button → iterates `NGFS_OPTIONS` → builds scenario comparison chart |
| D7-US-05 | As a Portfolio Risk Manager, I want to export the holdings table with VaR attribution per company as a CSV for model governance and audit | "↓ Export Holdings CSV" → `portfolio_climate_var_{date}.csv` with columns: Holding ID, Company, Sector, Exposure USD, Transition VaR, Physical VaR, Combined VaR, Combined VaR % |

#### Persona 2: ALCO Analyst / Capital Planning
**Role:** Uses climate VaR output to size RBI climate capital buffer add-on and SEBI BRSR disclosure figures.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D7-US-06 | As an ALCO Analyst, I want the interpretation banner to automatically calculate the RBI 1% climate buffer add-on from the combined VaR so I can include it in next quarter's capital planning | Banner: "Under RBI's draft 1% climate buffer, estimated add-on: $X" where X = combined_var_usd × 0.01 |
| D7-US-07 | As an ALCO Analyst, I want to understand the sector shock assumptions (NGFS P3 calibration) so I can justify them to the regulator | SectorShockDisclosure panel shows: Sector, T-shock, P-shock, Scenario Multiplier, ECB Comparable, Source (NGFS P3 / IPCC AR6) |
| D7-US-08 | As an ALCO Analyst, I want to adjust the correlation ρ(T,P) between transition and physical risk shocks to stress-test the model | ρ slider (0–0.5); VaR formula = √(T² + P² + 2ρTP) recalculates |

#### Persona 3: Credit Risk Analyst
**Role:** Uploads portfolio data from core banking system and validates exposures.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D7-US-09 | As a Credit Risk Analyst, I want to upload a CSV of our loan portfolio with CIN/ISIN identifiers so the system can calculate VaR per holding | DataUploadPanel accepts: holding_id, company_name, sector, exposure_usd, outstanding_amount_usd, cin, country |
| D7-US-10 | As a Credit Risk Analyst, I want pre-filled demo data (Reliance, Coal India, NTPC, Adani Green, JSW Steel, L&T) so I can validate the model before connecting production data | DEMO_HOLDINGS loaded as default state |

---

### Datapoint Lifecycle — EP-D7

#### Portfolio Holdings Fields

| Field | Type | Source | Transformation | Destination | Regulatory Use |
|---|---|---|---|---|---|
| `holding_id` | string | Core banking system / CBS upload / manual | Display, CSV export key | Holdings table, export CSV | Audit trail per counterparty |
| `company_name` | string | CBS / BRSR database (by CIN lookup) | Display | Holdings table, export CSV, EP-D3 pre-fill | SEBI BRSR P6 counterparty name |
| `sector` | enum (GICS) | CBS / analyst-assigned | Index into `SECTOR_SHOCKS` to get `{t, p}` | VaR per-holding: `tVaR = exposure × shocks.t × scenMult × hScale × z/1.645` | PCAF sector attribution |
| `exposure_usd` | float | CBS outstanding balance | Denominator for VaR%; numerator for portfolio NAV | `portfolio_nav_usd = Σexposure_usd`; VaR formula inputs | PCAF WACI: financed emissions attribution |
| `outstanding_amount_usd` | float | CBS total facility | Reference; not in VaR formula directly | Holdings table display | RBI credit concentration |
| `cin` | string (MCA21 format) | CBS / MCA company registry | Passed to EP-D3 as `portfolioHoldings[].cin` | EP-D3 pre-fills company ID for iXBRL | SEBI BRSR filing entity identifier |
| `country` | enum | CBS / ISO 3166 | Display; future: country-specific shock calibration | Holdings table | RBI country risk |

#### VaR Calculation Parameters

| Parameter | Type | Source | Formula | Destination | Regulatory Use |
|---|---|---|---|---|---|
| `scenario` (NGFS ID) | string | EP-D6 `ctx.selectedNgfsScenarioId` | `SCENARIO_MULT[scenarioId]` → multiplier ∈ [0.35, 1.3] | Scales transition shocks | ECB SSM scenario alignment |
| `horizon` (years) | integer | User slider (1–30) | `hScale = √(horizon/10)` | All VaR calculations | Time horizon declaration in TCFD |
| `confidence` | float (0.90/0.95/0.99) | User selector | `z = Z_MAP[confidence]` (1.282 / 1.645 / 2.326) | All VaR calculations | Regulatory confidence level (Basel analog) |
| `rho` (correlation) | float (0–0.5) | User slider, default 0.25 | `combined = √(T² + P² + 2ρTP)` | Combined VaR | ECB 2021 empirical range 0.15–0.30 |

#### Sector Shock Matrix (NGFS P3 / IPCC AR6 calibration)

| Sector | T-shock | P-shock | Source |
|---|---|---|---|
| Energy | 24% | 12% | NGFS P3 sector transition pathway |
| Mining | 22% | 14% | NGFS P3 + IPCC AR6 physical hazard |
| Utilities | 16% | 15% | NGFS P3 |
| Materials | 14% | 8% | NGFS P3 |
| Industrials | 10% | 7% | NGFS P3 |
| Financials | 8% | 5% | ECB 2021 indirect exposure |
| Real Estate | 12% | 18% | IPCC AR6 physical (flood/heat) |

#### VaR Calculation Formula Chain

```
For each holding h:
  shocks = SECTOR_SHOCKS[h.sector]
  tVaR_h = h.exposure_usd × shocks.t × SCENARIO_MULT[scenarioId] × √(horizon/10) × (z/1.645)
  pVaR_h = h.exposure_usd × shocks.p × √(horizon/10) × (z/1.645)

Portfolio aggregation:
  totalT = Σ tVaR_h
  totalP = Σ pVaR_h
  combined = √(totalT² + totalP² + 2×ρ×totalT×totalP)
  nav = Σ h.exposure_usd
  combined_pct = combined / nav

RBI Capital Buffer Add-on (interpretation):
  rbi_addon = combined × 0.01  [draft 1% buffer]

SEBI BRSR P6 Disclosure:
  combined_var_pct → "Climate VaR as % of portfolio NAV"
```

---

### Workflow Steps (Analyst Journey)

```
Step 1: Upload / Validate Holdings
   └─ Upload CBS portfolio extract (CSV) or use DEMO_HOLDINGS
   └─ Validate: exposure_usd > 0, sector mapped to GICS
   └─ ctx.setPortfolioHoldings(parsed, fileName) stores to global bus

Step 2: Set Risk Parameters
   └─ Scenario auto-filled from EP-D6 (or manual override)
   └─ Set horizon (default 10Y), confidence (default 95%), ρ (default 0.25)
   └─ Review SectorShockDisclosure panel for methodology transparency

Step 3: Review VaR Results
   └─ KPI cards: Transition VaR, Physical VaR, Combined VaR, % of NAV
   └─ Sector bar chart: identify top-3 risk drivers
   └─ Run All Scenarios: sensitivity across 6 NGFS pathways
   └─ Interpretation banner: RBI capital add-on, SEBI BRSR P6 disclosure text

Step 4: Export & Govern
   └─ Export Holdings CSV → model governance / audit file
   └─ Screenshot/copy VaR figures for ALCO deck
   └─ Combined VaR % → SEBI BRSR Core Principle 6 disclosure
   └─ CINs → auto-populate EP-D3 for iXBRL filing
```

---

## EP-D1 — Stranded Assets Analyzer
**Epic ID:** EP-D1 | **Regulatory Basis:** RBI Climate Guidelines 2023, SEBI BRSR Core P6, TCFD Forward Scenario, IND AS 109/IFRS 9 ECL

### Module Purpose
Models the impairment of fossil fuel and carbon-intensive assets under IEA phase-out scenarios. Calculates DCF-based present value for each asset given scenario-specific phase-out year, then computes impairment (book value − PV) to flag IND AS 109 Stage 2/3 provisioning requirements. Integrates upstream from EP-D6 (scenario selection) and EP-D7 (portfolio energy/mining exposures).

---

### User Personas & User Stories

#### Persona 1: Credit Risk / Climate Analyst
**Role:** Reviews stranded asset exposures for IND AS 109 ECL staging; presents impairment schedule to credit committee.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D1-US-01 | As a Credit Risk Analyst, I want to see per-asset impairment percentages so I can identify which assets breach the 60% threshold requiring IND AS 109 Stage 3 treatment | Table column "Impairment %" colored red if >60%, amber if >30%, sage if ≤30% |
| D1-US-02 | As a Credit Risk Analyst, I want the active NGFS scenario to automatically switch the phase-out years used in DCF so my analysis is always consistent with the governance team's choice | `ctxToggle = SCENARIO_TO_TOGGLE[ctx.selectedNgfsScenarioId]`; `displayScenario` uses ctx value if set |
| D1-US-03 | As a Credit Risk Analyst, I want to see the total impairment as a KPI with a breakdown chart by technology type so I can size our IND AS 109 provision | KPI: "Total Impairment -$Xbn (Y% of book)"; bar chart by technology |
| D1-US-04 | As a Credit Risk Analyst, I want to run the discount rate used in the DCF calculation so I can match our WACC/credit cost assumptions | Discount rate slider (1–20%); `pv = book_usd / (1+r)^remainLife` |
| D1-US-05 | As a Credit Risk Analyst, I want to export the per-asset PV table as a CSV for upload to the credit risk system | "↓ Export CSV" → `stranded_assets_{scenario}_{date}.csv` with all 8 columns |

#### Persona 2: Treasury / TCFD Analyst
**Role:** Builds TCFD "Forward Scenario Analysis" section using stranded asset exposure data.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D1-US-06 | As a TCFD Analyst, I want to compare stranded asset exposure across NZE/APS/STEPS scenarios by switching between tabs to explain sensitivity in the TCFD report | Scenario toggle buttons: NZE / APS / STEPS (or auto-set from NGFS context) |
| D1-US-07 | As a TCFD Analyst, I want the linked exposure from our portfolio (energy/mining holdings from EP-D7) pre-calculated so I can cross-reference asset-level impairment with portfolio-level VaR | `linkedExposure = Σ(h.exposure_usd × IMPAIR_MULT[h.sector])` displayed as "Linked Portfolio Exposure from EP-D7" |
| D1-US-08 | As a TCFD Analyst, I want to see fossil fuel demand trajectory charts (2025–2050) for each scenario so I can visualise the revenue outlook for coal/oil assets | Area chart: x=year, y=demand index, 3 lines (NZE/APS/STEPS) |

---

### Datapoint Lifecycle — EP-D1

#### Asset Master Fields

| Field | Type | Source | CSV Column | Transformation | Destination | Regulatory Use |
|---|---|---|---|---|---|---|
| `id` | string | Internal asset register / upload | `reserve_id` or `id` | Display key | Table row key, export | Audit trail |
| `tech` | enum | Asset register / manual | `tech_type` or `tech` | Index for display label | Table, bar chart x-axis | TCFD technology exposure |
| `sector` | enum (GICS) | Asset register / manual | `sector` | Index into `IMPAIR_MULT` for linked exposure | EP-D7 link calculation | SEBI BRSR P6 sector |
| `book_usd` | float | Core banking / asset ledger | `book_value_usd` or `book_usd` | DCF numerator; impairment base | KPI total book, impairment calc | IND AS 109 gross carrying amount |
| `nze` | integer (year) | IEA WEO Net Zero 2050 phase-out schedule / API bridge | `phase_out_nze` | `remainLife = nze − 2026` (if scenario=NZE) | DCF: `pv = book / (1+r)^remainLife` | TCFD NZE scenario |
| `aps` | integer (year) | IEA WEO APS phase-out schedule / API bridge | `phase_out_aps` | `remainLife = aps − 2026` (if scenario=APS) | DCF calculation | TCFD APS scenario |
| `steps` | integer (year) | IEA WEO STEPS phase-out schedule | `phase_out_steps` | `remainLife = steps − 2026` (if scenario=STEPS) | DCF calculation | TCFD STEPS baseline |
| `country` | enum | Asset register | `country` | Display; future: country-specific carbon cost overlay | Table | RBI country risk |

#### Calculated Fields (client-side `useMemo`)

| Field | Type | Formula | Source Inputs | Destination | Regulatory Use |
|---|---|---|---|---|---|
| `phaseOut` | integer | `a[displayScenario]` | `displayScenario` (from ctx or manual) | Table column, bar chart | TCFD scenario phase-out year |
| `remainLife` | integer | `max(0, phaseOut − 2026)` | `phaseOut`, `CURRENT_YEAR=2026` | DCF exponent | Asset remaining life disclosure |
| `pv` | float (USD) | `book_usd / (1+discountRate)^remainLife` | `book_usd`, `discountRate`, `remainLife` | Table, KPI, export CSV | IND AS 109 recoverable amount |
| `impairment` | float (USD) | `book_usd − pv` | `book_usd`, `pv` | KPI total impairment, table, export | IND AS 109 impairment loss |
| `impairPct` | float (%) | `(impairment / book_usd) × 100` | `impairment`, `book_usd` | Color-coded table column, ECL staging | IND AS 109 Stage 2 (>30%) / Stage 3 (>60%) flag |

#### IND AS 109 ECL Staging Logic (Interpretation Banner)

```
totalImpairment = Σ impairment_i
pct = totalImpairment / totalBook × 100

Stage 2 flag: any asset with impairPct > 30%   → "Significant Increase in Credit Risk"
Stage 3 flag: any asset with impairPct > 60%   → "Credit-Impaired"
ECL provision = Σ (book_usd_i × stage_i × sector_ECL_rate)
```

---

### Workflow Steps (Analyst Journey)

```
Step 1: Upload Reserves
   └─ Upload asset register CSV or use BASE_PHASE_OUT demo data
   └─ System accepts: reserve_id, tech_type, sector, book_value_usd, phase_out_nze/aps/steps, country
   └─ ctx.setReserveIds(ids) registers new assets in global bus

Step 2: Set Parameters
   └─ Scenario auto-selected from EP-D6 (or override with NZE/APS/STEPS toggle)
   └─ Set discount rate (default 8% → WACC proxy)
   └─ Optionally filter by technology type

Step 3: Review Impairments
   └─ Demand trajectory chart: visualise revenue outlook 2025-2050
   └─ Impairment table: phase-out year, remaining life, PV, impairment, impairment %
   └─ Interpretation banner: IND AS 109 ECL staging, total provision estimate
   └─ KPI cards: total impairment $bn, impairment % of book, linked portfolio exposure

Step 4: Export & Report
   └─ Export CSV: full per-asset PV table
   └─ Run API Calc: send to backend for ECL model integration
   └─ Data feeds: IND AS 109 staging → credit system; TCFD Forward Analysis → board report
```

---

## EP-D3 — CSRD iXBRL Generator
**Epic ID:** EP-D3 | **Regulatory Basis:** CSRD Art.29/ESRS E1 Mandatory, SEBI BRSR Core NSE/BSE Top-1000, EFRAG ESRS XBRL 2024, GRI 2021/ISSB S1-S2

### Module Purpose
Generates machine-readable inline XBRL (iXBRL) sustainability reports tagged to ESRS/GRI/ISSB/EU Taxonomy/BRSR frameworks. Serves as the **final-mile regulatory submission layer** — all upstream data (portfolio, emissions, scenario) culminates here as a structured, auditor-ready disclosure document.

---

### User Personas & User Stories

#### Persona 1: Sustainability Reporting Manager
**Role:** Owns the annual CSRD/BRSR filing; coordinates data collection from finance, operations, and ESG teams.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D3-US-01 | As a Sustainability Reporting Manager, I want an audit readiness checklist before generating iXBRL so I know which mandatory ESRS E1-6 datapoints are missing | CSRDAuditReadinessPanel: amber warning if Company ID = demo default OR Scope 1 ≤ 0 OR Scope 2 ≤ 0 |
| D3-US-02 | As a Sustainability Reporting Manager, I want the company ID to auto-populate from the CINs in my Portfolio VaR holdings so I don't duplicate data entry | `linkedCINs = ctx.portfolioHoldings.filter(h => h.cin).map(h => ({cin, name}))` displayed as quick-fill options |
| D3-US-03 | As a Sustainability Reporting Manager, I want to upload a CSV with all emissions datapoints at once so I can populate all fields from our GHG inventory | DataUploadPanel accepts: company_id, framework, reporting_year, scope1_co2e, scope2_co2e, scope3_co2e, energy_mwh, water_m3, revenue_usd |
| D3-US-04 | As a Sustainability Reporting Manager, I want to see which percentage of the 1,111 ESRS datapoints are covered by my current data so I understand filing completeness | `filledCount / 5 × 1111` → factCount display; coverage radar chart |
| D3-US-05 | As a Sustainability Reporting Manager, I want to export the multi-framework crosswalk table as a CSV so I can share it with our ESG data vendor | "↓ Export Crosswalk CSV" → `csrd_framework_crosswalk_{date}.csv` with: Indicator, ESRS, GRI, ISSB, EU Taxonomy, BRSR columns |

#### Persona 2: External Auditor / Limited Assurance Provider
**Role:** Validates that iXBRL tags match EFRAG taxonomy and that mandatory datapoints are present before issuing assurance opinion.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D3-US-06 | As an External Auditor, I want the audit readiness panel to show me exactly which fields are mandatory vs optional so I can scope my assurance engagement | Panel distinguishes mandatory (CSRD Art.29 / ESRS E1-6) from optional (Scope 3, Energy, Water) with clear visual indicators |
| D3-US-07 | As an External Auditor, I want to preview the iXBRL output before it is locked for filing so I can validate tag accuracy against the EFRAG 2024 taxonomy | iXBRL mode selector: Preview / Validate / Generate; Preview shows structured HTML with XBRL inline tags |
| D3-US-08 | As an External Auditor, I want to see the carbon intensity metric (tCO₂e / $M revenue) automatically calculated so I can cross-check it against industry benchmarks | `intensity = totalGHG / (revenue_usd / 1e6)` displayed as "GHG Intensity" KPI |

---

### Datapoint Lifecycle — EP-D3

#### Company Identification Fields

| Field | Type | Source | CSV Column | Context Source | Destination | Regulatory Use |
|---|---|---|---|---|---|---|
| `companyId` | string (CIN format) | Manual / upload / EP-D7 CIN pre-fill | `company_id` | `ctx.csrdCompanyId` | iXBRL `<ix:nonNumeric name="esrs:LegalEntityIdentifier">` | ESRS 2 entity identifier, MCA21 CIN |
| `repYear` | integer | Manual / upload | `reporting_year` | `ctx.csrdReportingYear` | iXBRL filing period context | CSRD Art.19a annual report period |
| `framework` | enum (ESRS/GRI/ISSB/EU_TAXONOMY/BRSR) | Manual / upload | `framework` | `ctx.csrdFramework` | Active framework selector; drives coverage radar | Multi-framework alignment |

#### Emissions Datapoints (ESRS E1-6 Mandatory)

| Field | Type | Source | CSV Column | Formula | XBRL Tag | Regulatory Mandate |
|---|---|---|---|---|---|---|
| `emissions.s1` | float (tCO₂e) | GHG inventory / manual | `scope1_co2e` | Direct measurement | `esrs:Scope1GHGEmissions` | CSRD Art.29, ESRS E1-6 §44, SEBI BRSR P6 C1 |
| `emissions.s2` | float (tCO₂e) | Energy invoices / GHG inventory | `scope2_co2e` | Market-based or location-based | `esrs:Scope2GHGEmissions` | CSRD Art.29, ESRS E1-6 §45, SEBI BRSR P6 C2 |
| `emissions.s3` | float (tCO₂e) | Upstream/downstream surveys | `scope3_co2e` | 15-category GHG Protocol | `esrs:Scope3GHGEmissions` | CSRD Art.29, ESRS E1-6 §51 (phased) |
| `emissions.energy` | float (MWh) | Energy management system | `energy_mwh` | Total energy consumed | `esrs:TotalEnergyConsumption` | ESRS E1-5, EU Taxonomy Annex I |
| `emissions.water` | float (m³) | Utility meters / EMS | `water_m3` | Total withdrawal | `esrs:TotalWaterWithdrawal` | ESRS E3-4 |
| `emissions.revenue` | float (USD) | Financial statements | `revenue_usd` | Net revenue | Denominator for intensity | ESRS E1 intensity metric |

#### Calculated / Derived Fields

| Field | Formula | Purpose |
|---|---|---|
| `totalGHG` | `s1 + s2 + s3` | Total GHG emissions (tCO₂e) |
| `intensity` | `totalGHG / (revenue_usd / 1e6)` | GHG intensity (tCO₂e / $M revenue) → ESRS E1-4 |
| `filledCount` | `count([s1, s2, s3, energy, water] > 0)` | Data completeness counter (0–5) |
| `factCount` | `round(1111 × filledCount / 5)` | Estimated ESRS facts covered (of 1,111 total) |
| Coverage by standard | `mapped / total` per ESRS_STANDARDS | Radar chart: ESRS 1/2/E1/E2/E3/E4/E5/S1/S2/S3/S4/G1 |
| Coverage by framework | `BASE_COVERAGE[fw]` (static) | Radar chart: ESRS 89%, GRI 74%, ISSB 68%, EU Tax 61%, BRSR 55% |

#### Audit Readiness Check Logic

```
MANDATORY (amber if failing):
  □ Company ID ≠ demo default ('L17110MH1973PLC019786') AND ≠ empty
  □ Scope 1 GHG (emissions.s1 > 0)   — ESRS E1-6 mandatory
  □ Scope 2 GHG (emissions.s2 > 0)   — ESRS E1-6 mandatory

OPTIONAL (gray if missing):
  □ Scope 3 GHG (emissions.s3 > 0)
  □ Energy consumption (emissions.energy > 0)
  □ Revenue for intensity (emissions.revenue > 0)

Border turns amber if any mandatory field fails.
```

---

### Workflow Steps (Analyst Journey)

```
Step 1: Configure Entity
   └─ Set Company ID (CIN format) — or auto-fill from EP-D7 portfolio CINs
   └─ Set reporting year, primary framework
   └─ System pre-fills ctx.csrdCompanyId, ctx.csrdFramework

Step 2: Upload Emissions Data
   └─ Upload GHG inventory CSV or enter manually
   └─ System populates: s1, s2, s3, energy, water, revenue
   └─ Coverage radar updates: factCount / 1,111 ESRS datapoints filled

Step 3: Audit Readiness Review
   └─ CSRDAuditReadinessPanel: green = all mandatory fields present
   └─ Amber warning: missing mandatory data → fix before generating
   └─ View crosswalk table: confirm multi-framework mapping is complete

Step 4: Generate iXBRL
   └─ Choose mode: Preview → Validate → Generate
   └─ API call: POST /api/v1/csrd-ixbrl/generate
   └─ Output: .xhtml file with inline XBRL tags per EFRAG 2024 taxonomy
   └─ Export crosswalk CSV → ESG data vendor / auditor workpapers
   └─ Generated file → ESMA XBRL validator → regulatory submission portal
```

---

## EP-D4 — Pipeline Operations Dashboard
**Epic ID:** EP-D4 | **Regulatory Basis:** RBI Data Governance Guidelines 2021, SEBI BRSR Filing SLA Deadlines, PCAF WACI Data Lineage

### Module Purpose
Monitors the health, SLA compliance, and audit lineage of all data ingestion pipelines that feed the risk analytics platform. Provides a real-time view of data freshness (critical for SEBI BRSR filing deadlines) and pipeline failure alerting. This module ensures that all data consumed by EP-D1/D3/D6/D7 is traceable to a specific pipeline run with timestamp, record count, and error log.

---

### User Personas & User Stories

#### Persona 1: Data Operations Engineer
**Role:** Monitors pipeline health, investigates failures, triggers manual re-runs.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D4-US-01 | As a Data Operations Engineer, I want to see a pipeline health table with last-run status, duration, record count, and regulatory impact for each pipeline so I can prioritize incidents | Table: Pipeline, Schedule, Domain, Status (color badge), Records Processed, Duration, Regulatory Impact, SLA Status |
| D4-US-02 | As a Data Operations Engineer, I want to manually trigger a pipeline run from the dashboard so I can re-run after a failure without CLI access | "▷ Run" button per pipeline; POST `/api/v1/data-pipeline/trigger/{id}`; `triggering` state shows spinner |
| D4-US-03 | As a Data Operations Engineer, I want live streaming log output when I view a pipeline run so I can diagnose errors in real-time | "View Logs" → `genLogLines(pipelineId, status)` streams 10 log lines with timestamps and error messages |
| D4-US-04 | As a Data Operations Engineer, I want auto-refresh (every 30 seconds) to monitor ongoing pipeline runs without manual page reload | Auto-refresh toggle → `setInterval(load, 30000)` via `autoRef` |

#### Persona 2: Risk Technology Lead
**Role:** Sets SLA thresholds, reviews success rate trends, escalates to Pillar 3 data governance committee.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D4-US-05 | As a Risk Technology Lead, I want to configure success rate and duration thresholds so the dashboard highlights pipelines at risk of SLA breach | Success threshold slider (70–99%); Duration threshold slider (5,000–30,000ms) |
| D4-US-06 | As a Risk Technology Lead, I want a run history chart showing success vs failure vs partial over the last 30 days so I can trend pipeline reliability | Area chart: x=date, y=records_processed, colored by status; failed runs shown in red |
| D4-US-07 | As a Risk Technology Lead, I want to see "Regulatory Impact" for each pipeline so I know which failures have regulatory consequences | `PIPELINE_REGULATORY_MAP` maps each pipeline to its regulatory impact string |

#### Persona 3: Compliance / Internal Audit
**Role:** Reviews data lineage for BRSR filing submissions; ensures PCAF WACI data freshness.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| D4-US-08 | As a Compliance Officer, I want to filter run history by date range so I can show regulators all pipeline runs during the BRSR reporting period | Date from/to filters on run history table |
| D4-US-09 | As a Compliance Officer, I want to see record count processed per run so I can confirm data completeness for the BRSR 1,323-company universe | `records_processed` column in run history table |

---

### Datapoint Lifecycle — EP-D4

#### Pipeline Registry Fields

| Field | Type | Source | Destination | Regulatory Use |
|---|---|---|---|---|
| `id` | string | Platform config (`DEFAULT_PIPELINES`) | API trigger URL `/api/v1/data-pipeline/trigger/{id}` | Audit trail key |
| `label` | string | Platform config | Dashboard table, log header | Human-readable pipeline name |
| `schedule` | string (cron description) | Platform config | SLA Status column context | SEBI BRSR data freshness SLA |
| `domain` | string | Platform config | Dashboard table | Data domain classification |
| `expectedMs` | integer | Platform config (per-pipeline SLA) | SLA breach detection: `duration_ms > expectedMs × 2` | Performance SLA |

#### Pipeline Run History Fields

| Field | Type | Source | Destination | Regulatory Use |
|---|---|---|---|---|
| `run_id` | string | Backend pipeline engine | Run history table row key | Audit trail reference |
| `pipeline_id` | string | Pipeline engine | Joins to pipeline registry | SLA reporting |
| `started_at` | ISO timestamp | Pipeline engine | Run history date column, date filter | BRSR data lineage timestamp |
| `status` | enum (success/failed/partial/running/skipped) | Pipeline engine | Color badge, chart color, SLA flag | Data quality certification |
| `records_processed` | integer | Pipeline engine | Run history table, area chart | BRSR completeness: 482K records / 30d |
| `duration_ms` | integer | Pipeline engine | Duration column, P95 KPI | SLA: `duration_ms > expectedMs×2` = breach |
| `error_count` | integer | Pipeline engine | Error badge in run history | Root cause analysis, audit finding |

#### Regulatory Impact Map

| Pipeline | Regulatory Impact | SLA |
|---|---|---|
| `brsr-enrichment` | SEBI BRSR Core P6 data freshness | 24h |
| `iea-pathways-sync` | TCFD Fwd Scenario / EP-D1 inputs | Weekly |
| `ngfs-seed` | ECB/EBA scenario alignment / EP-D6 | On deploy |
| `nature-risk-loader` | TNFD / GBF Kunming-Montreal | Weekly |
| `pcaf-waci-calc` | PCAF v2 WACI for BRSR/CSRD | 24h |
| `regulatory-monitor` | Multi-framework change alerts | Daily |

---

### Workflow Steps (Analyst Journey)

```
Step 1: Dashboard Overview
   └─ KPI row: total runs 30d, success rate %, avg duration, P95 duration, total records
   └─ Pipeline health table: last-run status per pipeline with regulatory impact

Step 2: Investigate Failures
   └─ Red "Failed" badge → "View Logs" → streaming log console
   └─ Error log lines show: batch number, error type, retry outcome
   └─ Identify: connection timeout, schema mismatch, data gap

Step 3: Remediate
   └─ Fix upstream data source or ETL config
   └─ Click "▷ Run" to trigger manual re-run
   └─ SLA Status updates: "⚠ SLA BREACH RISK" → "✓ 24h" after successful re-run

Step 4: SLA Reporting
   └─ Filter history by date range for regulatory period
   └─ Export or screenshot for Pillar 3 data governance report
   └─ Record counts confirm completeness for BRSR 1,323-company universe
```

---

## PCAF India BRSR — Financed Emissions Calculator
**Regulatory Basis:** PCAF Global GHG Accounting & Reporting Standard (Parts A, B, C — 3rd Edition Dec 2025), SEBI BRSR Core FY2024, RBI Climate Risk Guidelines 2023, GHG Protocol Corporate Value Chain (Scope 3)

### Module Purpose
The PCAF India BRSR module is the **most granular financed-emissions calculation engine** on the platform. It implements the full PCAF standard across three asset classes:
- **Part A:** Financial Institution Portfolio (equity, bonds, loans, project finance, real estate, mortgages, vehicles, green bonds, securitisations, sub-sovereign debt)
- **Part B:** Insurance-Associated Emissions (motor, property, commercial, life, health, reinsurance, project insurance)
- **Part C:** Facilitated Emissions (capital markets: bond underwriting, IPO, equity placement, syndicated loans, securitisation, convertible underwriting, M&A advisory)

This is the **BRSR P6 computation hub** — it produces the Weighted Average Carbon Intensity (WACI) and financed emissions figures that feed into the SEBI BRSR Core filing and PCAF disclosure.

---

### User Personas & User Stories

#### Persona 1: ESG / Sustainability Analyst (Financed Emissions Lead)
**Role:** Calculates and reports Scope 3 Category 15 (financed emissions) under GHG Protocol and PCAF standard.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| PCAF-US-01 | As a Financed Emissions Analyst, I want to calculate PCAF-attributed emissions for our entire equity and bond portfolio so I can report Scope 3 Cat 15 in our BRSR filing | Part A: POST `/api/v1/e138-pcaf/brsr-portfolio` → returns attributed_tco2e per holding + WACI |
| PCAF-US-02 | As a Financed Emissions Analyst, I want the attribution factor (AF) automatically calculated per PCAF standard by instrument type so I don't need to manually compute it | Listed Equity/Bond: `AF = exposure / EVIC`; Project Finance: `AF = committed / total_project_cost`; Mortgage: `AF = loan / property_value` |
| PCAF-US-03 | As a Financed Emissions Analyst, I want to assign DQS (Data Quality Score 1–5) overrides per holding so I can flag where proxy data is used vs verified GHG data | `dqs_override` field per holding; DQS badge colored: DQS1=green → DQS5=red |
| PCAF-US-04 | As a Financed Emissions Analyst, I want autocomplete when entering company names so CIN is auto-populated from the India company registry | `CompanyAutocomplete` → matches against 60+ `COMPANY_SUGGESTIONS`; auto-fills `cin` and `sector_gics` |
| PCAF-US-05 | As a Financed Emissions Analyst, I want to calculate insurance-associated emissions for our motor, property, and commercial policies per PCAF Part B so we comply with IRDAI climate disclosure requirements | Part B: POST `/api/v1/facilitated-emissions/insurance/batch` → premium-weighted vehicle emissions (motor), area × EPC factor (property), revenue-based sector EF (commercial) |
| PCAF-US-06 | As a Financed Emissions Analyst, I want to calculate facilitated emissions for deals we underwrote/arranged per PCAF Part C so we disclose full capital markets climate footprint | Part C: POST API → bond underwriting: `AF = underwritten/deal_size`; IPO: `AF = placed/(mcap×3)`; syndicated: `AF = tranche/facility` |

#### Persona 2: Risk / Credit Officer
**Role:** Uses PCAF WACI to assess portfolio climate alignment; reports to RBI.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| PCAF-US-07 | As a Credit Officer, I want to see WACI (tCO₂e / $M revenue) for the portfolio so I can benchmark against India sector averages and report to RBI | `waci = Σ(attributed_tco2e_i) / Σ(exposure_i × revenue_i / evic_i)` displayed as WACI KPI |
| PCAF-US-08 | As a Credit Officer, I want a pie chart of attributed emissions by sector so I can identify concentration risk in high-emitting sectors | Recharts PieChart: sector → attributed_tco2e, colored by CHART_COLORS |
| PCAF-US-09 | As a Credit Officer, I want to look up individual companies by CIN to see their BRSR-reported emissions data so I can validate our proxy data against self-reported figures | Company Lookup tab: GET `/api/v1/brsr-companies/{cin}` → returns BRSR P6 emissions data from 1,323-company database |

#### Persona 3: Capital Markets / IB Analyst
**Role:** Tracks facilitated emissions from underwriting/advisory transactions for annual PCAF Part C disclosure.

| Story ID | User Story | Acceptance Criteria |
|---|---|---|
| PCAF-US-10 | As a Capital Markets Analyst, I want to add new deals (bond underwriting, IPO, syndicated loans) with deal-specific attribution fields so facilitated emissions are tracked per transaction | DEAL_TYPE_FIELDS config drives dynamic form fields per deal type |
| PCAF-US-11 | As a Capital Markets Analyst, I want to flag green bonds/loans so facilitated emissions for sustainable finance are separated in reporting | `green_bond` boolean field per deal; green deals badge-highlighted in output |

---

### Datapoint Lifecycle — PCAF Part A (Portfolio)

#### Holding Master Fields

| Field | Type | Source | PCAF Reference | Attribution Formula | Destination |
|---|---|---|---|---|---|
| `cin` | string | MCA21 company registry / CBS | Company identifier | CIN lookup → BRSR P6 emissions | Company lookup tab, BRSR reporting |
| `company_name` | string | CBS / autocomplete | Display | — | Portfolio table, BRSR filing |
| `sector_gics` | enum | BRSR database / CBS | PCAF sector calibration | Proxy EF if scope data missing | Sector pie chart, WACI denominator |
| `revenue_inr_cr` | float (₹Cr) | BRSR filing / company accounts | PCAF §3.1 (WACI denominator) | `waci_contrib = attributed_tco2e / (revenue / evic × exposure)` | WACI calculation |
| `evic_inr_cr` | float (₹Cr) | Market data / Bloomberg | PCAF §3.1 (Enterprise Value incl. Cash) | `AF_equity = exposure / evic` | Attribution factor denominator |
| `exposure_inr_cr` | float (₹Cr) | CBS portfolio system | PCAF §3.1 | `AF = exposure / evic` | Attribution factor numerator |
| `scope1_co2e` | float (tCO₂e) | BRSR P6 / EPA submission | PCAF §2.1 (GHG data) | `attributed = AF × (scope1 + scope2)` | Financed emissions Scope 1 |
| `scope2_co2e` | float (tCO₂e) | BRSR P6 / CDP | PCAF §2.1 | `attributed = AF × (scope1 + scope2)` | Financed emissions Scope 2 |
| `scope3_co2e` | float (tCO₂e) | BRSR P6 / GHG Protocol | PCAF §2.3 (optional) | `attributed_s3 = AF × scope3` | Scope 3 Cat 15 |
| `dqs_override` | integer (1–5) | Analyst judgment | PCAF DQS framework | Overrides auto-calculated DQS | DQS badge, PCAF disclosure quality tier |
| `instrument_type` | enum | CBS instrument classification | PCAF asset class routing | Routes to correct AF formula | PCAF Part A section assignment |

#### Attribution Factor (AF) by Instrument Type

| Instrument | AF Formula | PCAF Reference |
|---|---|---|
| Listed Equity | `exposure / EVIC` | PCAF §3.1 |
| Corporate Bond | `exposure / EVIC` | PCAF §3.2 |
| Business Loan | `exposure / (equity + debt of borrower)` | PCAF §3.3 |
| Project Finance | `bank_committed / total_project_cost` | PCAF §3.4 |
| Commercial Real Estate | `loan / property_value` | PCAF §3.5 |
| Mortgage | `mortgage / property_value` | PCAF §3.5 |
| Vehicle Loan | `loan / replacement_cost` | PCAF §3.6 |
| Sovereign Bond | `exposure / (GDP × PPP_factor)` | PCAF §3.7 |
| Use of Proceeds | `invested / total_issue` | PCAF 3rd Ed §3.8 NEW |
| Securitisation | `tranche / pool_size` | PCAF 3rd Ed §3.9 NEW |
| Sub-sovereign Debt | `exposure / jurisdiction_budget` | PCAF 3rd Ed §3.10 NEW |
| Undrawn Commitments | `undrawn × expected_drawdown%` | PCAF 3rd Ed §3.11 NEW |

#### DQS (Data Quality Score) Framework

| Score | Label | Color | Trigger Condition |
|---|---|---|---|
| 1 | Verified GHG data | Green | Third-party verified scope 1+2 data |
| 2 | Audited data | Yellow-green | Audited but not third-party verified |
| 3 | Reported data | Amber | Company self-reported in BRSR/CDP |
| 4 | Sector-level proxy | Orange | PCAF sector average emission factor |
| 5 | Least granular | Red | Economic proxy (revenue-based EF) |

---

### Datapoint Lifecycle — PCAF Part B (Insurance)

#### Policy Fields

| Field | Type | Source | PCAF Part B Reference | Attribution Method |
|---|---|---|---|---|
| `policy_id` | string | Insurance policy system | — | Policy-level tracking |
| `line_of_business` | enum | Policy system | Routes to sub-method: motor/property/commercial | Premium-weighted attribution |
| `gross_written_premium_inr_cr` | float | Policy system | PCAF Part B §5.1 (attribution factor base) | `AF_motor = GWP / total_motor_GWP` |
| `vehicle_count` | integer | Policy data | PCAF Part B §5.2.1 | `emissions = vehicles × km × EF(fuel_type)` |
| `fuel_type` | enum | Policy data | PCAF Part B §5.2.1 | Emission factor lookup (petrol/diesel/BEV/CNG/LPG) |
| `annual_km_per_vehicle` | float | Policy data / default 12,000 | PCAF Part B §5.2.1 | Activity data for motor emissions |
| `insured_property_area_m2` | float | Property survey | PCAF Part B §5.2.2 | `emissions = area × EPC_factor` |
| `epc_rating` | enum (A+ to G) | EPC certificate | PCAF Part B §5.2.2 | EPC → kWh/m² → tCO₂e |
| `insured_revenue_inr_cr` | float | Commercial policy | PCAF Part B §5.2.3 | `emissions = revenue × sector_EF` |
| `nace_sector` | string | Commercial policy | PCAF Part B §5.2.3 | NACE → sector emission intensity |
| `ceded_premium_inr_cr` | float | Reinsurance treaty | PCAF Part C 2nd Ed §7.1 NEW | `AF_ri = ceded / cedent_GWP` |
| `sum_insured_inr_cr` | float | Project insurance | PCAF Part C 2nd Ed §7.2 NEW | `AF_proj = sum_insured / project_cost` |

---

### Datapoint Lifecycle — PCAF Part C (Facilitated Emissions)

#### Deal Fields

| Field | Type | Source | PCAF Part C Reference | AF Formula |
|---|---|---|---|---|
| `deal_type` | enum | IB deal system | Routes to Part C section | — |
| `underwritten_amount_inr_cr` | float | IB deal system | PCAF Part C §6.1 | `AF = underwritten / deal_size` |
| `total_deal_size_inr_cr` | float | IB deal system | PCAF Part C §6.1 | Attribution denominator |
| `shares_placed_value_inr_cr` | float | IB deal system | PCAF Part C §6.2 | `AF_ipo = placed / (mcap × 3)` |
| `market_cap_inr_cr` | float | Market data | PCAF Part C §6.2/6.3 | Attribution denominator |
| `tranche_held_inr_cr` | float | IB deal system | PCAF Part C §6.4 (syndicated) | `AF = tranche / facility` |
| `total_facility_inr_cr` | float | IB deal system | PCAF Part C §6.4 | Attribution denominator |
| `green_bond` | boolean | Deal classification | PCAF Part C §6.1 | Flagged in output; separate green finance line |
| `issuer_revenue_inr_cr` | float | Company accounts | PCAF Part C §6.1 | Issuer WACI denominator |

---

### Workflow Steps — PCAF India BRSR

```
Step 1: Part A — Portfolio Emissions
   └─ Load holdings (default 8 holdings across equity, bonds, green bonds, securitisation, sub-sovereign)
   └─ Enter/confirm: CIN, EVIC, Revenue, Exposure, Scope 1/2/3, DQS
   └─ Auto-fill via company name autocomplete (60+ Indian companies)
   └─ Click "Calculate Portfolio Emissions"
   └─ API → returns: attributed_tco2e per holding, portfolio WACI, DQS breakdown
   └─ Charts: sector pie chart, DQS quality breakdown bar chart

Step 2: Part B — Insurance Emissions
   └─ Load insurance policies (default 8 policies: motor personal/commercial, property, marine, life, health, reinsurance, project)
   └─ Enter policy-specific fields: vehicle count/km/fuel, area/EPC, revenue/NACE sector
   └─ INR Cr → USD conversion: × 0.12 (implicit)
   └─ Click "Calculate Insurance Emissions"
   └─ API → returns: attributed_tco2e per policy by LOB method

Step 3: Part C — Facilitated Emissions
   └─ Load facilitated deals (default 5 deals across IB products)
   └─ Enter deal-specific fields: underwritten amount, deal size, shares placed, etc.
   └─ Click "Calculate Facilitated Emissions"
   └─ API → returns: facilitated_tco2e per deal, green vs. brown split

Step 4: Company Lookup & Reference Data
   └─ Company Lookup tab: search by CIN or company name
   └─ GET /api/v1/brsr-companies/{cin} → returns BRSR P6 reported emissions for validation
   └─ Reference Data tab: emission factors by sector/country/instrument
   └─ Cross-validate proxy data (DQS 4/5) against company-reported data (DQS 1/2/3)

Step 5: Consolidated BRSR/PCAF Report
   └─ Total Scope 3 Cat 15 = Part A + Part B + Part C attributed emissions
   └─ Portfolio WACI = tCO₂e / $M revenue (weighted)
   └─ DQS distribution: % of portfolio at each quality tier
   └─ Export → SEBI BRSR Core P6 filing inputs; PCAF annual disclosure report
```

---

## End-to-End Transaction Lifecycle

### Complete Data Flow: From Source to Regulatory Disclosure

```
DATA INGESTION LAYER (EP-D4 Pipeline Monitor)
│
├── brsr-enrichment pipeline (Daily 02:00 IST)
│   └── Source: MCA21 company database + SEBI BRSR Portal
│   └── Loads: 1,323 company CINs + Scope 1/2/3 reported data
│   └── Destination: /api/v1/brsr-companies/ → PCAF Part A DQS 1-3
│
├── iea-pathways-sync pipeline (Weekly Sun 00:00)
│   └── Source: IEA WEO 2023 API / static files
│   └── Loads: Phase-out years per technology × scenario
│   └── Destination: /api/v1/ngfs-scenarios/{id}/stranded-bridge → EP-D1
│
├── ngfs-seed pipeline (Manual / on deploy)
│   └── Source: NGFS Phase 3 scenario database
│   └── Loads: 8 scenarios × economic parameters
│   └── Destination: /api/v1/ngfs-scenarios/ → EP-D6 BASE_SCENARIOS
│
├── pcaf-waci-calc pipeline (Daily 03:30 IST)
│   └── Source: Portfolio holdings × company GHG data
│   └── Calculates: WACI per portfolio segment
│   └── Destination: PCAF India BRSR Part A results
│
└── regulatory-monitor pipeline (Daily 06:00 UTC)
    └── Source: ESMA/SEBI/RBI/EFRAG regulatory feeds
    └── Alerts: taxonomy changes, new mandatory datapoints
    └── Destination: EP-D3 framework coverage updates

                        ↓

SCENARIO GOVERNANCE LAYER (EP-D6 NGFS Scenarios)
│
├── Analyst selects NGFS scenario (e.g., Net Zero 2050)
├── ctx.setSelectedNgfsScenario('NGFS_P3_NET_ZERO_2050', {...})
└── Broadcasts to all downstream modules via TestDataContext

                        ↓

RISK CALCULATION LAYER

EP-D7 Portfolio Climate VaR
├── Input: portfolioHoldings[] (from CBS upload)
├── Input: selectedNgfsScenarioId → SCENARIO_MULT = 1.0 (NZE)
├── Calculates: per-holding T-VaR and P-VaR
├── Aggregates: combined VaR = √(T² + P² + 2ρTP)
├── Output: combined_var_pct → SEBI BRSR P6, RBI capital buffer
└── Output: portfolioHoldings[].cin → EP-D3 company ID pre-fill

EP-D1 Stranded Assets
├── Input: selectedNgfsScenarioId → maps to 'nze' phase-out column
├── Input: discountRate (default 8%)
├── Input: portfolioHoldings → linkedExposure for energy/mining
├── Calculates: pv = book / (1+r)^(phaseOut-2026)
├── Calculates: impairment = book - pv
├── Output: impairPct → IND AS 109 Stage 2/3 flag
└── Output: Export CSV → credit risk system / TCFD report

PCAF India BRSR
├── Input: holdings with CIN → /api/v1/brsr-companies/{cin}
├── Input: EVIC, exposure, scope1/2/3
├── Calculates: AF = exposure / EVIC
├── Calculates: attributed_tco2e = AF × (scope1 + scope2)
├── Calculates: WACI = Σattributed / Σ(revenue-weighted exposure)
└── Output: Scope 3 Cat 15 → BRSR Core P6 filing

                        ↓

DISCLOSURE GENERATION LAYER (EP-D3 CSRD iXBRL)
│
├── Input: csrdCompanyId (from EP-D7 portfolio CINs)
├── Input: emissions {s1, s2, s3, energy, water, revenue}
├── Input: combined_var_pct (from EP-D7)
├── Validates: CSRDAuditReadinessPanel (mandatory fields check)
├── Generates: iXBRL file tagged to EFRAG 2024 taxonomy
├── Tags: ESRS E1-6 (GHG), ESRS E1-5 (Energy), ESRS E3-4 (Water)
├── Tags: TCFD governance, IFRS S2 climate risk metrics
└── Output: .xhtml iXBRL → ESMA XBRL Validator → CSRD portal
                         → SEBI BRSR Core NSE/BSE filing
```

---

## Regulatory Disclosure Mapping

| Module | Output | Regulatory Filing | Standard | Deadline |
|---|---|---|---|---|
| EP-D6 | Scenario narrative | TCFD Report | ECB SSM, EBA CRD6 | Annual |
| EP-D7 | combined_var_pct | SEBI BRSR Core P6 | SEBI BRSR | FY end + 60d |
| EP-D7 | RBI capital add-on | Capital Adequacy Report | RBI Draft Climate Buffer | Quarterly |
| EP-D1 | impairment per asset | Credit Risk Register | IND AS 109 / IFRS 9 | Quarterly |
| EP-D1 | Phase-out scenario | TCFD Forward Scenario | TCFD Scenario Analysis | Annual |
| EP-D3 | iXBRL .xhtml | CSRD Art.29 filing | ESRS E1-6 | Annual |
| EP-D3 | Multi-framework crosswalk | ESG Data Room | GRI/ISSB/BRSR | Annual |
| PCAF | WACI (tCO₂e/$M rev) | SEBI BRSR Core P6 | PCAF v2 §3.1 | FY end + 60d |
| PCAF | Scope 3 Cat 15 | GHG Protocol Report | PCAF / GHG Protocol | Annual |
| PCAF Part B | Insurance-assoc. emissions | IRDAI ESG Disclosure | PCAF Part B 2nd Ed | Annual |
| PCAF Part C | Facilitated emissions | Capital Markets ESG | PCAF Part C 2nd Ed | Annual |
| EP-D4 | Pipeline SLA log | Data Governance Audit | RBI Data Governance 2021 | Quarterly |

---

*Document generated: 2026-03-24 | Platform Version 6.0 | Sprint D Modules EP-D1, EP-D3, EP-D4, EP-D6, EP-D7 + PCAF India BRSR*
