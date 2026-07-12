## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **weighted 8-dimension composite score**
> (`Score = Σ w_d · Rating_md`) with explicit weights (Additionality 20%, Permanence 20%, MRV 15%,
> Co-benefits 15%, Scalability 10%, Cost 10%, Regulatory 5%, Integrity 5%) normalised to 0–100. **No
> such composite is computed in the code.** Each of the 20 `CLUSTERS` carries hard-coded per-attribute
> integers (permanence, additionality, mrvComplexity, coBenefitScore, avgPrice, bufferRate,
> abatementCost, and four SDG scores), and the page *sorts and plots* these attributes directly — it
> never forms a weighted composite, and there is no "Integrity Score" field at all despite an
> "Integrity Scoring" tab. The composite is a §8 candidate. Sections below document the code.

### 7.1 What the module computes

The module is a **comparison and procurement-allocation** tool over 20 credit-type clusters. It
performs no emission calculations; every headline is a projection, sort, or filter of the seed table:

- **MACC (cost curve):** `[...CLUSTERS].sort(a.abatementCost − b.abatementCost)` → abatement $/tCO₂e.
- **Permanence comparison:** sort by `permanence` (years), capped for display at 10,000.
- **Co-benefit heatmap:** per family, averages of the 4 SDG scores across member clusters.
- **Scenario builder (the only real "engine"):** a greedy budget-constrained allocation.

Allocation logic (Scenario Builder):
```
eligible = CLUSTERS.filter(permanence ≥ minPermanence AND coBenefitScore ≥ minCoBenefits)
sorted   = eligible.sort(ascending abatementCost)      // cheapest first
maxByConc = retireTarget · (maxConcentration/100)      // per-cluster cap
// walk sorted; for each, buy min(need, maxByConc, budget-affordable) credits
canAfford = floor(remaining_budget / avgPrice)
```
Portfolio KPIs: `totalCredits`, `totalCost`, credit-weighted `avgPermanence` and `avgCoBenefit`.

### 7.2 Parameterisation / scoring rubric

Per-cluster attributes are **expert-elicited hard-coded values** (no code comment cites a source;
they are calibrated to look like ICVCM/rating-agency judgements). Representative rows:

| Cluster | Family | Permanence (yr) | Additionality | MRV cplx | Co-benefit | Avg price $/t | Buffer % | Abatement $ |
|---|---|---|---|---|---|---|---|---|
| REDD+ & Forests | Nature-Based | 40 | 65 | 85 | 82 | 12.50 | 20 | 8 |
| Household Devices | Cookstoves | 100 | 80 | 45 | 92 | 9.00 | 5 | 7 |
| Biochar | CDR | 500 | 88 | 72 | 65 | 120 | 10 | 95 |
| BECCS | CDR | 5,000 | 90 | 90 | 35 | 180 | 15 | 150 |
| DAC | CDR | 10,000 | 95 | 85 | 20 | 450 | 5 | 380 |

All 20 clusters follow the same schema. Note the internal logic: CDR types carry high permanence +
additionality but low co-benefit and high cost; cookstoves invert that. Prices (DAC $450, biochar
$120) are consistent with 2024 VCM/CDR market ranges, so the seed is *plausible* if unsourced.

### 7.3 Calculation walkthrough

Inputs are the filter thresholds (`minPermanence`, `minCoBenefits`, `maxConcentration`) and financial
constraints (`retireTarget`, `budget`). The scenario builder filters → sorts by cost → greedily fills
the target, respecting a per-cluster concentration cap and running the budget down. Outputs are the
allocation table plus credit-weighted portfolio permanence and co-benefit. The other tabs are pure
projections of the seed attributes with no user-input dependency.

### 7.4 Worked example (Scenario Builder)

`retireTarget=100,000`, `budget=$2,000,000`, `minPermanence=10`, `minCoBenefits=30`,
`maxConcentration=40%`. `maxByConc = 100,000·0.40 = 40,000` credits/cluster.

Cheapest eligible is **Renewable Energy** (abatementCost 3, avgPrice 4.50, permanence 100,
coBenefit 42 ≥ 30 ✓). `canAfford = floor(2,000,000/4.50) = 444,444`, but capped at 40,000 by
concentration → buy 40,000 for $180,000; remaining budget $1,820,000, remaining need 60,000.
Next: **Industrial Gas** (avgPrice 5.50) → 40,000 credits for $220,000; need 20,000 left. Next:
**Landfill Gas** (avgPrice 6.50) → 20,000 for $130,000. Target met.
`totalCost = $530,000`; credit-weighted `avgPermanence = 100` yr; blended cost ≈ $5.30/t.

