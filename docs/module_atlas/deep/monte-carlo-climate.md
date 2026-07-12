## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The guide states "Four correlated random variables
> drawn via Cholesky decomposition" over carbon price, GDP, energy price, and technology cost. **The
> page simulates only ONE variable at a time** (whichever is selected in the `variable` dropdown);
> the 4×4 `CORR_MATRIX` is displayed as a static reference table on the Correlation Matrix tab but is
> never Cholesky-decomposed or applied to jointly simulate the four variables — cross-variable
> correlation is instead approximated by a single manual `corrAdj` scalar (0.5×–2.0×) that uniformly
> scales the volatility term. Everything else — the Box-Muller transform, percentile-based VaR/CVaR/
> ES, the fan chart, and the sensitivity sweep — is genuinely and correctly implemented. This module
> does NOT call the backend `monte_carlo_engine.py` (a separately real, Vasicek/NGFS-calibrated
> engine — see `monte-carlo-var.md` for where that backend's true JS counterpart lives).

### 7.1 What the module computes

A single-variable, multi-path random walk with drift, using a deterministic Box-Muller transform
seeded by the platform's `sr()` PRNG:

```js
boxMuller() = sqrt(-2·ln(u1)) · cos(2π·u2)                    // u1,u2 from sequential sr() draws
shock  = boxMuller() × (dist.vol/100) × corrAdj + (dist.mean/100)/horizon
cumReturn += shock                                              // per year, accumulated over `horizon`
annualVals = [cumReturn×100 for each of nPaths simulated paths], sorted ascending

var95   = annualVals[floor(nPaths×0.05)]
var99   = annualVals[floor(nPaths×0.01)]
cvar995 = mean(annualVals[0 : floor(nPaths×0.005)])            // average of worst 0.5% outcomes
es      = mean(annualVals[0 : floor(nPaths×0.05)])             // average of worst 5% (Expected Shortfall)
```

### 7.2 Parameterisation

| Variable | Mean / Vol / Skew | Provenance |
|---|---|---|
| Carbon Price | 85 / 42 / +0.35 | Labelled "NGFS Phase 5 Distributions" in the guide; plausible order-of-magnitude for a 2050 carbon-price endpoint but not traceable to a specific NGFS scenario output table in this file |
| GDP Shock | −2.1 / 3.8 / −0.6 | Negative skew (left-tail risk) is a reasonable qualitative choice for climate-transition GDP shocks |
| Energy Price Change | 18 / 28 / +0.45 | Illustrative |
| Tech Cost Reduction | −35 / 15 / −0.25 | Illustrative — negative mean encodes expected cost decline |
| `CORR_MATRIX` (4×4) | e.g. Carbon×GDP = −0.42, Carbon×Energy = +0.65 | Directionally sensible signs (carbon price up ↔ GDP down; carbon price up ↔ energy price up) but **never consumed by the simulation** |
| `corrAdj` slider | 0.5×–2.0×, manual | Stand-in for the correlation matrix's effect — a single scalar cannot reproduce a 4-variable correlation structure |

Note: `skew` is defined per variable but never referenced anywhere in `simulatePaths` — the
Box-Muller draw is symmetric (standard normal), so the stated skew parameters have no effect on the
simulated distribution despite being displayed as if they shape it.

### 7.3 Calculation walkthrough

1. **Simulation Dashboard** — `sim = simulatePaths(min(nPaths,2000), horizon, dist, corrAdj)`; note
   the page silently **caps simulated paths at 2,000** even if the user sets `nPaths` higher (e.g. the
   default 5,000 shown in the header `Pill` is the *requested* count, not necessarily the *simulated*
   count).
2. **Fan Chart** — `buildFanChart` computes p5/p25/p50/p75/p95 at each year across all simulated
   paths — genuine cross-path percentile banding.
3. **Tail Risk Analysis** — 50-bin histogram of `annualVals`, with bins left of `var95` flagged
   `isLeftTail` for red-shading.
4. **Correlation Matrix tab** — renders `CORR_MATRIX` as a static heat-table; informational only, per
   §7.1.
5. **Parameter Sensitivity** — re-runs `simulatePaths(500, horizon, {...dist, vol: dist.vol×mult},
   corrAdj)` for 7 volatility multipliers (50%–200%), producing a genuine sensitivity table of how
   VaR95/VaR99/ES scale with volatility.
6. **Path Explorer** — renders the first 20 of the simulated paths as line traces.

### 7.4 Worked example

For `variable='carbon_price'` (mean=85, vol=42), `horizon=30`, `corrAdj=1.0`, seed reset to 42 each
run: `_mc_idx` starts at 42. First shock: `u1=sr(42)`, `u2=sr(43)`. `sr(42)=frac(sin(43)×10⁴)`.
`sin(43 rad) ≈ 0.5306` → `x=5306.35` → `sr(42)≈0.353`. `sr(43)=frac(sin(44)×10⁴)`; `sin(44)≈0.0177`→
`x≈176.6`→`sr(43)≈0.628`. `boxMuller = sqrt(-2·ln(0.353))·cos(2π·0.628) = sqrt(2.081)·cos(3.945) ≈
1.443×(−0.694) ≈ −1.001`. `shock = −1.001×(42/100)×1.0 + (85/100)/30 = −0.4204 + 0.0283 = −0.392`.
This is year-1's cumulative return contribution (−39.2 percentage points on a scale where the terminal
value is `cumReturn×100`) — illustrating how a single large negative Box-Muller draw can dominate an
early simulation year before mean-reversion (there is none — this is a pure random walk) evens out
over 30 years.

### 7.5 Data provenance & limitations

- **Single-variable simulation, not the stated 4-variable correlated system** — the most consequential
  finding: results for "Carbon Price" risk do not reflect its stated negative correlation with GDP or
  positive correlation with energy prices; switching the `variable` dropdown runs an entirely
  independent simulation with no cross-variable consistency.
- **`skew` parameters are decorative** — displayed in `NGFS_DIST` but not used by the symmetric
  Box-Muller draw.
- **Silent path-count cap** (2,000 even when `nPaths=5,000` requested) could mislead a user comparing
  displayed "Paths: 5,000" against the actual (smaller) sample the percentiles are computed from.
- This is a pure random-walk (no mean reversion, no jump-diffusion) — reasonable for a first-order
  approximation of long-run scenario uncertainty but not a full NGFS-scenario stochastic process
  model.
- Does not call the backend `monte_carlo_engine.py`; the correlated, multi-asset, Vasicek-VaR version
  of this concept genuinely exists in `monte-carlo-var`'s client-side engine (11-sector Cholesky) —
  see that module's deep dive.

**Framework alignment:** NGFS scenario distributions (named, parameter magnitudes plausible, not
traceable to a specific NGFS output vintage) · Box-Muller normal transform (correctly implemented) ·
Standard VaR/CVaR/Expected-Shortfall percentile definitions (correctly implemented) · IMF GDP shock
distributions (named in guide references, not directly sourced in code).
