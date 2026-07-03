# Api::Mining
**Module ID:** `api::mining` · **Route:** `/api/v1/mining` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/mining/calculate` | `calculate_mining` | api/v1/routes/mining.py |
| GET | `/api/v1/mining/reference-data` | `reference_data` | api/v1/routes/mining.py |
| GET | `/api/v1/mining/assessments` | `list_assessments` | api/v1/routes/mining.py |
| GET | `/api/v1/mining/assessments/{assessment_id}` | `get_assessment` | api/v1/routes/mining.py |

### 2.3 Engine `mining_risk_calculator` (services/mining_risk_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_mining_risk` | inp, scenario, horizon_year |  |
| `get_reference_data` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `mining_entities`, `mining_risk_assessments`, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/mining/assessments** — status `passed`, provenance ['db-empty'], source tables: `mining_entities`, `mining_risk_assessments`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/mining/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `mining_entities`, `mining_risk_assessments`
Output: `None`

**GET /api/v1/mining/reference-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['critical_minerals_hhi', 'transition_demand_sensitivity', 'water_intensity_benchmarks', 'carbon_price_by_scenario', 'gistm_consequence_classes', 'sources'], 'n_keys': 6}`

**POST /api/v1/mining/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `mining_risk_calculator` — extracted transformation lines:**
```python
closest_yr = min(c_prices.keys(), key=lambda y: abs(y - horizon_year))
scope12 = inp.scope1_tco2e + inp.scope2_tco2e
carbon_exposure = scope12 * carbon_price
tail_risk = failure_prob * 1000  # scale: 0.01 failure_prob → 10 score
ratio = actual_ml_kt / benchmark_ml_kt if benchmark_ml_kt > 0 else 1.0
water_risk = (inp.water_stress_index / 5.0) * 50 + (ratio - 1.0) * 10
prov_coverage = (inp.closure_provision_eur / closure_cost * 100.0) if closure_cost > 0 else 0.0
funding_gap   = max(0.0, closure_cost - inp.closure_provision_eur)
social_risk = 100.0 - inp.community_consent_score
social_risk = min(100.0, social_risk + 30.0)
social_risk = min(100.0, social_risk + 15.0)
social_risk = min(100.0, social_risk + 10.0)
geo_risk = hhi * 100.0  # simplified proxy
ev_pct = max(0.0, trans_demand) * 100.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).