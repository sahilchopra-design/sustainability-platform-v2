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
