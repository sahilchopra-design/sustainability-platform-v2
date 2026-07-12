# Parametric Insurance Analyser
**Module ID:** `parametric-insurance` · **Route:** `/parametric-insurance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Parametric (index-based) insurance product design and analysis. Covers trigger design (rainfall, temperature, wind speed), basis risk quantification, and climate risk transfer pricing.

> **Business value:** Parametric insurance closes protection gaps by paying quickly based on measurable triggers, without loss adjustment. Critical for climate-vulnerable regions where traditional insurance markets fail. This module enables product design, back-testing, and climate adjustment for NGOs, sovereigns, and corporates.

**How an analyst works this module:**
- Trigger Designer selects index, threshold, and payout structure
- Historical Simulation shows how product would have performed vs actual losses
- Basis Risk Analyser quantifies the payout gap
- Climate Pricing adjusts premium for future hazard intensity
- Portfolio Aggregation shows diversification across covered zones

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BASIS_RISK_COMPARISON`, `COUNTRIES`, `COVERAGE_TYPES`, `HISTORICAL_TRIGGERS`, `PAYOUT_TYPES`, `PRODUCTS`, `PRODUCT_STATUS`, `SCHEMES`, `SOVEREIGN_PROGRAMS`, `TABS`, `TRIGGER_COLORS`, `TRIGGER_TYPES`, `TRIGGER_UNITS`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SOVEREIGN_PROGRAMS` | 7 | `name`, `region`, `members`, `coverage`, `totalCoverage`, `payouts`, `avgPayout`, `speed`, `premium`, `lossRatio`, `climateAdaptation` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TRIGGER_UNITS` | `['mm','km/h','°C','Mw','Index','m'];` |
| `triggerIdx` | `Math.floor(s1*TRIGGER_TYPES.length);` |
| `country` | `COUNTRIES[Math.floor(s2*COUNTRIES.length)];` |
| `payoutType` | `PAYOUT_TYPES[Math.floor(s3*PAYOUT_TYPES.length)];` |
| `coverageType` | `COVERAGE_TYPES[Math.floor(s4*COVERAGE_TYPES.length)];` |
| `status` | `PRODUCT_STATUS[Math.floor(s5*3)];` |
| `scheme` | `SCHEMES[Math.floor(s6*SCHEMES.length)];` |
| `triggerThreshold` | `triggerType==='Rainfall'?Math.round(50+s7*300):triggerType==='Wind Speed'?Math.round(80+s7*180):triggerType==='Temperature'?+(30+s7*15).toFixed(1):triggerType==='Earthquake Magnitude'?+(5.0+s7*3.0).toFixed(1):triggerType` |
| `exitThreshold` | `triggerType==='Rainfall'?Math.round(triggerThreshold*1.8+50):triggerType==='Wind Speed'?Math.round(triggerThreshold*1.5):triggerType==='Temperature'?+(triggerThreshold+5).toFixed(1):triggerType==='Earthquake Magnitude'?+` |
| `maxPayout` | `Math.round(1+s8*49);` |
| `premium` | `+(maxPayout*0.03+s9*maxPayout*0.12).toFixed(2);` |
| `attachmentProb` | `+(5+s1*25).toFixed(1);` |
| `exhaustionProb` | `+(1+s2*8).toFixed(1);` |
| `expectedLoss` | `+(premium*0.5+s3*premium*0.4).toFixed(2);` |
| `basisRisk` | `+(5+s4*35).toFixed(1);` |
| `historicalTriggers` | `Math.round(1+s5*12);` |
| `avgPayoutTime` | `Math.round(3+s6*25);` |
| `beneficiaries` | `Math.round(500+s7*49500);` |
| `avgAnnualLoss` | `countryEvs.reduce((s, e) => s + (e.total_losses_usd_bn \|\| 0), 0) / countryEvs.length;` |
| `eventFrequency` | `+(countryEvs.length / 12).toFixed(2); // events per year over 12-year window` |
| `YEARS` | `Array.from({length:20},(_,i)=>2005+i);` |
| `HISTORICAL_TRIGGERS` | `TRIGGER_TYPES.map((tt,ti)=>{` |
| `val` | `tt==='Rainfall'?Math.round(200+sr(ti*101+yi*7)*400):tt==='Wind Speed'?Math.round(60+sr(ti*103+yi*7)*200):tt==='Temperature'?+(25+sr(ti*107+yi*7)*20).toFixed(1):tt==='Earthquake Magnitude'?+(4+sr(ti*109+yi*7)*4).toFixed(1` |
| `parametricLoss` | `Math.round(sr(i*131)*100);` |
| `actualLoss` | `Math.round(parametricLoss*(0.5+sr(i*137)*1.0));` |
| `totalCoverage` | `active.reduce((a,b)=>a+b.maxPayout,0);` |
| `totalPremium` | `active.reduce((a,b)=>a+b.premium,0);` |
| `avgBasisRisk` | `+(active.reduce((a,b)=>a+b.basisRisk,0)/Math.max(1,active.length)).toFixed(1);` |
| `totalBeneficiaries` | `active.reduce((a,b)=>a+b.beneficiaries,0);` |
| `triggerStats` | `useMemo(()=>{ return TRIGGER_TYPES.map((tt,i)=>{ const prods=PRODUCTS.filter(p=>p.triggerType===tt);` |
| `avgPayout` | `products.length?products.reduce((a,b)=>a+b.maxPayout,0)/products.length:10;` |
| `prodPages` | `Math.ceil(filteredProducts.length/PAGE_SIZE);` |
| `pagedProducts` | `filteredProducts.slice(prodPage*PAGE_SIZE,(prodPage+1)*PAGE_SIZE);` |
| `linear` | `Math.min(100,Math.max(0,((val-trigger)/(exit-trigger))*100));` |
| `stepped` | `val>=exit?100:val>=trigger+(exit-trigger)*0.5?50:val>=trigger?25:0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `COVERAGE_TYPES`, `PAYOUT_TYPES`, `PRODUCT_STATUS`, `SCHEMES`, `SOVEREIGN_PROGRAMS`, `TABS`, `TRIGGER_COLORS`, `TRIGGER_TYPES`, `TRIGGER_UNITS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Triggers Covered | — | Product types | Common parametric indices |
| Basis Risk | — | Product quality | Fraction of actual loss not covered by parametric payout |
| Speed of Payout | — | Key benefit | Parametric pays within weeks; traditional claims take months |
- **Weather station data** → Index historical simulation → **Trigger calibration**
- **Loss data** → Correlation analysis → **Basis risk quantification**
- **Climate projections** → Hazard frequency adjustment → **Future premium pricing**

