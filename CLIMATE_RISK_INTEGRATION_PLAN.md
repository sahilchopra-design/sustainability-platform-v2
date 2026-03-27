# Climate Physical Risk & ESG Transition Risk — Integration Plan

## Overview

This plan maps every component from the requirements spec to the existing application,
identifying what to **extend**, what to **create new**, and the implementation order.

**Spec source**: `Climate Physical Risk & ESG Transition Risk Module — Complete Requirements Specification`
**57 configurable parameters** | **5 physical risk stages** | **6 transition risk stages** | **9 pre-calibrated templates** | **4-level hierarchy** (Portfolio > Fund > Security > Asset)

---

## 1. Existing Module Inventory & Reuse Map

### 1A. Modules That Already Exist (EXTEND)

| Spec Requirement | Existing Module | File(s) | What to Extend |
|---|---|---|---|
| **CBAM / Carbon Pricing** (Transition Stage 2) | CBAM Calculator | `services/cbam_calculator.py`, `services/cbam_service.py`, `api/v1/routes/cbam.py`, migration 001 | Add ETS price path integration, pass-through rate parameter, Scope 3 inclusion toggle, NGFS-derived carbon price curves |
| **Stranded Assets** (Transition Stage 3) | Stranded Asset Calculator | `services/stranded_asset_calculator.py`, `services/stranded_asset_db_service.py`, `api/v1/routes/stranded_assets.py`, migration 002 | Add writedown curve types (sigmoid, S-curve, step), technology substitution speed, residual value floor, phase-out pathway selector |
| **Nature Risk / TNFD** (Part 4.2) | Nature Risk Calculator | `services/nature_risk_calculator.py`, `services/nature_risk_seed_data.py`, `api/v1/routes/nature_risk.py`, migration 003 | Add ENCORE 167-sector x 21-service matrix as amplifier into physical/transition risk scores |
| **Scenario Analysis / NGFS** (Transition Stage 5) | Scenario Analysis Engine | `services/scenario_analysis_engine.py`, `services/ngfs_seeder.py`, `services/ngfs_sync_service.py`, 5+ route files, `db/models/ngfs_v2.py` | Upgrade from NGFS v2 to Phase 5 (6 scenarios), add macro feedback loops, stress severity multiplier, PD/LGD transition sensitivity params |
| **ECL Climate Overlay** (Damage Stage 4 PD/LGD) | ECL Climate Engine | `services/ecl_climate_engine.py`, `api/v1/routes/ecl_climate.py`, migration 006 | Wire physical risk PD sensitivity + LGD uplift factor into existing ECL stage determination |
| **Counterparty Climate Score** | Counterparty Climate Scorer | `services/counterparty_climate_scorer.py` | Feed new composite physical+transition scores as inputs |
| **Sector Classification** (Transition Stage 1) | Sector Assessments | `api/v1/routes/sector_assessments.py`, `api/v1/routes/sector_calculators.py`, migration 008 | Add NACE→CPRS→IAM mapping, CPRS risk weights, multi-activity revenue-weighted method |
| **Portfolio Alignment** (Transition Stage 4) | Portfolio Analytics | `services/portfolio_analytics_engine.py` (mocked), Glidepath Tracker | Replace mocked engine with real alignment gap calculation, benchmark pathway selector, temperature overshoot penalty |
| **Carbon Credit Methodology** | Methodology Engine | `services/methodology_engine.py`, `api/v1/routes/cdm_tools.py` | Separate concept — carbon credit methodology ≠ assessment methodology. No conflict; co-exists. |
| **Data Lineage** | Data Lineage Service | `services/data_lineage_service.py` | Add MODULE_SIGNATURES for all new engines + dependency edges |
| **Insurance Climate Risk** | Insurance Climate Risk | `services/insurance_climate_risk.py` | Feed physical risk hazard scores as inputs to insurance CAT models |

### 1B. Modules To Create NEW

