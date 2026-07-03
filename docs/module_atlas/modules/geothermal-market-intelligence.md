# Geothermal Market Intelligence
**Module ID:** `geothermal-market-intelligence` · **Route:** `/geothermal-market-intelligence` · **Tier:** A (backend vertical) · **EP code:** EP-DV3 · **Sprint:** DV

## 1 · Overview
Global geothermal market intelligence covering installed capacity by country, project pipeline, direct-use thermal capacity (90 GWth), national policy comparison and new entrant markets in Chile, Ethiopia and Saudi Arabia.

> **Business value:** Global geothermal capacity is led by USA (3.7 GW), Indonesia (2.4 GW), Philippines (1.9 GW), Turkey (1.7 GW) and Kenya (0.9 GW); 90 GWth direct-use capacity underscores the technology's broader energy significance beyond power generation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPACITY_HISTORY`, `COUNTRIES`, `DEVELOPERS`, `INVESTMENT_FLOWS`, `IRENA_GEOTHERMAL`, `KpiCard`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `IRENA_GEOTHERMAL` | `(IRENA_RENEWABLE_CAPACITY_2023\|\|[]).filter(c=>c.geothermal_gw>0).map(c=>({` |
| `totalInstalled` | `COUNTRIES.reduce((s, c) => s + c.installed, 0);` |
| `totalPipeline` | `COUNTRIES.reduce((s, c) => s + c.pipeline,  0);` |
| `top3` | `[...COUNTRIES].sort((a, b) => b.installed - a.installed).slice(0, 3);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/geothermal/assess` | `assess_geothermal` | api/v1/routes/geothermal.py |
| GET | `/api/v1/geothermal/plant-types` | `list_plant_types` | api/v1/routes/geothermal.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CAPACITY_HISTORY`, `COUNTRIES`, `DEVELOPERS`, `INVESTMENT_FLOWS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| USA Installed Capacity | `Fleet GW = Σ(Operational Unit Capacity)` | IRENA 2023 | Largest geothermal fleet globally; concentrated in The Geysers and Salton Sea. |
| Global Direct-Use Thermal | `Direct-Use = Σ(Installed Thermal Application Capacity)` | IGA World Geothermal Congress 2020 | Heating, agri and industrial applications dwarf power generation in total energy terms. |
| Indonesia Installed Capacity | `Fleet GW = Σ(Operational Unit Capacity)` | IRENA 2023 | Second largest fleet; government target 7.2 GW by 2030 underpins strong pipeline. |
- **IRENA capacity database + ThinkGeoEnergy pipeline tracker** → Capacity share model → policy incentive comparison → **Geothermal market intelligence dashboard by country**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/geothermal/plant-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dry_steam', 'single_flash', 'double_flash', 'binary', 'egs'], 'n_keys': 5}`

**POST /api/v1/geothermal/assess** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['project_name', 'plant_type', 'plant_type_label', 'total_capex_musd', 'lcoe_usd_mwh', 'irena_lcoe_range', 'lcoe_vs_irena', 'annual_generation_gwh', 'capacity_factor_pct', 'lifetime_generation_`

## 5 · Intermediate Transformation Logic
**Methodology:** Market Capacity Share
**Headline formula:** `Country Share = Country GW / Global Total GW × 100`
**Standards:** ['IRENA Renewable Capacity Statistics 2023', 'ThinkGeoEnergy Top 10 Geothermal Countries']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **54** other module(s).

| Connected module | Shared via |
|---|---|
| `geothermal-project-finance` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-lcoe-economics` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-power-markets` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-direct-use` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `reference-data-explorer` | table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `carbon-aware-allocation` | table:db, table:sqlalchemy |
| `carbon-capture-finance` | table:db, table:sqlalchemy |
| `carbon-credit-audit-trail` | table:db, table:sqlalchemy |
| `carbon-wallet` | table:db, table:sqlalchemy |
| `insurance-climate-hub` | table:db, table:sqlalchemy |