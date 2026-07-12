## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies the real epidemiology: a Gasparrini distributed-
> lag non-linear model, `EHMR = Σₜ max(0, Tₜ − MMT) × β_heat × Population × BaselineMortality`, with
> city-specific MMT and a 21-day lag. **The code implements none of this** — there is no MMT, no
> temperature series, no β_heat, no distributed lag. Each city's `mortalityBase` is a `sr()` PRNG draw,
> and RCP/horizon projections are simple multipliers `mortalityBase × (1 + rcp×0.3 + horizon×0.25 + noise)`.
> Sections below document the seeded scenario-multiplier model the code runs.

### 7.1 What the module computes

`genCities(60)` seeds each city and projects mortality/WBGT/hot-days across RCP × horizon grids:

```js
baseWBGT      = 25 + s1×12                     // 25–37 °C baseline WBGT
days35        = floor(30 + s2×180)             // days >35 °C
mortalityBase = floor(s3×800 + 50)             // 50–850 baseline heat deaths
rcpMort[ri][hi] = floor( mortalityBase × (1 + ri×0.3 + hi×0.25 + sr()×0.2) )
rcpWBGT[ri][hi] = baseWBGT + ri×1.2 + hi×0.8 + noise         // °C
rcpDays[ri][hi] = floor( days35 × (1 + ri×0.15 + hi×0.2 + noise) )
riskTier = mortalityBase>500 Critical | >300 High | >150 Medium | else Low
```

RCP index (0=2.6, 1=4.5, 2=8.5) and horizon index (0=2030,1=2040,2=2050) multiply the baseline: RCP 8.5
in 2050 gives `1 + 2×0.3 + 2×0.25 = 2.1×` baseline mortality.

### 7.2 Parameterisation

| Scenario axis | Multiplier per step | Interpretation |
|---|---|---|
| RCP (0→2) | +0.30 mortality, +1.2 °C WBGT, +0.15 days | higher forcing → more deaths/heat |
| Horizon (0→2) | +0.25 mortality, +0.8 °C, +0.20 days | later → more deaths |

60 real city names (Phoenix, Dubai, Delhi, Lagos, Baghdad, Athens…), 20 countries, 10 labour sectors.
Per city also: labour loss by sector, green-infra gap, cooling-degree-days projection, health cost,
insurance claims, real-estate impact %, portfolio exposure % — all seeded. No externally-anchored
epidemiological constants (MMT, β) appear.

### 7.3 Calculation walkthrough

The RCP and horizon sliders index into each city's `rcpMort`/`rcpWBGT`/`rcpDays` grids. `totalMort =
Σ rcpMort[rcpIdx][horizonIdx]` sums across cities; `avgWBGT`, `avgDays35` average baselines. Cities are
sortable/searchable; scatter (WBGT vs mortality), UHI ranking, and financial-impact tabs use the seeded
per-city fields. `totalFinancial` sums health cost, insurance and averages real-estate/portfolio impact.

### 7.4 Worked example (one city, RCP 8.5, 2050)

`mortalityBase = 400`, `baseWBGT = 30`, `days35 = 90`, rcpIdx = 2, horizonIdx = 2:

| Quantity | Computation | Result |
|---|---|---|
| projected mortality | 400 × (1 + 2×0.3 + 2×0.25 + ~0.1) | 400 × 2.2 ≈ **880 deaths** |
| projected WBGT | 30 + 2×1.2 + 2×0.8 + ~0.3 | ≈ **34.3 °C** |
| projected hot days | 90 × (1 + 2×0.15 + 2×0.2 + ~0.05) | 90 × 1.75 ≈ **158 days** |
| riskTier | mortalityBase 400 in [300,500) | **High** |

The 2.2× mortality uplift under RCP 8.5/2050 is a plausible-magnitude figure, but it is a fixed
scenario multiplier on a synthetic baseline — not an exposure-response computation.

### 7.5 Data provenance & limitations

- **Entirely synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`): all 60 cities' baseline mortality, WBGT,
  hot-days and financial impacts are seeded; only city/country names are real.
- **No Gasparrini DLNM**: no minimum-mortality temperature, no β_heat exposure-response coefficient, no
  temperature time series, no distributed lag — the projection is a linear scenario multiplier.
- RCP/horizon uplifts are uniform across cities (same +0.3/+0.25 slopes), so city-specific acclimatisation
  and vulnerability (elderly share) are not modelled.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The Gasparrini DLNM the guide describes has
no implementation; below is the model this module should run.

**8.1 Purpose & scope.** Estimate city-level excess heat mortality under climate scenarios for life
insurers/reinsurers (longevity), public-health investors and TCFD physical-risk disclosure.

**8.2 Conceptual approach.** The Gasparrini distributed-lag non-linear model (DLNM) — the standard in
Lancet Countdown and Vicedo-Cabrera et al. — estimating daily excess mortality from temperature above a
city-specific minimum-mortality temperature (MMT), summed over a 0–21-day lag, scaled to scenarios.

**8.3 Mathematical specification.**
```
Daily excess mortality  E_t = Σ_{lag=0}^{21} f(T_{t−lag}, MMT) × β_heat × Pop × BaseMortRate
   f = cumulative exposure-response above MMT (natural-spline crossbasis)
Annual EHMR = Σ_t E_t  (warm season)
UHI adjustment: T_urban = T_rural + UHI_offset  (+1.5 to +4.0 °C)
Scenario projection: apply ΔT(scenario, horizon) from downscaled SSP/RCP to the ERF
Vulnerability: scale β_heat by elderly-population share
```

| Parameter | Source |
|---|---|
| MMT (city-specific) | fitted ERF (London ~18 °C, Athens ~25 °C) |
| β_heat / ERF | Gasparrini et al. 2017; Vicedo-Cabrera 2021 |
| Temperature series | ERA5 daily; downscaled SSP/RCP |
| UHI offset | urban climate models (+1.5–4.0 °C) |
| Baseline mortality | national all-cause daily statistics |

**8.4 Data requirements.** City daily temperature (historical + projected), all-cause mortality,
population + elderly share, MMT/ERF calibration. The page has city names but none of the epidemiological
inputs.

**8.5 Validation.** Reconcile EHMR against Lancet Countdown Indicator 1.1.2 and Vicedo-Cabrera attributable-
fraction estimates; back-test the ERF against observed heatwave excess deaths (e.g. Europe 2022 61k);
sensitivity on MMT and lag structure.

**8.6 Limitations & model risk.** MMT and ERF are data-hungry and city-specific; adaptation/acclimatisation
shifts MMT over time; downscaling ΔT carries scenario uncertainty. Conservative fallback: report
attributable-fraction ranges rather than point mortality counts.

**Framework alignment:** Gasparrini et al. (2017) DLNM — the exposure-response core; Lancet Countdown
Indicator 1.1.2 — heat-mortality tracking; Vicedo-Cabrera et al. (2021) — climate-change attribution;
IPCC AR6 WG2 Ch7 — SSP-scenario health projections; TCFD/TNFD — the physical-risk disclosure use case.
