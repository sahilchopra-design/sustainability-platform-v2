# Supply Chain Labour & Climate Risk
**Module ID:** `supply-chain-labor-climate` · **Route:** `/supply-chain-labor-climate` · **Tier:** A (backend vertical) · **EP code:** EP-DI5 · **Sprint:** DI

## 1 · Overview
Analyses the intersection of climate physical risk and labour rights in global supply chains. Identifies heat stress-exposed workers, climate-vulnerable factory locations, forced labour risk in climate-impacted geographies, and CS3D/LkSG corporate due diligence requirements.

> **Business value:** Directly required for CS3D compliance (EU companies, >500 employees), LkSG compliance (Germany, >3,000 employees), and HRDD voluntary frameworks. Provides quantitative compound risk assessment for supply chain engagement and regulatory filing.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `BLUE`, `CHAIN_NAMES`, `COMMODITIES`, `INDIGO`, `PURPLE`, `REGIONS`, `RISK_COLORS`, `SUPPLY_CHAINS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['South Asia', 'Southeast Asia', 'East Asia', 'Sub-Saharan Africa', 'Latin America', 'MENA', 'Eastern Europe'];` |
| `tempMult` | `1 + (tempScenario - 1.5) * 0.1;` |
| `totalWorkers` | `filtered.reduce((s, c) => s + c.workersAffected, 0);` |
| `avgHeatRisk` | `filtered.length ? filtered.reduce((s, c) => s + c.heatStressRisk * tempMult, 0) / filtered.length : 0;` |
| `avgLaborRights` | `filtered.length ? filtered.reduce((s, c) => s + c.laborRightRisk, 0) / filtered.length : 0;` |
| `avgAdaptation` | `filtered.length ? filtered.reduce((s, c) => s + c.climateAdaptationScore, 0) / filtered.length : 0;` |
| `workersByCommodity` | `COMMODITIES.map(c => ({` |
| `scatterData` | `filtered.map(s => ({` |
| `radarByCommodity` | `COMMODITIES.map(c => {` |

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
**Frontend seed datasets:** `CHAIN_NAMES`, `COMMODITIES`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Workers at Heat Stress Risk by 2030 | — | ILO Ensure Safety and Health at Work 2023 | 2.4 billion workers exposed to excessive heat by 2030 under current trajectories — 70% in agriculture |
| Heat Productivity Loss | — | ILO 2023 | Annual GDP loss from heat stress productivity reduction — concentrated in tropical EM manufacturing |
| CS3D Supply Chain Scope | — | EU CS3D Directive 2024/1760 | EU Corporate Sustainability Due Diligence covers ~5,000 EU companies and their tier 1-3 supply chains |
- **Supplier location data (GPS, sector, workforce size)** → Climate-labour risk overlay → **Supplier-level compound risk score by hazard and labour indicator**
- **ILO core convention ratification + enforcement data** → Labour vulnerability scoring → **Country-level labour protection index for supply chain due diligence**
- **Heat stress exposure projections by SSP/region** → Productivity loss calculation → **Annual productivity loss by sector and geography**

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
**Methodology:** Supply Chain Climate-Labour Risk Score
**Headline formula:** `CLRisk = PhysicalHazard × LabourVulnerability × SupplyChainDependency; HeatStressProductivityLoss = 1 - exp(-HeatExposure/ThermalComfort)`
**Standards:** ['ILO Heat and Work Safety Standards 2022', 'EU Corporate Sustainability Due Diligence Directive (CS3D)', 'German Supply Chain Act (LkSG) 2023', 'IPCC AR6 WGII Chapter 13 — Climate Change and Human Health']

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
| `supply-chain-esg-hub` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `insurance-climate-hub` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `insurance-transition` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:datetime, table:db, table:exc, table:sqlalchemy |