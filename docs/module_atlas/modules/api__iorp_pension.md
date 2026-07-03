# Api::Iorp_Pension
**Module ID:** `api::iorp_pension` · **Route:** `/api/v1/iorp-pension` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/iorp-pension/assess/scenario` | `assess_scenario` | api/v1/routes/iorp_pension.py |
| POST | `/api/v1/iorp-pension/assess/batch` | `assess_batch` | api/v1/routes/iorp_pension.py |
| GET | `/api/v1/iorp-pension/ref/scenarios` | `ref_scenarios` | api/v1/routes/iorp_pension.py |
| GET | `/api/v1/iorp-pension/ref/sfdr-classes` | `ref_sfdr_classes` | api/v1/routes/iorp_pension.py |
| GET | `/api/v1/iorp-pension/ref/frameworks` | `ref_frameworks` | api/v1/routes/iorp_pension.py |
| GET | `/api/v1/iorp-pension/history` | `run_history` | api/v1/routes/iorp_pension.py |

### 2.3 Engine `iorp_pension_engine` (services/iorp_pension_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `IORPPensionEngine.assess` | fund, assessment_date | Run IORP II climate stress test for a pension fund. |
| `IORPPensionEngine._stress_scenario` | fund, sc_id, sc, pre_stress_fr, profile |  |
| `IORPPensionEngine._evaluate_ora` | fund |  |
| `IORPPensionEngine._build_recommendations` | fund, ora_status, blocking_gaps, worst_drop, worst_id |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `DB` *(shared)*, `__future__` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `iorp_ora_results`, `iorp_scenario_results`, `iorp_stress_runs`, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/iorp-pension/history** — status `passed`, provenance ['db-empty'], source tables: `iorp_stress_runs`
Output: `{'type': 'object', 'keys': ['count', 'runs'], 'n_keys': 2}`

**GET /api/v1/iorp-pension/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['primary_directive', 'stress_test', 'related_frameworks'], 'n_keys': 3}`

**GET /api/v1/iorp-pension/ref/fund-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'fund_types'], 'n_keys': 2}`

**GET /api/v1/iorp-pension/ref/ora-checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_items', 'blocking_items', 'items', 'reference'], 'n_keys': 4}`

**GET /api/v1/iorp-pension/ref/scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'framework', 'scenarios'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic

**Engine `iorp_pension_engine` — extracted transformation lines:**
```python
pre_stress_fr = fund.total_assets_eur / max(fund.liabilities_eur, 1.0)
pre_stress_funding_ratio=round(pre_stress_fr * 100, 2),
eq_invested = ta * fund.equity_pct / 100
sov_invested = ta * fund.sovereign_bonds_pct / 100
corp_ig_invested = ta * fund.corp_bonds_ig_pct / 100
corp_hy_invested = ta * fund.corp_bonds_hy_pct / 100
re_invested = ta * fund.real_estate_pct / 100
infra_invested = ta * fund.infrastructure_pct / 100
total_asset_loss = eq_loss + sov_loss + corp_ig_loss + corp_hy_loss + re_loss + infra_loss
stressed_assets = ta - total_asset_loss
duration_impact = -lib * (lib_duration * discount_shift_bps / 10_000)  # + = liability rise
total_liability_change = duration_impact + longevity_shock + inflation_uplift
stressed_liabilities = lib + total_liability_change
post_stress_fr = stressed_assets / max(stressed_liabilities, 1.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).