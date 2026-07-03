# Api::Eu_Gbs
**Module ID:** `api::eu_gbs` · **Route:** `/api/v1/eu-gbs` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eu-gbs/assess/batch` | `assess_batch` | api/v1/routes/eu_gbs.py |
| GET | `/api/v1/eu-gbs/ref/bond-types` | `ref_bond_types` | api/v1/routes/eu_gbs.py |
| GET | `/api/v1/eu-gbs/ref/er-requirements` | `ref_er_requirements` | api/v1/routes/eu_gbs.py |
| GET | `/api/v1/eu-gbs/ref/standards-comparison` | `ref_standards_comparison` | api/v1/routes/eu_gbs.py |

### 2.3 Engine `eu_gbs_engine` (services/eu_gbs_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `EUGBSResult.to_dict` |  |  |
| `EUGBSEngine.assess_issuance` | inp | Full EU GBS compliance assessment for a bond issuance. |
| `EUGBSEngine.generate_factsheet` | inp | Generate a structured GBFS (Green Bond Factsheet) covering all 5 sections |
| `EUGBSEngine.assess_allocation_report` | inp | Post-issuance allocation report compliance check. |
| `EUGBSEngine.assess_impact_report` | inp | Post-issuance impact report compliance check. |
| `EUGBSEngine.compare_standards` |  | Return STANDARDS_COMPARISON with analysis notes. |
| `EUGBSEngine.get_bond_types` |  |  |
| `EUGBSEngine.get_taxonomy_objectives` |  |  |
| `EUGBSEngine.get_er_requirements` |  |  |
| `EUGBSEngine.get_timeline` |  |  |
| `EUGBSEngine._estimate_gbfs_completeness` | inp | Proxy GBFS completeness based on available issuance input fields. |
| `EUGBSEngine._build_priority_actions` | blocking_gaps, warnings, inp |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eu-gbs/ref/bond-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['senior_unsecured', 'covered_bond', 'sovereign', 'high_yield', 'green_loan_linked', 'standard_green_bond'], 'n_keys': 6}`

**GET /api/v1/eu-gbs/ref/er-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['registration', 'independence', 'methodology', 'scope', 'report'], 'n_keys': 5}`

**GET /api/v1/eu-gbs/ref/standards-comparison** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['eugbs', 'icma_gbp', 'climate_bonds_standard', '_analysis'], 'n_keys': 4}`

**GET /api/v1/eu-gbs/ref/taxonomy-objectives** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['CCM', 'CCA', 'WMR', 'CE', 'PPE', 'BIO'], 'n_keys': 6}`

**GET /api/v1/eu-gbs/ref/timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 4, 'item0_keys': ['date', 'event', 'article']}`

## 5 · Intermediate Transformation Logic

**Engine `eu_gbs_engine` — extracted transformation lines:**
```python
tax_score = min(inp.taxonomy_alignment_pct / tax_threshold, 1.0) * 100.0
s1_score = sum(1 for f in s1_fields if f and str(f).strip()) / len(s1_fields)
s2_score = sum(s2_fields) / len(s2_fields)
s4_score = (0.5 * int(inp.has_external_reviewer)) + (0.5 * int(inp.has_pre_issuance_review))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).