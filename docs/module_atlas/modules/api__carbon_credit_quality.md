# Api::Carbon_Credit_Quality
**Module ID:** `api::carbon_credit_quality` · **Route:** `/api/v1/carbon-credit-quality` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/carbon-credit-quality/score-project` | `score_project` | api/v1/routes/carbon_credit_quality.py |
| POST | `/api/v1/carbon-credit-quality/score-portfolio` | `score_portfolio` | api/v1/routes/carbon_credit_quality.py |
| POST | `/api/v1/carbon-credit-quality/check-ccp-eligibility` | `check_ccp_eligibility` | api/v1/routes/carbon_credit_quality.py |
| GET | `/api/v1/carbon-credit-quality/ref/standards` | `ref_standards` | api/v1/routes/carbon_credit_quality.py |
| GET | `/api/v1/carbon-credit-quality/ref/icvcm-criteria` | `ref_icvcm_criteria` | api/v1/routes/carbon_credit_quality.py |
| GET | `/api/v1/carbon-credit-quality/ref/methodologies` | `ref_methodologies` | api/v1/routes/carbon_credit_quality.py |
| GET | `/api/v1/carbon-credit-quality/ref/corsia-eligibility` | `ref_corsia_eligibility` | api/v1/routes/carbon_credit_quality.py |
| GET | `/api/v1/carbon-credit-quality/ref/price-benchmarks` | `ref_price_benchmarks` | api/v1/routes/carbon_credit_quality.py |

### 2.3 Engine `carbon_credit_quality_engine` (services/carbon_credit_quality_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CarbonCreditQualityEngine.get_instance` |  |  |
| `CarbonCreditQualityEngine.check_ccp_eligibility` | standard, methodology, project_type |  |
| `CarbonCreditQualityEngine.score_project` | entity_id, project_id, project_name, standard, methodology, project_type |  |
| `CarbonCreditQualityEngine.score_portfolio` | entity_id, portfolio |  |
| `CarbonCreditQualityEngine.ref_standards` |  |  |
| `CarbonCreditQualityEngine.ref_icvcm_criteria` |  |  |
| `CarbonCreditQualityEngine.ref_methodologies` |  |  |
| `CarbonCreditQualityEngine.ref_corsia_eligibility` |  |  |
| `CarbonCreditQualityEngine.ref_price_benchmarks` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `dataclasses` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-credit-quality/ref/corsia-eligibility** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['phase_2024_2026', 'ccp_premium'], 'n_keys': 2}`

**GET /api/v1/carbon-credit-quality/ref/icvcm-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 10, 'item0_keys': ['id', 'criterion', 'description', 'assessment_level']}`

**GET /api/v1/carbon-credit-quality/ref/methodologies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['AM0014', 'AR-ACM0003', 'VM0015', 'VM0007', 'AMS-II.G', 'GS_TPDDTEC', 'ACM0002', 'AMS-I.D', 'ACM0001', 'AMS-III.D', 'AMS-II.C', 'VM0042', 'VM0033', 'VM0024', 'ACR_SCA', 'CAR_IFM', 'GS_ICS', 'A`

**GET /api/v1/carbon-credit-quality/ref/price-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['nature_based_removal', 'tech_removal', 'avoidance', 'ccp_label_premium'], 'n_keys': 4}`

**GET /api/v1/carbon-credit-quality/ref/standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['vcs', 'gold_standard', 'cdm', 'art6_itmo', 'ccp', 'plan_vivo', 'american_carbon_registry', 'climate_action_reserve'], 'n_keys': 8}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).