# Quant Dashboard
**Module ID:** `quant-dashboard` · **Route:** `/quant-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantitative ESG analytics hub providing factor exposures, alpha signal diagnostics, and ESG-integrated risk model outputs for systematic strategies.

> **Business value:** Provides quant investment teams with rigorous ESG factor analytics, integrating sustainability signals into systematic risk-return optimisation frameworks.

**How an analyst works this module:**
- Select portfolio or strategy for factor exposure analysis.
- Review ESG factor return decomposition and attribution.
- Diagnose alpha decay and factor crowding signals.
- Integrate ESG factor constraints into optimisation.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ChartTooltip`, `QuantDashboardPage`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `idx` | `(p / 100) * (s.length - 1);` |
| `totalValue` | `holdings.reduce((s, h) => s + (h.value_usd \|\| 0), 0) \|\| 1;` |
| `weights` | `holdings.map(h => (h.value_usd \|\| 0) / totalValue);` |
| `vols` | `holdings.map(h => {` |
| `drifts` | `holdings.map(h => {` |
| `cvar95` | `-mean(portReturns.slice(0, Math.max(1, Math.floor(iterations * 0.05))));` |
| `holdingVarContrib` | `holdings.map((h, j) => {` |
| `contrib` | `w * vols[j] * 1.645;  // parametric approximation` |
| `esgAlpha` | `((c.esg_score \|\| 50) - 50) / 5000;` |
| `vol` | `0.04 + (c.sector === 'Energy' ? 0.015 : 0);` |
| `annRet` | `(Math.pow(cumValue, 12 / months) - 1);` |
| `annVol` | `stdev(monthlyReturns) * Math.sqrt(12);` |
| `sharpe` | `annVol > 0 ? (annRet - 0.04) / annVol : 0;` |
| `dsVol` | `downside.length > 0 ? stdev(downside) * Math.sqrt(12) : annVol;` |
| `beta1` | `0.002;  // per tCO2/USDMn` |
| `beta2` | `0.3;    // sector loading` |
| `beta3` | `-0.4;   // SBTi committed reduction` |
| `holdingITRs` | `holdings.map(h => {` |
| `carbonIntensity` | `((c.scope1_mt \|\| 0) + (c.scope2_mt \|\| 0)) / revenue;` |
| `itr` | `alpha + beta1 * carbonIntensity + beta2 * sectorFactor + beta3 * sbtiAdj;` |
| `portfolioITR` | `holdingITRs.reduce((s, itr, i) => s + weights[i] * itr, 0);` |
| `ssTot` | `holdingITRs.reduce((s, v) => s + (v - yMean) ** 2, 0);` |
| `ssRes` | `holdingITRs.reduce((s, v) => s + (v - (alpha + beta1 * 100)) ** 2, 0);` |
| `adjustedR2` | `Math.max(0, r2 - 0.05); // conservative adjustment` |
| `lookupITR` | `weights.reduce((s, w, i) => {` |
| `avgESG` | `mean(holdings.map(h => h.company?.esg_score \|\| 50));` |
| `rho` | `Math.max(0.1, Math.min(0.9, avgCorr + corrAdj));` |
| `tau` | `(2 / Math.PI) * Math.asin(rho);` |
| `theta` | `Math.max(0.1, 2 * tau / (1 - tau));` |
| `lambdaL` | `Math.pow(2, -1 / theta);` |
| `jointCrashP` | `Math.pow(2 * Math.pow(0.05, -theta) - 1, -1 / theta);` |
| `holdingTailRisk` | `holdings.map((h, j) => {` |
| `transRisk` | `(c.transition_risk_score \|\| 50) / 100;` |
| `tailContrib` | `weights[j] * (0.5 + 0.5 * transRisk) * lambdaL;` |
| `carbon` | `Math.exp(Math.log(150) + 0.4 * boxMullerSeeded(rng));` |
| `temp` | `2.1 + 0.5 * boxMullerSeeded(rng);` |
| `policy` | `2028 + 2 * boxMullerSeeded(rng);` |
| `tech` | `Math.max(0, Math.min(1, 0.3 + 0.15 * boxMullerSeeded(rng)));` |
| `strand` | `Math.exp(Math.log(15) + 0.5 * boxMullerSeeded(rng));` |
| `impact` | `-(carbon / 150 - 1) * 0.08 - (temp - 1.5) * 0.03 +` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-computed`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Factor Alpha (ann., %) | — | Factor Backtest | Annualised alpha of ESG quality factor over trailing 5-year backtest period. |
| Factor Sharpe Ratio | — | Factor Analytics | Risk-adjusted return of ESG factor portfolio over backtest horizon. |
| ESG β (Portfolio) | — | Risk Model | Portfolio loading on ESG factor in Barra-style multi-factor risk model. |
- **Holdings + ESG scores + factor returns + risk model data** → Factor exposure calculation; return attribution; alpha diagnostics → **Factor exposure report, attribution output, and ESG signal diagnostics**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Factor Return
**Headline formula:** `r_ESG = β_ESG × f_ESG + ε; f_ESG = long top-quintile – short bottom-quintile return`

Long-short ESG factor portfolio return isolating the systematic return premium from ESG quality differences.

**Standards:** ['Fama & French (1993)', 'MSCI Barra ESG Factor Model']
**Reference documents:** MSCI Barra Global Equity Model (GEM3) Documentation; Fama E.F. & French K.R. (1993) Common Risk Factors in the Returns on Stocks and Bonds

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide frames this as an **ESG long-short factor model**
> `r_ESG = β_ESG·f_ESG + ε` (Fama-French / Barra style, "ESG factor alpha 2.1%", "factor Sharpe
> 0.48"). **That factor model is not the module's content.** The page runs four genuine quant engines
> on the user's real portfolio: **Monte-Carlo VaR**, **performance simulation (Sharpe/Sortino/max-DD)**,
> **implied-temperature-rise (ITR)**, and a **Clayton-copula tail-risk** engine, plus a **stochastic
> climate-scenario** summary. These are real, correctly-coded methods — a rarity in the B tier — so
> the deep dive documents them rather than the guide's factor framing. The one soft spot is the ITR
> "regression", whose betas and R² are not actually estimated (see §7.3, §8).

### 7.1 What the module computes

Holdings come from the **shared portfolio** (`localStorage['ra_portfolio_v1']`), enriched with real
fundamentals from `GLOBAL_COMPANY_MASTER` (sector, scope 1/2, revenue, ESG, SBTi, transition-risk).

**Monte-Carlo VaR** (`runMCVaR`, 1000 iters, deterministic `mulberry32(12345)` PRNG):

```js
vol_j   = 0.18 + sectorAdj(Energy +0.08, IT +0.05) + (esg<40 ? +0.04 : 0)
drift_j = 0.05 − (transition_risk_score/100)·0.06
per iter: r_j = drift_j + vol_j · Z   (Z = Box-Muller normal),  portReturn = Σ w_j·r_j
VaR95 = −pct(portReturns, 5);  VaR99 = −pct(portReturns, 1)
CVaR95 = −mean(worst 5% of portReturns)                      // expected shortfall
```

**Copula tail risk** (`runCopulaTailRisk`) — a correctly-derived **Clayton** lower-tail dependence:

```js
ρ       = clamp(0.35 + esgAdj, 0.1, 0.9)          esgAdj = avgESG<40 ? +0.15 : >70 ? −0.10 : 0
τ       = (2/π)·arcsin(ρ)                          // Kendall's tau from Pearson ρ (Gaussian relation)
θ       = 2τ/(1−τ)                                 // Clayton θ from τ  (τ = θ/(θ+2))
λ_L     = 2^(−1/θ)                                 // Clayton lower-tail dependence coefficient
jointCrashP = (2·0.05^(−θ) − 1)^(−1/θ)             // P(both assets below 5th pct) under Clayton
```

**ITR** (`runITRRegression`) — a **fixed-coefficient linear score**, not a fitted regression:

```js
ITR_h = clamp(1.5 + 0.002·carbonIntensity + 0.3·sectorFactor − 0.4·sbti, 1.2, 5.0)
portfolioITR = Σ w_h · ITR_h
```

**Performance** (`runPerformanceSim`): monthly portfolio returns → `annRet`, `annVol =
stdev·√12`, `sharpe = (annRet−0.04)/annVol`, `sortino` (downside dev), `maxDrawdown`.
**Scenarios** (`runScenarioSummary`, 500 draws): five climate factors (carbon, temp, policy year,
tech, stranded) → a linear damage `impact`; `scenVar95` and count of losses >10%.

### 7.2 Parameterisation / provenance

| Parameter | Value | Provenance |
|---|---|---|
| Base vol | 0.18 | in-code assumption (≈ equity annual vol) |
| Sector vol add | Energy +0.08, IT +0.05 | in-code heuristic |
| Drift | `0.05 − transRisk·0.06` | in-code (transition risk lowers drift) |
| MC iterations | 1000 | in-code |
| Base correlation ρ | 0.35 | in-code (typical equity avg pairwise) |
| ITR α,β1,β2,β3 | 1.5, 0.002, 0.3, −0.4 | **hard-coded, not estimated** |
| ITR clamp | 1.2–5.0 °C | in-code (plausible ITR range) |
| Risk-free | 0.04 | in-code |
| Scenario factor moments | carbon logN(150,0.4), temp N(2.1,0.5)… | in-code assumptions |

Company inputs (scope 1/2, revenue, ESG, SBTi, sector, transition risk) are **real**, from
`GLOBAL_COMPANY_MASTER`. The PRNGs are seeded (mulberry32 with fixed seeds), so results are
reproducible but not stochastic across sessions.

### 7.3 Calculation walkthrough

1. Load active portfolio → enrich each holding with master fundamentals → value-weight.
2. VaR: 1000 Box-Muller draws per holding, aggregate to portfolio return, take 5th/1st percentiles
   and worst-5% mean (CVaR).
3. Copula: derive ρ from portfolio ESG, convert to Kendall τ, then Clayton θ and λ_L; the tail
   dependence and joint-crash probability are **mathematically correct** for a Clayton copula.
4. ITR: apply the fixed linear score per holding, value-weight. The "R²" is **fabricated** —
   `ssRes` compares each ITR to a constant `α + β1·100`, then the result is overwritten by
   `max(0.55, min(0.92, adjustedR2 + 0.4))`, i.e. forced into 0.55–0.92 regardless of fit.
5. Scenarios: 500 factor draws → linear damage function → VaR95 of impacts.

### 7.4 Worked example (Copula tail dependence)

Portfolio avg ESG = 72 (>70) → `esgAdj = −0.10` → `ρ = 0.35 − 0.10 = 0.25`.
`τ = (2/π)·arcsin(0.25) = 0.637·0.2527 = 0.1610`.
`θ = 2·0.1610 / (1 − 0.1610) = 0.3220 / 0.8390 = 0.3838`.
`λ_L = 2^(−1/0.3838) = 2^(−2.606) = 0.1642` → **16.4% lower-tail dependence**.
`jointCrashP = (2·0.05^(−0.3838) − 1)^(−1/0.3838)`; `0.05^(−0.3838) = e^{0.3838·2.996} = e^{1.150} =
3.158`; `(2·3.158 − 1) = 5.316`; `5.316^(−2.606) = e^{−2.606·1.671} = e^{−4.354} = 0.0128` → **1.28%**
joint-crash probability. A higher-ESG portfolio (lower ρ) yields lower tail dependence — the intended
"quality reduces crash co-movement" behaviour, and the Clayton math is correct.

### 7.5 Data provenance & limitations

- **Portfolio and fundamentals are real** (shared portfolio + `GLOBAL_COMPANY_MASTER`); the PRNGs
  are seeded for reproducibility. This is genuinely more rigorous than the typical B-tier page.
- **VaR uses independent normals** (no correlation matrix in the MC draw), so diversification is
  understated vs the copula tab's ρ=0.25–0.35 — the two engines are not reconciled.
- **ITR is not a regression**: betas are hard-coded and the reported R² is fabricated/clamped. It is
  a transparent linear scorecard, which is fine — but it should not be labelled a fitted model.
- Scenario damage is a linear function of five factors with in-code moments — a reduced-form proxy,
  not an NGFS-calibrated path.

**Framework alignment:** **Monte-Carlo VaR / CVaR** (Basel FRTB expected-shortfall spirit; here
Gaussian, single-period). **Clayton copula lower-tail dependence** — the standard tool for modelling
joint downside co-movement (λ_L = 2^(−1/θ) is the exact Clayton result), mirroring RiskMetrics/
copula-VaR practice. **Implied Temperature Rise (ITR)** — the guide references MSCI/TCFD ITR; the
module produces a portfolio-weighted ITR in the 1.2–5.0 °C band, but via a fixed scorecard, not
MSCI's carbon-budget-based method. **MSCI Barra / Fama-French** factor model (guide) is not present.
The ITR piece warrants a proper specification.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** (Scopes only the ITR engine; the VaR and
copula engines are already sound.)

**8.1 Purpose & scope.** Produce a portfolio Implied Temperature Rise consistent with a science-based
carbon-budget method, per holding and aggregated, for net-zero alignment reporting.

**8.2 Conceptual approach.** The **carbon-budget over-/under-shoot method**, mirroring (i) MSCI ITR
and (ii) TCFD's Portfolio Alignment Team guidance. A company's ITR is derived from its projected
emissions vs its allocated share of a temperature-specific global carbon budget — not a linear score
of carbon intensity.

**8.3 Mathematical specification.**
Company allocated budget: `B_c = globalBudget_{T} × allocation_c` (allocation by economic activity or
emissions share). Cumulative overshoot: `OS_c = Σ_{t} (E_c(t) − pathway_c(t))` over the horizon.
Map overshoot to temperature via the transient climate response to cumulative emissions (TCRE):
`ITR_c = 1.5 + TCRE × (OS_c / remainingBudget_{1.5})`. Portfolio `ITR = Σ w_c · ITR_c` (or the
budget-aggregation variant). Uncertainty from emissions-projection and budget scenarios.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Global carbon budget | `globalBudget_T` | IPCC AR6 remaining-budget tables |
| TCRE | TCRE | IPCC AR6 (≈1.65 °C per 1000 GtC) |
| Company pathway | `pathway_c` | SBTi sectoral decarbonisation / CRREM-analogue |
| Emissions projection | `E_c(t)` | reported Scope 1–3 + target trajectory |
| Allocation | `allocation_c` | GEVA / SDA (sectoral decarbonisation approach) |

**8.4 Data requirements.** Scope 1–3 emissions history + targets, revenue/economic activity, sector,
SBTi status. Sources: CDP, SBTi, company disclosures; IPCC budgets. Platform holds scope 1/2 +
revenue + SBTi in `GLOBAL_COMPANY_MASTER`; needs scope 3 and forward targets.

**8.5 Validation & benchmarking.** Reconcile per-company ITR against MSCI/CDP-ACT ITR; sensitivity to
budget scenario and allocation rule; backtest portfolio ITR drift vs realised target progress.

**8.6 Limitations & model risk.** Allocation rule is contested (production vs consumption); scope-3
projections are uncertain. Conservative fallback: report ITR as a range across allocation rules and
flag scope-3 coverage; never present a fabricated R² as model fit.

## 9 · Future Evolution

### 9.1 Evolution A — Correlated VaR, honest ITR, and engine reconciliation (analytics ladder: rung 2 → 3)

**What.** This page is unusually rigorous for tier B — real portfolio + `GLOBAL_COMPANY_MASTER` fundamentals, a correct Clayton-copula tail-dependence derivation (§7.4 verifies λ_L and joint-crash math by hand), seeded reproducible PRNGs. §7.5 pins its three defects precisely: the MC VaR draws independent normals (no correlation matrix) so diversification is overstated relative to the copula tab's own ρ, the ITR "R²" is fabricated (compared to a constant then clamped into 0.55–0.92), and the two risk engines are unreconciled. Evolution A fixes all three and moves the engines server-side for pinning.

**How.** (1) VaR gains a single-factor Gaussian correlation structure using the same ρ the copula tab derives — one consistent dependence assumption across both engines, with the reconciliation stated in the payload. (2) The ITR block is relabelled what it is (a transparent linear scorecard) and the fabricated R² deleted immediately (this is a Wave-style honesty fix, cheap and urgent); the §8 carbon-budget ITR spec (MSCI/TCFD-PAT over-/under-shoot method) is then implemented behind `POST /itr` with the scorecard kept as documented fallback. (3) Port `runMCVaR`/`runCopulaTailRisk` to `api/v1/routes/quant_dashboard.py` and pin the §7.4 worked example (ρ=0.25 → λ_L=16.4%, jointCrashP=1.28%) in bench_quant.

**Prerequisites.** None hard for the R²/label fix; carbon-budget data (sector budgets, company projections) for the real ITR. **Acceptance:** correlated VaR95 exceeds today's independent-normal VaR95 for the same book; no clamped R² anywhere; bench reproduces the copula example exactly.

### 9.2 Evolution B — Quant-risk explainer with method-aware what-ifs (LLM tier 2)

**What.** The dashboard's outputs (CVaR, λ_L, ITR) are exactly the numbers a PM must defend in risk committee. The copilot explains them mechanically from the engines' own decompositions — "tail dependence is 16.4% because portfolio ESG of 72 lowered ρ to 0.25; here's the τ→θ→λ_L chain" — and runs what-ifs ("drop the two Energy names, rerun VaR and tail risk") as paired tool calls against the Evolution-A endpoints, diffing before/after.

**How.** Tier-2 tool schemas from `/var`, `/copula-tail`, `/itr`; the system prompt is grounded in §7.1–7.4 (the formulas and worked example are the corpus) plus §7.5's caveats, so the copilot always distinguishes the scorecard ITR from a carbon-budget ITR and notes the Gaussian single-period nature of the VaR when asked about regulatory comparability (FRTB uses expected shortfall over liquidity horizons — a distinction the copilot must make rather than blur). Every numeric validated against tool outputs; questions about the guide's ESG long-short factor alpha are refused, since §7 documents that factor model was never this module's content.

**Prerequisites.** Evolution A endpoints; golden Q&A from the §7.4 example. **Acceptance:** the copilot reproduces the τ→θ→λ_L chain with live numbers, and correctly declines to quote a "factor Sharpe" the module does not compute.