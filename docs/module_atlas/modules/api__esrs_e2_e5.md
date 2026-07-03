# Api::Esrs_E2_E5
**Module ID:** `api::esrs_e2_e5` · **Route:** `/api/v1/esrs-e2-e5` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/esrs-e2-e5/assess` | `assess` | api/v1/routes/esrs_e2_e5.py |
| POST | `/api/v1/esrs-e2-e5/assess-materiality` | `assess_materiality` | api/v1/routes/esrs_e2_e5.py |
| POST | `/api/v1/esrs-e2-e5/assess-e2` | `assess_e2` | api/v1/routes/esrs_e2_e5.py |
| POST | `/api/v1/esrs-e2-e5/assess-e3` | `assess_e3` | api/v1/routes/esrs_e2_e5.py |
| POST | `/api/v1/esrs-e2-e5/assess-e4` | `assess_e4` | api/v1/routes/esrs_e2_e5.py |
| POST | `/api/v1/esrs-e2-e5/assess-e5` | `assess_e5` | api/v1/routes/esrs_e2_e5.py |
| GET | `/api/v1/esrs-e2-e5/ref/e2-disclosures` | `ref_e2_disclosures` | api/v1/routes/esrs_e2_e5.py |
| GET | `/api/v1/esrs-e2-e5/ref/e3-disclosures` | `ref_e3_disclosures` | api/v1/routes/esrs_e2_e5.py |
| GET | `/api/v1/esrs-e2-e5/ref/e4-disclosures` | `ref_e4_disclosures` | api/v1/routes/esrs_e2_e5.py |
| GET | `/api/v1/esrs-e2-e5/ref/e5-disclosures` | `ref_e5_disclosures` | api/v1/routes/esrs_e2_e5.py |
| GET | `/api/v1/esrs-e2-e5/ref/materiality-triggers` | `ref_materiality_triggers` | api/v1/routes/esrs_e2_e5.py |

### 2.3 Engine `esrs_e2_e5_engine` (services/esrs_e2_e5_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ESRSE2E5Engine.get_instance` |  |  |
| `ESRSE2E5Engine.assess_materiality` | entity_id, nace_sector |  |
| `ESRSE2E5Engine.assess_e2_pollution` | entity_id, pollution_data |  |
| `ESRSE2E5Engine.assess_e3_water` | entity_id, water_data |  |
| `ESRSE2E5Engine.assess_e4_biodiversity` | entity_id, biodiversity_data |  |
| `ESRSE2E5Engine.assess_e5_circular` | entity_id, circular_data |  |
| `ESRSE2E5Engine.assess` | entity_id, entity_name, reporting_period, nace_sector, e2_data, e3_data |  |
| `ESRSE2E5Engine.ref_e2_disclosures` |  |  |
| `ESRSE2E5Engine.ref_e3_disclosures` |  |  |
| `ESRSE2E5Engine.ref_e4_disclosures` |  |  |
| `ESRSE2E5Engine.ref_e5_disclosures` |  |  |
| `ESRSE2E5Engine.ref_materiality_triggers` |  |  |
| `ESRSE2E5Engine._score_completeness` | flags |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `dataclasses` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/esrs-e2-e5/ref/e2-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E2-1', 'E2-2', 'E2-3', 'E2-4', 'E2-5', 'E2-6'], 'n_keys': 6}`

**GET /api/v1/esrs-e2-e5/ref/e3-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E3-1', 'E3-2', 'E3-3', 'E3-4', 'E3-5'], 'n_keys': 5}`

**GET /api/v1/esrs-e2-e5/ref/e4-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E4-1', 'E4-2', 'E4-3', 'E4-4', 'E4-5', 'E4-6'], 'n_keys': 6}`

**GET /api/v1/esrs-e2-e5/ref/e5-disclosures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E5-1', 'E5-2', 'E5-3', 'E5-4', 'E5-5', 'E5-6'], 'n_keys': 6}`

**GET /api/v1/esrs-e2-e5/ref/materiality-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['A01', 'A02', 'A03', 'B05', 'B06', 'C10', 'C13', 'C17', 'C20', 'C24', 'C26', 'D35', 'E36', 'E38', 'F41', 'G46', 'H50', 'I55', 'K64', 'L68'], 'n_keys': 20}`

## 5 · Intermediate Transformation Logic

**Engine `esrs_e2_e5_engine` — extracted transformation lines:**
```python
consumption = round(withdrawal_total - discharge_total, 1)
directed_to_disposal_t = round(waste_generated_t - diverted_t, 0)
diversion_rate_pct = round((diverted_t / waste_generated_t) * 100, 1)
overall_completeness = round(sum(completeness_scores) / len(completeness_scores), 1) if completeness_scores else 100.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).