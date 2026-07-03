# Api::Basel_Capital
**Module ID:** `api::basel_capital` · **Route:** `/api/v1/basel-capital` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/basel-capital/risk-weight-sa` | `risk_weight_sa` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/risk-weight-irb` | `risk_weight_irb` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/capital-requirement` | `capital_requirement` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/liquidity` | `liquidity` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/capital-adequacy` | `capital_adequacy` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/exposure-classes` | `ref_exposure_classes` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/sa-risk-weights` | `ref_sa_risk_weights` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/irb-parameters` | `ref_irb_parameters` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/capital-requirements` | `ref_capital_requirements` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/capital-buffers` | `ref_capital_buffers` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/lcr-parameters` | `ref_lcr_parameters` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/nsfr-parameters` | `ref_nsfr_parameters` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/climate-adjustments` | `ref_climate_adjustments` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/regulatory-frameworks` | `ref_regulatory_frameworks` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/operational-risk` | `ref_operational_risk` | api/v1/routes/basel_capital.py |

### 2.3 Engine `basel_capital_engine` (services/basel_capital_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_norm_cdf` | x | Standard normal cumulative distribution function using math.erf. |
| `_norm_inv` | p | Inverse standard normal CDF (quantile function). |
| `BaselCapitalEngine.calculate_sa_risk_weight` | exposure_class, credit_quality_step, secured_by_property | Return SA risk weight as decimal for a given exposure class and CQS. |
| `BaselCapitalEngine.calculate_irb_risk_weight` | pd, lgd, maturity, exposure_class | Calculate IRB risk weight per CRR Article 153 (corporate formula). |
| `BaselCapitalEngine._irb_retail_rw` | pd, lgd, subclass | IRB risk weight for retail exposures (CRR Art 154), routed by sub-class: |
| `BaselCapitalEngine.calculate_operational_risk_rwa` | business_indicator, average_annual_losses | Calculate operational risk RWA using the Standardised Measurement Approach. |
| `BaselCapitalEngine.calculate_capital_requirement` | entity_name, reporting_date, exposures, capital, approach, climate_adjusted | Calculate full capital adequacy per CRR Article 92. |
| `BaselCapitalEngine.calculate_liquidity` | entity_name, reporting_date, assets, liabilities | Calculate LCR and NSFR per BCBS d295/d396. |
| `BaselCapitalEngine.run_capital_adequacy` | entity_name, reporting_date, exposures, capital, assets, liabilities | Run full capital adequacy assessment: credit + liquidity + climate stress. |
| `BaselCapitalEngine._score_bcbs239` | exposures, capital, assets, liabilities | Score BCBS 239 compliance (0-100) based on data completeness. |
| `BaselCapitalEngine._generate_pillar2_recommendations` | cap, liq, climate | Generate Pillar 2 supervisory recommendations. |
| `BaselCapitalEngine._determine_rag_status` | cap, liq | Determine overall RAG status. |
| `BaselCapitalEngine.get_exposure_classes` |  | Return CRR Article 112 exposure class definitions. |
| `BaselCapitalEngine.get_sa_risk_weights` |  | Return Standardised Approach CQS-to-risk-weight mapping tables. |
| `BaselCapitalEngine.get_irb_parameters` |  | Return IRB formula parameters per CRR Article 153. |
| `BaselCapitalEngine.get_capital_requirements` |  | Return minimum capital ratio requirements per CRR Article 92. |
| `BaselCapitalEngine.get_capital_buffers` |  | Return capital buffer requirements per CRD V. |
| `BaselCapitalEngine.get_lcr_parameters` |  | Return LCR parameters per BCBS d295 / CRR Art. 412. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/basel-capital/ref/capital-buffers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['capital_buffers'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/capital-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['capital_requirements'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/climate-adjustments** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['climate_adjustments'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/exposure-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['exposure_classes'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/irb-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['irb_parameters'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `basel_capital_engine` — extracted transformation lines:**
```python
a1 = -3.969683028665376e+01
a2 = 2.209460984245205e+02
a3 = -2.759285104469687e+02
a4 = 1.383577518672690e+02
a5 = -3.066479806614716e+01
a6 = 2.506628277459239e+00
b1 = -5.447609879822406e+01
b2 = 1.615858368580409e+02
b3 = -1.556989798598866e+02
b4 = 6.680131188771972e+01
b5 = -1.328068155288572e+01
c1 = -7.784894002430293e-03
c2 = -3.223964580411365e-01
c3 = -2.400758277161838e+00
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).