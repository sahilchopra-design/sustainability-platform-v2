# Api::Re_Clvar
**Module ID:** `api::re_clvar` · **Route:** `/api/v1` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/re/clvar/calculate` | `calculate_re_clvar` | api/v1/routes/re_clvar.py |
| POST | `/api/v1/re/crrem/stranding` | `assess_crrem_stranding` | api/v1/routes/re_clvar.py |
| POST | `/api/v1/re/crrem/roadmap` | `generate_crrem_roadmap` | api/v1/routes/re_clvar.py |
| POST | `/api/v1/re/clvar/portfolio` | `calculate_portfolio_clvar` | api/v1/routes/re_clvar.py |
| GET | `/api/v1/re/crrem/pathways/{property_type}/{country_iso}` | `get_crrem_pathways` | api/v1/routes/re_clvar.py |

### 2.3 Engine `crrem_stranding_engine` (services/crrem_stranding_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `CRREMStrandingEngine.get_pathway_intensity` | property_type, country_iso, scenario, year | Get CRREM pathway energy intensity for a given asset type, country, scenario and year. |
| `CRREMStrandingEngine.calculate_pathway_trajectory` | property_type, country_iso, scenario, start_year, end_year | Generate year-by-year CRREM pathway trajectory from start_year to end_year. |
| `CRREMStrandingEngine.assess_stranding` | profile, scenario | Assess stranding risk for an asset against the CRREM pathway. |
| `CRREMStrandingEngine.generate_decarbonisation_roadmap` | profile, target_scenario | Generate year-by-year decarbonisation action plan from current year to 2050. |
| `CRREMStrandingEngine.compare_scenarios` | profile | Compare stranding results across four CRREM-aligned scenarios. |
| `CRREMStrandingEngine.build_validation_summary` | profile, result_data | Build a complete audit trail for CRREM stranding analysis. |
| `assess_asset_stranding` | property_type, country_iso, floor_area_m2, current_energy_kwh_m2, current_carbon_kgco2_m2, year_built | Convenience wrapper for single-asset CRREM stranding analysis using primitive types. |

### 2.3 Engine `re_clvar_engine` (services/re_clvar_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `RECLVaREngine._get_time_horizon_band` | h |  |
| `RECLVaREngine._interpolate_carbon_price` | scenario, yr | Linear interpolation of carbon price for any target year. |
| `RECLVaREngine._interpolate_slr` | scenario, yr | Linear interpolation of sea level rise for any target year. |
| `RECLVaREngine._epc_numeric` | r |  |
| `RECLVaREngine._epc_gap` | current, required | Return EPC grades below required minimum (0 = compliant). |
| `RECLVaREngine._flood_severity` | zone, depth |  |
| `RECLVaREngine._heat_severity` | days |  |
| `RECLVaREngine._wildfire_severity` | km |  |
| `RECLVaREngine._slr_severity` | ckm, slr |  |
| `RECLVaREngine._subsidence_severity` | risk |  |
| `RECLVaREngine._drought_severity` | wsi |  |
| `RECLVaREngine.calculate_physical_clvar` | inputs, scenario, time_horizon | Calculate physical climate risk value impact per hazard. |
| `RECLVaREngine.calculate_transition_clvar` | inputs, val_inputs, scenario, time_horizon | Calculate transition risk: EPC stranding, retrofit capex, carbon cost. |
| `RECLVaREngine.run_monte_carlo` | physical_inputs, transition_inputs, val_inputs, scenario, time_horizon, n_simulations | Monte Carlo simulation for probabilistic CLVaR distribution. |
| `RECLVaREngine.calculate_clvar` | physical_inputs, transition_inputs, val_inputs, scenario, time_horizon, run_mc | Full CLVaR calculation orchestrator. |
| `RECLVaREngine._build_validation_summary` | pi, ti, vi, scenario, time_horizon, phys | Build RICS VPS4 / IVS 2024 compliant validation and audit trail. |
| `RECLVaREngine._assess_data_quality` | pi, ti, vi | Rate data quality per input category, scale 1-5 (5 = highest). |
| `calculate_clvar_for_asset` | flood_zone, flood_depth_100yr_m, heat_days_above_35c, wildfire_proximity_km, coastal_proximity_km, subsidence_risk | Convenience wrapper for single-asset CLVaR using primitive Python types. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `combined`, `decimal` *(shared)*, `defaults`, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/re/crrem/pathways/{property_type}/{country_iso}** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re/clvar/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re/clvar/portfolio** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re/crrem/roadmap** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/re/crrem/stranding** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `crrem_stranding_engine` — extracted transformation lines:**
```python
t = (year - y0) / (y1 - y0)
interp = pathway[y0] + t * (pathway[y1] - pathway[y0])
yoy_reduction = (float(prev_intensity) - float(intensity)) / float(prev_intensity) * 100
gap         = current_ei - pw_now
gap_pct     = (gap / pw_now * 100) if pw_now > 0 else 0.0
years_to_1_5c = (sy_1_5c - current_year) if sy_1_5c is not None else None
years_to_2050 = max(1, 2050 - current_year)
total_reduction_needed = (current_ei - pw_2050) / current_ei
annual_reduction_pct = (1 - (pw_2050 / current_ei) ** (1 / years_to_2050)) * 100
total_retro = retro_m2 * floor_area
annual_carbon_cost = (carbon_kgco2 * floor_area / 1000.0) * self.CARBON_PRICE_EUR_TCO2
red_pct    = max(0.0, (current_ei - target_ei) / current_ei * 100) if current_ei > 0 else 0.0
ann_red    = max(0.0, prev_target - target_ei)
gap_yr     = max(0.0, current_ei - target_ei)
```

**Engine `re_clvar_engine` — extracted transformation lines:**
```python
hyear = datetime.utcnow().year + time_horizon
dda = max(-(depth * 0.15 + 0.05) * 0.5, -0.10)
hi[HazardType.FLOOD] = max(bflood + dda, -0.45)
cool  = max(-(inputs.heat_days_above_35c * 0.0015), -0.06) * 0.3
hi[HazardType.HEAT] = max(bheat + cool, -0.15)
hi[HazardType.SEA_LEVEL_RISE] = slrbase * (slrm / slr2050 if slr2050 > 0 else 1.0)
ss = sum(v ** 2 for v in neg)
cx = 0.35 * sum(neg[a] * neg[b] for a in range(len(neg)) for b in range(len(neg)) if a != b)
agg = -math.sqrt(max(ss + cx, ss * 0.5))
hyear = cyear + time_horizon
rcrm = bc * fm
rtot = rcrm * fa
rpct = -(rtot / mv) if mv > 0 else 0.0
ctpa   = (ci * fa) / 1000.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).