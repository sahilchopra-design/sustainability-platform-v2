# Geothermal Direct Heat Analytics
**Module ID:** `geothermal-direct-use` · **Route:** `/geothermal-direct-use` · **Tier:** A (backend vertical) · **EP code:** EP-DV5 · **Sprint:** DV

## 1 · Overview
Analytics for geothermal direct heat applications including district heating, greenhouse agriculture, industrial process heat (40–150°C), balneology and fish farming, with LCOH benchmarking and comparison against heat pumps.

> **Business value:** Geothermal direct heat LCOH of $8–$25/GJ is competitive with gas where carbon prices exceed €30/tCO2; effective COP of 10–30× versus electric heat pumps reflects the elimination of electrical conversion losses in direct-use applications.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DIRECT_USE_APPS`, `DISTRICT_EXAMPLES`, `KpiCard`, `PROCESS_HEAT_SECTORS`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annualElec` | `heatingLoad / cop;` |
| `annualElecCost` | `annualElec * electricityPrice;` |
| `gasEquivCost` | `heatingLoad * gasPrice;` |
| `annualSaving` | `gasEquivCost - annualElecCost;` |
| `netInstall` | `installCost * (1 - subsidyPct / 100);` |
| `payback` | `annualSaving > 0 ? netInstall / annualSaving : Infinity;` |
| `npvSavings` | `annualSaving * (1 - Math.pow(1 + w, -lifetime)) / w;` |
| `npv` | `npvSavings - netInstall;` |
| `totalCapex` | `capexWell * wellsMw + capexNetwork * transmissionKm;` |
| `annRevenue` | `numBuildings * avgBuildingKw / 1000 * heatPrice * 8760 * 0.85 / 1e6;` |
| `opexAnn` | `totalCapex * opexPct / 100;` |
| `ebitda` | `annRevenue - opexAnn;` |
| `capexAnn` | `totalCapex * w / (1 - Math.pow(1 + w, -lifetime));` |
| `lcoh` | `ebitda > 0 ? +(capexAnn / (numBuildings * avgBuildingKw / 1000 * 8760 * 0.85)).toFixed(4) : 0;` |
| `gasEmissions` | `heatingLoad * 0.204;` |
| `elecEmissions` | `heatingLoad / cop * 0.233;` |
| `copCompare` | `useMemo(() => [2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0].map(c => ({` |
| `paybackByCarbonPrice` | `useMemo(() => [0, 25, 50, 75, 100, 150, 200].map(cp => {` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/geothermal/assess` | `assess_geothermal` | api/v1/routes/geothermal.py |
| GET | `/api/v1/geothermal/plant-types` | `list_plant_types` | api/v1/routes/geothermal.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DIRECT_USE_APPS`, `DISTRICT_EXAMPLES`, `PROCESS_HEAT_SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| District Heating LCOH | `LCOH = Annualised Cost / Annual Heat Delivered` | EGEC Market Report 2022 | Competitive vs gas district heating at carbon prices above €30/tCO2; EU Directive supports expansion. |
| COP vs Electric Heat Pump | `COP = Useful Heat Output / Electrical Input Equivalent` | IEA Geothermal Roadmap | Geothermal direct use avoids electricity conversion losses entirely; no parasitic load beyond pumping. |
| Industrial Process Heat Range | `Temperature = Resource Temperature − Distribution Losses` | IEA Industrial Heat Roadmap | Covers food processing, timber drying, textile, paper and chemical sectors below 150°C. |
- **EGEC market data + EU district heating policy database** → LCOH model → COP comparison → application mapping → **Geothermal direct use analytics dashboard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/geothermal/plant-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dry_steam', 'single_flash', 'double_flash', 'binary', 'egs'], 'n_keys': 5}`

**POST /api/v1/geothermal/assess** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['project_name', 'plant_type', 'plant_type_label', 'total_capex_musd', 'lcoe_usd_mwh', 'irena_lcoe_range', 'lcoe_vs_irena', 'annual_generation_gwh', 'capacity_factor_pct', 'lifetime_generation_`

## 5 · Intermediate Transformation Logic
**Methodology:** Levelised Cost of Heat
**Headline formula:** `LCOH = (Well Cost + Plant + O&M) / (Annual Heat Output GJ)`
**Standards:** ['EGEC — European Geothermal Market Report', 'IEA — Geothermal Heat Roadmap']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **54** other module(s).

| Connected module | Shared via |
|---|---|
| `geothermal-market-intelligence` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-project-finance` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-lcoe-economics` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-power-markets` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `reference-data-explorer` | table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `carbon-aware-allocation` | table:db, table:sqlalchemy |
| `carbon-capture-finance` | table:db, table:sqlalchemy |
| `carbon-credit-audit-trail` | table:db, table:sqlalchemy |
| `carbon-wallet` | table:db, table:sqlalchemy |
| `insurance-climate-hub` | table:db, table:sqlalchemy |