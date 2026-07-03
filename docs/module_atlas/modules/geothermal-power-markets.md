# Geothermal Power Market Analytics
**Module ID:** `geothermal-power-markets` · **Route:** `/geothermal-power-markets` · **Tier:** A (backend vertical) · **EP code:** EP-DV4 · **Sprint:** DV

## 1 · Overview
Geothermal power market analytics covering PPA pricing by region, firm baseload ancillary services value, co-location with desalination and hydrogen production, binary ORC retrofit economics and capacity factor benchmarks versus intermittent renewables.

> **Business value:** Geothermal PPAs range $40–$80/MWh regionally, with ancillary service premiums of $5–$15/MWh; co-location with desalination and hydrogen production provides diversified revenue, while binary ORC retrofits extend asset life at $1,200–$2,000/kW.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `GRID_SERVICES`, `KpiCard`, `MARGINAL_VALUE`, `MARKET_PRICES`, `PPA_STRUCTURES`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `annMwh` | `powerMw * cf / 100 * 8760;` |
| `baseRev` | `annMwh * basePrice / 1e6;` |
| `capacityRev` | `powerMw * peakPricePremium * 8760 * 0.05 / 1e6;` |
| `ancillaryRev` | `annMwh * ancillaryShare / 100 * basePrice * 1.5 / 1e6;` |
| `annMwh` | `powerMw * cf / 100 * 8760;` |
| `geoAvgPrice` | `+(MARKET_PRICES.reduce((s, h) => s + h.spot, 0) / 24).toFixed(0);` |
| `weightedRev` | `annMwh * geoAvgPrice / 1e6;` |
| `ppaRev` | `annMwh * ppaPrice / 1e6;` |
| `carbonAdj` | `annMwh * carbonPrice * 38 / 1e9;` |
| `spotVol` | `basePrice * (0.8 + sr(y * 17) * 0.4);` |
| `ancillaryData` | `GRID_SERVICES.map(s => ({` |
| `renewGen` | `50 * Math.max(0, Math.sin(Math.PI * (h - 6) / 12));` |
| `demand` | `60 + sr(h * 5) * 30;` |
| `geoRequired` | `Math.max(0, demand - renewGen);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/geothermal/assess` | `assess_geothermal` | api/v1/routes/geothermal.py |
| GET | `/api/v1/geothermal/plant-types` | `list_plant_types` | api/v1/routes/geothermal.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `GRID_SERVICES`, `MARGINAL_VALUE`, `PPA_STRUCTURES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Regional PPA Price | `PPA = Negotiated bilateral contract price` | IRENA PPA Database 2023 | Range reflects resource quality, grid location, country risk and project vintage. |
| Ancillary Services Premium | `AS Value = Regulation + Spinning Reserve + Black Start` | CAISO / NZEM market data | Firm dispatchable nature of geothermal commands premium over variable RE in capacity markets. |
| Binary ORC Retrofit Capex | `Retrofit CAPEX = Equipment + Civil + Grid Connection` | GEA 2022 | Cost of converting existing flash plant to binary cycle for lower-enthalpy secondary extraction. |
- **PPA price databases + ancillary service market data** → Revenue stack model → project NPV by configuration → **Geothermal power market analytics dashboard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/geothermal/plant-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dry_steam', 'single_flash', 'double_flash', 'binary', 'egs'], 'n_keys': 5}`

**POST /api/v1/geothermal/assess** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['project_name', 'plant_type', 'plant_type_label', 'total_capex_musd', 'lcoe_usd_mwh', 'irena_lcoe_range', 'lcoe_vs_irena', 'annual_generation_gwh', 'capacity_factor_pct', 'lifetime_generation_`

## 5 · Intermediate Transformation Logic
**Methodology:** Geothermal PPA Value
**Headline formula:** `PPA Value = Energy Price + Capacity Payment + Ancillary Services Revenue`
**Standards:** ['IRENA — Value of Variable Renewable Energy', 'GEA — Annual US Geothermal Power Production Report']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **54** other module(s).

| Connected module | Shared via |
|---|---|
| `geothermal-market-intelligence` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-project-finance` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-lcoe-economics` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-direct-use` | table:DB, table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `reference-data-explorer` | table:db, table:dh_irena_lcoe, table:sqlalchemy |
| `carbon-aware-allocation` | table:db, table:sqlalchemy |
| `carbon-capture-finance` | table:db, table:sqlalchemy |
| `carbon-credit-audit-trail` | table:db, table:sqlalchemy |
| `carbon-wallet` | table:db, table:sqlalchemy |
| `insurance-climate-hub` | table:db, table:sqlalchemy |