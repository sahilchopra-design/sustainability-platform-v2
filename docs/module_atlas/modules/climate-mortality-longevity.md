# Climate Mortality & Longevity Analytics
**Module ID:** `climate-mortality-longevity` · **Route:** `/climate-mortality-longevity` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models the impact of climate-driven heat stress, air quality deterioration, and extreme weather on mortality rates and longevity assumptions for life insurance and pension liabilities.

> **Business value:** Enables life insurers, reinsurers, and pension funds to incorporate climate-driven mortality shifts into actuarial assumptions, reserve adequacy testing, and product pricing.

**How an analyst works this module:**
- Load age-sex mortality tables by country and apply climate hazard adjustment factors
- Map heat index trends by region using SSP scenarios (SSP2-4.5, SSP5-8.5)
- Adjust life expectancy and curtate future lifetime for portfolio geographies
- Reprice annuity reserves and term life premiums under adjusted mortality assumptions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AGE_BANDS`, `BASE_MORT_RATES`, `CLIMATE_ZONES`, `COUNTRIES`, `COUNTRY_NAMES`, `HORIZONS`, `KpiCard`, `NGFS_SCENARIOS`, `REGIONS`, `SCENARIO_MULT`, `SCENARIO_WARMING`, `SCEN_COLORS`, `TabBtn`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Europe', 'Americas', 'Asia-Pacific', 'Africa', 'Middle East'];` |
| `COUNTRIES` | `COUNTRY_NAMES.map((name, i) => ({` |
| `BASE_MORT_RATES` | `AGE_BANDS.map((_, i) => +(0.002 + i * 0.004 + sr(i * 13) * 0.003).toFixed(5));` |
| `top20Heat` | `useMemo(() => [...filtered].sort((a, b) => b.heatExcessMortPct - a.heatExcessMortPct).slice(0, 20), [filtered]);` |
| `avgSMR` | `filtered.reduce((s, c) => s + calcSMR(c, scenIdx), 0) / filtered.length;` |
| `avgLifeExp` | `filtered.reduce((s, c) => s + calcLifeExp(c, scenIdx), 0) / filtered.length;` |
| `totalExcessDeaths` | `filtered.reduce((s, c) => s + c.heatExcessMortPct * c.heatwaveDays2050 * 10, 0);` |
| `avgRA` | `filtered.reduce((s, c) => s + calcReserveAdequacy(c, scenIdx), 0) / filtered.length;` |
| `scen` | `NGFS_SCENARIOS.map((_, si) => {` |
| `multScale` | `1 + (SCENARIO_MULT[si] - 1) * hi / 4;` |
| `warmScale` | `SCENARIO_WARMING[si] * (0.3 + hi * 0.175);` |
| `reserveData` | `useMemo(() => { return [...filtered].sort((a, b) => calcPVFB(b, scenIdx) - calcPVFB(a, scenIdx)).slice(0, 20).map(c => ({ name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name, pvfb: +calcPVFB(c, scenIdx), ra: calcReserveAdequacy(c, scenIdx), }));` |
| `exportRows` | `useMemo(() => filtered.map(c => ({` |
| `avgLE` | `filtered.length ? +(filtered.reduce((s, c) => s + calcLifeExp(c, si), 0) / filtered.length).toFixed(2) : 0;` |
| `totalPVFB` | `filtered.length ? Math.round(filtered.reduce((s, c) => s + +calcPVFB(c, si), 0)) : 0;` |
| `avgBase` | `+(rcs.reduce((s,c) => s + c.baseQ60, 0) / rcs.length).toFixed(5);` |
| `avgClim` | `+(rcs.reduce((s,c) => s + calcClimateMortRate(c, scenIdx), 0) / rcs.length).toFixed(6);` |
| `avgPVFB` | `Math.round(rcs.reduce((s,c) => s + +calcPVFB(c, scenIdx), 0) / rcs.length);` |
| `avgHW` | `Math.round(rcs.reduce((s,c) => s + c.heatwaveDays2050, 0) / rcs.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AGE_BANDS`, `CLIMATE_ZONES`, `COUNTRY_NAMES`, `HORIZONS`, `NGFS_SCENARIOS`, `REGIONS`, `SCENARIO_MULT`, `SCENARIO_WARMING`, `SCEN_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Heat-Attributable Deaths (2023) | — | Lancet Countdown 2023 | Estimated global annual deaths attributable to heat exposure above 1990 baseline temperatures. |
| Longevity Liability Shift (2°C) | — | IFoA Climate Mortality WP 2022 | Reduction in expected lifespan under 2°C scenario relative to no-climate-change baseline, affecting annuity pricing. |
- **National life tables, climate hazard indices, epidemiological literature** → Hazard factor derivation, mortality table adjustment, liability repricing → **Adjusted mortality curves, reserve sensitivity outputs, longevity risk dashboards**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-Adjusted Mortality Rate
**Headline formula:** `CAMR = BaselineMR × (1 + Σ HazardImpactᵢ)`

Applies additive hazard multipliers (heat, air quality, vector-borne disease) to baseline age-sex mortality tables.

**Standards:** ['Lancet Countdown 2023', 'WHO Heat-Health Evidence Synthesis']
**Reference documents:** Lancet Countdown on Health and Climate Change 2023; Institute and Faculty of Actuaries Climate Mortality Working Paper 2022; WHO Global Health Observatory; IPCC AR6 WG2 Chapter 7 Health

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies an *additive* hazard model —
> `CAMR = BaselineMR × (1 + Σ HazardImpactᵢ)` over heat, air quality, and vector-borne disease —
> plus SSP scenarios (SSP2-4.5/SSP5-8.5) and country age-sex mortality tables. The code instead
> uses a **multiplicative chain of exactly two hazards** (heat × air quality; no vector-borne
> term), **six NGFS scenarios** rather than SSPs, a **single synthetic q₆₀ per country** rather
> than age-sex tables, and generates cold-snap and flood excess-mortality fields that are **never
> used** in any calculation. The structure below documents the code as written.

### 7.1 What the module computes

For 60 countries (50 real names + 10 placeholders such as "LatAm Country A"), six actuarial
quantities are derived from a synthetic base mortality rate at age 60 (`baseQ60`) under 6 NGFS
scenarios:

```js
// Climate-adjusted mortality rate (the page's CAMR):
calcClimateMortRate = baseQ60 × SCENARIO_MULT[si]
                      × (1 + heatExcessMortPct/100 × SCENARIO_WARMING[si])
                      × (1 + airQualityMortPct/100)