### 7.5 Data provenance & limitations
- **All cluster attributes are hard-coded heuristic values** — no PRNG, but also no traceable source
  in the file; they are synthetic expert judgements calibrated to public VCM knowledge.
- The "Integrity Scoring" tab does not compute an integrity score; it displays additionality/MRV
  attributes. No ICVCM CCP composite exists in code (see §8).
- Allocation is single-pass greedy (cost-first); it does not optimise for co-benefit or diversify
  beyond a flat concentration cap.

**Framework alignment:** **ICVCM Core Carbon Principles (2023)** — the intended benchmark; ICVCM
assesses credits on 10 CCPs (governance: programme + registry + transparency; emissions impact:
additionality, permanence, robust quantification, no double-counting; sustainable development
safeguards) at the *programme + methodology-category* level, yielding a binary CCP-label plus
category attributes. This module's per-attribute scores approximate those CCP dimensions but do not
reproduce ICVCM's binary assessment. **BeZero / Sylvera** ratings are the third-party analogues for
the additionality/permanence/MRV columns.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module *displays* a "methodology
integrity/quality score" (guide's weighted composite) that the code never computes. This section
specifies the production scoring model.

**8.1 Purpose & scope.** Produce a single 0–100 quality score per credit methodology cluster to rank
procurement options and screen a buy-list, reconcilable against ICVCM CCP labels and BeZero/Sylvera
letter grades. Coverage: the 20 methodology clusters, extensible to project-level.

**8.2 Conceptual approach.** A weighted multi-attribute utility (MAU) model — the standard structure
behind Sylvera's and BeZero's published rating frameworks and ICVCM's CCP attribute roll-up. Each
attribute is min-max normalised to 0–1, oriented so higher = better (MRV *complexity* and *cost* are
inverted), then combined by fixed weights. This mirrors (a) **Sylvera's** carbonment (additionality,
permanence, co-benefits, over-crediting risk) and (b) **ICVCM CCP** attribute aggregation.

**8.3 Mathematical specification.**
```
For attribute d ∈ {Add, Perm, MRV, CoB, Scal, Cost, Reg, Int}:
  x_d      = raw cluster value
  n_d      = (x_d − min_d)/(max_d − min_d)          // min-max across clusters
  n_d      = 1 − n_d   if d ∈ {MRVComplexity, AbatementCost}   // invert "worse-is-higher"
Perm handled log-scaled:  n_Perm = min(1, ln(1+years)/ln(1+10000))
Score_m  = 100 · Σ_d w_d · n_d
Over-crediting penalty:  Score_m ← Score_m · (1 − 0.5·bufferShortfall)
```
| Parameter | Value | Calibration source |
|---|---|---|
| w_Add, w_Perm | 0.20, 0.20 | Guide weights; align to ICVCM emphasis on additionality+permanence |
| w_MRV, w_CoB | 0.15, 0.15 | Guide weights |
| w_Scal, w_Cost | 0.10, 0.10 | Guide weights |
| w_Reg, w_Int | 0.05, 0.05 | Guide weights |
| Perm log anchor | 10,000 yr | DAC/geologic permanence ceiling (Puro/Oxford durability) |
| bufferShortfall | max(0, req − actual)/req | Verra AFOLU Non-Permanence Risk Tool buffer requirement |

**8.4 Data requirements.** Per cluster: the 8 attribute scores (from ICVCM assessment DB + Sylvera/
BeZero API), observed VCM transaction price (Ecosystem Marketplace / AlliedOffsets), required buffer
(registry NPR tool). Platform already holds the seed table; needs live rating-agency feeds.

**8.5 Validation & benchmarking plan.** Rank-correlate Score_m against (a) ICVCM CCP-eligibility
(point-biserial: eligible clusters should score in top quartile), (b) Sylvera/BeZero letter grades
(Spearman ρ target ≥ 0.7). Sensitivity: vary each weight ±5pp and confirm ranking stability
(Kendall τ). Backtest: do higher-scored methodologies command observed price premia?

**8.6 Limitations & model risk.** MAU weights are judgemental; a fixed weight set cannot capture
buyer-specific objectives (a net-zero buyer over-weights permanence). Min-max normalisation is
sensitive to outliers (DAC's 10,000-yr permanence compresses everyone else). Conservative fallback:
report the attribute vector alongside the composite so users can re-weight; flag any cluster whose
ICVCM label contradicts its computed score.
