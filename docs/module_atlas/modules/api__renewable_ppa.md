# Api::Renewable_Ppa
**Module ID:** `api::renewable_ppa` · **Route:** `/api/v1/renewable-ppa` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/renewable-ppa/lcoe` | `lcoe` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/turbine-classes` | `ref_turbine_classes` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/solar-ghi` | `ref_solar_ghi` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/solar-defaults` | `ref_solar_defaults` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/credit-ratings` | `ref_credit_ratings` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/price-structures` | `ref_price_structures` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/ppa-risk-weights` | `ref_ppa_risk_weights` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/curtailment-risk` | `ref_curtailment_risk` | api/v1/routes/renewable_ppa.py |
| GET | `/api/v1/renewable-ppa/ref/regulatory-risk` | `ref_regulatory_risk` | api/v1/routes/renewable_ppa.py |

### 2.3 Engine `ppa_risk_scorer` (services/ppa_risk_scorer.py)
| Function | Args | Purpose |
|---|---|---|
| `PPARiskScorer.score_ppa` | inp | Score a PPA across all risk dimensions. |
| `PPARiskScorer.get_credit_ratings` |  |  |
| `PPARiskScorer.get_price_structures` |  |  |
| `PPARiskScorer._make_dim` | dim_id, label, raw_score |  |
| `PPARiskScorer._tenor_score` | years |  |

### 2.3 Engine `renewable_project_engine` (services/renewable_project_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RenewableProjectEngine.wind_yield` | turbine_class, region, num_turbines, wake_loss_pct, availability_pct | Calculate wind energy yield with P50/P75/P90 confidence levels. |
| `RenewableProjectEngine._wind_capacity_factor` | k, lam, turb | Estimate capacity factor from Weibull distribution and power curve. |
| `RenewableProjectEngine.solar_yield` | country, capacity_kwp, performance_ratio, degradation_pct_yr | Calculate solar energy yield with P50/P75/P90. |
| `RenewableProjectEngine.lcoe` | technology, total_capex_eur, annual_opex_eur, annual_generation_mwh, wacc_pct, lifetime_years | Calculate Levelised Cost of Energy. |
| `RenewableProjectEngine.assess_project` | project_name, technology, turbine_class, region, num_turbines, country | Full project finance assessment with IRR, NPV, LCOE. |
| `RenewableProjectEngine.get_turbine_classes` |  |  |
| `RenewableProjectEngine.get_wind_regions` |  |  |
| `RenewableProjectEngine.get_solar_ghi_data` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/renewable-ppa/ref/credit-ratings** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'unrated_ig', 'unrated_sub_ig', 'unrated', 'sovereign', 'utility'], 'n_keys': 12}`

**GET /api/v1/renewable-ppa/ref/curtailment-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['low', 'moderate', 'high', 'very_high'], 'n_keys': 4}`

**GET /api/v1/renewable-ppa/ref/ppa-risk-weights** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['counterparty_credit', 'price_structure', 'tenor', 'curtailment', 'regulatory'], 'n_keys': 5}`

**GET /api/v1/renewable-ppa/ref/price-structures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['fixed', 'fixed_escalation', 'cap_floor', 'indexed_power', 'indexed_gas', 'partial_merchant', 'full_merchant', 'subsidy_cfd', 'feed_in_tariff'], 'n_keys': 9}`

**GET /api/v1/renewable-ppa/ref/regulatory-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['stable', 'moderate', 'high', 'very_high'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic

**Engine `ppa_risk_scorer` — extracted transformation lines:**
```python
price_score = min(100, price_score + int(inp.merchant_exposure_pct * 0.5))
reg_score = min(100, reg_score + 20)
weighted_score=round(raw_score * weight, 2),
```

**Engine `renewable_project_engine` — extracted transformation lines:**
```python
mean_ws = lam * math.gamma(1 + 1 / k)
cf_net = cf * (1 - wake_loss_pct / 100) * (availability_pct / 100)
p50 = total_cap * cf_net * hours
p75 = p50 * (1 - 0.674 * uncertainty_std_pct / 100)
p90 = p50 * (1 - 1.282 * uncertainty_std_pct / 100)
eflh = cf_net * hours
capacity_factor_pct=round(cf_net * 100, 1),
partial_fraction = (p_below_rated - p_below_cut_in) * 0.45
rated_fraction = (p_below_cut_out - p_below_rated) * 1.0
cf = partial_fraction + rated_fraction
effective_pr = pr * (1 - temp_loss)
specific_yield = ghi * effective_pr
p50_yr1 = capacity_kwp * specific_yield / 1000  # MWh
p75_yr1 = p50_yr1 * (1 - 0.674 * uncertainty_std_pct / 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).