calcSMR             = climateMortRate / baseQ60          // standardised mortality ratio
calcNetLongevity    = longevityImprovement − heatExcessMortPct × warming / 100
calcLifeExp         = 22 − heatExcessMortPct × warming × 0.3      // ex at 60, years
calcPVFB            = reserveImpact × ageStructureIndex × 1000 × SCENARIO_MULT[si]
calcReserveAdequacy = 100 − reserveImpact × SCENARIO_MULT[si]     // %
```

Because SMR divides the climate rate by `baseQ60`, it collapses to
`SCENARIO_MULT × (1 + heat/100×w) × (1 + aq/100)` — i.e. **SMR is independent of the base rate**
and varies only with the two hazard loadings and the scenario.

### 7.2 Scenario parameterisation

| NGFS scenario | `SCENARIO_WARMING` (°C) | `SCENARIO_MULT` | Note |
|---|---|---|---|
| Net Zero 2050 | 1.5 | 1.05 | Ordering mirrors NGFS hot-house > disorderly > orderly severity |
| Delayed Transition | 2.0 | 1.12 | |
| Divergent Net Zero | 1.8 | 1.08 | |
| Nationally Determined | 2.4 | 1.18 | |
| Current Policies | 3.2 | 1.28 | NGFS Phase IV CP central estimate is ~2.9 °C by 2100; 3.2 is a demo value |
| Fragmented World | 3.8 | 1.38 | |

Both vectors are hard-coded demo constants — no inline citation. Country attributes are all seeded:
`baseQ60` ∈ 0.008–0.026, `heatExcessMortPct` ∈ 0.5–5.0%, `airQualityMortPct` ∈ 0.2–2.7%,
`coldExcessMortPct` ∈ 0.3–3.3% and `floodExcessMortPct` ∈ 0.1–1.6% (both **unused**),
`heatwaveDays2050` ∈ 10–60, `reserveImpact` ∈ 1–9, `ageStructureIndex` ∈ 0.15–0.55,
`longevityImprovement` ∈ 0.1–0.9. `BASE_MORT_RATES` gives a 10-band table
`0.002 + i×0.004 + noise` shared by **all** countries. Region and climate zone are assigned by
`sr()` — so a country's label carries no geographic information (Germany can land in "Africa").

### 7.3 Calculation walkthrough

1. **Global controls** — scenario select (drives `scenIdx` in every formula), horizon select
   (used only by the trajectory chart), region/zone filters, three threshold sliders
   (adaptation ≥, health-system ≥, GDP ≥) and name search produce `filtered`.
2. **Dashboard KPIs** — guarded means over `filtered`: avg SMR, avg life expectancy at 60, avg
   reserve adequacy, and `totalExcessDeaths = Σ heatExcessMortPct × heatwaveDays2050 × 10`
   (the ×10 population scalar is arbitrary — no population data exists).
3. **Climate life tables (Tab 2)** — for the drill country, each age band gets
   `base × SCENARIO_MULT × (1 + heat/100 × warming)` per scenario (note: **without** the
   air-quality factor used elsewhere), and a survival column `cumSurv ×= (1 − base×5)` treating
   each band as 5 years of constant rate.
4. **Trajectory (Tab 3)** — horizon interpolation: `multScale = 1 + (mult−1)×hi/4` and
   `warmScale = warming × (0.3 + hi×0.175)`, i.e. 30% of scenario warming applies in 2025 rising
   linearly to 100% in 2050.
5. **Reserve impact (Tab 4)** — top-20 countries by PVFB with reserve-adequacy overlay; comparison
   mode charts `calcClimateMortRate` for two countries across all six scenarios; Tab 6 exports the
   full derived row set to CSV.

### 7.4 Worked example — Germany (i = 0), Current Policies (si = 4: w = 3.2, mult = 1.28)

Seeds: `sr(1) ≈ 0.97427`, `sr(2) ≈ 0.20008`, `sr(4) ≈ 0.75725`, `sr(7) ≈ 0.58247`.

| Quantity | Computation | Result |
|---|---|---|
| baseQ60 | 0.008 + 0.97427 × 0.018 | **0.0255** |
| heatExcessMortPct | 0.20008 × 4.5 + 0.5 | **1.40%** |
| airQualityMortPct | 0.58247 × 2.5 + 0.2 | **1.66%** |
| Climate mortality rate | 0.0255 × 1.28 × (1 + 0.0140×3.2) × 1.0166 | **0.034668** |
| SMR | 0.034668 / 0.0255 | **1.360** |
| Life expectancy at 60 | 22 − 1.40 × 3.2 × 0.3 | **20.66 yrs** |
| Net longevity trend | (0.97427×0.8 + 0.1) − 1.40×3.2/100 | **0.8346** |
| reserveImpact / ageStructureIndex | 0.20008×8+1 · 0.75725×0.40+0.15 | **2.60 / 0.453** |
| PVFB | 2.60 × 0.453 × 1000 × 1.28 | **1,508** |
| Reserve adequacy | 100 − 2.60 × 1.28 | **96.67%** |

Under Net Zero 2050 (w = 1.5, mult = 1.05) the same country gives SMR ≈ 1.05 × 1.021 × 1.0166 ≈
**1.090** and life expectancy 22 − 0.63 = **21.37 yrs** — the scenario wedge is ~0.7 years of ex₆₀,
inside the guide's cited IFoA −1.2 to −2.1-year range only for the hottest countries.

### 7.5 Data provenance & limitations

- **All 60 country profiles are synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`;
  region/zone labels are random, so cross-country comparisons carry no epidemiological content. No
  Lancet Countdown, WHO, or national life-table data enters the module despite the guide's citations.
