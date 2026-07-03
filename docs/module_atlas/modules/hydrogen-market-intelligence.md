# Global Hydrogen Market Intelligence
**Module ID:** `hydrogen-market-intelligence` · **Route:** `/hydrogen-market-intelligence` · **Tier:** A (backend vertical) · **EP code:** EP-DS3 · **Sprint:** DS

## 1 · Overview
Global hydrogen market dashboard tracking production by pathway, demand by sector, country project pipelines and cost trajectory from 2020 to 2050.

> **Business value:** Green hydrogen represents <1% of global production in 2023 but >1,000 GW is in the announced pipeline; market intelligence confirms cost parity with grey H2 is achievable before 2030 in solar-rich regions per IEA and IRENA projections.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `EXPORTERS`, `IMPORTERS`, `KpiCard`, `SECTORS`, `TABS`, `VALLEYS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YEARS` | `Array.from({ length: 16 }, (_, i) => 2025 + i);` |
| `demandData` | `useMemo(() => YEARS.map((y, i) => {` |
| `supplyData` | `useMemo(() => YEARS.map((y, i) => ({` |
| `priceData` | `useMemo(() => YEARS.map((y, i) => ({` |
| `geoRisks` | `useMemo(() => EXPORTERS.map((e, i) => ({` |
| `techMixData` | `YEARS.map((y, i) => ({` |
| `totalGreenPipeline` | `EXPORTERS.reduce((a, e) => a + e.potential2030, 0);` |
| `totalDemand2030` | `SECTORS.reduce((a, s) => a + s.demand2030, 0);` |
| `panelStyle` | `{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text };` |
| `gridStyle` | `{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/hydrogen/demand-sector` | `demand_sector` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/eu-h2-bank` | `eu_h2_bank` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/cost-trajectory` | `cost_trajectory` | api/v1/routes/hydrogen.py |
| POST | `/api/v1/hydrogen/portfolio` | `portfolio` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/h2-colours` | `ref_h2_colours` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/production-pathways` | `ref_production_pathways` | api/v1/routes/hydrogen.py |
| GET | `/api/v1/hydrogen/ref/country-costs` | `ref_country_costs` | api/v1/routes/hydrogen.py |

### 2.3 Engine `hydrogen_economy_engine` (services/hydrogen_economy_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | lo, hi, val |  |
| `_annuity_factor` | rate, years | Annuity factor for CAPEX annualisation. |
| `HydrogenEconomyEngine.calculate_lcoh` | entity_id, production_pathway, capacity_mw_el, country_code, capacity_factor_pct, financing_cost_pct |  |
| `HydrogenEconomyEngine.assess_rfnbo_compliance` | entity_id, production_pathway, country_code, re_source, hourly_matching, temporal_correlation |  |
| `HydrogenEconomyEngine.assess_demand_sector` | entity_id, demand_sector, annual_h2_demand_t, country_code, current_fuel_type, green_lcoh_usd_kg |  |
| `HydrogenEconomyEngine.assess_eu_h2_bank` | entity_id, production_pathway, capacity_mw_el, country_code, lcoh_usd_kg, competitive_bid_price_eur_kg |  |
| `HydrogenEconomyEngine.project_cost_trajectory` | entity_id, production_pathway, country_code, base_lcoh_2024_usd_kg |  |
| `HydrogenEconomyEngine.assess_portfolio` | entity_id, projects |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `EXPORTERS`, `IMPORTERS`, `SECTORS`, `TABS`, `VALLEYS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global H2 Demand | `Sum across industry+transport+power+other` | IEA 2023 | Industrial feedstock (ammonia, refining) dominates at 54%; new demand in transport and power is nascent. |
| Green H2 Project Pipeline | `Capacity_announced by country/stage` | IEA Projects Database | Only ~5% of announced projects reach FID; policy certainty and offtake contracts are key gating factors. |
| Cost Trajectory | `Learning rate ~18% per doubling` | IRENA 2023 | Green H2 cost declines track electrolyser and renewable electricity cost curves; IEA targets <$2/kg by 2030 in |
- **IEA Hydrogen Projects Database** → → pipeline tracker → **Projects by country, technology, status**
- **IRENA cost data** → → trajectory model → **LCOH by region and year**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/hydrogen/ref/country-costs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['country_electricity_costs', 'eu_h2_bank_eligibility', 'source'], 'n_keys': 3}`

**GET /api/v1/hydrogen/ref/h2-colours** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['h2_colours', 'rfnbo_ghg_threshold_kgco2e_kgh2', 'source'], 'n_keys': 3}`

**GET /api/v1/hydrogen/ref/production-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['production_pathways', 'rfnbo_criteria', 'source'], 'n_keys': 3}`

**POST /api/v1/hydrogen/cost-trajectory** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/hydrogen/demand-sector** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Market Intelligence Framework
**Headline formula:** `Green share = Green_capacity / Total_H2_capacity × 100`
**Standards:** ['IEA Global Hydrogen Review 2023', 'IRENA World Energy Transitions Outlook', 'Hydrogen Council Market Development']

**Engine `hydrogen_economy_engine` — extracted transformation lines:**
```python
r = rate / 100.0
H2_LHV_KWH_PER_KG = 33.33  # kWh/kg LHV
capacity_kw = capacity_mw_el * 1000.0
cf = _clamp(5.0, 95.0, capacity_factor_pct) / 100.0
annual_hours = 8760.0 * cf
annual_h2_kwh = capacity_kw * annual_hours * efficiency
annual_h2_kg = annual_h2_kwh / self.H2_LHV_KWH_PER_KG
annual_h2_t = annual_h2_kg / 1000.0
annual_capex = capex_total_usd * annuity
capex_component = round(annual_capex / max(annual_h2_kg, 1.0), 4)
opex_component = round(annual_opex / max(annual_h2_kg, 1.0), 4)
annual_elec_kwh = capacity_kw * annual_hours
annual_elec_cost = annual_elec_kwh * elec_cost
electricity_component = round(annual_elec_cost / max(annual_h2_kg, 1.0), 4)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **4** other module(s).
**Shared engines (edits propagate!):** `hydrogen_economy_engine` (used by 5 modules)

| Connected module | Shared via |
|---|---|
| `hydrogen-project-finance` | engine:hydrogen_economy_engine |
| `hydrogen-storage-transport` | engine:hydrogen_economy_engine |
| `hydrogen-derivatives-comparison` | engine:hydrogen_economy_engine |
| `hydrogen-economy-modeler` | engine:hydrogen_economy_engine |
**Shared UI wrappers:** `EnergyAdvancedAnalytics`