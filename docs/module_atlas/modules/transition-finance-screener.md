# Transition Finance Screener
**Module ID:** `transition-finance-screener` · **Route:** `/transition-finance-screener` · **Tier:** A (backend vertical) · **EP code:** EP-CC3 · **Sprint:** CC

## 1 · Overview
8 green/sustainability/SLB instruments screened against ICMA Principles, EU Taxonomy alignment, greenium analysis, DNSH assessment across 6 environmental objectives, and SLB KPI tracking with step-up mechanism.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `INSTRUMENTS`, `SCREENING_COLORS`, `TABS`, `TYPE_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPE_COLORS` | `{ 'Green Bond': T.green, 'Sustainability-Linked Bond': T.blue, 'Transition Bond': T.amber, 'Blue Bond': T.teal, 'Sustainability Bond': T.sage };` |
| `totalFaceValue` | `INSTRUMENTS.reduce((s, i) => s + i.face_value, 0);` |
| `avgTaxonomy` | `Math.round(INSTRUMENTS.reduce((s, i) => s + i.taxonomy_aligned, 0) / INSTRUMENTS.length);` |
| `avgGreenium` | `(INSTRUMENTS.reduce((s, i) => s + i.greenium, 0) / INSTRUMENTS.length).toFixed(1);` |
| `pieData` | `Object.entries(TYPE_COLORS).map(([type, color]) => ({` |
| `val` | `INSTRUMENTS.filter(i => i.screening === result).reduce((s, i) => s + i.face_value, 0);` |

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
**Frontend seed datasets:** `INSTRUMENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Bond Greenium | `YTM_green - YTM_conventional` | Market data | Green bonds trade at lower yield (premium) vs conventional |
| Taxonomy Aligned % | `Aligned proceeds / Total proceeds` | EU Taxonomy | Fraction of bond proceeds meeting EU Taxonomy criteria |
| DNSH Pass Rate | `Per environmental objective` | EU TEG | Do No Significant Harm assessment across all 6 EU objectives |
| SLB Step-Up | `Triggered if KPI missed` | Bond prospectus | Coupon increase if issuer fails to meet sustainability KPI |

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
**Methodology:** ICMA + EU Taxonomy alignment screening
**Headline formula:** `Greenium = YTM_green - YTM_comparable_conventional (bps)`
**Standards:** ['ICMA GBP/SBP/SLB Principles', 'EU Taxonomy Regulation', 'EU GBS']

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
| `transition-finance-engine` | engine:transition_finance_engine, table:exc |
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |