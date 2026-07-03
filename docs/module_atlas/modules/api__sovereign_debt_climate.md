# Api::Sovereign_Debt_Climate
**Module ID:** `api::sovereign_debt_climate` · **Route:** `/api/v1/sovereign-debt-climate` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sovereign-debt-climate/crdc-assessment` | `crdc_assessment_endpoint` | api/v1/routes/sovereign_debt_climate.py |
| POST | `/api/v1/sovereign-debt-climate/debt-for-nature` | `debt_for_nature_endpoint` | api/v1/routes/sovereign_debt_climate.py |
| POST | `/api/v1/sovereign-debt-climate/imf-rst` | `imf_rst_endpoint` | api/v1/routes/sovereign_debt_climate.py |
| POST | `/api/v1/sovereign-debt-climate/sids-vulnerability` | `sids_vulnerability_endpoint` | api/v1/routes/sovereign_debt_climate.py |
| POST | `/api/v1/sovereign-debt-climate/sovereign-portfolio` | `sovereign_portfolio_endpoint` | api/v1/routes/sovereign_debt_climate.py |
| GET | `/api/v1/sovereign-debt-climate/ref/sids-list` | `ref_sids_list` | api/v1/routes/sovereign_debt_climate.py |
| GET | `/api/v1/sovereign-debt-climate/ref/crdc-triggers` | `ref_crdc_triggers` | api/v1/routes/sovereign_debt_climate.py |
| GET | `/api/v1/sovereign-debt-climate/ref/imf-rst-eligible` | `ref_imf_rst_eligible` | api/v1/routes/sovereign_debt_climate.py |
| GET | `/api/v1/sovereign-debt-climate/ref/paris-club` | `ref_paris_club` | api/v1/routes/sovereign_debt_climate.py |
| GET | `/api/v1/sovereign-debt-climate/ref/dfn-frameworks` | `ref_dfn_frameworks` | api/v1/routes/sovereign_debt_climate.py |

### 2.3 Engine `sovereign_debt_climate_engine` (services/sovereign_debt_climate_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `assess_crdc_eligibility` | country_data, debt_terms | Assess eligibility and design of Climate Resilience Debt Clauses. |
| `assess_debt_for_nature` | country_data, deal_terms | Assess and design a Debt-for-Nature swap transaction. |
| `assess_imf_rst` | country_data | Assess IMF Resilience and Sustainability Trust access and reform requirements. |
| `assess_sids_vulnerability` | country_iso, overrides | Assess SIDS vulnerability and CDPC eligibility using composite index. |
| `aggregate_sovereign_climate_portfolio` | holdings | Aggregate climate-linked sovereign debt metrics across a portfolio of sovereign holdings. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `and`, `debt`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sovereign-debt-climate/ref/crdc-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['trigger_types', 'total_triggers', 'standard', 'precedents'], 'n_keys': 4}`

**GET /api/v1/sovereign-debt-climate/ref/dfn-frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'total_frameworks', 'largest_deal_to_date', 'total_dfn_market_2023_bn_usd', 'key_actors', 'carbon_credit_standards'], 'n_keys': 6}`

**GET /api/v1/sovereign-debt-climate/ref/imf-rst-eligible** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['eligible_countries', 'total_eligible', 'access_limit_pct_quota', 'standard', 'rst_total_capacity_bn_sdr', 'note'], 'n_keys': 6}`

**GET /api/v1/sovereign-debt-climate/ref/paris-club** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['categories', 'climate_mou', 'g7_commitment', 'cdpc_adoption_target_pct', 'note'], 'n_keys': 5}`

**GET /api/v1/sovereign-debt-climate/ref/sids-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sids', 'total_sids', 'source', 'regions', 'note'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic

**Engine `sovereign_debt_climate_engine` — extracted transformation lines:**
```python
return_period = max(1.0, base_return_period * (1 - vuln_score + 0.2))
trigger_prob_pct = round(100 / return_period, 2)
annual_debt_service = debt_amount * ds_rate
debt_relief_score = round(min(1.0, vuln_score * 0.6 + (deferred_pct) * 0.4), 4)
commitment_pct_gdp = conservation_fund / gdp * 100 if gdp else 0.0
resilience_score = round(max(0.0, min(1.0, (1 - vuln) * 0.85 + approval_bonus)), 4)
nd_gain = round(0.5 * (1 - vuln), 4)
fiscal_res = round(0.4 * (1 - vuln) + (0.05 if gdp < 5 else 0.15), 4)
composite = round(inform * 0.35 + (1 - nd_gain) * 0.35 + (1 - fiscal_res) * 0.30, 4)
gdp_per_capita = gdp * 1e9 / float(_population)
relief_score = round(composite * 0.6 + (cdpc_deferred / 40) * 0.4, 4)
weighted_vuln_num = 0.0   # numerator: sum(vuln * exposure) over covered holdings
relief = min(1.0, vuln * 0.7)  # deterministic; no random jitter
sids_exposure_pct=round(sids_exposure / total_exposure * 100, 2),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).