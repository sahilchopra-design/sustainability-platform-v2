# Api::Eu_Ets
**Module ID:** `api::eu_ets` · **Route:** `/api/v1/eu-ets` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eu-ets/free-allocation` | `calculate_free_allocation` | api/v1/routes/eu_ets.py |
| POST | `/api/v1/eu-ets/compliance` | `assess_compliance` | api/v1/routes/eu_ets.py |
| POST | `/api/v1/eu-ets/carbon-price-forecast` | `forecast_carbon_price` | api/v1/routes/eu_ets.py |
| POST | `/api/v1/eu-ets/cap-trajectory` | `compute_cap_trajectory` | api/v1/routes/eu_ets.py |
| POST | `/api/v1/eu-ets/ets2-readiness` | `assess_ets2_readiness` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/benchmarks` | `ref_benchmarks` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/benchmarks/all` | `ref_benchmarks_all` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/price-scenarios` | `ref_price_scenarios` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/cbam-phaseout` | `ref_cbam_phaseout` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/cap-parameters` | `ref_cap_parameters` | api/v1/routes/eu_ets.py |
| GET | `/api/v1/eu-ets/ref/leakage-tiers` | `ref_leakage_tiers` | api/v1/routes/eu_ets.py |

### 2.3 Engine `eu_ets_engine` (services/eu_ets_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `EUETSEngine.calculate_free_allocation` | installation_id, installation_name, sector, product_benchmark, year, historical_activity_level | Calculate free allocation for an installation under ETS Phase 4. |
| `EUETSEngine.assess_compliance` | installation_id, year, verified_emissions_tco2, free_allocation_tco2, purchased_allowances_tco2, banked_allowances_tco2 | Assess compliance position for an installation. |
| `EUETSEngine.forecast_carbon_price` | scenario, current_price_eur | Forecast EU ETS carbon price under a given scenario. |
| `EUETSEngine.compute_cap_trajectory` | start_year, end_year | Compute EU ETS cap trajectory with LRF schedule. |
| `EUETSEngine.assess_ets2_readiness` | entity_id, entity_name, fuel_type, annual_fuel_volume_litres, annual_fuel_volume_kg, emission_factor_kgco2_per_litre | Assess readiness for ETS2 (buildings/transport from 2027). |
| `EUETSEngine.get_product_benchmarks` |  | Return product benchmarks as a flat dict for API reference endpoints. |
| `EUETSEngine.get_product_benchmarks_all_periods` |  | Return all benchmark rows across all allocation periods for the |
| `EUETSEngine.get_carbon_price_scenarios` |  |  |
| `EUETSEngine.get_cbam_phaseout_schedule` |  |  |
| `EUETSEngine.get_ets_cap_parameters` |  |  |
| `EUETSEngine.get_carbon_leakage_tiers` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `ETS2_EMISSION_FACTORS`, `__future__` *(shared)*, `ets_product_benchmarks`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eu-ets/ref/benchmarks** — status `passed`, provenance ['db-empty'], source tables: `ets_product_benchmarks`
Output: `{'type': 'object', 'keys': ['product_benchmarks'], 'n_keys': 1}`

**GET /api/v1/eu-ets/ref/benchmarks/all** — status `passed`, provenance ['db-empty'], source tables: `ets_product_benchmarks`
Output: `{'type': 'object', 'keys': ['product_benchmarks', 'note'], 'n_keys': 2}`

**GET /api/v1/eu-ets/ref/cap-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ets_cap_parameters'], 'n_keys': 1}`

**GET /api/v1/eu-ets/ref/cbam-phaseout** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cbam_phaseout'], 'n_keys': 1}`

**GET /api/v1/eu-ets/ref/leakage-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['carbon_leakage_tiers'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `eu_ets_engine` — extracted transformation lines:**
```python
years_from_2021 = max(0, year - 2021)
preliminary = historical_activity_level * bm_value
final = preliminary * cl_factor * cscf * cbam_factor
auction_cost = auction_exposure * carbon_price_eur
total_holdings = free_allocation_tco2 + purchased_allowances_tco2 + banked_allowances_tco2
surplus_deficit = total_holdings - surrender
purchase_cost = abs(surplus_deficit) * carbon_price_eur
penalty = abs(surplus_deficit) * 100.0  # EUR 100/tCO2 penalty
n_years = 2050 - 2025
cagr = ((p_2050 / current_price_eur) ** (1 / n_years) - 1) * 100
cap = max(0.0, cap - reduction)
annual_emissions = annual_fuel_volume_litres * ef_per_litre / 1000  # tCO2
pass_through = 70.0   # heating — longer-term supply contracts
consumer_impact = (carbon_price_eur * ef_per_litre / 1000)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).