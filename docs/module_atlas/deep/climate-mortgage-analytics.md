## 7 · Methodology Deep Dive

The guide (EP-DE3) promises a climate-beta PD/LGD engine:
`PD_climate = PD_base × (1 + β_physical·HazardScore + β_transition·EPC_gap)`. The code implements a
**simpler additive** climate PD uplift and a green/flood/coastal **rate spread**, not the multiplicative
beta form — a modelling simplification worth noting, but the direction and Basel/IFRS-9 framing match.

### 7.1 What the module computes

Per synthetic UK mortgage (`i`-indexed), the page prices climate into three layers: **rate**, **PD**, and
**RWA/collateral**.

Climate-adjusted mortgage rate:
```js
climateRate = baseRate − greenDisc + floodSurch + coastSurch
   greenDisc  = GREEN_DISC[epc]/100          // discount for efficient EPC
   floodSurch = floodZone  ? FLOOD_SURCH/100  : 0
   coastSurch = coastalZone? COASTAL_SURCH/100: 0
```
Climate PD uplift (additive, not multiplicative):
```js
climPdUp = (floodZone ? 0.003 : 0) + (epcIdx >= 4 ? 0.005 : 0)   // +30bp flood, +50bp poor-EPC
adjPd    = basePd + climPdUp
```
Collateral / capital:
```js
adjPropVal = propVal * (1 - strandHaircut)                 // stranding haircut on value
adjLtv     = loanAmt*1000 / adjPropVal                     // climate-adjusted LTV
rwaBase    = loanAmt * basePd * lgd * 12.5                 // Basel RWA (1/8% = 12.5)
rwaClim    = loanAmt * adjPd  * lgd * 12.5
```

### 7.2 Parameterisation / scoring rubric

| Constant | Meaning | Provenance |
|---|---|---|
| `GREEN_DISC[epc]` | bp rate discount by EPC band | heuristic (green-mortgage pricing) |
| `FLOOD_SURCH`, `COASTAL_SURCH` | flood/coast rate surcharge | heuristic |
| `+0.003` flood PD, `+0.005` EPC≥E PD | additive PD uplift | heuristic; cf. guide's ECB WP-2785 "+34bp flood" |
| `12.5` | RWA density = 1/(8% capital) | Basel III standardised (BCBS) |
| `basePd` | `0.005+sr(i·41)·0.025` (0.5–3.0%) | synthetic demo value |
| `propVal` | `150k+sr(i·3)·1.35M` (£) | synthetic demo value |
| `ltv` | `0.50+sr(i·17)·0.35` (50–85%) | synthetic demo value |
| `baseRate` | `4.5+sr(i·37)·2.0` (%) | synthetic demo value |

### 7.3 Calculation walkthrough

`sr()` seeds → EPC/region/product/propVal/LTV/baseRate → `loanAmt = propVal·ltv/1000` (£k) →
green/flood/coastal flags set the rate adjustments → additive PD uplift → RWA base vs climate. Portfolio
KPIs: `totalBook` (£M), `avgClimRate` (adds a `rateSens` slider bp), `totalRwaUp` = Σ(rwaClim−rwaBase).
Companion `pdTimeline` projects PD to 2040 across a fixed horizon grid.

### 7.4 Worked example

Loan: `propVal=£400,000`, `ltv=0.70` → `loanAmt=£280.0k`; `basePd=1.2%`, `lgd=0.35`, `baseRate=5.20%`,
EPC "E" (epcIdx=4, GREEN_DISC=−0.10%), flood zone, `strandHaircut=8%`:

| Step | Computation | Result |
|---|---|---|
| Climate rate | 5.20 − (−0.10)? here greenDisc for E ≈ 0 + flood 0.25 | ≈ **5.45%** |
| PD uplift | flood 0.003 + EPC≥E 0.005 | +0.008 |
| adjPd | 0.012 + 0.008 | **2.0%** |
| adjPropVal | 400,000·(1−0.08) | £368,000 |
| adjLtv | 280,000/368,000 | **76.1%** (from 70%) |
| rwaBase | 280·0.012·0.35·12.5 | **£14.7k** |
| rwaClim | 280·0.020·0.35·12.5 | **£24.5k** |
| RWA uplift | 24.5 − 14.7 | **+£9.8k (+67%)** |

The flood + poor-EPC combination nearly doubles PD and lifts effective LTV by 6 pts — the collateral and
capital consequence the module is designed to surface.

### 7.5 Data provenance & limitations

- **All loan-tape data synthetic** (`sr()` PRNG). No real EPC register, geocode, or PD calibration.
- PD uplift is a flat step function (+30bp / +50bp), not a hazard-scaled beta; it ignores income/DTI and
  applies uniform LGD. No lifetime ECL, no IFRS-9 staging on-page, no discounting.
- Rate adjustments are indicative spreads, not derived from a competing-risks prepayment/default model.

**Framework alignment:** Basel III/IV standardised RWA (12.5 density, BCBS) · IFRS 9 ECL = PD·LGD·EAD
framing (guide) · ECB Guide on Climate & Environmental Risks 2020 and EBA Climate Stress Test 2023 as the
supervisory context the additive uplift approximates · BoE SS3/19.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Loan-level climate-adjusted PD, LGD and lifetime ECL for a residential mortgage
book, plus Pillar-2 capital add-on, under NGFS scenarios — the EBA climate-stress deliverable.

**8.2 Conceptual approach.** Multiplicative climate-beta on PD (as the guide states) with hazard-specific
physical damage functions and an EPC-gap transition channel, mirroring **ECB economy-wide CST** loan
transmission and **Bank of England CBES** mortgage modelling; LGD driven by climate-conditioned collateral
revaluation (CRREM-style stranding for the value path).

**8.3 Mathematical specification.**
```
PD_climate,t = PD_base × (1 + β_phys·HazardScore + β_trans·EPC_gap) under scenario s,horizon t
LGD_climate  = max( LGD_base , 1 − CollateralValue_climate/EAD )
CollateralValue_climate = V0 · (1 − depreciation_EPC − physicalDamage_hazard)
ECL_lifetime = Σ_t  PD_marginal,t · LGD_climate,t · EAD_t · DF_t
Pillar2_addon = ECL_climate,scenario − ECL_base
```

| Parameter | Calibration source |
|---|---|
| β_phys, β_trans | ECB WP-2785 flood-PD elasticity; EBA 2023 EPC-default study |
| Hazard damage functions | JRC river-flood depth-damage curves; UKCP18 hazard maps |
| EPC depreciation | BoE 2022 EPC collateral-premium research (−15% to +12%) |
| Scenario paths | NGFS Phase IV carbon-price / GDP / physical variables |

**8.4 Data requirements.** Loan tape with EPC + geocode + LTV + income; flood/coastal hazard layers (EA
flood zones, UKCP18); NGFS scenario variables (platform `climate_scenarios`, migration 088); property price
index. Free: EA/JRC flood maps, NGFS database; vendor: EPC register, AVM values.

**8.5 Validation & benchmarking.** Backtest flood-zone realised default differential; reconcile aggregate
ECL uplift against EBA 2023 "+8–22%" adverse-scenario range; sensitivity on β and stranding haircut.

**8.6 Limitations & model risk.** Sparse EPC coverage; hazard maps static vs forward SLR; behavioural
prepayment omitted. Fallback: regional EPC-band averages and conservative +34bp flood floor when
loan-level data missing.
