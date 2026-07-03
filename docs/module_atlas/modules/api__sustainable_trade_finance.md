# Api::Sustainable_Trade_Finance
**Module ID:** `api::sustainable_trade_finance` · **Route:** `/api/v1/sustainable-trade-finance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sustainable-trade-finance/assess-ep4-compliance` | `post_assess_ep4_compliance` | api/v1/routes/sustainable_trade_finance.py |
| POST | `/api/v1/sustainable-trade-finance/score-eca-green` | `post_score_eca_green_classification` | api/v1/routes/sustainable_trade_finance.py |
| POST | `/api/v1/sustainable-trade-finance/calculate-esg-margin` | `post_calculate_esg_linked_margin` | api/v1/routes/sustainable_trade_finance.py |
| POST | `/api/v1/sustainable-trade-finance/screen-supply-chain` | `post_screen_supply_chain_esg` | api/v1/routes/sustainable_trade_finance.py |
| POST | `/api/v1/sustainable-trade-finance/generate-report` | `post_generate_trade_finance_report` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/ep4-categories` | `get_ep4_categories` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/ifc-performance-standards` | `get_ifc_performance_standards` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/high-risk-sectors` | `get_high_risk_sectors` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/eca-country-risk-ratings` | `get_eca_country_risk_ratings` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/commodity-supply-chain-risks` | `get_commodity_supply_chain_risks` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/icc-stf-principles` | `get_icc_stf_principles` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/oecd-sector-sustainability-standards` | `get_oecd_sector_sustainability_standards` | api/v1/routes/sustainable_trade_finance.py |

### 2.3 Engine `sustainable_trade_finance_engine` (services/sustainable_trade_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_eca_risk_rating` | country |  |
| `assess_ep4_compliance` | entity_id, project_name, sector, country, total_cost_usd, principle_scores | Assess EP4 compliance: category A/B/C, IFC PS 1-8 applicability, |
| `score_eca_green_classification` | entity_id, sector, technology, country, oecd_classification, environmental_review_score | Score ECA green classification: OECD Common Approaches 2016, |
| `calculate_esg_linked_margin` | entity_id, base_margin_bps, kpis, performance_data, icc_principle_scores | Calculate ESG-linked margin: KPI materiality scoring, margin step-up/step-down |
| `screen_supply_chain_esg` | entity_id, commodity, origin_country, tier1_supplier, certifications | Screen supply chain ESG: OECD DD Guidance, EUDR overlay, modern slavery risk |
| `generate_trade_finance_report` | entity_id, portfolio_data | Generate comprehensive sustainable trade finance report: ICC STF Principles (2019), |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `trade_finance_assessments`, `trade_finance_esg_covenants`, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sustainable-trade-finance/ref/commodity-supply-chain-risks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count'], 'n_keys': 3}`

**GET /api/v1/sustainable-trade-finance/ref/eca-country-risk-ratings** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count', 'scale', 'source'], 'n_keys': 5}`

**GET /api/v1/sustainable-trade-finance/ref/ep4-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'source'], 'n_keys': 3}`

**GET /api/v1/sustainable-trade-finance/ref/high-risk-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count', 'note'], 'n_keys': 4}`

**GET /api/v1/sustainable-trade-finance/ref/icc-stf-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'source', 'count'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic

**Engine `sustainable_trade_finance_engine` — extracted transformation lines:**
```python
margin_adjustment = max(-15.0, min(15.0, round(margin_adjustment, 2)))
uk_msa_applicable = True  # Any company with £36M+ turnover supplying UK market
aus_msa_applicable = country_risk >= 3  # Australian entities with $100M+ revenue
rba_score = round(100.0 - (country_risk * 8.0), 1)
rba_score = min(100.0, rba_score + len(certs_verified) * 5.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).