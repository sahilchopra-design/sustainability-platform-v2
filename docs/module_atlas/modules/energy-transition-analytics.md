# Energy Transition Analytics
**Module ID:** `energy-transition-analytics` · **Route:** `/energy-transition-analytics` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks global and regional renewable energy build-out trajectories against IEA and IRENA decarbonisation pathways, monitoring grid decarbonisation rates and the financial exposure of stranded generation assets. Integrates capacity addition data, power purchase agreement analytics, and utility-level carbon intensity trends. Supports asset allocation, utility equity analysis, and infrastructure debt underwriting.

> **Business value:** Provides power sector analysts and infrastructure investors with a real-time view of transition velocity, enabling identification of under-valued renewable developers, over-exposed fossil generators, and grid decarbonisation financing opportunities across 50+ markets.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COLORS`, `COUNTRIES`, `REGIONF`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `totalCap` | `Math.round(50+sr(i*7)*1200);const renewPct=Math.round(15+sr(i*11)*55);const solarGW=Math.round(totalCap*renewPct/100*(sr(i*13)*0.4+0.2));const windGW=` |
| `gridIntensity` | `Math.round(100+sr(i*19)*600);const coalPct=Math.round(sr(i*23)*50);const gasPct=Math.round(sr(i*29)*(100-coalPct-renewPct));const nuclearPct=Math.roun` |
| `investBn` | `+(sr(i*31)*80+2).toFixed(1);const subsidyBn=+(sr(i*37)*20+0.5).toFixed(1);const carbonPrice=Math.round(sr(i*41)*100);const evPct=+(sr(i*43)*30).toFixe` |
| `yearly` | `Array.from({length:6},(_,y)=>({year:2019+y,renewPct:Math.round(renewPct-10+y*3+sr(i*100+y)*3),gridIntensity:Math.round(gridIntensity+50-y*15+sr(i*100+` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgRenew:Math.round(filtered.reduce((s,r)=>s+r.renewablePct,0)/filtered.length\|\|0),totalCap:fmt(filtered.reduce((s` |
| `regionMix` | `useMemo(()=>{const m={};COUNTRIES.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,renew:0,coal:0,gas:0,nuclear:0,n:0};m[c.region].renew+=c.re` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.m` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/energy-transition/fleet-transition` | `fleet_transition` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/grid-ef-projection` | `grid_ef_projection` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/avoided-emissions` | `avoided_emissions` | api/v1/routes/energy_transition.py |
| POST | `/api/v1/energy-transition/country-comparison` | `country_comparison` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/fuel-types` | `ref_fuel_types` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/nze-milestones` | `ref_nze_milestones` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/replacement-options` | `ref_replacement_options` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/grid-ef-countries` | `ref_grid_countries` | api/v1/routes/energy_transition.py |
| GET | `/api/v1/energy-transition/ref/grid-ef-scenarios` | `ref_grid_scenarios` | api/v1/routes/energy_transition.py |

### 2.3 Engine `generation_transition` (services/generation_transition.py)
| Function | Args | Purpose |
|---|---|---|
| `GenerationTransitionPlanner.plan_transition` | fleet_name, plants, target_year, replacement_tech, carbon_price_eur_t, base_year | Generate a fleet transition plan. |
| `GenerationTransitionPlanner._auto_replace` | fuel_type | Select replacement technology based on original fuel type. |
| `GenerationTransitionPlanner._interpolate_nze` | year, base_emissions, base_year | Interpolate NZE target emissions for a given year. |
| `GenerationTransitionPlanner.get_fuel_types` |  |  |
| `GenerationTransitionPlanner.get_nze_milestones` |  |  |
| `GenerationTransitionPlanner.get_replacement_options` |  |  |

### 2.3 Engine `grid_ef_trajectory` (services/grid_ef_trajectory.py)
| Function | Args | Purpose |
|---|---|---|
| `GridEFTrajectoryEngine.project_grid_ef` | country, scenario, start_year, end_year | Project grid EF trajectory for a country under a scenario. |
| `GridEFTrajectoryEngine.avoided_emissions` | country, scenario, annual_generation_mwh, start_year, project_lifetime_years | Calculate avoided emissions for a renewable project. |
| `GridEFTrajectoryEngine.compare_countries` | countries, scenario | Compare grid EF trajectories across countries. |
| `GridEFTrajectoryEngine._interpolate_ef` | year, ef_base, scen, base_year | Interpolate grid EF for a given year using scenario target factors. |
| `GridEFTrajectoryEngine.get_countries` |  |  |
| `GridEFTrajectoryEngine.get_scenarios` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `renewable` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COLORS`, `REGIONF`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Grid Carbon Intensity (gCO2e/kWh) | — | IEA Electricity Statistics | Emission intensity of national electricity grid; IEA NZE 2050 global target <50 gCO2e/kWh by 2035. |
| Renewable Capacity Addition (GW/year) | — | IRENA Renewable Capacity Statistics | Annual new renewable capacity commissioned; IEA NZE requires 1,000 GW/year globally by 2030. |
| Stranded Asset Exposure ($Bn) | — | Carbon Tracker / IEA | NPV of unrecoverable capital in fossil generation assets facing early retirement under transition scenarios. |
| PPA Weighted Average Price ($/MWh) | — | BloombergNEF PPA Index | Corporate PPA clearing price by technology and region; benchmark for renewable procurement cost competitivenes |
- **IEA/IRENA capacity and generation statistics** → Aggregate by technology and region; compute annual capacity additions vs. NZE pathway → **Renewable build-out gap by region and technology (GW)**
- **Utility regulatory filings and asset registries** → Map plant-level capacity to fuel type and remaining life; apply stranding discount rate → **Stranded asset exposure by utility and scenario ($Bn)**
- **BloombergNEF PPA tracker** → Normalise by technology, tenor, and market structure → **Regional PPA price index and trend ($/MWh)**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/energy-transition/ref/fuel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coal_subcritical', 'coal_supercritical', 'coal_usc', 'gas_ocgt', 'gas_ccgt', 'gas_ccgt_ccs', 'oil', 'biomass', 'nuclear', 'wind_onshore', 'wind_offshore', 'solar_pv', 'hydro', 'battery'], 'n_`

**GET /api/v1/energy-transition/ref/grid-ef-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['DE', 'FR', 'NL', 'PL', 'ES', 'IT', 'GB', 'SE', 'US', 'CN', 'IN', 'JP', 'AU', 'BR', 'ZA', 'KR', 'CA', 'MX', 'ID', 'SA', 'AE', 'NG', 'EG', 'TH', 'VN'], 'n_keys': 25}`

**GET /api/v1/energy-transition/ref/grid-ef-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['current_policies', 'stated_policies', 'nze_2050', 'ngfs_orderly', 'ngfs_disorderly', 'ngfs_hot_house'], 'n_keys': 6}`

**GET /api/v1/energy-transition/ref/nze-milestones** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [2025, 2030, 2035, 2040, 2050], 'n_keys': 5}`

**GET /api/v1/energy-transition/ref/replacement-options** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': None}`

## 5 · Intermediate Transformation Logic
**Methodology:** Grid Carbon Intensity Trajectory
**Headline formula:** `CI_t = CI_0 × (1 − r)^t`
**Standards:** ['IEA NZE 2050', 'IRENA World Energy Transitions Outlook 2024', 'SBTi Power Sector']

**Engine `generation_transition` — extracted transformation lines:**
```python
p.annual_generation_mwh = p.capacity_mw * 8760 * p.capacity_factor_pct / 100
years_available = target_year - base_year
retire_year = base_year + int((i + 1) * years_available / num_fossil) if num_fossil > 0 else base_year
age = retire_year - plant.commissioning_year
co2_avoided = plant.annual_generation_mwh * ef
remaining_life = max(0, plant.commissioning_year + expected_life - retire_year)
stranded_frac = remaining_life / expected_life if expected_life > 0 else 0
stranded_value = plant.book_value_eur * stranded_frac
rep_cap = plant.capacity_mw * multiplier
yr_emissions = current_emissions - cumulative_saved
frac = (year - y0) / (y1 - y0) if y1 > y0 else 0
ef_yr = ef0 + (ef1 - ef0) * frac
```

**Engine `grid_ef_trajectory` — extracted transformation lines:**
```python
reduction = (1 - ef_2050 / ef_base) * 100 if ef_base > 0 else 0
yr = start_year + i
avoided = annual_generation_mwh * ef
avg_ef = ef_sum / project_lifetime_years if project_lifetime_years > 0 else 0
frac = (year - base_year) / (2030 - base_year) if 2030 > base_year else 0
factor = 1 + (f_2030 - 1) * frac
frac = (year - 2030) / 20
factor = f_2030 + (f_2050 - f_2030) * frac
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `generation_transition` (used by 3 modules), `grid_ef_trajectory` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `energy-transition-lending` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `energy-transition-dashboard` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |