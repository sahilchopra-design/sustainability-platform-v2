# Api::Cdr
**Module ID:** `api::cdr` · **Route:** `/api/v1/cdr` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/cdr/oxford-principles` | `oxford_principles` | api/v1/routes/cdr.py |
| POST | `/api/v1/cdr/article-6-4` | `article_6_4` | api/v1/routes/cdr.py |
| POST | `/api/v1/cdr/portfolio` | `portfolio` | api/v1/routes/cdr.py |
| GET | `/api/v1/cdr/ref/verification-standards` | `ref_verification_standards` | api/v1/routes/cdr.py |
| GET | `/api/v1/cdr/ref/oxford-principles` | `ref_oxford_principles` | api/v1/routes/cdr.py |

### 2.3 Engine `cdr_engine` (services/cdr_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | lo, hi, val |  |
| `_bezero_rating` | score |  |
| `_npv` | cashflows, rate |  |
| `_irr` | cashflows | Internal rate of return (as a decimal) via bisection. |
| `CDREngine.assess_cdr_quality` | entity_id, cdr_method, annual_removal_tco2, permanence_yrs, verification_standard, additionality_score |  |
| `CDREngine.calculate_lcor` | entity_id, cdr_method, capacity_tco2_pa, capex_usd, opex_usd_pa, lifetime_yrs |  |
| `CDREngine.assess_oxford_principles` | entity_id, cdr_method, avoidance_residual, preference_durable, shift_to_durable_plan, avoid_locking_in_emissions |  |
| `CDREngine.assess_article_6_4` | entity_id, cdr_method, host_country_code, host_country_authorised, corresponding_adjustment_agreed, sustainable_dev_safeguards |  |
| `CDREngine.assess_vcmi_claims` | entity_id, scope1_sbti_aligned, scope2_sbti_aligned, scope3_disclosure, residual_emissions_tco2, cdr_credits_tco2 |  |
| `CDREngine.assess_portfolio` | entity_id, projects |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/cdr/ref/cdr-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cdr_methods', 'bezero_rating_thresholds', 'source'], 'n_keys': 3}`

**GET /api/v1/cdr/ref/oxford-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['oxford_principles', 'vcmi_claims_levels', 'source'], 'n_keys': 3}`

**GET /api/v1/cdr/ref/verification-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['verification_standards', 'article_6_4_criteria', 'source'], 'n_keys': 3}`

**POST /api/v1/cdr/article-6-4** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/cdr/lcor** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `cdr_engine` — extracted transformation lines:**
```python
r = rate / 100.0
mid = (lo + hi) / 2.0
leakage_score = _clamp(0.0, 100.0, 100.0 - leakage * 1.5)
co_benefits_score = min(100.0, co_benefit_count * 20.0)
buffer_pool_tco2 = round(annual_removal_tco2 * buffer_pool_pct / 100.0, 2)
net_credits_tco2 = round(annual_removal_tco2 - buffer_pool_tco2, 2)
r = discount_rate_pct / 100.0
annuity = r / (1.0 - (1.0 + r) ** (-lifetime))
annuity = 1.0 / lifetime
annual_capex = capex_usd * annuity
total_annual_cost = annual_capex + opex_usd_pa
lcor = round(total_annual_cost / max(capacity_tco2_pa, 1.0), 2)
capex_lo = capex_usd * 0.80
capex_hi = capex_usd * 1.20
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).