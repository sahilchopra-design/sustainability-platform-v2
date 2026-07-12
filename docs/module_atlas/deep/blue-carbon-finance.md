## 7 · Methodology Deep Dive

### 7.1 What the module computes

A blue-carbon project explorer over 55 synthetic projects (mangrove, seagrass,
saltmarsh, kelp). The one physical calculation is the credit-issuance identity:

```js
areaHa            = round(500 + sr(i×3)×49500)                  // 500–50,000 ha
seq               = 1 + sr(i×13)×9                              // tCO₂/ha/yr, 1–10
creditsIssued     = areaHa × seq × 0.001                        // ktCO₂ (×0.001 = ha·t → kt)
creditPrice       = 8 + sr(i×17)×42                             // $8–50/tCO₂
projectValue      = 0.5 + sr(i×19)×49.5                         // $M
additionality     = 3 + sr(i×23)×7                              // 3–10 score
permanenceRisk    = 1 + sr(i×29)×9                              // 1–10 score
```

Portfolio roll-ups: total area (Mha), total credits, total project value, mean
sequestration/additionality/permanence, and category means by ecosystem type,
standard and co-benefit.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Ecosystem types | Mangrove, Seagrass, Saltmarsh, Kelp Forest | Real blue-carbon habitats |
| Standards | VCS, Gold Standard, Plan Vivo | Real credit standards |
| Sequestration | 1–10 tCO₂/ha/yr (synthetic) | Guide cites 6–8 for mangroves (Blue Carbon Initiative) |
| Credit price | $8–50/tCO₂ (synthetic) | Broadly VCM blue-carbon band |
| Credits factor | area × seq × 0.001 | Unit conversion (ha·t → kt); implies 100% creditable, no buffer |
| Additionality / permanence | 3–10 / 1–10 (synthetic) | Qualitative scores, not risk-discounted |

`PROJECT_NAMES` are 55 named real-world locations (Borneo, Sundarbans, Belize,
Posidonia, California Kelp). Regions map to 8 coastal zones.

### 7.3 Calculation walkthrough

1. Generate 55 projects with seeded area/seq/price/scores.
2. `seqByType`/`priceByStandard` average sequestration and price by category.
3. Credit market tab: revenue `Σ creditsIssued × creditPrice`.
4. Permanence and additionality scatters plot the seeded scores; investment-pipeline
   tab slices the top projects by value.

### 7.4 Worked example

Mangrove project, `areaHa = 20,000`, `seq = 7 tCO₂/ha/yr`, `creditPrice = $25`:

| Step | Computation | Result |
|---|---|---|
| Credits issued | 20,000 × 7 × 0.001 | 140 ktCO₂ |
| Annual credit revenue | 140,000 × $25 | **$3.5M/yr** |

At 7 tCO₂/ha/yr the mangrove sequestration sits in the Blue Carbon Initiative's
6–8 band, and the ×0.001 factor makes `creditsIssued` a straight ha×rate conversion —
but note it credits **100% of gross sequestration** with no buffer deduction,
baseline netting, or permanence discount (see §8).

### 7.5 Data provenance & limitations

- All 55 projects are **synthetic** (`sr()` PRNG); only place names, ecosystem types
  and standard names are real.
- `creditsIssued` omits the VM0033 baseline-vs-project netting, the buffer-pool
  deduction, and any leakage/permanence discount — so it overstates saleable credits.
- The guide's coastal-protection co-benefit ($/ha avoided storm damage) is described
  but **not computed**; co-benefit is a categorical label here.
- Additionality and permanence are 1–10 seeded scores, not tied to risk factors or
  buffer sizing.

**Framework alignment:** Verra VM0033 (Tidal Wetland & Seagrass Restoration — the
intended crediting methodology: net GHG benefit = project − baseline − leakage, minus
buffer) · IPCC 2014 Wetlands Supplement (carbon-stock accounting) · Blue Carbon
Initiative (6–8 tCO₂/ha/yr mangrove rate) · Plan Vivo / Gold Standard (community
benefit-sharing). The page represents the *scale* of these but not their conservative
accounting.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate saleable blue-carbon credits and dual-value (carbon
+ coastal protection) NPV for a restoration project under VM0033 conservative
accounting — for conservation-finance investors and coastal development banks.

**8.2 Conceptual approach.** A **VM0033 net-GHG-benefit** crediting model (the
authoritative blue-carbon methodology) with buffer/leakage deductions, plus an
**InVEST/Natural Capital-style coastal-protection** avoided-damage valuation,
benchmarked against **Verra registered blue-carbon issuances** and **TNC coastal
resilience** studies.

**8.3 Mathematical specification.**
```
Net_seq_t = (C_project,t − C_baseline,t) − Leakage_t
Creditable_t = Net_seq_t · (1 − buffer_pct)                     buffer from AFOLU non-permanence tool
CarbonRev_t = Creditable_t · P_carbon,t
CoastalValue = Σ_storms P(storm) · DamageAvoided(habitat_extent) discounted
DamageAvoided = f(wave attenuation, population & assets protected)   (InVEST coastal vuln.)
NPV = Σ_t (CarbonRev_t + CoastalValue_t − Cost_t)/(1+r)^t
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Sequestration rate | C_project | IPCC Wetlands Supplement; field cores (Howard 2014) |
| Baseline / leakage | — | VM0033 baseline scenario |
| Buffer % | buffer | Verra AFOLU non-permanence risk tool |
| Storm probability | P(storm) | EM-DAT / IBTrACS return periods |
| Avoided damage | — | InVEST coastal vulnerability; asset exposure |

**8.4 Data requirements.** Habitat extent & condition (NASA/JAXA mangrove maps),
soil-carbon cores, baseline land-use, storm-hazard return periods, coastal asset
exposure, buffer risk factors. Platform holds none of these at project level.

**8.5 Validation & benchmarking.** Reconcile creditable tonnes against Verra-issued
VCUs for comparable registered projects; validate coastal-protection value against
peer-reviewed TNC estimates; sensitivity on buffer % and storm return period.

**8.6 Limitations & model risk.** Soil-carbon flux is uncertain and site-specific;
permanence is threatened by sea-level rise and aquaculture conversion; coastal-
protection value is exposure-dependent. Conservative fallback: apply the maximum
AFOLU buffer, exclude soil carbon below measurement depth, and treat coastal value as
co-benefit upside, not base-case revenue.
