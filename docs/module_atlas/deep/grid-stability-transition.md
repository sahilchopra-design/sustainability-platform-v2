## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states the real physics:
> `Inertia = Σ(Hᵢ×MVAᵢ×Onlineᵢ)` and `RoCoF = ΔP/(2×Inertia)`. The code implements **neither** — it
> uses linear/quadratic heuristics of a single slider (RE penetration %): `inertia = max(5, 100−rePct×0.9)`,
> `storageGWh = rePct²×0.02`, `curtailment = max(0,(rePct−50)×0.3)`. These are plausible-shaped stylised
> curves, not synchronous-inertia or RoCoF calculations. Sections below document the heuristic model the
> code runs.

### 7.1 What the module computes

Everything derives from a single input `rePct` (renewable penetration 0–100%) via `buildGridData`:

```js
solar = rePct×0.45,  wind = rePct×0.40,  hydro = rePct×0.15          // RE split
gas = (100−rePct)×0.5, nuclear = ×0.3, coal = ×0.2                    // thermal split
inertia            = max(5, 100 − rePct×0.9)          // % of baseline synchronous inertia
storageGWh         = round(rePct² × 0.02)             // quadratic storage need
curtailmentPct     = max(0, (rePct−50)×0.3)           // curtailment kicks in above 50% RE
interconnectorUtil = min(95, 40 + rePct×0.6)
freqRisk           = rePct>80 Critical | >60 High | >40 Medium | else Low
```

Companion curves over rePct = 0…100 (step 5):
```js
inertiaCurve:  rocof = 0.1 + re×0.015,  freqNadir = 50 − re×0.02      // Hz
storageCurve:  costBnUSD = re² × 0.0003
curtailment:   lostGWh = max(0,(re−50)×12),  costM = max(0,(re−50)×2.4)
capacityMarket: clearingPrice = 15 + re×0.8 + max(0,(re−60)×2),  derated = 100 − re×0.6
```

### 7.2 Parameterisation

| Relationship | Form | Rationale |
|---|---|---|
| Inertia vs RE | linear decline, ×0.9 slope, floor 5 | wind/solar are asynchronous → less spinning mass |
| Storage vs RE | quadratic (rePct²×0.02) | storage need grows super-linearly above ~60% RE |
| Curtailment | zero until 50%, then ×0.3 | oversupply only bites at high RE share |
| RoCoF | linear rise 0.015/re | rate-of-change-of-frequency worsens as inertia falls |
| Capacity price | kink at 60% RE (extra ×2) | firm-capacity scarcity premium |

`GRIDS` (6 real systems) carry actual RE%/peak/storage: ERCOT 38%/85 GW, CAISO 52%/8.1 GW storage,
Germany 55%/84 GW, India 28%/230 GW. The `~50% RE critical inertia threshold` (guide) is encoded via
the `freqRisk` bands and the curtailment onset.

### 7.3 Calculation walkthrough

The RE-penetration slider recomputes the full grid state (`buildGridData`) live. The inertia monitor
plots `inertiaCurve` (inertia, RoCoF, frequency nadir); storage tab plots the quadratic storage/cost
curve; curtailment tab shows lost GWh and cost; capacity-market tab shows clearing price and de-rated
capacity. Per-grid views seed from the `GRIDS` table's actual RE%.

### 7.4 Worked example (rePct = 70%)

| Quantity | Computation | Result |
|---|---|---|
| RE mix | solar 31.5 / wind 28 / hydro 10.5 | 70% RE |
| thermal | gas 15 / nuclear 9 / coal 6 | 30% |
| inertia | max(5, 100 − 70×0.9) | 37% of baseline |
| freqRisk | 70 > 60 | High |
| storageGWh | round(70² × 0.02) | 98 GWh |
| curtailment | (70 − 50)×0.3 | 6.0% |
| RoCoF (curve) | 0.1 + 70×0.015 | 1.15 Hz/s |
| freqNadir | 50 − 70×0.02 | 48.6 Hz |

At 70% RE the model shows inertia down to 37% of baseline, a "High" frequency-risk flag, 98 GWh of
storage need and 6% curtailment — the qualitative story (falling inertia, rising storage/curtailment) is
directionally correct even though the numbers are stylised, not solved from grid physics.

### 7.5 Data provenance & limitations

- **No real grid physics.** Inertia, RoCoF and frequency nadir are linear/quadratic functions of one
  slider, not computed from generator inertia constants (H), MVA ratings, or the swing equation. There
  is no `sr()` PRNG here — the curves are deterministic heuristics.
- The 6 `GRIDS` carry real RE%/capacity, but the state derived from them uses the same heuristics.
- Curtailment, storage-cost and capacity-price coefficients (×0.3, ×0.02, kink at 60%) are illustrative
  slopes, not calibrated to any specific system study.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the page uses stylised curves; the guide's
swing-equation physics is not solved).

**8.1 Purpose & scope.** Assess frequency stability (inertia, RoCoF, nadir), storage adequacy and
curtailment for a power system as a function of instantaneous non-synchronous penetration, for TSO
planning and transition-risk analysis of thermal assets.

**8.2 Conceptual approach.** A reduced swing-equation frequency model plus a capacity-expansion storage
sizing, per NREL/EirGrid inertia studies and the AEMO/National Grid ESO system-strength frameworks;
RoCoF from the actual power-imbalance ÷ system inertia.

**8.3 Mathematical specification.**
```
System inertia  H_sys = Σᵢ (Hᵢ · S_i · online_i) / S_base           (MWs / MVA)
Instantaneous non-synch penetration  NSP = P_RE / P_demand
RoCoF (Hz/s)  = f₀ · ΔP / (2 · H_sys · S_base)                       (swing equation)
Frequency nadir from a P–f trajectory given RoCoF, FFR volume and droop
Storage need  E_store = f(NSP, load-shape variance, min-inertia constraint)
Curtailment   = Σ_t max(0, P_RE,t − (Demand_t − P_must-run,t))
Capacity price from a scarcity-pricing / ELCC de-rating of firm capacity
```

| Parameter | Source |
|---|---|
| Generator H constants | 2–9 s (synchronous machines, NREL) |
| f₀, min-inertia floor | 50/60 Hz; TSO RoCoF limit (~0.5–1 Hz/s) |
| FFR volume/droop | ancillary-market data |
| Load-shape variance | historical demand + RE profiles |
| ELCC de-rating | capacity-market accreditation rules |

**8.4 Data requirements.** Generator inertia constants and MVA, demand and RE time series, FFR
capability, interconnector limits. The page has RE% and capacity per grid but not machine-level inertia.

**8.5 Validation.** Reconcile RoCoF/nadir against EirGrid/NG-ESO published system-inertia studies;
back-test storage need against capacity-expansion model output; check curtailment against actual
system curtailment data (e.g. CAISO, ERCOT).

**8.6 Limitations & model risk.** Reduced-order frequency models miss spatial/voltage effects; grid-
forming inverters change the inertia picture; ELCC de-rating is scenario-dependent. Conservative
fallback: report inertia and RoCoF bands with explicit min-inertia constraints rather than point curves.

**Framework alignment:** IEEE Power Systems / swing-equation dynamics — the RoCoF and inertia physics
the §8 model formalises; IEA Electricity Market Report — high-RE integration context; NREL/EirGrid
inertia studies — calibration source for the frequency model; capacity-market ELCC — firm-capacity
de-rating for the pricing tab.
