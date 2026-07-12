## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a full **actuarial economic scenario
> generator (ESG)**: Vasicek/Hull-White mean-reverting interest rates, GBM equity paths, an
> intensity-based credit model, and **Cholesky-decomposition correlation** across interest
> rate/GDP/equity/credit/FX/carbon (`dX=κ(θ−X)dt+σdW`). **None of this exists in the code.** The
> module instead Monte Carlo-samples **6 independent (uncorrelated) climate-economy variables**
> (carbon price, temperature, policy timing, tech breakthrough, physical damage, asset stranding) —
> no mean reversion, no Cholesky matrix, no interest-rate/GDP/equity/credit/FX paths at all — and
> combines them via a fixed-coefficient linear sensitivity formula into a single "portfolio impact."
> This is a real, legitimate Monte Carlo engine (proper Box-Muller normal deviates, correct
> lognormal moment-matching, percentile/histogram statistics) — just not the ESG the guide describes.

### 7.1 What the module computes

For each of `numScenarios` draws (100/500/1000/5000, user-selectable), 6 variables are sampled
independently per `DEFAULT_PARAMS`:

```
carbonPrice      ~ lognormal(mean=150,  vol=80)   clamp[10,800]     USD/tCO₂e by 2030
temperature      ~ normal(mean=2.1,     vol=0.5)  clamp[1.2,4.0]    °C by 2100
policyTiming     ~ normal(mean=2028,    vol=2)    clamp[2025,2040]  year of policy shift
techBreakthrough ~ "beta"(mean=0.3,     vol=0.15) clamp[0,1]        probability
physicalDamage   ~ lognormal(mean=2.5,  vol=1.5)  clamp[0.5,12]     %GDP damage by 2050
stranding        ~ lognormal(mean=15,   vol=10)   clamp[0,50]       % fossil assets stranded by 2035

portfolioImpact = carbonImpact + tempImpact + policyImpact + techImpact + strandingImpact + physicalImpact
  carbonImpact    = −(carbonPrice/150 − 1) × 0.08
  tempImpact      = −(temperature − 1.5) × 0.03
  policyImpact    = policyTiming<2028 ? −0.05 : policyTiming>2035 ? −0.02 : −0.03
  techImpact      = techBreakthrough × 0.04
  strandingImpact = −(stranding/100) × 0.15
  physicalImpact  = −(physicalDamage/100) × 0.12
```

**Bug found while grounding this section in code:** the `'beta'` distribution branch in
`generateScenarios` is `value = config.mean + config.vol × normal()` — **byte-for-byte identical**
to the `'normal'` branch. `techBreakthrough` is labelled a Beta-distributed probability (which would
naturally bound to [0,1] and skew appropriately near the edges) but is actually drawn from a Normal
distribution and hard-clamped to [0,1], not a true Beta draw.

### 7.2 Parameterisation

| Variable | Mean | Vol | Bounds | Label vs. actual distribution |
|---|---|---|---|---|
| Carbon price | 150 | 80 | 10–800 | Lognormal — genuinely implemented via moment-matching |
| Temperature | 2.1 | 0.5 | 1.2–4.0 | Normal — genuinely implemented |
| Policy timing | 2028 | 2 | 2025–2040 | Normal — genuinely implemented |
| Tech breakthrough | 0.3 | 0.15 | 0–1 | Labelled Beta, **actually Normal** (see bug above) |
| Physical damage | 2.5 | 1.5 | 0.5–12 | Lognormal — genuinely implemented |
| Stranding | 15 | 10 | 0–50 | Lognormal — genuinely implemented |
| Impact coefficients (0.08/0.03/0.05/0.02/0.03/0.04/0.15/0.12) | fixed | — | — | Hand-tuned linear sensitivities; no cited regression/calibration source |

