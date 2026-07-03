# Api::Sl_Finance
**Module ID:** `api::sl_finance` · **Route:** `/api/v1/sl-finance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sl-finance/assess` | `assess` | api/v1/routes/sl_finance.py |
| POST | `/api/v1/sl-finance/assess/batch` | `assess_batch` | api/v1/routes/sl_finance.py |
| POST | `/api/v1/sl-finance/validate-kpi` | `validate_kpi` | api/v1/routes/sl_finance.py |
| POST | `/api/v1/sl-finance/calibrate-spt` | `calibrate_spt` | api/v1/routes/sl_finance.py |
| GET | `/api/v1/sl-finance/ref/kpi-library` | `ref_kpi_library` | api/v1/routes/sl_finance.py |
| GET | `/api/v1/sl-finance/ref/icma-components` | `ref_icma_components` | api/v1/routes/sl_finance.py |
| GET | `/api/v1/sl-finance/ref/lma-components` | `ref_lma_components` | api/v1/routes/sl_finance.py |
| GET | `/api/v1/sl-finance/ref/coupon-guidance` | `ref_coupon_guidance` | api/v1/routes/sl_finance.py |

### 2.3 Engine `sl_finance_engine` (services/sl_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `KPIAssessment.dict` |  |  |
| `SLFinanceResult.dict` |  |  |
| `SLFinanceEngine.validate_kpi` | kpi | Assess a single KPI against SMART criteria and SPT trajectory. |
| `SLFinanceEngine._assess_components` | inp, kpi_results | Assess ICMA or LMA principles components. |
| `SLFinanceEngine.assess` | inp | Full SLB/SLL principles compliance assessment. |
| `SLFinanceEngine.calibrate_spt` | kpi_id, baseline, target_pct_improvement, baseline_year, target_year | Calculate target value and ambition assessment for a given SPT. |
| `SLFinanceEngine.get_kpi_library` |  |  |
| `SLFinanceEngine.get_icma_components` |  |  |
| `SLFinanceEngine.get_lma_components` |  |  |
| `SLFinanceEngine.get_cross_framework` |  |  |
| `SLFinanceEngine.get_coupon_guidance` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `KPI`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sl-finance/ref/coupon-guidance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['typical_range_bps', 'max_step_up_bps', 'trigger_mechanism', 'remedy_period', 'use_of_step_up'], 'n_keys': 5}`

**GET /api/v1/sl-finance/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['csrd_esrs', 'sbti', 'tcfd', 'gri', 'eu_taxonomy'], 'n_keys': 5}`

**GET /api/v1/sl-finance/ref/icma-components** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': ['id', 'name', 'description', 'blocking', 'article']}`

**GET /api/v1/sl-finance/ref/kpi-library** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ghg_scope1_2_intensity', 'ghg_scope3_intensity', 'renewable_energy_pct', 'water_intensity', 'waste_recycling_pct', 'women_in_leadership_pct', 'employee_injury_rate', 'supply_chain_sustainabil`

**GET /api/v1/sl-finance/ref/lma-components** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': ['id', 'name', 'description', 'blocking', 'article']}`

## 5 · Intermediate Transformation Logic

**Engine `sl_finance_engine` — extracted transformation lines:**
```python
achieved = (kpi.baseline_value - kpi.current_value) / abs(kpi.baseline_value) * 100
achieved = (kpi.current_value - kpi.baseline_value) / abs(kpi.baseline_value) * 100
on_track = improvement_achieved_pct >= improvement_required_pct * 0.5
score = min(score + 20.0, 100.0)
avg_smart = sum(ka.smart_score for ka in kpi_results) / len(kpi_results)
overall_score = (weighted_sum / total_weight) if total_weight > 0 else 0.0
target_value = baseline * (1 - target_pct_improvement / 100)
target_value = baseline * (1 + target_pct_improvement / 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).