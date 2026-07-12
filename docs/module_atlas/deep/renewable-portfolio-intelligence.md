## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide describes the Efficient Frontier as a true
> Markowitz quadratic program: `min wᵀΣw s.t. w·μ = μ_target, Σw = 1`. The code does **not** solve
> a QP. `buildFrontier()` instead sweeps a single scalar `alpha` from 0→1 across 51 steps and
> applies a **hand-picked linear tilt vector** `[-1, -0.5, +1, +0.3, +0.2]` (de-weight Solar/Wind
> Onshore, over-weight Offshore Wind) to a base 20% allocation, clips each weight to [2%, 60%], and
> renormalises. This traces a plausible-looking risk/return curve but is not a solved optimisation —
> there is no guarantee the resulting portfolios are on the true efficient frontier for the given Σ.
> Everything else described below (portfolio variance, VaR, correlation matrix, DSCR, WACI) is
> implemented largely as documented.

### 7.1 What the module computes

50 (configurable 5–200) synthetic renewable assets are built across 5 technologies (Solar PV, Wind
Onshore, Wind Offshore, Hydro, Geothermal), 5 geographies, and 6 vintage years. Each asset carries
capacity, capex, capacity factor, PPA price, debt/DSCR, IRR, Scope 1 emissions, and an EU Taxonomy
alignment flag. Portfolio-level statistics are asset-revenue-weighted aggregates:

