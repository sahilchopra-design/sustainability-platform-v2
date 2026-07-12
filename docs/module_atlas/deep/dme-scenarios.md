## 7 · Methodology Deep Dive

The DME NGFS Scenario Engine (EP-U3) reprices a portfolio under **6 NGFS Phase IV scenarios**, computing
scenario-adjusted PD, stranded-asset probability, WACC uplift, VaR, EL and valuation impact, with sector
transition pathways and a 2030→2050 carbon-price/emissions interpolation. It carries genuinely detailed
scenario parameter tables. No guide record supplied → no mismatch flag; caveat is on synthetic holdings.

### 7.1 What the module computes

```js
scenarioAdjustedPD = basePD · sectorMult · (1 + physWeight·physExposure + transWeight·transExposure)
strandedAssetProb  = min(0.99, 1 − exp(−exposureFactor·timeHorizon/10)),
                     exposureFactor = fossilRevPct · carbonIntensity · carbonPrice / 1e6
WACC_scenario      = baseWACC + (scenarioPD − basePD)·0.5
VaR                = exposure · scenarioPD · 0.45 · confidence         // LGD fixed 45%
EL                 = exposure · scenarioPD · 0.45
valuationImpact    = −exposure · (scenarioPD − basePD)·2.5             // 2.5× DCF-style repricing
```
Scenario values are **time-interpolated** linearly between the 2030 and 2050 anchors:
`carbonPrice(h) = cp2030 + t·(cp2050 − cp2030)`, `t = (h−2030)/20`.

### 7.2 Parameterisation / scoring rubric

**NGFS Phase IV scenarios** — the core, well-populated table:

| Scenario | Category | Temp | Phys wt | Trans wt | Carbon $2030 | Carbon $2050 | GDP impact | SLR 2100 |
|---|---|---|---|---|---|---|---|---|
| Net Zero 2050 | Orderly | 1.5°C | 0.20 | 0.80 | 130 | 250 | −1.5% | 43 cm |
| Below 2°C | Orderly | 1.7°C | 0.35 | 0.65 | 80 | 200 | −2.0% | 55 cm |
| Divergent Net Zero | Disorderly | 1.5°C | 0.25 | 0.75 | 150 | 300 | −2.5% | 45 cm |
| Delayed Transition | Disorderly | 1.8°C | 0.40 | 0.60 | 20 | 350 | −3.5% | 60 cm |
| NDCs | Hot House | 2.5°C | 0.70 | 0.30 | 30 | 50 | −4.5% | 82 cm |
| Current Policies | Hot House | 3.0°C | 0.85 | 0.15 | 10 | 15 | −8.0% | 110 cm |

**Sector pathways** (`SECTOR_PATHWAYS`, 11 GICS) — carbon-price sensitivity, stranded-asset risk, capex,
workforce transition, tech readiness, peak-risk year. E.g. Energy: sensitivity 0.85, stranded 0.75, peak
2030; IT: sensitivity 0.15, stranded 0.05, peak 2040.

| Constant | Value | Provenance |
|---|---|---|
| Fixed LGD | 0.45 | VaR/EL |
| WACC-PD elasticity | 0.5 | heuristic (½ of PD delta) |
| Valuation multiple | 2.5× | DCF-style repricing heuristic |
| Stranding time-scaling | /10 | exponential hazard shaping |

Scenario physical/transition weights and carbon-price paths are **NGFS-consistent** (orderly early carbon
price, disorderly late spike in Delayed Transition, hot-house minimal price + high GDP loss). GDP impacts
and SLR are plausible NGFS/IPCC-order magnitudes.

### 7.3 Calculation walkthrough

1. `buildHoldings` enriches up to 60 master companies with seeded exposure, basePD, baseWACC, physical/
   transition exposure, fossil-revenue % (sector-conditioned) and carbon intensity.
2. For the selected scenario + horizon, each holding's scenarioPD is computed, then WACC/VaR/EL/valuation
   and stranded-asset probability.
3. Portfolio KPIs aggregate; a timeline tab interpolates carbon price/emissions across 2030–2050; a
   stranded-asset tab ranks fossil-exposed holdings.

### 7.4 Worked example (Energy holding, Delayed Transition, 2050)

