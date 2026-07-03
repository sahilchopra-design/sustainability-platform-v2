# Temperature Alignment Waterfall
**Module ID:** `temperature-alignment-waterfall` · **Route:** `/temperature-alignment-waterfall` · **Tier:** A (backend vertical) · **EP code:** EP-CM2 · **Sprint:** CM

## 1 · Overview
Portfolio ITR decomposition showing sector → company → scope contribution with what-if simulator.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BASE_ITR`, `COMPANIES`, `PORTFOLIO_ITR`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['ITR Waterfall','Sector Contribution','Company Drill-Down','Scope Decomposition','What-If Simulator','Target Gap Analysis'];` |
| `gapData` | `SECTORS.map(s => ({` |
| `scopeDecomp` | `SECTORS.map(s => ({ sector: s.name, scope1: s.scope1, scope2: s.scope2, scope3: s.scope3 }));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/temperature-alignment/assess` | `assess_temperature_alignment` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/waci` | `calculate_waci` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/itr` | `calculate_itr` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/sbti-fi` | `assess_sbti_fi` | api/v1/routes/temperature_alignment.py |
| POST | `/api/v1/temperature-alignment/sector-alignment` | `sector_alignment` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/sbti-fi-criteria` | `ref_sbti_fi_criteria` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/sector-pathways` | `ref_sector_pathways` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/itr-table` | `ref_itr_table` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/asset-class-methods` | `ref_asset_class_methods` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/pcaf-dqs` | `ref_pcaf_dqs` | api/v1/routes/temperature_alignment.py |
| GET | `/api/v1/temperature-alignment/ref/sector-profiles` | `ref_sector_profiles` | api/v1/routes/temperature_alignment.py |

### 2.3 Engine `temperature_alignment_engine` (services/temperature_alignment_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `TemperatureAlignmentEngine.assess_temperature_alignment` | portfolio_name, fi_type, total_aum_bn, holdings, methodology, base_year | Full portfolio temperature alignment assessment. |
| `TemperatureAlignmentEngine.calculate_waci` | holdings | WACI = sum(portfolio_weight_i x scope12_emissions_i / revenue_i_mn). |
| `TemperatureAlignmentEngine.calculate_itr` | waci | Interpolate ITR from WACI using MSCI/Carbon Delta anchor table. |
| `TemperatureAlignmentEngine.calculate_pcaf_dqs` | holdings | Exposure-weighted PCAF DQS score 1-5. |
| `TemperatureAlignmentEngine.assess_sbti_fi_criteria` | portfolio_waci, scope1_financed, scope2_financed, scope3_financed, base_year, target_year | Score portfolio against all 6 SBTi FI Net-Zero Standard v1.0 criteria. |
| `TemperatureAlignmentEngine.calculate_sector_alignment` | sector, current_value, base_year | PACTA % alignment for a single sector vs IEA NZE 2050 trajectory. |
| `TemperatureAlignmentEngine.get_alignment_benchmarks` |  | Return all sector pathways and ITR interpolation table. |
| `TemperatureAlignmentEngine._pacta_alignment_pct` | current, nze_target, lower_is_better | Calculate % alignment relative to NZE 2030 target. |
| `TemperatureAlignmentEngine._engagement_priority` | itr, weight_pct |  |
| `TemperatureAlignmentEngine._score_sbti_criterion` | crit_id, crit_meta, total_s12, scope3_financed, portfolio_waci, sbti_targets | Return (score 0-1, status, notes) for a single SBTi FI criterion. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `WACI` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COMPANIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio ITR | `Budget method` | PACTA | Implies 2.4°C warming |
| Energy Contribution | `Sector pull` | Model | Largest positive contributor to ITR |

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/temperature-alignment/ref/asset-class-methods** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_class_methods', 'total_asset_classes', 'pcaf_standard', 'sbti_standard'], 'n_keys': 4}`

**GET /api/v1/temperature-alignment/ref/itr-table** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['itr_table', 'total_anchors', 'waci_unit', 'temperature_unit', 'methodology', 'key_thresholds', 'engagement_thresholds'], 'n_keys': 7}`

**GET /api/v1/temperature-alignment/ref/pcaf-dqs** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pcaf_dqs', 'source', 'note'], 'n_keys': 3}`

**GET /api/v1/temperature-alignment/ref/sbti-fi-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sbti_fi_criteria', 'total_criteria', 'standard', 'validation_body', 'eligible_asset_classes'], 'n_keys': 5}`

**GET /api/v1/temperature-alignment/ref/sector-pathways** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_pathways', 'sda_benchmarks', 'total_sectors', 'source', 'methodology'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic
**Methodology:** Additive ITR waterfall decomposition
**Headline formula:** `ITR = 1.5°C_base + Σ(sector_i_contribution) where contribution = weight × (company_ITR - 1.5)`
**Standards:** ['PACTA', 'GFANZ']

**Engine `temperature_alignment_engine` — extracted transformation lines:**
```python
s_weight_pct = (s_exposure / total_aum_bn) * 100 if total_aum_bn > 0 else 0.0
WACI = sum(portfolio_weight_i x scope12_emissions_i / revenue_i_mn).
weight_norm = h.portfolio_weight_pct / total_weight
total_emissions = h.scope1_emissions_tco2 + h.scope2_emissions_tco2
idx = bisect.bisect_right(_ITR_WACI_LIST, waci) - 1
idx = max(0, min(idx, len(_ITR_WACI_LIST) - 2))
frac = (waci - w0) / (w1 - w0) if (w1 - w0) > 0 else 0.0
weighted_dqs = sum(h.data_quality_score * h.exposure_bn for h in holdings)
total_s12 = scope1_financed + scope2_financed
overall_score = weighted_score / total_weight if total_weight > 0 else 0.0
gap_to_nze_2030 = current_value - nze_2030
gap_to_threshold = current_value - threshold
alignment_pct = max(0.0, 100.0 - ((current_value - nze_2030) / max(cps_2030 - nze_2030, 0.001)) * 100)
gap_to_nze_2030 = nze_2030 - current_value
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `temperature_alignment_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `temperature-alignment` | engine:temperature_alignment_engine, table:WACI |