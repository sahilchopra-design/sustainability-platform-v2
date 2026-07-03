# Api::Carbon_Price_Ets
**Module ID:** `api::carbon_price_ets` · **Route:** `/api/v1/carbon-price-ets` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/carbon-price-ets/ets-compliance` | `ets_compliance_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/eu-ets-forecast` | `eu_ets_forecast_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/cbam-exposure` | `cbam_exposure_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/portfolio-carbon-cost` | `portfolio_carbon_cost_endpoint` | api/v1/routes/carbon_price_ets.py |
| POST | `/api/v1/carbon-price-ets/price-pathway` | `price_pathway_endpoint` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/ets-systems` | `ref_ets_systems` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/iea-pathways` | `ref_iea_pathways` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/cbam-sectors` | `ref_cbam_sectors` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/leakage-risk` | `ref_leakage_risk` | api/v1/routes/carbon_price_ets.py |
| GET | `/api/v1/carbon-price-ets/ref/china-ets-sectors` | `ref_china_ets_sectors` | api/v1/routes/carbon_price_ets.py |

### 2.3 Engine `carbon_price_ets_engine` (services/carbon_price_ets_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `forecast_eu_ets_price` | horizon_years, scenario, entity_id | Forecast EU ETS price path using LRF, MSR dynamics, and supply/demand fundamentals. |
| `calculate_ets_compliance_cost` | entity_data | Calculate compliance cost across all 6 ETS systems for a given entity. |
| `assess_cbam_exposure` | trade_data | Assess CBAM certificate liability and competitiveness impact for a trade flow. |
| `calculate_portfolio_carbon_cost` | portfolio | Calculate sector-weighted carbon cost, transition risk, and stranding probability. |
| `forecast_carbon_price_pathway` | scenario, horizon, economy_type, entity_id | Interpolate the published IEA WEO carbon price pathway with scenario uncertainty bands. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/carbon-price-ets/ref/cbam-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sectors', 'total_sectors', 'cbam_scope_extension_review', 'regulation', 'implementing_regulation', 'certificate_registry', 'total_import_coverage_bn_eur', 'phase4_params'], 'n_keys': 8}`

**GET /api/v1/carbon-price-ets/ref/china-ets-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sectors', 'total_sectors', 'total_covered_mt_co2', 'current_phase', 'methodology', 'current_price_cny', 'current_price_usd', 'regulator', 'mrvp_reference', 'source'], 'n_keys': 10}`

**GET /api/v1/carbon-price-ets/ref/ets-systems** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ets_systems', 'total_systems', 'global_ets_coverage_pct_ghg', 'total_jurisdictions_with_carbon_pricing', 'global_carbon_revenue_2023_bn_usd', 'source', 'note'], 'n_keys': 7}`

**GET /api/v1/carbon-price-ets/ref/iea-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pathways', 'scenarios', 'economy_types', 'source', 'update_frequency'], 'n_keys': 5}`

**GET /api/v1/carbon-price-ets/ref/leakage-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sectors', 'total_sectors', 'methodology', 'high_leakage_threshold', 'cbam_covered_sectors', 'non_cbam_leakage_sectors', 'policy_reference'], 'n_keys': 7}`

## 5 · Intermediate Transformation Logic

**Engine `carbon_price_ets_engine` — extracted transformation lines:**
```python
lrf_effect = price * lrf * scenario_mult
msr_effect = msr_tightening if yr <= 2030 else msr_tightening * 0.5
price = price + lrf_effect + msr_effect
uncertainty = price * uncertainty_frac
ci_low[yr] = round(price - uncertainty, 2)
ci_high[yr] = round(price + uncertainty, 2)
msr_impact_eur=round(msr_tightening * horizon_years, 2),
lrf_impact_eur=round(base_price * lrf * horizon_years * scenario_mult, 2),
eu_allocation = annual_emissions * max(0.0, min(1.0, float(free_alloc_pct)))
eu_shortfall = max(0.0, annual_emissions - eu_allocation)
eu_cost_eur = eu_shortfall * eu_price
uk_exposed = (float(uk_pct) if uk_pct is not None else 0.0) * annual_emissions
uk_cost_gbp = uk_exposed * uk_price * 0.78  # USD to GBP
ca_exposed = (float(ca_pct) if ca_pct is not None else 0.0) * annual_emissions
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).