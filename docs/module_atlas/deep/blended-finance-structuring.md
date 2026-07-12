## 7 · Methodology Deep Dive

### 7.1 What the module computes

The richest of the three blended-finance pages. `calcBlendedStructure` turns a
capital-stack slider mix into blended cost, mobilisation ratio and concessionality:

```js
seniorPct       = 100 − firstLossPct − mezzPct
firstLossM      = totalM × firstLossPct/100
mezzM           = totalM × mezzPct/100
seniorM         = totalM × seniorPct/100
guaranteeM      = totalM × dfiGuaranteePct/100
blendedCost     = (firstLossM×0.04 + mezzM×(marketRate/100)×0.85 + seniorM×(marketRate/100)) / totalM
mobilizationRatio = seniorM / (firstLossM + guaranteeM×0.15)
concessionality = (marketRate/100 − blendedCost) × totalM
```

The cost model assigns fixed spreads to each layer: **first-loss 4% flat, mezzanine
85% of market rate, senior full market rate**; the mobilisation ratio treats
guarantees as 15% loss-equivalent capital.

### 7.2 Parameterisation

`DFI_PROVIDERS` (9 rows) carry real institutional first-loss capacity ($M) and
mobilisation ratios:

| DFI | First-loss capacity $M | Mobilisation ratio |
|---|---|---|
| EIB | 9,200 | 5.2× |
| IFC | 8,500 | 4.8× |
| OPIC/MIGA | 2,200 | 6.5× |
| EBRD | 5,600 | 4.1× |
| ADB | 4,200 | 4.2× |
| US DFC | 3,800 | 3.2× |
| AfDB | 3,100 | 3.5× |
| AIIB | 2,800 | 3.8× |

`MOBILIZATION_DATA` is a real-shaped 2015–2024 market series (total $48B→$224B, split
public-concession / DFI-guarantee / blended-funds). `TRANCHE_TYPES`, `USE_CASES`
(6 named deals with deal/first-loss/senior $M, mobilisation, carbon avoided Mt, IRR),
`GUARANTEE_STRUCTURES` and `OECD_PRINCIPLES` are descriptive tables. Sliders default:
`totalM=200`, `firstLossPct=12`.

### 7.3 Calculation walkthrough

1. Sliders set total facility, first-loss %, mezzanine %, DFI-guarantee %,
   concessional-rate discount (bps) and market rate.
2. `calcBlendedStructure` derives tranche $ amounts, blended cost %, mobilisation
   ratio and concessionality ($ subsidy value).
3. `concPricingData` sweeps concessional discount 0→500 bps to show its effect.
4. `dfiChart` plots each provider's first-loss capacity and mobilisation ratio.

### 7.4 Worked example

`totalM = 200`, `firstLossPct = 12`, `mezzPct = 20`, `dfiGuaranteePct = 10`,
`marketRate = 8%`:

| Step | Computation | Result |
|---|---|---|
| Senior % | 100 − 12 − 20 | 68% |
| First-loss $ | 200 × 0.12 | $24M |
| Mezzanine $ | 200 × 0.20 | $40M |
| Senior $ | 200 × 0.68 | $136M |
| Guarantee $ | 200 × 0.10 | $20M |
| Blended cost | (24×0.04 + 40×0.08×0.85 + 136×0.08)/200 | **6.3%** |
| Mobilisation ratio | 136 / (24 + 20×0.15) | **5.04×** |
| Concessionality | (0.08 − 0.063) × 200 | **$3.4M** |

The 12% first-loss plus a partial guarantee mobilises $136M senior at 5.0× — above
the OECD >3× target — while cutting the effective cost from 8.0% to 6.3%, a 170 bp
concessionality worth $3.4M.

### 7.5 Data provenance & limitations

- `DFI_PROVIDERS` capacities/ratios and `MOBILIZATION_DATA` are real-shaped
  reference data; `USE_CASES` are illustrative. `calcBlendedStructure` is deterministic
  (no PRNG on outputs).
- The blended-cost spreads (first-loss 4%, mezz ×0.85, guarantee ×0.15) are **fixed
  heuristics**, not risk-priced; mobilisation-ratio denominator counts only first-loss
  + 15% of guarantees, ignoring mezzanine's loss absorption.
- No expected-loss simulation, no first-loss *sizing to a hurdle* (it is an input, not
  solved), and the page does not call the backend engine's `model_concessional_layers`.

**Framework alignment:** OECD DAC Blended Finance Principles (`OECD_PRINCIPLES`
table) · Convergence / DFI leverage benchmarks (the 3–8× mobilisation band) · G20 MDB
Capital Adequacy Framework · the engine's IFC PS and MDB Harmonised additionality
scoring are available via the shared `/ref/*` endpoints but not surfaced here.

## 8 · Model Specification

**Status: specification — not yet implemented in code** (the page's cost/mobilisation
formulas are heuristics; the production model is the engine-backed structuring model).

**8.1 Purpose & scope.** Price a blended capital stack from a real expected-loss
distribution, size first-loss to a target senior rating/IRR, and report mobilisation
and concessionality — for MDB/DFI structuring teams.

**8.2 Conceptual approach.** Tranche-waterfall credit model with **loss-allocation
by seniority** and **first-loss sizing to a rating attachment point** (as in CLO/ABS
structuring and the DFI cascade), benchmarked against **Convergence 2023** leverage
and **G20 MDB CAF** capital treatment.

**8.3 Mathematical specification.**
```
Loss ~ portfolio credit model (e.g. Vasicek single-factor): P(L>x)
Attachment_senior = VaR_{α}(L)   → FirstLoss+Mezz must cover up to α (e.g. 99%)
Tranche_cost_i    = risk-free + credit_spread_i(PD_tranche_i, LGD)
BlendedCost       = Σ_i cost_i · size_i / total
Mobilisation      = senior_commercial / concessional_deployed
Concessionality   = (market_all_in − blended_all_in) · total   (grant-equivalent)
```

| Parameter | Source |
|---|---|
| Asset PD/LGD/correlation | Deal credit analysis; Moody's/S&P EM defaults |
| Rating attachment | Rating-agency CLO/ABS criteria |
| Market spreads | Comparable EM senior debt (Bloomberg/ICE) |
| DFI leverage benchmark | Convergence 2023 (engine) |

**8.4 Data requirements.** Underlying asset PD/LGD/EAD & correlation, target senior
rating, market spread curve, DFI capacity, guarantee terms. Engine
`model_concessional_layers` already ingests tranche shares/return targets; the credit
model (Vasicek loss distribution) is the addition.

**8.5 Validation & benchmarking.** Reconcile attachment points against rating-agency
tranche criteria; back-test blended cost against comparable closed deals; verify
mobilisation ratio matches Convergence sector medians; sensitivity on asset
correlation (dominant driver of tail loss).

**8.6 Limitations & model risk.** EM correlation and PD are data-poor and procyclical;
guarantees have basis risk vs cash first-loss. Conservative fallback: stress
correlation upward, size first-loss to the 99.5% loss VaR, and disclose the
grant-equivalent concessionality explicitly.
