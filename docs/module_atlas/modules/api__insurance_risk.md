# Api::Insurance_Risk
**Module ID:** `api::insurance_risk` · **Route:** `/api/v1/insurance-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/insurance-risk/mortality` | `assess_mortality` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/liability-valuation` | `value_liabilities` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/climate-frequency` | `assess_climate_frequency` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/underwriting` | `assess_underwriting` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/retrocession` | `assess_retrocession` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/medical-trend` | `assess_medical_trend` | api/v1/routes/insurance_risk.py |
| POST | `/api/v1/insurance-risk/comprehensive` | `comprehensive_assessment` | api/v1/routes/insurance_risk.py |
| GET | `/api/v1/insurance-risk/available-countries` | `available_countries` | api/v1/routes/insurance_risk.py |
| GET | `/api/v1/insurance-risk/available-perils` | `available_perils` | api/v1/routes/insurance_risk.py |
| GET | `/api/v1/insurance-risk/solvency2-countries` | `solvency2_countries` | api/v1/routes/insurance_risk.py |
| GET | `/api/v1/insurance-risk/climate-adjustments` | `climate_adjustments` | api/v1/routes/insurance_risk.py |

### 2.3 Engine `insurance_risk_engine` (services/insurance_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `InsuranceRiskEngine.assess_mortality` | country, sex, warming_c | Climate-adjusted mortality assessment. |
| `InsuranceRiskEngine.value_liabilities` | total_lives, avg_sum_assured_eur, avg_remaining_term_years, avg_age, discount_rate_pct, longevity_shock_bps | Life liability valuation under base and stressed longevity. |
| `InsuranceRiskEngine.assess_natcat_exposure` | country, exposure_eur, perils, warming_c | Natural catastrophe exposure analysis with climate overlay. |
| `InsuranceRiskEngine.assess_climate_frequency` | hazard_types, warming_scenario_c, base_loss_ratio_pct, expense_ratio_pct | Climate-adjusted loss frequency and severity analysis. |
| `InsuranceRiskEngine.assess_underwriting` | gwp_eur, net_earned_premium_eur, claims_incurred_eur, expense_ratio_pct, portfolio_size, warming_c | Underwriting risk assessment with climate overlay. |
| `InsuranceRiskEngine.assess_retrocession` | gross_exposure_eur, ceded_premium_eur, layers, counterparty_default_prob_pct | Reinsurance retrocession chain analysis. |
| `InsuranceRiskEngine.assess_medical_trend` | claim_cost_per_member_eur, medical_cpi_trend_pct, member_count, warming_c, pandemic_scenario | Health insurance medical trend analysis with climate overlay. |
| `InsuranceRiskEngine.comprehensive_assessment` | entity_name, country, warming_c, exposure_eur, own_funds_eur | Run all sub-modules and produce a comprehensive insurance risk summary. |
| `InsuranceRiskEngine._age_to_band` | age | Map numeric age to WHO age band key. |
| `InsuranceRiskEngine.get_available_countries` |  | List countries with embedded mortality tables. |
| `InsuranceRiskEngine.get_available_perils` |  | List perils with embedded damage functions. |
| `InsuranceRiskEngine.get_solvency2_countries` |  | List countries with Solvency II nat-cat factors. |
| `InsuranceRiskEngine.get_climate_adjustments` |  | Get climate-mortality adjustment parameters. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/insurance-risk/available-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**GET /api/v1/insurance-risk/available-perils** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['perils'], 'n_keys': 1}`

**GET /api/v1/insurance-risk/climate-adjustments** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['adjustments'], 'n_keys': 1}`

**GET /api/v1/insurance-risk/solvency2-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries'], 'n_keys': 1}`

**POST /api/v1/insurance-risk/climate-frequency** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `insurance_risk_engine` — extracted transformation lines:**
```python
remaining = max(0, 85 - midpoint)
le_delta = round(-delta_sum * 10, 2)  # Simplified scaling
reserve_impact = round((adj_avg - base_avg) / base_avg * 100, 2) if base_avg > 0 else 0.0
total_sa = total_lives * avg_sum_assured_eur
r = discount_rate_pct / 100.0
discount = (1 + r) ** (-t)
prob_death_t = base_qx * (1 + 0.01 * t)  # Aging adjustment
shock = longevity_shock_bps / 10000.0
stressed_qx = base_qx * (1 - shock) * (1 + 0.01 * t)
annuity_adj = 1.0 + longevity_shock_bps / 10000.0 * 5.0  # Simple annuity factor
pv_stressed_final = pv_stressed * annuity_adj
own_funds = total_sa * 0.08  # 8% of sum assured as own funds (simplified)
surplus_base = own_funds - pv_base
surplus_stressed = own_funds - pv_stressed_final
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).