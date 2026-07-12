# Solar Resource & Performance Analytics
**Module ID:** `solar-resource-performance` · **Route:** `/solar-resource-performance` · **Tier:** B (frontend-computed) · **EP code:** RE-RES1 · **Sprint:** RE

## 1 · Overview
Engineering-grade solar resource assessment and operational performance analytics with NASA POWER live API integration. Covers GHI/DNI/DHI irradiance analysis, PR/CUF/availability metrics, PVsyst-style loss waterfall (13 loss factors), Arrhenius degradation modelling, weather normalization via P-value regression, and soiling analytics across 18 analytical tabs.

> **Business value:** Essential for solar asset managers, technical advisors (independent engineers), and lenders conducting resource assessment. Replicates the PVsyst + SolarAnywhere workflow for pre-construction yield studies and operational performance benchmarking — with free NASA POWER irradiance data as a rapid-access alternative to paid satellite data providers (SolarAnywhere, Solargis).

**How an analyst works this module:**
- Select a location preset (Phoenix/Chicago/Madrid/Dubai/Chennai/Santiago/Custom) in the left Site panel; set capacity MW, tilt, azimuth, and mounting configuration (Fixed/SAT/DAT)
- Choose module technology in the left Module panel (Mono PERC / Bifacial PERC / TOPCon / HJT / CdTe); enable Bifacial Gain and set bifacial factor and albedo
- Open "Monthly GHI" tab for monthly GHI/DNI/DHI breakdown; "Temperature" tab shows ambient vs cell temperature and temperature coefficient comparison across technologies
- Navigate to "PR Analysis" tab for the IEC 61724-1 loss waterfall: POA irradiance → temperature losses → soiling → wiring → mismatch → shading → inverter → bifacial gain → Net Yield
- Check "Energy Yield" tab for monthly MWh production and the 25-year revenue projection with PPA escalation; "Technology Compare" tab ranks all 5 technologies by 25-yr lifetime energy and $/Wp value
- Open "Degradation" tab for the Arrhenius calendar aging curve (LFP/NMC/NCA) — configure annual degradation rate and LID in the left panel; "Soiling & Loss" shows monthly soiling vs rainfall and cleaning schedule optimization
- Review "P50/P90" tab for lognormal probabilistic yield: P50/P75/P90/P99 values and uncertainty source decomposition (interannual GHI, satellite uncertainty, degradation, soiling)
- Navigate to "Tilt Optimization" (optimal tilt = lat × 0.87 + 4°) and "Tracker vs Fixed" for SAT/DAT gain quantification and incremental NPV economics
- Check "Shading Analysis" tab for GCR-dependent hourly shading model and "Inverter Performance" for CEC/Euro-weighted efficiency curve and clipping analysis
- Open "NASA POWER Live" tab to fetch live monthly GHI data for the selected lat/lon via NASA POWER API; compare satellite vs NASA data in "Satellite vs Ground" tab; download "Summary Report" for IE submission

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `LOCATIONS`, `MODULE_TECHS`, `MONTHS`, `SideSection`, `Slider`, `TABS`, `Toggle`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LOCATIONS` | 10 | `lat`, `lon`, `region`, `ghiBase`, `tempAvg` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tempShape` | `[-0.65, -0.50, -0.10, 0.35, 0.75, 1.10, 1.30, 1.25, 0.85, 0.30, -0.20, -0.55];` |
| `annual` | `ghiBase * 365;` |
| `ghi` | `ghiShape[i] * ghiBase * (1 + (sr(seed + i * 3) - 0.5) * 0.06);` |
| `dni` | `ghi * (0.60 + sr(seed + i * 7) * 0.20);` |
| `dhi` | `ghi - dni * 0.75;` |
| `temp` | `tempAvg + tempShape[i] * Math.abs(tempAvg) * 0.8 + (sr(seed + i * 11) - 0.5) * 2;` |
| `wind` | `2.5 + sr(seed + i * 5) * 3.5;` |
| `humidity` | `35 + sr(seed + i * 13) * 45;` |
| `clearness` | `(ghi / (ghiShape[i] * ghiBase + 0.01)).toFixed(2);` |
| `tCell` | `m.temp + 25 * 0.03;` |
| `tempLoss` | `Math.abs(tempCoeff) * Math.max(0, tCell - 25);` |
| `totalLoss` | `soilingAnnual / 100 + wiring / 100 + mismatch / 100 + shading / 100 + (1 - inverterEff / 100);` |
| `yieldKwh` | `m.ghi * pr;` |
| `factor` | `y === 0 ? 1 : (1 - firstYear - lid) * Math.pow(1 - annualDeg, y - 1);` |
| `p90` | `annualMWh * Math.exp(-1.282 * sigma);` |
| `p75` | `annualMWh * Math.exp(-0.674 * sigma);` |
| `p99` | `annualMWh * Math.exp(-2.326 * sigma);` |
| `optTilt` | `Math.abs(lat) * 0.87 + 4;` |
| `penalty` | `Math.abs(tilt - optTilt) / 90;` |
| `gain` | `ghiBase * 365 * (1 - 0.4 * penalty * penalty);` |
| `lat` | `locIdx === LOCATIONS.length - 1 ? customLat : loc.lat;` |
| `lon` | `locIdx === LOCATIONS.length - 1 ? customLon : loc.lon;` |
| `monthData` | `useMemo(() => buildMonthly(loc.ghiBase * trackerGain, loc.tempAvg, locIdx * 100), [loc, trackerGain, locIdx]);` |
| `prData` | `useMemo(() => calcPR(monthData, tech.tempCoeff, soilingAnnual, wiringLoss, mismatchLoss, shadingLoss, inverterEff), [monthData, tech, soilingAnnual, wiringLoss, mismatchLoss, shadingLoss, inverterEff]);  // ── Bifacial gain ── const bifGain = (useBifacial && tech.bifacial) ? tech.bifGain * bifacialFactor * albedo : 0;` |
| `annualGHI` | `useMemo(() => prData.reduce((s, m) => s + m.ghi, 0), [prData]);` |
| `annualPR` | `useMemo(() => prData.reduce((s, m) => s + m.pr, 0) / 12, [prData]);` |
| `specificYield` | `useMemo(() => annualGHI * (annualPR / 100) * (1 + bifGain), [annualGHI, annualPR, bifGain]);` |
| `annualMWh` | `useMemo(() => specificYield * siteCapMW * 1000 / 1000, [specificYield, siteCapMW]);` |
| `cfPct` | `useMemo(() => annualMWh / (siteCapMW * 8760) * 100, [annualMWh, siteCapMW]);` |
| `degCurve` | `useMemo(() => buildDegCurve(analysisYears, tech.annualDeg, tech.lid), [analysisYears, tech]);  // ── Revenue over life ── const revenueCurve = useMemo(() => degCurve.map(d => { const mwh = annualMWh * d.factor / 100;` |
| `price` | `ppaPriceMWh * Math.pow(1 + escalator / 100, d.year);` |
| `rev` | `mwh * price / 1e6;` |
| `totalRevM` | `useMemo(() => revenueCurve.reduce((s, d) => s + d.rev, 0), [revenueCurve]);` |
| `npvFactor` | `useMemo(() => revenueCurve.reduce((s, d, i) => s + d.rev / Math.pow(1 + discountRate / 100, i + 1), 0), [revenueCurve, discountRate]);` |
| `tiltCurve` | `useMemo(() => buildTiltCurve(lat, loc.ghiBase), [lat, loc.ghiBase]); const optTilt = useMemo(() => Math.abs(lat) * 0.87 + 4, [lat]);` |
| `techCompare` | `useMemo(() => Object.entries(MODULE_TECHS).map(([k, tc]) => {` |
| `yield25` | `specificYield * (1 + bf) * (1 - tc.lid - tc.annualDeg * analysisYears / 2);` |
| `energy25` | `yield25 * siteCapMW;` |
| `lossWaterfall` | `useMemo(() => [ { name: 'POA Irradiance', value: annualGHI, bar: annualGHI }, { name: '− Temp. Losses', value: -(annualGHI * Math.abs(tech.tempCoeff) * Math.max(0, loc.tempAvg + 15 - 25)), bar: -(annualGHI * Math.abs(tech.tempCoeff) * 5) }, { name: '− Soiling', value: -(annualGHI * soilingAnnual / 100), bar: -(annualGHI * soilingAnnual / ` |
| `nasaCompare` | `useMemo(() => MONTHS.map((m, i) => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `LOCATIONS`, `MONTHS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Performance Ratio (PR) | `E_actual / (G_ref × P_rated)` | IEC 61724-1 | Core operational KPI; IEC 61724-1 defines PR; >80% is strong; below 75% signals inverter or soiling issue |
| Capacity Utilisation Factor (CUF) | `Annual MWh / (capacity × 8,760)` | Plant SCADA | Equivalent to capacity factor; 20–28% typical for fixed-tilt utility solar in high-irradiance locations |
| Temperature Coefficient Loss | `α_T × (T_module − 25°C) × G/1000` | IEC 61853-2 | Modern mono-PERC: −0.35%/°C; TOPCon: −0.28%/°C; higher losses in hot climates (India, MENA, Australia) |
| Soiling Loss | `ΔPR_soiling = PR_clean − PR_actual (periods without rain)` | Empirical IEC 61724 | Largest variable loss in arid regions (MENA, India); automated cleaning triggers when soiling loss > cleaning cost breakeven (~3–5%) |
| Degradation Rate | `Arrhenius calendar aging + EFC cycle aging` | NREL degradation survey | Industry median 0.50%/yr (mono-PERC); Arrhenius component dominates for utility-scale; LID corrected in first-year by P stabilization |
| P90 GHI (10-year) | `Inter-annual variability from NASA POWER historical data` | NASA POWER + TMY | P90 10-year (P90/√10) used by lenders; single-year P90 is −6 to −12% depending on climate zone |
| NASA POWER GHI | `ALLSKY_SFC_SW_DWN parameter, 1/2° resolution` | NASA POWER v2.0 (MERRA-2) | Free NASA satellite-derived irradiance; 1-degree spatial resolution; validated against ground stations at ±8% annual accuracy for most locations |
- **NASA POWER API (lat/lon → ALLSKY_SFC_SW_DWN, T2M, 2015–2023)** → Monthly GHI + temperature parsing → **Site-specific P50 GHI, inter-annual variability σ, TMY construction**
- **User-defined system parameters (capacity, tilt, azimuth, losses)** → 13-factor loss waterfall calculation → **DC/AC energy estimate, PR, CUF, soiling-adjusted yield**
- **Historical production data (user upload or seeded)** → OLS regression: production ~ GHI × temperature → **R², normalized PR, weather-adjusted underperformance identification**

