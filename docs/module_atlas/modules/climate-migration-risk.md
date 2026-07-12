# Climate Migration Risk
**Module ID:** `climate-migration-risk` · **Route:** `/climate-migration-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-CG6 · **Sprint:** CG

## 1 · Overview
15 migration corridors with World Bank Groundswell projections (216M internal migrants by 2050), urban stress, and real estate demand shift.

**How an analyst works this module:**
- Migration Hotspot Map shows 15 corridors with projected flows
- Urban Stress Indicators for 8 receiving cities
- Real Estate Demand Shift shows origin (decline) vs destination (pressure)

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CITIES`, `COLORS`, `CORRIDORS`, `COUNTRIES_50`, `DRIVERS`, `DRIVER_COLORS`, `LABOR_SECTORS`, `PROJECTIONS`, `RE_IMPACTS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CORRIDORS` | 7 | `from`, `to`, `millions`, `drivers`, `rcp` |
| `CORRIDORS` | 16 | `dest`, `migrants2030`, `migrants2050`, `driver`, `riskLevel` |
| `PROJECTIONS` | 7 | `optimistic`, `central`, `pessimistic` |
| `CITIES` | 9 | `country`, `popGrowth`, `infraStress`, `housingDemand`, `waterStress`, `jobAbsorption` |
| `LABOR_SECTORS` | 7 | `displacement`, `retrainTime`, `wageImpact`, `demandShift` |
| `RE_IMPACTS` | 9 | `type`, `priceChange`, `timeline`, `driver` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `countries` | `useMemo(()=>{ return COUNTRIES_50.map((c,i)=>{ const s1=sr(i*19+7);const s2=sr(i*23+11);const s3=sr(i*29+13);const s4=sr(i*31+17);const s5=sr(i*37+19);const s6=sr(i*41+23);` |
| `yearMult` | `(yearSlider-2025)/25;` |
| `projection` | `+(baseProj*rcpMult*yearMult).toFixed(2);` |
| `sorted` | `useMemo(()=>{ return[...countries].sort((a,b)=>sortDir==='desc'?(b[sortCol]\|\|0)-(a[sortCol]\|\|0):(a[sortCol]\|\|0)-(b[sortCol]\|\|0));` |
| `driverBreakdown` | `useMemo(()=>{ const totals=DRIVERS.map((d,di)=>{ const key=['seaLevel','drought','flooding','extremeHeat','cyclones','waterStress'][di];` |
| `rows` | `sorted.map(c=>[c.name,c.region,c.projectionMn,c.seaLevel,c.drought,c.flooding,c.extremeHeat,c.cyclones,c.waterStress,c.annualDisplacement,c.gdpImpact,c.realEstateRiskBn,c.infraInvestNeedBn,c.sovCreditImpact].join(','));` |
| `blob` | `new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);` |
| `totalProjection` | `countries.reduce((a,c)=>a+c.projectionMn,0);` |
| `totalMigrants` | `CORRIDORS.reduce((s, c) => s + (scenario === 'optimistic' ? c.migrants2050 * 0.53 : scenario === 'pessimistic' ? c.migrants2050 * 1.43 : c.migrants2050), 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITIES`, `COLORS`, `CORRIDORS`, `COUNTRIES_50`, `DRIVERS`, `DRIVER_COLORS`, `LABOR_SECTORS`, `PROJECTIONS`, `RE_IMPACTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Internal Migrants (2050) | `Pessimistic scenario` | World Bank | Under high-emissions, low-development scenario |
| Corridors | — | Geopolitical | Major climate-driven migration routes globally |

## 5 · Intermediate Transformation Logic
**Methodology:** Climate migration projection
**Headline formula:** `Migrants(scenario) = Population × ExposureFraction × MigrationPropensity`

Three scenarios (optimistic/moderate/pessimistic) based on climate policy + development pathway. Urban stress = population pressure on housing, infrastructure, labor markets in receiving cities. Real estate impact: declining property values in origin regions, pressure in destination cities.

**Standards:** ['World Bank Groundswell', 'IDMC', 'UNHCR']
**Reference documents:** World Bank Groundswell Report (2021); IDMC Global Displacement Data; UNHCR Climate Displacement

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-CG6) states the formula
> `Migrants(scenario) = Population × ExposureFraction × MigrationPropensity`. **Neither page file
> implements that decomposition** — no population, exposure-fraction, or propensity variable exists
> anywhere in the code. This feature folder also contains **two distinct pages**:
> `ClimateMigrationRiskPage.jsx` (routed at `/climate-migration-risk`, header code **EP-AV5**,
> 50 synthetic countries) and `ClimateRiskMigrationPage.jsx` (routed at `/climate-risk-migration`,
> header code **EP-CG6**, 15 hard-coded corridors). The guide describes the *second* page (15
> corridors, 8 receiving cities, RE demand shift), while the module's canonical route serves the
> *first*. Both are documented below.

### 7.1 What the module computes

**Page A — `ClimateMigrationRiskPage` (`/climate-migration-risk`, EP-AV5).** Builds 50 countries
whose every attribute is drawn from the platform PRNG and scaled by two user controls:

```js
rcpMult    = RCP 8.5 ? 1 : RCP 4.5 ? 0.6 : 0.35        // scenario multiplier
yearMult   = (yearSlider − 2025) / 25                   // 0.2 (2030) … 1.0 (2050)
baseProj   = s1 × 8 + 0.5                               // millions, s1 = sr(i×19+7)
projection = baseProj × rcpMult × yearMult              // headline migrants per country
hazard_h   = floor(s_h × max_h) × rcpMult               // max_h = 90/85/80/95/70/88 for
                                                        // SLR/drought/flood/heat/cyclone/water
