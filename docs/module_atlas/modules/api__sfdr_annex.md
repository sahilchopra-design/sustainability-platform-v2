# Api::Sfdr_Annex
**Module ID:** `api::sfdr_annex` · **Route:** `/api/v1/sfdr-annex` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sfdr-annex/ref/pai-indicators` | `ref_pai_indicators` | api/v1/routes/sfdr_annex.py |
| GET | `/api/v1/sfdr-annex/ref/template-fields` | `ref_template_fields` | api/v1/routes/sfdr_annex.py |
| GET | `/api/v1/sfdr-annex/ref/frameworks` | `ref_frameworks` | api/v1/routes/sfdr_annex.py |

### 2.3 Engine `sfdr_annex_engine` (services/sfdr_annex_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SFDRannexEngine.generate_annex_i` | fund, report_date | Generate Annex I — PAI Statement (entity-level, Art 4 SFDR). |
| `SFDRannexEngine.generate_annex_ii` | fund, report_date | Generate Annex II — Art 8 Pre-contractual Disclosure. |
| `SFDRannexEngine.generate_annex_iii` | fund, report_date | Generate Annex III — Art 8 Periodic Disclosure Report. |
| `SFDRannexEngine.generate_annex_iv` | fund, report_date | Generate Annex IV — Art 9 Pre-contractual Disclosure. |
| `SFDRannexEngine.generate_annex_v` | fund, report_date | Generate Annex V — Art 9 Periodic Disclosure Report. |
| `SFDRannexEngine.validate_disclosure` | fund, annex_id | Validate completeness and RTS compliance of a disclosure without generating |
| `SFDRannexEngine._build_periodic_sections` | fund, is_art9, annex |  |
| `SFDRannexEngine._build_asset_allocation` | fund | Build the RTS-required pie chart data for asset allocation section. |
| `SFDRannexEngine._build_pai_table` | indicators, mandatory_only | Render PAI indicators into the RTS table format. |
| `SFDRannexEngine._check_fields` | content, required_keys |  |
| `SFDRannexEngine._finalise` | run_id, annex_id, annex_title, fund, report_date, sections |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Taxonomy`, `__future__` *(shared)*, `fastapi` *(shared)*, `fund`, `pydantic` *(shared)*, `services` *(shared)*, `sustainable` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sfdr-annex/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'reference'], 'n_keys': 2}`

**GET /api/v1/sfdr-annex/ref/pai-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mandatory_count', 'optional_count', 'mandatory_indicators', 'optional_indicators', 'reference'], 'n_keys': 5}`

**GET /api/v1/sfdr-annex/ref/template-fields** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['annex_I', 'annex_II', 'annex_III', 'annex_IV', 'annex_V', 'reference'], 'n_keys': 6}`

**POST /api/v1/sfdr-annex/generate/annex-i** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-annex/generate/annex-ii** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `sfdr_annex_engine` — extracted transformation lines:**
```python
sus_env = max(fund.pct_sustainable_environmental - tax_aligned, 0)
other = max(100 - tax_aligned - sus_env - sus_soc, 0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).