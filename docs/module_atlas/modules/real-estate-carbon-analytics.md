# Real Estate Carbon Analytics
**Module ID:** `real-estate-carbon-analytics` · **Route:** `/real-estate-carbon-analytics` · **Tier:** A (backend vertical) · **EP code:** EP-DE6 · **Sprint:** DE

## 1 · Overview
Calculates operational and embodied carbon footprints for real estate portfolios using PCAF Real Estate standard. Models Scope 1/2/3 emissions, science-based decarbonisation pathways, and carbon cost exposure under EU ETS and carbon pricing scenarios.

> **Business value:** Required for banks with real estate lending books (PCAF disclosure), REITs under GRESB reporting, and property asset managers under SFDR Article 8/9. Enables CRREM pathway alignment, GRESB carbon intensity benchmarking, and EU Taxonomy green asset ratio calculation for mortgage portfolios.

## 2 · Function Map

### 2.1 Frontend (3 files)
**Components/functions:** `CARBON_PRICES`, `CRREM`, `Card`, `EMBODY_BENCH`, `EPC_GRADES`, `EPC_OCI`, `FRAMEWORKS`, `KpiCard`, `PROPERTIES_SEED`, `REGIONS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });` |
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `region` | `REGIONS[Math.floor(sr(i * 11) * REGIONS.length)];` |
| `epc` | `EPC_GRADES[Math.floor(sr(i * 13) * EPC_GRADES.length)];` |
| `gia` | `Math.round(500 + sr(i * 17) * 19500); // m² GIA` |
| `age` | `Math.round(1950 + sr(i * 23) * 73);   // construction year` |
| `ownershipPct` | `Math.round(5 + sr(i * 29) * 95); // %` |
| `a1a3` | `Math.round(bench.a1a3 * (0.85 + sr(i * 31) * 0.30)); // kgCO₂e/m²` |
| `a4a5` | `Math.round(bench.a4a5 * (0.80 + sr(i * 37) * 0.40));` |
| `bLifeMaint` | `Math.round(120 + sr(i * 41) * 180); // B2-B5 maintenance over 60yr life` |
| `cDemolit` | `Math.round(15 + sr(i * 43) * 40);   // C1-C4 end-of-life` |
| `d_reuse` | `-Math.round(10 + sr(i * 47) * 50);  // D credits` |
| `embodiedTotal` | `a1a3 + a4a5 + bLifeMaint + cDemolit + d_reuse;` |
| `oci` | `Math.round(ociBase * (0.88 + sr(i * 53) * 0.24));` |
| `opCarbonTotal` | `oci * gia * 60 / 1000; // t` |
| `embCarbonTotal` | `embodiedTotal * gia / 1000; // t` |
| `wholeLifeCarbon` | `opCarbonTotal + embCarbonTotal;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/real-estate-carbon-analytics/properties` | `list_properties` | api/v1/routes/real_estate_carbon_analytics.py |
| GET | `/api/v1/real-estate-carbon-analytics/properties/{row_id}` | `get_one` | api/v1/routes/real_estate_carbon_analytics.py |
| POST | `/api/v1/real-estate-carbon-analytics/properties` | `create_row` | api/v1/routes/real_estate_carbon_analytics.py |
| PUT | `/api/v1/real-estate-carbon-analytics/properties/{row_id}` | `update_row` | api/v1/routes/real_estate_carbon_analytics.py |
| DELETE | `/api/v1/real-estate-carbon-analytics/properties/{row_id}` | `delete_row` | api/v1/routes/real_estate_carbon_analytics.py |
| GET | `/api/v1/real-estate-carbon-analytics/summary` | `summary` | api/v1/routes/real_estate_carbon_analytics.py |

### 2.3 Engine `real_estate_carbon_analytics_engine` (services/real_estate_carbon_analytics_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RealEstateCarbonAnalyticsEngine.summarise` | rows |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CARBON_PRICES`, `EPC_GRADES`, `FRAMEWORKS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Real Estate Global Emissions Share | — | IEA Buildings 2023 | Buildings sector accounts for 38% of global energy-related CO2 emissions including construction |
| Embodied Carbon Share | — | UNEP Global Status Report 2022 | Construction and building materials account for 11% of global CO2 — growing as operational emissions fall |
| PCAF DQ Score Target | — | PCAF Standard Part C 2022 | Data quality score 1–5; target ≤2.5 for high-quality financed emissions disclosure |
- **Property EPC certificates + energy consumption data** → PCAF Part C operational carbon → **Attributed Scope 1+2 emissions per property**
- **Construction records + material quantities** → Embodied carbon LCA → **kgCO2e/m² embodied carbon by construction type**
- **CRREM pathway data + carbon price curves** → Stranding and carbon cost analysis → **Year of pathway breach and cumulative carbon cost to 2050**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/real-estate-carbon-analytics/properties** — status `passed`, provenance ['real-db'], source tables: `ep_recarb1_properties`
Output: `{'type': 'array', 'len': 80, 'item0_keys': ['id', 'ref', 'name', 'category', 'value', 'sector', 'region', 'epc', 'epcIdx', 'gia', 'age', 'ownershipPct', 'a1a3', 'a4a5', 'bLifeMaint']}`

**GET /api/v1/real-estate-carbon-analytics/properties/{row_id}** — status `passed`, provenance ['real-db'], source tables: `ep_recarb1_properties`
Output: `{'type': 'object', 'keys': ['id', 'ref', 'name', 'category', 'value', 'sector', 'region', 'epc', 'epcIdx', 'gia', 'age', 'ownershipPct', 'a1a3', 'a4a5', 'bLifeMaint', 'cDemolit', 'd_reuse', 'embodiedTotal', 'oci', 'opCar`

**GET /api/v1/real-estate-carbon-analytics/summary** — status `passed`, provenance ['real-db'], source tables: `ep_recarb1_properties`
Output: `{'type': 'object', 'keys': ['count', 'total_value', 'avg_value'], 'n_keys': 3}`

**POST /api/v1/real-estate-carbon-analytics/properties** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PUT /api/v1/real-estate-carbon-analytics/properties/{row_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF Real Estate Financed Emissions
**Headline formula:** `FE = Σ [Attribution_i × (OpCarbon_i + EmbodiedCarbon_i)]; Attribution_i = OutstandingLoan_i / PropertyValue_i`
**Standards:** ['PCAF Standard Part C — Real Estate 2022', 'CRREM Decarbonisation Pathways', 'GRESB Carbon Intensity Benchmarks', 'SBTi Buildings Sector Guidance']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **54** other module(s).

| Connected module | Shared via |
|---|---|
| `reference-data-explorer` | table:api, table:db, table:sqlalchemy |
| `benchmark-analytics` | table:api, table:db, table:sqlalchemy |
| `portfolio-transition-alignment` | table:api, table:db |
| `portfolio-optimizer` | table:api, table:db |
| `portfolio-temperature-score` | table:api, table:db |
| `portfolio-dashboard` | table:api, table:db |
| `portfolio-climate-var` | table:api, table:db |
| `portfolio-stress-test-drilldown` | table:api, table:db |
| `portfolio-suite` | table:api, table:db |
| `portfolio-manager` | table:api, table:db |
**Shared UI wrappers:** `BuiltEnvironmentAdvancedAnalytics`