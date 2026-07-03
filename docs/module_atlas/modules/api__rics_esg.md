# Api::Rics_Esg
**Module ID:** `api::rics_esg` · **Route:** `/api/v1/rics-esg` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/rics-esg/compliance` | `assess_compliance` | api/v1/routes/rics_esg.py |
| GET | `/api/v1/rics-esg/checklist` | `get_checklist` | api/v1/routes/rics_esg.py |
| GET | `/api/v1/rics-esg/materiality` | `get_materiality_factors` | api/v1/routes/rics_esg.py |

### 2.3 Engine `rics_esg_engine` (services/rics_esg_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RICSESGEngine.assess_compliance` | inp | Run full RICS ESG compliance assessment: |
| `RICSESGEngine.get_full_checklist` |  | Return all RICS ESG checklist templates. |
| `RICSESGEngine.get_materiality_factors` |  | Return ESG materiality factor catalogue. |
| `RICSESGEngine._auto_assess_checklist` | inp |  |
| `RICSESGEngine._assess_item` | ci, inp | Auto-populate status and evidence based on input data. |
| `RICSESGEngine._materiality_assessment` | inp |  |
| `RICSESGEngine._check_data_available` | factor_name, inp |  |
| `RICSESGEngine._generate_narrative` | inp, mat_scores, material | Generate RICS-compliant ESG valuation narrative per VPS 4 and VPGA 12. |
| `RICSESGEngine._assess_uncertainty` | inp | VPG3 uncertainty assessment. |
| `RICSESGEngine._generate_recommendations` | inp, checklist, mat_scores |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/rics-esg/checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['PS1', 'PS2', 'VPS4', 'VPGA12', 'VPG3', 'IVS'], 'n_keys': 6}`

**GET /api/v1/rics-esg/materiality** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['environmental', 'social', 'governance'], 'n_keys': 3}`

**POST /api/v1/rics-esg/compliance** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `rics_esg_engine` — extracted transformation lines:**
```python
comp_pct = round(compliant / total * 100, 1) if total else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).