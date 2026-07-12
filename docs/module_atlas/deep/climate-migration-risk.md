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
