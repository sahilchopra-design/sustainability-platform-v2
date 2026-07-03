# Sovereign Wealth Fund ESG
**Module ID:** `sovereign-swf` · **Route:** `/sovereign-swf` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
SWF ESG governance, sustainability mandate tracking, and portfolio ESG analytics for sovereign wealth funds including policy alignment, exclusion frameworks and impact mandates.

> **Business value:** Assesses sovereign wealth fund ESG governance, sustainability mandates and portfolio integration against IFSWF and UNPRI best practices.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DIVESTMENT_COMMITMENTS`, `EXCLUSION_POLICIES`, `FUND_TYPES`, `FUND_TYPE_COLORS`, `GAPP_PRINCIPLES`, `KpiCard`, `REGIONS`, `REGION_COLORS`, `SWFS`, `SWF_COUNTRIES`, `SWF_NAMES`, `TABS`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sanScore` | `Math.round(40 + sr(i * 19 + 7) * 60);` |
| `esgScore` | `Math.round(30 + sr(i * 23 + 11) * 70);` |
| `climateScore` | `Math.round(25 + sr(i * 29 + 13) * 75);` |
| `fossilFuel` | `parseFloat((5 + sr(i * 31 + 17) * 45).toFixed(1));` |
| `greenAlloc` | `parseFloat((2 + sr(i * 37 + 19) * 28).toFixed(1));` |
| `portTemp` | `parseFloat((1.6 + sr(i * 41 + 23) * 2.4).toFixed(2));` |
| `transScore` | `Math.round(35 + sr(i * 43 + 29) * 65);` |
| `govScore` | `Math.round(40 + sr(i * 47 + 31) * 60);` |
| `nztRaw` | `sr(i * 53 + 37);` |
| `fund` | `SWFS[Math.floor(sr(i * 83 + 7) * 75)].name;` |
| `totalAUM` | `useMemo(() => filteredSWFs.reduce((s, f) => s + f.aum, 0), [filteredSWFs]);` |
| `avgESG` | `useMemo(() => filteredSWFs.length ? (filteredSWFs.reduce((s, f) => s + f.esgScore, 0) / filteredSWFs.length).toFixed(1) : '0.0', [filteredSWFs]);` |
| `avgTemp` | `useMemo(() => filteredSWFs.length ? (filteredSWFs.reduce((s, f) => s + f.portfolioTemp, 0) / filteredSWFs.length).toFixed(2) : '0.00', [filteredSWFs])` |
| `aumByRegion` | `useMemo(() => REGIONS.map(r => ({` |
| `fundTypeData` | `useMemo(() => FUND_TYPES.map(t => ({` |
| `gappData` | `useMemo(() => GAPP_PRINCIPLES.map((p, i) => ({` |
| `santiagoRanking` | `useMemo(() => [...SWFS].sort((a, b) => b.santiagoScore - a.santiagoScore).slice(0, 20), []);` |
| `exclusionAdoption` | `useMemo(() => EXCLUSION_POLICIES.map((p, pi) => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sovereign-swf/exclusion-screen` | `exclusion_screen_endpoint` | api/v1/routes/sovereign_swf.py |
| POST | `/api/v1/sovereign-swf/intergenerational-equity` | `intergenerational_equity_endpoint` | api/v1/routes/sovereign_swf.py |
| GET | `/api/v1/sovereign-swf/ref/swf-profiles` | `get_swf_profiles` | api/v1/routes/sovereign_swf.py |
| GET | `/api/v1/sovereign-swf/ref/gpfg-exclusion-criteria` | `get_gpfg_exclusion_criteria` | api/v1/routes/sovereign_swf.py |
| GET | `/api/v1/sovereign-swf/ref/divestment-pathways` | `get_divestment_pathways` | api/v1/routes/sovereign_swf.py |