## 5 · Intermediate Transformation Logic
**Methodology:** Parametric trigger and basis risk model
**Headline formula:** `Payout = MaxPayout × max(0, (Trigger-Index)/Trigger); BasisRisk = Var(ActualLoss - Payout)`

Trigger calibration: historical percentile of weather index correlated with agricultural/property losses. Basis risk = variance between parametric payout and actual loss. Lower basis risk = better product but higher trigger cost.

**Standards:** ['IBRD', 'InsuResilience', 'Munich Re Parametric']
**Reference documents:** World Bank IBRD Parametric Risk Transfer; InsuResilience Partnership; Munich Re Parametric Insurance Solutions

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry and the code broadly agree: the module is an index-based parametric insurance
product designer with trigger calibration, basis-risk analysis and a sovereign-scheme catalogue. The
headline product metrics are **synthetic PRNG draws**, but the historical catastrophe overlay and the
sovereign-programme table are **real data**. Below documents what the code computes.

### 7.1 What the module computes

`PRODUCTS` generates 60 parametric products, each an independent `sr()` draw. Trigger structure is
the one place with real parametric logic — thresholds and payout curves depend on the peril type:

```js
triggerThreshold = Rainfall ? 50+s7·300 (mm)
                 : WindSpeed ? 80+s7·180 (km/h)
                 : Temperature ? 30+s7·15 (°C)
                 : Earthquake ? 5.0+s7·3.0 (Mw)
                 : NDVI ? 0.1+s7·0.4 : RiverLevel 3+s7·12 (m)
exitThreshold    = Rainfall ? trigger·1.8+50 : WindSpeed ? trigger·1.5 : Temperature ? trigger+5 ...
```

The **payout function** (Trigger Calibration tab) implements the two canonical parametric structures:

```js
linear  = clamp( (index − trigger)/(exit − trigger) · 100, 0, 100)   // proportional payout band
stepped = index≥exit ? 100 : index≥trigger+(exit−trigger)·0.5 ? 50 : index≥trigger ? 25 : 0
```

This is exactly the trigger→exit attachment ramp used in real parametric contracts (CCRIF/ARC style).

### 7.2 Parameterisation / scoring rubric

