# Api::Validation_Summary
**Module ID:** `api::validation_summary` · **Route:** `/api/v1/validation` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/validation/methodology-registry` | `methodology_registry` | api/v1/routes/validation_summary.py |
| GET | `/api/v1/validation/dqs-map` | `dqs_confidence_map` | api/v1/routes/validation_summary.py |
| POST | `/api/v1/validation/wrap` | `wrap_result` | api/v1/routes/validation_summary.py |

### 2.3 Engine `validation_summary_engine` (services/validation_summary_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `compute_confidence` | data_quality_flags, dqs_scores, input_completeness_pct, methodology_maturity | Compute 0-1 confidence score based on: |
| `ValidationSummaryEngine.wrap` | result, meta, user_id | Wrap a raw engine result dict with a validation_summary envelope. |
| `ValidationSummaryEngine.get_methodology_registry` |  | Return the full methodology registry for documentation/UI display. |
| `ValidationSummaryEngine.get_dqs_confidence_map` |  | Return PCAF DQS → confidence mapping. |
| `ValidationSummaryEngine.batch_wrap` | results, metas, user_id | Wrap multiple results in a single batch (e.g., portfolio-level). |
| `quick_wrap` | engine_name, result, inputs, params, flags, user_id | Shortcut for engines that want minimal integration effort. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/validation/dqs-map** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [1, 2, 3, 4, 5], 'n_keys': 5}`

**GET /api/v1/validation/methodology-registry** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['carbon_calculator', 'carbon_calculator_v2', 'cbam_calculator', 'ecl_climate_engine', 're_clvar_engine', 'crrem_stranding_engine', 'epc_transition_engine', 'green_premium_engine', 'real_estate`

**POST /api/v1/validation/wrap** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `validation_summary_engine` — extracted transformation lines:**
```python
flag_penalty = len(data_quality_flags) * 0.05
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).