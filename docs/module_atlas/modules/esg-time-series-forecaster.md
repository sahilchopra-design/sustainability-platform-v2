# ESG Time Series Forecaster
**Module ID:** `esg-time-series-forecaster` · **Route:** `/esg-time-series-forecaster` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Applies machine learning and statistical time series models to forecast ESG KPI trajectories at company, sector, and portfolio levels over 1â€“10 year horizons. Combines autoregressive, gradient boosting, and neural network models with macro-climate scenario inputs to generate probabilistic ESG forecast distributions. Supports target-setting, portfolio decarbonisation pathway management, and regulatory forward-looking disclosure requirements.

> **Business value:** Enables ESG analysts and portfolio managers to move beyond backward-looking ESG data to forward-looking trajectory management, supporting target-setting credibility assessments, proactive engagement with laggard issuers, and TCFD/IFRS S2 forward-looking metrics requirements.

**How an analyst works this module:**
- Select entity or portfolio, target KPI (e.g., Scope 1 intensity, water withdrawal, LTIR), and forecast horizon.
- Choose macro scenario (NGFS NZE, Current Policies, or custom) to condition sector-level macro features.
- Review point forecast, confidence bands, and target attainment probability in interactive timeline chart.
- Export forecast tables for TCFD forward-looking metrics disclosure, SBTi target monitoring, or investor update.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_YEARS`, `Badge`, `COMPANIES`, `EVENTS`, `HIST_YEARS`, `KpiCard`, `METRICS`, `METRIC_KEYS`, `Section`, `Sel`, `StatRow`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPANIES` | 13 | `id`, `name`, `sector`, `ticker`, `sbtiCommitted`, `netZeroYear` |
| `EVENTS` | 4 | `year`, `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `HIST_YEARS` | `Array.from({length:10},(_,i)=>2015+i);` |
| `ALL_YEARS` | `Array.from({length:21},(_,i)=>2015+i);` |
| `EVENTS` | `[{year:2015,label:'Paris Agreement'},{year:2020,label:'COVID-19'},{year:2022,label:'EU Taxonomy'},{year:2023,label:'CSRD'}];` |
| `trend` | `(data[data.length-1]-data[0])/(data.length-1);` |
| `val` | `level+dampedTrend*h*(1-gamma*h*0.01);` |
| `last` | `data[data.length-1];` |
| `mean` | `data.reduce((a,b)=>a+b,0)/data.length;` |
| `noiseScale` | `(Math.max(...data)-Math.min(...data))*0.05;` |
| `noise` | `(sr(seed*1000+h)-0.5)*noiseScale;` |
| `slope` | `xs.reduce((s,x,i)=>s+(x-mx)*(data[i]-my),0)/xs.reduce((s,x)=>s+(x-mx)**2,0);` |
| `intercept` | `my-slope*mx;` |
| `resids` | `data.map((d,i)=>d-(fitted[i]\|\|d));` |
| `frac` | `(y-currentYear)/(netZeroYear-currentYear);` |
| `seed` | `ci*13+mi*7;` |
| `baseVal` | `lo+(hi-lo)*sr(seed);` |
| `trendFactor` | `meta.direction==='higher_better'?0.015:-0.018;` |
| `data` | `HIST_YEARS.map((y,i)=>{` |
| `covid` | `(y===2020\|\|y===2021)?(meta.direction==='higher_better'?-0.06:0.05):0;` |
| `ensemble` | `hw.map((h,i)=>h*0.5+ar[i]*0.3+lt[i]*0.2);` |
| `residStd` | `calcResidStd(data,hw)\|\| (hi-lo)*0.02;` |
| `sbti` | `isEmission?sbtiPathway(data[data.length-1],company.netZeroYear):null;` |
| `changePoints` | `HIST_YEARS.filter((_,i)=>i>0&&Math.abs(data[i]-data[i-1])>1.5*residStd).map((y,idx)=>({` |
| `mae` | `data.reduce((s,d,i)=>s+Math.abs(d-hw[i]),0)/data.length;` |
| `rmse` | `Math.sqrt(data.reduce((s,d,i)=>s+(d-hw[i])**2,0)/data.length);` |
| `mape` | `data.reduce((s,d,i)=>s+Math.abs((d-hw[i])/d),0)/data.length*100;` |
| `aic` | `data.length*Math.log(rmse**2)+2*3;` |
| `forecastYears` | `Array.from({length:horizon},(_,i)=>2025+i);` |
| `sbtiVal` | `isEmission&&ts.sbti&&sbtiIdx>=0?+ts.sbti[sbtiIdx].toFixed(2):undefined;` |
| `trendPct` | `((forecastArr[horizon-1]-ts.data[ts.data.length-1])/ts.data[ts.data.length-1]*100).toFixed(1);` |
| `modelStats` | `{hw:{mae:ts.mae,rmse:ts.rmse,mape:ts.mape,aic:ts.aic},arima:{mae:ts.mae*1.12,rmse:ts.rmse*1.09,mape:ts.mape*1.08,aic:ts.aic+6},ensemble:{mae:ts.mae*0.88,rmse:ts.rmse*0.91,mape:ts.mape*0.87,aic:ts.aic-3}};` |
| `forecastFinal` | `forecastArr[Math.min(5,horizon-1)];` |
| `sbtiFinal` | `ts.sbti[Math.min(5,ts.sbti.length-1)];` |
| `div` | `((forecastFinal-sbtiFinal)/sbtiFinal*100).toFixed(1);` |
| `ltW` | `100-hwW-arW;` |
| `overlayData` | `useMemo(()=>{ const hist=HIST_YEARS.map((y,i)=>({year:y,actual:+ts.data[i].toFixed(2)}));` |
| `customEnsemble` | `useMemo(()=>ts.hw.map((h,i)=>(h*(hwW/100)+ts.ar[i]*(arW/100)+ts.lt[i]*(ltW/100)).toFixed(2)),[ts,hwW,arW,ltW]);` |
| `customRmse` | `useMemo(()=>{ const fitted=ts.data.map((_,i)=>(ts.hw[i]*(hwW/100)+ts.ar[i]*(arW/100)+ts.lt[i]*(ltW/100)));` |
| `rows` | `useMemo(()=>companies.map(c=>{` |
| `baseline` | `ts.data[ts.data.length-1];` |
| `divPct` | `sbti2030?(fore2030-sbti2030)/sbti2030*100:null;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `EVENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forecast Accuracy (MAPE %) | — | Backtested Model | Mean absolute percentage error on holdout set; below 15% MAPE indicates reliable 3-year forecast horizon. |
| KPI Trend (annual % change) | — | Model Output | Expected year-on-year KPI change under base scenario; negative trend for carbon intensity indicates decarbonisation progress. |
| Target Attainment Probability (%) | — | Monte Carlo Simulation | Probability that forecast trajectory meets committed ESG target by target year; below 50% triggers target review flag. |
| Forecast Uncertainty Band (P10–P90) | — | Quantile Regression | Interquartile range of KPI forecast at each horizon year; wide bands indicate high uncertainty requiring scenario planning. |
- **Company ESG KPI history (CDP, Bloomberg, Refinitiv)** → Clean and align annual time series; impute missing values using sector median interpolation → **ESG KPI time series at company level (5â€“10 year history)**
- **NGFS macro-climate scenario outputs (carbon price, energy price, GDP)** → Align scenario variables to company sector and geography; create forecast feature matrix → **Macro-conditioned feature set for XGBoost model**
- **SBTi target registry and internal target commitments** → Map target year and absolute/intensity metric to forecast output; compute attainment probability → **Target attainment probability and gap-to-target under each scenario**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Forecast Model
**Headline formula:** `KPI_t = f(KPI_{t-1}, ..., KPI_{t-p}, X_macro, ε_t)`

Ensemble model combining an ARIMA baseline with an XGBoost model incorporating macro-climate features (carbon prices, energy prices, regulatory dummies, sector capacity factors). Forecast confidence intervals are generated via quantile regression forests at the 10th, 50th, and 90th percentiles. Model selection uses rolling-origin cross-validation minimising RMSE over the 3-year holdout window.

**Standards:** ['ARIMA/Prophet Framework', 'XGBoost Time Series', 'NGFS Macro Scenarios']
**Reference documents:** Hyndman & Athanasopoulos â€” Forecasting: Principles and Practice (3rd Ed. 2021); Taylor & Letham â€” Forecasting at Scale (Prophet Model) 2018; NGFS Scenario Narrative and Data Release 2023; SBTi Monitoring, Reporting and Verification Framework 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises an *ensemble of ARIMA + XGBoost
> gradient boosting + neural nets*, *quantile regression forests* for P10/P50/P90 bands, *NGFS
> macro-climate feature conditioning*, and *rolling-origin cross-validation*. **None of the ML models
> exist in the code.** What the page actually runs is a hand-coded classical trio — **damped
> Holt-Winters, an AR(1) mean-reverting process, and OLS linear-trend** — blended by fixed weights,
> with a Gaussian ±1.96σ band (not quantile regression) and MAPE/RMSE/AIC computed *in-sample* (no
> cross-validation). The input series is entirely synthetic (`sr()` PRNG). The sections below
> document the real code.

### 7.1 What the module computes

For each `(company, metric)` pair the page builds a 10-year synthetic history (2015–2024) and
forecasts 21 steps forward, then blends three forecasters into an ensemble:

```
ensemble[i] = 0.5·hw[i] + 0.3·ar[i] + 0.2·lt[i]
```

The three base models (all in code):

- **Damped Holt-Winters** (`hwForecast`, α=0.3, β=0.1, γ=0.2, damp φ=0.95):
  `level = α·y + (1−α)(level+trend)`, `trend = β·(level−prevLevel) + (1−β)·trend`, then
  `val = level + dampedTrend·h·(1 − γ·h·0.01)` with `dampedTrend *= 0.95` each step. There is **no
  seasonal component** despite the "Winters" name — annual ESG data has no intra-year season.
- **AR(1)** (`arForecast`, φ=0.7): `y_h = 0.7·y_{h−1} + 0.3·mean + noise`, noise =
  `(sr(seed·1000+h) − 0.5)·0.05·(max−min)`.
- **OLS linear trend** (`linearTrendForecast`): closed-form slope/intercept regression on the index.

Companion outputs: `sbtiPathway` (linear glidepath to net-zero year), `changePoints` (year-over-year
jumps > 1.5σ), and in-sample error stats `mae`, `rmse`, `mape`, `aic`.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| HW smoothing α / β / γ | 0.3 / 0.1 / 0.2 | Hard-coded; conventional low-reactivity defaults (Hyndman & Athanasopoulos ch. 8) |
| HW damping φ | 0.95 | Hard-coded; damped-trend guards against explosive extrapolation |
| AR coefficient φ | 0.7 | Hard-coded heuristic (moderate persistence); not estimated from data |
| Ensemble weights | 0.5 / 0.3 / 0.2 (hw/ar/lt) | Hard-coded; user-tunable via `hwW`/`arW` sliders in a later tab |
| AIC penalty | `n·ln(rmse²) + 2·3` | 3 free parameters assumed; standard AIC form |
| Band width | `residStd · 1.96 · (1 + i·0.08)` | Normal 95% band, widening 8%/step — **not** quantile regression |
| Metric ranges (`METRICS`) | e.g. Scope 1 [500, 50000] ktCO₂e | Synthetic demo bounds; `direction: lower/higher_better` sets trend sign |
| History trend factor | +1.5%/yr (higher_better) or −1.8%/yr (lower_better) | Synthetic generator assumption |
| COVID shock | ±5–6% in 2020–21 | Injected into synthetic history only |

### 7.3 Calculation walkthrough

1. `generateTimeSeries` seeds `baseVal = lo + (hi−lo)·sr(ci·13 + mi·7)`, then walks 10 years applying
   `trendFactor·i`, a COVID bump, and `±4%·(hi−lo)` noise.
2. The three forecasters each project 21 steps; `ensemble` blends them.
3. `residStd` = std of HW in-sample residuals; drives the confidence band.
4. If the metric is an emission (`scope1/2/3`, `energy_intensity`), `sbtiPathway` builds a straight-line
   decarbonisation glidepath from the last actual to zero at `netZeroYear`.
5. Headline `trendPct = (forecast[H−1] − lastActual) / lastActual × 100`; `div` = forecast vs SBTi gap.

### 7.4 Worked example

Company **Shell (c1)**, metric **scope1 (mi index 1)**, range [500, 50000], `lower_better`:

| Step | Computation | Result |
|---|---|---|
| seed | 1·13 + 1·7 | 20 |
| sr(20) | frac(sin(21)·10⁴) | ≈ 0.6435 |
| baseVal | 500 + 49500·0.6435 | ≈ 32,353 ktCO₂e |
| trendFactor | lower_better | −0.018/yr |
| 2024 value (i=9, noise≈0) | 32,353·(1 − 0.018·9) | ≈ 27,111 |
| HW damped extrapolation → 2034 | level≈27k, damped negative trend | ≈ 24,600 |
| SBTi 2034 (netZero 2050, base 27,111) | 27,111·(1 − (2034−2024)/(2050−2024)) | ≈ 16,680 |
| Divergence | (24,600 − 16,680)/16,680 | **+47%** above SBTi path |

The +47% gap is the module's headline "off-track" signal — the forecast declines, but far slower than
the 1.5°C-aligned SBTi glidepath demands.

### 7.5 Interactive ensemble & model-comparison tabs

A later tab exposes `hwW`/`arW` sliders (with `ltW = 100 − hwW − arW`) so the user re-weights the
blend live; `customRmse` recomputes in-sample fit. The model-comparison table fabricates ARIMA and
ensemble error stats as *multipliers* on the HW stats (`arima.mae = hw.mae·1.12`,
`ensemble.mae = hw.mae·0.88`) rather than fitting separate models — so the "ensemble beats ARIMA"
story is baked in, not measured.

### 7.6 Data provenance & limitations

- **All history is synthetic**, generated by `sr(seed)=frac(sin(seed+1)·10⁴)`. No CDP/Bloomberg/
  Refinitiv feed is wired in despite the guide's data-lineage claims.
- **No cross-validation**: MAPE/RMSE/AIC are in-sample fit errors on the same 10 points the model
  saw — they overstate real forecast accuracy and cannot support the guide's "<15% MAPE = reliable"
  claim.
- **No macro conditioning**: NGFS carbon/energy-price features never enter any forecaster.
- **Bands are Gaussian, symmetric, and heuristic** (1.96σ widening 8%/step), not quantile forests;
  they will mis-cover skewed emission trajectories.
- **SBTi path is linear-to-zero**, ignoring SBTi's actual 4.2%/yr (1.5°C) absolute-contraction and
  sector-decarbonisation (SDA) methods.

**Framework alignment:** Holt-Winters/AR/OLS follow Hyndman & Athanasopoulos *Forecasting: Principles
and Practice* (classical exponential smoothing + ARIMA family). SBTi glidepath approximates the
**Science Based Targets initiative** near-term criterion (1.5°C ≈ 4.2%/yr linear absolute reduction) —
the code uses a simpler straight line to the self-declared net-zero year. TCFD/IFRS S2 forward-looking
metrics are the stated use case but not directly produced.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The page displays MAPE/RMSE, P10–P90 bands,
target-attainment probabilities, and NGFS-conditioned forecasts that the code either fakes (band, ML
stats) or omits (macro features, cross-validation). Below is the production model the guide describes.

**8.1 Purpose & scope.** Forecast forward ESG KPI trajectories (Scope 1/2/3, intensities, governance
metrics) at company/sector/portfolio level over 1–10 years with calibrated uncertainty, to support
SBTi target credibility, engagement prioritisation, and TCFD/IFRS S2 forward-looking disclosure.

**8.2 Conceptual approach.** A hierarchical ensemble mirroring industry forward-ESG practice
(MSCI Implied Temperature Rise trajectory engine; Trucost/S&P forward-emissions; Bloomberg BNEF
sector pathways): (a) a structural decarbonisation-pathway prior (SBTi SDA / IEA NZE sector curve),
(b) a statistical time-series learner conditioned on NGFS macro drivers, blended by out-of-sample
skill. Uncertainty via quantile regression, not a Gaussian band — the guide's explicit requirement.

**8.3 Mathematical specification.**

Let `y_{c,t}` be the KPI for company c. Decompose into pathway prior + residual dynamics:

```
y_{c,t} = π_{c,t} + r_{c,t}
π_{c,t} = SDA/absolute-contraction pathway to target (structural prior)
r_{c,t} = Σ_p φ_p r_{c,t−p} + Σ_k β_k X_{k,t} + ε_{c,t}      (ARX residual)
X_t     = {carbon price, energy price, GDP growth, policy dummy, sector capacity factor}  (NGFS)
Quantile forecast: Q_τ(y_{c,t+h}) via gradient-boosted quantile regression (τ∈{0.1,0.5,0.9})
Target attainment P = P(y_{c,T} ≤ target_T) = fraction of QRF/MC paths below target
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Pathway slope (1.5°C) | 4.2%/yr abs. | SBTi Near-Term Criteria v5; SDA per sector |
| AR order / coeffs | p, φ_p | Estimated per series (AIC/BIC), rolling-origin CV |
| Macro betas | β_k | Regression on NGFS Phase IV carbon/energy/GDP paths |
| Quantile grid | τ | 0.1 / 0.5 / 0.9 (P10/P50/P90) |
| CV window | — | 3-year holdout, rolling-origin (Hyndman §5.10) |

**8.4 Data requirements.** Company KPI history (CDP, Bloomberg, Refinitiv — ≥5yr); SBTi target
registry (target year, absolute vs intensity, SDA sector); NGFS Phase IV scenario variables (carbon
price, energy price, GDP). Platform already holds NGFS scenario tables (migration 088
`climate_scenario_variables`), a SBTi reference table, and the reference-data layer (OWID CO₂/energy).

**8.5 Validation & benchmarking plan.** Rolling-origin CV MAPE/RMSE on a true holdout; PIT/coverage
tests on the quantile bands (should hit 80% coverage for P10–P90); backtest attainment probabilities
against realised outcomes (calibration curve). Reconcile P50 trajectories against MSCI ITR and S&P
Trucost forward-emissions where issuers overlap.

**8.6 Limitations & model risk.** Short annual histories (5–10 pts) limit AR order and macro-beta
identifiability — shrink betas toward zero and lean on the structural pathway prior. Structural
breaks (M&A, methodology restatements) break AR persistence; flag via changepoint detection and reset
the level. Conservative fallback: when CV skill < persistence benchmark, revert to the SBTi pathway
prior with widened bands.

## 9 · Future Evolution

### 9.1 Evolution A — Real KPI histories under the existing forecast machinery (analytics ladder: rung 2 → 4)

**What.** The page implements a surprising amount of real forecasting math in-browser: damped-trend exponential smoothing, OLS trend fitting, residual-based confidence bands, a weighted 3-model ensemble with user-adjustable weights, change-point flags, MAE/RMSE/MAPE/AIC, and SBTi-pathway divergence — genuinely rung 2. Two dishonesty pockets: the histories themselves are seeded (`baseVal = lo + (hi−lo)·sr(seed)` with authored COVID dips), and the "ARIMA" comparison stats are fabricated by scaling the Holt-Winters stats (`arima: {mae: ts.mae×1.12…}`) — a fake model in the comparison table. Evolution A supplies real series and real competitor models, earning the roadmap's rung-4 "forecasting layered on ingested history."

**How.** (1) KPI histories from real sources: CDP emissions disclosures and the platform's parsed-report extractions (`esg-report-parser` Evolution A is the feeder) into a `kpi_history` table — 5–10 years per company/metric where disclosure exists, honest gaps where not. (2) `services/esg_forecast_engine.py`: port the ensemble server-side; replace the fake ARIMA row with an actual statsmodels ARIMA fit (the environment has it), and compute holdout MAPE by real backtest split rather than in-sample fit stats. (3) Target-attainment probability from residual-bootstrap simulation (the §4 promise), replacing point divergence. (4) Model cards per §8; a fixture-series bench pin for the smoothing recursion.

**Prerequisites (hard).** The seeded histories deleted when real ones land — forecasting fabricated history is double fabrication; minimum-history gating (≥5 annual points or refuse, in the `MIN_HISTORY` spirit). **Acceptance:** a real company's Scope 1 series matches its CDP disclosures; the ARIMA row comes from an actual fit with its own residuals; holdout MAPE is reported per the split, not in-sample; below-minimum series return honest refusals.

### 9.2 Evolution B — Target-credibility reviewer for engagement and disclosure (LLM tier 2)

**What.** The module's sharpest output is SBTi divergence — forecast trajectory vs committed pathway. A tool-calling reviewer operationalizes it: "assess the credibility of company X's 2030 target" runs the forecast, computes attainment probability and divergence, checks the change-point history for evidence of inflection (has decarbonization actually accelerated since the commitment?), and drafts the engagement note or the TCFD forward-looking-metrics paragraph — probabilities and divergences strictly from engine output, with the forecast's own MAPE quoted as the credibility caveat.

**How.** Tools: `forecast(entity, metric, horizon, scenario)`, `attainment_probability(entity, target)`, `get_changepoints(entity, metric)`, `compare_to_pathway(entity, pathway)`. Grounding corpus = this Atlas record's §2.1 method inventory so the reviewer describes the actual ensemble (and its weights) rather than implying deep learning. The framing rule: forecasts are conditional extrapolations, not predictions of intent — the note must carry the uncertainty band and the model's holdout error, and "below 50% attainment probability" triggers the module's own review-flag language, not editorializing.

**Prerequisites (hard).** Evolution A — a credibility verdict on a seeded history would asses a fictional company's fictional progress under a real company's name. **Acceptance:** a golden entity's note quotes attainment probability, band, and MAPE matching engine outputs; change-point claims cite detected years; entities with insufficient history get the refusal, never a vibes-based credibility call.