# Supply Chain Map
**Module ID:** `supply-chain-map` · **Route:** `/supply-chain-map` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Geographic supply chain visualisation with ESG risk overlay; maps supplier locations, trade flows and physical/regulatory risk exposure across countries and regions.

> **Business value:** Physical supply chain disruption costs companies an average of ≄45 days of revenue per incident; geospatial risk mapping enables proactive supplier diversification and business continuity planning.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_TRACE`, `CERT_STANDARDS`, `COLORS`, `DD_REGS`, `DEFOREST_COMMODITIES`, `HR_HOTSPOTS`, `KpiCard`, `REGIONS`, `REGION_F`, `REMEDIATION_DATA`, `RISK_F`, `RISK_LEVELS`, `SECTORS`, `SECTOR_F`, `SECTOR_RISK_PROFILE`, `SUPPLIERS`, `TABS`, `TIER_ANALYSIS`, `TREND_DATA`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `region` | `REGIONS[Math.floor(sr(i * 7) * REGIONS.length)];` |
| `esgScore` | `Math.round(sr(i * 11) * 60 + 20);` |
| `riskLevel` | `RISK_LEVELS[Math.min(4, Math.floor((100 - esgScore) / 20))];` |
| `carbonIntensity` | `Math.round(sr(i * 13) * 500 + 50);` |
| `laborScore` | `Math.round(sr(i * 17) * 60 + 20);` |
| `envScore` | `Math.round(sr(i * 19) * 60 + 25);` |
| `humanRightsFlags` | `Math.floor(sr(i * 29) * 5);` |
| `tier` | `Math.ceil(sr(i * 37) * 3);` |
| `SECTOR_RISK_PROFILE` | `SECTORS.map((s, i) => ({` |
| `TIER_ANALYSIS` | `[1, 2, 3].map(tier => {` |
| `CARBON_TRACE` | `SECTORS.map((sec, i) => {` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/supply-chain/scope3/calculate` | `calculate_scope3` | api/v1/routes/supply_chain.py |
| POST | `/api/v1/supply-chain/scope3/sbti-target` | `calculate_sbti_target` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/emission-factors` | `list_emission_factors` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments` | `list_scope3_assessments` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments/{assessment_id}` | `get_scope3_assessment` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets` | `list_sbti_targets` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets/{target_id}` | `get_sbti_target` | api/v1/routes/supply_chain.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `base` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `emission_factor_library` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sbti_targets` *(shared)*, `sbti_trajectories` *(shared)*, `scope3_activities` *(shared)*, `scope3_assessments` *(shared)*, `sqlalchemy` *(shared)*, `this` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CERT_STANDARDS`, `COLORS`, `DD_REGS`, `DEFOREST_COMMODITIES`, `HR_HOTSPOTS`, `REGIONS`, `REGION_F`, `REMEDIATION_DATA`, `RISK_F`, `RISK_LEVELS`, `SECTORS`, `SECTOR_F`, `TABS`, `TIER_ANALYSIS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Mapped Supplier Sites | — | Supplier Registry | Total geocoded supplier facility locations with ESG risk overlays. |
| High Physical Hazard Sites | — | WRI Aqueduct | Supplier sites in extreme water stress, flood or heat hazard zones requiring prioritised engagement. |
| Country Risk Hotspots | — | ND-GAIN Index | Countries hosting suppliers with combined high physical risk and low adaptive capacity. |
- **Supplier Geocodes, WRI Hazard Layers, Country Risk Indices, Trade Flow Data** → Spatial join + GERI computation + map rendering engine → **Interactive supply chain map, risk concentration reports, engagement priority lists**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/supply-chain/emission-factors** — status `passed`, provenance ['real-db'], source tables: `emission_factor_library`
Output: `{'type': 'object', 'keys': ['total_count', 'filters_applied', 'factors', 'validation_summary'], 'n_keys': 4}`

**GET /api/v1/supply-chain/scope3/assessments** — status `passed`, provenance ['real-db'], source tables: `scope3_assessments`
Output: `{'type': 'object', 'keys': ['assessments', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `scope3_assessments`
Output: `None`

**GET /api/v1/supply-chain/scope3/sbti-targets** — status `passed`, provenance ['real-db'], source tables: `sbti_targets`
Output: `{'type': 'object', 'keys': ['targets', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/sbti-targets/{target_id}** — status `failed`, provenance ['db-empty'], source tables: `sbti_targets`
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Geospatial ESG Risk Index
**Headline formula:** `GERI = ESG Score × (1 + Country Risk Premium) × Physical Hazard Weight`
**Standards:** ['WRI Aqueduct', 'ND-GAIN Country Index']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **90** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-network-viz` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-contagion` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-carbon` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-emissions-mapper` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-resilience` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-labor-climate` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-esg-hub` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `insurance-climate-hub` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `insurance-transition` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:datetime, table:db, table:exc, table:sqlalchemy |