## 7 · Methodology Deep Dive

*(Guide and code reconcile well for this module — the UNFCCC TOOL01/TOOL02/TOOL07/TOOL21 suite,
bisection IRR and barrier analysis described in MODULE_GUIDES are all genuinely implemented. Minor
deviations are noted inline: the guide's "bisection convergence to 0.01%" understates the code's
60-iteration precision, and the classic 20% common-practice threshold is a user slider defaulting
to 10%.)*

### 7.1 What the module computes

EP-DQ2 implements interactive versions of four UNFCCC CDM methodological tools plus a 40-project
synthetic assessment pipeline:

- **TOOL01/TOOL02 investment analysis** — NPV and IRR of a project with and without carbon
  revenue, investment-barrier test `IRR_withoutCarbon < WACC`.
- **TOOL02 common-practice analysis** — technology penetration lookup per country vs a threshold.
- **TOOL07 baseline grid emission factor** — Operating Margin / Build Margin / Combined Margin.
- **TOOL21 small-scale wizard** — 3-step decision tree (regulatory surplus → investment barrier →
  common practice).

Core formulas, quoted from code:

```js
cfNC  = revenue_noCarbon − O&M;   cfC = cfNC + credits × price
NPV   = −capex + Σ_{t=1..life} cf / (1 + WACC/100)^t
IRR   : bisection on r ∈ [−0.5, 5.0], 60 iterations, sign test on NPV(r)
barrier = IRR_NC × 100 < WACC
t7OM  = Σ (share_i / Σshare) × EF_i            // generation-weighted operating margin
t7BM  = Σ (mw_j / Σmw) × EF_j                  // capacity-weighted recent-build margin
t7CM  = w_OM × OM + (1 − w_OM) × BM            // default w_OM = 0.5
```

Bisection halves a 5.5-wide bracket 60 times (final width ≈ 5.5/2⁶⁰ ≈ 5×10⁻¹⁸) — far tighter than
the guide's "0.01%" claim; carbon-price scenarios re-solve IRR at $5/10/15/20/25 per credit.

### 7.2 Parameterisation

| Parameter | Default / range | Provenance |
|---|---|---|
| TOOL01 inputs | capex $2.0M, O&M $120k, revenue $280k, credits 8,000 tCO₂e/yr, price $12, WACC 10%, life 20y | synthetic demo defaults (user-editable) |
| Common-practice threshold | slider, default **10%** (sensitivity grid 5/10/15/20%) | TOOL02-style rubric; classic CDM benchmark is 20% |
| TOOL07 weights | w_OM = 0.5 default | matches CDM TOOL07 default 0.5/0.5 OM/BM weighting for most project types |
| TOOL21 decision tree | Step 1 legally required → non-additional; Step 2 IRR<WACC → additional; Step 3 <5 registered projects → additional; else non-additional | mirrors UNFCCC attachment-A logic; cites Decision 17/CP.7 in the result string |
| Pipeline verdict rule | `irr < wacc → Additional; pen < 10 → Additional; sr>0.7 → Non-Additional; else Pending` | synthetic assignment for the 40 demo projects |
| Barrier scores | 4 barrier types (Investment, Technological, Prevailing Practice, Institutional/Regulatory), 1–5 scale | synthetic seeded values |
| Sensitivity ranges | WACC {6,8,10,12,15}%, price {5,10,15,20}$, penetration {5,10,15,20}% | code constants |

### 7.3 Calculation walkthrough

1. **Assessment Pipeline** — 40 seeded projects (12 types × 20 countries) with IRR 4–20%, WACC
   8–15%, penetration 0–25%; KPIs: counts of Additional/Non-Additional/Pending, additionality
   rate, mean IRR/WACC; filter by verdict/tool, sortable.
2. **TOOL01 tab** — the §7.1 NPV/IRR engine; also payback = capex/cfNC and benefit-cost ratio
   `(NPV_NC + capex)/capex`; barrier verdict badge; carbon-price scenario table showing at which
   price the project stops being "additional" (IRR crosses WACC).
3. **TOOL02 tab** — penetration matrix (20 countries × 6 technologies, seeded 0–25%);
   `additional = penetration < threshold`.
