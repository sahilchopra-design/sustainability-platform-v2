# Hydrogen Storage and Transport Economics
**Module ID:** `hydrogen-storage-transport` · **Route:** `/hydrogen-storage-transport` · **Tier:** A (backend vertical) · **EP code:** EP-DS4 · **Sprint:** DS

## 1 · Overview
Comparative economics of hydrogen storage and transport pathways: compressed gas, liquid H2, liquid organic hydrogen carriers and ammonia, covering cost, energy penalty and pipeline repurposing.

> **Business value:** Ammonia dominates for intercontinental hydrogen trade (>3,000 km) at $1.5-2.5/kgH2 delivered; pipeline repurposing cuts intra-continental transport cost by 50-70% versus new build, per DNV and IEA analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CORRIDORS`, `DENSITY_350BAR`, `DENSITY_700BAR`, `DENSITY_LIQUID_H2`, `HHV_H2`, `KpiCard`, `LHV_H2`, `NH3_H2_RATIO`, `STORAGE_MODES`, `Slider`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `LHV_H2` | `33.3;   // kWh/kg` |
| `HHV_H2` | `39.4;   // kWh/kg` |
| `DENSITY_LIQUID_H2` | `70.8;   // kg/m³ at -253°C` |
| `DENSITY_700BAR` | `39.0;   // kg/m³ at 700 bar` |
| `DENSITY_350BAR` | `23.5;   // kg/m³ at 350 bar` |
| `NH3_H2_RATIO` | `0.178;  // kg H2 / kg NH3` |
| `capexPerKm` | `3.2 + 0.8 * diaDm; // M€/km` |
| `totalCapex` | `capexPerKm * distKm;` |
| `annualFlow` | `flowMtpa * 1e9 / 8760; // kg/hr` |
| `annualTonne` | `flowMtpa * 1000; // t/yr` |
| `annuity` | `totalCapex * 1e6 * 0.08 / (1 - Math.pow(1.08, -30));` |
| `capexTerminal` | `termCapacity * 0.5; // €0.5M per tonne capacity = M€` |
| `annuity` | `capexTerminal * 1e6 * 0.08 / (1 - Math.pow(1.08, -30));` |
| `annualThroughput` | `termCapacity * (loaFactor / 100) * 12; // tonnes/yr` |
| `costPerKg` | `annuity / Math.max(1, annualThroughput * 1000);` |
| `stackData` | `useMemo(() => CORRIDORS.map((c, i) => {` |
| `prodCost` | `2.5 + sr(i * 17) * 2.0;` |
| `storeCost` | `0.3 + sr(i * 11) * 0.4;` |

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
**Frontend seed datasets:** `CORRIDORS`, `STORAGE_MODES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Compressed Gas Storage Cost | `P×V×Z/nRT adjusted CAPEX` | IEA 2023 | 700 bar tanks used for transport; 350 bar for stationary; cost scales with pressure rating and tank volume. |
| Liquid H2 Transport Cost | `CAPEX+boil-off+energy/throughput` | DNV 2023 | Liquefaction energy penalty 25-35% of H2 HHV; boil-off 0.2-0.3%/day adds cost for long voyages. |
| Ammonia Reconversion Efficiency | `η_NH3 = H2_out/H2_in` | Hydrogen Council 2022 | NH3 cracking to H2 adds $0.5-1.5/kgH2; often used directly as fuel/feedstock to avoid reconversion loss. |
- **Transport distance matrix** → → pathway cost model → **$/kgH2 by distance and mode**
- **Pipeline repurposing assessment** → → infrastructure cost → **Existing vs new pipeline $/km**

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
**Methodology:** Storage & Transport Cost Model
**Headline formula:** `Total_cost = Storage_cost($/kgH2) + Transport_cost($/kgH2/1000km) × distance`
**Standards:** ['DNV Hydrogen Forecast 2023', 'IEA The Future of Hydrogen', 'Hydrogen Council Hydrogen Decarbonization Pathways']

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
| `hydrogen-market-intelligence` | engine:hydrogen_economy_engine |
| `hydrogen-project-finance` | engine:hydrogen_economy_engine |
| `hydrogen-derivatives-comparison` | engine:hydrogen_economy_engine |
| `hydrogen-economy-modeler` | engine:hydrogen_economy_engine |
**Shared UI wrappers:** `EnergyAdvancedAnalytics`