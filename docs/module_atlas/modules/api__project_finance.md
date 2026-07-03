# Api::Project_Finance
**Module ID:** `api::project_finance` · **Route:** `/api/v1/project-finance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/project-finance/save` | `save_project_finance` | api/v1/routes/project_finance.py |
| GET | `/api/v1/project-finance/{power_plant_id}` | `get_project_finance` | api/v1/routes/project_finance.py |

### 2.3 Engine `project_finance_engine` (services/project_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_to_dec` | v |  |
| `_npv` | rate, cash_flows | Calculate Net Present Value of a cash flow series. |
| `_irr` | cash_flows, guess, iterations | Newton-Raphson IRR solver on Decimal cash flows. |
| `_annuity_payment` | principal, rate, n | Standard annuity formula: P * r / (1 - (1+r)^-n) |
| `ProjectFinanceEngine.calculate` | inputs |  |
| `ProjectFinanceEngine._run_calculation` | inp |  |
| `ProjectFinanceEngine._build_cashflows` | inp, debt_amount, equity_amount, annual_ds, depreciation, capacity_factor |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `mock-sample`

**Database tables:** `__future__` *(shared)*, `decimal` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `schemas` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/project-finance/demo/sample** — status `passed`, provenance ['mock-sample'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_name', 'inputs_summary', 'year_by_year', 'dscr_by_year', 'min_dscr', 'avg_dscr', 'llcr', 'plcr', 'equity_irr_pct', 'dsra_recommendation_months', 'is_bankable', 'total_debt_usd', 'total_`

**GET /api/v1/project-finance/{power_plant_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/project-finance/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/project-finance/save** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `project_finance_engine` — extracted transformation lines:**
```python
denom = (1 + rate) ** t
rate = rate - npv / dnpv
factor = rate / (1 - (1 + rate) ** (-n))
interest_rate = inp.interest_rate_pct / 100
discount_rate = inp.discount_rate_pct / 100
tax_rate = inp.tax_rate_pct / 100
escalation = inp.price_escalation_pct / 100
opex_esc = inp.opex_escalation_pct / 100
project_life = inp.project_life_years or (inp.loan_tenor_years + 5)
grace_years = Decimal(str(inp.grace_period_months)) / 12
amort_years = inp.loan_tenor_years - int(inp.grace_period_months / 12)
base_equity_irr = _irr([-equity_amount] + base_equity_cfs)
stress_equity_irr = _irr([-equity_amount] + stress_equity_cfs)
no_etc_irr = _irr([-equity_amount] + no_etc_equity)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).