```
σ_port = √(wᵀ Σ w)                      // portfolio variance (5×5 tech covariance)
VaR₉₅  = σ_port × 1.645 × TotalRevenue
VaR₉₉  = σ_port × 2.326 × TotalRevenue
CVaR₉₅ = VaR₉₅ × 1.15 × tailMult          // tailMult user slider, default 1.5×
Sharpe = (IRR_port − 0.04) / σ_port
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Capacity factor ranges | Solar 22–30%, Wind-On 30–42%, Wind-Off 40–55%, Hydro 45–60%, Geo 85–95% | Synthetic demo, roughly consistent with IRENA/NREL published ranges cited in the guide |
| Capex/W | $0.65–$1.40/W | Synthetic demo value |
| PPA price | $35–$75/MWh | Synthetic demo value |
| Debt % | 55–75% | Synthetic demo value |
| Debt service rate | 7.5% of (capex × debt%) | Hard-coded assumption, not tied to a benchmark rate |
| EBITDA margin | 75% of revenue | Hard-coded assumption |
| Base tech correlation matrix (`BASE_CORR`) | Solar–WindOn 0.20, Solar–WindOff 0.18, WindOn–WindOff 0.55, Hydro row 0.05–0.25, Geo row 0.10–0.25 | Synthetic demo, directionally consistent with the "low solar/wind correlation" claim in the guide |
| σ per tech (`sigmas`) | `revSigma × [0.011, 0.013, 0.014, 0.008, 0.007]` | `revSigma` is a user slider (4–30%); per-tech multipliers are arbitrary relative scalars, not fitted to historical resource data |
| VaR z-scores | 1.645 (95%), 2.326 (99%) | Standard normal quantiles — correct |
| CVaR multiplier | 1.15 × tailMult | Ad hoc fat-tail adjustment, not a derived Expected Shortfall |
| EU Taxonomy Art.10 threshold | Solar/Wind ≥ 90% aligned revenue (`0.90+sr()×0.10`); Hydro/Geo 75–95% | Synthetic demo, loosely reflects that hydro/geothermal face stricter DNSH water/biodiversity screens |
| DNSH pass rate | `taxAligned × 0.95` (flat 5% haircut) | Synthetic scalar approximation — **not** a per-objective (water, biodiversity, waste, pollution, circular economy) screen despite the "5 environmental objectives" label on the page |

### 7.3 Calculation walkthrough

1. **Asset build** (`buildAssets`): each of `numAssets` gets seeded tech/geo/vintage/capacity via
   `sr(i×7+k)`; `annualRevM = capMW × cf × 8760 / 1e6 × ppaPrice`; `debtService = capex × debtPct ×
   0.075`; `ebitda = annualRevM × 1e6 × 0.75`; `dscr = ebitda / debtService`, clamped to [0.8, 3.5].
   `waci = scope1 × 1000 / annualRevM` (tCO₂e per $M revenue).
2. **Portfolio aggregation**: `totalRevM`, `totalCapexM`, `totalMW` sum across assets. `portIRR`,
   `portDSCR`, `portWACI` are each **revenue-weighted** (`Σ a.irr × a.annualRevM / Σ a.annualRevM`,
   etc.) — DSCR is nominally documented as debt-weighted but the code weights by `capex/1e6`, not
   outstanding debt.
3. **Risk**: `portW` = technology weight vector from asset counts; `sigmas` scaled by the
   `revSigma` slider; `portVar = portfolioVariance(portW, sigmas, corrMatrix)`;
   `portSigma = √portVar`; VaR/CVaR/Sharpe as in §7.1.
4. **Efficient frontier**: `buildFrontier()` produces 51 (σ, return) points via the tilt-sweep
   described in the mismatch note above — plotted against the current portfolio's own (σ, IRR).
5. **Taxonomy**: `taxAligned = Σ(a.annualRevM where a.taxAlign×100 ≥ taxThresh) / totalRevM × 100`.

### 7.4 Worked example

Take `revSigma = 12%` (default), σ vector = `[0.132, 0.156, 0.168, 0.096, 0.084]`, and an equal-ish
portfolio weight `w = [0.35, 0.25, 0.10, 0.15, 0.15]` (illustrative). Diagonal terms:
`w²σ² = 0.35²×0.132² + 0.25²×0.156² + 0.10²×0.168² + 0.15²×0.096² + 0.15²×0.084² ≈
0.00213 + 0.00152 + 0.00028 + 0.00021 + 0.00016 = 0.00430`. Off-diagonal Solar–WindOn term:
`2 × 0.35 × 0.25 × 0.132 × 0.156 × 0.20 ≈ 0.000720`. Summing all 25 terms (omitted for brevity)
gives `portVar ≈ 0.0075` → `σ_port ≈ 8.66%`. With `TotalRevenue = $400M`:
`VaR₉₅ = 0.0866 × 1.645 × 400 ≈ $57.0M`; `CVaR₉₅ = 57.0 × 1.15 × 1.5 ≈ $98.3M`.

### 7.5 Companion analytics

- **Correlation heatmap** — interactive slider lets a user override the Solar–WindOn correlation
  (`c`) and propagates `c × 0.85` to Solar–WindOff, illustrating diversification sensitivity.
- **DSCR heatmap** — flags assets < 1.15× (amber) and < 1.0× (red) against the platform's standard
  lender covenant convention.
- **SFDR PAI panel** — 5 PAI-style indicators derived algebraically from `portWACI` and
  `taxAligned` (e.g. `PAI-2 = portWACI × 0.8`, `PAI-3 = portWACI × 1.2`) rather than independently
  measured — these are **illustrative multipliers on a single WACI number**, not five distinct PAI
  calculations.
- **Cash-flow forecast** — `fundLife`-year revenue/capex projection with a flat `1 − y×0.005`
  annual decay factor (linear degradation proxy, not a technology-specific degradation curve).

### 7.6 Data provenance & limitations

- All 50 assets are synthetic, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`; capacity, price,
  and DSCR ranges are plausible but not sourced from a real project database.
- The "efficient frontier" is a **heuristic tilt sweep**, not a solved mean-variance optimisation —
  see the mismatch note. A production implementation would solve the QP via quadratic programming
  (e.g. `cvxpy`) subject to `Σw=1`, `w≥0`, and a target-return constraint.
- DNSH pass rate is a single scalar haircut, not an assessment against the EU Taxonomy's five
  distinct environmental objectives (water, biodiversity, circular economy, pollution, in addition
  to climate mitigation/adaptation).
- No actual historical return/volatility calibration — σ and correlation values are directionally
  reasonable but hand-set.

**Framework alignment:** Markowitz (1952) mean-variance framework (approximated, not solved) ·
EU Taxonomy Regulation 2020/852 Art.10 (screened as a single alignment %, not per-objective DNSH) ·
SFDR PAI Annex I (5 of 14 indicators shown, derived from one underlying WACI figure) · GHG
Protocol/TCFD for WACI.
