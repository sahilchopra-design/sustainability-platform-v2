## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-CQ1) describes a **Markowitz
> mean-variance optimizer** — "Minimize σ²(w) subject to return ≥ target, taxonomy_aligned ≥ 80%,
> duration ±0.5 yr" over 50 green bonds. **No optimizer, no covariance matrix, no quadratic solver, and
> no 50-bond universe exist in the code.** The efficient frontier (`FRONTIER`), the greenium table
> (`GREENIUM`), the 8-bond allocation (`BONDS`), the duration path (`DURATION_TARGET`) and the
> tracking-error series (`TE_DATA`) are all **hard-coded static arrays**. The single interactive element
> is a `minTaxonomy` slider that *filters* the displayed bond table (`BONDS.filter(b => b.taxonomy ≥
> minTaxonomy)`) — it does not re-optimise weights. The page is a **presentation of a pre-computed
> optimisation**, not a live one. §8 specifies the real optimiser.

### 7.1 What the module computes

Effectively nothing is *computed*; the page renders fixed datasets:

- **`FRONTIER`** — 8 (risk, retBase, retGreen) points. `retGreen` sits ~0.2–0.4 pp below `retBase` at
  every risk level, illustrating the guide's thesis that the green constraint shifts the frontier
  down/left because of the greenium (green bonds yield less).
- **`GREENIUM`** — 6 sector rows with `conventional`, `green` yields and a `greenium` in bps
  (Sovereign −13, Supranational −14, Corporate IG −17, Corporate HY −24, Utility −17, Financial −13).
- **`BONDS`** — 8 named bonds (EU Green 2032, EIB Climate 2030, Ørsted, Iberdrola, BNP, Chile, World
  Bank, Enel) with `yield`, `duration`, `taxonomy` %, `sector`, static `weight` %.
- **`DURATION_TARGET`** — 12-month portfolio vs 6.0-yr target duration path.
- **`TE_DATA`** — 12-month ex-post tracking error (0.12–0.22%).

### 7.2 Parameterisation / provenance

| Dataset | Nature | Provenance |
|---|---|---|
| `FRONTIER` retBase/retGreen | hand-authored frontier | synthetic demo value; illustrative of greenium drag |
| `GREENIUM` bps by sector | plausible sector greenia | synthetic; magnitudes consistent with ICMA/CBI ranges |
| `BONDS` weights | fixed allocation | synthetic; named real issuers, illustrative weights |
| KPI cards ("50 bonds", "−16 bps", "5.9 yrs", "89%") | string literals in JSX | synthetic display values, not derived from `BONDS` |

Note the dashboard KPI "Bond Universe: 50" is a literal string; the actual `BONDS` array has 8 rows —
a display inconsistency.

### 7.3 Calculation walkthrough

The only input→output path is the taxonomy filter: `minTaxonomy` slider → `BONDS.filter(b.taxonomy ≥
minTaxonomy)` → rendered table. Charts consume their static arrays unchanged regardless of any control.
There is no `w*` solve, no risk/return recomputation, no rebalancing.

### 7.4 Worked example

Set `minTaxonomy = 90`. The table shows only bonds with taxonomy ≥ 90: EU Green 2032 (98), EIB Climate
2030 (100), Ørsted 2031 (92), World Bank Green 2027 (100) — 4 of 8 rows. Their static weights
(8.5 + 7.2 + 5.8 + 8.8 = 30.3%) are displayed unchanged; the model does **not** renormalise weights to
100% or re-optimise, so the "portfolio" no longer sums to a full allocation. This exposes the absence of
a real optimiser: filtering breaks the weight budget silently.

### 7.5 Data provenance & limitations

- **Every quantity is a static literal** — no seeded PRNG here, but equally not market-derived. Named
  issuers are real; the yields/durations/weights/greenia are illustrative.
- No covariance estimation, no return model, no constraint solver, no turnover/transaction cost, no
  benchmark holdings behind the "tracking error".
