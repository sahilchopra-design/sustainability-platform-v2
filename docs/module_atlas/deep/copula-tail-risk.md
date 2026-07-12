## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (no model behind the numbers).** The guide describes a **Copula-Based
> Multivariate VaR** engine — marginal GEV/GPD fits, copula parameter calibration (Gaussian, Student-t,
> Gumbel, Clayton), a tail-dependence coefficient `λ_U = lim P(U₂>u│U₁>u)`, and a 100,000-path Monte Carlo
> over `VaR = Q⁻¹(α, C(u₁,…,u_n; θ))`. **None of that is computed.** Every risk figure on the page — VaR
> 95/99, CVaR, tail index, tail dependence, correlation, copula log-likelihood, AIC, BIC — is a **directly
> `sr()`-seeded random number**. There is no copula, no marginal fitting, no simulation, and no
> tail-dependence estimation anywhere in the code. Additionally the guide frames this as *climate* loss
> co-dependence, but the seeded portfolios are **hedge-fund strategies** (Long/Short, Global Macro, Vol
> Arb…), not climate assets. The page is a convincing *mock-up* of a copula VaR dashboard. §8 specifies the
> real model.

### 7.1 What the module "computes"

Nothing is derived from data — the metrics are assigned:

```js
var95   = sr(i·13)·8 + 1      // 1–9 %
var99   = sr(i·17)·12 + 2     // 2–14 %
cvar95  = sr(i·19)·12 + 2     // 2–14 %
tailIndex = sr(i·31)·3 + 1
corr    = sr(i·41)·0.6 + 0.1
tailDep = sr(i·43)·0.4 + 0.05      // "tail dependence" — a random number, not λ_U
```
Copula comparison is equally synthetic:
```js
COPULA_COMPARE = COPULAS.map((c,i) ⇒ ({
  logLik: sr(i·137)·50 − 100,  aic: sr(i·139)·100 + 200,
  bic:    sr(i·143)·100 + 210, tailFit: sr(i·149)·40 + 50, corr: sr(i·151)·0.5 + 0.2 }))
```
The only *real* arithmetic is portfolio-average KPIs (`avgVaR = mean(var95)`, etc.) — averages **of
random numbers**. There is no relationship between a portfolio's `var95` and its `cvar95`, `corr`, or
`tailDep`; each is an independent draw, so e.g. CVaR < VaR can occur (a coherence violation).

### 7.2 Parameterisation / scoring rubric

| Field | Generator | Provenance |
|---|---|---|
| `var95/var99/cvar95/cvar99` | `sr(i·k)·span + floor` | Synthetic seeded PRNG (no risk model) |
| `tailIndex`, `tailDep`, `corr`, `skew`, `kurt`, `beta` | `sr()` scaled | Synthetic seeded PRNG |
| `logLik/aic/bic/tailFit` per copula | `sr()` scaled | Synthetic — no likelihood was maximised |
| `STRESS` scenarios | curated `loss/prob/recovery` + seeded `contagion/severity` | Real event names, mixed provenance |

The 8 copula families (Gaussian, Student-t, Clayton, Gumbel, Frank, Joe, BB1, BB7) are named correctly but
only as **labels** — no copula density is ever evaluated. The `STRESS` table is the one partly-real
element: named historical crises (2008 GFC −22.5%, COVID −18.3%, Tech Bubble −25.1%) with plausible
curated loss/recovery figures, augmented by seeded `contagion`/`severity`.

### 7.3 Calculation walkthrough

1. `PORTFOLIOS` (50) and `MONTHLY` (24) and `COPULA_COMPARE` (8) are all generated once from `sr()`.
2. `filtered` applies search/strategy filter and sort; `kpis` averages the seeded VaR/CVaR/tail fields.
3. Every chart (VaR trend, tail-events line, VaR-vs-return scatter, copula AIC/BIC bars, stress table)
   renders one of the pre-seeded constants. No user input changes any risk number — filters only subset.

### 7.4 Worked example

Portfolio `i = 0`: `var95 = sr(0)·8 + 1`. `sr(0) = frac(sin(1)·10⁴) = frac(8414.7) ≈ 0.71`, so
`var95 = 0.71·8 + 1 = 6.68%`. Its `cvar95 = sr(0)·12 + 2` uses the *same* `sr(0)` → `0.71·12+2 = 10.52%`
(here CVaR>VaR by luck, but for portfolios where the two seeds diverge the ordering is not guaranteed).
Its `tailDep = sr(0·43)·0.4 + 0.05 = sr(0)·0.4+0.05 = 0.334` — presented as an upper-tail-dependence
coefficient, but it is an independent random draw with no link to `corr` or the (non-existent) copula fit.