## 5 · Intermediate Transformation Logic
**Methodology:** OLS Weather Normalization + Arrhenius Degradation + PVsyst Loss Waterfall
**Headline formula:** `PR_norm = PR_actual × (T_ref − 25) / (T_act − 25) × (GHI_ref/GHI_act); Δη(t) = A·exp(−Ea/RT)·√t + EFC·k_cyc`

Performance Ratio: actual generation / (GHI × nameplate capacity × module efficiency); normalized using temperature coefficient (−0.35%/°C from 25°C STC). OLS regression decomposes actual production into GHI-explained variance (R²) and residual (operational underperformance). Arrhenius calendar aging: Δη_cal = A × exp(−Ea / (R × T_avg)) × √(operating_years); Cycle aging: Δη_cyc = EFC × k_cyc; Combined: √(Δη_cal² + Δη_cyc²). Loss waterfall applies 13 sequential loss factors from GHI_ref to POA to DC to AC output.

**Standards:** ['IEC 61724-1', 'IEC 61853-2', 'ASTM E2848', 'PVsyst 7.x methodology']
**Reference documents:** IEC 61724-1:2021 — Photovoltaic System Performance — Part 1: Monitoring; IEC 61853-2:2016 — PV Module Performance Testing and Energy Rating; NASA POWER v2.0 — Prediction of Worldwide Energy Resources API Documentation; NREL — Review and Status of Degradation Rates of Crystalline Silicon PV (Jordan et al., 2022); PVsyst 7.x — Technical Reference Manual (Photovoltaic System Software)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `EnergyAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (methodology).** The guide claims **"OLS Weather Normalization + Arrhenius
> Degradation"** — `PR_norm` via temperature/GHI regression and `Δη_cal = A×exp(−Ea/RT)×√years` calendar-
> aging kinetics. **Neither is implemented.** There is no regression function (no `production ~ GHI ×
> temperature` OLS fit, no R² output) and no Arrhenius exponential-kinetics formula anywhere in the file —
> degradation uses a simpler linear-annual-rate compounding model (`buildDegCurve`, documented below), and
> weather "normalization" does not appear as a calculation. The genuinely implemented pieces (PR waterfall,
> P50/P90 lognormal quantiles, tilt optimisation, live NASA POWER fetch) are documented below as they exist.

### 7.1 What the module computes

This is an 18-tab engineering-grade resource-assessment tool. Monthly GHI/DNI/DHI/temperature data is
seeded per location (8 real-city presets: Phoenix, Chicago, Madrid, Dubai, Chennai, Santiago, Johannesburg,
Perth, plus Custom lat/lon) via `buildMonthly()`, and 5 real module technologies (PERC, Bifacial PERC,
TOPCon, HJT, CdTe) carry genuine published parameter ranges (temp coefficient −0.24 to −0.35%/°C, annual
degradation 0.30–0.50%/yr, LID 0.1–1.5%). Several calculation functions are **legitimately implemented,
correctly-formed engineering calculations**, not `sr()`-fabricated headline numbers:

```js
// Performance Ratio (IEC 61724)
tCell    = temp + 25 × 0.03                                    // ⚠️ see limitation below — not irradiance-dependent
tempLoss = |tempCoeff| × max(0, tCell − 25)
PR       = max(0.60, 1 − tempLoss − (soiling+wiring+mismatch+shading)/100 − (1−inverterEff/100))

