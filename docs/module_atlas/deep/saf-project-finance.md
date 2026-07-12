## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The 20-deal "Deal Overview" universe (`DEALS`) has `irr` and
> `dscr` as **independently seeded PRNG fields** — they are not computed from any cash-flow model.
> A genuinely correct Newton-Raphson IRR solver (`calcIRR`) does exist in the code and **is** used,
> but only in the separate interactive "Financial Model" tab, where a user-adjustable capex/price/
> debt-rate calculator builds a real 21-period equity cash-flow vector and solves for IRR
> numerically. The two views of "IRR" on this page (static deal-log IRR vs interactive-calculator
> IRR) are computed by entirely different mechanisms.

### 7.1 What the module computes

**Interactive financial model** (real calculation):
```
annualRevenue     = capMt x 1e6 x lcoValue($/gal) x 264 gal/t / 1e6        // $M/yr
annualOpex        = capex x 3.5%                                          // fixed opex ratio
debt              = capex x 65%
annualDebtService = debt x r x (1+r)^18 / ((1+r)^18 - 1)                   // 18-yr level annuity, r = debtRate
dscr              = (annualRevenue - annualOpex) / annualDebtService
equityCF          = annualRevenue - annualOpex - annualDebtService         // flat, all 20 years
equityAmount      = capex x 35%
irr               = calcIRR([-equityAmount, equityCF x 20])  x 100         // Newton-Raphson, 200-iter cap
```
Newton-Raphson step: `r_{n+1} = r_n - NPV(r_n)/NPV'(r_n)`, where `NPV(r) = Σ CF_t/(1+r)^t` and
`NPV'(r) = -Σ t·CF_t/(1+r)^{t+1}` — this is a textbook-correct root-finder, converging to 1e-8
tolerance or 200 iterations.

**Deal Overview** (synthetic): each of 20 deals gets independently seeded `capex` ($32-828M,
derived from `capMt × ($320-720/t implied)`), `debtPct` (55-75%), `irr` (8-20%), `dscr` (1.20-2.00),
`tenor` (15-25yr) — `irr` and `dscr` here bear no computed relationship to `capex`/`debtPct`.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Opex ratio | 3.5% of capex/yr | Hard-coded assumption, plausible for a SAF plant O&M ratio but uncited |
| Debt fraction | 65% of capex | Matches the guide's "60-70% debt" framing |
| Equity fraction | 35% of capex | Complement of debt fraction |
| Debt tenor | 18 years (fixed, not user-adjustable) | Hard-coded; sits within the guide's cited "15-25yr tenor" deal range but not tied to the `tenor` field shown per deal |
| `iraCredit` (USA deals only) | `capMt x 1.45 x 264` | $1.45/gal, near the middle of the guide's cited $1.25-1.75/gal IRA §40B range, applied as a flat per-deal figure without the CI-reduction-scaled formula the companion `saf-policy-mandate` module uses |
| Newton-Raphson seed | `r_0 = 0.10` (10%) | Standard reasonable starting guess for IRR solvers |

### 7.3 Calculation walkthrough

1. **Debt service**: correct level-annuity mortgage formula, so `annualDebtService` is a genuinely
   fixed payment across the 18-year tenor covering both principal and interest at `debtRate`.
2. **DSCR**: standard project-finance ratio, `(Revenue − Opex)/DebtService`; the page also plots a
   `dscrProfile` (20 years) that **artificially inflates** DSCR over time via `dscr × (1 + yr ×
   0.012)` — a hand-tuned 1.2%/yr growth assumption representing revenue escalation or debt
   amortisation benefit, not derived from the underlying revenue/opex/debt-service calculation
   used elsewhere on the page (those three terms are held flat across all 20 years in
   `cashflowData`).
3. **Equity IRR**: cash-flow vector is `[-equityAmount, equityCF, equityCF, ..., equityCF]` (21
   entries, Y0 outflow then 20 identical inflows) — because `equityCF` is flat, this is
   mathematically an **ordinary annuity IRR**, solvable in closed form
   (`equityAmount = equityCF × [1-(1+IRR)^-20]/IRR`); using Newton-Raphson for this simple case is
   correct but more machinery than strictly necessary — it does, however, generalise correctly to
   any future non-flat cash-flow vector (e.g. price-sensitivity or debt-sensitivity sweeps at
   lines 273/294, which rebuild `cf` per scenario and re-solve).
4. **Sensitivity sweeps**: price sensitivity and debt-fraction sensitivity tabs rebuild the cash-
   flow vector at each price/debt point and re-run `calcIRR`, correctly showing how IRR responds
   nonlinearly to leverage and offtake price — this is the module's strongest analytical feature.

### 7.4 Worked example

At `capexInput=$280M`, `capMtInput=0.3 Mt/yr`, `lcoValue=$2.20/gal`, `debtRate=6.0%`:
```
annualRevenue = 0.3 x 1e6 x 2.20 x 264 / 1e6 = $174.24M/yr
annualOpex    = 280 x 0.035 = $9.8M/yr
debt          = 280 x 0.65 = $182M
r=0.06, n=18: factor = 1.06^18 = 2.8543
annualDebtService = 182 x 0.06 x 2.8543 / (2.8543-1) = 182 x 0.17126 / 1.8543 = $16.81M/yr
dscr          = (174.24 - 9.8) / 16.81 = 164.44/16.81 = 9.78x   (implausibly high — see 7.5)
equityCF      = 174.24 - 9.8 - 16.81 = $147.63M/yr
equityAmount  = 280 x 0.35 = $98M
IRR: cf = [-98, 147.63 x 20]; since equityCF > equityAmount within Year 1 alone, calcIRR converges
     to an IRR well above 100% — a red flag that the default slider inputs are not mutually
     consistent (opex ratio too low and/or offtake price too high relative to a $280M/0.3Mt plant).
```
This worked example shows a **real limitation**: the model has no cross-input plausibility
guardrails, so default or extreme slider combinations can return DSCR/IRR values no real lender or
investor would accept.

### 7.5 Data provenance & limitations

- The interactive calculator's arithmetic (annuity debt service, DSCR, Newton-Raphson equity IRR)
  is genuinely correct project-finance methodology — the strongest technical content in this
  module.
- The static 20-deal "Deal Overview" IRR/DSCR figures are synthetic and disconnected from the real
  calculator — a user comparing "deal universe" IRRs to their own scenario IRR is comparing two
  unrelated data sources.
- No plausibility bounds on default inputs (see worked example) mean the calculator can silently
  produce economically nonsensical DSCR/IRR outputs.
- `dscrProfile`'s 1.2%/yr growth assumption is decorative, not derived from the same
  revenue/opex/debt-service build used for the headline DSCR figure.

**Framework alignment:** standard project-finance DSCR/annuity mathematics (correctly implemented)
· Newton-Raphson IRR solution of `NPV(r)=0` (correctly implemented, textbook root-finding) · IRS
Notice 2023-06 §40B credit (flat $1.45/gal approximation, not CI-scaled) · NREL SAF
Techno-Economic Analysis and IFC Blended Finance Principles (named in the guide as the deal-level
benchmark; not wired into the synthetic Deal Overview universe).
