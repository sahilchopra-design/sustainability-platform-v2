# Energy Transition Analytics
**Module ID:** `energy-transition-analytics` · **Route:** `/energy-transition-analytics` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks global and regional renewable energy build-out trajectories against IEA and IRENA decarbonisation pathways, monitoring grid decarbonisation rates and the financial exposure of stranded generation assets. Integrates capacity addition data, power purchase agreement analytics, and utility-level carbon intensity trends. Supports asset allocation, utility equity analysis, and infrastructure debt underwriting.

> **Business value:** Provides power sector analysts and infrastructure investors with a real-time view of transition velocity, enabling identification of under-valued renewable developers, over-exposed fossil generators, and grid decarbonisation financing opportunities across 50+ markets.

**How an analyst works this module:**
- Select region and technology focus (solar PV, onshore wind, offshore wind, storage, gas peakers).
- Choose IEA scenario (NZE/APS/STEPS) and project grid carbon intensity trajectory to 2050.
- Identify utilities or generators with highest stranded asset exposure under selected scenario and review asset-level detail.
- Export capacity build-out gap analysis and stranded asset report for investment committee or regulatory submission.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COLORS`, `COUNTRIES`, `REGIONF`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `totalCap` | `Math.round(50+sr(i*7)*1200);const renewPct=Math.round(15+sr(i*11)*55);const solarGW=Math.round(totalCap*renewPct/100*(sr(i*13)*0.4+0.2));const windGW=Math.round(totalCap*renewPct/100*(sr(i*17)*0.3+0.15));const hydroGW=Ma` |
| `gridIntensity` | `Math.round(100+sr(i*19)*600);const coalPct=Math.round(sr(i*23)*50);const gasPct=Math.round(sr(i*29)*(100-coalPct-renewPct));const nuclearPct=Math.round(100-coalPct-gasPct-renewPct);` |
| `investBn` | `+(sr(i*31)*80+2).toFixed(1);const subsidyBn=+(sr(i*37)*20+0.5).toFixed(1);const carbonPrice=Math.round(sr(i*41)*100);const evPct=+(sr(i*43)*30).toFixed(1);` |
| `yearly` | `Array.from({length:6},(_,y)=>({year:2019+y,renewPct:Math.round(renewPct-10+y*3+sr(i*100+y)*3),gridIntensity:Math.round(gridIntensity+50-y*15+sr(i*100+y*3)*20),invest:+(investBn/6+sr(i*100+y*7)*5).toFixed(1)}));` |
| `filtered` | `useMemo(()=>{let d=[...COUNTRIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(regionF!=='All')d=d.filter(r=>r.region===regionF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,regionF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((p` |
| `stats` | `useMemo(()=>({count:filtered.length,avgRenew:Math.round(filtered.reduce((s,r)=>s+r.renewablePct,0)/filtered.length\|\|0),totalCap:fmt(filtered.reduce((s,r)=>s+r.totalCapGW,0)),totalInvest:'$'+filtered.reduce((s,r)=>s+r.inv` |
| `regionMix` | `useMemo(()=>{const m={};COUNTRIES.forEach(c=>{if(!m[c.region])m[c.region]={region:c.region,renew:0,coal:0,gas:0,nuclear:0,n:0};m[c.region].renew+=c.renewablePct;m[c.region].coal+=c.coalPct;m[c.region].gas+=c.gasPct;m[c.r` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type` |

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

**Engine `generation_transition` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `REPLACEMENT_PRIORITY` | `['solar_pv', 'wind_onshore', 'wind_offshore', 'battery', 'gas_ccgt', 'gas_ccgt_ccs', 'hydro', 'nuclear']` |

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
| PPA Weighted Average Price ($/MWh) | — | BloombergNEF PPA Index | Corporate PPA clearing price by technology and region; benchmark for renewable procurement cost competitiveness. |
- **IEA/IRENA capacity and generation statistics** → Aggregate by technology and region; compute annual capacity additions vs. NZE pathway → **Renewable build-out gap by region and technology (GW)**
- **Utility regulatory filings and asset registries** → Map plant-level capacity to fuel type and remaining life; apply stranding discount rate → **Stranded asset exposure by utility and scenario ($Bn)**
- **BloombergNEF PPA tracker** → Normalise by technology, tenor, and market structure → **Regional PPA price index and trend ($/MWh)**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/energy-transition/ref/fuel-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['coal_subcritical', 'coal_supercritical', 'coal_usc', 'gas_ocgt', 'gas_ccgt', 'gas_ccgt_ccs', 'oil', 'biomass', 'nuclear', 'wind_onshore', 'wind_offshore', 'solar_pv', 'hydro', 'battery'], 'n_keys': 14}`

**GET /api/v1/energy-transition/ref/grid-ef-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['DE', 'FR', 'NL', 'PL', 'ES', 'IT', 'GB', 'SE', 'US', 'CN', 'IN', 'JP', 'AU', 'BR', 'ZA', 'KR', 'CA', 'MX', 'ID', 'SA', 'AE', 'NG', 'EG', 'TH', 'VN'], 'n_keys': 25}`

**GET /api/v1/energy-transition/ref/grid-ef-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['current_policies', 'stated_policies', 'nze_2050', 'ngfs_orderly', 'ngfs_disorderly', 'ngfs_hot_house'], 'n_keys': 6}`

**GET /api/v1/energy-transition/ref/nze-milestones** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [2025, 2030, 2035, 2040, 2050], 'n_keys': 5}`

**GET /api/v1/energy-transition/ref/replacement-options** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 8, 'item0_keys': None}`

**POST /api/v1/energy-transition/avoided-emissions** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/energy-transition/country-comparison** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/energy-transition/fleet-transition** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Grid Carbon Intensity Trajectory
**Headline formula:** `CI_t = CI_0 × (1 − r)^t`

Projects grid emission intensity (gCO2e/kWh) using a compound annual decarbonisation rate calibrated to NZE pathway benchmarks by region. Stranded asset value is computed as the NPV of foregone revenue from fossil generation capacity retired ahead of end-of-technical-life, discounted at the utility WACC plus a stranding risk premium.

**Standards:** ['IEA NZE 2050', 'IRENA World Energy Transitions Outlook 2024', 'SBTi Power Sector']
**Reference documents:** IEA Net Zero by 2050 Roadmap 2023; IRENA World Energy Transitions Outlook 2024; Carbon Tracker â€” The Future's Not in Plastics 2023; BloombergNEF New Energy Outlook 2024; SBTi Power Sector Science-Based Target Guidance

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
**Blast radius:** changes here can affect **3** other module(s).
**Shared engines (edits propagate!):** `generation_transition` (used by 4 modules), `grid_ef_trajectory` (used by 4 modules)

| Connected module | Shared via |
|---|---|
| `energy-transition-dashboard` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `energy-transition-credit-portal` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |
| `energy-transition-lending` | engine:generation_transition, engine:grid_ef_trajectory, table:renewable |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (frontend↔backend) split.** The guide describes a grid-carbon-intensity trajectory
> `CI_t = CI_0×(1−r)^t` plus stranded-asset NPV. A **real backend engine** (`grid_ef_trajectory.py`)
> implements a country-level grid-EF projection with authentic 2023 baselines — but the **displayed
> page** (`EnergyTransitionAnalyticsPage.jsx`) does **not call it**; it renders 30 fully-synthetic
> countries generated by the `sr()` PRNG. So there are two methodologies: the sound backend engine
> (§7.1a) and the synthetic frontend layer (§7.1b) the user actually sees. Note also the backend uses
> **piecewise-linear factor interpolation**, not the guide's compound `(1−r)^t` decay.

### 7.1a Backend engine — `GridEFTrajectoryEngine` (real)

Real 2023 grid emission factors (tCO₂/MWh) for 25 countries — accurate: France 0.06, Sweden 0.01,
Germany 0.38, US 0.39, China 0.58, India 0.72, South Africa 0.90. Trajectory interpolation to
scenario target factors:

```python
if year <= 2030:  factor = 1 + (f_2030 − 1)·(year−2023)/(2030−2023)
elif year <= 2050: factor = f_2030 + (f_2050 − f_2030)·(year−2030)/20
ef(year) = max(0, ef_base × factor)
reduction% = (1 − ef_2050/ef_base)×100
```

Avoided emissions for a renewable project:
```python
avoided_t = annual_generation_MWh × grid_ef(year)   # summed over lifetime
total_avoided = Σ_t avoided_t ;  avg_ef = mean(grid_ef)
```

### 7.1b Frontend page — synthetic 30-country layer (displayed)

```js
totalCap      = 50 + sr(i·7)·1200          // GW
renewPct      = 15 + sr(i·11)·55           // %
solarGW       = totalCap·renewPct/100·(sr·0.4+0.2)
gridIntensity = 100 + sr(i·19)·600         // gCO₂/kWh — INDEPENDENT of renewPct
coalPct/gasPct/nuclearPct  // random split
yearly[y]     = { renewPct−10+y·3+noise, gridIntensity+50−y·15+noise, invest }
```

The 6-year `yearly` trend hard-codes an improving path (renew +3pp/yr, intensity −15/yr); grid
intensity is drawn independently of the renewable share, so the scatter of "Renewable% vs Grid
Intensity" has no built-in causal slope.

### 7.2 Parameterisation / scoring rubric

Backend scenario reduction (real, IEA/NGFS-consistent):

| Scenario | Annual reduction | 2030 factor | 2050 factor |
|---|---|---|---|
| Current Policies | 1.5% | 0.88 | 0.55 |
| Stated Policies (STEPS) | 2.5% | 0.78 | 0.30 |
| NZE 2050 | 5.5% | 0.55 | 0.00 |
| NGFS Orderly (Below 2°C) | 4.0% | 0.65 | 0.08 |
| NGFS Disorderly (Delayed) | 1.0% | 0.92 | 0.15 |
| NGFS Hot House | 0.5% | 0.95 | 0.65 |

Frontend country attributes (renewPct, gridIntensity, investBn, netZeroTarget, storageMW…) are all
`sr()`-random around plausible ranges — country *names* are real (China, USA, India…) but their
attributes are synthetic.

### 7.3 Calculation walkthrough

**Backend:** pick country + scenario → look up 2023 baseline EF → interpolate to 2030/2050 target
factors → yearly EF trajectory → for a project, multiply annual generation by each year's grid EF for
avoided emissions; `compare_countries` ranks cleanest/dirtiest 2030 and fastest decarboniser.
**Frontend:** generate 30 synthetic countries → filter/sort/paginate → KPIs (avg renewable, total
capacity, avg grid intensity) → per-country drill-down panel with energy-mix pie and transition trend.

### 7.4 Worked example (backend engine)

Germany (`ef_base = 0.38`) under **NZE 2050** (`f_2030 = 0.55`, `f_2050 = 0.00`), avoided emissions
for a 50,000 MWh/yr solar project starting 2025:
```
ef(2025) = 0.38 × [1 + (0.55−1)·(2025−2023)/7] = 0.38 × [1 − 0.45·0.2857] = 0.38 × 0.871 = 0.331
avoided(2025) = 50,000 × 0.331 = 16,550 tCO₂
ef(2030) = 0.38 × 0.55 = 0.209 ;  avoided(2030) = 50,000 × 0.209 = 10,450 tCO₂
ef(2040) = 0.38 × (0.55 + (0−0.55)·10/20) = 0.38 × 0.275 = 0.1045
```
Avoided emissions **fall over time** because the grid it displaces decarbonises — the key insight that
a renewable's avoided-emissions credit erodes as the counterfactual grid cleans up. Germany's
`reduction% = (1 − 0/0.38)×100 = 100%` under NZE (target 2050 factor 0).

### 7.5 Companion analytics

- **Frontend:** energy-mix-by-region stacks, solar/wind top-15 rankings, storage & H₂ landscape,
  grid-decarbonisation trends, investment flows; CSV export.
- **Backend API** (`/api/v1/energy-transition/*`): fuel-types, grid-EF countries/scenarios, NZE
  milestones, replacement options, avoided-emissions, country-comparison, fleet-transition — the
  endpoints exist and the engine is sound, but the page's charts are driven by the synthetic layer.

### 7.6 Data provenance & limitations

- **Backend baselines are real** (2023 grid EFs, IEA/Ember-consistent); scenario factors track
  IEA WEO / NGFS. **Frontend country data is synthetic**, seeded by `sr()`.
- The two do not connect in the displayed page — the sound avoided-emissions engine is not the source
  of the on-screen numbers.
- Trajectory is **piecewise-linear factor interpolation**, not the guide's compound `(1−r)^t`; the
  stated `annual_reduction_pct` is descriptive, not the actual interpolation driver.

**Framework alignment:** **IEA World Energy Outlook / NZE 2050** — the grid-EF scenario factors and
the <50 gCO₂/kWh-by-2035 ambition; **NGFS Phase IV** — the Orderly/Disorderly/Hot-House scenario set;
**UNFCCC CDM ACM0002 / combined-margin** — the avoided-emissions method (project generation × grid
displacement EF), cited in the engine docstring; **Ember Global Electricity Review** — the baseline
grid-intensity source. The compound-decay `CI_t = CI_0(1−r)^t` in the guide is a simplification of the
engine's target-factor interpolation.

## 9 · Future Evolution

### 9.1 Evolution A — Connect the seeded country dashboard to the real transition engines (analytics ladder: rung 2 → 3)

**What.** The module has a split personality: two genuine backend engines — `GenerationTransitionPlanner` (fleet transition plans with replacement priorities, NZE interpolation, carbon pricing) and `GridEFTrajectoryEngine` (country grid-EF projections, avoided emissions, cross-country comparison) across 9 endpoints with ref data lineage-`passed` — while the page renders an entirely `sr()`-seeded country table (`totalCap = 50 + sr(i·7)·1200`, seeded grid intensities, seeded investment and yearly trends) that never calls them. Evolution A wires the page to the engines and grounds the engines' country factors.

**How.** (1) Page rebuild: country rows from `GET /ref/grid-ef-countries` + `POST /grid-ef-projection` per scenario; the seeded `COUNTRIES` generator deleted. Fleet-level tabs call `POST /fleet-transition` with plants from the `energy-asset-registry` (its GPPD-backed Evolution A gives real fleets to plan against). (2) Engine data upgrade: grid EF baselines and capacity mixes refreshed from Ember/IEA public statistics via an ingester, replacing authored constants, with vintages disclosed in `ref/grid-ef-scenarios`. (3) Rung 3: validate projected trajectories against realized grid-EF history (Ember publishes annual actuals — backtest the interpolation's 2020–2024 predictions) and bench-pin `_interpolate_nze`/`_interpolate_ef` plus one avoided-emissions worked example. (4) The overview's stranded-asset and PPA claims either get real computations (stranding via the registry's retirement data) or leave the overview.

**Prerequisites.** Registry Evolution A for fleet inputs; Ember ingester. **Acceptance:** lineage re-sweep shows all 4 POSTs `passed`; a country's on-page trajectory equals the engine's projection; backtest error vs realized grid EF published in the response; zero `sr()` in the page's data path.

### 9.2 Evolution B — Transition-velocity analyst for utility and infrastructure IC memos (LLM tier 2)

**What.** A tool-calling analyst for the module's stated investment workflow: "compare Poland and Vietnam's grid decarbonization under APS, quantify avoided emissions for a 500 GWh/yr solar project in each, and recommend which fleet-transition plan retires coal fastest under €90/t." It chains `POST /country-comparison` → `/avoided-emissions` → `/fleet-transition` and drafts the IC-ready comparison with every number from engine output, including the scenario metadata from `ref/grid-ef-scenarios` so the scenario definitions cited match the engine's, not the model's memory.

**How.** Tool schemas from the 9 existing OpenAPI operations (Pydantic-typed, ready today); grounding corpus = this Atlas record's §2.3 (engine functions and the `REPLACEMENT_PRIORITY` constant, which explains *why* the planner picks solar before CCGT). What-ifs are typed parameter changes (carbon price, target year, replacement tech override). Validator covers tCO₂e, GW, and €/t figures; the refusal path covers what the engines don't model — PPA pricing, market-clearing effects — with a pointer to the honest §4 gap.

**Prerequisites (hard).** Evolution A's page-wiring and data grounding — a copilot quoting engine outputs beside a page of seeded numbers would contradict itself, and current engine country factors are authored constants pending the Ember refresh. **Acceptance:** a golden two-country memo reproduces from scripted calls; scenario descriptions match `ref` metadata verbatim; asking for PPA benchmarks refuses.