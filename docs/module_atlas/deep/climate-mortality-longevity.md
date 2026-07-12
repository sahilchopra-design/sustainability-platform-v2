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