| Field | Formula | Provenance |
|---|---|---|
| Trigger threshold | peril-specific `sr()` band | Synthetic, but bands are physically plausible (e.g. wind 80–260 km/h) |
| Max payout | `1 + s8·49` ($M) | Synthetic |
| Premium | `maxPayout·(0.03 + s9·0.12)` | Synthetic; 3–15 % rate-on-line |
| Attachment prob | `5 + s1·25` % | Synthetic |
| Exhaustion prob | `1 + s2·8` % | Synthetic |
| Expected loss | `premium·(0.5 + s3·0.4)` | Synthetic; implies loss ratio 50–90 % |
| Basis risk | `5 + s4·35` % | Synthetic |
| Beneficiaries | `500 + s7·49500` | Synthetic |

**Real-data overlays** (the module's genuine anchors):
- `MAJOR_CAT_EVENTS` / `GLOBAL_CAT_ANNUAL_STATS` (Swiss Re sigma / EM-DAT 2011-2023) stamp
  `avgAnnualLoss` and `eventFrequency = events/12` onto products whose country matches a real event
  history (guarded by `?? ` so seeded values are the fallback).
- `SOVEREIGN_PROGRAMS`: 6 real risk pools (CCRIF SPC, ARC Ltd, PCRAFI, SEADRIF, InsuResilience, Flood
  Re) with genuine member counts, coverage, payout speeds and loss ratios.

### 7.3 Calculation walkthrough

1. 60 products generated once; real cat-event stats overlaid where country matches.
2. `BASIS_RISK_COMPARISON` (30 events): `parametricLoss = sr·100`, `actualLoss = parametric·(0.5 +
   sr·1.0)`, `gap = |parametric − actual|`, `correlation = 0.4 + sr·0.55`. This visualises the
   payout-vs-actual-loss scatter that *defines* basis risk.
3. Product-catalog KPIs: total coverage, total premium, mean basis risk (guarded `Math.max(1,len)`),
   total beneficiaries over the active subset.
4. `HISTORICAL_TRIGGERS`: for each trigger type × 20 years, draw an index value and flag
   `triggered = value ≥ threshold` against the first matching product's threshold.

### 7.4 Worked example (payout curve)

A rainfall product with `trigger = 100 mm`, `exit = 100·1.8+50 = 230 mm`, `maxPayout = $30 M`.
Observed rainfall index = 180 mm:

```
linear  = (180 − 100)/(230 − 100)·100 = 80/130·100 = 61.5 %  → payout = 0.615·30 = $18.5 M
stepped = 180 ≥ 100+(130)·0.5 = 165 ? yes, and <230 → 50 %   → payout = 0.50·30 = $15.0 M
```

The linear structure tracks intensity smoothly; the stepped structure jumps to fixed bands — the
classic trade-off between basis-risk minimisation (linear) and simplicity/verifiability (stepped).

### 7.5 Basis-risk framing

`BASIS_RISK_COMPARISON` renders the *payout gap* = |parametric − actual|. In the guide's terms,
`BasisRisk = Var(ActualLoss − Payout)`; the code shows the per-event realisation of that difference
plus a per-event correlation draw (0.4–0.95), rather than fitting the variance. A production version
would regress actual on index to estimate residual (basis) variance.

### 7.6 Data provenance & limitations

- **Product-level metrics are synthetic** via `sr(seed) = frac(sin(seed+1)×10⁴)`.
- **Real anchors:** Swiss Re sigma / EM-DAT catastrophe losses and the six sovereign risk-pool
  descriptions.
- No actual weather-index time series or loss-correlation regression underlies trigger calibration —
  thresholds are drawn, not fitted to historical percentiles as the guide implies ("historical
  percentile of weather index correlated with losses").

**Framework alignment:** World Bank IBRD parametric risk transfer · InsuResilience Global Partnership ·
Munich Re parametric solutions. The payout ramp and basis-risk concept are faithfully implemented;
trigger calibration to loss-correlated index percentiles is described but not fitted in code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Trigger thresholds and basis risk are drawn
rather than calibrated; a production designer needs an index-loss statistical model.

**8.1 Purpose & scope.** Design a parametric contract (index, trigger, exit, payout curve) that
minimises basis risk for a defined portfolio of insured assets/livelihoods in a region, and price it.

**8.2 Conceptual approach.** Two coupled models: (i) a **hazard-index frequency model** (fit the
index distribution and return periods from reanalysis, per Munich Re/AIR practice); (ii) a **basis-risk
regression** linking modelled index to realised loss. Benchmarks: **CCRIF SPC** loss-modelling
approach and **World Bank/GFDRR** parametric pricing methodology.

**8.3 Mathematical specification.**

```
Index distribution:   F(x) fit to reanalysis series {x_t}; return period RP(x)=1/(1−F(x))
Trigger/exit set at target attachment/exhaustion RPs: trigger=F⁻¹(1−1/RP_att), exit=F⁻¹(1−1/RP_exh)
Payout(x)           = maxPayout · clamp((x−trigger)/(exit−trigger),0,1)
Pure premium (AAL)  = ∫ Payout(x) dF(x)      (Monte-Carlo over fitted F)
Loaded premium      = AAL·(1+λ_risk)/(1−expense−profit)
Basis risk          = Var(Loss_actual − Payout(x)); minimise over index/weighting choice
   estimate via regression Loss = a + b·Payout + ε ; residual σ² is basis variance
```

| Parameter | Source |
|---|---|
| Index series | ERA5 reanalysis / satellite (NDVI, rainfall) — free |
| Loss series | EM-DAT, national ag-loss records |
| Risk load λ | reinsurance market ROL |
| Expense/profit | scheme opex + capital cost |

**8.4 Data requirements.** Gridded reanalysis at asset locations (ERA5/CHIRPS — free), historical
loss records (EM-DAT — free; scheme claims — internal). Platform already carries `MAJOR_CAT_EVENTS`
(Swiss Re/EM-DAT); the reanalysis index feed is the missing piece.

**8.5 Validation & benchmarking.** Backtest payout vs realised loss over the historical window;
report basis risk (residual σ / mean loss); reconcile AAL against reinsurance market ROL; benchmark
against CCRIF's published loss ratios (~0.5).

**8.6 Limitations & model risk.** Short loss series make F and basis regression unstable; index may
be spatially decorrelated from the loss location (the core basis-risk failure). Conservative fallback:
widen the trigger→exit band and disclose basis risk explicitly rather than optimise it away.

## 9 · Future Evolution

### 9.1 Evolution A — Back-test triggers against real hazard history (analytics ladder: rung 1 → 3)

**What.** §7 shows the parametric *logic* is genuinely correct: the trigger→exit attachment ramp (linear and stepped payout functions) matches real CCRIF/ARC contract structures, and peril-specific thresholds (rainfall mm, wind km/h, temperature °C, earthquake Mw, NDVI, river level) are properly differentiated. The historical-catastrophe overlay and sovereign-programme table are real. What's synthetic: the 60 `PRODUCTS` are `sr()` draws, and — critically — the "Historical Simulation" and basis-risk claims (§1) cannot be validated because no product is back-tested against actual index history. Evolution A wires triggers to real hazard time series.

**How.** (1) Connect trigger indices to the platform's real hazard data: rainfall/temperature from NASA POWER / Open-Meteo (already integrated per project memory), wind from IBTrACS cyclone tracks (digital twin), earthquake from USGS — so a designed trigger can be back-tested against decades of real index values, computing actual historical payout frequency. (2) Compute real basis risk (`Var(ActualLoss − Payout)` per §5) by pairing the back-tested payouts against a loss proxy, replacing the synthetic basis-risk number with a measured one. (3) Climate-adjusted pricing (§1) applies AR6 hazard-frequency shifts to the historical distribution rather than a seeded multiplier.

**Prerequisites.** Hazard time-series wiring (NASA POWER/IBTrACS/USGS exist in the platform); a loss proxy for basis-risk pairing (the hard part — parametric's whole point is no loss adjustment, so basis risk needs an independent loss reference). **Acceptance:** a rainfall trigger back-tests against real station history with a computed payout frequency; basis risk is measured, not seeded; climate adjustment shifts the historical distribution.

### 9.2 Evolution B — Parametric product-design copilot (LLM tier 2)

**What.** A copilot for the NGO/sovereign/corporate users §1 targets: "design a drought trigger for this region at the 1-in-10-year rainfall percentile", "how would this wind trigger have paid out over the last 20 hurricane seasons?", "what's the basis risk versus a 90% payout structure?" — executed against the (Evolution-A) back-testing engine, with payout and basis-risk figures traced to real index history.

**How.** Tool calls to endpoints wrapping the trigger-calibration, historical-simulation, and basis-risk functions; system prompt from this Atlas page's §5 formulas and the World Bank IBRD / InsuResilience / Munich Re references named in §5 so parametric-contract mechanics (trigger, exit, attachment) are explained correctly. Trigger design becomes an interactive calibration (threshold at a chosen historical percentile), and the historical simulation is a real back-test tool call. Fabrication validator matches every payout %, basis-risk, and premium to a tool response; the copilot must convey that basis risk is the fundamental parametric trade-off (fast payout vs imperfect loss correlation).

**Prerequisites.** Compute endpoints; Evolution A for real back-testing (the trigger *structure* logic works today, but historical simulation needs real index data). **Acceptance:** every payout/basis-risk figure traces to a tool call over real hazard history; trigger design reflects real percentiles; the copilot explains the basis-risk trade-off honestly.