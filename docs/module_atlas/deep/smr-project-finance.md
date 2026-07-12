## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most modules in this batch, SMR Project Finance runs a **genuine numerical project-finance engine**
against 6 named real-world SMR designs (NuScale VOYGR-77, Rolls-Royce SMR, GE-Hitachi BWRX-300, Kairos
KP-FHR, X-Energy Xe-100, Westinghouse eVinci) with hand-curated technical/cost parameters (capex $/kW, fixed
O&M, fuel cost, WACC, capacity factor, lifetime, TRL). Three real calculations run over these inputs:

```js
// Levelized cost of energy with Wright's-Law learning-curve adjustment
learningReduction = nthOfAKind ^ (-0.12)
adjCapex          = capexKw × learningReduction
capexAnn          = adjCapex × wacc / (1 − (1+wacc)^(−lifetime))     // capital recovery factor
idc               = (1+wacc)^2                                       // interest-during-construction, 3–4yr build
annMwh            = cf/100 × 8760
LCOE              = (capexAnn × idc + opexFixed/annMwh × 1000) / annMwh × 1000 + fuelCost

// Equity IRR via Newton-Raphson (200-iteration root find on NPV=0)
// Cash flows: −equityCapex at t=0, then constant net = revenue − opex − debtService for 30 years
```

### 7.2 Parameterisation

| Parameter | Value / rule | Provenance |
|---|---|---|
| Learning-curve exponent | fixed **−0.12** | hand-set; **implies a Wright's-Law learning rate of `1 − 2^(−0.12) ≈ 8.0%`**, which is *below* the guide's stated "10–15%" range — see note below |
| IDC factor | `(1+wacc)²` | approximates 2 years of compounded construction-period interest on a 3–4yr build; a simplification (real IDC integrates drawdown schedule, not a flat squared factor) |
| Debt service | `capexTotal × debtPct/100 × (wacc/100 + 1/30)` | approximates a level mortgage-style payment (interest + straight-line 1/30 principal), not a true annuity formula |
| Monte Carlo shocks | capex `1 + (sr(i×7)−0.5)×0.3` (±15%), price `1 + (sr(i×11)−0.5)×0.4` (±20%) | synthetic, but methodologically legitimate as **uniform** (not normal) perturbation bands over 200 draws |
| Design parameters (capex $6,500/kW NuScale, etc.) | hand-curated per design | plausible industry figures (NuScale, RR SMR, BWRX-300, Kairos, X-Energy, eVinci public cost disclosures), not live-sourced |

**Learning-rate discrepancy**: the guide's headline formula is `NOAK Cost = FOAK Cost × N^(log(1−LR)/log(2))`
with a stated LR of 10–15% (NEA SMR Report 2021). The code instead hard-codes the Wright's-Law exponent at
`−0.12` directly rather than deriving it from a stated LR. Solving backwards, `−0.12 = log2(1−LR) ⇒
LR = 1 − 2^(−0.12) ≈ 8.0%`, below the guide's cited range — a real calibration gap between the documented
methodology and the implemented constant, though the *functional form* (power-law learning curve) is
correct and matches NEA/DOE practice.

### 7.3 Calculation walkthrough

- **LCOE** (`calcSmrLcoe`): applies the learning-curve discount to capex, annualises via capital-recovery
  factor at the project WACC, adds interest-during-construction, and layers fixed O&M (spread over annual
  MWh) plus variable fuel cost per MWh.
- **Equity IRR / NPV**: builds a 30-year (or `lifetime`, capped at 30) cash-flow vector — equity-funded capex
  outflow at t=0 (`−capexTotal × equityShare`), then a constant annual net cash flow (`revenue − opex −
  debtService`) — and solves for IRR via genuine Newton-Raphson iteration (200 iterations, convergence
  tolerance 1e-8) and computes NPV at the input WACC.
- **NOAK learning table**: recomputes LCOE at `nthOfAKind ∈ {1,2,5,10,20,50,100}` to show the learning curve
  trajectory per design.
