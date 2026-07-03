# Insurance Portfolio Climate
**Module ID:** `insurance-portfolio-climate` · **Route:** `/insurance-portfolio-climate` · **Tier:** A (backend vertical) · **EP code:** EP-CI5 · **Sprint:** CI

## 1 · Overview
Insurance portfolio climate analytics covering investment side, underwriting stress, reserve adequacy, ORSA climate module, and Solvency II SCR.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `ESG_PILLARS`, `ORSA_DIMS`, `ORSA_SCORES`, `SOLVENCY_RISKS`, `TABS`, `UW_LINES`, `WARMING`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `claimsTrend` | `WARMING.map(w => ({` |
| `totalPremium` | `UW_LINES.reduce((s, l) => s + l.premium, 0);` |
| `totalSCR` | `SOLVENCY_RISKS.reduce((s, r) => s + r.total, 0);` |
| `baseSCR` | `SOLVENCY_RISKS.reduce((s, r) => s + r.baseSCR, 0);` |
| `climateAddon` | `SOLVENCY_RISKS.reduce((s, r) => s + r.climateAddon, 0);` |
| `reserveData` | `UW_LINES.map(l => {` |
| `gapAdj` | `l.reserveGap * factor;` |
| `orsaRadar` | `ORSA_DIMS.map((d, i) => ({ dim: d, score: orsaOverrides[d] \|\| ORSA_SCORES[i] }));` |
| `overallOrsa` | `Math.round(orsaRadar.reduce((s, d) => s + d.score, 0) / orsaRadar.length);` |
| `esgTotal` | `ESG_PILLARS.reduce((s, p) => s + p.score * p.weight / 100, 0).toFixed(1);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/insurance/calculate` | `calculate_insurance` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/reference-data` | `reference_data` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/assessments` | `list_assessments` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/assessments/{assessment_id}` | `get_assessment` | api/v1/routes/insurance.py |

### 2.3 Engine `insurance_climate_risk` (services/insurance_climate_risk.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_insurance_climate_risk` | inp, scenario, horizon_year | Full insurance climate risk assessment. |
| `get_reference_data` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `insurance_climate_assessments` *(shared)*, `insurance_climate_entities` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_CLASSES`, `ESG_PILLARS`, `ORSA_DIMS`, `ORSA_SCORES`, `SOLVENCY_RISKS`, `TABS`, `UW_LINES`, `WARMING`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Reserve Gap | `Climate-adjusted claims - Current reserves` | Model | Potential reserve shortfall under warming scenarios |
| SCR Climate Addon | `Scenario-dependent` | EIOPA | Additional capital requirement for climate risk |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/insurance/assessments** — status `passed`, provenance ['db-empty'], source tables: `insurance_climate_assessments`, `insurance_climate_entities`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/insurance/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `insurance_climate_assessments`, `insurance_climate_entities`
Output: `None`

**GET /api/v1/insurance/reference-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cat_loss_multipliers', 'solvency_ii_cat_factors', 'tp_uplift_by_scenario', 'supported_perils', 'supported_scenarios', 'sources'], 'n_keys': 6}`

**POST /api/v1/insurance/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** ORSA climate risk assessment
**Headline formula:** `SCR_climate = SCR_base + ClimateAddon(scenario)`
**Standards:** ['EIOPA', 'NAIC', 'Solvency II']

**Engine `insurance_climate_risk` — extracted transformation lines:**
```python
gross_1in100 = inp.gross_loss_1in100_baseline_eur * multiplier
gross_1in250 = inp.gross_loss_1in250_baseline_eur * multiplier
aal          = inp.average_annual_loss_baseline_eur * multiplier
pml          = inp.probable_max_loss_baseline_eur * multiplier
cat_change_pct = (multiplier - 1.0) * 100.0
net_1in100 = gross_1in100 * ret
net_1in250 = gross_1in250 * ret
ri_limit = inp.reinsurance_limit_eur or (gross_1in250 * (1 - ret) * 1.1)
ri_gap    = max(0.0, gross_1in250 * (1 - ret) - ri_limit)
climate_scr_factor = base_cat_scr_factor * max(0, multiplier - 1.0)
scr_addon = inp.gross_written_premium_eur * climate_scr_factor
total_scr  = inp.scr_eur + scr_addon
sol_ratio_pre  = inp.own_funds_eur / inp.scr_eur if inp.scr_eur > 0 else 0.0
sol_ratio_post = inp.own_funds_eur / total_scr    if total_scr > 0  else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **90** other module(s).
**Shared engines (edits propagate!):** `insurance_climate_risk` (used by 4 modules)

| Connected module | Shared via |
|---|---|
| `insurance-transition` | engine:insurance_climate_risk, table:datetime, table:db, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities |
| `insurance-protection-gap` | engine:insurance_climate_risk, table:datetime, table:db, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities |
| `insurance-climate-hub` | engine:insurance_climate_risk, table:datetime, table:db, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities |
| `supply-chain-map` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-network-viz` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `api-gateway-monitor` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-labor-climate` | table:datetime, table:db, table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:datetime, table:db, table:exc, table:sqlalchemy |