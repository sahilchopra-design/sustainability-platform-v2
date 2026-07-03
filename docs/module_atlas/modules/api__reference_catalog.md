# Api::Reference_Catalog
**Module ID:** `api::reference_catalog` · **Route:** `/api/v1/reference-catalog` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/reference-catalog/` | `catalog` | api/v1/routes/reference_catalog.py |
| GET | `/api/v1/reference-catalog/domains` | `domains` | api/v1/routes/reference_catalog.py |
| GET | `/api/v1/reference-catalog/gaps` | `gaps` | api/v1/routes/reference_catalog.py |
| GET | `/api/v1/reference-catalog/module/{module_id}` | `module_reference_data` | api/v1/routes/reference_catalog.py |
| GET | `/api/v1/reference-catalog/dataset/{data_id}` | `dataset_detail` | api/v1/routes/reference_catalog.py |

### 2.3 Engine `reference_data_catalog` (services/reference_data_catalog.py)
| Function | Args | Purpose |
|---|---|---|
| `ReferenceDataCatalogEngine._build_module_usage` |  | Map each dataset to consuming modules (from lineage signatures). |
| `ReferenceDataCatalogEngine.get_catalog` | domain, include_missing | Get the full reference data catalog. |
| `ReferenceDataCatalogEngine.get_module_reference_data` | module_id | Get reference data used by a specific module. |
| `ReferenceDataCatalogEngine.find_gaps` |  | Identify missing and stale reference datasets. |
| `ReferenceDataCatalogEngine.get_domains` |  | Get all reference data domains. |
| `ReferenceDataCatalogEngine.get_dataset` | data_id | Get a single dataset entry by ID. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/reference-catalog/** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_datasets', 'embedded_count', 'seed_data_count', 'missing_count', 'stale_count', 'coverage_pct', 'entries', 'domains', 'missing_critical', 'recommendations'], 'n_keys': 10}`

**GET /api/v1/reference-catalog/dataset/{data_id}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['error'], 'n_keys': 1}`

**GET /api/v1/reference-catalog/domains** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['emission_factors', 'financial_parameters', 'regulatory', 'sector_benchmarks', 'geographic', 'entity_master', 'insurance', 'agriculture', 'nature'], 'n_keys': 9}`

**GET /api/v1/reference-catalog/gaps** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_missing', 'total_stale', 'gaps', 'remediation_priority', 'estimated_effort'], 'n_keys': 5}`

**GET /api/v1/reference-catalog/module/{module_id}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['module_id', 'reference_data', 'total'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic

**Engine `reference_data_catalog` — extracted transformation lines:**
```python
available = embedded + seed
coverage = (available / total * 100) if total > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).