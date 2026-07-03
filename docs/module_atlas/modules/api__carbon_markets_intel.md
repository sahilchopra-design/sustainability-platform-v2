# Api::Carbon_Markets_Intel
**Module ID:** `api::carbon_markets_intel` · **Route:** `/api/v1/carbon-markets-intel` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/carbon-markets-intel/vcmi-claim` | `vcmi_claim` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/icvcm-ccp` | `icvcm_ccp` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/corsia-check` | `corsia_check` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/article6` | `article6` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/credit-pricing` | `credit_pricing` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/portfolio-analysis` | `portfolio_analysis` | api/v1/routes/carbon_markets_intel.py |
| POST | `/api/v1/carbon-markets-intel/full-assessment` | `full_assessment` | api/v1/routes/carbon_markets_intel.py |
| GET | `/api/v1/carbon-markets-intel/ref/vcmi-criteria` | `ref_vcmi_criteria` | api/v1/routes/carbon_markets_intel.py |
| GET | `/api/v1/carbon-markets-intel/ref/icvcm-ccps` | `ref_icvcm_ccps` | api/v1/routes/carbon_markets_intel.py |
| GET | `/api/v1/carbon-markets-intel/ref/corsia-schemes` | `ref_corsia_schemes` | api/v1/routes/carbon_markets_intel.py |
| GET | `/api/v1/carbon-markets-intel/ref/price-benchmarks` | `ref_price_benchmarks` | api/v1/routes/carbon_markets_intel.py |

### 2.3 Engine `carbon_markets_intel_engine` (services/carbon_markets_intel_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonMarketsIntelEngine.screen_vcmi_claim` | entity_id, abatement_pct, sbti_status, scope_coverage, mitigation_contribution_pct |  |
| `CarbonMarketsIntelEngine.assess_icvcm_ccps` | entity_id, credit_portfolio |  |
| `CarbonMarketsIntelEngine.check_corsia_eligibility` | entity_id, credit_records |  |
| `CarbonMarketsIntelEngine.assess_article6` | entity_id, credit_records, host_country |  |
| `CarbonMarketsIntelEngine.price_credits` | entity_id, project_type, vintage_year, icvcm_pass, co_benefits, registry |  |
| `CarbonMarketsIntelEngine.analyse_portfolio` | entity_id, credit_portfolio |  |
| `CarbonMarketsIntelEngine.generate_full_assessment` | entity_id, portfolio_data |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-markets-intel/ref/corsia-schemes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/carbon-markets-intel/ref/icvcm-ccps** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/carbon-markets-intel/ref/price-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/carbon-markets-intel/ref/vcmi-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/carbon-markets-intel/article6** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `carbon_markets_intel_engine` — extracted transformation lines:**
```python
pass_rate = pass_votes / max(len(credit_portfolio), 1)
score = round(pass_rate * 100, 1)
overall_pass_rate = round(passing_credits / max(total_credits, 1) * 100, 1)
total_volume = eligible_volume + ineligible_volume
eligible_pct = round(eligible_volume / max(total_volume, 1) * 100, 1)
itmo_volume = art62_volume + art64_volume
vintage_age = current_year - vintage_year
vintage_discount = round(min(0.40, vintage_age * 0.025), 3)
price_after_vintage = base_price * (1 - vintage_discount)
additionality_premium = round(base_price * premium_rate, 2)
total_price = round((price_after_vintage + additionality_premium + co_benefit_premium) * registry_adj, 2)
avg_price = round(total_value / max(total_volume, 1), 2)
d[k] = round(d[k] / max(total_volume, 1) * 100, 1)
vintage_dist[k] = round(vintage_dist[k] / max(total_volume, 1) * 100, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).