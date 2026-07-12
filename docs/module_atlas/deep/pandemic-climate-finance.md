## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises a two-formula engine —
> `ZoonoticRisk = ForestEncroachment × WildlifeContactRate × PathogenRichness × ClimateAmplification`
> and `PandemicFinancialRisk = P(pandemic) × GDPimpact × PortfolioExposure`. **Neither product
> formula exists in the code.** Every quantity on the page (climate amplification, zoonotic risk,
> economic loss, mortality, insurance gap, preparedness) is an **independent draw from the seeded PRNG
> `sr()`** rescaled into a plausible band; they are not multiplied together and no portfolio exposure
> is ever supplied. The insurance-instrument and preparedness-finance tables are hard-coded literals.
> The sections below document what the page actually renders.

### 7.1 What the module computes

The page builds **50 pandemic scenarios** and **8 pathogen profiles**, then aggregates a filtered
subset into six KPIs. Each scenario `i` draws ten independent variables from `sr()` and rescales
each into a hand-chosen range:

```js
climateAmp        = 1 + sr(i*11)*4        // ×1–5 transmission amplifier
econLoss          = 0.5 + sr(i*13)*99.5   // $0.5–100 Bn
probNextDecade    = 5 + sr(i*17)*45       // 5–50 %
mortalityMn       = 0.1 + sr(i*19)*9.9    // 0.1–10 M
healthSysResilience = 20 + sr(i*23)*70    // 20–90 /100
zoonoticRisk      = 10 + sr(i*29)*90      // 10–100 /100
insuranceGap      = 30 + sr(i*31)*60      // 30–90 %
preparednessIdx   = 20 + sr(i*37)*70      // 20–90 /100
```

Pathogen and scenario-type labels are index draws: `pathIdx = floor(sr(i*5)·8)`,
`stIdx = floor(sr(i*7)·4)` over `['Optimistic','Baseline','Severe','Catastrophic']`.

### 7.2 Parameterisation / scoring rubric

| Variable | Range | Multiplier seed | Provenance |
|---|---|---|---|
| Climate amplification | ×1–5 | `sr(i·11)` | Synthetic; band loosely echoes guide's "3–5× by 2070" claim (IPCC AR6/EcoHealth) but not derived |
| Economic loss | $0.5–100 Bn | `sr(i·13)` | Synthetic demo value |
| Prob. next decade | 5–50 % | `sr(i·17)` | Synthetic demo value |
| Mortality | 0.1–10 M | `sr(i·19)` | Synthetic demo value |
| Health-system resilience | 20–90 | `sr(i·23)` | Synthetic; conceptually a GHS-Index-style score |
| Zoonotic risk | 10–100 | `sr(i·29)` | Synthetic spillover index |
| Insurance gap | 30–90 % | `sr(i·31)` | Synthetic; band is realistic (pandemic protection gap is very high) |

Pathogen profiles carry `habitatExpansion` (10–70 %), `spilloverRisk` (5–90 %),
`rcpAmplification` (×1.1–4.0), `pandemicPotential` (10–90), `financialExposure` ($5–300 Bn) —
again all independent `sr()` draws seeded on the pathogen index.

The **insurance architecture** (tab 6) and **preparedness finance** (tab 7) tables are static
literals: Pandemic CAT Bond $15 Bn (trigger: WHO PHEIC), Pandemic Risk Pool $10 Bn, WHO Pandemic
Accord $31.5 Bn, CEPI 100 Days Mission $3.5 Bn, World Bank Pandemic Fund $2 Bn, etc. These figures
correspond to real initiatives and are the module's only externally anchored content.

### 7.3 Calculation walkthrough

1. `SCENARIOS` (50) and `PATHOGEN_DATA` (8) are generated once at module load.
2. The user filters by pathogen and scenario type → `filtered`.
3. KPIs reduce over `filtered`:
   - `avgClimAmp = mean(climateAmp)`, `totalEconLoss = Σ econLoss`, `avgZoonotic = mean(zoonoticRisk)`,
     `avgResilience = mean(healthSysResilience)`, `avgInsGap = mean(insuranceGap)`.
   - `highRiskCount = count(zoonoticRisk > 70 OR climateAmp > 3)`.
4. Tab views sort/slice the same arrays (top-12 economic loss, top-24 resilience, pathogen bars).

No cross-variable arithmetic occurs — the "nexus" is presented visually (deforestation → spillover
narrative in copy) but never computed.

### 7.4 Worked example

Take scenario `i = 4`. With `sr(s) = frac(sin(s+1)·10⁴)`:

| Variable | Seed | `sr` value (approx) | Rescaled |
|---|---|---|---|
| climateAmp | `sr(44)` ≈ 0.556 | | 1 + 0.556·4 = **×3.22** |
| econLoss | `sr(52)` ≈ 0.190 | | 0.5 + 0.190·99.5 = **$19.4 Bn** |
| zoonoticRisk | `sr(116)` ≈ 0.760 | | 10 + 0.760·90 = **78.4** |

