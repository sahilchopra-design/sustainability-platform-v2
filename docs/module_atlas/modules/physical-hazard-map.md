# Physical Hazard Map
**Module ID:** `physical-hazard-map` · **Route:** `/physical-hazard-map` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Multi-peril physical climate hazard mapping across asset locations using gridded climate datasets and SSP scenarios.

> **Business value:** Provides asset-level physical hazard intelligence across six perils under multiple SSP scenarios for integration into risk pricing and portfolio stress-testing.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `ASSET_CLASSES`, `COUNTRIES`, `KpiCard`, `PERILS`, `RISK_BG`, `RISK_COLOR`, `SCENARIOS`, `SectionTitle`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `base` | `sr(i * 13);` |
| `hazardScores` | `PERILS.reduce((acc, p) => {` |
| `composite` | `Math.round(Object.values(hazardScores).reduce((a, b) => a + b, 0) / PERILS.length);` |
| `avgComposite` | `filteredAssets.length ? Math.round(filteredAssets.reduce((s, a) => s + a.composite, 0) / filteredAssets.length * scenarioMult) : 0;` |
| `totalExposure` | `filteredAssets.reduce((s, a) => s + a.value, 0);` |
| `perilData` | `PERILS.map(p => ({` |
| `countryData` | `COUNTRIES.map((c, i) => {` |
| `avgScore` | `assets.length ? Math.round(assets.reduce((s, a) => s + a.composite, 0) / assets.length * scenarioMult) : 0;` |
| `radarData` | `PERILS.map(p => {` |
| `adj` | `Math.min(100, Math.round(a.composite * scenarioMult));` |
| `pct` | `(filteredAssets.length ? (count / filteredAssets.length) * 100 : 0).toFixed(0);` |
| `scores` | `filteredAssets.map(a => Math.min(100, Math.round((a[selectedPeril] \|\| 0) * scenarioMult)));` |
| `avgScore` | `Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);` |
| `scenarioProgression` | `SCENARIOS.map(s => ({` |
| `score` | `Math.min(100, Math.round((a[selectedPeril] \|\| 0) * scenarioMult));` |
| `adjScore` | `Math.min(100, Math.round(a.composite * scenarioMult));` |
| `score` | `Math.min(100, Math.round((a[p.id] \|\| 0) * scenarioMult));` |
| `aScore` | `aAssets.length ? aAssets.reduce((s, x) => s + (x[p.id] \|\| 0), 0) / aAssets.length : 0;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/physical-hazard/score-hazard` | `score_hazard` | api/v1/routes/physical_hazard.py |
| POST | `/api/v1/physical-hazard/composite-risk` | `composite_risk` | api/v1/routes/physical_hazard.py |
| POST | `/api/v1/physical-hazard/financial-impact` | `financial_impact` | api/v1/routes/physical_hazard.py |
| POST | `/api/v1/physical-hazard/crrem-check` | `crrem_check` | api/v1/routes/physical_hazard.py |
| POST | `/api/v1/physical-hazard/full-assessment` | `full_assessment` | api/v1/routes/physical_hazard.py |
| GET | `/api/v1/physical-hazard/ref/hazard-profiles` | `ref_hazard_profiles` | api/v1/routes/physical_hazard.py |
| GET | `/api/v1/physical-hazard/ref/country-hazard` | `ref_country_hazard` | api/v1/routes/physical_hazard.py |
| GET | `/api/v1/physical-hazard/ref/adaptation-measures` | `ref_adaptation_measures` | api/v1/routes/physical_hazard.py |

### 2.3 Engine `physical_hazard_engine` (services/physical_hazard_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PhysicalHazardEngine.score_hazard` | entity_id, hazard_type, country_code, asset_type, climate_scenario, time_horizon | Score a single hazard for an asset in a given country. |
| `PhysicalHazardEngine.compute_composite_risk` | entity_id, hazard_scores | Compute weighted composite hazard score. |
| `PhysicalHazardEngine.estimate_financial_impact` | entity_id, composite_score, asset_type, asset_value_mn, damage_curve_multiplier | Estimate property damage, business interruption, and adaptation CAPEX. |
| `PhysicalHazardEngine.check_crrem_alignment` | entity_id, asset_type, climate_scenario | Check CRREM pathway compliance and stranding year for the asset. |
| `PhysicalHazardEngine.full_assessment` | entity_id, asset_name, asset_type, country_code, climate_scenario, time_horizon | Complete physical hazard assessment combining all methods. |
| `PhysicalHazardEngine.get_hazard_profiles` |  |  |
| `PhysicalHazardEngine.get_country_base_hazard` |  |  |
| `PhysicalHazardEngine.get_asset_vulnerability` |  |  |
| `PhysicalHazardEngine.get_adaptation_measures` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `country`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_CLASSES`, `COUNTRIES`, `PERILS`, `SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Peak Flood Depth (m) | — | JBA/Fathom | Modelled 1-in-100-year inundation depth at asset centroid. |
| Wildfire Hazard Index | — | FIRMS/EFFIS | Normalised 0–1 fire weather index under SSP5-8.5 by 2050. |
| Heat Stress Days/yr | — | ERA5 Reanalysis | Annual days exceeding 35°C wet-bulb threshold at location. |
- **Gridded hazard rasters + asset coordinates** → Bilinear interpolation to asset point; peril normalisation; weighted aggregation → **Per-asset multi-peril hazard scores + composite index**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/physical-hazard/ref/adaptation-measures** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['flood', 'wildfire', 'heat_stress', 'sea_level_rise', 'cyclone', 'drought', 'subsidence'], 'n_keys': 7}`

**GET /api/v1/physical-hazard/ref/country-hazard** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['BD', 'PH', 'IN', 'CN', 'US', 'AU', 'ES', 'DE', 'NL', 'GB', 'JP', 'BR', 'ZA', 'NG', 'ID'], 'n_keys': 15}`

**GET /api/v1/physical-hazard/ref/hazard-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['flood', 'wildfire', 'heat_stress', 'sea_level_rise', 'cyclone', 'drought', 'subsidence'], 'n_keys': 7}`

**POST /api/v1/physical-hazard/composite-risk** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/physical-hazard/crrem-check** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Composite Hazard Score
**Headline formula:** `H = Σ(wᵢ × perilᵢ) / Σwᵢ`
**Standards:** ['IPCC AR6 WG1', 'JBA Flood Data']

**Engine `physical_hazard_engine` — extracted transformation lines:**
```python
years_forward = max(0, horizon_year - CURRENT_YEAR)
time_factor = 1.0 + (years_forward / 100) * (multiplier - 1.0)
hazard_score = min(100.0, round(base_score * time_factor, 2))
vulnerability_score = round(vuln_fraction * 100, 2) if vuln_fraction is not None else None
return_period_20yr = round(base_score * 0.6 * multiplier, 2) if base_score is not None else None
return_period_100yr = round(base_score * 1.0 * multiplier, 2) if base_score is not None else None
property_damage_pct = round(composite_score * 0.4 * curve, 2)
business_interruption_days = round(composite_score * 0.5 * curve)
stranded_value_risk_pct = round(composite_score * 0.25 * curve, 2)
property_damage_value_mn = round(asset_value_mn * property_damage_pct / 100, 3)
stranded_value_mn = round(asset_value_mn * stranded_value_risk_pct / 100, 3)
crrem_pathway_compliant = stranding_year > CURRENT_YEAR + 10
years_to_stranding = stranding_year - CURRENT_YEAR
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).