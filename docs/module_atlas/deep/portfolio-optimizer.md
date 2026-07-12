## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide claims a Lagrangian mean-variance optimiser
> `max[E(r) − λσ² + γ·ESG]` subject to carbon budget and `Σwᵢ=1`. **The code is not an MVO.** It is a
> **score-tilt heuristic**: each holding gets a linear composite score, weights are set proportional
> to score, then clipped to a max-position cap and renormalised. There is no covariance matrix, no
> variance term, no Lagrangian, and no quadratic program. The metrics it reports (WACI, ESG, HHI,
> SBTi %) are genuine; the "efficient frontier" uses proxy return/risk. §8 specifies the real MVO.

### 7.1 What the module computes

Real metric aggregation (`computeMetrics`) over holdings and weights:
```js
waci     = Σ (GHG_i / rev_i) · (wᵢ/100)          // Scope1+2 intensity, exposure-weighted
esgScore = Σ (esg_i || 50) · (wᵢ/100)
tRisk    = Σ (transition_i || 50) · (wᵢ/100)
sbtiPct  = sbtiCount / activeH.length · 100
hhi      = Σ (wᵢ/100)²                            // concentration (0–1)
```

The optimiser (`optimizePortfolio`) is a greedy re-weighter:
```js
score_i  = esg_i·0.4 + (1 − transition_i)·0.3 + sbtiBonus(0.2) + sizeWeight·0.1
// exclusion filters (high-carbon, min ESG, max transition) drop names → removed[]
rawWeight_i = score_i / Σscore · 100
// clip w>maxPos, redistribute excess to below-cap names ∝ their weight, renormalise to 100
```
`generateFrontier` sweeps an ESG threshold 0→100 in steps of 5, and at each step computes a
**proxy** return and risk over eligible names.

### 7.2 Parameterisation / scoring rubric

| Term | Weight / formula | Provenance |
|---|---|---|
| ESG | `esg/100 × 0.4` | heuristic tilt weight |
| Transition penalty | `(1 − transition/100) × 0.3` | heuristic tilt weight |
| SBTi bonus | `+0.2 if sbti_committed` | heuristic |
| Size | `sizeWeight × 0.1` | heuristic (exposure/market-cap share) |
| High-carbon exclusion | sector=Energy or `(S1+S2)/rev > 400` | threshold rule |
| Frontier return proxy | `esg·0.1 + (revenue/mktCap)·10` | **proxy**, not expected return |
| Frontier risk proxy | `√var(transition_risk)·0.5 + 5` | **proxy**, not portfolio volatility |
| Data source | `GLOBAL_COMPANY_MASTER` + enrichment | real curated data (not `sr()`) |

The frontier's "risk" is the cross-sectional standard deviation of `transition_risk_score`, not a
return-covariance-based volatility — so it is a dispersion proxy, not σ_portfolio.

### 7.3 Calculation walkthrough

1. Holdings enriched from the company master; `currentMetrics` computed on current weights.
2. `optimizePortfolio` scores each name, applies exclusion filters, sets score-proportional weights,
   clips to `maxSinglePosition`, redistributes excess, renormalises to 100 %.
3. Post-hoc `violations` check recomputes metrics vs constraints (max WACI, min ESG, sector caps).
4. `generateFrontier` produces 21 ESG-threshold points with proxy return/risk for the chart.

### 7.4 Worked example

Three names scored 0.72, 0.55, 0.40 (Σ=1.67), max-position cap 40 %:

| Step | Computation | Result |
|---|---|---|
| raw w₁ | 0.72/1.67·100 | 43.1 % |
| clip w₁ | >40 → 40, excess 3.1 | 40.0 % |
| w₂ raw | 0.55/1.67·100 | 32.9 % |
| w₃ raw | 0.40/1.67·100 | 24.0 % |
| redistribute 3.1 to {2,3} ∝ weight | w₂ += 3.1·32.9/56.9=1.79; w₃ += 1.31 | 34.7 %, 25.3 % |
| renormalise (Σ=100) | already ≈100 | 40.0 / 34.7 / 25.3 |

The result maximises the ESG/transition tilt, not a risk-adjusted return — a high-Sharpe name with
mediocre ESG would be down-weighted.

### 7.5 Data provenance & limitations

- **Real company data**; no `sr()` seeding. Missing fields default to 50 (ESG/transition), biasing
  scores toward neutral.
- No covariance matrix, no expected-return model, no true efficient frontier — the frontier is a
  monotone ESG-threshold sweep with proxy axes.
- HHI, WACI, sector caps and exclusions are correct and useful; the "optimisation" is a defensible
  ESG *tilt* but should not be presented as mean-variance optimal.

**Framework alignment:** Markowitz MVO (1952) — *named* but not implemented; no `−λσ²` term exists ·
MSCI ESG Integration — the tilt scoring loosely mirrors best-in-class ESG weighting · PCAF — WACI is
computed correctly for the carbon-budget constraint.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A true climate-aware mean-variance optimiser producing an efficient frontier and optimal weights
under ESG, carbon-budget, sector and position constraints — for ESG-integrated strategic allocation.

### 8.2 Conceptual approach
**Constrained quadratic programming** (Markowitz) with an ESG tilt and a hard carbon budget,
mirroring MSCI BarraOne/Aladdin optimiser workflows and BlackRock's climate-tilted MVO. Objective
maximises risk-adjusted return plus ESG utility; the frontier is traced by sweeping the risk-aversion
λ, not an ESG threshold.

### 8.3 Mathematical specification
```
maximise_w   μᵀw − λ·wᵀΣw + γ·(ESGᵀw)
subject to   1ᵀw = 1,  w ≥ 0 (or box l≤w≤u),
             CIᵀw ≤ CarbonBudget,   Sw ≤ sectorCaps,   wᵢ ≤ maxPos
frontier:    solve for a grid of λ ∈ [λ_min, λ_max]
Sharpe*      = (μᵀw − r_f) / √(wᵀΣw)
```

| Parameter | Calibration source |
|---|---|
| `μ` expected returns | factor model (e.g. Fama-French + carbon factor) or CAPM; vendor estimates |
| `Σ` covariance | shrinkage estimator (Ledoit-Wolf) on historical returns; BarraOne factor Σ |
| `ESG`, `CI` | company master ESG + PCAF intensity (already present) |
| `λ`, `γ` | risk aversion / ESG-preference; investor mandate |
| `CarbonBudget`, caps | client policy; CRREM/SBTi-aligned budget |

### 8.4 Data requirements
`historical_returns` (for Σ, μ), `esg_score`, `carbon_intensity`, `sector`, `exposure`. Sources:
price history (vendor/free — Stooq/Yahoo), platform ESG + PCAF engine, sector map. A QP solver
(OSQP/quadprog) is the missing computational piece.

### 8.5 Validation & benchmarking plan
Verify KKT optimality and `1ᵀw=1`, `w≥0`; reconcile the frontier against a reference solver on the
same inputs; benchmark optimal Sharpe against a naive risk-parity and the current score-tilt output;
stress Σ estimation (in-sample vs out-of-sample frontier stability).

### 8.6 Limitations & model risk
μ estimation error dominates MVO instability; Σ is regime-dependent; carbon-budget hard constraints
can force corner solutions. Conservative fallback: use shrinkage Σ, resampled-efficiency averaging
(Michaud), and report the frontier as a band rather than a single optimal point.