| Spec Component | New File(s) | Purpose |
|---|---|---|
| **Physical Risk Engine** (Stages 1-4) | `services/climate_physical_risk_engine.py` | HEV framework: Hazard → Exposure → Vulnerability → Damage/CVaR. ~26 configurable params. Covers 7 acute + 6 chronic hazards. |
| **Physical Risk Aggregator** (Stage 5) | `services/climate_risk_aggregator.py` | Multi-level roll-up: Asset → Security → Fund → Portfolio. Weighted avg/sum/max/median, diversification benefit, outlier treatment. |
| **Transition Risk Engine** (Stages 1-6 orchestrator) | `services/climate_transition_risk_engine.py` | Orchestrates sector classification → carbon pricing → stranded assets → alignment → NGFS stress → composite score. Calls existing services where possible. |
| **NACE-CPRS Mapper** | `services/nace_cprs_mapper.py` | Static lookup + revenue-weighted multi-activity scoring. Embedded reference dataset (NACE 4-digit → CPRS category → IAM sector). |
| **Integrated Risk Calculator** | `services/climate_integrated_risk.py` | Physical + Transition combined score with interaction term, scenario weighting, nature risk amplifier. |
| **Assessment Methodology Manager** | `services/assessment_methodology_manager.py` | CRUD + lifecycle (DRAFT→PUBLISHED→RETIRED→ARCHIVED), versioning, validation, 9 pre-calibrated templates, clone, diff, approval chain. |
| **Assessment Runner** | `services/assessment_runner.py` | Orchestrates runs: selects methodology, resolves entity hierarchy, dispatches calculation, stores results. Batch + scheduled modes. |
| **Climate Risk API Routes** | `api/v1/routes/climate_risk.py` | Unified endpoints: `/api/v1/climate-risk/physical`, `/transition`, `/integrated`, `/methodologies`, `/assessments`, `/reports` |
| **Climate Risk Frontend Page** | `frontend/src/pages/ClimateRiskPage.jsx` | Tabbed layout: Physical Risk / Transition Risk / Integrated View / Methodology Builder / Assessment Runner / Reports |
| **Reference Datasets** | Embedded in engine files | NACE-CPRS mapping, sector vulnerability matrix, NGFS Phase 5 scenario params, damage function coefficients, ENCORE dependency scores |
| **DB Migration** | `alembic/versions/039_add_climate_risk_assessment_tables.py` | Tables: assessment_methodologies, assessment_runs, assessment_results, physical_risk_scores, transition_risk_scores, entity_hierarchy, methodology_templates |
| **Tests** | `tests/test_climate_physical_risk.py`, `tests/test_climate_transition_risk.py`, `tests/test_assessment_methodology.py`, `tests/test_climate_integration.py` | Unit tests for each engine + integration tests |

---

## 2. Implementation Chunks (Ordered)

### Chunk A: Physical Risk Engine + Reference Data (Core Calculation)
**Files**: 2 new services, 1 test file
**Effort**: ~600 lines service + ~300 lines tests

1. **`services/climate_physical_risk_engine.py`** (~500 lines)
   - `PhysicalRiskConfig` — Pydantic model with all 26 physical risk params (defaults from spec)
   - `HazardAssessor` — Stage 1: intensity × frequency × duration scoring per hazard/asset/scenario/horizon
   - `ExposureAssessor` — Stage 2: asset value × exposure fraction × concentration factor
   - `VulnerabilityAssessor` — Stage 3: base sector vulnerability × structural modifiers × adaptation discount × cascading multiplier
   - `DamageCalculator` — Stage 4: CVaR = Σ(hazard × exposure × vuln × damage_function) × weight. Supports Linear/Sigmoid/Exponential/Step curves
   - `PhysicalRiskEngine.assess()` — orchestrates stages 1-4, returns per-hazard + composite scores
   - **Embedded reference data**: sector vulnerability matrix (NACE sector × 13 hazards), damage function coefficients, hazard intensity scales

2. **`services/nace_cprs_mapper.py`** (~200 lines)
   - NACE 4-digit → CPRS category mapping (embedded dict, ~600 entries)
   - CPRS → IAM sector mapping
   - Revenue-weighted multi-activity scoring
   - GHG intensity bucket classification

3. **`tests/test_climate_physical_risk.py`** (~300 lines)
   - Test each stage independently
   - Test full pipeline with sample bank/energy/manufacturing portfolios
   - Test all damage function curve types
   - Test configurable params actually change outputs
   - Test hazard inclusion mask (toggle individual hazards on/off)

