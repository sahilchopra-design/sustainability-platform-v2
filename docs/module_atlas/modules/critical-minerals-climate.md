# Critical Minerals Climate Analytics
**Module ID:** `critical-minerals-climate` · **Route:** `/critical-minerals-climate` · **Tier:** A (backend vertical) · **EP code:** EP-DL5 · **Sprint:** DL

## 1 · Overview
Analyses supply security, geopolitical risks, and sustainability of critical minerals essential for clean energy transition (lithium, cobalt, nickel, rare earths, copper). Models supply-demand gaps, price volatility, ESG risk in mining, and circular economy solutions.

> **Business value:** Critical for clean energy investors, battery supply chain companies, automotive OEMs, and sovereign resource security analysts. Provides IEA-aligned demand forecasting, EU CRM Act compliance analysis, and supply chain ESG due diligence for responsible sourcing strategies.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `ALL_COUNTRIES`, `COUNTRIES_BY_REGION`, `KpiCard`, `MINERALS`, `PROJECTS`, `REGIONS`, `SUPPLY_RISK_TIERS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `mineral` | `MINERALS[Math.floor(sr(i * 7) * MINERALS.length)];` |
| `region` | `REGIONS[Math.floor(sr(i * 11) * REGIONS.length)];` |
| `country` | `countryPool[Math.floor(sr(i * 13) * countryPool.length)];` |
| `supplyConcentration` | `Math.round(500 + sr(i * 17) * 4500);` |
| `totalReserves` | `(filtered.reduce((s, p) => s + p.reservesMt, 0)).toFixed(0);` |
| `avgCarbonIntensity` | `(filtered.reduce((s, p) => s + p.carbonIntensity, 0) / n).toFixed(1);` |
| `avgSupplyConcentration` | `Math.round(filtered.reduce((s, p) => s + p.supplyConcentration, 0) / n);` |
| `avgTransitionScore` | `(filtered.reduce((s, p) => s + p.transitionCriticalScore, 0) / n).toFixed(1);` |
| `evDemandMultiplier` | `(1 + (evAdoption / 100) * 2).toFixed(2);` |
| `carbonCostM` | `((filtered.reduce((s, p) => s + p.productionKt * p.carbonIntensity, 0) * carbonPrice) / 1e6).toFixed(0);` |
| `mineralProdData` | `MINERALS.map(m => {` |
| `mineralHHIData` | `MINERALS.map(m => {` |
| `mineralEVData` | `MINERALS.map(m => {` |
| `scatterData` | `filtered.map(p => ({ x: p.carbonIntensity, y: p.recyclingRate, name: p.name, mineral: p.mineral }));` |
| `pct` | `n > 0 ? (cnt / n) * 100 : 0;` |
| `avgWI` | `ps.length ? Math.round(ps.reduce((s, p) => s + p.waterIntensity, 0) / ps.length) : 0;` |
| `maxWI` | `Math.max(...MINERALS.map(mm => {` |
| `pct` | `maxWI > 0 ? (avgWI / maxWI) * 100 : 0;` |

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
**Frontend seed datasets:** `MINERALS`, `REGIONS`, `SUPPLY_RISK_TIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Lithium Demand Increase | — | IEA Critical Minerals 2023 | Lithium demand for batteries grows 42× by 2040 under IEA Net Zero scenario — concentrated in 3 countries |
| Cobalt Supply Concentration | — | USGS Minerals Commodity Summary 2024 | 73% of global cobalt from Democratic Republic of Congo — high ESG and geopolitical risk |
| EU CRM Act Benchmarks | — | EU Critical Raw Materials Act 2023 | EU targets: extract 10%, process 40%, recycle 15% of annual critical mineral consumption domestically by 2030 |
- **USGS/BGS production and reserve data by mineral** → Supply gap modelling → **Supply-demand balance under IEA transition scenarios**
- **Mine-level ESG assessment data (RMI, Sustainalytics)** → Supply chain ESG risk → **Weighted ESG risk score by mineral and supply chain**
- **Recycling rates and battery chemistry evolution** → Circular economy modelling → **Recycled content contribution to supply by decade**

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
**Methodology:** Critical Mineral Supply Risk
**Headline formula:** `SupplyRisk_i = (DemandGrowth_i - SupplyCapacity_i) / SupplyCapacity_i × ConcentrationHHI_i; ESGRisk_mining = Σ [w_j × ESGScore_j × ProductionShare_j]`
**Standards:** ['IEA Critical Minerals for Clean Energy Transitions 2023', 'EU Critical Raw Materials Act 2023', 'OECD Due Diligence Guidance for Responsible Mineral Supply Chains', 'Responsible Minerals Initiative (RMI)']

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
| `critical-minerals` | engine:critical_minerals_engine, table:EU |
| `ai-governance` | table:EU |
| `climate-policy` | table:EU |
| `api-gateway-monitor` | table:EU |
| `climate-policy-intelligence` | table:EU |