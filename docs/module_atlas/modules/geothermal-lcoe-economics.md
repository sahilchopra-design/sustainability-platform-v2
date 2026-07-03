# Geothermal LCOE Economics
**Module ID:** `geothermal-lcoe-economics` · **Route:** `/geothermal-lcoe-economics` · **Tier:** A (backend vertical) · **EP code:** EP-DV1 · **Sprint:** DV

## 1 · Overview
Levelised cost analysis for geothermal power covering hydrothermal vs EGS technologies, exploration dry-well risk, drilling cost by depth, reservoir productivity, flash/binary/dry-steam plant types and capacity factor benchmarks.

> **Business value:** Geothermal LCOE of $40–$100/MWh reflects high capacity factors (85–95%) offset by exploration dry-well risk ($5–$20M per well) and depth-driven drilling costs; hydrothermal projects are competitive with wind and solar.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPARABLES`, `HEAT_FLOW_ZONES`, `KpiCard`, `Slider`, `TABS`, `TECH_TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalCapex` | `capexWellUsd * numWells + surfacePlantUsd + exploreCost * 1e6;` |
| `netMw` | `powerMwGross * (1 - parasitic / 100);` |
| `annMwh` | `netMw * cf / 100 * 8760;` |
| `capexAnn` | `totalCapex * w / (1 - Math.pow(1 + w, -lifetime));` |
| `opexAnn` | `opexMwyr * netMw * 1000;` |
| `netMw` | `powerMw * (1 - parasitic / 100);` |
| `annMwh` | `netMw * cf / 100 * 8760;` |
| `totalCapex` | `(capexWell * numWells + plant + explore) * 1e6;` |
| `carbonAdj` | `lcoe - carbonPrice * 38 / 1e6;` |
| `rev` | `annMwh * lcoe * 1.3;` |
| `opexAnn` | `opex * netMw * 1000;` |
| `cum` | `(i + 1) * 5;` |
| `depthCostData` | `useMemo(() => TECH_TYPES.map(t => ({` |
| `techCompare` | `useMemo(() => TECH_TYPES.map(t => ({` |
| `carbonValueData` | `useMemo(() => [20, 40, 60, 80, 100, 120, 150, 200].map(cp => ({` |
| `returnData` | `useMemo(() => [60, 70, 80, 90, 100, 110, 120].map(ppa => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/geothermal/assess` | `assess_geothermal` | api/v1/routes/geothermal.py |
| GET | `/api/v1/geothermal/plant-types` | `list_plant_types` | api/v1/routes/geothermal.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COMPARABLES`, `HEAT_FLOW_ZONES`, `TABS`, `TECH_TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Geothermal LCOE Range | `LCOE = Annualised Total Cost / Annual Generation` | IRENA 2023 | Hydrothermal $40–$70/MWh; EGS $80–$100/MWh reflecting higher drilling and stimulation costs. |
| Exploration Dry-Well Cost | `Dry-Well Cost = Drilling Day Rate × Depth + Mobilisation` | ThinkGeoEnergy 2023 | Key risk factor; dry-well probability 30–50% in frontier areas drives project financing structure. |
| Capacity Factor | `CF = Actual Generation / (Installed Capacity × 8760)` | IRENA Geothermal Capacity Factors | Among the highest of any renewable technology; reservoir management critical to maintaining output. |
- **Drilling cost databases + IRENA benchmark data** → Exploration risk model → LCOE sensitivity analysis → **Geothermal LCOE dashboard by resource type and region**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/geothermal/plant-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dry_steam', 'single_flash', 'double_flash', 'binary', 'egs'], 'n_keys': 5}`

**POST /api/v1/geothermal/assess** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['project_name', 'plant_type', 'plant_type_label', 'total_capex_musd', 'lcoe_usd_mwh', 'irena_lcoe_range', 'lcoe_vs_irena', 'annual_generation_gwh', 'capacity_factor_pct', 'lifetime_generation_`

## 5 · Intermediate Transformation Logic
**Methodology:** Geothermal LCOE
**Headline formula:** `LCOE = (Exploration + Drilling + Surface Plant + O&M) / (CF × 8760 × Capacity)`
**Standards:** ['IRENA — Geothermal Power Technology Brief 2017', 'ThinkGeoEnergy Market Report']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **54** other module(s).

| Connected module | Shared via |
|---|---|
| `geothermal-market-intelligence` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-project-finance` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-power-markets` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-direct-use` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `reference-data-explorer` | table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `carbon-aware-allocation` | table:db, table:sqlalchemy |
| `carbon-capture-finance` | table:db, table:sqlalchemy |
| `carbon-credit-audit-trail` | table:db, table:sqlalchemy |
| `carbon-wallet` | table:db, table:sqlalchemy |
| `insurance-climate-hub` | table:db, table:sqlalchemy |