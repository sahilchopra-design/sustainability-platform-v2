# Api::Shipping_Maritime
**Module ID:** `api::shipping_maritime` · **Route:** `/api/v1/shipping-maritime` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/shipping-maritime/cii-rating` | `cii_rating` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/eexi` | `eexi` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/poseidon-principles` | `poseidon_principles` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/fueleu` | `fueleu` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/ets-obligation` | `ets_obligation` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/fuel-switch` | `fuel_switch` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/fleet-portfolio` | `fleet_portfolio` | api/v1/routes/shipping_maritime.py |
| POST | `/api/v1/shipping-maritime/full-assessment` | `full_assessment` | api/v1/routes/shipping_maritime.py |
| GET | `/api/v1/shipping-maritime/ref/vessel-types` | `ref_vessel_types` | api/v1/routes/shipping_maritime.py |
| GET | `/api/v1/shipping-maritime/ref/cii-requirements` | `ref_cii_requirements` | api/v1/routes/shipping_maritime.py |
| GET | `/api/v1/shipping-maritime/ref/fueleu-targets` | `ref_fueleu_targets` | api/v1/routes/shipping_maritime.py |
| GET | `/api/v1/shipping-maritime/ref/fuel-emission-factors` | `ref_fuel_emission_factors` | api/v1/routes/shipping_maritime.py |

### 2.3 Engine `shipping_maritime_engine` (services/shipping_maritime_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ShippingMaritimeEngine.calculate_cii` | entity_id, vessel_type, dwt, distance_nm, fuel_consumed_t, fuel_type |  |
| `ShippingMaritimeEngine.calculate_eexi` | entity_id, vessel_type, dwt, installed_power_kw, service_speed_knots, epl_applied |  |
| `ShippingMaritimeEngine.assess_poseidon_principles` | entity_id, vessel_type, dwt, actual_intensity, pp_year |  |
| `ShippingMaritimeEngine.assess_fueleu` | entity_id, annual_energy_mj, ghg_intensity_wtw, year |  |
| `ShippingMaritimeEngine.calculate_ets_obligation` | entity_id, co2_tonne_pa, voyage_types, year, eua_price_eur |  |
| `ShippingMaritimeEngine.model_fuel_switch` | entity_id, vessel_type, current_fuel, target_fuel, fleet_size, voyage_profile |  |
| `ShippingMaritimeEngine.assess_fleet_portfolio` | entity_id, vessel_list |  |
| `ShippingMaritimeEngine.generate_full_assessment` | entity_id, vessel_data |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/shipping-maritime/ref/cii-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/shipping-maritime/ref/fuel-emission-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/shipping-maritime/ref/fueleu-targets** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/shipping-maritime/ref/vessel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/shipping-maritime/cii-rating** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `shipping_maritime_engine` — extracted transformation lines:**
```python
cii_attained = (co2_emitted * 1_000_000) / (dwt * distance_nm)
cii_reference = ref_coeff / math.sqrt(max(dwt, 1.0))
cii_required = cii_reference * (1.0 - reduction_pct / 100.0)
ratio = cii_attained / max(cii_required, 0.001)
future_required = cii_reference * (1.0 - future_reduction / 100.0)
future_ratio = cii_attained / max(future_required, 0.001)
sfcref = 195.0  # g/kWh reference SFOC for VLSFO
eexi_attained = (0.00349 * sfcref * effective_power) / (dwt * (service_speed_knots ** 0.3))
margin_pct = round((eexi_required - eexi_attained) / max(eexi_required, 0.001) * 100.0, 2)
required = trajectory[years_sorted[-1]]
t = (pp_year - y0) / (y1 - y0)
required = trajectory[y0] + t * (trajectory[y1] - trajectory[y0])
delta_pct = (actual_intensity - required) / max(required, 0.001) * 100.0
trajectory_gap = actual_intensity - required
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).