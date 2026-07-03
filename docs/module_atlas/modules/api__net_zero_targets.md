# Api::Net_Zero_Targets
**Module ID:** `api::net_zero_targets` · **Route:** `/api/v1/net-zero-targets` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/net-zero-targets/assess` | `run_full_assessment` | api/v1/routes/net_zero_targets.py |
| POST | `/api/v1/net-zero-targets/temperature-score` | `calculate_temperature_score` | api/v1/routes/net_zero_targets.py |
| GET | `/api/v1/net-zero-targets/assessments/{entity_id}` | `list_assessments` | api/v1/routes/net_zero_targets.py |
| GET | `/api/v1/net-zero-targets/assessment/{assessment_id}` | `get_assessment` | api/v1/routes/net_zero_targets.py |
| GET | `/api/v1/net-zero-targets/ref/frameworks` | `get_frameworks` | api/v1/routes/net_zero_targets.py |
| GET | `/api/v1/net-zero-targets/ref/pathways` | `get_pathways` | api/v1/routes/net_zero_targets.py |
| GET | `/api/v1/net-zero-targets/ref/sector-pathways` | `get_sector_pathways` | api/v1/routes/net_zero_targets.py |

### 2.3 Engine `net_zero_targets_engine` (services/net_zero_targets_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `NetZeroTargetsEngine._derive_temperature_score` | reduction_pct_2030 |  |
| `NetZeroTargetsEngine._derive_pathway` | reduction_pct_near |  |
| `NetZeroTargetsEngine._derive_validation_status` | cfg, validation_issues, supplied_status | Deterministic SBTi commitment-lifecycle stage. |
| `NetZeroTargetsEngine.assess_targets` | entity_id, entity_type, framework, base_year, base_year_emissions, scope1 | Validate targets and derive pathway classification. |
| `NetZeroTargetsEngine.generate_pathway` | entity_id, assessment_id, base_year, base_emissions, net_zero_year, reduction_pct_2030 | Generate year-by-year decarbonisation pathway records. |
| `NetZeroTargetsEngine.calculate_temperature_score` | entity_id, scope1, scope2, scope3, reduction_targets, portfolio_coverage_pct | Calculate implied portfolio/entity temperature score. |
| `NetZeroTargetsEngine.check_framework_compliance` | entity_id, entity_type, framework, assessment_data | Check detailed compliance against a specific framework. |
| `NetZeroTargetsEngine.run_full_assessment` | entity_id, entity_type, framework | Orchestrate full assessment including pathway generation. |
| `NetZeroTargetsEngine.get_reference_data` |  | Return all reference constants. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `SET` *(shared)*, `fastapi` *(shared)*, `net_zero_pathway_records`, `net_zero_target_assessments`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/net-zero-targets/assessment/{assessment_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/net-zero-targets/assessments/{entity_id}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/net-zero-targets/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks'], 'n_keys': 1}`

**GET /api/v1/net-zero-targets/ref/pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pathways'], 'n_keys': 1}`

**GET /api/v1/net-zero-targets/ref/sector-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_pathways'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `net_zero_targets_engine` — extracted transformation lines:**
```python
years = list(range(base_year + 5, net_zero_year + 1, 5))
total_years = max(1, net_zero_year - base_year)
frac = (yr - base_year) / max(1, 2030 - base_year)
required_reduction = reduction_pct_2030 * frac
frac = (yr - 2030) / max(1, net_zero_year - 2030)
required_reduction = reduction_pct_2030 + (reduction_pct_2050 - reduction_pct_2030) * frac
required_emissions = base_emissions * (1 - required_reduction / 100)
gap = projected_emissions - required_emissions
total_emissions = scope1 + scope2 + scope3
scope3_share = (scope3 / total_emissions * 100) if total_emissions > 0 else 0
compliance_pct = max(0, 100 - len(gaps) * 20 - len(warnings) * 5)
s3 = max(0.0, base_emissions - s1 - s2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).