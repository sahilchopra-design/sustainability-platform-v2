## 7 · Methodology Deep Dive

This sibling module (EP-CH3) focuses on **multi-regulator alignment** (ECB CST 2024, BoE CBES, APRA CPG 229)
and adds a **reverse stress test**. The forward stress is a linear PD-shock model matching the guide's
`ECL_stressed = PD_base·(1 + β_sector·ΔGDP + γ·ΔCarbonPrice)·LGD·EAD`; the reverse solver inverts a target
loss fraction into implied carbon price and GDP shock. Sector shocks and noise are seeded/curated.

### 7.1 What the module computes

Sector loss impact (ECB CST):
```js
sectorImpact = ECB_SECTORS.map(s => ({ ... pdShock·pdShockMult, lgdShock·lgdShockMult, exposure ... }))
```
Reverse stress test — solve for the shock triple that hits a target loss %:
```js
targetFrac  = reverseTarget/100
carbonPrice = round(targetFrac·1800 + 50)      // € per tonne implied
gdpShock    = −(targetFrac·12 + 1)             // % GDP contraction implied
physicalLoss = targetFrac·8 + 0.5             // % physical loss implied
```
Idiosyncratic noise on shocks:
```js
pdNoise  = 0.05 · sr(i·13)          // [0, 0.05]
lgdNoise = 0.025 · sr(i·9+100)      // [0, 0.025]
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `ECB_SCENARIOS` (4: temp, carbonPrice, pdShock, lgdShock) | seed schema | curated (ECB CST 2024 scenarios) |
| `ECB_SECTORS` (9: pdShockMult, lgdShockMult, exposure) | seed schema | sector-relative shock multipliers |
| `BOE_SCENARIOS` (4: pdImpact, physOverlay) | seed schema | BoE CBES early/late-action |
| `APRA_RISKS` (6: lossRate, region) | seed schema | APRA CPG 229 Australian physical/coal |
| Reverse-solve slopes | `1800·frac+50`, `−(12·frac+1)`, `8·frac+0.5` | heuristic linear inversion |

The reverse-solve coefficients encode: to lose the whole portfolio (frac→1) you need ~€1,850 carbon price,
~−13% GDP, ~8.5% physical loss — a plausible but calibrated linear map, not a solved equilibrium.

### 7.3 Calculation walkthrough

Forward path: pick regulator scenario → `sectorImpact` applies each sector's PD/LGD shock multipliers to the
scenario shock, weighted by exposure → aggregate loss. Reverse path: user sets a `reverseTarget` loss % →
the three linear formulae return the implied carbon price / GDP shock / physical loss that would produce it.
`SUBMISSION_TIMELINE` tracks regulatory deadlines.

### 7.4 Worked example

**Forward:** ECB scenario `pdShock = 0.6%`, sector `pdShockMult = 1.5`, `lgdShock = 5%`, `lgdShockMult = 1.2`,
`exposure = €500M`, base PD 1.5%, LGD 40%:
```
stressedPD  = 1.5% + 0.6%·1.5 = 2.4%
stressedLGD = 40% + 5%·1.2   = 46%
ECL_stressed = 0.024·0.46·500 = €5.52M  vs base 0.015·0.40·500 = €3.00M  → +84% uplift
```
**Reverse:** target loss `reverseTarget = 20%` → `frac = 0.20`:
```
carbonPrice = 0.20·1800 + 50 = €410/t
gdpShock    = −(0.20·12 + 1) = −3.4%
physicalLoss = 0.20·8 + 0.5  = 2.1%
```
So a >20% portfolio loss is implied by ~€410/t carbon and −3.4% GDP — consistent with the guide's
"Carbon >€200, GDP <−3%" breaking-condition annotation.

### 7.5 Data provenance & limitations

- Scenario shocks and sector multipliers are **curated demo values** approximating ECB/BoE/APRA parameters;
  `pdNoise`/`lgdNoise` are `sr()`-seeded idiosyncratic add-ons.
- The reverse solver is a **linear inversion with fixed slopes**, not a true optimisation over a loss surface
  — it returns *a* consistent shock triple, not the minimum-distance or most-plausible breaking scenario.
- No lifetime ECL, no macro feedback; single-period sector shocks only.

**Framework alignment:** ECB Climate Stress Test 2024 (3-scenario, 30-yr, sector PD/LGD shocks) · BoE CBES
(early/late action + physical overlay) · APRA CPG 229 (Australian physical + coal exposure) · Fed SR 11-7
(model-risk governance framing). The reverse stress test operationalises supervisory reverse-stress
expectations.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce cross-regulator-consistent forward stress losses and a *properly solved*
reverse stress test identifying the least-implausible scenario that breaches a capital threshold.

**8.2 Conceptual approach.** Forward: sector satellite PD/LGD model (ECB CST). Reverse: constrained
optimisation over the NGFS scenario space to find the minimum-Mahalanobis-distance shock vector that hits the
loss target — the supervisory "reverse stress" best practice (BoE/EBA), not a fixed linear map.

**8.3 Mathematical specification.**
```
Forward:  ECL_s = Σ_i EAD_i·PD_base,i·(1 + β_i·ΔGDP_s + γ_i·ΔCarbon_s)·LGD_i
Reverse:  min_x (x−μ)ᵀ Σ⁻¹ (x−μ)   s.t.  Loss(x) ≥ target,   x = (ΔCarbon, ΔGDP, PhysLoss)
          where Loss(x) is the forward model; μ,Σ from NGFS scenario ensemble
Plausibility = χ²-quantile of the solved Mahalanobis distance
```

| Parameter | Source |
|---|---|
| β_i, γ_i | ECB CST satellite coefficients |
| μ, Σ (scenario mean/cov) | NGFS Phase IV ensemble |
| Loss target | capital-threshold policy (CET1 hurdle) |

**8.4 Data requirements.** Portfolio EAD/PD/LGD/sector; NGFS scenario ensemble; capital position. Free:
NGFS; vendor: none required.

**8.5 Validation & benchmarking.** Reconcile forward losses vs ECB/BoE published ranges; verify reverse
solution lies on the loss-target manifold; report plausibility percentile; sensitivity on Σ.

**8.6 Limitations & model risk.** Reverse solution sensitive to Σ specification; linear forward model misses
non-linear tail damage; regulator scenarios differ in horizon. Fallback: grid-search reverse solve with
documented linear slopes (current behaviour) when optimisation does not converge.