- The taxonomy filter can produce a sub-100% displayed portfolio (§7.4).

**Framework alignment:** Markowitz Modern Portfolio Theory (the *narrative* of a frontier, not an
implemented mean-variance program); EU Taxonomy (taxonomy-alignment % per bond, the binding constraint
in the intended model). CBI "certified universe" is referenced but not enumerated in code.

## 8 · Model Specification — Constrained Green-Bond Mean-Variance Optimiser

**Status: specification — not yet implemented in code.** This is the optimiser the guide claims.

### 8.1 Purpose & scope
Given a green/GSS+ bond universe, solve for weights `w` that minimise portfolio interest-rate/credit
risk (or maximise risk-adjusted return) subject to a duration target, a minimum taxonomy-alignment
floor, and standard budget/box constraints — the decision a green-mandate fixed-income PM faces when
the greenium imposes a return give-up. Coverage: single-currency labelled-bond sleeves.

### 8.2 Conceptual approach
Use **Markowitz mean-variance optimisation on a factor-based risk model**, mirroring BlackRock Aladdin's
fixed-income optimiser and MSCI BarraOne: rather than a raw bond-return covariance (noisy, singular for
n bonds > history), decompose risk into key-rate-duration (KRD) exposures to a small set of curve factors
plus spread factors, so `Σ = B Ω Bᵀ + D` (factor loadings `B`, factor covariance `Ω`, idiosyncratic `D`).
Solve the QP with the taxonomy floor as a linear inequality. This is the industry-standard "risk model +
QP" architecture (Barra, Aladdin, Bloomberg PORT).

### 8.3 Mathematical specification
```
minimise    wᵀ Σ w − γ·(μᵀ w)                       (γ = risk-aversion; γ→0 = min-variance)
subject to  Σ w_i = 1                                (budget)
            |Dur(w) − Dur_target| ≤ 0.5              (duration band, guide: ±0.5 yr)
            Σ w_i · taxonomy_i ≥ 0.80                (EU Taxonomy floor)
            μᵀ w ≥ r_target                           (return floor)
            0 ≤ w_i ≤ w_max                           (long-only box)
where  Dur(w) = Σ w_i · Dur_i ;  Σ = B Ω Bᵀ + D
       μ_i = yield_i − greenium_i (label-adjusted expected return)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `Ω` | curve+spread factor covariance | est. from KRD factor returns (Bloomberg/ICE curves) |
| `B` | KRD & spread loadings per bond | analytics vendor / internal cash-flow model |
| `D` | idiosyncratic variance | residual of factor regression |
| `greenium_i` | label return give-up | green-bond-portfolio-analytics §8 Z-spread engine |
| `taxonomy_i` | EU Taxonomy alignment % | issuer allocation reports / EU Taxonomy screening |
| `w_max, Dur_target, γ, r_target` | policy | mandate/IPS |

### 8.4 Data requirements
Per bond: KRDs, OAS/spread duration, yield, taxonomy %, sector, issuer, liquidity. Factor history for `Ω`.
Sources: Bloomberg PORT/ICE (vendor) for analytics and curves; EU Taxonomy alignment from issuer reports
(the platform's taxonomy flags are the seed). Solver: OSQP/ECOS convex QP.

### 8.5 Validation & benchmarking plan
Reconcile optimised risk/return against Aladdin or Bloomberg PORT on the same universe; verify the QP
reproduces the true frontier by sweeping `γ`; check duration and taxonomy constraints bind exactly;
out-of-sample: compare realised TE of optimised sleeve vs benchmark to the ex-ante `√(wᵀΣw)` forecast.

### 8.6 Limitations & model risk
Factor model misspecification biases `Σ`; greenium estimates feed expected returns and dominate the
give-up conclusion. Long-only + taxonomy floor can render the QP infeasible for thin universes — fall
back to relaxing `r_target` first, then reporting the constraint that binds. Static covariance ignores
regime shifts; recalibrate `Ω` on a rolling window with shrinkage (Ledoit-Wolf).