// Degradation (linear-annual, NOT Arrhenius)
factor(y) = y===0 ? 1 : (1 − firstYearLoss − LID) × (1 − annualDeg)^(y−1)

// P50/P90/P75/P99 (lognormal quantile model — CORRECT statistical form)
p90 = p50 × exp(−1.282 × σ)     // −1.282 = standard normal 10th-percentile z-score
p75 = p50 × exp(−0.674 × σ)
p99 = p50 × exp(−2.326 × σ)

// Tilt optimisation
optTilt = |latitude| × 0.87 + 4
gain(tilt) = ghiBase × 365 × (1 − 0.4 × ((tilt−optTilt)/90)²)
```

A **live NASA POWER API fetch** (`fetch(url, {signal: AbortSignal.timeout(10000)})`) retrieves real
satellite-derived GHI/temperature data for the "NASA POWER Live" tab, given a lat/lon.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| `MODULE_TECHS` | PERC temp coeff −0.35%/°C deg 0.45%/yr; HJT −0.26%/°C deg 0.30%/yr | matches published manufacturer datasheet ranges cited in the guide |
| Location `ghiBase`/`tempAvg` | Phoenix 5.98 kWh/m²/day/23.2°C; Chicago 4.04/9.8°C | plausible real climatological averages for the named cities |
| P50/P90 σ (interannual variability) | 0.07 default (7%) | consistent with the guide's cited single-year P90 range (−6 to −12% vs P50); `exp(−1.282×0.07)=0.913`, i.e. **−8.7%** P90-vs-P50 gap at the default σ — within the cited range |
| `optTilt` formula | `|lat|×0.87+4` | matches the widely-used PVsyst/industry rule-of-thumb for optimal fixed-tilt angle |
| Cell-temperature model | `tCell = temp + 0.75°C` (constant offset, `25×0.03`) | **not a NOCT-based model** — see limitation below |

### 7.3 Calculation walkthrough

- **PR Analysis tab**: correctly implements the IEC 61724-1 structure of layering temperature loss on top of
  fixed soiling/wiring/mismatch/shading/inverter losses, floored at 60% PR to avoid unphysical negative
  values.
- **P50/P90 tab**: the lognormal quantile transform is **the correct statistical formula** for translating an
  interannual coefficient of variation into exceedance-probability energy estimates — matching how real
  independent-engineer reports derive P90 for lender debt-sizing.
- **Tilt Optimization tab**: a quadratic-penalty approximation around the latitude-derived optimal tilt — a
  standard simplified heuristic, not a full solar-position/POA-irradiance integration (which would require
  hourly sun-path modelling, e.g. via the Perez or Hay-Davies transposition models the guide names but the
  code does not implement).
- **Degradation tab**: compounds a **fixed linear annual rate**, not the guide's claimed Arrhenius
  temperature-activated kinetics — see the mismatch flag.
- **NASA POWER Live tab**: performs a genuine live fetch; correctly labelled and isolated from the seeded
  data used elsewhere in the module.

### 7.4 Worked example

Phoenix, PERC technology, June (`ghiShape[5]=1.25`, `ghiBase=5.98`, `tempAvg=23.2`, `tempShape[5]=1.10`):

| Step | Computation | Result |
|---|---|---|
| June GHI | 1.25 × 5.98 × (1±3%) | ≈7.48 kWh/m²/day |
| June temp | 23.2 + 1.10×23.2×0.8 + noise | ≈23.2+20.4 ≈ **43.6°C** ambient |
| `tCell` (as coded) | 43.6 + 0.75 | **44.35°C** |
| `tempLoss` | 0.35% × max(0, 44.35−25) | 0.35%×19.35 = **6.77%** |

At a real Phoenix June midday, module surface temperature typically runs **20–30°C above ambient** under
full sun (NOCT-based estimate: ~43.6+25 ≈ 68–70°C), not the ~0.75°C the code's flat-offset formula produces
— meaning the model's `tCell` **substantially understates real cell temperature**, and consequently
understates `tempLoss` (true loss at 70°C would be ~0.35%×45 ≈ 15.75%, more than double the coded 6.77%).
This is a genuine physics simplification/bug, not a labelling issue — the formula's structure (linear temp
coefficient × excess-over-25°C) is correct, but the `tCell` input feeding it is not.

### 7.5 Data provenance & limitations

- **The PR, P50/P90, and tilt-optimisation formulas are correctly implemented** per their respective
  standard methodologies (IEC 61724-1, lognormal exceedance statistics, latitude-tilt heuristics).
- **The cell-temperature model (`tCell = temp + 0.75`) is not irradiance-dependent**, unlike the real
  NOCT-based formula the guide implies (`T_cell = T_amb + (NOCT−20)/800 × G_poa`) — this causes `tempLoss`
  to be materially understated at high-irradiance, hot-climate sites, directly inflating the displayed PR
  and annual yield for exactly the locations (Phoenix, Dubai, Chennai) where temperature losses matter most.
- **No Arrhenius calendar-aging kinetics and no OLS weather-normalization regression exist**, despite being
  the guide's headline methodology — see the mismatch flag.
- Monthly GHI/DNI/DHI shape profiles and seeded noise (`sr()`) are illustrative, not location-specific
  satellite data, **except** on the NASA POWER Live tab where real data is genuinely fetched.

### 7.6 Framework alignment

- **IEC 61724-1 (PV system performance monitoring)** — the PR calculation structure (loss waterfall from
  irradiance to net yield) is faithful to the standard's intent, modulo the cell-temperature input issue
  noted above.
- **NASA POWER v2.0 API** — genuinely, correctly integrated for live irradiance/temperature retrieval.
- **PVsyst 7.x methodology** — the tilt-optimisation heuristic and loss-waterfall category structure mirror
  PVsyst's general approach; PVsyst's own Perez transposition model and detailed thermal model are not
  reproduced.
- **NREL degradation survey (Jordan et al.)** — the linear-annual degradation range (0.35–0.70%/yr) is
  consistent with the guide's cited figures; the Arrhenius-kinetics claim in the guide is aspirational,
  not implemented.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the promised OLS normalisation and Arrhenius aging; fix cell-temperature (analytics ladder: rung 2 → 3)

**What.** This is a genuinely strong engineering module — live NASA POWER irradiance integration, a correctly-formed IEC 61724 PR waterfall, and a statistically-correct lognormal P50/P90 quantile model (`p90 = p50 × exp(−1.282σ)`). But §7 flags that two headline methodologies the guide advertises are **not implemented**: there is no OLS weather-normalisation regression (`production ~ GHI × temperature`, no R² output) and no Arrhenius degradation kinetics (`Δη = A·exp(−Ea/RT)·√t`) — degradation uses a simpler linear-annual model. It also notes a cell-temperature bug: `tCell = temp + 25×0.03` is not irradiance-dependent, understating thermal losses at high POA. Evolution A closes the guide↔code gaps and fixes the physics.

**How.** (1) Implement OLS weather normalisation: regress actual production on GHI and temperature, output R² and the residual (operational underperformance) the guide describes — the tool already has the live NASA POWER data to fit against. (2) Implement Arrhenius calendar aging as an alternative to (or validation of) the linear model, per the guide's `A·exp(−Ea/RT)·√years` form. (3) Fix cell temperature to the standard NOCT/irradiance-dependent form (`T_cell = T_amb + POA/800 × (NOCT−20)`), so thermal loss scales with irradiance. (4) Bench-pin the PR and P90 calculations against a known PVsyst reference case.

**Prerequisites.** The regression needs a production time series (live NASA POWER + user generation data); Arrhenius parameters (Ea, A) per technology from the Jordan et al. survey. **Acceptance:** the normalisation tab outputs a real R² from an OLS fit; cell temperature rises with POA irradiance (matching PVsyst); a bench case reproduces expected PR within tolerance.

### 9.2 Evolution B — Resource-assessment copilot for technical advisors (LLM tier 2)

**What.** A copilot for the asset-manager/independent-engineer/lender users: "pull the irradiance profile for this site and estimate P90 yield", "why is this plant underperforming its expected PR?", "compare TOPCon vs HJT lifetime energy here" — with the site fetch triggering the live NASA POWER call, and the analysis narrating the PR waterfall, P50/P90 bands, and (post-Evolution-A) the OLS-decomposed underperformance.

**How.** Tier-2 pattern: the NASA POWER fetch and the PR/P90/tilt-optimisation calculators become tools; the copilot passes site/module parameters, receives computed results, and narrates them — never fabricating irradiance or yield. Underperformance diagnosis cites the OLS residual and the specific loss-waterfall stages; technology comparisons narrate the deterministic ranking. Provenance UX shows the NASA POWER query and the loss-factor breakdown.

**Prerequisites.** Evolution A's OLS normalisation, so underperformance answers cite a real residual rather than the (unimplemented) regression the guide promises. The live fetch already exists for the resource side. **Acceptance:** every irradiance and yield figure traces to a NASA POWER fetch or a calculator run; underperformance claims cite the OLS residual and loss stages; a site outside NASA POWER coverage yields a data-availability caveat.