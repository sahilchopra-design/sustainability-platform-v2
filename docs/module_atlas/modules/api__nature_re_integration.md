# Api::Nature_Re_Integration
**Module ID:** `api::nature_re_integration` · **Route:** `/api/v1/nature-re` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/nature-re/assess` | `assess_nature_re` | api/v1/routes/nature_re_integration.py |
| POST | `/api/v1/nature-re/portfolio` | `assess_portfolio_nature_re` | api/v1/routes/nature_re_integration.py |
| GET | `/api/v1/nature-re/ref/haircut-table` | `ref_nature_haircut` | api/v1/routes/nature_re_integration.py |
| GET | `/api/v1/nature-re/ref/water-noi` | `ref_water_noi` | api/v1/routes/nature_re_integration.py |
| GET | `/api/v1/nature-re/ref/bio-cap-rate` | `ref_bio_cap_rate` | api/v1/routes/nature_re_integration.py |
| GET | `/api/v1/nature-re/ref/bng-costs` | `ref_bng_costs` | api/v1/routes/nature_re_integration.py |
| GET | `/api/v1/nature-re/ref/eu-tax-dnsh` | `ref_eu_tax_dnsh` | api/v1/routes/nature_re_integration.py |

### 2.3 Engine `nature_re_integration_engine` (services/nature_re_integration_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `NatureREIntegrationEngine._nature_score_to_band` | score |  |
| `NatureREIntegrationEngine._water_score_to_band` | score |  |
| `NatureREIntegrationEngine.assess_nature_adjusted_valuation` | inp | Full nature-adjusted RE valuation. |
| `NatureREIntegrationEngine.assess_portfolio` | portfolio_id, properties | Assess nature-adjusted valuations across a portfolio. |
| `NatureREIntegrationEngine.get_nature_haircut_table` |  |  |
| `NatureREIntegrationEngine.get_water_noi_adjustments` |  |  |
| `NatureREIntegrationEngine.get_biodiversity_cap_rate_schedule` |  |  |
| `NatureREIntegrationEngine.get_bng_unit_costs` |  |  |
| `NatureREIntegrationEngine.get_eu_taxonomy_nature_dnsh` |  |  |
| `NatureREIntegrationEngine._generate_narrative` | inp, haircut, water_adj, bio_bps, composite, eu_pass |  |
| `NatureREIntegrationEngine._generate_recommendations` | inp, nature_band, water_band, composite |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-re/ref/bio-cap-rate** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['biodiversity_cap_rate_schedule'], 'n_keys': 1}`

**GET /api/v1/nature-re/ref/bng-costs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['bng_unit_costs'], 'n_keys': 1}`

**GET /api/v1/nature-re/ref/eu-tax-dnsh** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['eu_taxonomy_nature_dnsh'], 'n_keys': 1}`

**GET /api/v1/nature-re/ref/haircut-table** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['nature_haircut_table'], 'n_keys': 1}`

**GET /api/v1/nature-re/ref/water-noi** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['water_noi_adjustments'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `nature_re_integration_engine` — extracted transformation lines:**
```python
bng_units = inp.site_area_hectares * 0.10 * (1 + inp.biodiversity_impact_score * 0.1)
bng_capex_eur = round(bng_units * unit_cost * 1.17, 2)  # GBP→EUR approx
adj_noi = inp.noi_eur * (1 + water_noi_adj_pct / 100)
adj_cap_rate = inp.cap_rate_pct + bio_cap_bps / 100
income_based_value = adj_noi / (adj_cap_rate / 100)
nature_adj_value = income_based_value * (1 - nature_haircut_pct / 100)
total_discount = round((1 - nature_adj_value / inp.market_value_eur) * 100, 2)
avg_discount = round((1 - total_adj / total_mv) * 100, 2) if total_mv else 0.0
eu_taxonomy_dnsh_fail_count=len(results) - dnsh_pass,
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).