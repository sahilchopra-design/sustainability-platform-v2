# Api::Ifrs_S1
**Module ID:** `api::ifrs_s1` · **Route:** `/api/v1/ifrs-s1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ifrs-s1/assess` | `assess` | api/v1/routes/ifrs_s1.py |
| POST | `/api/v1/ifrs-s1/assess/pillar` | `assess_pillar` | api/v1/routes/ifrs_s1.py |
| POST | `/api/v1/ifrs-s1/assess/batch` | `assess_batch` | api/v1/routes/ifrs_s1.py |
| GET | `/api/v1/ifrs-s1/ref/pillars` | `ref_pillars` | api/v1/routes/ifrs_s1.py |
| GET | `/api/v1/ifrs-s1/ref/disclosure-requirements` | `ref_disclosure_requirements` | api/v1/routes/ifrs_s1.py |
| GET | `/api/v1/ifrs-s1/ref/reliefs` | `ref_reliefs` | api/v1/routes/ifrs_s1.py |

### 2.3 Engine `ifrs_s1_engine` (services/ifrs_s1_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `S1PillarResult.dict` |  |  |
| `IFRSS1Result.dict` |  |  |
| `IFRSS1Engine.assess_pillar` | pillar_id, entity_id, entity_name, disclosures | Assess a single IFRS S1 pillar. |
| `IFRSS1Engine.assess` | inp | Full IFRS S1 compliance assessment across all 4 pillars. |
| `IFRSS1Engine.get_pillars` |  |  |
| `IFRSS1Engine.get_disclosure_requirements` |  |  |
| `IFRSS1Engine.get_industry_sasb_mapping` |  |  |
| `IFRSS1Engine.get_cross_framework` |  |  |
| `IFRSS1Engine.get_reliefs` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ifrs-s1/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ifrs_s2', 'csrd_esrs', 'tcfd', 'gri', 'sasb', 'sec_climate'], 'n_keys': 6}`

**GET /api/v1/ifrs-s1/ref/disclosure-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['S1.15', 'S1.16', 'S1.22', 'S1.23', 'S1.24', 'S1.25', 'S1.33', 'S1.34', 'S1.35', 'S1.38', 'S1.39', 'S1.40', 'S1.42'], 'n_keys': 13}`

**GET /api/v1/ifrs-s1/ref/industry-sasb-mapping** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_services', 'energy', 'real_estate', 'technology', 'healthcare', 'consumer_goods', 'industrials'], 'n_keys': 7}`

**GET /api/v1/ifrs-s1/ref/pillars** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['governance', 'strategy', 'risk_management', 'metrics_targets'], 'n_keys': 4}`

**GET /api/v1/ifrs-s1/ref/reliefs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['prior_period_comparative', 'scope3_grace_period', 'industry_metrics_grace'], 'n_keys': 3}`

## 5 · Intermediate Transformation Logic

**Engine `ifrs_s1_engine` — extracted transformation lines:**
```python
pillar_score = (weighted_sum / total_weight) if total_weight > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).