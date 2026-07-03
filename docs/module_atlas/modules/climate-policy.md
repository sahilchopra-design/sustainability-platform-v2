# Climate Policy Analyser
**Module ID:** `climate-policy` · **Route:** `/climate-policy` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Global climate policy tracking and impact assessment. Covers NDCs, national net-zero laws, carbon pricing mechanisms, sector regulations, and policy ambition gap analysis.

> **Business value:** Climate policy determines the macro environment for investment returns across all asset classes. Carbon prices, renewable mandates, fossil fuel phase-outs, and building regulations create winners and losers. This module tracks the policy landscape and translates regulatory changes into portfolio implications.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `CARBON_PRICING`, `CLIMATE_POLICIES`, `Card`, `ClimatePolicyPage`, `KpiCard`, `LS_PORTFOLIO`, `PIE_COLORS`, `Section`, `SortTh`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `body` | `rows.map(r => cols.map(c => { const v = typeof c.key === 'function' ? c.key(r) : r[c.key]; return typeof v === 'string' && v.includes(',') ? `"${v}"` ` |
| `blob` | `new Blob([hdr + '\n' + body], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `pctOf` | `(arr, fn) => arr.length ? ((arr.filter(fn).length / arr.length) * 100).toFixed(0) : '0';` |
| `carbonPricingCoverage` | `CARBON_PRICING.reduce((s, c) => s + c.coverage_pct_global, 0);` |
| `gapA` | `parseInt(a.renewable_target_2030) - a.renewable_current_pct;` |
| `gapB` | `parseInt(b.renewable_target_2030) - b.renewable_current_pct;` |
| `cbamIso` | `new Set(cbamCountries.map(c => c.iso2));` |
| `gap` | `c.ndc_reduction_pct - c.ndc_progress_pct;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-policy/assess-jurisdiction` | `assess_jurisdiction` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/score-ndc` | `score_ndc` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/carbon-price-gap` | `carbon_price_gap` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/policy-pipeline` | `policy_pipeline` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/portfolio-impact` | `portfolio_impact` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/jurisdictions` | `get_jurisdictions` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/fit-for-55` | `get_fit_for_55` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/ira-credits` | `get_ira_credits` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/repowereu` | `get_repowereu` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/carbon-price-corridor` | `get_carbon_price_corridor` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/ngfs-policy-scenarios` | `get_ngfs_policy_scenarios` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/g20-carbon-pricing` | `get_g20_carbon_pricing` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/sector-policy-map` | `get_sector_policy_map` | api/v1/routes/climate_policy_tracker.py |

### 2.3 Engine `climate_policy_tracker_engine` (services/climate_policy_tracker_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimatePolicyTrackerEngine._get_jurisdiction` | iso |  |
| `ClimatePolicyTrackerEngine._is_advanced_economy` | iso |  |
| `ClimatePolicyTrackerEngine._get_nze_price` | iso, year |  |
| `ClimatePolicyTrackerEngine.assess_jurisdiction_policy` | jurisdiction | Full jurisdiction policy assessment: |
| `ClimatePolicyTrackerEngine.score_ndc_ambition` | jurisdiction, target_pct, base_year, conditional | Score NDC ambition 0-100 and assess Paris 1.5°C consistency. |
| `ClimatePolicyTrackerEngine._compute_ambition_score` | target_pct, base_year, ndc_status, net_zero_year | Internal ambition score computation (0-100). |
| `ClimatePolicyTrackerEngine.track_policy_pipeline` | jurisdiction, entity_sector | Track applicable regulations and compliance deadlines for a given |
| `ClimatePolicyTrackerEngine._sector_to_fit55_keywords` | sector |  |
| `ClimatePolicyTrackerEngine._get_applicable_policies` | iso |  |
| `ClimatePolicyTrackerEngine._get_upcoming_deadlines` | iso |  |
| `ClimatePolicyTrackerEngine.calculate_carbon_price_gap` | jurisdiction, current_price | Calculate gap between jurisdiction's carbon price and IEA NZE corridor. |
| `ClimatePolicyTrackerEngine.assess_policy_portfolio_impact` | portfolio_countries, portfolio_sectors, weights | Assess portfolio-level transition risk from climate policy exposure. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `EU` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CARBON_PRICING`, `CLIMATE_POLICIES`, `PIE_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NDC Coverage | — | UNFCCC | National climate pledges registered under Paris Agreement |
| Ambition Gap | — | CAT synthesis | Current NDCs lead to 2.5-2.9°C warming |
| Implementation Gap | — | CAT/UNEP | Fraction of NDC target not covered by implemented policies |
- **UNFCCC NDC data** → Ambition assessment → **Country policy rating**
- **Implemented policy database** → Gap analysis → **Implementation gap**
- **Policy pipeline** → Impact modelling → **Future trajectory update**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-policy/ref/carbon-price-corridor** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'currency', 'tracks', 'notes'], 'n_keys': 4}`

**GET /api/v1/climate-policy/ref/fit-for-55** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['package', 'overarching_target', 'regulation_count', 'regulations', 'total_reduction_potential_mtco2', 'notes'], 'n_keys': 6}`

**GET /api/v1/climate-policy/ref/g20-carbon-pricing** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'g20_coverage_count', 'global_coverage_note', 'jurisdictions', 'notes'], 'n_keys': 5}`

**GET /api/v1/climate-policy/ref/ira-credits** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['legislation', 'signed', 'estimated_climate_investment_10yr_usd_bn', 'credit_count', 'sector_breakdown', 'credits', 'notes'], 'n_keys': 7}`

**GET /api/v1/climate-policy/ref/jurisdictions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_jurisdictions', 'advanced_economies', 'jurisdictions'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic
**Methodology:** NDC ambition and implementation gap
**Headline formula:** `PolicyGap = Required_reductions - Policy_reductions; AmbitionGap = NDC_target - Science_pathway`
**Standards:** ['UNFCCC NDC Registry', 'Climate Action Tracker', 'Climate Governance Initiative']

**Engine `climate_policy_tracker_engine` — extracted transformation lines:**
```python
frac = (year - y0) / (y1 - y0)
base_year_adjustment = max(0, (b_year - 2010) * 0.5)
adjusted_paris_benchmark = PARIS_15C_BENCHMARK_PCT_FROM_2010 - base_year_adjustment
gap_vs_15c = max(adjusted_paris_benchmark - t_pct, 0)
target_score = min(70.0, (target_pct / 55) * 70)
base_year_penalty = max(0, (base_year - 2010) * 0.3)
gap = max(nze_price - actual_price, 0)
years_to_close = max(2030 - 2024, 1)
annual_increase_required = gap / years_to_close if year == 2030 else None
gap_2030 = max(self._get_nze_price(iso, 2030) - actual_price, 0)
gap_2050 = max(self._get_nze_price(iso, 2050) - actual_price, 0)
gdp_risk_pct = gap_2030 / 50 * 1.0 if is_ae else gap_2030 / 50 * 0.5
weights = [1.0 / n] * n
weights = [w / total for w in weights]
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **5** other module(s).
**Shared engines (edits propagate!):** `climate_policy_tracker_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-policy-intelligence` | engine:climate_policy_tracker_engine, table:EU |
| `ai-governance` | table:EU |
| `critical-minerals` | table:EU |
| `api-gateway-monitor` | table:EU |
| `critical-minerals-climate` | table:EU |