```

Sixteen further economic fields are single-seed affine maps, e.g. `gdpImpact = −(s5×8+0.5)%`,
`annualDisplacement = floor(s2×500+50)×rcpMult` (thousands), `realEstateRiskBn = s5×50+1`,
`sovCreditImpact = floor(s1×200)−50` bps, `fiscalCostPct = s4×3+0.2`. The scenario-timeline chart
is quadratic-in-time: `rcp85 = round(20 + i²×7.5 + noise)`, `rcp45 = 15 + i²×3.5`, `rcp26 = 10 + i²×1.5`.

**Page B — `ClimateRiskMigrationPage` (`/climate-risk-migration`, EP-CG6).** Entirely hard-coded
seed tables: 15 corridors with 2030/2050 migrant volumes, the World Bank Groundswell three-scenario
projection curve (115M/216M/310M by 2050), 8 receiving-city stress profiles, 6 labour sectors, and
8 real-estate impact regions. Its only computation is the scenario KPI:

```js
totalMigrants = Σ_corridors migrants2050 × (optimistic ? 0.53 : pessimistic ? 1.43 : 1)
```

The 0.53 / 1.43 multipliers reproduce Groundswell's scenario ratios: 115/216 ≈ 0.532 and
310/216 ≈ 1.435 — the one genuinely calibrated constant on the page.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| RCP multipliers (Page A) | 8.5→1.0 · 4.5→0.6 · 2.6→0.35 | Synthetic demo scaling; ordering plausible, values uncited |
| Hazard score caps (Page A) | SLR 90 · drought 85 · flood 80 · heat 95 · cyclone 70 · water 88 | Synthetic demo values |
| Page A corridor table | 6 rows, 86M SSA→Europe … 3M SIDS | Loosely echoes Groundswell/IOM magnitudes; hard-coded |
| Groundswell curve (Page B) | 2050: 115 / 216 / 310M | World Bank *Groundswell Part 2* (2021), Clement et al. — cited in on-page reference box |
| Scenario multipliers (Page B) | ×0.53 / ×1.43 | Groundswell scenario ratios (see §7.1) |
| Corridor volumes (Page B) | e.g. Bangladesh→India 52M by 2050 | Hard-coded editorial estimates, no per-row citation |
| City stress scores (Page B) | Dhaka infra 92, Lagos 95 … 0–100 | Synthetic demo values |
| RE price shifts (Page B) | Miami Beach −25%, Phoenix +22% … | Synthetic demo values with named qualitative drivers |

Note a labelling inconsistency in Page B: the projection table calls 216M "central" and 310M
"pessimistic", while its own reference box (and the World Bank report) attribute 216M to the
*pessimistic* scenario; the scenario dropdown papers over this with "Central (Pessimistic)".

### 7.3 Calculation walkthrough

1. **Page A seeds.** Country *i* draws six seeds `s1…s6 = sr(i×19+7 … i×41+23)` where
   `sr(s) = frac(sin(s+1)×10⁴)`. Region is assigned by index block (0–9 South Asia, 10–19 W Africa,
   20–29 E Africa, 30–39 LatAm, 40–43 East Asia, 44 Oceania, 45–49 Small Island States).
2. **Controls.** The RCP tag and year slider (2030–2050, step 5) rescale projections, hazards, and
   displacement live; every chart and the sortable 50×10 table re-derive from the memo.
3. **Aggregates.** `totalProjection = Σ projection`; regional bars group by region prefix; driver
   breakdown averages each hazard column over all 50 countries. Tab-2/3 KPI averages divide by the
   literal `50`, not `countries.length` (safe only while the list is fixed).
4. **Page B.** The scenario select rescales the corridor-sum KPI; corridor-comparison, radar, and
   investment tabs render the static tables. The "Price Trajectory" line chart is a linear ramp
   (`miami = −3(i+1)`, `phoenix = 4(i+1)×0.8`, `amsterdam = 2(i+1)`, `dhaka = −3.5(i+1)` per 3-year
   step) and the investment buttons are `alert()` stubs.

### 7.4 Worked example — Bangladesh (Page A, i = 0, RCP 8.5, year 2050)

Seeds: `s1 = sr(7) = frac(sin(8)×10⁴) ≈ 0.5825`, `s2 = sr(11) ≈ 0.2708`, `s3 = sr(13) ≈ 0.0736`,
`s4 = sr(17) ≈ 0.1275`, `s5 = sr(19) ≈ 0.4525`, `s6 = sr(23) ≈ 0.2164`; `rcpMult = 1`, `yearMult = 1`.

| Output | Computation | Result |
|---|---|---|
| Projected migration | (0.5825×8 + 0.5) × 1 × 1 | **5.16M** |
| Sea-level score | floor(0.5825×90) | **52** |
| Flood score | floor(0.0736×80) | **5** |
| Annual displacement | floor(0.2708×500 + 50) | **185K** |
| GDP impact | −(0.4525×8 + 0.5) | **−4.1%** |
| Sovereign credit impact | floor(0.5825×200) − 50 | **+66 bps** |
| RE stranded risk | 0.4525×50 + 1 | **$23.6Bn** |

Switching to RCP 4.5 multiplies the projection by 0.6 → **3.10M**; sliding to 2030 multiplies by
0.2 → **1.03M**. Note the artefact: Bangladesh — the canonical flood-displacement country — scores
5/80 on flooding because seeds are orthogonal to geography.

### 7.5 Data provenance & limitations

- **Page A is fully synthetic**: all 50 country profiles come from `sr(seed) = frac(sin(seed+1)×10⁴)`.
  Hazard scores contradict known geography (see §7.4); the USA is bucketed under "East Asia" by the
  index-range region assignment; the "IDMC" displacement-trend chart is seeded noise, not IDMC data.
- **Page B mixes one real anchor** (the Groundswell 115/216/310M scenario curve and its ratios)
  **with editorial seed tables** (corridors, cities, labour, real estate) that carry no row-level
  citations. Corridor 2050 volumes sum to 377M — above even Groundswell's 310M pessimistic bound,
  plausible only if read as including cross-border flows Groundswell excludes (it models *internal*
  migration only).
- No gravity/propensity model, no population or exposure data, no uncertainty bands; year scaling
  in Page A is linear, whereas Groundswell's pathways are convex.
- KPI averages hard-divide by 50 (Page A); RCP 6.0 and SSP framing are absent.

### 7.6 Framework alignment

- **World Bank Groundswell (2021)** — the module's central reference. Groundswell derives internal
  climate migrants by downscaling gravity-based population models under combined climate (water
  availability, crop productivity, sea level) and development scenarios across 6 regions; Page B
  reproduces its headline scenario curve and ratios, Page A only its vocabulary.
- **IDMC GRID** — IDMC counts *realised* annual internal displacements from disaster events
  (~26–32M/yr weather-related in recent years); Page A's "IDMC" trend chart mimics that magnitude
  band (20–45M) with synthetic values.
- **UNHCR / IOM World Migration Report 2024** — cited in Page B reference boxes as context; no data
  from either enters a calculation.
- **RCP scenarios (IPCC)** — used as labels for scalar multipliers (1 / 0.6 / 0.35), not as forcing
  pathways; real RCP-conditioned migration modelling would differentiate hazards, not scale them uniformly.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

#### 8.1 Purpose & scope

Quantify climate-driven migration flows and their financial transmission (sovereign spreads,
real-estate values, urban infrastructure demand) for 50+ origin countries and 20+ receiving cities,
supporting sovereign-debt positioning, real-asset allocation, and adaptation-finance sizing over
5–25-year horizons.

#### 8.2 Conceptual approach

A **gravity-model migration core conditioned on climate hazards**, mirroring (1) the **World Bank
Groundswell / CIESIN** methodology (spatial population allocation responding to water, crop, and
sea-level "climate impact surfaces" under SSP×RCP combinations) and (2) the **Rigaud et al. /
NASA-SEDAC gravity downscaling** used in Groundswell Part 1–2. Financial transmission follows the
**sovereign climate-risk literature** (Beirne, Renzhi & Volz 2021: climate vulnerability priced
into sovereign bond spreads) and destination-market repricing per **First Street Foundation /
Freddie Mac** coastal-property studies.

#### 8.3 Mathematical specification

```
M_ij(t) = k · P_i(t)^α · A_j(t)^β / d_ij^γ · exp(δ · H_i(t))        (corridor flow, gravity)
H_i(t)  = Σ_h w_h · z_h,i(t)                                        (standardised hazard index)
Migr_i(t) = Σ_j M_ij(t)                                             (origin out-migration)
Δspread_i = φ · ΔH_i + ψ · (Migr_i / Pop_i)                          (sovereign channel, bps)
ΔP_RE,j  = η · (ΔPop_j / HousingStock_j)                             (destination price pressure)
```

| Parameter | Definition | Calibration source |
|---|---|---|
| `α, β, γ` | Gravity elasticities (origin pop, destination attractiveness, distance) | Estimated on UN DESA bilateral migrant-stock matrix + IOM flow data |
| `δ, w_h` | Hazard sensitivity and weights (SLR, drought, flood, heat, cyclone, water) | Groundswell impact surfaces; EM-DAT displacement regressions; IDMC GRID event data |
| `z_h,i(t)` | Hazard z-scores by scenario | CMIP6 ensemble under SSP1-2.6 / SSP2-4.5 / SSP5-8.5; WRI Aqueduct (water) — Aqueduct already seeded in platform reference data |
| `φ, ψ` | Spread sensitivity to vulnerability and net out-migration | Beirne–Renzhi–Volz (2021) panel: ~1.5–3% funding-cost premium per vulnerability decile |
| `η` | House-price elasticity to population inflow | Saiz (2007): ~1% price rise per 1% immigration-driven population increase, adjusted by supply elasticity |
| Scenario totals | Regional calibration constraint | Anchor Σ_i Migr_i(2050) to Groundswell 44–216M internal range by scenario |

#### 8.4 Data requirements

UN DESA migrant-stock matrix and WPP population (free), IDMC GRID displacement events (free),
EM-DAT disaster losses (free; already in platform public-data layer), WRI Aqueduct water stress
(already ingested), CMIP6/NASA-SEDAC hazard surfaces (free), national housing-stock and price
indices (BIS residential property series, free; CoreLogic/First Street for US granularity),
sovereign spreads (JPM EMBI via vendor). Platform's `reference_data` World Bank live tables cover
GDP and population denominators.

#### 8.5 Validation & benchmarking plan

- **Backtest** predicted annual displacement against IDMC GRID 2010–2024 by country (target rank
  correlation ≥ 0.6); corridor flows against IOM/Frontex observed 2015–2023 route volumes.
- **Benchmark reconciliation** of 2050 scenario totals against Groundswell Part 2 and IEP
  Ecological Threat Register; sovereign-spread channel against Beirne et al. coefficient ranges.
- **Sensitivity**: ±50% on `δ` and distance decay `γ`; flows must be monotone in hazard index and
  sum-preserving across scenario switches.

#### 8.6 Limitations & model risk

Gravity models miss conflict-climate interaction and policy shocks (border regimes) — flag corridor
outputs crossing militarised borders as low-confidence; internal vs cross-border migration must not
be summed against Groundswell (internal-only) anchors; hazard-to-migration elasticities are
non-stationary under adaptation investment — re-estimate on 5-year rolling windows; destination
price elasticity assumes unconstrained credit. Conservative fallback: report Groundswell scenario
bands directly when country-level seed data fails quality checks.

## 9 · Future Evolution

### 9.1 Evolution A — Resolve the two-page split; ground corridors in Groundswell (analytics ladder: rung 1 → 2)

**What.** §7 exposes a routing tangle before any methodology gap: the feature folder
holds two distinct pages — `ClimateMigrationRiskPage` (routed here, EP-AV5, 50
PRNG-seeded countries scaled by RCP/year sliders) and `ClimateRiskMigrationPage`
(EP-CG6, 15 hard-coded corridors — the page the guide actually describes) — and the
guide's `Migrants = Population × ExposureFraction × MigrationPropensity` exists in
neither. Evolution A first resolves the split (one canonical page; the corridor view
is the keeper since its 15 corridors and Groundswell framing carry real content),
then grounds it: corridor flows anchored to the World Bank Groundswell 2050
projections (216M internal migrants — already the module's headline), the
optimistic/central/pessimistic `PROJECTIONS` re-based on Groundswell's actual three
scenarios, and the guide's decomposition implemented where its terms are sourceable
(population from WB data, exposure fraction from hazard maps, propensity as the
explicit modelled assumption it is).

**How.** (1) Route cleanup: retire or merge the EP-AV5 seeded-country page; atlas
regenerated so the record documents one page. (2) `ref_groundswell_corridors` with
region-scenario projections cited to report tables; urban-stress indicators for the
8 receiving cities from public city data (population growth, housing) rather than
seeds. (3) The RCP/year sliders retained but scaling sourced projections, not noise.

**Prerequisites (hard).** The dual-page/route confusion is a defect to fix first —
documentation, navigation, and any future copilot all point at the wrong page today.
**Acceptance:** one routed page whose corridor numbers cite Groundswell tables; the
scenario toggle reproduces the report's published ranges; zero seeded country
attributes remain.

### 9.2 Evolution B — Corridor-briefing copilot (LLM tier 1)

**What.** A copilot for the module's real users (real-estate and sovereign
analysts): "what does the Dhaka corridor imply for receiving-city housing demand?",
"which corridors are drought-driven vs sea-level-driven?" (the driver taxonomy per
corridor), "how do the three scenarios differ for Sub-Saharan Africa?" — retrieval
and comparison over the sourced corridor and city tables, with the real-estate
demand-shift framing the page already provides. Tier 1: projections are curated from
a published model, and the copilot's job is faithful narration with scenario caveats.

**How.** Corridor/city tables plus the §5 corpus (Groundswell 2021, IDMC, UNHCR) as
grounding; every flow figure carries scenario + source; the copilot must present
Groundswell numbers as *internal* migration projections (their actual scope) and not
convert them into cross-border claims — a common misreading worth guarding in the
prompt.

**Prerequisites (hard).** Evolution A first, including the page-split fix — a copilot
grounded on this module today could be describing a different page than the user
sees. **Acceptance:** every projection cited carries scenario and source; asked about
international refugee flows, the copilot notes the data covers internal migration and
redirects to the displacement module.