- Cold and flood excess-mortality fields are generated but excluded from every formula; the guide's
  vector-borne channel does not exist.
- Life expectancy is a linear heuristic anchored at a hard-coded ex₆₀ = 22 years for every country;
  a real model would integrate the survival curve of the adjusted qₓ table.
- The life-table tab omits the air-quality factor that the headline CAMR includes — two different
  CAMRs coexist on the page.
- `totalExcessDeaths` multiplies a percentage by days by 10 with no population exposure — it is an
  index, not a death count, though labelled as deaths.
- PVFB has no discounting, no benefit cash flows, no annuity factor — it is a scaled product of two
  seeded scores.

### 7.6 Framework alignment

- **NGFS scenarios** — the six Phase III/IV scenario names are used with plausible severity
  ordering; real NGFS use would take temperature and chronic-hazard paths from the NGFS Scenario
  Explorer rather than two hard-coded vectors.
- **Lancet Countdown 2023** — cited in the guide (≈489k heat deaths/yr): derives heat-attributable
  mortality by combining ERA5 temperature exposure with age-specific relative-risk functions from
  epidemiological meta-analyses; the module's `heatExcessMortPct` is a seeded stand-in for that output.
- **IFoA Climate Mortality WP 2022** — frames climate mortality for actuaries as scenario-dependent
  excess qₓ loadings on standard tables (the module mimics the *shape* of this approach via
  `SCENARIO_MULT`).
