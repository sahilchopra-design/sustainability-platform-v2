## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The guide advertises two formulas —
> `ProcurRisk = Σ[SpendShareᵢ × (Physᵢ + Transᵢ + Regᵢ)]` (spend-weighted, three-component) and
> `CarbonPassThrough = Σ[Spendⱼ × CarbonIntensityⱼ × CarbonPrice × PassThroughRate]`. **Neither is
> implemented.** The code's composite risk is an **unweighted simple mean of just two components**,
> `(physicalRisk + transitionRisk)/2` — regulatory exposure is displayed but not folded into the
> composite, and there is no spend-weighting. The carbon pass-through calculation (with a carbon price
> and pass-through rate) does not exist; carbon cost pass-through appears only as a mitigation-action
> label and scenario narrative. All 70 categories are `sr()`-seeded.

### 7.1 What the module computes

**Composite category risk** (drives the RiskBadge, top-10 ranking, filters):

```js
composite = (physicalRisk + transitionRisk) / 2                 // 1–10 scale, simple mean
level     = composite ≥ 7.5 ? 'Critical' : ≥ 5.5 ? 'High' : ≥ 3.5 ? 'Medium' : 'Low'
```

**Portfolio KPIs** (all unweighted means / counts over 70 categories):

```js
totalSpend    = Σ spendMn                              // → "$B" headline
avgPhysical   = Σ physicalRisk / 70
avgTransition = Σ transitionRisk / 70
criticalCount = #{ (phys+trans)/2 ≥ 7.5 }
highHhiCount  = #{ concentrationHhi > 0.4 }
avgCarbonInt  = Σ carbonIntensity / 70                 // tCO₂e/$M spend
```

**Regional / type breakdowns** average `physicalRisk`, `transitionRisk`, `carbonIntensity` within a
group; regional composite = `(avgPR + avgTR)/2`, sorted descending.

**Scenario tab** applies **hard-coded** NGSF-labelled adjustments (not derived from the data):

| Scenario | physAdj | transAdj | spendImpact |
|---|---|---|---|
| Orderly (1.5 °C) | −0.5 | +2.0 | +8% |
| Disorderly (2 °C) | +1.0 | +3.5 | +18% |
| Hot House (3.5 °C+) | +4.5 | −0.5 | +35% |

### 7.2 Parameterisation / provenance

| Field | Formula | Provenance |
|---|---|---|
| physicalRisk | `sr(i·11+3)·9 + 1` (1–10) | **synthetic seeded** |
| transitionRisk | `sr(i·13+4)·9 + 1` (1–10) | **synthetic seeded** |
| spendMn | `sr(i·17+5)·30 + 1` ($1–31M) | synthetic seeded |
| concentrationHhi | `sr(i·23+7)·0.6 + 0.1` (0.1–0.7) | synthetic seeded |
| carbonIntensity | `sr(i·29+8)·200 + 10` | synthetic seeded |
| regulatoryExposure | `sr(i·41+11)·9 + 1` | synthetic; **not in composite** |
| Composite thresholds | 7.5 / 5.5 / 3.5 | in-code rubric |
| Scenario adjustments | table above | hand-authored (NGSF-labelled) |
| HHI critical cutoff | 0.4 | in-code (loosely maps to "moderately concentrated") |

### 7.3 Calculation walkthrough

1. `CATEGORIES` seeds 70 procurement categories with independent `sr()` draws per attribute.
2. Filters (region/type/risk-level) subset; the risk-level filter recomputes `(phys+trans)/2` per
   category then buckets by the 7.5/5.5/3.5 thresholds.
3. KPI strip: sums spend, averages the two risk axes and carbon intensity, counts critical / high-HHI.
4. Regional & type breakdowns re-average within groups.
5. Scenario tab: displays base avg physical/transition + the fixed per-scenario adjustment and a
   flat % spend impact (no per-category propagation).

### 7.4 Worked example (KPI strip + one category)

Take a seeded category with `physicalRisk = 8.2`, `transitionRisk = 6.4`, `spendMn = 24.0`,
`concentrationHhi = 0.52`:

| Metric | Computation | Result |
|---|---|---|
| Composite | (8.2 + 6.4)/2 | **7.3** → **High** (below 7.5) |
| HHI flag | 0.52 > 0.40 | high concentration ✓ |

