# Api::Scope3_Categories
**Module ID:** `api::scope3_categories` · **Route:** `/api/v1/scope3-categories` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/scope3-categories/assess` | `assess` | api/v1/routes/scope3_categories.py |
| POST | `/api/v1/scope3-categories/materiality-screen` | `materiality_screen` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/categories` | `ref_categories` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/calculation-methods` | `ref_calculation_methods` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/sbti-coverage-rule` | `ref_sbti_coverage_rule` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/pcaf-c15` | `ref_pcaf_c15` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/flag-sectors` | `ref_flag_sectors` | api/v1/routes/scope3_categories.py |
| GET | `/api/v1/scope3-categories/ref/ghg-protocol-scope3` | `ref_ghg_protocol_scope3` | api/v1/routes/scope3_categories.py |

### 2.3 Engine `scope3_categories_engine` (services/scope3_categories_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `Scope3CategoriesEngine.assess` | entity_id, entity_name, nace_code, revenue_bn, headcount, sector_type |  |
| `Scope3CategoriesEngine.screen_materiality` | nace_code, revenue_bn, sector_shares | Quick materiality screen before full assessment. |
| `Scope3CategoriesEngine.ref_categories` |  |  |
| `Scope3CategoriesEngine.ref_calculation_methods` |  |  |
| `Scope3CategoriesEngine.ref_sbti_coverage_rule` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/scope3-categories/ref/calculation-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['spend_based', 'average_data', 'supplier_specific', 'hybrid', 'pcaf_standard'], 'n_keys': 5}`

**GET /api/v1/scope3-categories/ref/categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15'], 'n_keys': 15}`

**GET /api/v1/scope3-categories/ref/flag-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['flag_sectors', 'note', 'coverage_rule'], 'n_keys': 3}`

**GET /api/v1/scope3-categories/ref/ghg-protocol-scope3** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['standard', 'categories', 'upstream', 'downstream', 'mandatory_for_sbti'], 'n_keys': 5}`

**GET /api/v1/scope3-categories/ref/pcaf-c15** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['category', 'name', 'standard', 'asset_classes', 'attribution_formula', 'dqs_range'], 'n_keys': 6}`

## 5 · Intermediate Transformation Logic

**Engine `scope3_categories_engine` — extracted transformation lines:**
```python
total = revenue_bn * 1_000 * float(scope3_intensity_tco2e_per_eur_m)
tco2e = round(total * fraction, 0) if total is not None else None
pct_of_total=round(fraction * 100, 1),
result.sbti_coverage_pct = round(material_tco2e / total * 100, 1)
result.meets_40pct_rule = result.sbti_coverage_pct >= (COVERAGE_THRESHOLD * 100)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).