# Api::Esma_Fund_Names
**Module ID:** `api::esma_fund_names` · **Route:** `/api/v1/esma-fund-names` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/esma-fund-names/assess` | `assess_fund_name` | api/v1/routes/esma_fund_names.py |
| POST | `/api/v1/esma-fund-names/assess/batch` | `assess_batch` | api/v1/routes/esma_fund_names.py |
| POST | `/api/v1/esma-fund-names/detect-terms` | `detect_terms` | api/v1/routes/esma_fund_names.py |
| GET | `/api/v1/esma-fund-names/ref/term-categories` | `ref_term_categories` | api/v1/routes/esma_fund_names.py |
| GET | `/api/v1/esma-fund-names/ref/pab-exclusions` | `ref_pab_exclusions` | api/v1/routes/esma_fund_names.py |
| GET | `/api/v1/esma-fund-names/ref/sfdr-requirements` | `ref_sfdr_requirements` | api/v1/routes/esma_fund_names.py |
| GET | `/api/v1/esma-fund-names/ref/timeline` | `ref_timeline` | api/v1/routes/esma_fund_names.py |

### 2.3 Engine `esma_fund_names_engine` (services/esma_fund_names_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `FundNameResult.dict` |  |  |
| `ESMAFundNamesEngine.detect_terms` | fund_name | Detect ESG terms in a fund name and derive applicable requirements. |
| `ESMAFundNamesEngine.assess_fund_name` | inp | Full ESMA fund name compliance assessment. |
| `ESMAFundNamesEngine.batch_assess` | funds | Assess a list of fund name inputs. |
| `ESMAFundNamesEngine.get_term_categories` |  |  |
| `ESMAFundNamesEngine.get_pab_exclusions` |  |  |
| `ESMAFundNamesEngine.get_sfdr_requirements` |  |  |
| `ESMAFundNamesEngine.get_cross_framework` |  |  |
| `ESMAFundNamesEngine.get_timeline` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `Final`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/esma-fund-names/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_art8_art9', 'eu_taxonomy', 'mifid_spt', 'priips_kid', 'paris_aligned_benchmark'], 'n_keys': 5}`

**GET /api/v1/esma-fund-names/ref/pab-exclusions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['controversial_weapons', 'ungc_violations', 'tobacco_production', 'fossil_fuel_exploration', 'high_ghg_intensity'], 'n_keys': 5}`

**GET /api/v1/esma-fund-names/ref/sfdr-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['art_8', 'art_9'], 'n_keys': 2}`

**GET /api/v1/esma-fund-names/ref/term-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['environmental', 'social', 'governance', 'impact', 'transition', 'sustainable_focus'], 'n_keys': 6}`

**GET /api/v1/esma-fund-names/ref/timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 4, 'item0_keys': ['date', 'event', 'article']}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).