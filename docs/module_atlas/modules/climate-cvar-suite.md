# Climate Conditional Value-at-Risk Suite
**Module ID:** `climate-cvar-suite` · **Route:** `/climate-cvar-suite` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted Conditional Value-at-Risk (CVaR) engine for portfolio risk management. Integrates physical and transition scenario losses into tail risk metrics using NGFS scenario set, Expected Shortfall methodology, and climate factor augmented Monte Carlo simulation.

> **Business value:** Climate CVaR augments standard VaR/ES with NGFS scenario losses. Probability-weighted across 5 scenarios. Physical risk dominates tail in RCP8.5 late-century; transition risk dominates under disorderly 1.5°C.

**How an analyst works this module:**
- Select portfolio and confidence level (95% or 99%)
- Scenario Weights tab sets NGFS scenario probability distribution
- Monte Carlo tab runs climate-augmented simulation
- CVaR Decomposition shows physical vs transition contribution
- Sensitivity tab tests CVaR to carbon price and warming assumptions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `BACKTEST_DATA`, `Badge`, `Btn`, `COPULA_PARAMS`, `COPULA_TYPES`, `CVAR_PARAMS`, `DEFAULT_WEIGHTS`, `EFFICIENT_FRONTIER`, `FACTORS`, `FACTOR_RETURNS`, `HORIZONS`, `KpiCard`, `MONTHS`, `NGFS_SCENARIOS`, `PHYS_SOURCES`, `SectionHeader`, `Sel`, `TABS`, `TRANS_SOURCES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NGFS_SCENARIOS` | 7 | `name`, `physMult`, `transMult`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COPULA_TYPES` | `['Gaussian', 'Student-t', 'Clayton'];` |
| `seed` | `ai * 200 + si * 40 + hi * 10;` |
| `basePhys` | `0.03 + sr(seed + 1) * 0.18;` |
| `baseTrans` | `0.02 + sr(seed + 2) * 0.22;` |
| `hrScale` | `1 + hi * 0.25;` |
| `physCVaR95` | `basePhys  * sc.physMult  * hrScale;` |
| `physCVaR99` | `physCVaR95  * (1.25 + sr(seed + 3) * 0.3);` |
| `transCVaR95` | `baseTrans * sc.transMult * hrScale;` |
| `transCVaR99` | `transCVaR95 * (1.20 + sr(seed + 4) * 0.3);` |
| `correlation` | `0.1 + sr(seed + 5) * 0.5;` |
| `combinedCVaR95` | `Math.sqrt(physCVaR95 ** 2 + transCVaR95 ** 2 + 2 * correlation * physCVaR95 * transCVaR95);` |
| `combinedCVaR99` | `Math.sqrt(physCVaR99 ** 2 + transCVaR99 ** 2 + 2 * correlation * physCVaR99 * transCVaR99);` |
| `esValue` | `combinedCVaR99 * (1.15 + sr(seed + 9) * 0.20);` |
| `gpdTailIndex` | `0.10 + sr(seed + 10) * 0.35;` |
| `tailDepCoeff` | `0.05 + sr(seed + 11) * 0.55;` |
| `flPhysAcute` | `0.10 + sr(seed + 12) * 0.60;` |
| `flPhysChronic` | `0.05 + sr(seed + 13) * 0.45;` |
| `flTransPolicy` | `0.08 + sr(seed + 14) * 0.55;` |
| `flTransTech` | `0.04 + sr(seed + 15) * 0.40;` |
| `ciHalfWidth` | `combinedCVaR95 * 0.15 * sr(seed + 8);` |
| `var95` | `-(0.04 + sr(i * 7 + 1) * 0.06);` |
| `pnl` | `-(sr(i * 7 + 2) * 0.12);` |
| `FACTOR_RETURNS` | `FACTORS.map((f, fi) =>` |
| `pct` | `v => `${(v * 100).toFixed(2)}%`;` |
| `weightTotal` | `weights.reduce((a, b) => a + b, 0);` |
| `wNorm` | `weights.map(w => (weightTotal > 0 ? w / weightTotal : 1 / 8));` |
| `sumStandaloneCVaR95` | `useMemo(() => ASSET_CLASSES.reduce((sum, _, ai) => { const p = filteredParams.find(x => x.assetIdx === ai);` |
| `divBenefit` | `Math.max(0, sumStandaloneCVaR95 - portfolioCVaR95 * 0.82);` |
| `total` | `weights.reduce((a, b) => a + b, 0);` |
| `sigma` | `cvar / 2.33;` |
| `loss` | `-0.30 + i * 0.015;` |
| `normalFreq` | `Math.exp(-0.5 * z * z) / ((sigma \|\| 0.01) * Math.sqrt(2 * Math.PI)) * 15;` |
| `tFreq` | `Math.pow(1 + z * z / df, -(df + 1) / 2) / (Math.sqrt(df) * 1.2) * 15;` |
| `excess` | `Math.max(0, -loss - cvar * 0.5);` |
| `scenarioBarData` | `NGFS_SCENARIOS.map(sc => {` |
| `cvar95` | `ps.length ? ps.reduce((s, p) => s + p.combinedCVaR95 * wNorm[p.assetIdx], 0) : 0;` |
| `cvar99` | `ps.length ? ps.reduce((s, p) => s + p.combinedCVaR99 * wNorm[p.assetIdx], 0) : 0;` |
| `mktCVaR` | `cvar95 * (0.4 + sr(sc.id * 17) * 0.3);` |
| `c95` | `ps.length ? +( ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR95, 0) * 100).toFixed(2) : 0;` |
| `c99` | `ps.length ? +( ps.reduce((s, p) => s + wNorm[p.assetIdx] * p.combinedCVaR99, 0) * 100).toFixed(2) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSET_CLASSES`, `COPULA_TYPES`, `CVAR_PARAMS`, `DEFAULT_WEIGHTS`, `FACTORS`, `HORIZONS`, `MONTHS`, `NGFS_SCENARIOS`, `PHYS_SOURCES`, `RENDERERS`, `TABS`, `TRANS_SOURCES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate CVaR (95%) | `E[Loss|Loss>VaR_95] × π_s` | Monte Carlo + NGFS | Expected portfolio loss in worst 5% of outcomes under climate scenarios |
| Physical Risk Contribution | `Physical factor share of tail loss` | Model decomposition | Fraction of climate CVaR attributable to physical hazard factors |
| Transition Risk Contribution | `Transition factor share of tail loss` | Model decomposition | Fraction of climate CVaR attributable to transition risk factors |
| Scenario Probability Weights | `NGFS likelihood assessment` | NGFS Phase 5 | Probability assigned to each of 5 NGFS climate scenarios |
- **NGFS scenario database** → Carbon price + warming trajectories → risk factors → **Climate scenario loss factors**
- **Portfolio return data** → Historical covariance + climate factor loading → Monte Carlo → **Climate-adjusted tail loss distribution**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-augmented CVaR via scenario-weighted Expected Shortfall
**Headline formula:** `CVaR_climate(q) = E[Loss | Loss > VaR_q] weighted by π_s for s ∈ {NGFS scenarios}; π_s from scenario probability weights`

Standard CVaR at 95th percentile augmented with climate scenario losses. Monte Carlo draws from multi-factor return distribution augmented by physical (heat, flood, wildfire) and transition (carbon price, stranded asset) risk factors. Scenario probability weights (π_s) applied per NGFS likelihood assessment. Climate CVaR = probability-weighted average loss in tail conditional on climate scenario realisation.

**Standards:** ['NGFS Phase 5 Scenarios', 'BCBS d532', 'ECB Climate Stress Test', 'Basel III CVaR Framework']
**Reference documents:** NGFS Phase 5 Climate Scenarios; BCBS d532 Climate-Related Financial Risk Principles; ECB Climate Stress Test Methodology 2022; Basel III Expected Shortfall (CVaR) Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The MODULE_GUIDES entry frames this as a *Monte-Carlo
> Expected-Shortfall* engine: "Monte Carlo draws from a multi-factor return distribution",
> "CVaR = E[Loss | Loss > VaR_q] weighted by π_s scenario probabilities". **There is no Monte-Carlo
> simulation and no scenario-probability weighting in the code.** The base CVaR magnitudes are
> `sr()`-seeded constants; on top of them the module applies a *real closed-form correlation
> aggregation* (`√(phys² + trans² + 2ρ·phys·trans)`), a weighted portfolio roll-up, an
> Euler-style diversification benefit, and NGFS scenario/horizon scaling. So the **aggregation maths
> is genuine; the underlying loss inputs are synthetic**, and the "Monte Carlo" / copula tabs are
> parameter displays, not simulations.

### 7.1 What the module computes

A 192-row parameter cube (`CVAR_PARAMS` = 8 asset classes × 6 NGFS scenarios × 4 horizons). Per cell:

```
basePhys   = 0.03 + sr(seed+1)×0.18            (seeded)
baseTrans  = 0.02 + sr(seed+2)×0.22            (seeded)
hrScale    = 1 + horizonIdx × 0.25             (horizon amplification)
physCVaR95 = basePhys  × scenario.physMult × hrScale
transCVaR95= baseTrans × scenario.transMult × hrScale
combinedCVaR95 = √( physCVaR95² + transCVaR95² + 2·ρ·physCVaR95·transCVaR95 )
combinedCVaR99 = √( physCVaR99² + transCVaR99² + 2·ρ·physCVaR99·transCVaR99 )
```

The **combination formula is a correct variance-covariance aggregation** of two risk factors with
correlation ρ — the same closed form used for two-asset volatility. The 95→99 step scales by a
seeded `1.20–1.55` factor (a proxy for the tail ratio between the two quantiles).

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| `NGFS_SCENARIOS.physMult` | 0.8 (NZ2050) → 2.4 (Hot House) | NGFS-consistent: physical worst in hot-house |
| `NGFS_SCENARIOS.transMult` | 0.6 (Hot House) → 1.4 (Delayed) | Transition worst in disorderly/delayed |
| `hrScale` | +25 % per horizon step (2030→2050) | Design amplification |
| ρ (correlation) | `0.1 + sr(seed+5)×0.5` | **Seeded** phys/trans correlation |
| `divBenefit` factor | 0.82 | Hard-coded diversification scalar |
| `sigma = cvar/2.33` | inverts N⁻¹(99 %)=2.33 | Normal-quantile back-out |
| `COPULA_PARAMS` (Gaussian/t/Clayton) | df, θ, corr matrix | **Seeded** display parameters |
| base CVaR, ES, tail index, factor loadings | `0.0x + sr()×0.xx` | **All seeded** |

### 7.3 Calculation walkthrough

1. Build the 192-cell cube (§7.1); filter by selected scenario/horizon.
2. Normalise user asset weights: `wNorm_i = w_i / Σw` (or 1/8 if all zero).
3. **Portfolio CVaR** = `Σ_i wNorm_i × combinedCVaR95_i` — a weighted sum of per-asset combined CVaRs
   (note: a linear weighted sum, which *ignores* cross-asset correlation, so it is conservative /
   sub-additive-violating relative to a true portfolio ES).
4. **Diversification benefit** = `max(0, ΣStandalone − portfolioCVaR95 × 0.82)`.
5. **Back-test** (24 months): `exception = pnl < var95`, counting Kupiec-style breaches (both series
   seeded).
6. Copula/frontier/factor tabs display seeded parameters and a seeded efficient frontier.

### 7.4 Worked example — one cell's combined CVaR

Cell: Listed Equity, Delayed scenario (`physMult 1.1`, `transMult 1.4`), horizon 2040
(`horizonIdx 2` → `hrScale 1.5`). Suppose `basePhys = 0.10`, `baseTrans = 0.12`, `ρ = 0.35`:

| Step | Computation | Result |
|---|---|---|
| physCVaR95 | 0.10 × 1.1 × 1.5 | 0.165 |
| transCVaR95 | 0.12 × 1.4 × 1.5 | 0.252 |
| combinedCVaR95 | √(0.165² + 0.252² + 2×0.35×0.165×0.252) | √(0.0272 + 0.0635 + 0.0291) = **0.346** |
| vs simple sum | 0.165 + 0.252 = 0.417 | correlation saves 0.071 (17 %) |

The sub-linear combination (0.346 < 0.417) is exactly the diversification the covariance formula is
meant to capture — the one place the module's maths adds real value over the seeded inputs.

### 7.5 Data provenance & limitations

- **All base CVaR magnitudes, correlations, factor loadings, back-test P&L, and copula parameters are
  synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`.
- **No Monte-Carlo simulation and no scenario-probability weighting** despite the guide — the "MC"
  and "copula" tabs render seeded parameters, not simulated draws.
- **Portfolio CVaR is a linear weighted sum** of per-asset CVaRs, which ignores cross-asset
  correlation (unlike the intra-asset phys/trans combination which does use ρ) — internally
  inconsistent aggregation.
- The 95→99 step uses a seeded multiplier rather than a fitted tail (GPD `gpdTailIndex` is stored but
  not used to derive the 99 % level).

**Framework alignment:** NGFS Phase 5 scenario set (the physMult/transMult ordering is correct);
Basel III / FRTB Expected Shortfall (CVaR = tail-conditional loss — the module reports ES but does
not compute it from a distribution); the variance-covariance combination echoes RiskMetrics
delta-normal VaR. Because the core loss inputs are seeded and the guide's MC-ES engine is absent, §8
specifies the production climate CVaR model.

## 8 · Model Specification — Climate-Augmented Portfolio Expected Shortfall

**Status: specification — not yet implemented in code.** The guide's Monte-Carlo scenario-weighted ES
is not implemented (inputs are `sr()`-seeded); this specifies it.

### 8.1 Purpose & scope
Estimate 95 %/99 % climate-conditional Expected Shortfall for a multi-asset portfolio, decomposed
into physical and transition contributions and probability-weighted across NGFS scenarios.

### 8.2 Conceptual approach
A **copula-based Monte-Carlo ES** augmenting a market-factor return model with physical and
transition climate factors. Benchmarks: MSCI Climate VaR (policy-cost + physical NPV shocks) and
RiskMetrics/CreditMetrics ES simulation; NGFS Phase IV as the scenario generator.

### 8.3 Mathematical specification
```
r_i         = β_i·F_market + λ_iP·F_physical,s + λ_iT·F_transition,s + ε_i
(F, ε) drawn via copula C(·) with correlation Σ (Gaussian/Student-t/Clayton)
L_p^{(m)}   = − Σ_i w_i · r_i^{(m)}                       (portfolio loss, draw m)
VaR_q,s     = Quantile_q( { L_p^{(m)} } )
ES_q,s      = E[ L_p | L_p > VaR_q,s ]
ClimateES_q = Σ_s π_s · ES_q,s                            (scenario-probability weighted)
Contribution_k = ES_q with factor k on − ES_q with factor k off
```
| Parameter | Source |
|---|---|
| Factor loadings λ_iP, λ_iT | Regress asset returns on carbon/energy/hazard factors |
| Scenario factor shocks F_·,s | NGFS Phase IV carbon price + physical damage |
| Copula Σ, df, θ | Estimated from historical asset returns |
| Scenario weights π_s | NGFS likelihood or equal-weight + sensitivity band |
| Draws M | ≥ 100k for stable 99 % ES |

### 8.4 Data requirements
Historical asset-class returns, factor definitions (carbon price, energy, hazard indices), NGFS
scenario shocks (platform scenario tables), and a fitted copula. The scenario multipliers and asset
list already exist; the missing pieces are historical returns and the copula fit.

### 8.5 Validation & benchmarking plan
Kupiec/Christoffersen back-test of VaR exceptions (the 24-month exception series should become a real
test); reconcile ES against MSCI Climate VaR for an overlapping portfolio; sensitivity-test to copula
choice and π_s; verify sub-additivity of ES (coherence).

### 8.6 Limitations & model risk
ES is sensitive to tail-copula choice and factor calibration; NGFS scenarios are not probabilities;
MC error at 99 % needs large M. Conservative fallback: report ES as a range across copulas and a
worst-scenario ES rather than a single probability-weighted number.

## 9 · Future Evolution

### 9.1 Evolution A — Actual Monte Carlo behind the (real) aggregation layer (analytics ladder: rung 1 → 2)

**What.** §7 splits the module precisely: the aggregation math is genuine — the
closed-form correlation combination `√(phys² + trans² + 2ρ·phys·trans)`, weighted
portfolio roll-up, Euler-style diversification, NGFS/horizon scaling — but the base
CVaR magnitudes underneath are `sr()`-seeded constants, and the advertised Monte
Carlo and copula tabs are parameter displays with no simulation behind them.
Evolution A builds the simulation the guide promises: multi-factor return draws per
asset class, climate factor shocks per NGFS scenario, expected shortfall computed
from the simulated tail (`CVaR = E[Loss | Loss > VaR_q]`), and scenario-probability
weighting π_s applied across the 6 scenarios — replacing the 192 seeded parameter
cells with distributions whose tails are actually sampled.

**How.** (1) A seeded, reproducible simulation engine (platform PRNG conventions;
percentile outputs bench-pinned so runs are regression-testable) — likely backend,
since 10⁴–10⁵ paths × 8 asset classes exceeds comfortable in-page compute; this would
be the module's first API route. (2) The copula tab made real for the two coded
families (Gaussian/t) with tail-dependence visible in the simulated joint losses.
(3) The existing closed-form aggregation retained as a validation cross-check — the
simulated and analytic CVaRs should reconcile within sampling error, which is itself
a powerful correctness test.

**Prerequisites.** Factor covariance and climate-shock parameters need documented
sources (NGFS paths for transition shocks; the twin's hazard data for physical);
seeded-constant purge per the guardrail. **Acceptance:** simulated CVaR converges to
the closed-form value on an uncorrelated fixture; bench pin on P95/P99 percentiles
passes across runs; the "Monte Carlo" tab actually runs one.

### 9.2 Evolution B — Tail-risk explainer and scenario runner (LLM tier 2)

**What.** An assistant for risk committees: "what drives our 99% climate CVaR under
Disorderly — physical or transition?" (the decomposition the module genuinely
computes), "how much diversification benefit are we claiming and why?" (Euler
attribution narration), "re-run at 99% with equal scenario weights" (a tool call into
the Evolution A simulation endpoint). CVaR is a concept committees routinely
misread — expected shortfall vs VaR — and a grounded explainer has real value here.

**How.** Tool schemas over the simulation and aggregation endpoints; every CVaR, VaR,
and contribution figure validated against tool outputs; methodology questions (why
expected shortfall, what π_s means) answered from the §5 corpus (Basel ES framework,
NGFS) with the module's actual parameter values cited, not textbook defaults.

**Prerequisites (hard).** Evolution A first — explaining tail risk computed from
seeded constants would lend false authority to noise; simulation reproducibility
(seed reporting) so any narrated number can be re-derived. **Acceptance:** a
decomposition answer reconciles to the Euler attribution output; the copilot states
simulation seed and path count when citing tail figures.