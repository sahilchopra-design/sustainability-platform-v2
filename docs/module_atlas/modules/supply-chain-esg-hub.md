# Supply Chain ESG Hub
**Module ID:** `supply-chain-esg-hub` · **Route:** `/supply-chain-esg-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive supply chain ESG analytics dashboard aggregating supplier ESG scores, due diligence findings, risk flags and regulatory compliance status across multi-tier supply chains.

> **Business value:** Multi-tier supply chain ESG risk is the fastest-growing compliance burden; CSDDD will require large EU companies to conduct full value chain due diligence from 2027.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_TYPES`, `AUDIENCES`, `BOARD_SECTIONS`, `CATEGORIES`, `CERT_TYPES`, `COMMODITIES`, `COMMODITY_TRACE`, `COUNTRIES`, `DISRUPTION_SCENARIOS`, `ENGAGEMENTS`, `ENGAGEMENT_DIMS`, `ENGAGEMENT_STAGES`, `ENG_TREND`, `INIT_ALERTS`, `MINERALS`, `MINERAL_CHAIN`, `PERIODS`, `PIE_COLORS`, `RADAR_DATA`, `REGIONS`, `REGULATIONS`, `REPORT_CONTENT`, `SCOPE3_BREAKDOWN`, `SCOPE3_CATS`, `SEVERITY`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `country` | `COUNTRIES[Math.floor(sr(i*7)*COUNTRIES.length)];` |
| `tier` | `TIERS[Math.floor(sr(i*11)*TIERS.length)];` |
| `cat` | `CATEGORIES[Math.floor(sr(i*13)*CATEGORIES.length)];` |
| `esgScore` | `Math.floor(sr(i*17)*40+40);` |
| `scope3` | `+(sr(i*19)*500+10).toFixed(1);` |
| `dqs` | `Math.floor(sr(i*23)*60+30);` |
| `deforestRisk` | `+(sr(i*29)*100).toFixed(1);` |
| `mineralExp` | `+(sr(i*31)*100).toFixed(1);` |
| `resilience` | `Math.floor(sr(i*37)*50+40);` |
| `certs` | `CERT_TYPES.filter((_,ci)=>sr(i*41+ci*7)>0.6);` |
| `corrective` | `Math.floor(sr(i*47)*5);` |
| `spend` | `+(sr(i*53)*5+0.1).toFixed(2);` |
| `commodities` | `COMMODITIES.filter((_,ci)=>sr(i*59+ci*11)>0.75);` |
| `minerals` | `MINERALS.filter((_,mi)=>sr(i*61+mi*13)>0.7);` |
| `scope3Cat` | `SCOPE3_CATS[Math.floor(sr(i*67)*SCOPE3_CATS.length)];` |
| `emissionIntensity` | `+(sr(i*71)*300+50).toFixed(1);` |
| `reductionTarget` | `engaged?Math.floor(sr(i*73)*30+10):0;` |
| `reductionAchieved` | `engaged?Math.floor(reductionTarget*sr(i*79)):0;` |

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
**Frontend seed datasets:** `ALERT_TYPES`, `AUDIENCES`, `BOARD_SECTIONS`, `CATEGORIES`, `CERT_TYPES`, `COMMODITIES`, `COUNTRIES`, `DISRUPTION_SCENARIOS`, `ENGAGEMENT_DIMS`, `ENGAGEMENT_STAGES`, `MINERALS`, `PERIODS`, `PIE_COLORS`, `RADAR_DATA`, `REGIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Suppliers Assessed | — | ESG Database | Total number of suppliers with ESG scores in the hub across all tiers. |
| High-Risk Flags | — | Due Diligence Engine | Suppliers flagged as high-risk based on ESG scores below threshold or specific violation alerts. |
| Tier 1 Coverage | — | Spend Analysis | Proportion of Tier 1 supplier spend with ESG assessments; regulatory baseline requirement. |
- **Supplier Assessments, Spend Data, Third-Party ESG Feeds, Controversy Alerts** → Multi-tier scoring + risk flag engine + regulatory compliance mapping → **ESG hub dashboard, high-risk supplier register, CSRD/LkSG disclosures**

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
**Methodology:** Supply Chain ESG Score
**Headline formula:** `SCES = Σ (Supplier ESG × Spend Weight × Tier Discount)`
**Standards:** ['GRI 308/414', 'LkSG §4 Due Diligence']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **90** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-network-viz` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-contagion` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-carbon` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-emissions-mapper` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-resilience` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-map` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-labor-climate` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `insurance-climate-hub` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `insurance-transition` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:datetime, table:db, table:exc, table:sqlalchemy |