- **SMR** — actuarially, SMR = observed/expected deaths standardised over an exposure basis; here
  it is a ratio of modelled rates for the same cohort, i.e. a scenario loading factor.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

#### 8.1 Purpose & scope

Produce climate-conditioned mortality bases (qₓ tables), life expectancies, and liability deltas
(annuity reserves, term-life pricing) for life insurers, reinsurers, and pension schemes across
60+ countries and 6 NGFS scenarios, supporting reserve-adequacy testing under Solvency II ORSA /
IFRS 17 and longevity-swap pricing.

#### 8.2 Conceptual approach

A **hazard-specific excess-mortality overlay on stochastic mortality**, mirroring (1) the
**Swiss Re Institute / IFoA climate mortality framework** (scenario excess-qₓ loadings by hazard
and age applied to national tables) and (2) **Club Vita / Lee-Carter-style stochastic projection**
with climate-adjusted drift, as used in Milliman and WTW longevity practice. Heat/cold relative
risks follow the **Gasparrini et al. (Lancet Planetary Health)** exposure-response methodology
that underpins the Lancet Countdown estimates.

#### 8.3 Mathematical specification

```
q_x,c(t,s) = q_x,c^LC(t) × [1 + Σ_h AF_h,x,c(t,s)]                (additive attributable fractions)
AF_heat    = Σ_days RR_x(T_day(s)) − 1 over T > MMT, weighted by exposure days (heatwaveDays(s))
AF_air     = β_PM × ΔPM2.5(s)          (per Global Exposure Mortality Model, GEMM)
AF_vector  = π_c(s) × IFR_x            (malaria/dengue expansion probability × age fatality)
q_x^LC(t)  = exp(a_x + b_x·k_t),  k_t ~ RWD with climate-adjusted drift θ(s)
e_60(t,s)  = Σ_k Π_{j=0}^{k} (1 − q_{60+j}(t,s))                   (curtate life expectancy)
ΔReserve   = Σ_t CF_t · [ p̃(t,s) − p(t) ] · v^t                    (annuity/term repricing)
```

| Parameter | Definition | Calibration source |
|---|---|---|
| `RR_x(T)` | Age-specific temperature-mortality relative risk (U-shaped) | Gasparrini et al. multi-country DLNM curves; Lancet Countdown 2023 |
| `MMT` | Minimum-mortality temperature by climate zone | Same source, zone-specific percentile (~84th of local T distribution) |
| `heatwaveDays(s)` | Scenario days above threshold | CMIP6/NGFS chronic-heat indicators; NASA NEX-GDDP downscaling |
| `β_PM` | Mortality per µg/m³ PM2.5 | GEMM (Burnett et al. 2018); WHO AQG 2021 |
| `q_x^LC` | Baseline stochastic table | HMD national life tables; UN WPP for non-HMD countries |
| `θ(s)` | Climate drag on longevity-improvement drift | IFoA Climate Mortality WP 2022 scenario ranges (−0.1 to −0.5 yr/decade) |
| `v` | Discount curve | EIOPA risk-free term structure (Solvency II) |

#### 8.4 Data requirements

HMD/UN WPP life tables (free), ERA5 reanalysis + CMIP6 scenario temperatures (free, Copernicus),
PM2.5 surfaces (van Donkelaar/WUSTL, free), heatwave-day projections (NGFS/NEX-GDDP, free),
portfolio census (age/sex/geography) from the insurer. The platform's OWID and World Bank
`reference_data` tables already carry population and GDP denominators; WRI Aqueduct layers can
proxy water-stress covariates.

