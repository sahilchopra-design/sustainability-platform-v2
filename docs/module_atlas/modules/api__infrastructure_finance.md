# Api::Infrastructure_Finance
**Module ID:** `api::infrastructure_finance` · **Route:** `/api/v1/infrastructure-finance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/infrastructure-finance/equator-principles` | `equator_principles` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/ifc-ps` | `ifc_ps` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/oecd` | `oecd` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/paris-alignment` | `paris_alignment` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/dscr-stress` | `dscr_stress` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/blended-finance` | `blended_finance` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/climate-label` | `climate_label` | api/v1/routes/infrastructure_finance.py |
| POST | `/api/v1/infrastructure-finance/full-assessment` | `full_assessment` | api/v1/routes/infrastructure_finance.py |
| GET | `/api/v1/infrastructure-finance/ref/ep-principles` | `ref_ep_principles` | api/v1/routes/infrastructure_finance.py |
| GET | `/api/v1/infrastructure-finance/ref/ifc-ps` | `ref_ifc_ps` | api/v1/routes/infrastructure_finance.py |
| GET | `/api/v1/infrastructure-finance/ref/paris-alignment` | `ref_paris_alignment` | api/v1/routes/infrastructure_finance.py |
| GET | `/api/v1/infrastructure-finance/ref/blended-structures` | `ref_blended_structures` | api/v1/routes/infrastructure_finance.py |

### 2.3 Engine `infrastructure_finance_engine` (services/infrastructure_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `InfrastructureFinanceEngine.assess_equator_principles` | entity_id, project_type, sector, country, total_cost_usd, e_s_data |  |
| `InfrastructureFinanceEngine.assess_ifc_ps` | entity_id, sector, country, workforce_size, biodiversity_sensitive, land_acquisition |  |
| `InfrastructureFinanceEngine.assess_oecd` | entity_id, sector, country, project_type |  |
| `InfrastructureFinanceEngine.assess_paris_alignment` | entity_id, sector, country, annual_ghg_tco2, project_lifetime_yrs, climate_vulnerability_score |  |
| `InfrastructureFinanceEngine.calculate_dscr_climate_stress` | entity_id, sector, baseline_dscr, debt_service_usd_pa, physical_risk_level, transition_risk_level |  |
| `InfrastructureFinanceEngine.structure_blended_finance` | entity_id, total_cost_usd, sector, country, target_private_irr_pct, mdb_participation |  |
| `InfrastructureFinanceEngine.assess_climate_label` | entity_id, sector, annual_ghg_reduction, project_type |  |
| `InfrastructureFinanceEngine.generate_full_assessment` | entity_id, project_data |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/infrastructure-finance/ref/blended-structures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/infrastructure-finance/ref/ep-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/infrastructure-finance/ref/ifc-ps** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**GET /api/v1/infrastructure-finance/ref/paris-alignment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

**POST /api/v1/infrastructure-finance/blended-finance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `infrastructure_finance_engine` — extracted transformation lines:**
```python
overall_score = round(total_score / supplied_weight, 2)
composite = round(composite / supplied_weight, 2) if supplied_weight > 0.0 else None
dim_scores[dim] = round(dim_total / supplied, 2) if supplied > 0 else None
ghg_reduction_pa = round(annual_ghg_tco2 * (mit / 100.0) * 0.3, 2)
dscr_physical = baseline_dscr * (1.0 - phys_haircut)
dscr_transition = baseline_dscr * (1.0 - transition_capex_impact - revenue_reduction)
dscr_combined = baseline_dscr * (1.0 - phys_haircut - transition_capex_impact * 0.5 - revenue_reduction * 0.5)
mdb_pct = min(1.0, max(0.0, float(mdb_share_pct) / 100.0))
private_pct = 1.0 - mdb_pct
mdb_amount = total_cost_usd * mdb_pct
private_finance_mobilised = round(mdb_amount * crowding_in, 0)
mdb_share_out = round(mdb_pct * 100.0, 1)
blended_irr = round(target_private_irr_pct + float(concessional_irr_uplift_pct), 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).