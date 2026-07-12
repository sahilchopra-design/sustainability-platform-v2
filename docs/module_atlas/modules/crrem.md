# CRREM Pathway Analytics
**Module ID:** `crrem` · **Route:** `/crrem` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses real estate portfolio decarbonisation against Carbon Risk Real Estate Monitor (CRREM) stranding pathways, computing asset-level stranding years, retrofit investment requirements, and portfolio-level alignment with 1.5°C and 2°C real estate pathways.

> **Business value:** Enables real estate investors and asset managers to identify stranding risk in their property portfolios, prioritise retrofit investment, and disclose alignment with science-based real estate decarbonisation pathways per TCFD and SFDR requirements.

**How an analyst works this module:**
- Upload property portfolio with EUI, EPC ratings, asset type, and country codes
- CRREM Pathway tab plots asset EUI vs country/type-specific pathway with stranding crossover
- Portfolio Heatmap shows stranding risk by geography and property type
- Retrofit Planner tab models capex scenarios to delay or eliminate stranding
- GRESB Alignment tab maps findings to GRESB Real Estate Assessment indicators
- Export CRREM portfolio report for TCFD/SFDR real estate climate risk disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BULK_IMPORT_PROPERTIES`, `COLORS_8`, `CONSTRUCTION_TYPES`, `COUNTRIES`, `CRREM_PATHWAYS`, `DEFAULT_RE_PORTFOLIO`, `EPC_RATINGS`, `LS_KEY`, `PATHWAY_YEARS`, `PIE_COLORS`, `PROPERTY_TYPES`, `TYPE_FILTER`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `BULK_IMPORT_PROPERTIES` | 67 | `name`, `type`, `city`, `country`, `countryCode`, `lat`, `lon`, `gfa_m2`, `nla_m2`, `floors`, `year_built`, `year_renovated`, `construction`, `epc_rating`, `epc_score`, `energy_intensity_kwh`, `carbon_intensity_kgco2`, `scope1_tco2e`, `scope2_tco2e_location`, `scope2_tco2e_market` |
| `TABS` | 5 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n,d=0) => n == null ? '-' : Number(n).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});` |
| `fmtPct` | `n => n == null ? '-' : `${Number(n).toFixed(1)}%`;` |
| `fmtMn` | `n => n == null ? '-' : `$${Number(n).toFixed(1)}Mn`;` |
| `pts` | `PATHWAY_YEARS.map(y => ({ year: y, val: pathwayObj[y] }));` |
| `frac` | `(y - lower.year) / (upper.year - lower.year);` |
| `badge` | `(bg, c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:bg, color:c });` |
| `clamped` | `Math.max(0, Math.min(100, Number(value) \|\| 0));` |
| `diff` | `clamped - oldVal;` |
| `othersTotal` | `others.reduce((s, k) => s + mix[k], 0);` |
| `total` | `Object.values(mix).reduce((s, v) => s + v, 0);` |
| `existing` | `new Set(props.map(p => p.id));` |
| `avgEnergy` | `f.reduce((s,p) => s+p.energy_intensity_kwh,0)/f.length;` |
| `avgCarbon` | `f.reduce((s,p) => s+p.carbon_intensity_kgco2,0)/f.length;` |
| `totalGFA` | `f.reduce((s,p) => s+p.gfa_m2,0);` |
| `totalGAV` | `f.reduce((s,p) => s+p.gav_usd_mn,0);` |
| `totalS1` | `f.reduce((s,p) => s+p.scope1_tco2e,0);` |
| `totalS2` | `f.reduce((s,p) => s+p.scope2_tco2e_location,0);` |
| `avgRenewable` | `f.reduce((s,p) => s+p.renewable_share_pct,0)/f.length;` |
| `avgOccupancy` | `f.reduce((s,p) => s+p.occupancy_pct,0)/f.length;` |
| `avgGreenLease` | `f.reduce((s,p) => s+p.green_lease_pct,0)/f.length;` |
| `avgStrand` | `strandings.reduce((s,v)=>s+v,0)/strandings.length;` |
| `totalNOI` | `f.reduce((s,p)=>s+p.noi_usd_mn,0);` |
| `avgWater` | `f.reduce((s,p)=>s+p.water_intensity_l_m2,0)/f.length;` |
| `euTaxAlignedPct` | `f.length ? Math.round(euTaxAligned / f.length * 100) : 0;` |
| `decline` | `sel.carbon_intensity_kgco2 * Math.pow(0.985, y - 2026);` |
| `sortedTable` | `useMemo(() => { const dir = sortDir === 'asc' ? 1 : -1;` |
| `energyMixData` | `useMemo(() => filtered.map(p => ({ name: p.name.length > 18 ? p.name.slice(0,16)+'..' : p.name, grid: p.energy_source_mix.grid, gas: p.energy_source_mix.gas, solar: p.energy_source_mix.solar, wind: p.energy_source_mix.wi` |
| `scopePie` | `useMemo(() => { const s1 = filtered.reduce((s,p)=>s+p.scope1_tco2e,0);` |
| `annualSavingsKwh` | `sel.energy_intensity_kwh * sel.gfa_m2 * (r.savings_kwh_pct/100);` |
| `annualSavingsUSD` | `annualSavingsKwh * 0.12 / 1e6;` |
| `npv` | `Array.from({length:20},(_,i)=>annualSavingsUSD/Math.pow(1+discountRate,i+1)).reduce((a,b)=>a+b,0) - r.cost_usd_mn;` |
| `annualCarbonReduction` | `sel.carbon_intensity_kgco2 * sel.gfa_m2 * (r.carbon_reduction_pct/100) / 1000;` |
| `abatementCost` | `annualCarbonReduction > 0 ? (r.cost_usd_mn * 1e6) / (annualCarbonReduction * 20) : 0;` |
| `enabledMeasures` | `sel.renovation.filter((_, i) => renovToggles[sel.id + '_' + i]);` |
| `totalCapex` | `enabledMeasures.reduce((s, m) => s + m.cost_usd_mn, 0);` |
| `totalSavingsPct` | `Math.min(80, enabledMeasures.reduce((s, m) => s + m.savings_kwh_pct, 0));` |
| `totalCarbonPct` | `Math.min(80, enabledMeasures.reduce((s, m) => s + m.carbon_reduction_pct, 0));` |
| `adjustedEnergy` | `sel.energy_intensity_kwh * (1 - totalSavingsPct / 100);` |
| `adjustedCarbon` | `sel.carbon_intensity_kgco2 * (1 - totalCarbonPct / 100);` |
| `totalSavingsUSD` | `sel.energy_intensity_kwh * sel.gfa_m2 * (totalSavingsPct / 100) * 0.12 / 1e6;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/crrem/assess` | `crrem_assess` | api/v1/routes/crrem_green_buildings.py |
| POST | `/api/v1/crrem/retrofit-plan` | `retrofit_plan` | api/v1/routes/crrem_green_buildings.py |
| POST | `/api/v1/crrem/green-premium` | `green_premium` | api/v1/routes/crrem_green_buildings.py |
| POST | `/api/v1/crrem/gresb-score` | `gresb_score` | api/v1/routes/crrem_green_buildings.py |
| GET | `/api/v1/crrem/ref/crrem-pathways` | `ref_crrem_pathways` | api/v1/routes/crrem_green_buildings.py |
| GET | `/api/v1/crrem/ref/retrofit-measures` | `ref_retrofit_measures` | api/v1/routes/crrem_green_buildings.py |
| GET | `/api/v1/crrem/ref/epc-benchmarks` | `ref_epc_benchmarks` | api/v1/routes/crrem_green_buildings.py |
| GET | `/api/v1/crrem/ref/certifications` | `ref_certifications` | api/v1/routes/crrem_green_buildings.py |