#### 8.5 Validation & benchmarking plan

- **Backtest** heat AF against observed European excess mortality in summer 2003 (~70k deaths,
  Robine et al.) and 2022 (~61k, Ballester et al.) — model must reproduce within ±30%.
- **Benchmark** e₆₀ deltas against IFoA WP 2022 and Swiss Re Institute *The economics of climate
  change* mortality scenarios; SMR loadings against Club Vita climate longevity papers.
- **Stability**: Lee-Carter drift re-fit on rolling 30-year windows; scenario monotonicity checks
  (hotter scenario ⇒ higher qₓ for heat-dominant countries, allowing cold-offset reversals in
  high-latitude portfolios).

#### 8.6 Limitations & model risk

Temperature-mortality curves assume no acclimatisation beyond observed adaptation — apply an
adaptation credit sensitivity (±25% on RR slopes); cold-mortality offsets can dominate in northern
Europe and must not be dropped (the current code's unused `coldExcessMortPct` foreshadows this);
air-quality and heat AFs overlap on co-occurring days (cap combined AF at empirically observed
joint estimates); vector-borne expansion is deeply uncertain — carry as a scenario add-on, not a
central estimate. Fallback: floor climate-adjusted improvement at zero rather than allowing
negative longevity drift without actuarial sign-off.

## 9 · Future Evolution

### 9.1 Evolution A — Age-sex tables and evidenced heat coefficients (analytics ladder: rung 1 → 2)

**What.** §7 flags the structural gaps: the guide promises country age-sex mortality
tables with three additive hazards under SSPs; the code applies a multiplicative
two-hazard chain (heat × air quality) to a single synthetic q₆₀ per country under
NGFS scenarios, and generates cold-snap and flood excess-mortality fields that are
never used. Evolution A supplies the actuarial substance: real life tables (the UN
World Population Prospects and HMD publish full age-sex qₓ tables per country,
downloadable), heat-mortality coefficients from the published epidemiology the §5
references name (Lancet Countdown, IFoA climate mortality working paper — which give
excess-mortality per degree by age band, the crucial structure: heat mortality is
strongly age-skewed and a single q₆₀ cannot express it), and the unused cold/flood
fields either wired into the model or deleted.

**How.** (1) `ref_life_tables(iso3, sex, age_band, qx, source, year)` from
UN WPP; the CAMR chain applied per age band so annuity and term impacts diverge
realistically (annuities are old-age-heavy where heat effects concentrate).
(2) Hazard coefficients from published dose-response studies with citations and CIs;
the multiplicative-vs-additive choice documented and reconciled with the guide.
(3) The repricing tab computes reserve deltas from the full adjusted table (curtate
lifetime, annuity-due factors) — real actuarial arithmetic the current single-rate
shortcut cannot do.

**Prerequisites.** Life-table licensing (UN WPP is open); the dead code fields
resolved; scenario framing (NGFS vs SSP) reconciled with the guide. **Acceptance:**
a 60-year-old vs 80-year-old annuitant show different climate mortality uplifts per
the age-banded coefficients; reserve deltas reproduce textbook annuity math on a
fixture table; unused fields are gone.

### 9.2 Evolution B — Actuarial-assumptions copilot (LLM tier 1 → 2)

**What.** A copilot for pricing and valuation actuaries: "how does SSP5-8.5 heat
stress move our Spanish annuity reserves?" (post-Evolution A, a computed answer with
the age-band decomposition), "why is the term-life impact smaller than the annuity
impact?" (age-skew narration — a genuinely instructive answer the data structure
supports), "what evidence backs the heat coefficient?" (the cited dose-response
studies with CIs). Tier-2 what-ifs re-run the CAMR/repricing functions client-side
with scenario and coefficient inputs.

**How.** Tier 1: atlas record + life-table and coefficient references as corpus;
uncertainty ranges carried into prose. Tier 2: tool schemas over the adjusted-table
and repricing functions; validator on every qₓ, reserve, and premium figure.
Refusal on individual-underwriting and medical questions.

**Prerequisites (hard).** Evolution A first — narrating reserves priced off a
synthetic q₆₀ would misstate both level and structure. **Acceptance:** a reserve
answer decomposes by age band matching the function output; coefficient questions
return citations; the copilot flags when a country's table is a regional proxy.