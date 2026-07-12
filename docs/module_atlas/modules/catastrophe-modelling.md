# Catastrophe Modelling
**Module ID:** `catastrophe-modelling` · **Route:** `/catastrophe-modelling` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Probabilistic natural catastrophe loss modelling for insurance portfolios. Covers hazard, exposure, vulnerability, and financial modules with exceedance probability curves and ILW pricing.

> **Business value:** Catastrophe models are the foundation of non-life insurance pricing, capital allocation (Solvency II SCR), and reinsurance purchasing. Climate change is modifying hazard intensity and frequency, making cat model recalibration critical for adequate pricing and solvency capital.

**How an analyst works this module:**
- Event Set Configurator sets peril, region, and model vintage
- Exceedance Curves shows OEP and AEP at all return periods
- Portfolio Aggregation summates losses across locations
- Climate Change Layer adjusts hazard for SSP warming scenarios
- ILW Analyser prices parametric products based on industry trigger

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `CLIMATE_FACTORS`, `COLORS`, `ConfBadge`, `EP_CURVE_DATA`, `EVENT_NAMES`, `EVENT_SET`, `KPI`, `LOSS_DEVELOPMENT`, `PERILS`, `PORTFOLIOS`, `RDS_SCENARIOS`, `REGIONS`, `TABS`, `TrendArrow`, `WARMING_LEVELS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PERILS` | 16 | `category`, `avgAnnualLoss_mn`, `volatility`, `trend_pct_decade`, `modelConfidence`, `climateInfluence`, `returnPeriod100yr_mn`, `returnPeriod250yr_mn`, `returnPeriod500yr_mn` |
| `REGIONS` | 41 | `exposedValue_bn`, `topPerils`, `trendMultiplier`, `climateScenarioImpact`, `rcp26`, `rcp45`, `rcp85` |
| `PORTFOLIOS` | 4 | `type`, `totalExposure_bn`, `aalRatio_bps`, `limits_bn`, `deductible_mn`, `reinstatements`, `regionExposure`, `region`, `exposure_bn` |
| `RDS_SCENARIOS` | 9 | `description`, `industry_loss_bn`, `modeled_loss_mn`, `return_period`, `climate_factor` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pct` | `n => typeof n === 'number' ? n.toFixed(1) + '%' : '--';` |
| `perilIdx` | `Math.floor(s1 * PERILS.length);` |
| `regionIdx` | `Math.floor(s2 * REGIONS.length);` |
| `year` | `1990 + Math.floor(s3 * 35);` |
| `grossLoss_mn` | `Math.round(500 + s4 * 120000);` |
| `insuredRatio` | `0.15 + s5 * 0.65;` |
| `insuredLoss_mn` | `Math.round(grossLoss_mn * insuredRatio);` |
| `fatalities` | `Math.round(s6 * s6 * 15000);` |
| `returnPeriod_est` | `Math.round(10 + s4 * s4 * 500);` |
| `_CAT_MAP` | `Object.fromEntries(MAJOR_CAT_EVENTS.map(e => [e.event_name, e]));` |
| `avgInsured` | `countryEvents.reduce((s, e) => s + (e.insured_losses_usd_bn \|\| 0), 0) / countryEvents.length;` |
| `avgTotal` | `countryEvents.reduce((s, e) => s + (e.total_losses_usd_bn \|\| 0), 0) / countryEvents.length;` |
| `avgFatal` | `countryEvents.reduce((s, e) => s + (e.fatalities \|\| 0), 0) / countryEvents.length;` |
| `EP_CURVE_DATA` | `PORTFOLIOS.map((port, pi) => {` |
| `base` | `port.totalExposure_bn * 1000;` |
| `oepLoss` | `base * (0.001 + Math.pow(1 - ep, 2.5) * (0.15 + sr(pi * 100 + j) * 0.08));` |
| `aepLoss` | `oepLoss * (0.7 + sr(pi * 100 + j + 50) * 0.2);` |
| `climateAdj15` | `oepLoss * (1.08 + sr(pi * 100 + j + 200) * 0.04);` |
| `climateAdj20` | `oepLoss * (1.18 + sr(pi * 100 + j + 300) * 0.06);` |
| `climateAdj30` | `oepLoss * (1.35 + sr(pi * 100 + j + 400) * 0.10);` |
| `climateAdj40` | `oepLoss * (1.55 + sr(pi * 100 + j + 500) * 0.15);` |
| `WARMING_LEVELS` | `['Current', '+1.5C', '+2.0C', '+3.0C', '+4.0C'];` |
| `CLIMATE_FACTORS` | `PERILS.map((p, i) => {` |
| `accYr` | `1995 + yr;` |
| `ultimate` | `Math.round(8000 + sr(yr * 19) * 22000);` |
| `devYears` | `factors.map((f, di) => {` |
| `latestIdx` | `Math.min(29 - yr, 9);` |
| `totalExposure` | `REGIONS.reduce((a, r) => a + r.exposedValue_bn, 0);` |
| `totalAAL` | `PERILS.reduce((a, p) => a + p.avgAnnualLoss_mn, 0);` |
| `pml100` | `PERILS.reduce((a, p) => a + p.returnPeriod100yr_mn, 0);` |
| `pml250` | `PERILS.reduce((a, p) => a + p.returnPeriod250yr_mn, 0);` |
| `warmingKeys` | `['Current', '+1.5C', '+2.0C', '+3.0C', '+4.0C'];` |
| `climateAdjAAL` | `useMemo(() => { return PERILS.map((p, i) => { const cf = CLIMATE_FACTORS[i] ? CLIMATE_FACTORS[i][warmingKey] : 1;` |
| `totalClimAAL` | `climateAdjAAL.reduce((a, p) => a + p.adjustedAAL_mn, 0);` |
| `devFactors` | `useMemo(() => { return Array.from({ length: 9 }, (_, i) => { const pairs = LOSS_DEVELOPMENT.filter(r => r.paid[i] != null && r.paid[i + 1] != null);` |
| `avg` | `pairs.reduce((a, r) =>` |
| `perilPie` | `PERILS.map((p, i) => ({` |
| `aalBar` | `PERILS.map((p, i) => ({` |
| `rpCompare` | `PERILS.map((p, i) => ({` |
| `scatterData` | `filteredEvents.map(e => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `EVENT_NAMES`, `PERILS`, `PORTFOLIOS`, `RDS_SCENARIOS`, `REGIONS`, `TABS`, `WARMING_LEVELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Return Periods | — | Exceedance curves | Standard reporting metrics |
| Model Uncertainty | — | Industry norm | Epistemic uncertainty in cat model outputs |
| ILW Pricing | — | Industry practice | Industry Loss Warranty pricing basis |
- **Exposure database** → Spatial hazard overlay → **Site-level loss estimates**
- **Stochastic event set** → Damage function application → **Loss distribution**
- **Loss distribution** → Exceedance probability → **OEP/AEP curves**

## 5 · Intermediate Transformation Logic
**Methodology:** Probabilistic cat model (H-E-V-F)
**Headline formula:** `Loss = Σ(exposure_i × damage_fn(intensity_i)) across stochastic event set`

Event set: 50,000-100,000 stochastic years. OEP (Occurrence Exceedance Probability): largest loss per year. AEP (Aggregate EP): total annual losses. ILW: parametric trigger based on industry loss threshold.

**Standards:** ['AIR Worldwide', 'RMS', 'ISO 19905', 'Swiss Re CResta']
**Reference documents:** AIR Touchstone Platform; RMS RiskLink; Swiss Re Sigma Natural Catastrophes; Reinsurance Association of America

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Catastrophe Modelling module is a substantive probabilistic cat-model dashboard aligned with its guide.
It implements the hazard-exposure-vulnerability-financial (H-E-V-F) framing via a 15-peril library with
return-period losses, a parametric OEP/AEP exceedance curve, climate-warming uplift factors, Lloyd's RDS
scenarios, and chain-ladder loss development — using a real historical event dataset. The EP curve is a
parametric approximation rather than a full stochastic event-set integration, so §8 specifies the production
engine.

### 7.1 What the module computes

Portfolio and peril loss metrics plus a climate-adjusted exceedance-probability curve:

```js
totalAAL   = Σ PERILS.avgAnnualLoss_mn                     // average annual loss
pml100/250 = Σ PERILS.returnPeriod{100,250}yr_mn          // probable maximum loss
oepLoss    = base × (0.001 + (1 − ep)^2.5 × (0.15 + sr·0.08))  // occurrence EP curve
aepLoss    = oepLoss × (0.7 + sr·0.2)                     // aggregate EP (< OEP)
climateAdj = oepLoss × {+1.5°C:1.08, +2°C:1.18, +3°C:1.35, +4°C:1.55}  // warming uplift
climateAdjAAL = AAL × CLIMATE_FACTORS[peril][warmingKey]
```

The `(1 − ep)^2.5` exponent gives the exceedance curve its characteristic convex tail — larger losses at
lower exceedance probabilities. Loss development uses chain-ladder age-to-age factors.

### 7.2 Parameterisation

**Peril library** (`PERILS`, 15–16 rows — provenance: RMS/AIR/CoreLogic taxonomy; loss levels are
directionally realistic industry figures):

| Peril | AAL ($M) | 100yr RP ($M) | 250yr RP ($M) | Trend %/decade | Climate influence |
|---|---|---|---|---|---|
| Hurricane/Typhoon | 42,000 | 180,000 | 310,000 | +8.2 | Dominant |
| Earthquake | 28,000 | 250,000 | 480,000 | +0.5 | Limited |
| Flood (riverine) | 35,000 | — | — | +12.1 | High |

**Climate warming uplift** (`climateAdj` factors 1.08/1.18/1.35/1.55 for +1.5/+2/+3/+4 °C) — monotonic and
peril-specific via `CLIMATE_FACTORS`; earthquake (geological) carries ~1.0 (climate-independent), hurricane/
flood carry the largest uplift, correctly reflecting attribution science.

**Real historical events** (`MAJOR_CAT_EVENTS`, imported from `data/catastropheEvents`) drive the event-set
explorer and country statistics. **Lloyd's RDS scenarios** (`RDS_SCENARIOS`, 9 rows) and `PORTFOLIOS`
(4 rows with exposure, AAL bps, limits, deductibles, reinstatements) are structured reinsurance inputs.

**Synthetic dispersion** (`sr()`): the per-point noise on the EP curve and some event-generator fields; the
peril library, climate factors, and historical events are real/curated.

### 7.3 Calculation walkthrough

The dashboard sums AAL and PML across perils. The EP-Curve Builder generates OEP points from the parametric
`base × (1−ep)^2.5` form, derives AEP as a fraction of OEP, and overlays four warming-adjusted curves. The
Climate-Scenarios tab scales each peril's AAL by its warming factor. Loss-Development computes chain-ladder
factors from the paid-loss triangle to project ultimates.

### 7.4 Worked example (EP curve + climate uplift)

Portfolio `totalExposure_bn = 100` → `base = 100 × 1000 = 100,000 ($M scale)`. At exceedance probability
`ep = 0.01` (100-year return period):
`oepLoss = 100,000 × (0.001 + (1 − 0.01)^2.5 × 0.19) = 100,000 × (0.001 + 0.9752×0.19) = 100,000 × 0.186 =
~18,600 $M`. Under +2 °C: `climateAdj20 = 18,600 × 1.18 = ~21,950 $M` — an ~18% loss uplift at the 100-year
level from warming. AEP at the same point ≈ `18,600 × 0.8 = ~14,900 $M` (aggregate < occurrence, as
expected).

### 7.5 Data provenance & limitations

- **Peril loss levels, climate factors, and historical events are real/curated**; the EP-curve dispersion and
  some event-generator fields are synthetic (`sr(seed)=frac(sin(seed+1)×10⁴)`).
- **The EP curve is a parametric approximation** (`(1−ep)^2.5`), not an integration over a 50k–100k-year
  stochastic event set (the guide's method) — it captures the tail shape but not location-level correlation.
- Climate uplift is a scalar per peril/warming level, not a re-simulated hazard field; no secondary-uncertainty
  or demand-surge modelling.

**Framework alignment:** AIR Touchstone / RMS RiskLink — the H-E-V-F structure and OEP/AEP outputs the module
mirrors · Swiss Re Sigma — the historical nat-cat loss figures · Lloyd's Realistic Disaster Scenarios — the
RDS stress set · IPCC SSP — the warming-level uplift factors · Solvency II SCR — the PML/return-period metrics
feed capital allocation. See §8 for the stochastic-event-set engine.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The parametric EP curve should be replaced by a
stochastic-event-set integration.

### 8.1 Purpose & scope
Produce OEP/AEP loss curves and PMLs for an insurance portfolio from a stochastic catastrophe event set with
location-level exposure and vulnerability, climate-conditioned, for pricing, reinsurance, and Solvency II
capital.

### 8.2 Conceptual approach
Full H-E-V-F simulation over a 50k–100k-year stochastic event set (AIR/RMS methodology), benchmarked against
AIR Touchstone and RMS RiskLink. Hazard intensity × vulnerability damage function × exposure → per-event
loss; aggregate to annual OEP/AEP. Climate conditioning re-weights event frequencies and shifts severity.

### 8.3 Mathematical specification

```
Loss_e = Σ_loc  Exposure_loc × DamageFn_loc(Intensity_e,loc)      per stochastic event e
OEP(x) = P( max_e∈year Loss_e > x )                               occurrence exceedance
AEP(x) = P( Σ_e∈year Loss_e > x )                                 aggregate exceedance
AAL    = (1/N_years) Σ_years Σ_e Loss_e
PML_T  = OEP^{-1}(1/T)                                            T-year return-period loss
Climate: λ_e' = λ_e·(1+κ_freq),  Intensity_e' = Intensity_e·(1+κ_sev)   per peril, per SSP
```

| Parameter | Symbol | Source |
|---|---|---|
| Event set | {e}, λ_e | AIR/RMS stochastic catalogue |
| Damage functions | DamageFn | vulnerability curves by construction/occupancy |
| Exposure | Exposure_loc | policy/asset database (geocoded) |
| Climate uplift | κ_freq, κ_sev | IPCC SSP + peril attribution |

### 8.4 Data requirements
Geocoded exposure with construction/occupancy, licensed event set + vulnerability curves, climate uplift
tables. Platform holds the peril library, historical events, and portfolio scaffolds; missing: the stochastic
catalogue and location-level exposure.

### 8.5 Validation & benchmarking plan
Reconcile AAL/PML against a vendor model (AIR/RMS) for the same portfolio (±30–50% epistemic band). Backtest
against realised annual losses. Sensitivity to damage-function and climate-κ choices. Validate OEP<->AEP
consistency.

### 8.6 Limitations & model risk
Cat-model uncertainty is ±30–50% — present ranges. Secondary uncertainty (event footprint variability) and
demand surge materially affect the tail; omit-at-peril. Climate attribution factors are contested — show
base and uplifted curves separately.

## 9 · Future Evolution

### 9.1 Evolution A — Real event sets and EP curves from the physical-risk digital twin (analytics ladder: rung 2 → 4)

**What.** The page has the correct cat-model structure (hazard/exposure/vulnerability/financial modules, OEP/AEP exceedance curves, climate-warming-level adjustments, ILW pricing, loss-development triangles with real chain-ladder factors) and rich reference tables (`PERILS` with AAL/return-period losses, 41 `REGIONS` with exposed value and RCP scenarios, `RDS_SCENARIOS` realistic disaster scenarios). But the EP curves are seeded (`oepLoss = base × (0.001 + (1−ep)^2.5 × (0.15 + sr()×0.08))`) rather than integrated from a real stochastic event set, and the climate adjustments are scalar multipliers with random noise (`climateAdj15 = oepLoss × (1.08 + sr()×0.04)`). Evolution A drives the model from the platform's real hazard data.

**How.** (1) Real stochastic event sets and hazard footprints from the physical-risk digital twin (the populated earthquake/cyclone/wildfire/flood/sea-level PostGIS grids built from USGS/IBTrACS/GWIS/OpenFEMA data) crossed with a real exposure database — so OEP/AEP curves are integrated from an actual loss distribution, not a seeded power-law. (2) Vulnerability (damage) functions per peril/construction type from published cat-model literature. (3) The climate-warming-level adjustments become real distribution shifts under SSP/RCP scenarios (IPCC AR6 frequency/intensity changes), not scalar-plus-noise — the module's genuine purpose (climate recalibration for Solvency II SCR adequacy). (4) Rung 4: calibrate loss distributions against observed catastrophe losses (the real `MAJOR_CAT_EVENTS` data the page already references) and make climate uplift predictive. Extract to a backend route; this is foundational insurance infrastructure deserving a bench pin. Coordinate with the physical-risk-pricing and cat-bond modules on shared hazard curves.

**Prerequisites.** Event-set/hazard footprints from the digital twin; an exposure database; vulnerability functions; SSP/RCP frequency-intensity factors. **Acceptance:** OEP/AEP curves integrate from a real event set (not seeded); climate adjustments are distribution shifts under named scenarios; loss estimates calibrate against observed cat losses; the financial module's SCR outputs are bench-pinned.

### 9.2 Evolution B — Cat-model and reinsurance-pricing copilot (LLM tier 2)

**What.** Actuaries and reinsurance buyers ask "what's the 1-in-250 PML for this portfolio?", "how does the AAL shift at +2°C?", "price an ILW at a $30bn industry trigger", "which regions drive our tail risk?" — the copilot runs the Evolution-A EP-curve, climate-layer, and ILW tools, reporting return-period losses, climate-adjusted AAL, and ILW prices, every figure tool-traced with model uncertainty stated.

**How.** Tool schemas over the Evolution-A event-set/EP/ILW routes; grounding corpus is this Atlas record plus the Solvency II / IAIS ICS references. The honesty duty is central to cat modelling: outputs carry epistemic uncertainty (the page already has a `modelConfidence` field), so the copilot always states model vintage, confidence, and the warming scenario behind any number, and presents return-period losses with their uncertainty bands rather than false precision — cat-model output drives capital adequacy, where overconfidence is dangerous. Feeds the physical-risk and ILS desk views in the Tier-3 orchestrator.

**Prerequisites (hard).** Evolution A's real event sets — a copilot quoting PMLs off seeded EP curves would misinform Solvency II capital decisions. **Acceptance:** every return-period loss, AAL, and ILW price traces to a tool response; each carries model vintage, confidence, and warming scenario; return-period losses are reported with uncertainty bands.