The lognormal transform is implemented correctly: `σ² = ln(1+(vol/mean)²)`, `μ = ln(mean) − σ²/2`,
`value = exp(μ+σ×Z)` — the standard moment-matching parameterisation that makes `E[value]=mean` and
`Var[value]≈vol²`, a textbook-correct technique (this is *not* a fabricated formula — it is the
right way to lognormal-sample given a target mean/vol).

### 7.3 Calculation walkthrough

1. **RNG** — `mulberry32(seed)` (a real, well-known 32-bit PRNG) when a scenario seed is supplied,
   else the platform's `sr()` sine-based generator via an incrementing counter (`_bmSeed`); either
   feeds a proper **Box-Muller transform** (`sqrt(-2·ln(u1))·cos(2π·u2)`) to produce standard normal
   deviates — genuinely correct Monte Carlo machinery, unlike the simpler modules in this batch.
2. **Per-scenario draw** — 6 independent variables per scenario (no cross-variable correlation is
   applied anywhere, despite the guide's Cholesky claim).
3. **Portfolio impact** — the fixed-coefficient linear combination above, computed once per scenario.
4. **Aggregation** — `kpis` (mean, stdev, percentiles via linear-interpolation `percentile()`),
   `fanData` (a 2025–2050 fan chart: `baseValue×(1+portfolioImpact×t)`, `t=(year−2025)/25` —
   i.e. impact is linearly ramped to full effect by 2050, not itself simulated as a path),
   `carbonHist`/`impactHist` (25-bin histograms), `scatterData` (temperature vs. impact vs. carbon
   price, first 2,000 scenarios), `extremes` (best/worst-N scenarios by sorted impact).

### 7.4 Worked example — deterministic mean-value scenario

Setting every variable to its `mean` (i.e. the noise-free "central" case):

| Term | Formula | Value |
|---|---|---|
| carbonImpact | `−(150/150−1)×0.08` | 0.000 |
| tempImpact | `−(2.1−1.5)×0.03` | −0.018 |
| policyImpact | `2028` is neither `<2028` nor `>2035` → else branch | −0.030 |
| techImpact | `0.3×0.04` | +0.012 |
| strandingImpact | `−(15/100)×0.15` | −0.0225 |
| physicalImpact | `−(2.5/100)×0.12` | −0.003 |
| **portfolioImpact** | sum | **−6.15%** |

**Notable model artefact:** even the "central" scenario (every variable at its stated mean) produces
a **−6.15% expected portfolio impact**, not zero. This is because the coefficient set has no
built-in neutral baseline — `policyImpact`'s three-way branch never returns 0, and the other five
terms don't null out simultaneously at their means either. A reader interpreting "mean scenario ⇒
0% impact" (the usual convention for a sensitivity/factor model) would be wrong for this module.

### 7.5 Companion analytics

- **Fan chart** — percentile bands (p5/p25/p50/p75/p95) of a stylised linearly-ramped portfolio
  value path to 2050 — a legitimate way to visualise Monte Carlo dispersion, applied to an ad-hoc
  ramp rather than a simulated time path.
- **Extremes tab** — best/worst-N scenario rows, letting a user inspect which variable combinations
  drive tail outcomes.
- **CSV export** — full scenario table with all 6 variables + impact per row.

### 7.6 Data provenance & limitations

- The 6 climate-economy variables and their means/vols are plausible order-of-magnitude figures
  (e.g. $150/tCO₂e central carbon price, 2.1°C central warming) but are not cited to NGFS Phase IV,
  IEA WEO, or any named scenario source.
- No correlation structure exists between variables — in reality carbon price, physical damage, and
  stranding are economically linked (e.g. higher carbon prices → more stranding), and treating them
  as independent understates tail co-movement risk.
- The `'beta'` distribution bug (§7.1) means `techBreakthrough` can, before clamping, draw values
  well outside a sensible probability's natural concentration — clamping to [0,1] masks but does not
  fix the underlying mis-specification.
- The linear impact-coefficient model has no cited calibration (regression, factor-loading estimate,
  or scenario-consistency check against a named framework).

**Framework alignment:** Monte Carlo / Box-Muller (genuinely, correctly implemented) · lognormal
moment-matching (genuinely, correctly implemented) · NGFS-style scenario variables (named
conceptually — carbon price, temperature, stranding — but not the NGFS's actual scenario set or
correlation structure) · Vasicek/Wilkie ESG / Cholesky correlation (named in guide, **not
implemented** — see §8).

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Deliver the actuarial-grade, correlated multi-factor economic scenario generator the guide already
claims exists — usable for Solvency II internal models, ORSA stress testing, and IFRS 17 discount-
curve projection — replacing the current 6 independent climate variables with a genuine correlated
ESG while preserving the module's already-correct Box-Muller/lognormal machinery.

### 8.2 Conceptual approach

Mirror the **Wilkie ESG model** (the actuarial-profession standard stochastic economic scenario
generator used across UK/European life insurance capital models) and the **EIOPA Solvency II
internal-model ESG calibration approach**: mean-reverting short-rate process (Vasicek/Hull-White),
equity as correlated GBM with a stochastic risk premium, and cross-variable dependence via Cholesky
decomposition of a calibrated correlation matrix — with climate variables (carbon price, physical
damage, stranding) added as *additional* correlated factors rather than replacing the core financial
variables.

### 8.3 Mathematical specification

```
Short rate (Vasicek):        dr_t = κ_r(θ_r − r_t)dt + σ_r dW_r
Equity (GBM w/ risk premium): dS_t/S_t = (r_t + λ_S)dt + σ_S dW_S
Credit spread (mean-reverting): ds_t = κ_s(θ_s − s_t)dt + σ_s dW_s
Carbon price (mean-reverting, NGFS-consistent): dc_t = κ_c(θ_c(scenario) − c_t)dt + σ_c dW_c

Correlated shocks:  [dW_r, dW_S, dW_s, dW_c, dW_temp, dW_phys]ᵀ = L·Z,   L = Cholesky(Σ)
```

| Parameter | Calibration source |
|---|---|
| Vasicek κ, θ, σ (per currency) | Central bank historical short-rate calibration (e.g. Bank of England/Fed historical yield data) |
| Equity risk premium λ_S, σ_S | Long-run equity risk premium studies (Dimson-Marsh-Staunton) |
| Correlation matrix Σ | Historical cross-asset correlation (rates/equity/credit/carbon) estimated from 10+yr data; climate variables' correlation to financial variables from NGFS scenario co-movement |
| Carbon price mean-reversion target θ_c(scenario) | NGFS Phase IV carbon price pathways per scenario |

### 8.4 Data requirements

| Field | Source | Already in platform? |
|---|---|---|
| Historical yield curves | Central bank published data (free) | No |
| Equity index history | Public index providers (free, delayed) | Partial (other modules) |
| Credit spread history | ICE BofA indices (free via FRED) | No |
| NGFS carbon price pathways | NGFS Scenario Explorer (free) | Partial — referenced in other modules |

### 8.5 Validation & benchmarking plan

- Reconcile simulated rate paths' unconditional mean/vol against Vasicek's known closed-form moments.
- Backtest correlation matrix stability via rolling-window re-estimation; compare simulated vs.
  historical cross-asset correlation.
- Cross-check carbon price paths against NGFS Scenario Explorer's own percentile bands per scenario.

### 8.6 Limitations & model risk

- Vasicek allows negative rates without a floor — decide policy per currency regime.
- A single static correlation matrix understates regime-dependent correlation (e.g. equity-credit
  correlation spikes in stress) — consider a regime-switching or DCC-GARCH extension for tail
  scenarios.
- Fix the current `'beta'`-mislabelled-as-normal bug before any recalibration, since a true Beta
  draw for `techBreakthrough` changes its tail shape materially near 0 and 1.