### 7.5 Companion analytics on the page

Four tabs: Risk Dashboard (KPIs, VaR/CVaR trend, strategy pie, tail-events line, VaR-return scatter),
Portfolio Analysis (sortable 50-row table + drill-down), Copula Models (AIC/BIC comparison bars,
tail-dependence display), Stress Scenarios (12 crises table with loss/prob/recovery). CSV export. No
backend engine, no route — entirely client-side seeded data.

### 7.6 Data provenance & limitations

- **All risk metrics are synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`. There is *no* copula model,
  *no* Monte Carlo, *no* marginal or tail-dependence estimation — the module is a UI shell.
- **Coherence is not guaranteed**: VaR, CVaR, correlation, and tail dependence are independent draws, so
  the usual inequalities (CVaR ≥ VaR, `λ_U` consistent with the copula family) can be violated.
- Domain mismatch: seeded portfolios are hedge-fund strategies, not the climate-loss assets the guide
  describes. The `STRESS` scenario names/losses are the only externally-grounded content.

**Framework alignment (named, not implemented):** *Sklar's theorem* and *McNeil, Frey & Embrechts (2005)*
underpin copula VaR — a copula `C` couples marginals `F_i` into a joint law; `λ_U` measures co-crash
probability (0 for Gaussian, >0 for Student-t/Gumbel). *Basel III FRTB* internal models and *EIOPA
Solvency II SCR* correlation matrices are the intended supervisory uses. The code invokes all these names
but computes none of the underlying mathematics.

---

## 8 · Model Specification — Copula-Based Multivariate Tail VaR

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Estimate portfolio tail VaR/CVaR that captures asymmetric co-dependence between asset (or climate-loss)
marginals, for ORSA/ICAAP/Solvency II SCR under stress. Coverage: any portfolio with historical marginal
losses and a definable dependence structure.

### 8.2 Conceptual approach
Two-stage **inference-functions-for-margins (IFM)** copula estimation (McNeil-Frey-Embrechts): fit heavy-
tailed marginals (GEV/GPD via peaks-over-threshold for physical losses; Student-t for financial), then fit
a copula to the probability-integral-transformed data and simulate the joint law. This is the industry
standard for tail-dependent risk (RiskMetrics, Solvency II internal models) and is what the guide describes.

### 8.3 Mathematical specification
```
Marginals:  û_{i,t} = F̂_i(x_{i,t})        (GPD tail above threshold u_i; empirical below)
Copula MLE: θ̂ = argmax Σ_t log c(û_{1,t},…,û_{n,t}; θ)      per family
Select:     min AIC/BIC across {Gaussian, t, Clayton, Gumbel, Frank, Joe, BB1, BB7}
Tail dep:   λ_U = 2 − 2^{1/θ} (Gumbel);  λ_U = 2·t_{ν+1}(−√((ν+1)(1−ρ)/(1+ρ))) (t)
Simulate:   draw U ~ Ĉ (N=100k), invert x_i = F̂_i^{-1}(U_i), L = Σ w_i x_i
VaR_α = quantile_α(L);   CVaR_α = E[L │ L > VaR_α]
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| GPD shape/scale | `ξ, β` | POT fit on historical losses (extreme-value theory) |
| Copula param | `θ` (`ρ, ν` for t) | MLE on PIT data |
| Climate co-occurrence | tail weights | NGFS/IPCC scenario joint-event probabilities |
| Simulation size | `N` | 100,000 (guide) |

### 8.4 Data requirements
Aligned marginal loss/return histories per asset; a threshold for POT; for the climate framing, NGFS/IPCC
joint hazard probabilities to augment the copula tail. The platform has none of these wired here; physical-
risk modules and NGFS scenario tables could supply climate marginals and co-occurrence weights.

### 8.5 Validation & benchmarking plan
Backtest VaR exceedances (Kupiec POF, Christoffersen independence); compare copula-selected `λ_U` against
realised joint-tail frequencies; reconcile portfolio VaR against a standalone-sum (diversification benefit
should be 15–40%, per guide). Sensitivity on threshold `u` and copula family; benchmark against RiskMetrics.

### 8.6 Limitations & model risk
Copula selection is unstable in small samples and sensitive to the marginal threshold; report a family-
ensemble VaR, not a single family. Student-t vs Gumbel choice materially changes `λ_U` — disclose it.
Climate co-occurrence weights are deeply uncertain. Conservative fallback: use the Student-t copula with a
low df (heavier joint tails) as the prudent default when family selection is ambiguous.
