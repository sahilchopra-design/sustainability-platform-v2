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
