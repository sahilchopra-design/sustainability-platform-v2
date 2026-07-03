# Api::Entity360
**Module ID:** `api::entity360` · **Route:** `/api/v1/entity360` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/entity360/profile` | `entity360_profile` | api/v1/routes/entity360.py |
| POST | `/api/v1/entity360/counterparty-master` | `counterparty_master` | api/v1/routes/entity360.py |
| GET | `/api/v1/entity360/ref/module-registry` | `ref_module_registry` | api/v1/routes/entity360.py |
| GET | `/api/v1/entity360/ref/entity-types` | `ref_entity_types` | api/v1/routes/entity360.py |
| GET | `/api/v1/entity360/ref/sectors` | `ref_sectors` | api/v1/routes/entity360.py |
| GET | `/api/v1/entity360/by-lei/{lei}` | `entity360_by_lei` | api/v1/routes/entity360.py |

### 2.3 Engine `entity360_engine` (services/entity360_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `Entity360Engine.build_profile` | entity_name, entity_id, entity_type, sector, reporting_year, module_data | Build a 360 profile from module outputs. |
| `Entity360Engine._build_risk_profile` | module_data | Aggregate risk scores across modules. |
| `Entity360Engine._build_esg_profile` | module_data | Build ESG summary from module outputs. |
| `Entity360Engine._assess_regulatory` | module_data | Assess regulatory framework status. |
| `Entity360Engine._generate_recommendations` | module_data, gaps, risk | Generate actionable recommendations. |
| `Entity360Engine.build_counterparty_master` | counterparties | Build a counterparty master from input records. |
| `Entity360Engine.get_module_registry` |  |  |
| `Entity360Engine.get_entity_types` |  |  |
| `Entity360Engine.get_sectors` |  |  |

### 2.3 Engine `entity_resolution_service` (services/entity_resolution_service.py)
| Function | Args | Purpose |
|---|---|---|
| `normalise_name` | name | Lowercase, strip legal suffixes, collapse whitespace. |
| `fuzzy_score` | a, b | SequenceMatcher ratio on normalised names. |
| `EntityResolutionService.resolve_entity` | lei, name, isin | Find all records across modules that match the given identifiers. |
| `EntityResolutionService.build_entity_graph` | lei | Gather all cross-module data for an entity identified by LEI. |
| `EntityResolutionService.link_to_company_profile` | lei, name | Find or create a company_profiles record for the given LEI. |
| `EntityResolutionService.auto_link_unlinked` |  | Background job: scan all sector entity tables for records with LEI |
| `EntityResolutionService.bulk_resolve` | records | Resolve a batch of records. Each dict may contain optional keys: |
| `EntityResolutionService._find_by_lei` | lei |  |
| `EntityResolutionService._find_by_isin` | isin |  |
| `EntityResolutionService._find_by_fuzzy_name` | name | Scan entity master tables for names that fuzzy-match above threshold. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `DB` *(shared)*, `__future__` *(shared)*, `all` *(shared)*, `assessments`, `db` *(shared)*, `fastapi` *(shared)*, `investees`, `module` *(shared)*, `module_data`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/entity360/by-lei/{lei}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**GET /api/v1/entity360/ref/entity-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 7, 'item0_keys': ['id', 'label']}`

**GET /api/v1/entity360/ref/module-registry** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['carbon_calculator', 'climate_risk', 'ecl_calculator', 'pcaf_calculator', 'nature_risk', 'taxonomy_alignment', 'scenario_analysis', 'sfdr_pai', 'real_estate', 'supply_chain'], 'n_keys': 10}`

**GET /api/v1/entity360/ref/sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['energy', 'financials', 'industrials', 'technology', 'healthcare', 'consumer', 'real_estate', 'materials', 'transport', 'agriculture', 'utilities', 'telecom'], 'n_keys': 12}`

**POST /api/v1/entity360/counterparty-master** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `entity360_engine` — extracted transformation lines:**
```python
completeness = (modules_available / total_modules * 100) if total_modules > 0 else 0
credit_score = min(credit_score * 1000, 100)  # PD to 0-100 scale
reg_risk = (100 - tax_aligned) if tax_aligned is not None else None
composite = sum(s * w for s, w in zip(scores, weights)) / total_w
avg_quality = sum(r.data_quality_score for r in records) / len(records) if records else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).

| Connected module | Shared via |
|---|---|
| `api::entity_resolution` | engine:entity_resolution_service |