### Chunk B: Transition Risk Engine (Orchestrator + New Stages)
**Files**: 1 new service, 1 test file
**Effort**: ~500 lines service + ~250 lines tests

1. **`services/climate_transition_risk_engine.py`** (~500 lines)
   - `TransitionRiskConfig` — Pydantic model with all 26 transition risk params
   - `SectorClassifier` — Stage 1: NACE→CPRS scoring (uses nace_cprs_mapper)
   - `CarbonPricer` — Stage 2: Scope1 × carbon_price + CBAM_exposure × CBAM_rate + Scope2 × elec_uplift (extends existing CBAM calculator data)
   - `StrandedAssetAssessor` — Stage 3: wraps existing stranded_asset_calculator with writedown curve types + residual value floor
   - `AlignmentCalculator` — Stage 4: alignment gap = current intensity − pathway target; transition readiness = Σ(wk × indicator_k)
   - `ScenarioStressTester` — Stage 5: TransitionCVaR = carbon_cost + stranded_risk + tech_disruption + market_shift (uses NGFS Phase 5 params)
   - `CompositeScorer` — Stage 6: weighted sum of Policy/Legal + Technology + Market + Reputation
   - `TransitionRiskEngine.assess()` — orchestrates stages 1-6

2. **`tests/test_climate_transition_risk.py`** (~250 lines)
   - Test sector classification with multi-NACE counterparties
   - Test carbon pricing with/without CBAM
   - Test stranded asset writedown curves
   - Test alignment gap calculation vs IEA NZE pathway
   - Test all 6 NGFS scenarios produce different outputs
   - Test composite score weights sum to 1.0

### Chunk C: Integrated Risk + Aggregator + Methodology Manager
**Files**: 3 new services, 1 test file
**Effort**: ~800 lines services + ~350 lines tests

1. **`services/climate_integrated_risk.py`** (~200 lines)
   - Combined score: w_p × Physical + w_t × Transition + α × InteractionTerm
   - Interaction types: Additive, Multiplicative, Max, Custom
   - Scenario weighting: Equal, Probability-weighted, Custom
   - Nature risk amplifier (calls nature_risk_calculator for ENCORE scores)

2. **`services/climate_risk_aggregator.py`** (~250 lines)
   - Multi-level roll-up: Asset → Security → Fund → Portfolio
   - Aggregation functions: Weighted Average, Sum, Max, Min, Median, Value-weighted
   - Diversification benefit (on/off + factor)
   - Outlier treatment: Cap, Winsorize, Include
   - Contribution analysis: incremental VaR decomposition per child entity

3. **`services/assessment_methodology_manager.py`** (~350 lines)
   - `MethodologyConfig` — full Pydantic model (physical_risk_config + transition_risk_config + integration_config + output_config)
   - CRUD: create_draft, update_draft, publish, retire, archive, clone
   - Lifecycle validation: only DRAFT editable, only PUBLISHED runnable
   - Version auto-increment on publish
   - `change_log` tracking (field-level diffs)
   - **9 pre-calibrated templates** embedded as frozen MethodologyConfig instances:
     - EU Bank Baseline, EU Bank Conservative, Energy Transition Focus, Energy Physical Focus,
       Manufacturing CBAM, Supply Chain Resilience, Canadian OSFI Aligned, TCFD Disclosure Quick, Nature-Inclusive TNFD
   - Validation: weights sum to 1.0, params within valid ranges, no conflicting settings
   - JSON export/import for methodology definitions

4. **`tests/test_assessment_methodology.py`** (~200 lines)
   - Test lifecycle transitions
   - Test clone creates independent copy
   - Test all 9 templates load and validate
   - Test version increment on publish
   - Test change_log records field diffs

5. **`tests/test_climate_integration.py`** (~150 lines)
   - Test combined physical + transition score
   - Test interaction terms
   - Test multi-level aggregation
   - Test full pipeline: methodology → runner → results

### Chunk D: Assessment Runner + API Routes + DB Migration
**Files**: 1 service, 1 route, 1 migration, wiring
**Effort**: ~400 lines service + ~300 lines routes + ~200 lines migration