Because `climateAmp 3.22 > 3` **and** `zoonoticRisk 78.4 > 70`, this scenario counts toward
`highRiskCount`. If the whole 50-scenario set is active, `totalEconLoss` is the simple sum of all
50 `econLoss` draws (≈ $2.5 Tn headline). The exact `sr` values depend on floating-point `sin`, but
the mechanism is: draw → linear rescale → aggregate.

### 7.5 Data provenance & limitations

- **All scenario and pathogen data are synthetic**, produced by the platform PRNG
  `sr(seed) = frac(sin(seed+1)×10⁴)`. Stable across renders, but not real epidemiological or
  actuarial estimates. The instrument-capacity and preparedness-funding literals are the only
  real-world anchors.
- No pandemic probability model, no GDP-shock transmission, no portfolio-exposure input — the
  guide's expected-loss formula is entirely absent.
- Climate amplification and zoonotic risk are drawn **independently**; a "catastrophic" scenario can
  therefore carry a low amplification factor, which is epidemiologically incoherent.

**Framework alignment:** IPCC AR6 WGII Ch.7 (climate–health) · UNEP *Preventing the Next Pandemic*
(2020, zoonotic spillover drivers) · World Bank *One Health* investment case (37:1 BCR headline) ·
G20 HLIP *A Global Deal for Our Pandemic Age* ($75 Bn/yr recommendation). The module references
these as narrative context and reproduces their headline numbers as static copy, but implements
none of their quantitative methods.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays pandemic financial-risk
and One-Health-BCR quantities with no model behind them; a production version needs a real
climate-conditioned pandemic expected-loss model.

**8.1 Purpose & scope.** Produce a portfolio-level *pandemic expected annual loss* (EAL) and a
*One Health investment NPV/BCR* for a re/insurer, sovereign wealth fund, or DFI, conditioned on
land-use-change and climate scenarios. Coverage: sector-tagged portfolio exposures + a country/biome
zoonotic-hazard layer.

**8.2 Conceptual approach.** Actuarial frequency–severity with a climate-conditioned frequency
multiplier — the same structure Swiss Re/Munich Re use for NatCat pricing, extended with a
land-use spillover hazard à la the Metabiota/EcoHealth spillover-risk maps and the World Bank One
Health ROI framework. Two benchmarks: (i) **Swiss Re sigma** frequency–severity pandemic modelling;
(ii) **World Bank One Health Investment Case** BCR methodology.

**8.3 Mathematical specification.**

```
Spillover hazard (per country c):
  λ_c = λ0 · f_deforest(D_c) · f_wildlife(W_c) · f_richness(R_c) · A_climate(c, scenario)
    f_deforest = 1 + β_D · (ΔForest_c / ΔForest_ref)          β_D from Allen et al. 2017
    A_climate  = 1 + β_T · (ΔT_scenario / 1.5)                 range-shift amplifier, IPCC AR6

Global pandemic frequency:  Λ = Σ_c λ_c   (events/decade → annualise ÷10)

Severity (per event): GDP shock g ~ LogNormal(μ_g, σ_g)  calibrated to COVID-19 (~ -3.4% global GDP)
Portfolio loss:  L = Σ_sectors  Exposure_s · β_s · g       β_s = sector GDP-elasticity (travel, retail high)

Pandemic EAL = (Λ/10) · E[Σ_s Exposure_s · β_s · g]
One Health NPV = Σ_t [ ΔEAL(investment) − Cost_t ] / (1+r)^t ;  BCR = PV(avoided loss)/PV(cost)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Base spillover rate | λ0 | GVP/Metabiota historical spillover event count (~2–3/decade) |
| Deforestation elasticity | β_D | Allen et al. (2017) *Nature Comms* EID–land-use regression |
| Climate range-shift amp | β_T | IPCC AR6 WGII Ch.7 vector range projections |
| GDP shock distribution | μ_g, σ_g | IMF WEO 2020–23 realised COVID GDP path |
| Sector GDP elasticity | β_s | OECD sectoral pandemic impact (aviation/hospitality ≫ utilities) |
| Discount rate | r | Sovereign/insurer cost of capital |

**8.4 Data requirements.** Country deforestation rate (Global Forest Watch — free), wildlife-trade
intensity (CITES/TRAFFIC), pathogen richness by biome (IUCN/GVP), NGFS/IPCC temperature deltas by
scenario (already in platform `climate_scenarios` reference tables), portfolio sector exposures
(internal), sector elasticities (OECD). Platform already holds NGFS scenario deltas and sector
tags; deforestation and spillover layers are the missing external feeds.

**8.5 Validation & benchmarking.** Backtest Λ against the observed 1900–2020 pandemic event series;
reconcile the GDP-shock severity distribution against the realised COVID-19 loss; sensitivity-test
β_D and β_T (±50 %) for EAL stability; benchmark the One Health BCR against the World Bank's
published 37:1 figure (it should land in a 15–40:1 range).

**8.6 Limitations & model risk.** Spillover frequency at decadal timescales has very few data points
(fat-tailed, poorly identified λ). Land-use→spillover elasticity is ecologically contested. GDP-shock
severity is dominated by policy response (lockdown stringency), which is exogenous to the hazard.
Conservative fallback: cap Λ at the historical decadal maximum and floor the protection gap at
observed pandemic-bond capacity.
