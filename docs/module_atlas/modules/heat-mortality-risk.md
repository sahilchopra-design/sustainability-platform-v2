# Heat Mortality Risk
**Module ID:** `heat-mortality-risk` · **Route:** `/heat-mortality-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models excess heat mortality using exposure-response functions calibrated to city-level temperature and demographic data, providing quantitative heat risk assessments for life insurers, reinsurers, and public health investors. Incorporates urban heat island effect, adaptation capacity, and future climate scenario projections under SSP scenarios.

> **Business value:** Enables life insurers and reinsurers to quantify the impact of rising heat mortality on longevity assumptions, supports public health investors in prioritising cooling infrastructure, and provides city-level heat risk intelligence for physical climate risk disclosure under TCFD and TNFD frameworks.

**How an analyst works this module:**
- Select the city or region and load historical temperature and mortality data to calibrate the exposure-response function.
- Apply urban heat island adjustment factors and demographic vulnerability weights (elderly population share).
- Project excess heat mortality under SSP1-2.6, SSP2-4.5, and SSP3-7.0 climate scenarios to 2050 and 2080.
- Use the insurer longevity impact tab to quantify the excess mortality loading on life insurance and annuity books.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CITIES`, `CITY_NAMES`, `COUNTRIES`, `HORIZONS`, `QUARTERS`, `RCP_SCENARIOS`, `SECTORS_LABOUR`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `days35` | `Math.floor(30+s2*180);` |
| `mortalityBase` | `Math.floor(s3*800+50);` |
| `lat` | `s6>0.5?(s6*40):(s6*-40+20);` |
| `rcpMort` | `RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>Math.floor(mortalityBase*(1+ri*0.3+hi*0.25+sr(i*37+ri*11+hi*7)*0.2))));` |
| `rcpWBGT` | `RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>+(baseWBGT+ri*1.2+hi*0.8+sr(i*41+ri*13+hi*9)*0.5).toFixed(1)));` |
| `rcpDays` | `RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>Math.floor(days35*(1+ri*0.15+hi*0.2+sr(i*43+ri*17+hi*11)*0.1))));` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],mort:Math.floor(mortalityBase*(0.8+qi*0.03+sr(i*47+qi*13)*0.15)),wbgt:+(baseWBGT+qi*0.1+sr(i*53+qi*7)*0.5).toFixed(1)}));` |
| `labourLoss` | `SECTORS_LABOUR.map((sec,si)=>({sector:sec,lossPercent:+(sr(i*59+si*11)*8+1).toFixed(1),gdpImpactM:Math.floor(sr(i*61+si*13)*500+10),workersExposedK:Math.floor(sr(i*67+si*17)*200+5)}));` |
| `greenInfraGapM` | `Math.floor(sr(i*71+5)*2000+100);` |
| `cddProjection` | `HORIZONS.map((_,hi)=>Math.floor(1500+hi*400+sr(i*73+hi*11)*300));` |
| `healthcostM` | `Math.floor(sr(i*79+9)*1500+50);` |
| `insuranceClaimsM` | `Math.floor(sr(i*83+3)*400+10);` |
| `realEstateImpactPct` | `+(sr(i*89+7)*15+1).toFixed(1);` |
| `portfolioExposurePct` | `+(sr(i*97+13)*25+1).toFixed(1);` |
| `fmt` | `(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `avgWBGT` | `+(CITIES.length?CITIES.reduce((s,c)=>s+c.baseWBGT,0)/CITIES.length:0).toFixed(1);` |
| `totalMort` | `CITIES.reduce((s,c)=>s+c.rcpMort[rcpIdx][horizonIdx],0);` |
| `avgDays35` | `CITIES.length?Math.floor(CITIES.reduce((s,c)=>s+c.days35,0)/CITIES.length):0;` |
| `barData` | `useMemo(()=>filteredCities.slice(0,25).map(c=>({` |
| `scatterData` | `useMemo(()=>CITIES.map(c=>({` |
| `uhiData` | `useMemo(()=>[...CITIES].sort((a,b)=>b.uhiIntensity-a.uhiIntensity).slice(0,30).map(c=>({` |
| `financialData` | `useMemo(()=>[...CITIES].sort((a,b)=>b.healthcostM-a.healthcostM).slice(0,30).map(c=>({` |
| `totalFinancial` | `useMemo(()=>({ healthCost:CITIES.reduce((s,c)=>s+c.healthcostM,0),insurance:CITIES.reduce((s,c)=>s+c.insuranceClaimsM,0), avgREImpact:+(CITIES.length?CITIES.reduce((s,c)=>s+c.realEstateImpactPct,0)/CITIES.length:0).toFixed(1), avgPortfolio:+(CITIES.length?CITIES.reduce((s,c)=>s+c.portfolioExposurePct,0)/CITIES.length:0).toFixed(1) }),[]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CITY_NAMES`, `COUNTRIES`, `HORIZONS`, `QUARTERS`, `RCP_SCENARIOS`, `SECTORS_LABOUR`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Excess Heat Mortality (per 100k/yr) | — | Gasparrini et al. / Lancet Countdown | Annual excess deaths per 100,000 population attributable to heat above MMT; Mediterranean cities average 25â€“35; Nordic cities average 5â€“10. |
| Minimum Mortality Temperature (°C) | — | City-specific exposure-response curves | Temperature at which all-cause mortality is minimised; varies by local acclimatisation; London MMT ~18°C, Athens MMT ~25°C. |
| Urban Heat Island Offset (°C) | — | ERA5 / Urban climate models | Temperature premium of urban core vs rural surroundings; increases excess heat mortality exposure by 15â€“35% for urban populations. |
| SSP3-7.0 Heat Mortality Uplift (%) | — | IPCC AR6 / Vicedo-Cabrera et al. 2021 | Projected increase in excess heat mortality by 2080 under SSP3-7.0 high-emission scenario relative to current baseline, controlling for adaptation. |
- **ERA5 daily temperature data by city** → Compute daily excess above MMT, apply 21-day distributed lag → **Daily excess heat exposure**
- **National mortality statistics (all-cause daily)** → Calibrate exposure-response function, extract β_heat coefficient → **City-specific heat mortality response curves**
- **IPCC SSP scenario temperature projections** → Apply projected temperature change to exposure-response model → **Future excess heat mortality by scenario and city**

## 5 · Intermediate Transformation Logic
**Methodology:** Excess Heat Mortality Rate
**Headline formula:** `EHMR = Σ_t max(0, T_t - MMT) × β_heat × Population × BaselineMortality`

Applies the Gasparrini et al. distributed lag non-linear model framework to estimate daily excess mortality as a function of temperature exposure above the minimum mortality temperature (MMT). The cumulative lagged effect over 0â€“21 days is summed to annual excess mortality, scaled by city population and baseline all-cause mortality rate.

**Standards:** ['Gasparrini et al. (2017) â€” Mortality Risk Attributable to High and Low Temperatures', 'Lancet Countdown Indicator 1.1.2', 'IPCC AR6 Chapter 7 â€” Health Impacts']
**Reference documents:** Gasparrini et al. (2017) â€” Global, Regional, and National Burden of Mortality Attributable to Non-Optimal Temperature; Lancet Countdown Indicator 1.1.2 â€” Heat-Related Mortality (2023); Vicedo-Cabrera et al. (2021) â€” The Burden of Heat-Related Mortality Attributable to Recent Human-Induced Climate Change; IPCC AR6 WG2 Chapter 7 â€” Health, Wellbeing and the Changing Structure of Communities

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Gasparrini DLNM backend replacing the seeded scenario multipliers (analytics ladder: rung 1 → 3)

**What.** The §7 mismatch flag is unambiguous: no MMT, no β_heat, no temperature series, no distributed lag — all 60 cities' `mortalityBase` values are `sr()` draws, and RCP/horizon projections are uniform multipliers (`1 + rcp×0.3 + horizon×0.25`) applied identically to every city. Evolution A builds the §8 model as this module's first backend vertical: a distributed-lag exposure-response engine computing annual excess heat mortality from daily temperature above a city-specific minimum-mortality temperature, with UHI offset and elderly-share vulnerability scaling. Targeting rung 3 directly is justified because the calibration targets already exist in the literature (Vicedo-Cabrera 2021 attributable fractions, Lancet Countdown Indicator 1.1.2).

**How.** (1) Ingest ERA5 daily temperature for a pilot set of 15–20 of the 60 named cities via the platform's existing Open-Meteo/NASA-POWER ingestion path (already wired for other modules). (2) New `heat_mortality` engine: published city-specific ERF coefficients and MMTs (London ~18°C, Athens ~25°C) from Gasparrini 2017 rather than fitting from scratch; 21-day cumulative lag; SSP ΔT applied to the ERF, not as a flat multiplier. (3) Validation pin: Europe-2022 backtest against the 61k excess-deaths figure cited in §8.5.

**Prerequisites.** The `genCities(60)` fabrication removed for pilot cities (honest nulls for the rest); daily mortality baselines per city (national statistics or GBD rates). **Acceptance:** two cities under identical scenario settings produce different mortality uplifts driven by their ERFs; pilot-city attributable fractions land within published Vicedo-Cabrera confidence intervals.

### 9.2 Evolution B — Longevity-impact copilot for insurers (LLM tier 1 → 2)

**What.** The module's stated buyer is life insurers/reinsurers quantifying longevity assumptions. Evolution B is a copilot answering "what does an 880-death RCP 8.5/2050 projection mean for an annuity book in this city?", "why is this city tiered Critical?", and "how does the MMT concept work?" — grounded in this Atlas page's §5 methodology and §8 spec, with mandatory candour that current numbers are seeded scenario multipliers (§7.5) until Evolution A ships.

**How.** Tier 1: atlas record into `llm_corpus_chunks`; the page passes current RCP/horizon slider indices and the derived `totalMort`/`avgWBGT` so answers narrate visible state, always attaching the synthetic-data caveat. Tier 2 after Evolution A: what-ifs ("rerun Athens under SSP1-2.6, 2080, elderly share 25%") execute as tool calls against the new engine route; the no-fabrication validator checks each mortality figure against tool output. TCFD/TNFD disclosure-drafting becomes viable only at tier 2, since disclosure text must cite computed, reproducible numbers.

**Prerequisites.** Copilot router + pgvector corpus (Phase 1); tier 2 and any disclosure-drafting gated hard on Evolution A. **Acceptance:** pre-Evolution-A, every quantitative answer carries the seeded-data caveat; post, every figure traces to a logged engine call with its MMT/ERF parameters disclosed.