1. **`services/assessment_runner.py`** (~400 lines)
   - `AssessmentRun` — config model (methodology_id, target_type, target_ids, drill_down_depth, scenarios, time_horizons)
   - `run_assessment()` — resolves entity hierarchy, loads methodology, dispatches physical + transition engines, aggregates, stores results
   - `run_batch()` — parallel execution of multiple portfolios/methodologies
   - Delta report: compare current vs previous run, highlight changes > threshold
   - Result serialization: nested structure per entity per scenario per horizon

2. **`api/v1/routes/climate_risk.py`** (~300 lines)
   - `POST /api/v1/climate-risk/physical/assess` — single-entity physical risk
   - `POST /api/v1/climate-risk/transition/assess` — single-entity transition risk
   - `POST /api/v1/climate-risk/integrated/assess` — combined score
   - `GET/POST /api/v1/climate-risk/methodologies` — CRUD + list/filter
   - `POST /api/v1/climate-risk/methodologies/{id}/publish` — lifecycle transitions
   - `POST /api/v1/climate-risk/methodologies/{id}/clone` — clone to draft
   - `POST /api/v1/climate-risk/assessments/run` — launch assessment run
   - `GET /api/v1/climate-risk/assessments/{id}` — get run status + results
   - `GET /api/v1/climate-risk/assessments/{id}/drill-down` — entity drill-down
   - `GET /api/v1/climate-risk/templates` — list pre-calibrated templates
   - `POST /api/v1/climate-risk/reports/generate` — regulatory template generation

3. **`alembic/versions/039_add_climate_risk_assessment_tables.py`** (~200 lines)
   - `climate_assessment_methodologies` — id, name, description, version, status, target_sectors, config JSONB, change_log JSONB, approval_chain JSONB
   - `climate_assessment_runs` — id, methodology_id FK, target_type, target_ids, drill_down_depth, scenarios, time_horizons, status, triggered_by, timestamps
   - `climate_assessment_results` — id, run_id FK, entity_id, entity_type, entity_level, scenario, time_horizon, physical_score JSONB, transition_score JSONB, integrated_score, drill_down JSONB
   - `climate_physical_risk_scores` — id, result_id FK, hazard_type, hazard_score, exposure_score, vulnerability_score, damage_estimate, cvar
   - `climate_transition_risk_scores` — id, result_id FK, category (policy/tech/market/reputation), sector_score, carbon_cost, stranded_risk, alignment_gap, readiness_score, composite_score
   - `climate_methodology_templates` — id, name, description, sector_target, config JSONB (seeded with 9 templates)

4. **Wiring**: server.py (import + include_router), data_lineage_service.py (signatures + edges)

### Chunk E: Frontend Page + Navigation
**Files**: 1 new page, App.js edits
**Effort**: ~800 lines JSX

1. **`frontend/src/pages/ClimateRiskPage.jsx`** (~800 lines)
   - **Tab 1: Physical Risk Assessment**
     - Hazard coverage table (13 hazards, acute/chronic toggle)
     - Sector vulnerability heatmap (read-only from methodology)
     - Per-entity physical risk scores with hazard decomposition bar chart
     - CVaR by scenario + time horizon line chart
   - **Tab 2: Transition Risk Assessment**
     - NACE→CPRS sector classification breakdown
     - Carbon pricing impact (Scope 1/2/3 cost chart)
     - Stranded asset exposure waterfall
     - Portfolio alignment gap vs benchmark pathway
     - Composite transition score by TCFD category (radar chart)
   - **Tab 3: Integrated Risk View**
     - Physical × Transition combined heatmap
     - Scenario comparison matrix (6 NGFS scenarios × risk type)
     - Top-N risk contributors table with drill-down
     - Nature risk amplifier overlay
   - **Tab 4: Methodology Manager**
     - Methodology library (searchable/filterable list by status, sector, creator)
     - Parameter panel (tabbed: Physical → Transition → Integration → Output)
     - Weight slider arrays with real-time normalization
     - Template selector (9 pre-calibrated, clone to draft)
     - Lifecycle controls (Publish / Retire / Archive / Clone)
     - Version history
   - **Tab 5: Assessment Runner**
     - Run configurator: select methodology + target entities + scope
     - Progress tracker with status badges
     - Results viewer with drill-down navigation
     - Delta report (current vs previous run)
   - **Tab 6: Regulatory Reports**
     - EBA Pillar 3 ESG template preview
     - CSRD ESRS E1-9 / E1-10 financial effects
     - ISSB S2 / TCFD four-pillar output
     - Export controls (PDF / XLSX / JSON)

