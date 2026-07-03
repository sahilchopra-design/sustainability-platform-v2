# Api::Cbam
**Module ID:** `api::cbam` · **Route:** `/api/v1/cbam` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/cbam/dashboard` | `dashboard` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/seed` | `seed` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/products` | `list_products` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/products/{pid}` | `get_product` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/products/sectors/summary` | `product_sectors` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/suppliers` | `list_suppliers` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/suppliers` | `create_supplier` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/suppliers/{sid}` | `get_supplier` | api/v1/routes/cbam.py |
| DELETE | `/api/v1/cbam/suppliers/{sid}` | `delete_supplier` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/suppliers/{sid}/projections` | `supplier_projections` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/emissions` | `record_emissions` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/emissions` | `list_emissions` | api/v1/routes/cbam.py |
| POST | `/api/v1/cbam/calculate-cost` | `calc_cost` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/free-allocation-schedule` | `free_alloc_schedule` | api/v1/routes/cbam.py |
| GET | `/api/v1/cbam/ets-price-scenarios` | `ets_scenarios` | api/v1/routes/cbam.py |

### 2.3 Engine `cbam_calculator` (services/cbam_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `CBAMEmissionsCalculator.calculate_embedded_emissions` | supplier_id, product_category_id, production_volume_tonnes, direct_emissions_data, indirect_emissions_data, electricity_consumed_mwh | Calculate Specific Embedded Emissions (SEE) for CBAM goods. |
| `CBAMEmissionsCalculator._calculate_direct_from_data` | data | Calculate direct emissions from source stream data. |
| `CBAMEmissionsCalculator._calculate_indirect_from_data` | data | Calculate indirect emissions from electricity/heat consumption data. |
| `CBAMEmissionsCalculator._get_grid_emission_factor` | country_code | Get grid emission factor for a country. Falls back to global average. |
| `CBAMCostProjector.project_supplier_costs` | supplier_id, start_year, end_year, scenario | Project CBAM costs for a supplier from start_year to end_year. |
| `CBAMCostProjector.calculate_portfolio_exposure` | supplier_ids, year, scenario | Calculate total CBAM exposure across multiple suppliers. |
| `CBAMCostProjector._interpolate_price` | prices, year | Interpolate ETS price for a given year. |
| `CBAMComplianceScorer.score_supplier_compliance` | supplier_id | Score a supplier's CBAM compliance readiness (0-100). |
| `CBAMComplianceScorer._generate_recommendations` | scores | Generate actionable recommendations based on scores. |
| `CBAMTransitionParams.interpolate_price` | source, year, custom_prices | Return carbon price (EUR/tCO2e) for a given source + year via linear interpolation. |
| `get_cbam_carbon_exposure` | scope1_tco2e, scope2_tco2e, scope3_tco2e, carbon_price_source, pass_through_rate, scope3_inclusion | Compute forward-looking CBAM carbon exposure for use in transition risk assessment. |

### 2.3 Engine `cbam_service` (services/cbam_service.py)
| Function | Args | Purpose |
|---|---|---|
| `seed_cbam_data` | db | Seed product categories, country risk, and certificate prices. |
| `calculate_cbam_cost` | emissions_tco2, eu_ets_price, domestic_carbon_price, free_allocation_pct | Calculate net CBAM cost for a given emissions amount. |
| `project_supplier_costs` | db, supplier_id, scenarios | Project CBAM costs for a supplier across years and scenarios. |
| `get_cbam_dashboard` | db | Get CBAM dashboard overview. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `country` *(shared)*, `db` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/cbam/certificate-prices** — status `passed`, provenance ['real-db'], source tables: `cbam_certificate_price`
Output: `{'type': 'array', 'len': 24, 'item0_keys': ['date', 'ets_price', 'cbam_price', 'scenario', 'is_projection']}`

**GET /api/v1/cbam/countries** — status `passed`, provenance ['real-db'], source tables: `cbam_country_risk`
Output: `{'type': 'array', 'len': 20, 'item0_keys': ['country_code', 'country_name', 'has_carbon_pricing', 'carbon_price_eur', 'grid_emission_factor', 'risk_score', 'risk_category']}`

**GET /api/v1/cbam/dashboard** — status `passed`, provenance ['real-db'], source tables: `cbam_country_risk`, `cbam_embedded_emissions`, `cbam_product_category`, `cbam_supplier`
Output: `{'type': 'object', 'keys': ['total_suppliers', 'total_products', 'total_countries', 'emissions_records', 'high_risk_suppliers', 'total_embedded_emissions_tco2', 'sector_breakdown'], 'n_keys': 7}`

**GET /api/v1/cbam/emissions** — status `passed`, provenance ['real-db'], source tables: `cbam_embedded_emissions`
Output: `{'type': 'array', 'len': 1, 'item0_keys': ['id', 'supplier_id', 'product_category_id', 'reporting_year', 'reporting_quarter', 'import_volume_tonnes', 'direct_emissions', 'indirect_emissions', 'specific_total', 'is_verifi`

**GET /api/v1/cbam/ets-price-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['Current Trend', 'Ambitious', 'Conservative'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic

**Engine `cbam_calculator` — extracted transformation lines:**
```python
SEE = (direct attributed emissions + indirect attributed emissions) / production volume
direct_attributed = see_direct * production_volume_tonnes
see_direct = direct_attributed / production_volume_tonnes
indirect_attributed = see_indirect * production_volume_tonnes
indirect_attributed = electricity_consumed_mwh * grid_ef
see_indirect = indirect_attributed / production_volume_tonnes
see_total = see_direct + see_indirect
total_embedded = see_total * production_volume_tonnes
specific_emissions = float(latest_emissions.direct_emissions or 0) / max(annual_volume, 1)
annual_emissions = annual_volume * specific_emissions
gross_cost = annual_emissions * ets_price
domestic_credit = annual_emissions * domestic_price
free_reduction = gross_cost * (free_pct / 100)
net_cost = max(0, gross_cost - domestic_credit - free_reduction)
```

**Engine `cbam_service` — extracted transformation lines:**
```python
gross_cost = emissions_tco2 * eu_ets_price
domestic_credit = emissions_tco2 * domestic_carbon_price
free_reduction = gross_cost * (free_allocation_pct / 100)
net_cost = max(0, gross_cost - domestic_credit - free_reduction)
annual_emissions = annual_volume * specific_emissions if specific_emissions > 0 else (emissions.direct_emissions or 0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).