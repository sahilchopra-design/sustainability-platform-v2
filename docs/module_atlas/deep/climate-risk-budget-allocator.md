## 7 · Methodology Deep Dive

The guide describes **Marginal Contribution to Climate VaR** (`MC-CVaR = ∂CVaR_p/∂w_i`). The code *does*
implement a recognisable marginal-risk-contribution decomposition and a factor-attribution model — the
mathematical skeleton is real Euler-allocation. What is synthetic is every input: asset betas, VaRs,
factor variances and the correlation structure are all `sr()` seeded, and the "Climate VaR" itself is a
random draw, not a scenario-loss estimate.

### 7.1 What the module computes

Each asset carries seeded climate betas and a total climate VaR:
```js
carbonBeta = sr(i·13+3)·1.5 − 0.5   greenBeta = sr(i·17+4)·1.5 − 0.5
physBeta   = sr(i·19+5)·1.2 − 0.2   transBeta = sr(i·23+6)·1.5 − 0.5
totalVaR   = sr(i·29+7)·800 + 100    physVaR = totalVaR·(sr(i·31+8)·0.4+0.1);  transVaR = totalVaR − physVaR
```
Marginal risk contribution (Euler allocation form) uses asset vols and normalised weights:
```js
assetVols[i] = ASSETS[i].totalClimateVaR / 10000
pVol         = portfolioVaR / 10000
covar(i,j)   = corr·assetVols[i]·assetVols[j]·10000
joint(i,j)   = w_i·w_j·covar·2
```
Factor attribution splits each asset's VaR across carbon/green/physical/transition + idiosyncratic:
```js
idio = normalizedWeights[i]·a.totalClimateVaR·0.3
// contributions per factor = f(betas, factor variance)
pct  = total_factor / grandTotal · 100
```
Budget utilisation and hedging:
```js
budgetUtilization = totalBudgetUsed/totalBudget·100
netBenefit(hedge) = (varBefore − varAfter) − costBps,  varAfter = varBefore·(1 − riskReduction/100)
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Generation | Provenance |
|---|---|---|
| Asset betas (carbon/green/phys/trans) | `sr()·range − offset` | synthetic demo value |
| `totalVaR` | `sr(i·29+7)·800+100` (100–900) | synthetic demo value |
| `FACTOR_VARIANCE` | `sr(i·17+5)·0.04+0.01` | synthetic demo value |
| `idio` weight | fixed `0.3` (30% idiosyncratic) | heuristic |
| `eigenvalues` (PCA display) | `sr(i·17+99)·3+0.1`, sorted desc | synthetic demo value |
| Hedge `riskReduction`, `optimalHedgeRatio` | `sr()` seeded | synthetic demo value |

The mathematical **forms** (Euler MRC, weighted-covariance portfolio vol, factor Σβ·contribution) are
standard; only the numbers are demo.

### 7.3 Calculation walkthrough

Weights are normalised (`normalizedWeights`) → portfolio vol from weighted covariance → per-asset marginal
contribution `mrc` → `totalBudgetUsed = Σ mrc`, `budgetUtilization` vs `totalBudget`. `factorAttribution`
projects each asset's VaR onto the four climate factors plus idiosyncratic; `pctOfTotal` and `grandTotal`
give the budget pie. Hedging tab ranks assets by `netBenefit`. Sensitivity tab perturbs weights (`delta`)
and reports `impactPls`.

### 7.4 Worked example

Two-asset slice: `w = [0.6, 0.4]`, `assetVol = [0.05, 0.03]` (i.e. totalClimateVaR 500 and 300),
`corr = 0.5`:

| Step | Computation | Result |
|---|---|---|
| Var contribution A (own) | 0.6²·0.05² | 0.00090 |
| Var contribution B (own) | 0.4²·0.03² | 0.000144 |
| Joint | 0.6·0.4·(0.5·0.05·0.03)·2 | 0.00036 |
| Portfolio var | sum | 0.001404 |
| Portfolio vol | √0.001404 | **0.03747** |
| MRC_A ≈ w_A·(∂σ/∂w_A) | (0.6·0.05² + 0.24·0.5·0.05·0.03)/0.03747·0.6 | ≈ **0.0195** |

Asset A, though only 60% weight, consumes the larger share of risk budget because of its higher vol and
positive correlation — the concentration signal the allocator is built to flag.

### 7.5 Data provenance & limitations

- **Every input synthetic** (`sr()` PRNG): betas, VaRs, correlations, eigenvalues, hedge parameters.
- "Climate VaR" is a random scalar `100–900`, not a scenario-conditioned loss quantile; the physical/
  transition split is a random fraction. So the decomposition is structurally correct but numerically
  illustrative.
- Correlation matrix and factor variances are seeded independently of the betas, so factor attribution and
  covariance risk are not internally consistent with a single generating model.
- The four `climate_risk` assessment endpoints exist but are not the source of these numbers.

**Framework alignment:** Euler/marginal risk-contribution allocation (RiskMetrics, standard risk-budgeting)
· MSCI Climate VaR as the CVaR concept the module visualises · TCFD scenario-analysis framing · BoE CBES
as the supervisory budgeting context.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Allocate a portfolio's climate-risk budget across positions/sectors by their
marginal contribution to a *properly estimated* Climate VaR, and flag breaches of budget limits.

**8.2 Conceptual approach.** Climate VaR from a **scenario-loss distribution** (MSCI Climate VaR / Aladdin
Climate transition-repricing) feeding an **Euler risk-contribution** allocation (standard risk-budgeting,
RiskMetrics). Factor structure from a climate risk-factor model (carbon, green, physical, transition) à la
Goldman Marquee / Barra climate factors.

**8.3 Mathematical specification.**
```
Asset climate P&L: r_i = α_i + Σ_f β_if · F_f + ε_i
CVaR_p = −quantile_5%( Σ_i w_i·r_i )   from scenario-simulated F_f and ε_i
MC-CVaR_i = w_i · ∂CVaR_p/∂w_i = w_i · E[ r_i | Σ w_i r_i = −CVaR_p ]   (Euler)
Σ_i MC-CVaR_i = CVaR_p          (full allocation)
BudgetUtil_i = MC-CVaR_i / Limit_i
```

| Parameter | Source |
|---|---|
| Factor loadings β_if | regression on carbon/green/physical/transition factor returns |
| Factor covariance Σ_F | NGFS-scenario simulated factor paths |
| Idiosyncratic σ_ε | residual variance from factor regression |
| Scenario distribution | NGFS Phase IV + MSCI Climate VaR damage functions |

**8.4 Data requirements.** Position weights, sector/geo tags, carbon intensity, physical hazard exposure;
factor returns (built from platform `climate-risk-premium`, `climate-stress-test`); NGFS variables
(migration 088). Vendor: MSCI Climate VaR, Aladdin; free: NGFS database.

**8.5 Validation & benchmarking.** Check Σ MC = CVaR (Euler identity); backtest CVaR exceedances; reconcile
against MSCI Climate VaR for overlapping names; stability of allocation under weight perturbation.

**8.6 Limitations & model risk.** Climate-factor returns are short/noisy; tail estimation unstable at 5%
with few scenarios; correlation regime-dependent. Fallback: parametric Gaussian CVaR with shrinkage
covariance when scenario simulation is unavailable.
