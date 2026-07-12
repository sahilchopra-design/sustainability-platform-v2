## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **Fama-MacBeth cross-sectional regression**
> (`CRP = α + β_phys·PhysRisk + β_trans·TransRisk + β_pol·PolicyUnc + ε`) estimating priced climate
> premia. **No regression is run in the code.** The page instead *constructs* each issuer's spread as an
> algebraic split — physical premium + transition premium + residual — from seeded risk scores, then
> displays term structures, greenium-by-rating and EDF/CDS panels that are all `sr()`-generated. There is
> no factor loading estimation, no EPU index, no cross-sectional step. It is a spread-decomposition
> *display*, not a premium *estimator*. §8 specifies the regression the guide claims.

### 7.1 What the module computes

For up to 200 synthetic issuers, total spread is split into climate components:
```js
totalSpread   = 30 + sr(i·23)·470                                   // 30–500 bp
physPremium   = max(0, totalSpread·(physRiskScore/100)·(sr(i·37)·0.35+0.05))
transPremium  = max(0, totalSpread·(transRiskScore/100)·(sr(i·41)·0.40+0.05))
residualPremium = max(0, totalSpread − physPremium − transPremium)
```
Credit primitives are then conditioned on transition risk:
```js
climatePD   = basePD·(1 + transRiskScore/100·0.5)      // up to +50% PD from transition
carbonBeta  = (physRiskScore·0.4 + transRiskScore·0.6)/100
greenBondPremium = sr(i·47) > 0.7 ? −(sr(i·53)·15) : 0   // ~30% of issuers get −0..15bp greenium
```
Term structures build synthetic curves by rating × maturity (`baseSpread` seeded, physical/transition
components as fixed fractions).

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| `totalSpread` | `30 + sr(i·23)·470` | synthetic demo value |
| `physRiskScore`, `transRiskScore` | `5 + sr()·85` | synthetic demo value |
| Physical premium fraction | `physScore/100 × (sr·0.35+0.05)` | heuristic decomposition weight |
| Transition premium fraction | `transScore/100 × (sr·0.40+0.05)` | heuristic (transition weighted higher) |
| `climatePD` uplift | `1 + transScore/100·0.5` | heuristic (+50% cap) |
| `carbonBeta` | `0.4·phys + 0.6·trans` | heuristic loading split |
| Greenium | `−sr·15` bp for top ~30% | synthetic; cf. guide 20–80 bp credit premium |

### 7.3 Calculation walkthrough

Seeds → sector/rating/geography/maturity + risk scores → `totalSpread` decomposed into phys/trans/residual
→ `climatePD`, `carbonBeta`, LGD/EAD, ESG score, greenium. Derived panels: `TERM_STRUCTURE` (rating×maturity
curves), `RATING_OAS_SERIES`, `EDF_DATA` (60 issuers), `CARBON_INTENSITY_SCATTER`, `SCENARIO_SPREADS`,
`GREENIUM_BY_RATING`, `EL_TABLE` (expected loss by sector = avgPD·LGD·EAD).

### 7.4 Worked example

Issuer: `totalSpread=200 bp`, `physRiskScore=60`, `transRiskScore=80`, seeds giving phys-mult 0.20,
trans-mult 0.30; `basePD=2.0%`:

| Component | Computation | Result |
|---|---|---|
| Physical premium | 200·(60/100)·0.20 | **24 bp** |
| Transition premium | 200·(80/100)·0.30 | **48 bp** |
| Residual premium | 200 − 24 − 48 | **128 bp** |
| Climate PD | 2.0%·(1 + 0.80·0.5) | **2.8%** |
| Carbon beta | 0.4·0.60 + 0.6·0.80 | **0.72** |

Of the 200 bp spread, 72 bp (36%) is attributed to climate — the transition share dominating because of the
0.6 loading and higher score. This is definitional, not estimated: change the seeds and the "premium"
changes with no market data involved.

### 7.5 Data provenance & limitations

- **All issuer, spread and curve data synthetic** (`sr()` PRNG). No excess-return panel, no Fama-MacBeth,
  no Baker-Bloom-Davis EPU climate component (all named in the guide, none present).
- The climate "premium" is an assumed fraction of a random spread — it cannot tell you whether climate risk
  is *priced*; it merely reallocates a given spread by seeded scores.
- `climatePD` and `carbonBeta` are heuristic scalings, not estimated betas; `EL_TABLE` compounds seeded PD.

**Framework alignment:** TCFD portfolio alignment framing · NGFS scenarios (referenced, not simulated) ·
Fama-French / Fama-MacBeth factor methodology (the guide's intended engine, specified in §8) · the
academic 1.5–3.0% equity / 20–80 bp credit premia (Giglio et al.; ECB/ESRB) are cited as target magnitudes.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate the *priced* climate risk premium in credit and equity — the excess
return/spread investors demand per unit physical, transition and policy-uncertainty exposure — for use as a
climate-adjusted discount-rate add-on.

**8.2 Conceptual approach.** **Fama-MacBeth two-pass cross-sectional regression** (asset-pricing standard)
with climate factors, cross-checked against a mimicking-portfolio (long-high-minus-low climate risk) return
series à la Fama-French factor construction; policy-uncertainty factor from the Baker-Bloom-Davis climate-EPU
index. This mirrors published methodology (Giglio-Kelly-Stroebel; Bolton-Kacperczyk carbon-premium).

**8.3 Mathematical specification.**
```
Pass 1 (time series, per asset i):  r_it − r_ft = a_i + β_i^phys·PHYS_t + β_i^trans·TRANS_t + β_i^pol·EPU_t + e_it
Pass 2 (cross-section, each t):     r_it − r_ft = λ0_t + λ_phys_t·β_i^phys + λ_trans_t·β_i^trans + λ_pol_t·β_i^pol + u_it
CRP_f = mean_t(λ_f_t) ;  t-stat = mean/ (sd/√T)   (Newey-West adjusted)
Discount-rate add-on_i = Σ_f β_i^f · CRP_f
```

| Parameter | Source |
|---|---|
| PHYS_t, TRANS_t factor returns | high-minus-low climate-score portfolio sorts (Trucost/MSCI scores) |
| EPU_t | Baker-Bloom-Davis climate policy uncertainty index |
| Excess returns r_it | CRSP/Compustat (equity), ICE BofA OAS (credit) |
| β estimation window | 36–60 month rolling |

**8.4 Data requirements.** Asset returns/OAS panel; firm climate scores (physical hazard, carbon intensity,
transition alignment — platform Trucost-style data, `reference_data` CO2 tables); EPU index. Free: EPU,
OWID emissions; vendor: MSCI/Trucost scores, ICE OAS.

**8.5 Validation & benchmarking.** Newey-West t-stats on λ; out-of-sample premium stability; reconcile
equity CRP against Giglio et al. 1.5–3.0% and credit CRP against ECB 20–80 bp; GRS test on mimicking
portfolio.

**8.6 Limitations & model risk.** Short climate-return history → weak identification; score vendor
disagreement; premium regime-shifts around policy shocks. Fallback: report factor betas with wide CIs and a
literature-anchored premium band rather than a point discount add-on.