2. **App.js** — Add nav entry in "Risk & Sector" group:
   `{ to: '/climate-risk', icon: 'thermometer', label: 'Climate Risk Engine', badge: 'NEW' }`
   Add Route: `<Route path="/climate-risk" element={<ClimateRiskPage />} />`

---

## 3. Dependency Graph

```
Chunk A: Physical Risk Engine + NACE-CPRS Mapper
    ↓ (physical scores feed into transition + integration)
Chunk B: Transition Risk Engine (uses NACE-CPRS, extends CBAM + Stranded Assets)
    ↓ (both engines ready)
Chunk C: Integrated Risk + Aggregator + Methodology Manager
    ↓ (full calculation pipeline ready)
Chunk D: Assessment Runner + API Routes + DB Migration
    ↓ (backend complete)
Chunk E: Frontend Page + Navigation
```

Chunks A and B can be partially parallelized (physical and transition engines are independent), but B.Stage2 (carbon pricing) depends on A's NACE-CPRS mapper.

---

## 4. Existing Service Extension Details

### 4.1 CBAM Calculator Extensions
**File**: `services/cbam_calculator.py`
- Add `carbon_price_source` param (NGFS / IEA / Custom)
- Add `pass_through_rate` param (0-100%)
- Add `scope3_inclusion` toggle (Scope1 only / 1+2 / 1+2+3)
- Expose these via `TransitionRiskConfig` without breaking existing CBAM API

### 4.2 Stranded Asset Calculator Extensions
**File**: `services/stranded_asset_calculator.py`
- Add `writedown_curve` types beyond linear (Sigmoid, S-curve, Step, Front-loaded)
- Add `technology_substitution_speed` (Slow/Moderate/Fast/Custom)
- Add `residual_value_floor` param (0-30%)
- Add `phase_out_pathways` selector (IEA NZE / NGFS Orderly / Custom)

### 4.3 Scenario Analysis Engine Extensions
**File**: `services/scenario_analysis_engine.py`
- Upgrade NGFS v2 → Phase 5 scenario parameters
- Add `macro_feedback_loops` toggle
- Add `stress_severity_multiplier` param
- Add `pd_transition_sensitivity` + `lgd_transition_uplift` params
- Ensure all 6 scenarios available: Net Zero 2050, Below 2°C, Divergent Net Zero, Delayed Transition, NDCs, Current Policies

### 4.4 ECL Climate Engine Extensions
**File**: `services/ecl_climate_engine.py`
- Accept physical risk PD sensitivity + LGD uplift factor as inputs
- Wire climate_physical_risk_engine scores into ECL stage determination
- Add transition risk PD/LGD adjustments

### 4.5 Nature Risk Calculator Extensions
**File**: `services/nature_risk_calculator.py`
- Expose ENCORE dependency scores (167 sectors × 21 ecosystem services) as amplifiers
- Add integration hook: nature scores feed into both physical and transition risk as multipliers
- Map TNFD LEAP outputs to climate risk assessment inputs

### 4.6 Data Lineage Service Extensions
**File**: `services/data_lineage_service.py`
- Add MODULE_SIGNATURES for: `climate_physical_risk_engine`, `climate_transition_risk_engine`, `climate_integrated_risk`, `assessment_methodology_manager`, `assessment_runner`, `nace_cprs_mapper`, `climate_risk_aggregator`
- Add MODULE_DEPENDENCIES edges connecting new engines to existing modules (CBAM, stranded assets, NGFS, ECL, nature risk, counterparty scorer)

---

## 5. Reference Datasets (Embedded)

