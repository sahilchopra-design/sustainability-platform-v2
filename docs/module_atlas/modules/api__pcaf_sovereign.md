# Api::Pcaf_Sovereign
**Module ID:** `api::pcaf_sovereign` · **Route:** `/api/v1/pcaf-sovereign` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf-sovereign/assess` | `assess_sovereign` | api/v1/routes/pcaf_sovereign.py |
| POST | `/api/v1/pcaf-sovereign/portfolio` | `assess_portfolio` | api/v1/routes/pcaf_sovereign.py |
| POST | `/api/v1/pcaf-sovereign/attribution` | `attribution_calculation` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/country-profiles` | `ref_country_profiles` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/dqs-methodology` | `ref_dqs_methodology` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/ndc-alignment` | `ref_ndc_alignment` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/attribution-formula` | `ref_attribution_formula` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/pcaf-part-d` | `ref_pcaf_part_d` | api/v1/routes/pcaf_sovereign.py |

### 2.3 Engine `pcaf_sovereign_engine` (services/pcaf_sovereign_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PCAFSovereignEngine.assess` | entity_id, entity_name, country_code, outstanding_amount_mn, use_lulucf_adjustment, current_trajectory_gap_pct | Full PCAF Part D sovereign assessment for a single country holding. |
| `PCAFSovereignEngine.assess_portfolio` | entity_id, sovereign_holdings | Portfolio-level PCAF sovereign assessment with exposure-weighted aggregation. |
| `PCAFSovereignEngine.calculate_attribution` | outstanding_mn, government_debt_bn, ghg_inventory_tco2e | PCAF Part D attribution calculation (isolated). |
| `PCAFSovereignEngine._determine_dqs` | annex_status, dqs_override | PCAF Part D Data Quality Score — deterministic from the data source used. |
| `PCAFSovereignEngine._assess_ndc_alignment` | ndc_target, current_trajectory_gap_pct | Classify NDC alignment from a *supplied* trajectory gap — never fabricated. |
| `PCAFSovereignEngine.ref_country_profiles` |  |  |
| `PCAFSovereignEngine.ref_dqs_methodology` |  |  |
| `PCAFSovereignEngine.ref_ndc_alignment` |  |  |
| `PCAFSovereignEngine.ref_attribution_formula` |  |  |
| `PCAFSovereignEngine.ref_pcaf_part_d` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pcaf-sovereign/ref/attribution-formula** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/pcaf-sovereign/ref/country-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/pcaf-sovereign/ref/dqs-methodology** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/pcaf-sovereign/ref/ndc-alignment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/pcaf-sovereign/ref/pcaf-part-d** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `pcaf_sovereign_engine` — extracted transformation lines:**
```python
ghg_tco2e = ghg_mtco2e * 1_000_000.0
ghg_incl_lulucf = (ghg_mtco2e + lulucf_net) * 1_000_000.0
att_factor = (outstanding_amount_mn / 1000.0) / govt_debt_bn
attributed_with_lulucf = round(att_factor * ghg_incl_lulucf, 2)
wa_dqs = sum(r.dqs_score * r.outstanding_amount_mn for r in results) / total_exposure
wa_carbon_intensity = sum(r.portfolio_carbon_intensity_tco2e_per_gdp_mn * r.outstanding_amount_mn for r in results) / total_exposure
outstanding_bn = outstanding_mn / 1000.0
attribution_factor = outstanding_bn / government_debt_bn
attributed_tco2e = attribution_factor * ghg_inventory_tco2e
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).