# Api::Epc_Retrofit
**Module ID:** `api::epc_retrofit` · **Route:** `/api/v1/epc-retrofit` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/epc-retrofit/transition-risk` | `assess_transition_risk` | api/v1/routes/epc_retrofit.py |
| POST | `/api/v1/epc-retrofit/retrofit-plan` | `generate_retrofit_plan` | api/v1/routes/epc_retrofit.py |
| GET | `/api/v1/epc-retrofit/measure-catalogue` | `get_measure_catalogue` | api/v1/routes/epc_retrofit.py |
| GET | `/api/v1/epc-retrofit/meps-timelines` | `get_meps_timelines` | api/v1/routes/epc_retrofit.py |
| GET | `/api/v1/epc-retrofit/energy-prices` | `get_energy_prices` | api/v1/routes/epc_retrofit.py |

### 2.3 Engine `epc_transition_engine` (services/epc_transition_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `EPCTransitionEngine.assess_property` | prop | Assess a single property's EPC transition risk. |
| `EPCTransitionEngine.assess_portfolio` | properties | Assess EPC transition risk across a portfolio. |
| `EPCTransitionEngine._calculate_composite_score` | deadlines, certainty | Weighted composite risk score 0-100. |

### 2.3 Engine `retrofit_planner` (services/retrofit_planner.py)
| Function | Args | Purpose |
|---|---|---|
| `RetrofitPlanner.plan_property` | prop | Generate retrofit plan for a single property. |
| `RetrofitPlanner.plan_portfolio` | properties | Generate retrofit plan across a portfolio. |
| `RetrofitPlanner._npv` | capex, annual_cf, years, rate | Simple NPV: -capex + sum(annual_cf / (1+r)^t) for t=1..years. |
| `RetrofitPlanner._irr_approx` | capex, annual_cf, years | Approximate IRR using bisection for uniform cashflows. |
| `RetrofitPlanner._select_measures_to_target` | measures, current_rank, target_rank | Greedy selection of measures by ROI until target EPC is reached. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/epc-retrofit/energy-prices** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['energy_prices_eur_kwh', 'grid_emission_factors_kgco2_kwh'], 'n_keys': 2}`

**GET /api/v1/epc-retrofit/measure-catalogue** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['measures', 'total_measures'], 'n_keys': 2}`

**GET /api/v1/epc-retrofit/meps-timelines** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['timelines', 'countries'], 'n_keys': 2}`

**POST /api/v1/epc-retrofit/retrofit-plan** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/epc-retrofit/transition-risk** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `epc_transition_engine` — extracted transformation lines:**
```python
gap = max(0, current_rank - required_rank)
annual_penalty = float(prop.floor_area_m2) * penalty if not is_compliant else 0.0
time_factor = max(0, 1.0 - years_remaining / 15.0)
gap_factor = min(1.0, gap / 5.0)
strand_prob = round(min(1.0, (time_factor * 0.4 + gap_factor * 0.4 + cert * 0.2)), 3)
avg_score = round(sum(r.composite_risk_score for r in results) / n, 1)
compliant_now_pct=round(compliant_now / n * 100, 1),
at_risk_2030_pct=round(at_risk_2030 / n * 100, 1),
at_risk_2033_pct=round(at_risk_2033 / n * 100, 1),
worst = max(non_compliant, key=lambda d: d.gap_steps * (1 / max(d.years_remaining, 1)))
gap_score = min(100.0, worst.gap_steps * 16.67)
time_score = max(0.0, 100.0 - worst.years_remaining * 10.0)
penalty_score = min(100.0, worst.penalty_eur_m2 / 50.0 * 100.0)
cert_score = certainty * 100.0
```

**Engine `retrofit_planner` — extracted transformation lines:**
```python
capex = m.capex_eur_m2 * prop.floor_area_m2
annual_kwh_saved = m.energy_saving_kwh_m2 * prop.floor_area_m2
annual_energy_eur = annual_kwh_saved * energy_price
annual_carbon_t = annual_kwh_saved * grid_factor / 1000.0
annual_carbon_eur = annual_carbon_t * prop.carbon_price_eur_t
total_annual = annual_energy_eur + annual_carbon_eur
payback = capex / total_annual if total_annual > 0 else 999.0
roi = (npv / capex * 100) if capex > 0 else 0.0
energy_pct = (m.energy_saving_kwh_m2 / prop.current_energy_intensity_kwh_m2 * 100
total_payback = total_capex / total_annual if total_annual > 0 else 999.0
projected_rank = max(1, current_rank - steps_gained)
green_uplift_pct = min(25.0, steps_gained * 3.5)
green_uplift_eur = prop.market_value * green_uplift_pct / 100.0
payback = total_capex / total_savings if total_savings > 0 else 999.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).