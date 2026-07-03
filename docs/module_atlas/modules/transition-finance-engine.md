# Transition Finance Credibility Engine
**Module ID:** `transition-finance-engine` · **Route:** `/transition-finance-engine` · **Tier:** A (backend vertical) · **EP code:** EP-DI2 · **Sprint:** DI

## 1 · Overview
Transition finance credibility engine for high-emitting sectors including steel, cement, shipping, aviation, and oil & gas. Assesses transition taxonomy eligibility, Paris-aligned capex share, and transition assessment readiness score against the ICMA Climate Transition Finance Handbook.

> **Business value:** Provides an objective, ICMA-aligned credibility score for transition finance instruments across hard-to-abate sectors, quantifying CapEx alignment gaps and target robustness.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOND_TYPES`, `CREDIBILITY_CRITERIA`, `KpiCard`, `Slider`, `TABS`, `TAXONOMY_ALIGNMENT`, `TRANSITION_SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `allIn` | `baseRate / 100 + (baseRate / 100 - greeniumBps / 10000);` |
| `annInt` | `principalM * allIn;` |
| `carbonSaving` | `(ghgIntensityNow - ghgIntensityTarget) * revenue / 1000 * carbonPriceFwd;` |
| `pvSaving` | `carbonSaving * (1 - Math.pow(1 + w, -maturityYr)) / w;` |
| `effectiveCost` | `annInt - carbonSaving;` |
| `pathwayData` | `useMemo(() => Array.from({ length: maturity + 1 }, (_, y) => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/transition-finance/assess` | `assess_credibility` | api/v1/routes/transition_finance.py |
| POST | `/api/v1/transition-finance/portfolio-temperature` | `portfolio_temperature` | api/v1/routes/transition_finance.py |
| POST | `/api/v1/transition-finance/instrument-screen` | `instrument_screen` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/tpt-elements` | `ref_tpt_elements` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/sbti-criteria` | `ref_sbti_criteria` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/race-to-zero` | `ref_race_to_zero` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/sector-pathways` | `ref_sector_pathways` | api/v1/routes/transition_finance.py |
| GET | `/api/v1/transition-finance/ref/gfanz-expectations` | `ref_gfanz_expectations` | api/v1/routes/transition_finance.py |

### 2.3 Engine `transition_finance_engine` (services/transition_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_score_tpt_element` | element_id, element_inputs | Score a single TPT element 0-1 from user-provided sub-element scores or qualitative tier. |
| `_get_quality_tier` | score |  |
| `_calculate_waci` | holdings | WACI = Σ(weight_i × tCO2e_i / revenue_i_M) |
| `_implied_temperature` | waci | Estimate implied portfolio temperature from WACI using linear interpolation |
| `_detect_red_flags` | tpt_score, sbti_score, rtz_score, tpt_inputs, sbti_inputs | Identify greenwash / credibility red flags. |
| `assess_transition_finance_credibility` | entity_name, sector, tpt_inputs, sbti_inputs, rtz_inputs, portfolio_inputs | Full transition finance credibility assessment. |
| `calculate_portfolio_temperature` | holdings, engagement_coverage_pct, paris_aligned_pct | Calculate portfolio temperature alignment using WACI and implied temperature. |
| `screen_transition_instrument` | instrument_type, entity_name, sector, kpis, spts, has_transition_plan | Screen a transition finance instrument against applicable credibility criteria. |
| `get_transition_benchmarks` |  | Return consolidated benchmark and reference data for transition finance analysis. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `BOND_TYPES`, `CREDIBILITY_CRITERIA`, `TABS`, `TAXONOMY_ALIGNMENT`, `TRANSITION_SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Transition Assessment Score | `0.3×Strategy + 0.25×CapexAlignment + 0.25×Targets + 0.2×Governance` | ICMA Transition Finance Handbook criteria | Scores above 70 indicate credible transition; 50-70 requires monitoring; below 50 raises greenwashing risk |
| Paris-Aligned CapEx Share | `Climate-directed capex / total capex (3yr avg)` | Company sustainability report | IEA NZE scenario requires >50% green capex share by 2025 for high-emitters; current gap quantified |
| Scope 1+2 Intensity Trajectory | `Current intensity / base year intensity - 1` | GHG inventory (ISO 14064) | Must align with sector decarbonisation pathway; steel SBTi pathway requires -4.2%/yr |
- **Company sustainability reports / CDP disclosures** → CapEx breakdown, Scope 1+2 data, net-zero target details → scoring inputs → **ICMA four-pillar TA-Score**
- **SBTi target validation database** → Approved targets by sector → Paris-alignment benchmark trajectory → **CapEx gap analysis vs pathway**
- **IEA NZE sector roadmaps** → Technology deployment milestones and investment requirements → credibility benchmarks → **Sector-specific eligibility determination**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/transition-finance/ref/gfanz-expectations** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'version', 'expectations', 'transition_instrument_criteria', 'credibility_framework_weights', 'greenwash_red_flags'], 'n_keys': 6}`

**GET /api/v1/transition-finance/ref/race-to-zero** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'overview', 'five_cs', 'membership_categories', 'key_requirements_summary', 'total_members_2023', 'financial_assets_committed_usd_tn'], 'n_keys': 7}`

**GET /api/v1/transition-finance/ref/sbti-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'standard_version', 'criteria', 'validation_process', 'near_term_requirements', 'long_term_requirements', 'sector_specific_pathways'], 'n_keys': 7}`

**GET /api/v1/transition-finance/ref/sector-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'note', 'pathways', 'high_climate_impact_sectors', 'sector_count', 'key_milestones'], 'n_keys': 6}`

**GET /api/v1/transition-finance/ref/tpt-elements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'elements', 'quality_tiers', 'total_weight', 'element_weights_summary', 'composite_scoring'], 'n_keys': 6}`

## 5 · Intermediate Transformation Logic
**Methodology:** Transition Readiness Scoring
**Headline formula:** `TA-Score = 0.3×Strategy + 0.25×CapexAlignment + 0.25×Targets + 0.2×Governance; Paris CapEx Share = Climate CapEx / Total CapEx`
**Standards:** ['ICMA Climate Transition Finance Handbook 2020', 'EU Platform on Sustainable Finance — Transition Finance Report', 'Science Based Targets initiative Corporate Net-Zero Standard']

**Engine `transition_finance_engine` — extracted transformation lines:**
```python
score = sum(scores) / len(scores) if scores else 0.0
WACI = Σ(weight_i × tCO2e_i / revenue_i_M)
frac = (waci - IMPLIED_TEMP_15C_WACI) / (IMPLIED_TEMP_BASE_WACI - IMPLIED_TEMP_15C_WACI)
frac = (waci - IMPLIED_TEMP_BASE_WACI) / (IMPLIED_TEMP_3C_WACI - IMPLIED_TEMP_BASE_WACI)
score = 1.0  # full marks for N/A criteria (e.g. FLAG for non-land sector)
leap_score = len(leap_stages_completed) / max_leap
sbtn_score = sbtn_steps / 5
tnfd_score = round((leap_score + sbtn_score) / 2.0, 3)
composite = score_sum / n_checks if n_checks > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).
**Shared engines (edits propagate!):** `transition_finance_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `transition-finance` | engine:transition_finance_engine, table:exc |
| `transition-finance-screener` | engine:transition_finance_engine, table:exc |
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |