# Api::Sector_Calculators
**Module ID:** `api::sector_calculators` · **Route:** `/api/v1/sector-calculators` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sector-calculators/shipping/calculate` | `calculate_shipping` | api/v1/routes/sector_calculators.py |
| POST | `/api/v1/sector-calculators/steel/calculate` | `calculate_steel` | api/v1/routes/sector_calculators.py |
| GET | `/api/v1/sector-calculators/shipping/vessel-types` | `list_vessel_types` | api/v1/routes/sector_calculators.py |
| GET | `/api/v1/sector-calculators/shipping/fuel-types` | `list_fuel_types` | api/v1/routes/sector_calculators.py |
| GET | `/api/v1/sector-calculators/steel/iea-glidepath` | `get_steel_glidepath` | api/v1/routes/sector_calculators.py |

### 2.3 Engine `shipping_calculator` (services/shipping_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `ShippingCalculator.calculate` | inp |  |
| `ShippingCalculator._run` | inp |  |
| `ShippingCalculator._compute_rating` | aer, cii_ref, factors |  |
| `ShippingCalculator._estimate_stranding` | aer, cii_ref, vtype | Estimate year when vessel will be D/E if no improvements made. |
| `ShippingCalculator._improvement_pathway` | inp, aer, cii_ref, factors | What fuel switch or efficiency improvement achieves CII Rating A? |
| `ShippingCalculator._build_narrative` | name, rating, aer, imo_2030, pct_vs_2030, fuel_switch |  |

### 2.3 Engine `steel_calculator` (services/steel_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `SteelCalculator.calculate` | inp |  |
| `SteelCalculator._run` | inp |  |
| `SteelCalculator._build_glidepath` | current_intensity, inp |  |
| `SteelCalculator._build_pathway` | inp, current, target, eaf_intensity |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sector-calculators/shipping/fuel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['fuel_types'], 'n_keys': 1}`

**GET /api/v1/sector-calculators/shipping/vessel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['vessel_types'], 'n_keys': 1}`

**GET /api/v1/sector-calculators/steel/iea-glidepath** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['title', 'metric', 'glidepath'], 'n_keys': 3}`

**POST /api/v1/sector-calculators/shipping/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sector-calculators/steel/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `shipping_calculator` — extracted transformation lines:**
```python
aer = (annual_co2 * 1_000_000 / (capacity * inp.annual_distance_nm)).quantize(
cii_ref = Decimal(str(a)) * (capacity ** Decimal(str(-c)))
factor = 1.0 + max(0, (year - 2026) * 0.02)
effective_ref = float(cii_ref) / factor
```

**Engine `steel_calculator` — extracted transformation lines:**
```python
contribution = weight * intensity
dev = (actual - iea) / iea * 100
gap = current - target
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).