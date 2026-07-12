## 7 · Methodology Deep Dive

This is one of the more faithful modules: it implements a **multi-scenario, sector-conditioned PD stress
with an IFRS-9 ECL overlay and a CET1 capital waterfall** — genuinely the guide's
`CSL = Σ EAD·PD(Δscenario)·LGD` shape. The multipliers and hazard tables are curated demo values, and the
borrower book is `sr()`-seeded, but the calculation structure (transition PD multiplier × physical overlay,
ECL trans/phys decomposition, CET1 bridge) is real supervisory-style stress logic.

### 7.1 What the module computes

Sector-level PD stress (25 scenarios, 31 sectors):
```js
stressed = rng(basePD·mult·0.95, basePD·mult·1.05, seed)   // mult = s[scenarioKey+'Mult']
pdChange = stressed − basePD ;  pdChangePct = pdChange/basePD·100
```
IFRS-9 ECL overlay (per borrower):
```js
baseECL     = basePD/100 · lgd/100 · exposure
transOverlay = (stressedPD − basePD)/100 · lgd/100 · exposure · 0.6   // 60% of PD delta → transition ECL
physOverlay  = physRisk/10 · exposure · rng(0.002, 0.015, seed)        // physical damage overlay
```
CET1 capital waterfall (bridge from opening to closing capital):
```js
closing = opening + credit_trans + credit_phys + market_risk + op_risk + nii_impact + green_benefit
totalImpact = closingCET1 − opening
```
Physical-risk tab aggregates hazard exposures scaled by `scale = (timeHorizon−2025)/25` and an
insurance-gap block (`gap = totalLoss − insuredLoss`).

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `SECTORS` (31): basePD, nace, 6 scenario mults (nz/b2c/dnz/dt/ndc/cp), transRisk, physRisk, carbonIntensity | seed schema | curated (NACE-mapped, NGFS-scenario multipliers) |
| `SCENARIO_DEFS` (25): temp, carbonPath | seed schema | NGFS/ECB/BoE/APRA scenario set |
| Transition ECL weight | fixed `0.6` | heuristic (60% of PD delta is transition) |
| Physical overlay rate | `rng(0.002, 0.015)` | heuristic damage-rate band |
| CET1 components (9) | seed schema | supervisory capital-bridge structure |
| `HAZARD_TYPES` (9): rcp45_2050, rcp85_2050 | seed schema | RCP-scenario hazard intensities |

### 7.3 Calculation walkthrough

Borrower book seeded (country/exposure/basePD/lgd/maturity) → scenario selection sets `multKey` →
`sectorData` applies the sector multiplier ±5% noise → `borrowerData` writes `<scenario>StressedPD` fields →
`eclData` splits ECL into base + transition overlay (0.6×) + physical overlay → CET1 waterfall bridges
opening capital through credit/market/op/NII/green components to `closingCET1`; `totalImpact` is the capital
hit. `allScenariosData` runs the bridge across all scenarios for comparison.

### 7.4 Worked example

Borrower: `basePD = 2.0%`, `lgd = 45%`, `exposure = €200M`, `physRisk = 6`; sector multiplier under
Current Policies `cpMult = 1.6`, physical-overlay draw 0.010:

| Step | Computation | Result |
|---|---|---|
| Stressed PD | 2.0%·1.6 (±5%) | ≈ **3.2%** |
| Base ECL | 0.020·0.45·200 | **€1.80M** |
| Transition overlay | (0.032−0.020)·0.45·200·0.6 | **€0.648M** |
| Physical overlay | (6/10)·200·0.010 | **€1.20M** |
| Total climate ECL | 1.80 + 0.648 + 1.20 | **€3.65M** |
| ECL uplift | (3.65−1.80)/1.80 | **+103%** |

The physical overlay here rivals the transition overlay because `physRisk` is high — the module's two-channel
split lets a user see which driver dominates under each scenario.

### 7.5 Data provenance & limitations

- Borrower book is **synthetic** (`sr()` PRNG via `pick/rng/rngInt`); sector multipliers, hazard intensities
  and CET1 components are curated demo constants, not a bank's actual portfolio or ECB-published shocks.
- The transition/physical ECL split uses fixed heuristics (0.6 weight; 0.2–1.5% physical rate), not
  scenario-specific damage functions; PD is single-period, not a full lifetime term structure.
- CET1 waterfall components are stored/seeded magnitudes, not solved from the ECL and RWA changes.

**Framework alignment:** NGFS Phase IV scenario set (25 `SCENARIO_DEFS`) · ECB economy-wide climate stress
test (sector-multiplier design, 4–8% RWA loss context) · BoE CBES · IFRS 9 §5.5 ECL staging (`IFRS9_STAGES`
schema) · the eight `/apra-clt`, `/bcbs-517`, `/boe-cbes`, `/ecb-cst` endpoints map to real supervisory
exercises. NACE sector codes anchor transition-factor assignment as NGFS prescribes.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Regulatory-grade climate stress: scenario-conditioned lifetime ECL, capital
depletion and RWA migration for a credit book, for ECB/BoE/APRA submissions and ICAAP.

**8.2 Conceptual approach.** NGFS-macro → sector-PD transmission via a **satellite credit model** (ECB CST
methodology) with hazard-specific physical damage functions (NGFS physical module / CLIMADA), and a full
IFRS-9 lifetime ECL term structure — mirroring ECB economy-wide CST and BoE CBES bank models.

**8.3 Mathematical specification.**
```
PD_s,t = PD_base · exp( γ_sector · (ΔGDP_s,t) + δ_sector · ΔCarbonPrice_s,t )    (satellite regression)
PhysDamage_s,t = Σ_peril P(peril|scenario,t) · DamageFn_peril(assetExposure)
LGD_s,t = LGD_base + φ·PhysDamage (collateral impairment)
ECL_lifetime = Σ_t PD_marginal,s,t · LGD_s,t · EAD_t · DF_t
ΔCET1 = −(ΔECL + ΔRWA·capital_ratio − GreenBenefit)
```

| Parameter | Source |
|---|---|
| γ, δ sector elasticities | ECB CST satellite-model coefficients |
| Damage functions | NGFS physical module / CLIMADA / JRC |
| Scenario macro paths | NGFS Phase IV (GDP, carbon price, physical) |
| LGD collateral sensitivity φ | supervisory LGD stress guidance |

**8.4 Data requirements.** Loan-level EAD/PD/LGD/NACE/geocode; NGFS variable database (migration 088);
hazard maps. Free: NGFS, JRC; vendor: RMS physical.

**8.5 Validation & benchmarking.** Reconcile aggregate loss vs ECB 4–8% RWA; Euler check on capital bridge;
sector backtest vs historical downturn PDs; sensitivity on γ/δ.

**8.6 Limitations & model risk.** Satellite coefficients estimated on short samples; deep-uncertainty in
physical tails; second-round macro feedback omitted. Fallback: multiplier-on-PD (as currently coded) with
conservative ceilings when satellite regression is unavailable.