4. **TOOL07 tab** — per-country synthetic plant stacks; OM from generation shares, BM from recent
   plant capacities, CM as the weighted blend with a w_OM slider.
5. **Barrier Matrix / Sensitivity / Evidence Log** — mean barrier score per project (`Σ/4`),
   count-based sensitivity tables over the §7.2 ranges, and an 8-item validation evidence
   checklist per project.

### 7.4 Worked example — TOOL01 defaults

capex $2,000,000; cfNC = 280,000 − 120,000 = $160,000/yr; carbon revenue = 8,000 × $12 = $96,000
→ cfC = $256,000/yr; WACC 10%, 20 years (annuity factor a(10%,20) = 8.5136):

| Quantity | Computation | Result |
|---|---|---|
| NPV without carbon | −2,000,000 + 160,000 × 8.5136 | **−$637,800** |
| NPV with carbon | −2,000,000 + 256,000 × 8.5136 | **+$179,500** |
| IRR without carbon | solve 160,000·a(r,20) = 2,000,000 | **≈ 4.95%** |
| IRR with carbon | solve 256,000·a(r,20) = 2,000,000 | **≈ 11.3%** |
| Investment barrier | 4.95% < 10% WACC | **Confirmed → Additional** |
| Payback | 2,000,000 / 160,000 | 12.5 yr |
| B/C ratio | 1,362,200 / 2,000,000 | 0.68 |

Carbon revenue lifts IRR above the hurdle (11.3% > 10%) — precisely the TOOL01 demonstration that
the project "is not financially viable without CER/VCU revenue but becomes viable with it".

### 7.5 Data provenance & limitations

- **Pipeline projects, penetration matrix and grid plant stacks are synthetic**
  (`sr(seed) = frac(sin(seed+1)×10⁴)`); no UNFCCC registry, IRENA or grid data is loaded. The
  TOOL01/07/21 calculators, however, run on user inputs, so their arithmetic is real.
- TOOL01 uses a flat annuity cash flow (constant revenue/O&M) — real PDDs use year-by-year models
  with degradation, tax and debt schedules; benchmark comparison (TOOL02's "benchmark analysis"
  option using government bond + risk premium) is not offered, only WACC.
- TOOL07 weights are user-set but the plant data behind OM/BM is seeded; real CM requires 3-year
  generation data and the latest-20%-of-builds BM set per TOOL07 v7.
- The pipeline's verdict rule short-circuits (`pen < 10 → Additional` even when IRR ≥ WACC), which
  is a demo simplification — real TOOL01 requires the full step sequence.
- Sensitivity `priceSens` recomputes NPV with an ad-hoc cash flow
  (`revenue + 5000×price − 5%×capex`) inconsistent with each project's stated credits volume.

### 7.6 Framework alignment

- **UNFCCC TOOL01 (Demonstration and Assessment of Additionality)** — the canonical 4-step logic
  (Step 0 prior consideration, Step 1 alternatives/regulatory surplus, Step 2 investment analysis
  OR Step 3 barrier analysis, Step 4 common practice). The module implements Steps 2–4 faithfully
  in calculator form; regulatory surplus appears as TOOL21 Step 1 and a per-project
  `regulatoryStatus` field.
- **UNFCCC TOOL02 (Combined tool)** — investment-comparison / benchmark analysis and common-
  practice penetration testing; the module's `IRR < WACC` benchmark test and penetration threshold
  mirror it (threshold configurable rather than fixed at the traditional 20%).
- **UNFCCC TOOL07 (Emission factor for an electricity system)** — OM (generation-weighted average
  of dispatched plants), BM (capacity-weighted average of most recent builds), CM = weighted
  combination with default 0.5/0.5 for wind/solar's first crediting period — the code's default
  matches.
- **UNFCCC TOOL21 / Decision 17/CP.7** — small-scale simplified additionality; the wizard's
  "required by law → non-additional" and "fewer than N similar registered projects" gates follow
  the small-scale attachment's barrier logic (code uses < 5 projects).
- **ICVCM CCP Additionality criterion** — ICVCM assesses whether a crediting *methodology
  category* ensures activities are beyond legal requirements and financially non-viable without
  credit revenue — exactly the two tests this module makes interactive.