Holding: basePD 2%, sectorMult (carbon sensitivity) 0.85, physExposure 0.4, transExposure 0.6, exposure
$800M, fossilRevPct 0.5, carbonIntensity 600. Delayed Transition: physWt 0.40, transWt 0.60, carbon 2050 = 350.
```
scenarioPD = 0.02·0.85·(1 + 0.40·0.4 + 0.60·0.6) = 0.017·(1 + 0.16 + 0.36) = 0.017·1.52 = 0.02584
WACC_scenario = baseWACC + (0.02584 − 0.02)·0.5 = baseWACC + 0.00292 (≈ +29 bps)
VaR (conf 2.33 ≈ 99%) = 800·0.02584·0.45·2.33 = $21.7M
EL = 800·0.02584·0.45 = $9.30M
valuationImpact = −800·(0.02584 − 0.02)·2.5 = −800·0.00584·2.5 = −$11.68M
strandedFactor = 0.5·600·350/1e6 = 0.105 ;  prob = 1 − exp(−0.105·(2050−… )/10)
```
With a 20-year horizon: `1 − exp(−0.105·20/10) = 1 − exp(−0.21) = 1 − 0.811 = 18.9%` stranded probability.

### 7.5 Data provenance & limitations

- **Holdings are synthetic**: exposure, basePD, WACC, physical/transition exposure, fossil-rev % and
  carbon intensity are `sr(seed)=frac(sin(seed+1)×10⁴)` fallbacks (real fields used where the master has them).
- LGD is fixed 45%; the valuation multiple (2.5×) and WACC elasticity (0.5) are heuristics, not calibrated
  DCF sensitivities.
- Timeline interpolation is **linear** between 2030 and 2050 — real NGFS paths are non-linear (carbon
  price ramps accelerate late in Delayed Transition).
- Scenario parameter *tables* are NGFS-consistent and are the module's real value; the *repricing maths*
  is reduced-form.

**Framework alignment:** **NGFS Phase IV** scenarios (Orderly/Disorderly/Hot-House families with carbon
price, emissions, GDP and physical variables — NGFS derives these from coupled IAM+climate models
REMIND/MESSAGE/GCAM + NiGEM macro); **TCFD/ISSB** transition-scenario analysis; stranded-asset framing per
Carbon Tracker / IEA (fossil revenue × carbon price × intensity → impairment hazard); PD/EL uplift in the
style of EBA/ECB climate stress tests.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production NGFS scenario-repricing engine giving PD/WACC/VaR/EL and stranded-asset impairment for the
covered book across the 6 NGFS scenarios and multiple horizons — supporting ICAAP climate stress and
TCFD/ISSB scenario disclosure.

### 8.2 Conceptual approach
Map NGFS scenario variables (carbon price, GDP, physical hazard) to obligor-level repricing via a
**sector-specific transmission function**, anchoring credit impact on EBA/ECB PD-uplift factors and
stranding on IEA/Carbon Tracker impairment curves. Benchmarks: NGFS Phase IV, EBA 2022 climate stress
test, ECB economy-wide stress test, MSCI Climate VaR, IEA WEO/NZE.

### 8.3 Mathematical specification
```
PD_s,t = PD_base · f_sector(carbonPrice_s,t, GDP_s,t, hazard_s,t)     (calibrated transmission)
strandedValue = assetValue · impairmentCurve_sector(carbonPrice_s,t, remainingLife)
ECL_s,t = PD_s,t · LGD_sector · EAD
ΔValue = DCF(cashflows | scenario) − DCF(cashflows | base)           (full re-DCF, not ×2.5)
Portfolio: Σ w_i · metric_i ; VaR from the scenario loss distribution across obligors
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Carbon price / GDP / hazard | — | NGFS Phase IV variable set (public) |
| PD transmission | f_sector | EBA/ECB climate stress-test elasticities |
| Impairment curves | — | IEA NZE stranded-capacity, Carbon Tracker |
| LGD_sector | — | PCAF / recoveries |

### 8.4 Data requirements
Obligor exposure, sector, fossil-revenue share, carbon intensity, cash-flow projections for re-DCF, and
NGFS scenario variable tables (already partly encoded here). Free: NGFS scenario explorer, IEA WEO;
platform holds the scenario/sector tables and `climate_scenarios` migration.

### 8.5 Validation & benchmarking plan
Reconcile portfolio VaR against MSCI Climate VaR; sanity-check PD uplift vs EBA published stress results;
stranded-asset probabilities vs Carbon Tracker sector estimates; verify monotonicity (hot-house physical
loss ≥ orderly) and non-linear carbon-path interpolation.

### 8.6 Limitations & model risk
Scenario transmission at obligor level is deeply uncertain; linear interpolation understates late spikes;
fixed LGD and ×2.5 valuation are placeholders. Conservative fallback: report ranges across scenarios and
flag Current Policies physical loss as a floor, not a point estimate.