Under **Disorderly (2 °C)**: displayed adjusted physical = base avg + 1.0, transition = base avg +
3.5, headline "spend impact +18%". Note the scenario spend impact is a **single flat %** applied to
the narrative, not `Σ spend × carbon × price` — a category's own carbon intensity does not change its
scenario cost.

### 7.5 Data provenance & limitations

- **All 70 categories are synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)` with distinct
  prime multipliers per field, so attributes are mutually independent (a high-carbon category need
  not carry high transition risk).
- Composite ignores regulatory exposure and spend weight → contradicts the guide's three-component,
  spend-weighted formula. A high-spend Critical category counts the same as a $1M one.
- **No carbon pass-through model**: no carbon price, no pass-through rate, no CBAM cost estimate —
  despite the guide's headline formula and CBAM framing.
- Scenario adjustments are hand-set constants, not NGFS macro-financial paths; they are not
  propagated to individual categories or to spend.

**Framework alignment:** The page references **EU CS3D (2024/1760)** and **EUDR (2023/1115)** as
supply-chain due-diligence drivers and **NGFS** scenario labels, and **CBAM** as a carbon-cost
channel. For reference, CBAM prices embedded emissions of imported steel/cement/aluminium/fertiliser/
electricity at the EU-ETS price — the natural basis for a real pass-through calc. **SBTi Scope 3
guidance** underlies the carbon-intensity framing. None of these frameworks' quantitative methods are
implemented; they inform the taxonomy and narrative only.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a spend-weighted procurement climate-risk score and a carbon-cost
pass-through estimate per category and portfolio, to prioritise supplier engagement and stress-test
CBAM/carbon-price exposure. Coverage: all procurement categories with spend, carbon intensity, and
region.

**8.2 Conceptual approach.** (i) A **spend-weighted multi-factor risk index** (physical + transition
+ regulatory), mirroring McKinsey/Gartner supply-chain risk indices and the CS3D risk-based
prioritisation logic. (ii) A **carbon-cost pass-through model** mirroring CBAM cost estimation and
IEA sector cost pass-through — the buyer's expected price increase from upstream carbon pricing.

**8.3 Mathematical specification.**
Spend share: `wᵢ = spendᵢ / Σ spend`.
Category risk: `Rᵢ = α·physᵢ + β·transᵢ + γ·regᵢ`, weights α+β+γ=1 (default 0.4/0.4/0.2).
Portfolio risk: `ProcurRisk = Σᵢ wᵢ · Rᵢ`.
Pass-through cost: `PTᵢ = spendᵢ · carbonIntensityᵢ · CarbonPrice_s · passRateᵢ`;
portfolio `PT = Σᵢ PTᵢ`; scenario-conditioned via `CarbonPrice_s` from NGFS.
CBAM subset: restrict to CBAM commodities, `CBAMcostᵢ = importVolᵢ · embeddedEFᵢ · (ETSprice − originCarbonPrice)`.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Component weights | α,β,γ | expert / CS3D materiality (default 0.4/0.4/0.2) |
| Carbon price path | `CarbonPrice_s` | NGSF Phase IV shadow carbon; EU-ETS for CBAM |
| Pass-through rate | `passRateᵢ` | IEA sector pass-through (40–70% industrials) |
| Carbon intensity | `carbonIntensityᵢ` | CDP supplier data / sector EF (EPA/IEA) |
| Embedded EF (CBAM) | `embeddedEFᵢ` | EU CBAM default values by commodity |

**8.4 Data requirements.** Per category: spend, supplier carbon intensity (or sector proxy), region,
CBAM-commodity flag + import volume, regulatory-regime applicability. Sources: procurement ERP spend
cube, CDP supplier disclosures, EU CBAM default-value tables, NGSF carbon paths (migration 088).

**8.5 Validation & benchmarking.** Backtest pass-through cost against realised commodity price moves
post-carbon-price changes; sensitivity of ProcurRisk to component weights; reconcile CBAM cost
against declared CBAM certificates for pilot categories.

**8.6 Limitations & model risk.** Supplier-level carbon intensity is sparse → sector proxies dominate;
pass-through rates vary with market power and contract structure. Conservative fallback: sector-median
intensity at flagged low DQ; cap pass-through at 100% of the carbon cost.
