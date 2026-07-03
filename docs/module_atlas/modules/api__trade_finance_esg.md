# Api::Trade_Finance_Esg
**Module ID:** `api::trade_finance_esg` · **Route:** `/api/v1/trade-finance-esg` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/trade-finance-esg/equator-principles` | `post_equator_principles` | api/v1/routes/trade_finance_esg.py |
| POST | `/api/v1/trade-finance-esg/eca-standards` | `post_eca_standards` | api/v1/routes/trade_finance_esg.py |
| POST | `/api/v1/trade-finance-esg/supply-chain-esg` | `post_supply_chain_esg` | api/v1/routes/trade_finance_esg.py |
| POST | `/api/v1/trade-finance-esg/green-instrument` | `post_green_instrument` | api/v1/routes/trade_finance_esg.py |
| GET | `/api/v1/trade-finance-esg/ref/ep4-categories` | `get_ep4_categories` | api/v1/routes/trade_finance_esg.py |
| GET | `/api/v1/trade-finance-esg/ref/oecd-arrangement` | `get_oecd_arrangement` | api/v1/routes/trade_finance_esg.py |
| GET | `/api/v1/trade-finance-esg/ref/esg-tiers` | `get_esg_tiers` | api/v1/routes/trade_finance_esg.py |
| GET | `/api/v1/trade-finance-esg/ref/emission-factors` | `get_emission_factors` | api/v1/routes/trade_finance_esg.py |
| GET | `/api/v1/trade-finance-esg/ref/green-instruments` | `get_green_instruments` | api/v1/routes/trade_finance_esg.py |

### 2.3 Engine `trade_finance_engine` (services/trade_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | v, lo, hi |  |
| `_assign_ep_category` | project_type, country, project_cost_usd | Assign EP category A/B/C based on project characteristics. |
| `_esg_tier_from_score` | score |  |
| `_discount_bps_from_score` | score, tier | Locate the dynamic-discounting margin within the tier's reference band. |
| `assess_equator_principles` | entity_id, project_type, project_cost_usd, country, sector, principle_assessments | Assess Equator Principles v4 compliance. |
| `evaluate_eca_standards` | entity_id, export_credit_type, oecd_sector, country, climate_compatibility_score | Evaluate ECA standards under OECD Arrangement on export credits. |
| `score_supply_chain_esg` | entity_id, suppliers, product_category | Score supplier ESG tiers and model dynamic discounting ratchet. |
| `calculate_trade_flow_emissions` | entity_id, trade_lanes, commodity_type, volume_tonnes, grid_intensity_factors | Calculate GHG emissions for trade flows. |
| `generate_green_instrument` | entity_id, instrument_type, use_of_proceeds, counterparty_country, stf_principle_scores, esg_performance_score | Generate green trade finance instrument assessment. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Jan` *(shared)*, `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/trade-finance-esg/ref/emission-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['transport_emission_factors', 'product_ghg_intensity_kgco2e_per_tonne', 'scope3_categories', 'standard'], 'n_keys': 4}`

**GET /api/v1/trade-finance-esg/ref/ep4-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ep4_categories', 'ep4_principles', 'high_risk_country_count', 'note'], 'n_keys': 4}`

**GET /api/v1/trade-finance-esg/ref/esg-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esg_tiers', 'icc_stf_principles', 'ilo_core_standards'], 'n_keys': 3}`

**GET /api/v1/trade-finance-esg/ref/green-instruments** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['green_instruments', 'icc_stf_principles_2022', 'icma_categories'], 'n_keys': 3}`

**GET /api/v1/trade-finance-esg/ref/oecd-arrangement** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['oecd_arrangement_sectors', 'version', 'climate_key_events', 'crc_scale'], 'n_keys': 4}`

## 5 · Intermediate Transformation Logic

**Engine `trade_finance_engine` — extracted transformation lines:**
```python
span = hi_score - lo_score
pos = 0.0 if span <= 0 else _clamp((hi_score - score) / span, 0.0, 1.0)
crc_premium_adj = round(crc_country * 0.05, 3)
total_premium_pct = round(base_premium_pct + crc_premium_adj, 3)
annual_cost_per_100m = round(total_premium_pct * 1_000_000, 0)
proxy_volume_tonnes = spend / max(product_ghg * 0.5, 1.0)
total_scope3_cat1 = None  # portfolio total is incomplete if any supplier lacks spend/revenue
cat1_tco2e = lane_volume * product_ghg * grid_intensity_factor / 1000.0
pricing_benefit_bps = round(bps_lo + (perf / 100.0) * (bps_hi - bps_lo), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).