| Dataset | Location | Size | Source |
|---------|----------|------|--------|
| NACE→CPRS→IAM mapping | `nace_cprs_mapper.py` | ~600 rows | Battiston et al. / EBA pilot |
| Sector vulnerability matrix | `climate_physical_risk_engine.py` | 20 sectors × 13 hazards | Pre-calibrated defaults |
| NGFS Phase 5 scenario params | `climate_transition_risk_engine.py` | 6 scenarios × ~15 variables × 8 time points | NGFS Scenarios Portal |
| Damage function coefficients | `climate_physical_risk_engine.py` | Per hazard type (13 sets) | MSCI/S&P methodology |
| CPRS risk weights | `nace_cprs_mapper.py` | 8 CPRS categories | EBA pilot exercise |
| IEA NZE phase-out pathways | `climate_transition_risk_engine.py` | Per technology × time horizon | IEA Net Zero Roadmap |
| ENCORE dependency scores | Extends `nature_risk_seed_data.py` | 167 sectors × 21 services | ENCORE database |
| TCFD category weights | `climate_transition_risk_engine.py` | 4 categories | Default 0.35/0.25/0.25/0.15 |
| Pre-calibrated methodology templates | `assessment_methodology_manager.py` | 9 templates | Per spec §5.4 |

---

## 6. Test Strategy

| Test File | Coverage | Expected Tests |
|-----------|----------|----------------|
| `test_climate_physical_risk.py` | Stages 1-4, all hazard types, all curve types, config params | ~50 tests |
| `test_climate_transition_risk.py` | Stages 1-6, NACE-CPRS, carbon pricing, stranded assets, alignment, NGFS, composite | ~45 tests |
| `test_assessment_methodology.py` | Lifecycle, templates, validation, versioning, clone, diff | ~30 tests |
| `test_climate_integration.py` | Combined scores, aggregation, runner, drill-down, delta reports | ~25 tests |
| **Total** | | **~150 new tests** |

---

## 7. Regulatory Compliance Coverage

| Framework | Spec Section | Implementation |
|-----------|-------------|----------------|
| EBA GL/2025/01 | Full engine | All stages + EU Bank templates |
| NGFS Phase 5 | Transition Stage 5 | 6 scenarios in ScenarioStressTester |
| TCFD/ISSB S2 | Reporting Part 7 | Four-pillar output in Reports tab |
| CSRD ESRS E1-9/E1-10 | Reporting Part 7 | Physical/Transition CVaR templates |
| ECB Climate Stress Test | Reporting Part 7 | Full NGFS results at portfolio level |
| OSFI B-15 (Canada) | Template §5.4 | Canadian OSFI methodology template |
| NACE-CPRS-IAM | Transition Stage 1 | nace_cprs_mapper.py |
| TNFD/ENCORE | Part 4.2 | Nature risk amplifier integration |
| BIS/Basel | Damage Stage 4 | PD/LGD adjustment params |

---

## 8. What We Intentionally Defer

| Spec Item | Reason | When |
|-----------|--------|------|
| PostGIS spatial queries | Migration 017 enables PostGIS but no spatial query logic yet; physical risk uses lat/lng floats | Future: add spatial buffer queries for exposure_radius_km |
| ML model integration | Spec mentions existing MLOps; we don't have ML training infrastructure | Future: when ML pipeline is built |
| Celery/Redis scheduled runs | No task queue infrastructure currently | Future: when async job infrastructure added |
| Curve Editor UI component | Complex interactive drag-point editor | Future: Phase 2 UI enhancement |
| Heatmap Editor UI component | Editable sector × hazard matrix | Future: Phase 2 UI enhancement |
| Real CMIP6/ERA5 data ingestion | Requires external API integration | Future: when data pipeline built |
| Approval chain workflow | Requires auth/RBAC (not yet implemented) | Future: when auth system built |
| Geographic Risk Map (Leaflet/Mapbox) | Requires map library integration | Future: Phase 2 UI |

---

## 9. Summary Counts

| Metric | Count |
|--------|-------|
| New service files | 7 |
| New route file | 1 |
| New migration file | 1 |
| New frontend page | 1 |
| New test files | 4 |
| Existing services to extend | 6 |
| Existing files to wire (server.py, App.js, data_lineage) | 3 |
| Pre-calibrated methodology templates | 9 |
| Embedded reference datasets | 9 |
| Configurable parameters | 57 |
| Estimated new tests | ~150 |
| **Total new files** | **14** |
| **Total files modified** | **9** |
