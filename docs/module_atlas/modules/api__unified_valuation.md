# Api::Unified_Valuation
**Module ID:** `api::unified_valuation` · **Route:** `/api/v1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/valuation/calculate` | `calculate_valuation` | api/v1/routes/unified_valuation.py |
| POST | `/api/v1/valuation/sensitivity` | `run_sensitivity_analysis` | api/v1/routes/unified_valuation.py |
| POST | `/api/v1/valuation/batch` | `batch_valuations` | api/v1/routes/unified_valuation.py |
| GET | `/api/v1/valuation/schema/{asset_class}` | `get_input_schema` | api/v1/routes/unified_valuation.py |
| GET | `/api/v1/valuation/asset-classes` | `list_asset_classes` | api/v1/routes/unified_valuation.py |

### 2.3 Engine `unified_valuation_engine` (services/unified_valuation_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `MarketDefaults.get_commercial_yield` | subtype, country |  |
| `MarketDefaults.get_residential_yield` | subtype, country |  |
| `ESGOverlayEngine.calculate_esg_adjustment` | esg, asset_class, base_value |  |
| `_d` | v | Safe Decimal conversion. |
| `_dcf_pv` | cashflows, discount_rate_pct | Discount a list of annual cashflows to present value. |
| `calc_infrastructure` | inp, country, esg |  |
| `calc_project` | inp, country, esg |  |
| `calc_energy` | inp, country, esg |  |
| `calc_commercial` | inp, country, esg |  |
| `calc_residential` | inp, country, esg |  |
| `calc_agricultural` | inp, country, esg |  |
| `calc_land` | inp, country, esg |  |
| `_reconcile` | method_results | Weighted reconciliation of method results. Returns (value, low, high). |
| `UnifiedValuationEngine._auto_select_methods` | request | Return the standard method set for each asset class. |
| `UnifiedValuationEngine.value` | request |  |
| `run_valuation` | request_dict | Convenience function for API routes. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `inputs`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/valuation/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_classes', 'esg_scenarios', 'valuation_standards'], 'n_keys': 3}`

**GET /api/v1/valuation/schema/{asset_class}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/valuation/batch** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count_requested', 'count_succeeded', 'count_failed', 'portfolio_total_value', 'avg_esg_adjustment_pct', 'results', 'errors'], 'n_keys': 7}`

**POST /api/v1/valuation/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/valuation/sensitivity** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `unified_valuation_engine` — extracted transformation lines:**
```python
rab_value = rab_return / discount_r  # perpetuity approximation
ebitda = inp.annual_revenue - inp.annual_opex
fcf = ebitda - inp.annual_capex
cashflows = [fcf * (1 + g) ** _d(i) for i in range(inp.projection_years)]
tv_pv = terminal_value / (1 + r) ** _d(inp.projection_years)
total_value = pv_cashflows + tv_pv
rev = inp.annual_revenue * inp.ramp_factor
debt = total_investment - equity_investment
rev = annual_revenues[yr - 1]
equity_cf = rev - inp.annual_opex - annual_debt_service
project_value = pv_equity + debt
mid_revenue = annual_revenues[min(inp.revenue_ramp_years, len(annual_revenues) - 1)]
ebitda = mid_revenue - inp.annual_opex
annual_revenue = ppa_revenue + merchant_revenue
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).