### 2.3 Engine `crrem_green_buildings_engine` (services/crrem_green_buildings_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_interpolate_pathway` | pathway_years, year, metric | Linear interpolation between two pathway waypoints for a given year. |
| `_find_stranding_year` | current_intensity, pathway, metric, start_year, end_year | Find the first year where the current (static) intensity exceeds the pathway target. |
| `_get_epc_rating` | energy_intensity, country_iso3 |  |
| `_npv_measure` | annual_saving_eur, capex_eur, lifetime_yr, discount_rate | NPV of a retrofit measure over its lifetime. |
| `assess_crrem_alignment` | asset_data | Assess CRREM pathway alignment for a real estate asset. Returns: gap%, stranding year (1.5C and 2C), risk tier, and pathway context. |
| `calculate_retrofit_plan` | asset_data, target_epc | Rank retrofit measures by NPV and produce a sequenced capex plan to reach target EPC. Returns: ranked measures, total capex, total annual savings, simple payback. |
| `calculate_green_premium` | building_type, country_iso3, epc_rating | Return green certification premium and brown discount risk for an asset. |
| `assess_gresb_score` | aspect_scores | Calculate GRESB score and peer positioning. |

**Engine `crrem_green_buildings_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `EPC_RATING_ORDER` | `['A', 'B', 'C', 'D', 'E', 'F', 'G']` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `__future__` *(shared)*, `aspect`, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `BULK_IMPORT_PROPERTIES`, `COLORS_8`, `CONSTRUCTION_TYPES`, `COUNTRIES`, `EPC_RATINGS`, `PATHWAY_YEARS`, `PIE_COLORS`, `PROPERTY_TYPES`, `TABS`, `TYPE_FILTER`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio % Stranded (1.5°C, 2030) | — | CRREM v2.0 | Proportion of portfolio by value stranded against 1.5°C pathway by 2030 |
| Average EUI | — | EPCs / energy metering | Portfolio-average energy use intensity; EU standard is <100 kWh/m²/yr for NZEB |
| Retrofit Capex Required | — | BREEAM cost models | Estimated deep retrofit capex to achieve EPC A/B rating and CRREM pathway compliance |
| Stranding Year (median asset) | — | CRREM model | Median year at which portfolio assets become stranded against 1.5°C pathway |
| Carbon Intensity | — | GHG Protocol RE Standard | Operational carbon intensity; CRREM 1.5°C pathway target <10 kgCO₂e/m²/yr by 2050 |
- **EPC certificates and energy meter data** → Compute EUI per asset, match to CRREM country/type pathway → **Asset-level EUI vs pathway gap**
- **CRREM v2.0 pathway database** → Interpolate annual pathway targets by country, type, and scenario → **Stranding year per asset**
- **BREEAM retrofit cost benchmarks** → Estimate retrofit capex to achieve target EUI by asset type → **Retrofit investment requirement per asset**

## 5 · Intermediate Transformation Logic
**Methodology:** CRREM Stranding Analysis
**Headline formula:** `StrandingYear = min{t : EUI(t) > CRREM_pathway(t, asset_type, country)}`

Energy Use Intensity (EUI, kWh/m²/yr) is compared annually against CRREM country and property-type specific decarbonisation pathways. Assets with EUI above the pathway in a given year are classified as stranded in that year. CRREM pathways are derived from IPCC 1.5°C and 2°C carbon budgets allocated to the building sector using a sectoral convergence approach. Retrofit capex is estimated using BREEAM-calibrated benchmarks by property type.

**Standards:** ['CRREM v2.0 2023', 'GRESB Infrastructure Assessment', 'EU EPC Minimum Standards']
**Reference documents:** CRREM Carbon Risk Real Estate Monitor v2.0 (2023); GRESB Real Estate Assessment Framework; EU Energy Performance of Buildings Directive 2024 Recast; IPCC AR6 Buildings Sector Decarbonisation Pathway

**Engine `crrem_green_buildings_engine` — extracted transformation lines:**
```python
t = (year - y0) / (y1 - y0)
pv = annual_saving_eur * lifetime_yr
pv = annual_saving_eur * (1 - (1 + discount_rate) ** (-lifetime_yr)) / discount_rate
ei_gap_pct = ((current_ei - pathway_ei_now) / pathway_ei_now * 100) if pathway_ei_now > 0 else 0.0
ci_gap_pct = ((current_ci - pathway_ci_now) / pathway_ci_now * 100) if pathway_ci_now > 0 else 0.0
yrs_to_strand = stranding_year - base_year
yrs = max(0, stranding_year - base_year)
haircut_pct = min(40.0, 40.0 * (1 - yrs / 25.0)) if yrs < 25 else 0.0
npv_risk = asset_value * haircut_pct / 100
annual_energy_saving_eur = energy_saved_kwh_m2 * energy_cost * floor_area / 1000  # energy_cost per kWh approx
carbon_saved_tonne = energy_saved_kwh_m2 * 0.2 * floor_area / 1000
annual_carbon_saving_eur = carbon_saved_tonne * carbon_price
total_annual_saving = annual_energy_saving_eur + annual_carbon_saving_eur
simple_payback = round(total_capex / total_annual_saving, 1) if total_annual_saving > 0 else None
total_pct = round(total_score / total_max * 100, 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `modern-slavery-intel` | table:exc |
| `supply-chain-resilience` | table:exc |
| `climate-underwriting-workbench` | table:exc |
| `battery-revenue-stacker` | table:exc |

## 7 · Methodology Deep Dive

The guide matches the code closely: this module implements genuine **CRREM stranding analysis** —
`StrandingYear = min{t : EUI(t) > CRREM_pathway(t, type, scenario)}` — with real crossover logic,
linear pathway interpolation, retrofit NPV/abatement-cost economics, and portfolio roll-ups over a
30-property default portfolio (persisted to `localStorage`). No PRNG drives any headline figure. The
one simplification to flag is that the embedded `CRREM_PATHWAYS` table is a **curated approximation**
of CRREM v2 pathways (per-type carbon-intensity trajectories), not the licensed CRREM dataset, and it
is expressed in carbon intensity (kgCO₂/m²) rather than EUI.

### 7.1 What the module computes

For each property, the module compares its `carbon_intensity_kgco2` against a type- and
scenario-specific decarbonisation pathway and finds the first year it exceeds the pathway:

```js
interpolatePathway(pathwayObj):                       // 5-yearly points → annual, linear
  frac = (y − lower.year) / (upper.year − lower.year)
  val  = lower.val + (upper.val − lower.val)·frac
computeStrandYear(carbonIntensity, typeKey, scenario):
  for p in path (2020..2050): if carbonIntensity > p.val return p.year
  return '>2050'                                       // never stranded within horizon
```

Retrofit economics (real DCF):
```js
annualSavingsKwh = EUI · GFA · savings_kwh_pct/100
annualSavingsUSD = annualSavingsKwh · $0.12/kWh / 1e6           // energy tariff
npv = Σ_{i=1..20} annualSavingsUSD/(1+r)^i − cost_usd_mn         // 20-yr NPV
abatementCost = annualCarbonReduction>0 ? cost·1e6/(reduction·20) : 0   // $/tCO2e over 20yr
```

### 7.2 Parameterisation / scoring rubric

| Parameter | Value | Provenance |
|---|---|---|
| Pathway table | 9 types × 3 scenarios × 7 anchor years (kgCO₂/m²/yr) | curated approximation of CRREM v2 pathways |
| Scenarios | `1.5`, `WB2` (well-below-2°C), `2.0` | CRREM scenario set |
| e.g. Office 1.5°C 2030 target | (see `CRREM_PATHWAYS.Office`) declining to 0 by 2050 | curated |
| DataCentre 1.5°C | 250→0 kgCO₂/m² (highest-intensity type) | curated, reflects DC energy load |
| Energy tariff | `$0.12/kWh` | hard-coded assumption |
| Retrofit discount rate | `discountRate` (default set in state) | user-set |
| NPV horizon | 20 years | modelling choice |
| Carbon-decline preview | `carbon·0.985^(y−2026)` (≈1.5%/yr) | illustrative asset trajectory |
| Retrofit stacking caps | `min(80%, Σ savings)`, `min(80%, Σ carbon)` | prevents >100% reduction |

The pathways are internally consistent (all converge toward 0 at 2050 for 1.5°C; higher terminal
values for 2.0°C) and ordered by property-type energy intensity — a faithful reproduction of CRREM's
*shape*, if not its exact licensed values.

### 7.3 Calculation walkthrough

Portfolio loaded → filtered → per-property stranding computed via `computeStrandYear`. Portfolio KPIs
aggregate real fields (avg EUI, avg carbon intensity, total GFA/GAV/Scope1/Scope2, avg renewable
share, avg stranding year, count stranded before 2030, EU-taxonomy-aligned %). Retrofit Planner
toggles measures (`renovToggles`), stacks their savings/carbon-reduction percentages (capped 80%),
recomputes adjusted EUI/carbon and re-runs the stranding crossover to show a *delayed* stranding year.

### 7.4 Worked example (Office asset, 1.5°C)

Take an Office with `carbon_intensity_kgco2 = 45`. The Office 1.5°C pathway interpolates between
anchor points; suppose the annual pathway value drops below 45 in year **2028** (between the 2025 and
2030 anchors). Then:

```
computeStrandYear(45, 'Office', '1.5') = 2028   (first year 45 > pathway(y))
```
Apply a retrofit stack (LED 10% + HVAC 16% carbon → say 22% carbon reduction, capped):
```
adjustedCarbon = 45·(1 − 0.22) = 35.1 kgCO₂/m²
```
Re-running the crossover pushes the stranding year later (e.g. 2033) — the delay is the retrofit's
value. Retrofit NPV: a $2.0M HVAC upgrade saving 16% of (EUI·GFA)·$0.12/kWh, discounted 20 years, net
of $2.0M, yields the displayed NPV; abatement cost = `$2.0M / (annual tCO₂ saved × 20)`.

### 7.5 Companion analytics

Energy-source-mix stacked bars (grid/gas/solar/wind/district per property), Scope 1/2 pie, GRESB
alignment, physical-risk overlays (flood/cyclone/wildfire/heatwave/drought/sea-level per property),
and a sortable property table. EU-taxonomy alignment flag per property feeds `euTaxAlignedPct`.

### 7.6 Data provenance & limitations

- **Property data is a curated 30-asset demo portfolio** (named funds, plausible EUI/carbon/GAV
  fields), persisted to `localStorage`; not seeded via PRNG but not real assets either.
- **Pathways are a simplified reproduction** of CRREM v2, in carbon intensity not EUI; the licensed
  CRREM dataset has country×type granularity this table lacks (it is type×scenario only).
- Stranding is a hard crossover (no partial/probabilistic stranding); retrofit stacking is additive
  with an 80% cap rather than an engineering interaction model; single $0.12/kWh tariff worldwide.

**Framework alignment:** CRREM v2 (Carbon Risk Real Estate Monitor — 1.5°C/WB2°C/2°C decarbonisation
pathways derived from IPCC sectoral carbon budgets allocated to buildings via convergence); GRESB Real
Estate Assessment (companion tab); EU EPBD / EPC minimum standards; GHG Protocol RE operational
carbon. The stranding-crossover and retrofit-NPV logic faithfully implement CRREM's decision framework;
only the pathway values are approximated rather than licensed.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (The stranding and NPV logic *are*
implemented; what is missing is the **licensed CRREM pathway dataset with country×type granularity**
and an EUI-based rather than carbon-intensity-based comparison.)

**8.1 Purpose & scope.** Asset- and portfolio-level stranding risk for real estate against
science-based decarbonisation pathways, with retrofit capex optimisation, for TCFD/SFDR real-estate
climate disclosure.

**8.2 Conceptual approach.** The canonical **CRREM v2** method — dual EUI (kWh/m²) *and* GHG-intensity
(kgCO₂/m²) crossover against country- and type-specific 1.5°C pathways — benchmarked against **GRESB**
transition indicators and **PCAF** real-estate financed-emissions accounting.

**8.3 Mathematical specification.**
```
Pathway_{c,type,scen}(t)  = licensed CRREM v2 annual grid-decarbonised trajectory
GHGintensity(t) = (Scope1 + Scope2_location·GridEF_c(t)) / GFA        # grid greening over time
StrandYear = min{t : GHGintensity(t) > Pathway_{c,type,scen}(t)}
ExcessCarbon = Σ_{t≥StrandYear} (GHGintensity(t) − Pathway(t))·GFA    # cumulative overshoot
RetrofitNPV = Σ_t [ΔEnergy·Tariff_c(t) + ΔCarbon·CarbonPrice(t)]·DF(t) − Capex
```

| Parameter | Source |
|---|---|
| `Pathway_{c,type,scen}` | CRREM v2 licensed dataset (country×type×scenario) |
| `GridEF_c(t)` | IEA / national grid decarbonisation projections |
| `Tariff_c(t)` | national energy price forecasts (IEA WEO) |
| `CarbonPrice(t)` | EU ETS forward curve / internal price |

**8.4 Data requirements.** Per-asset EUI + GHG intensity, country, type, GFA; grid EF trajectory by
country; retrofit cost/savings library; carbon-price curve. The platform already holds asset fields
and retrofit measures; the licensed CRREM pathway grid and grid-EF time series are the additions.

**8.5 Validation & benchmarking.** Reconcile stranding years to CRREM's own tool for sample assets;
verify grid-greening improves stranding correctly; benchmark portfolio %-stranded against GRESB peer
percentiles; retrofit NPV cross-checked with quantity-surveyor cost models.

**8.6 Limitations & model risk.** Pathway licensing and country granularity are the main gaps; grid-EF
forecasts dominate long-horizon stranding; retrofit interactions are non-additive in reality.
Fallback: report stranding under all three scenarios and flag assets sensitive to grid assumptions.

## 9 · Future Evolution

### 9.1 Evolution A — Country×type pathway granularity and real portfolio ingestion (analytics ladder: rung 2 → 3)

**What.** This module is genuinely what it claims: real stranding-crossover logic
(`min{t : intensity > pathway(t)}`) with linear interpolation, real retrofit DCF
(20-yr NPV, abatement cost), no PRNG on any headline figure. §7.6 scopes the honest
gaps: the embedded `CRREM_PATHWAYS` table is a curated *approximation* of CRREM v2 —
type×scenario only, missing the licensed dataset's country×type granularity, and
expressed in carbon intensity rather than EUI; the tariff is a single $0.12/kWh
worldwide; the 30-asset portfolio is a curated demo in `localStorage`. With 46
dependent modules, pathway fidelity here matters platform-wide.

**How.** (1) Pathway upgrade: CRREM publishes downloadable pathway data for many
country×type combinations — ingest into a versioned `crrem_pathways` refdata table
(respecting license terms; where unlicensed, keep the approximation explicitly
badged), and support both intensity and EUI tracks as CRREM v2 does. (2) Tariff
matrix: country-level electricity tariffs (Eurostat/EIA, public) replace the flat
$0.12, making retrofit NPV geography-aware. (3) Portfolio ingestion: the promised
upload path lands assets in a backend table instead of `localStorage`, joining the
UK EPC ingest where applicable (shared with `commercial-re-climate-risk`'s
evolution — one building-data layer, two consumers). (4) Benchmark: validate
stranding years for reference assets against CRREM's own published tool outputs —
the rung-3 test; pin one asset in `bench_quant.py`.

**Prerequisites.** CRREM data licensing review (the approximation stays as fallback
with a badge); coordination with the EPC ingest. **Acceptance:** the same asset
strands in different years in Germany vs Spain via country pathways; retrofit NPV
shifts with the country tariff; the reference-asset stranding year matches CRREM's
published tool within one year.

### 9.2 Evolution B — Retrofit-priority analyst for asset managers (LLM tier 2)

**What.** The module computes stranding years and retrofit NPVs per asset but leaves
the portfolio question — "where do my next €10M of retrofit capex go?" — to the
analyst's eye. Evolution B answers it by tool call: rank assets by
stranding-urgency × NPV via `POST /crrem/assess` and `/retrofit-plan`, explain each
recommendation ("strands 2029 under 1.5°C; the HVAC+envelope stack delays to 2041 at
$46/tCO₂e abatement cost"), and draft the TCFD/SFDR disclosure paragraph the export
tab promises — figures from the engine, pathway caveats (approximation vs licensed)
carried into the prose.

**How.** Tool schemas over the module's 8 operations; `/ref/crrem-pathways` and
`/ref/retrofit-measures` serve as citable grounding. The capex-allocation ranking is
a deterministic sort over engine outputs the copilot orchestrates and explains — the
LLM never invents an NPV. GRESB questions route to `POST /gresb-score`. The
fabrication validator covers years, $/m², and abatement costs.

**Prerequisites.** Evolution A's persistence (recommendations must reference stored
asset IDs, not `localStorage` state); harness fixtures for the POST routes.
**Acceptance:** a capex-allocation answer reproduces as the documented ranking over
tool outputs; every stranding year quoted matches `/assess`; the disclosure draft
discloses the pathway provenance badge.