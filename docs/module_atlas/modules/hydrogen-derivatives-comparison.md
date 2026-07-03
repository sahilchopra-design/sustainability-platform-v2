# Hydrogen Carrier Comparison Analytics
**Module ID:** `hydrogen-derivatives-comparison` · **Route:** `/hydrogen-derivatives-comparison` · **Tier:** A (backend vertical) · **EP code:** EP-EE6 · **Sprint:** EE

## 1 · Overview
Comprehensive hydrogen carrier and derivatives comparison. Benchmarks GH2, LH2, LOHC, NH3, methanol, e-fuels, DRI-EAF, and e-methane across energy density, storage temperature, transport cost, conversion efficiency, and end-use suitability across five supply chain scenarios.

> **Business value:** Used by hydrogen project developers, shipping companies, infrastructure investors, and energy ministries to select optimal hydrogen carriers for different supply chain scenarios, distances, and end-use applications.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARRIERS`, `KpiCard`, `SCENARIOS`, `ScoreBar`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Carrier Comparison Matrix', 'Energy Density', 'Transport Cost Model', 'Supply Chain Scenarios', 'End-Use Fit', 'Investment Thesis'];` |

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
**Frontend seed datasets:** `CARRIERS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NH3 Transport Cost ($/GJ/1000km) | `VLGC freight ÷ LHV × distance` | IEA H2 Supply Chain Benchmarking | NH3 LHV = 18.6 GJ/t; at $80/t for 10,000 km = $0.43/GJ per 1000km; cheapest long-haul carrier. |
| LH2 Liquefaction Cost ($/GJ) | `Electricity_for_liquefaction × LCOE + CAPEX_CRF` | CSIRO H2 Roadmap + Kawasaki LH2 Pilot | Liquefaction energy = 6-12 kWh/kg; Kawasaki world's first commercial LH2 supply chain operational 2023. |
| LOHC Dehydrogenation Cost ($/kg H2) | `Heat + catalyst cost for H2 release` | Hydrogenious LOHC Technologies | Requires heat ~290°C; suitable for industrial H2 users with heat integration. |
- **IEA carrier costs + VLGC freight + liquefaction studies + LOHC dehydrogenation data** → Multi-carrier transport cost model + supply chain scenario comparison + radar chart → **Hydrogen carrier selection for export developers, importers, and infrastructure investors**

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
**Methodology:** Carrier Transport Cost & Reconversion Model
**Headline formula:** `Total_cost = production_$/GJ + carrier_conversion + shipping_$/GJ/1000km + reconversion_$/GJ`
**Standards:** ['IRENA Green H2 Cost Reduction Report', 'BNEF Hydrogen Economy Outlook 2024', 'IEA H2 Supply Chain Cost Benchmarking']

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
| `hydrogen-storage-transport` | engine:hydrogen_economy_engine |
| `hydrogen-economy-modeler` | engine:hydrogen_economy_engine |