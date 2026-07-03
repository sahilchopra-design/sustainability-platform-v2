# Api::Real_Asset_Decarb
**Module ID:** `api::real_asset_decarb` · **Route:** `/api/v1/real-asset-decarb` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/real-asset-decarb/lock-in-risk` | `post_lock_in_risk` | api/v1/routes/real_asset_decarb.py |
| POST | `/api/v1/real-asset-decarb/capex-transition` | `post_capex_transition` | api/v1/routes/real_asset_decarb.py |
| POST | `/api/v1/real-asset-decarb/retrofit-npv` | `post_retrofit_npv` | api/v1/routes/real_asset_decarb.py |
| POST | `/api/v1/real-asset-decarb/brown-to-green` | `post_brown_to_green` | api/v1/routes/real_asset_decarb.py |
| POST | `/api/v1/real-asset-decarb/decarb-roadmap` | `post_decarb_roadmap` | api/v1/routes/real_asset_decarb.py |
| GET | `/api/v1/real-asset-decarb/ref/asset-types` | `get_asset_types` | api/v1/routes/real_asset_decarb.py |
| GET | `/api/v1/real-asset-decarb/ref/retrofit-measures` | `get_retrofit_measures` | api/v1/routes/real_asset_decarb.py |
| GET | `/api/v1/real-asset-decarb/ref/crrem-pathways` | `get_crrem_pathways` | api/v1/routes/real_asset_decarb.py |
| GET | `/api/v1/real-asset-decarb/ref/sbti-sectors` | `get_sbti_sectors` | api/v1/routes/real_asset_decarb.py |
| GET | `/api/v1/real-asset-decarb/ref/abatement-costs` | `get_abatement_costs` | api/v1/routes/real_asset_decarb.py |

### 2.3 Engine `real_asset_decarb_engine` (services/real_asset_decarb_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | v, lo, hi |  |
| `_mid` | rng | Deterministic midpoint of a documented reference range (MODEL parameter, |
| `_npv` | cash_flows, discount_rate |  |
| `assess_lock_in_risk` | entity_id, asset_type, age_years, capex_cycle_years, current_intensity, asset_value_usd | Assess stranded asset lock-in risk. |
| `plan_capex_transition` | entity_id, asset_type, current_emissions, target_year, budget_usd, floor_area_m2 | Build capex transition plan with abatement cost curve. |
| `calculate_retrofit_npv` | entity_id, building_type, retrofit_measures, floor_area_m2, energy_intensity_kwh_m2, energy_cost_per_kwh | Calculate NPV of building retrofit measures. |
| `model_brown_to_green` | entity_id, portfolio, transition_scenarios | Model brown-to-green portfolio transformation 2025-2050. |
| `generate_decarb_roadmap` | entity_id, assets, budget_constraint | Generate prioritised decarbonisation roadmap. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `brown`, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/real-asset-decarb/ref/abatement-costs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['abatement_technologies', 'carbon_price_scenarios'], 'n_keys': 2}`

**GET /api/v1/real-asset-decarb/ref/asset-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_types'], 'n_keys': 1}`

**GET /api/v1/real-asset-decarb/ref/crrem-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['crrem_pathways'], 'n_keys': 1}`

**GET /api/v1/real-asset-decarb/ref/retrofit-measures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['retrofit_measures'], 'n_keys': 1}`

**GET /api/v1/real-asset-decarb/ref/sbti-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sbti_sector_rates', 'sbti_nz_standard'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `real_asset_decarb_engine` — extracted transformation lines:**
```python
years_to_next_capex = max(0.0, capex_cycle_years - (age_years % max(capex_cycle_years, 1)))
intensity_divergence = current_intensity - crrem_2030
divergence_pct = (intensity_divergence / crrem_2030 * 100) if crrem_2030 > 0 else 0.0
t = year - 2024
pathway_t = max(0.0, base_intensity * (1 - sbti_rate) ** t)
emissions_at_risk = current_intensity * floor_area_m2 / 1000.0
carbon_price_risk_usd = round(emissions_at_risk * carbon_price_2030, 0)
horizon = max(5, min(25, target_year - base_year))
invest_req = max_red * abatement_cost
max_red = remaining_budget / abatement_cost
remaining_emissions = max(0.0, remaining_emissions - max_red)
remaining_budget = max(0.0, remaining_budget - invest_req)
annual_capex = round(budget_usd / max(horizon, 1), 0)
years = list(range(base_year, base_year + horizon + 1))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).