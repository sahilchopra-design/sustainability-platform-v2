## 7 · Methodology Deep Dive

This module implements a **genuinely correct GEV (Generalized Extreme Value) probability density
function**, interactively parameterised by an adjustable shape parameter — closer to the guide's
cited formula than most modules in this batch. The gap: the guide's GEV formula is the **CDF**
`G(z)=exp(-(1+ξ(z-μ)/σ)^(-1/ξ))`, but the code's paired `cdf` field uses a **different, Weibull-style
functional form** disconnected from the correctly-implemented PDF — an internal inconsistency, not a
guide↔code mismatch requiring the full blockquote treatment, since the core density function is real.
All downstream tables (loss exceedance, systemic contribution, insurance gap) are static reference
data, not derived from the GEV fit.

### 7.1 What the module computes

```js
function gevPdf(x, mu, sigma, xi) {
  const t = 1 + xi * ((x - mu) / sigma);
  if (t <= 0) return 0;
  const expTerm = Math.pow(t, -1 / xi);
  return (1 / sigma) * Math.pow(t, -1 - 1/xi) * Math.exp(-expTerm);
}
```

This is the **textbook GEV density function** — `f(x;μ,σ,ξ) = (1/σ)·t^(-1-1/ξ)·exp(-t^(-1/ξ))`,
`t = 1+ξ(x-μ)/σ`, with the correct support guard (`t≤0 → 0`, since the GEV distribution has bounded
or unbounded support depending on the sign of `ξ`). This exactly matches Fisher-Tippett-Gnedenko GEV
theory as used in climate/financial extreme-value literature (Coles 2001, *An Introduction to
Statistical Modeling of Extreme Values*). The location `μ=15`, scale `σ=8`, and an interactively
adjustable shape `ξ` (default 0.25, user slider) parameterise the fitted density shown in the
"Extreme Value Theory" tab.

### 7.2 The CDF inconsistency

```js
EVT_DATA[i].cdf = 1 − exp(−(x/15)^1.3)          // static, computed once at module load
```

This is a **Weibull-form CDF** (`1-exp(-(x/scale)^shape)`), unrelated to the GEV CDF the `gevPdf`
function's own math implies (`exp(-(1+ξ(x-μ)/σ)^(-1/ξ))`). The two curves shown side-by-side on the
Tail Distribution Dashboard (PDF from `gevPdf`, CDF from the Weibull formula) are therefore **not
integrals/derivatives of each other** — a real EVT analysis would derive the CDF by integrating the
fitted PDF (or equivalently apply the GEV CDF formula with the same μ/σ/ξ), not swap in an unrelated
distribution family.

### 7.3 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| μ (location) | 15 | Fixed constant, not fitted to data |
| σ (scale) | 8 | Fixed constant, not fitted to data |
| ξ (shape) | 0.25 default, user-adjustable slider | ξ>0 → Fréchet-type (heavy tail, consistent with climate/financial extreme losses); reasonable qualitative choice |
| Loss exceedance curve | 10yr:2.8% → 1000yr:45.5% | Static hand-typed table, not generated from `gevPdf`/return-period inversion |
| Black swan probabilities | 2–8%/yr | Static, individually assigned per scenario (not derived from the GEV tail) |

### 7.4 Calculation walkthrough

1. **GEV fit tab** — `evtFitted` recomputes `gevPdf(x,15,8,evtShape)` for 200 x-values (0.5 to 100.5)
   whenever the user moves the shape-parameter slider — a genuine, live re-evaluation of the density
   function, correctly memoised on `[evtShape]`.
2. **Loss Exceedance tab** — `LOSS_EXCEEDANCE` (10yr→1000yr, loss 2.8%→45.5%) is a static table;
   `returnPeriod(probability) = 1/probability` is defined but this helper is not shown being applied
   to derive the table from `gevPdf` — the return-period/loss pairs are typed in directly rather than
   solved from the fitted distribution's inverse CDF (quantile function).
3. **Black Swan Scenarios tab** — 5 real IPCC AR6 tipping elements (methane clathrate, AMOC shutdown,
   permafrost cascade, multi-breadbasket failure, Antarctic ice collapse) each with a static
   probability/portfolio-impact pair and named hedging instruments — descriptive scenario cards, not
   computed from the GEV fit.
4. **Systemic Risk Contribution tab** — `SYSTEMIC_CONTRIB` presents `margES` (marginal Expected
   Shortfall), `compES` (component ES), and `systemic` (= margES−compES, a genuine risk-decomposition
   identity when marginal and component ES are properly computed) per sector — but all three columns
   are static literals, not derived from any portfolio return series or the GEV tail model.
5. **Insurance Implications tab** — `insuranceData` (Flood/Wildfire/Hurricane/Drought/Heat Wave)
   compares insured vs. economic loss with a computed `gapPct = gap/economicLoss×100` per peril
   (correct arithmetic on static inputs), consistent in magnitude with published Swiss Re/Munich Re
   protection-gap estimates.

### 7.5 Worked example

At `x=15` (the GEV's location parameter, `ξ=0.25`, `σ=8`): `t = 1+0.25×(15-15)/8 = 1.0`. `expTerm =
1.0^(-1/0.25) = 1.0^-4 = 1.0`. `pdf = (1/8)×1.0^(-1-4)×exp(-1.0) = 0.125×1×0.3679 ≈ 0.046`. At
`x=45.5` (the value the header pill calls "1000yr Loss"): `t = 1+0.25×(45.5-15)/8 = 1+0.25×3.8125 =
1.953`. `expTerm = 1.953^-4 ≈ 0.0688`. `pdf = (1/8)×1.953^(-5)×exp(-0.0688) ≈ 0.125×0.0352×0.9335 ≈
0.0041` — a much lower density at the extreme tail, correctly reflecting that a 45.5% loss is a rare
event under this fitted distribution. However, this PDF value at x=45.5 is never actually used to
*validate* the static "1000yr Loss = 45.5%" figure shown in the header pill — the two numbers
coexist without a demonstrated quantile-function link (`gevPdf` integrated/inverted to solve for the
x at which `P(X>x)=0.001` should reproduce 45.5%, but this derivation is not shown in code).

### 7.6 Data provenance & limitations

- **The GEV PDF math is genuinely correct** and interactively explorable — a stronger foundation than
  most "tail risk" displays elsewhere in the platform.
- **The paired CDF, loss-exceedance table, black-swan probabilities, systemic-contribution figures,
  and insurance-gap data are all static/hand-authored**, not derived from the GEV fit — despite being
  presented as a unified EVT analysis.
- μ=15, σ=8 location/scale are fixed constants, not fitted via maximum-likelihood or L-moments to any
  actual loss dataset — a production EVT tool would fit these from historical tail observations.

**Framework alignment:** EVT/GEV theory (Coles 2001; Lenton et al. 2019 for tipping-cascade framing)
is genuinely represented in the PDF formula. IPCC AR6 Chapter 4 tipping elements are accurately named
in the Black Swan scenarios. Swiss Re-style protection-gap analysis is correctly structured (insured
vs. economic loss, gap %) even though the underlying figures are illustrative rather than sourced
from a named Swiss Re sigma report.
