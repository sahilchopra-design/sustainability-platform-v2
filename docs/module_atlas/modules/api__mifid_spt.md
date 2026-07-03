# Api::Mifid_Spt
**Module ID:** `api::mifid_spt` · **Route:** `/api/v1/mifid-spt` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/mifid-spt/assess/batch` | `assess_batch` | api/v1/routes/mifid_spt.py |
| GET | `/api/v1/mifid-spt/ref/product-esg-types` | `ref_product_esg_types` | api/v1/routes/mifid_spt.py |
| GET | `/api/v1/mifid-spt/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/mifid_spt.py |

### 2.3 Engine `mifid_spt_engine` (services/mifid_spt_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PreferenceMatchResult.to_dict` |  |  |
| `MiFIDSPTResult.to_dict` |  |  |
| `MiFIDSPTEngine.assess_client_preferences` | client, products | Run Art 25(2) suitability preference matching for a client against a |
| `MiFIDSPTEngine.generate_suitability_report_text` | result | Generate human-readable suitability report text blocks from a |
| `MiFIDSPTEngine.get_preference_categories` |  |  |
| `MiFIDSPTEngine.get_suitability_process` |  |  |
| `MiFIDSPTEngine.get_cross_framework` |  |  |
| `MiFIDSPTEngine.get_product_esg_types` |  |  |
| `MiFIDSPTEngine.get_timeline` |  |  |
| `MiFIDSPTEngine._build_suitability_notes` | client, matched_count, total, adjustment_recommended |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `result`, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/mifid-spt/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_art_8_9', 'eu_taxonomy', 'pai_sfdr_rts', 'csrd_esrs_e1', 'eba_esg_risk'], 'n_keys': 5}`

**GET /api/v1/mifid-spt/ref/preference-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['category_a', 'category_b', 'category_c'], 'n_keys': 3}`

**GET /api/v1/mifid-spt/ref/product-esg-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['article_9', 'article_8_with_commitment', 'article_8_without_commitment', 'article_6'], 'n_keys': 4}`

**GET /api/v1/mifid-spt/ref/suitability-process** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': ['step', 'name', 'description', 'mandatory']}`

**GET /api/v1/mifid-spt/ref/timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 5, 'item0_keys': ['date', 'event', 'article']}`

## 5 · Intermediate Transformation Logic

**Engine `mifid_spt_engine` — extracted transformation lines:**
```python
match_rate_pct = (matched_count / total * 100.0) if total > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).