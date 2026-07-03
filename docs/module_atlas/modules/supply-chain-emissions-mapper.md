# Supply Chain Emissions Mapper
**Module ID:** `supply-chain-emissions-mapper` · **Route:** `/supply-chain-emissions-mapper` · **Tier:** A (backend vertical) · **EP code:** EP-DN1 · **Sprint:** DN

## 1 · Overview
Maps and quantifies Scope 3 supply chain emissions across all 15 GHG Protocol categories. Integrates spend-based, activity-based, and supplier-specific emission factor methods with PCAF data quality scoring and GHG Protocol Corporate Value Chain Standard.

> **Business value:** Directly required for GHG Protocol Scope 3 disclosure, SBTi target setting (67% coverage), and CSRD ESRS E1 value chain emissions reporting. Provides systematic Scope 3 inventory across all 15 categories with PCAF data quality scoring.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `CATEGORIES`, `KpiCard`, `PATHWAYS`, `REGIONS`, `SECTORS`, `SUPPLIERS`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PATHWAYS` | `['Science-Based', 'Net Zero 2040', 'Net Zero 2050', 'Carbon Neutral', 'Business As Usual'];` |
| `totalScope3` | `useMemo(() => SUPPLIERS.reduce((s, x) => s + x.scope3Upstream, 0), []);` |
| `totalScope1` | `useMemo(() => SUPPLIERS.reduce((s, x) => s + x.scope1, 0), []);` |
| `totalSpend` | `useMemo(() => SUPPLIERS.reduce((s, x) => s + x.spendMn, 0), []);` |
| `avgDQ` | `useMemo(() => SUPPLIERS.reduce((s, x) => s + x.dataQuality, 0) / Math.max(1, SUPPLIERS.length), []);` |
| `tierBreakdown` | `useMemo(() => TIERS.map(t => {` |
| `categoryBreakdown` | `useMemo(() => CATEGORIES.map(c => {` |
| `pathwayBreakdown` | `useMemo(() => PATHWAYS.map(p => {` |
| `top10Hotspots` | `useMemo(() => [...SUPPLIERS].sort((a, b) => b.scope3Upstream - a.scope3Upstream).slice(0, 10), []);` |
| `count` | `SUPPLIERS.filter(s => Math.floor(s.dataQuality) === score).length;` |
| `avgDQ` | `sups.length ? sups.reduce((a, s) => a + s.dataQuality, 0) / sups.length : 0;` |
| `avgTarget` | `sups.length ? sups.reduce((a, s) => a + s.reductionTarget, 0) / sups.length : 0;` |

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
**Frontend seed datasets:** `CATEGORIES`, `PATHWAYS`, `REGIONS`, `SECTORS`, `TABS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scope 3 Share of Corporate Emissions | — | CDP Supply Chain Report 2023 | Scope 3 represents 70–90% of corporate GHG footprint — supply chain (cat 1-8) typically largest |
| SBTi Scope 3 Coverage Requirement | — | SBTi Corporate Manual 2023 | SBTi requires Scope 3 targets covering at least 67% of total Scope 3 emissions |
| Supplier Reporting Rate | — | CDP Supply Chain 2023 | Only 23% of suppliers to large corporations report emissions to CDP — data quality gap |
- **Procurement/spend data by supplier and category** → Spend-based S3 emissions → **S3 emissions by category using EXIOBASE emission factors**
- **Supplier primary data submissions (CDP, direct)** → Supplier-specific S3 → **High-quality supplier emissions replacing spend-based estimates**
- **Activity data (tonne-km, MWh, waste kg)** → Activity-based S3 categories → **Categories 4, 9, 12 using physical activity data**

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
**Methodology:** Scope 3 Supply Chain Emissions
**Headline formula:** `S3_cat_i = ActivityData_i × EmissionFactor_i; S3_total = Σ S3_cat_i (i=1..15); WACI_S3 = Σ [Revenue_weight_j × S3intensity_j]`
**Standards:** ['GHG Protocol Corporate Value Chain Standard 2011', 'PCAF Standard Part A — Corporate Loans 2022', 'SBTi Scope 3 Guidance 2023', 'ISO 14064-1:2018 Greenhouse Gas Accounting']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **90** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-network-viz` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-contagion` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-carbon` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-resilience` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-map` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-labor-climate` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `supply-chain-esg-hub` | table:base, table:datetime, table:db, table:emission_factor_library, table:exc, table:sbti_targets |
| `insurance-climate-hub` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `insurance-transition` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:datetime, table:db, table:exc, table:sqlalchemy |