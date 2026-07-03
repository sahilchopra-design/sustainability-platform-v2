# Api::Prudential_Climate_Risk
**Module ID:** `api::prudential_climate_risk` · **Route:** `/api/v1/prudential-climate-risk` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/prudential-climate-risk/boe-bes` | `boe_bes` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/ecb-dfast` | `ecb_dfast` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/ngfs-v4` | `ngfs_v4` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/icaap-overlay` | `icaap_overlay` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/sarp431` | `sarp431` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/capital-overlays` | `capital_overlays` | api/v1/routes/prudential_climate_risk.py |
| POST | `/api/v1/prudential-climate-risk/full-assessment` | `full_assessment` | api/v1/routes/prudential_climate_risk.py |
| GET | `/api/v1/prudential-climate-risk/ref/ngfs-scenarios` | `ref_ngfs_scenarios` | api/v1/routes/prudential_climate_risk.py |
| GET | `/api/v1/prudential-climate-risk/ref/boe-bes` | `ref_boe_bes` | api/v1/routes/prudential_climate_risk.py |
| GET | `/api/v1/prudential-climate-risk/ref/sector-risk` | `ref_sector_risk` | api/v1/routes/prudential_climate_risk.py |
| GET | `/api/v1/prudential-climate-risk/ref/icaap-thresholds` | `ref_icaap_thresholds` | api/v1/routes/prudential_climate_risk.py |

### 2.3 Engine `prudential_climate_risk_engine` (services/prudential_climate_risk_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PrudentialClimateRiskEngine.assess_boe_bes` | entity_id, loan_book_segments, market_portfolio, institution_type, bes_round, cet1_ratio_start_pct |  |
| `PrudentialClimateRiskEngine.assess_ecb_dfast` | entity_id, loan_book_segments, cst_round, cet1_ratio_start_pct |  |
| `PrudentialClimateRiskEngine.assess_ngfs_v4` | entity_id, portfolio_data, scenarios |  |
| `PrudentialClimateRiskEngine.calculate_icaap_overlay` | entity_id, stressed_results, institution_type |  |
| `PrudentialClimateRiskEngine.assess_sarp431` | entity_id, rwa_data, climate_rwa_impact |  |
| `PrudentialClimateRiskEngine.generate_capital_overlays` | entity_id, loan_book_segments, scenario |  |
| `PrudentialClimateRiskEngine.generate_full_assessment` | entity_id, institution_data |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/prudential-climate-risk/ref/boe-bes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/prudential-climate-risk/ref/icaap-thresholds** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/prudential-climate-risk/ref/ngfs-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/prudential-climate-risk/ref/sector-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/prudential-climate-risk/boe-bes** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `prudential_climate_risk_engine` — extracted transformation lines:**
```python
stressed_pd = min(1.0, base_pd + pd_uplift)
el_stressed = exposure * stressed_pd * lgd
phase = (yr - 2025) / 25.0  # 0 at 2025 → 1 at 2050
tr_drag = tr_mult * self._NGFS_TRANSITION_DRAG_COEF * phase
ph_drag = ph_mult * self._NGFS_PHYSICAL_DRAG_COEF * phase
impact_pct = (climate_rwa_impact / max(total_rwa, 1)) * 100
brown_exposure = exposure * brown_share
capital_add_on = exposure * (rwa_uplift_pct / 100) * 0.08  # 8% capital ratio
stranded_pct = float(_override) / 100 if float(_override) > 1 else float(_override)
rwa_impact_pct = round(climate_rwa / total_rwa * 100, 2) if total_rwa > 0 else None
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).