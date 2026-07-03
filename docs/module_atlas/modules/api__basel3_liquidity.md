# Api::Basel3_Liquidity
**Module ID:** `api::basel3_liquidity` · **Route:** `/api/v1/basel3-liquidity` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/basel3-liquidity/lcr` | `assess_lcr` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/nsfr` | `assess_nsfr` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/alm-gap` | `assess_alm_gap` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/liquidity-stress` | `run_liquidity_stress` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/full-assessment` | `full_assessment` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/hqla-factors` | `ref_hqla_factors` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/hqla-haircuts` | `ref_hqla_haircuts` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/runoff-rates` | `ref_runoff_rates` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/outflow-rates` | `ref_outflow_rates` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/monitoring-tools` | `ref_monitoring_tools` | api/v1/routes/basel3_liquidity.py |
| GET | `/api/v1/basel3-liquidity/ref/rate-shocks` | `ref_rate_shocks` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/lcr-assessment` | `lcr_assessment` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/nsfr-assessment` | `nsfr_assessment` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/irrbb-assessment` | `irrbb_assessment` | api/v1/routes/basel3_liquidity.py |
| POST | `/api/v1/basel3-liquidity/stress-test` | `stress_test` | api/v1/routes/basel3_liquidity.py |

### 2.3 Engine `basel3_liquidity_engine` (services/basel3_liquidity_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `Basel3LiquidityEngine.assess_lcr` | entity_id, hqla_l1, hqla_l2a, hqla_l2b, gross_outflow, gross_inflow | Compute Liquidity Coverage Ratio with optional climate haircut overlay. |
| `Basel3LiquidityEngine.assess_nsfr` | entity_id, asf_breakdown, rsf_breakdown | Compute Net Stable Funding Ratio from ASF/RSF component breakdown. |
| `Basel3LiquidityEngine.assess_alm_gap` | entity_id, time_buckets | ALM maturity gap analysis and IRRBB (EVE + NII) sensitivity. |
| `Basel3LiquidityEngine.run_liquidity_stress` | entity_id, base_lcr, base_nsfr, scenario_id, deposit_base_mn, wholesale_base_mn | Idiosyncratic + market-wide liquidity stress scenario. |
| `Basel3LiquidityEngine.full_assessment` | entity_id, entity_name, reporting_date, scenario_id, hqla_l1, hqla_l2a | Full Basel III liquidity risk assessment combining LCR, NSFR, ALM, and stress. |
| `Basel3LiquidityEngine.get_hqla_factors` |  |  |
| `Basel3LiquidityEngine.get_runoff_rates` |  |  |
| `Basel3LiquidityEngine.get_asf_rsf_factors` |  |  |
| `Basel3LiquidityEngine.get_eba_shocks` |  |  |
| `Basel3LiquidityEngine.get_monitoring_tools` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Available`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/basel3-liquidity/ref/hqla-factors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['hqla_haircuts'], 'n_keys': 1}`

**GET /api/v1/basel3-liquidity/ref/hqla-haircuts** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['hqla_haircuts'], 'n_keys': 1}`

**GET /api/v1/basel3-liquidity/ref/monitoring-tools** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['bcbs238_monitoring_tools'], 'n_keys': 1}`

**GET /api/v1/basel3-liquidity/ref/outflow-rates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['outflow_rates'], 'n_keys': 1}`

**GET /api/v1/basel3-liquidity/ref/rate-shocks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['rate_shocks_bps'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `basel3_liquidity_engine` — extracted transformation lines:**
```python
l1_adj = hqla_l1 * (1.0 - 0.00)
l2a_adj = hqla_l2a * (1.0 - 0.15)
l2b_adj = hqla_l2b * (1.0 - 0.50)
total_stock_uncapped = l1_adj + l2a_adj + l2b_adj
l2_total = l2a_adj + l2b_adj
l2_pct = l2_total / total_stock_uncapped * 100
l2b_pct = l2b_adj / total_stock_uncapped * 100
max_l2 = l1_adj * (L2_CAP_PCT / (100.0 - L2_CAP_PCT))
max_l2b = total_stock_uncapped * L2B_CAP_PCT / 100.0
l2_total = l2a_adj + l2b_adj
hqla_stock = l1_adj + l2_total
capped_inflow = min(gross_inflow, gross_outflow * 0.75)
net_outflow = max(0.0, gross_outflow - capped_inflow)
lcr_pct = (hqla_stock / net_outflow * 100.0) if net_outflow > 0 else 999.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).