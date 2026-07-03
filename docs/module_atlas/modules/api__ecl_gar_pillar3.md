# Api::Ecl_Gar_Pillar3
**Module ID:** `api::ecl_gar_pillar3` · **Route:** `/api/v1/ecl-gar-pillar3` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ecl-gar-pillar3/ecl-only` | `ecl_only` | api/v1/routes/ecl_gar_pillar3.py |
| POST | `/api/v1/ecl-gar-pillar3/gar-only` | `gar_only` | api/v1/routes/ecl_gar_pillar3.py |
| GET | `/api/v1/ecl-gar-pillar3/ref/kpis` | `ref_kpis` | api/v1/routes/ecl_gar_pillar3.py |
| GET | `/api/v1/ecl-gar-pillar3/ref/nace-eligible` | `ref_nace` | api/v1/routes/ecl_gar_pillar3.py |

### 2.3 Engine `ecl_gar_pillar3_orchestrator` (services/ecl_gar_pillar3_orchestrator.py)
| Function | Args | Purpose |
|---|---|---|
| `ECLGARPillar3Orchestrator.orchestrate` | entity_name, exposures, scenario, reporting_date | Run the full ECL → GAR → Pillar 3 chain. |
| `ECLGARPillar3Orchestrator._compute_exposure` | inp, scenario | Compute ECL climate overlay + GAR classification for one exposure. |
| `ECLGARPillar3Orchestrator._build_pillar3` |  | Build EBA ITS 2022/01 Pillar 3 Art. 449a sections and KPI table. |
| `ECLGARPillar3Orchestrator._assess_readiness` | gar_ratio, exposure_results, exposures | Score assurance readiness and generate gaps + recommendations. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ecl-gar-pillar3/ref/kpis** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillar3_kpi_template'], 'n_keys': 1}`

**GET /api/v1/ecl-gar-pillar3/ref/nace-eligible** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['taxonomy_eligible_nace', 'reference'], 'n_keys': 2}`

**POST /api/v1/ecl-gar-pillar3/ecl-only** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ecl-gar-pillar3/gar-only** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/ecl-gar-pillar3/orchestrate** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `ecl_gar_pillar3_orchestrator` — extracted transformation lines:**
```python
LGD_climate = LGD_base + IPCC_AR6_flood_damage_component(scenario, flood_rp)
EAD_climate = EAD + CCF_uplift(scenario, asset_class, transition_risk) × undrawn_commitment
GAR = numerator / denominator × 100
ecl_uplift = ((clim_ecl - base_ecl) / base_ecl * 100) if base_ecl > 0 else 0.0
gar_ratio  = (gar_num / gar_denom * 100) if gar_denom > 0 else 0.0
btar_ratio = (gar_num / btar_denom * 100) if btar_denom > 0 else 0.0
trans_conc_pct = (high_trans_ead / total_ead * 100) if total_ead > 0 else 0.0
phys_conc_pct = (phys_ead / total_ead * 100) if total_ead > 0 else 0.0
ead_uplift_pct=pw_ead_uplift * 100,
lgd_flood_pct=pw_lgd_flood * 100,
portfolio_ead_uplift_pct=round(pw_ead_uplift * 100, 3),
portfolio_lgd_flood_damage_pct=round(pw_lgd_flood * 100, 3),
pd_climate = min(inp.pd_base * pd_mult, 0.9999)
rp_effective = max(rp_nominal / ipcc_amp, 5.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).