### 2.3 Engine `sovereign_swf_engine` (services/sovereign_swf_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_score_principle` | principle, fund_data | Score a single GAPP principle 0-1 based on fund data. |
| `_tier_from_score` | total_score, max_score |  |
| `assess_swf_esg` | fund_name, aum_usd_bn, exclusion_data, climate_data, governance_data | Full IWG-SWF ESG assessment for a sovereign wealth fund. |
| `apply_gpfg_exclusion_screen` | holdings_list | Apply the Norwegian GPFG exclusion model to a holdings list. |
| `calculate_portfolio_temperature` | holdings, sovereign_bond_allocations | Calculate portfolio implied temperature rise using MSCI PACTA proxy methodology. |
| `model_divestment_pathway` | fund_name, aum_usd_bn, fossil_fuel_exposure_pct, pathway_type | Model a fossil fuel divestment pathway with annual schedule and NPV impact. |
| `assess_intergenerational_equity` | fund_name, aum_usd_bn, annual_withdrawal_pct, resource_revenue_dependency | Assess intergenerational equity compliance using Hartwick Rule + GPFG 4%-rule. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `NDC`, `PACTA`, `__future__` *(shared)*, `coal`, `exc` *(shared)*, `fastapi` *(shared)*, `flag`, `pydantic` *(shared)*, `resource`, `sector` *(shared)*, `services` *(shared)*, `tobacco`, `typing` *(shared)*
**Frontend seed datasets:** `EXCLUSION_POLICIES`, `FUND_TYPES`, `GAPP_PRINCIPLES`, `REGIONS`, `SWF_COUNTRIES`, `SWF_NAMES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| SWFs Assessed | — | IFSWF database | Sovereign wealth funds with active ESG mandate and portfolio analytics. |
| UNPRI Signatories | — | UNPRI | Share of assessed SWFs with UNPRI signatory status. |
| Avg Portfolio ESG Score | — | MSCI/Sustainalytics | Mean portfolio-weighted ESG score across all assessed SWF investment portfolios. |
- **IFSWF fund profiles, SWF annual ESG reports, UNPRI reporting data** → Policy scoring, portfolio ESG aggregation, transparency assessment → **SWF ESG mandate scores, portfolio ESG dashboards, IFSWF benchmark comparisons**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sovereign-swf/ref/divestment-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'pathways', 'npv_methodology_note'], 'n_keys': 4}`

**GET /api/v1/sovereign-swf/ref/gpfg-exclusion-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'exclusion_criteria', 'sample_excluded_companies', 'process'], 'n_keys': 4}`

**GET /api/v1/sovereign-swf/ref/santiago-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'pillars', 'principles', 'scoring_methodology'], 'n_keys': 5}`

**GET /api/v1/sovereign-swf/ref/swf-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'count', 'profiles', 'climate_commitment_tiers'], 'n_keys': 4}`

**POST /api/v1/sovereign-swf/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** SWF ESG Mandate Score
**Headline formula:** `(Policy Strength × 0.35) + (Portfolio ESG × 0.35) + (Transparency × 0.30)`
**Standards:** ['IFSWF Santiago Principles', 'UNPRI SWF Assessment', 'TCFD SWF Guidance']

**Engine `sovereign_swf_engine` — extracted transformation lines:**
```python
pct = total_score / max_score
overall_pct = iwg_score_24 / 24.0
portfolio_temp = weighted_temp / max(total_weight, 1e-9)
sec_t = sum(p[0] * p[1] for p in pairs) / max(sec_w, 1e-9)
fossil_value_usd_bn = aum_usd_bn * fossil_fuel_exposure_pct / 100.0
divest_this_year_bn = fossil_value_usd_bn * pct / 100.0
net_proceeds_bn = divest_this_year_bn * (1.0 - price_discount)
discount_factor = 1.0 / (1.0 + 0.05) ** (i + 1)
remaining_bn = max(0.0, remaining_bn - divest_this_year_bn)
avoided_stranded_asset_loss_bn = fossil_value_usd_bn * 0.20
net_npv_impact_bn = avoided_stranded_asset_loss_bn - npv_loss_bn
green_bond_market_annual_issuance_bn = 600  # global green bond market ~$600bn/yr
absorption_capacity_pct = min(100.0, (cumulative_divested_bn / green_bond_market_annual_issuance_bn) * 100)
optimal_depletion_rate_pct = (rho + theta * g) * 100  # ~6%
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **40** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |
| `crrem` | table:exc |