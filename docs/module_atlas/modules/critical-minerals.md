# Critical Minerals Analytics
**Module ID:** `critical-minerals` · **Route:** `/critical-minerals` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Projects clean energy critical mineral demand through 2050 under IEA and BNEF transition scenarios, tracks recycling rate evolution and secondary supply contributions, and analyses investment gaps in mining and processing capacity required to meet energy transition demand.

> **Business value:** Enables clean energy investors and corporate strategists to quantify mineral supply risks for specific technologies, size investment gaps, and develop procurement strategies resilient to the structural supply-demand imbalances of the energy transition.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `EU_CRMA_ANNEX_II_CRITICAL`, `EU_CRMA_ANNEX_I_STRATEGIC`, `Inp`, `KpiCard`, `MINERAL_OPTIONS`, `Row`, `Section`, `Sel`, `TABS`, `TECH_OPTIONS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `composite` | `Math.round(subScores.reduce((s, x) => s + x.value, 0) / 4);` |
| `strategic` | `EU_CRMA_ANNEX_I_STRATEGIC.has(mineral); // Annex I: Strategic` |
| `critical` | `EU_CRMA_ANNEX_II_CRITICAL.has(mineral);   // Annex II: Critical` |
| `compliance` | `Math.round(seed(mi * 29) * 35 + 50);` |
| `composite` | `Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length);` |
| `total` | `parseFloat(exposures.reduce((s, e) => s + e.value, 0).toFixed(1));` |
| `hhi` | `total > 0 ? parseFloat((exposures.reduce((s, e) => s + Math.pow(e.value / total, 2), 0) * 10000).toFixed(0)) : 0;` |
| `priceVolatility` | `years.map((yr, i) => ({` |
| `supplyDisruptionProb` | `Math.round(seed(mi * 107) * 35 + 15);` |
| `top3CountryShare` | `Math.round(seed(mi * 109) * 30 + 55);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/critical-minerals/assess` | `assess_critical_minerals_endpoint` | api/v1/routes/critical_minerals.py |
| POST | `/api/v1/critical-minerals/supply-chain-map` | `supply_chain_map_endpoint` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/iea-minerals` | `get_iea_minerals` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/eu-crm-act` | `get_eu_crm_act` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/irma-criteria` | `get_irma_criteria` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/oecd-5step` | `get_oecd_5step` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/country-concentration` | `get_country_concentration` | api/v1/routes/critical_minerals.py |
| GET | `/api/v1/critical-minerals/ref/mineral-profile/{mineral_name}` | `get_single_mineral_profile` | api/v1/routes/critical_minerals.py |

### 2.3 Engine `critical_minerals_engine` (services/critical_minerals_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_seed_float` | entity_id, key, lo, hi | Deterministic seeded float — reproducible demo data. |
| `_weighted_irma_score` | data, eid |  |
| `_irma_tier` | score |  |
| `_oecd_5step_scores` | data, eid |  |
| `_oecd_composite` | step_scores |  |
| `_iea_mineral_composite` | minerals | Aggregate IEA scores across a portfolio of minerals (simple average). |
| `_crm_tier` | score |  |
| `assess_critical_minerals` | request_data | Full critical minerals risk assessment per: |
| `map_supply_chain` | request_data | Map mineral supply chain tiers for a specific mineral and technology application. |
| `get_mineral_profile` | mineral_name | Return IEA CRM 2024 profile and EU CRM Act status for a single mineral. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `EU` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `MINERAL_OPTIONS`, `TABS`, `TECH_OPTIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Lithium Demand Growth (NZE 2040) | — | IEA Critical Minerals 2024 | Cumulative demand increase for lithium carbonate equivalent under Net Zero Emissions scenario |
| Cobalt Demand Peak | — | IEA / BNEF | Peak cobalt demand before recycling and chemistry innovation (NMC to LFP shift) reduces intensity |
| Battery Recycling Rate (2040) | — | IEA Critical Minerals | Projected secondary supply contribution from EV and storage battery recycling by 2040 |
| Mining Investment Gap (2024–2035) | — | IEA / World Bank | Gap between committed mining capex and investment needed to meet NZE scenario demand |
| Nickel Supply Concentration | — | USGS 2024 | Indonesia’s dominance of Class-1 nickel supply for battery-grade production |
- **IEA technology deployment scenarios** → Apply mineral intensity coefficients per technology type → **Technology-specific mineral demand by year**
- **Mine production and project pipeline data** → Aggregate committed production, compute supply ramp-up curve → **Mineral supply projection by scenario**
- **IEA recycling rate projections** → Model secondary supply from end-of-life volumes × recovery rate → **Recycling contribution to supply balance**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/critical-minerals/ref/country-concentration** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'mineral_count', 'concentration_analysis', 'eu_65pct_limit_breaches', 'breach_count', 'hhi_classification_thresholds', 'conflict_high_risk_countries'], 'n_keys': 8}`

**GET /api/v1/critical-minerals/ref/eu-crm-act** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'effective_date', 'strategic_mineral_count', 'critical_mineral_count', 'strategic_minerals', 'critical_minerals', 'eu_benchmark_targets', 'mineral_detail', 'compliance_obli`

**GET /api/v1/critical-minerals/ref/iea-minerals** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'reference_year', 'mineral_count', 'minerals', 'transition_mineral_intensity', 'criticality_composite_methodology'], 'n_keys': 7}`

**GET /api/v1/critical-minerals/ref/irma-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'source', 'standard_version', 'chapter_count', 'certification_tiers', 'chapters', 'applicability', 'third_party_verification', 'conflict_mineral_overlap'], 'n_keys': 9}`

**GET /api/v1/critical-minerals/ref/mineral-profile/{mineral_name}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Critical Mineral Demand Projection Model
**Headline formula:** `Demand(t) = Σ_tech (Deployment(t) × MineralIntensity(tech) × (1 - RecyclingRate(t)))`
**Standards:** ['IEA Critical Minerals Outlook 2024', 'BNEF Electric Vehicle Outlook', 'BloombergNEF Energy Storage Monitor']

**Engine `critical_minerals_engine` — extracted transformation lines:**
```python
total_m  = round(ev_m + solar_m + wind_m + grid_m, 2)
disruption_prob = round(min((avg_hhi / 100.0) * (iea_geo / 100.0) * 15.0, 35.0), 1)
oecd_gap_score = round((1.0 - oecd_composite) * 100.0, 1)
concentration_score = round(min(avg_hhi / 100.0, 100.0), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **5** other module(s).
**Shared engines (edits propagate!):** `critical_minerals_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `critical-minerals-climate` | engine:critical_minerals_engine, table:EU |
| `ai-governance` | table:EU |
| `climate-policy` | table:EU |
| `api-gateway-monitor` | table:EU |
| `climate-policy-intelligence` | table:EU |