- **Monte Carlo** (200 runs): re-solves the full IRR cash-flow model under independently sampled capex and
  power-price shocks, then bins results and reports mean/P10/P50/P90 and probability of exceeding an 8%
  hurdle rate.
- **LCOE vs Scale**: models diseconomies of scale for large reactors via a piecewise capex curve
  (`mw<200: 8000−5×mw`; `mw<600: 7000−2×mw`; else `6500+1×(mw−600)`) — a hand-fit approximation, not sourced
  from a specific cost-scaling study.

### 7.4 Worked example (NuScale VOYGR-77, FOAK, base case)

`capexKw=$6,500`, `opex=$28/kW/yr`, `fuel=$9/MWh`, `wacc=9%`, `cf=93%`, `lifetime=60yr`, `nthOfAKind=1`:

| Step | Computation | Result |
|---|---|---|
| Learning reduction | `1^(−0.12)` | 1.000 (no discount at FOAK) |
| Adjusted capex | 6,500 × 1.000 | $6,500/kW |
| Capital recovery factor | 0.09 / (1 − 1.09⁻⁶⁰) | ≈0.0902 |
| Annualised capex | 6,500 × 0.0902 | $586.3/kW/yr |
| IDC factor | 1.09² | 1.188 |
| Annual MWh per kW | 0.93 × 8,760/1000 | 8.147 MWh/kW |
| LCOE | (586.3×1.188 + 28/8.147×1000)/8.147×1000/1000 + 9 → | **≈$94–96/MWh** (matches displayed FOAK KPI range) |

At `nthOfAKind=50`: `learningReduction = 50^(−0.12) ≈ 0.596`, roughly halving the capex-driven component of
LCOE and producing the "NOAK Target" KPI shown on the page.

### 7.5 Monte Carlo statistics

The engine reports `mean`, `P10`, `P50`, `P90` of the 200-run IRR distribution and `P(IRR ≥ 8%)` as the
probability of clearing the hurdle rate — a legitimate frequentist summary of the simulated distribution
(sorted array, index-based percentile selection), not a parametric approximation.

### 7.6 Data provenance & limitations

- The 6 design cost/technical parameters are **hand-curated, single-point estimates** representing public
  disclosures (NuScale NRC certification docs, Rolls-Royce SMR GDA filings, GE-Hitachi BWRX-300 OPG siting
  studies) as of the platform's last data refresh — not live-sourced, and will drift from actual project
  cost updates over time.
- Monte Carlo shocks are **uniform, not empirically fit distributions** — real construction-cost overrun
  distributions for FOAK nuclear projects are right-skewed (Sovacool et al. nuclear cost-overrun studies
  show median overruns >100% for FOAK plants), which a symmetric ±15% uniform band understates.
- IDC and debt-service formulas are simplifications of true construction-drawdown and amortisation
  schedules — adequate for illustrative sensitivity, not bankable-model precision.
- The learning-rate exponent (−0.12 ⇒ ~8% LR) understates the guide's own cited 10–15% NEA range; a
  production model should let LR be design-specific and configurable, not a single hard-coded constant
  across all 6 reactor types (FOAK-heavy microreactors like eVinci plausibly have different learning
  dynamics than gigawatt-adjacent designs like Rolls-Royce SMR).

### 7.7 Framework alignment

- **NEA Cost Estimation Methodology for SMRs (2015) / DOE Advanced Reactor Demonstration Program** — Wright's
  Law power-law learning curve is the correct functional form per NEA guidance; only the calibrated exponent
  deviates from the guide's cited range.
- **IRS §45U / §45J PTC and DOE Title XVII loan guarantees** — referenced in the guide and shown descriptively
  in the Financing Structures/Policy tabs, but not wired into the IRR cash-flow model (no PTC or loan-
  guarantee-adjusted WACC term appears in `cashflows`).
- The Newton-Raphson IRR solver and NPV discounting are textbook-correct implementations, consistent with
  standard project-finance modelling practice (equivalent to Excel's `IRR`/`NPV` functions).
