# Api::Biodiversity_Finance_V2
**Module ID:** `api::biodiversity_finance_v2` · **Route:** `/api/v1/biodiversity-finance-v2` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/biodiversity-finance-v2/leap-assessment` | `leap_assessment` | api/v1/routes/biodiversity_finance_v2.py |
| POST | `/api/v1/biodiversity-finance-v2/pbaf-attribution` | `pbaf_attribution` | api/v1/routes/biodiversity_finance_v2.py |
| POST | `/api/v1/biodiversity-finance-v2/encore-scoring` | `encore_scoring` | api/v1/routes/biodiversity_finance_v2.py |
| POST | `/api/v1/biodiversity-finance-v2/msa-footprint` | `msa_footprint` | api/v1/routes/biodiversity_finance_v2.py |
| POST | `/api/v1/biodiversity-finance-v2/gbf-alignment` | `gbf_alignment` | api/v1/routes/biodiversity_finance_v2.py |
| POST | `/api/v1/biodiversity-finance-v2/bng-calculation` | `bng_calculation` | api/v1/routes/biodiversity_finance_v2.py |
| POST | `/api/v1/biodiversity-finance-v2/bffi-score` | `bffi_score` | api/v1/routes/biodiversity_finance_v2.py |
| POST | `/api/v1/biodiversity-finance-v2/full-assessment` | `full_assessment` | api/v1/routes/biodiversity_finance_v2.py |
| GET | `/api/v1/biodiversity-finance-v2/ref/ecosystem-services` | `ref_ecosystem_services` | api/v1/routes/biodiversity_finance_v2.py |
| GET | `/api/v1/biodiversity-finance-v2/ref/gbf-targets` | `ref_gbf_targets` | api/v1/routes/biodiversity_finance_v2.py |
| GET | `/api/v1/biodiversity-finance-v2/ref/pbaf-methods` | `ref_pbaf_methods` | api/v1/routes/biodiversity_finance_v2.py |
| GET | `/api/v1/biodiversity-finance-v2/ref/bng-habitats` | `ref_bng_habitats` | api/v1/routes/biodiversity_finance_v2.py |

### 2.3 Engine `biodiversity_finance_v2_engine` (services/biodiversity_finance_v2_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `BiodiversityFinanceV2Engine.assess_tnfd_leap` | entity_id, sectors, locations, financial_exposure, financial_year, location_hazard_multiplier |  |
| `BiodiversityFinanceV2Engine.calculate_pbaf_attribution` | entity_id, portfolio_holdings, method |  |
| `BiodiversityFinanceV2Engine.score_encore_services` | entity_id, nace_sectors, company_revenue_split |  |
| `BiodiversityFinanceV2Engine.calculate_msa_footprint` | entity_id, land_use_data |  |
| `BiodiversityFinanceV2Engine.assess_gbf_alignment` | entity_id, portfolio_data, reporting_year |  |
| `BiodiversityFinanceV2Engine.calculate_bng` | entity_id, pre_development, post_development, habitat_type, condition_before, condition_after |  |
| `BiodiversityFinanceV2Engine.calculate_bffi` | entity_id, portfolio_holdings |  |
| `BiodiversityFinanceV2Engine.generate_full_assessment` | entity_id, portfolio_data |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/biodiversity-finance-v2/ref/bng-habitats** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/biodiversity-finance-v2/ref/ecosystem-services** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/biodiversity-finance-v2/ref/gbf-targets** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/biodiversity-finance-v2/ref/pbaf-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/biodiversity-finance-v2/bffi-score** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `biodiversity_finance_v2_engine` — extracted transformation lines:**
```python
locate_raw = sum(sector_impact_scores) / len(sector_impact_scores)
locate_score = min(100.0, round(locate_raw * hazard, 1))
evaluate_score = round(sum(dep_scores) / len(dep_scores), 1)
assess_score = round(min(100.0, locate_score * 0.4 + evaluate_score * 0.4 + conn * 0.2), 1)
assess_score = round(min(100.0, locate_score * 0.5 + evaluate_score * 0.5), 1)
composite = round(sum(available) / len(available), 1) if available else None
attr_factor = exposure / ev
attr_factor = min(exposure / ev, 1.0)
attr_factor = exposure / total_assets
attributed_footprint = attr_factor * company_footprint
portfolio_intensity = round(total_attributed_footprint / (attributed_exposure / 1e6), 2)
company_revenue_split = {s: 1.0 / len(nace_sectors) for s in nace_sectors}
msa_area = area_km2 * msa_fraction
msa_footprint = total_area_km2 - msa_preserved_km2
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).