# DME Risk Engine
**Module ID:** `dme-risk-engine` · **Route:** `/dme-risk-engine` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Forward-looking financial risk modelling engine that translates Dynamic Materiality Engine topic scores into quantified risk factors including earnings volatility, asset impairment, and stranded asset exposure. Integrates with the stress testing framework to produce ESG-adjusted VaR and CVaR estimates.

> **Business value:** Converts materiality scores into the quantified financial risk language used by CROs, CFOs, and regulators. Provides the ESG stress testing inputs required for TCFD financial risk disclosure and ECB supervisory climate risk reporting.

**How an analyst works this module:**
- Confirm DME materiality scores are current and financial sensitivities are calibrated in Risk Engine Settings
- Select the stress scenarios to run: NGFS Orderly, Disorderly, and Hot House as minimum
- Review ESG VaR and CVaR outputs and drill into topic risk factor attribution
- Integrate outputs into the firm-wide risk report and TCFD Metrics & Targets section

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AMPLIFICATION`, `Badge`, `Btn`, `COLORS`, `DEFAULT_COEFF`, `KpiCard`, `LS_PORT`, `REGIME_COLORS`, `RISK_CHANNELS`, `SECTOR_COEFFICIENTS`, `Section`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RISK_CHANNELS` | 6 | `label`, `icon` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d=1) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : '---';` |
| `fmtPct` | `(n) => typeof n === 'number' ? `${n.toFixed(2)}%` : '---';` |
| `fmtBps` | `(n) => typeof n === 'number' ? `${n.toFixed(0)} bps` : '---';` |
| `fmtUsd` | `(n) => typeof n === 'number' ? `$${n.toFixed(1)}M` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `adjustedAsset` | `assetValue * (1 - strandedHaircut);` |
| `wacc` | `wE * (cE + esgEqPrem) + wD * (cD + esgDebtSpread) * (1 - taxRate);` |
| `baseline` | `wE * cE + wD * cD * (1 - taxRate);` |
| `debt` | `company.total_debt_usd_mn \|\| mcap * 0.3;` |
| `assetValue` | `mcap + debt;` |
| `totalEmissions` | `scope1 + scope2;` |
| `revenue` | `company.revenue_usd_mn \|\| mcap * 0.4;` |
| `carbonIntensity` | `revenue > 0 ? (totalEmissions * 1e6) / revenue : 0;` |
| `pdBase` | `clamp(0.005 + (transRisk / 100) * 0.04 + sRand(s + 1) * 0.01, 0.001, 0.15);` |
| `velT` | `(sRand(s + 10) - 0.3) * 0.5;   // transition velocity` |
| `velP` | `(sRand(s + 20) - 0.3) * 0.3;   // physical velocity` |
| `velS` | `(sRand(s + 30) - 0.3) * 0.2;   // social velocity` |
| `accel` | `calculateAcceleration(velT, velT * 0.8, 1);` |
| `strandedHaircut` | `coeff.haircut * (transRisk / 100);` |
| `exposure` | `mcap * (weight / 100);` |
| `varBase` | `exposure * coeff.baseVol * 1.645 * Math.sqrt(1 / 252) * 0.01;` |
| `adjVaR` | `varRealtime(varBase, exposure, betaRep, Math.abs(accel));` |
| `esgDebtSpread` | `esgEqPrem * 0.6;` |
| `hqla` | `mcap * 0.15;` |
| `netOutflows` | `mcap * 0.08;` |
| `impactScore` | `clamp(totalEmissions * 10 + transRisk * 0.3 + sRand(s + 60) * 20, 0, 100);` |
| `riskScore` | `clamp(primaryPD * 1000 + transRisk * 0.4 + sRand(s + 70) * 15, 0, 100);` |
| `opportunityScore` | `clamp(esgScore * 0.6 + (100 - transRisk) * 0.3 + sRand(s + 80) * 10, 0, 100);` |
| `regime` | `classifyRegime(Math.abs(zScore));` |
| `ead` | `exposure > 0 ? exposure : mcap * 0.01;` |
| `allAssessments` | `useMemo(() => { return portfolio.map(co => assessEntity(co, co.weight));` |
| `avgPD` | `allAssessments.reduce((s, a) => s + a.primaryPD, 0) / n;` |
| `totalVaR` | `allAssessments.reduce((s, a) => s + a.adjVaR, 0);` |
| `weightedWACC` | `allAssessments.reduce((s, a) => s + a.waccResult.wacc * (a.weight / 100), 0) / allAssessments.reduce((s, a) => s + a.weight / 100, 0);` |
| `avgLCR` | `allAssessments.reduce((s, a) => s + a.lcr, 0) / n;` |
| `totalEL` | `allAssessments.reduce((s, a) => s + a.el, 0);` |
| `avgDMI` | `allAssessments.reduce((s, a) => s + a.dmi, 0) / n;` |
| `dominantRegime` | `Object.entries(regimeDist).sort((a, b) => b[1] - a[1])[0][0];` |
| `drift` | `(sr(i * 5) * 2 - 1) * 8 + sRand(i * 137) * 12;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `RISK_CHANNELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG VaR (95%, 1yr) | — | DME risk engine | ESG-attributable Value at Risk at 95% confidence over a 1-year horizon |
| ESG CVaR (99%, 1yr) | — | DME risk engine | Expected loss in the worst 1% of ESG risk outcomes over a 1-year horizon |
| Top Risk Driver Topic | — | Topic risk attribution | Topic with the highest ESG risk factor contribution to portfolio VaR |
| Stress Scenario Delta (Hot House) | — | Scenario engine | Estimated portfolio NAV reduction under a disorderly 3°C NGFS Hot House World scenario |
- **DME materiality scores (all topics, current)** → Materiality-to-sensitivity mapping using sector calibration tables → **ESG risk factor per topic**
- **Financial sensitivity library (sector benchmarks, NGFS calibration)** → Sensitivity calibration: % EBITDA impact per materiality score point by sector and topic → **Calibrated sensitivity parameters with confidence intervals**
- **Monte Carlo simulation engine** → 10,000-path simulation of joint topic risk materialisation → **ESG VaR and CVaR distribution with topic attribution waterfall**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Risk Factor
**Headline formula:** `ERF = Σᵢ (MaterialityScoreᵢ × Sensitivityᵢ × TimeHorizonᵢ)`

Each material topic contributes a risk factor calculated as the product of materiality score, financial sensitivity (% EBITDA per materiality point), and horizon scaling (risks discounted further out). The composite ERF feeds the Monte Carlo stress engine to generate ESG-adjusted VaR at 95% and 99% confidence.

**Standards:** ['TCFD Financial Risk Quantification', 'NGFS Risk Factor Calibration', 'ECB SSM Climate Risk Framework']
**Reference documents:** NGFS (2023) Scenarios for Central Banks â€” Transition and Physical Risk Calibration; TCFd (2021) Guidance on Scenario Analysis and Financial Risk Quantification; ECB (2021) Economy-wide Climate Stress Test Methodology; BIS (2021) Climate-related Risk Drivers and Their Transmission Channels

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The DME Risk Engine is the **parent quant library** the other DME pages port from ("exact port from
dme-platform/src/lib/calculations.ts"). It bundles a velocity/acceleration signal engine, EMA smoothing,
z-score regime classification, the **four-branch PD strategy**, and VaR/WACC/LCR/DMI/EL calculations —
applied to holdings enriched from `GLOBAL_COMPANY_MASTER`. No guide record was supplied, so no mismatch
flag; the caveat is on synthetic fallback data.

### 7.1 What the module computes

**Signal dynamics:**
```js
velocity(cur, prev, Δt)     = Δt>0 ? (cur−prev)/Δt : 0
acceleration(v, vPrev, Δt)  = Δt>0 ? (v−vPrev)/Δt : 0
emaSmooth(raw, prevEma, α)  = α·raw + (1−α)·prevEma
zScore(v, μ, σ)             = σ>0 ? (v−μ)/σ : 0
regime(z) = z≤1 Normal | z≤2 Elevated | z≤3 Critical | else Extreme
```
**Four-branch PD** (identical to dme-entity):
```
A pdExponential = pdBase·exp(α·velT)
B pdMertonDD    = Φ(−d2), d2 = d1 − σ√T, on stranded-haircut-adjusted assets
C pdTabular     = pdBase·{low 1.05, med 1.30, high 2.00, severe 3.25}[band]
D pdMultifactor = pdBase·exp(αT·velT + βP·velP + γS·velS)   // 3-factor velocity
```
**Risk & capital calcs:**
```
VaR_realtime = varBase + exposure·βRep·accelRep            // acceleration-driven VaR uplift
WACC_adj     = wE(cE+esgEqPrem) + wD(cD+esgDebtSpread)(1−tax) ; bpsChange vs baseline
DMI          = impact·0.40 + risk·0.40 + opportunity·0.20
EL           = PD·LGD·EAD
LCR_adj      = HQLA / (netOutflows·esgStressMult) · 100     // ESG-stressed liquidity
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Regime z bands | 1 / 2 / 3 | z-score thresholds (Normal→Extreme) |
| ESG-band PD mult. | low 1.05 / med 1.30 / high 2.00 / severe 3.25 | `pdTabular` heuristic |
| DMI weights | impact .40 / risk .40 / opportunity .20 | fixed |
| Multifactor branch | αT·velT + βP·velP + γS·velS | transition/physical/social velocities |
| RISK_CHANNELS | 6 | transmission-channel taxonomy (seed schema) |

Branch D adds a **social velocity** term (γS·velS) beyond dme-entity's two-factor version. Inputs
(pdBase, velocities, asset value, vol, EAD, HQLA) are `sRand(seed)=frac(sin(seed+1)×10⁴)` fallbacks where
the master lacks them.

### 7.3 Calculation walkthrough

1. Holdings loaded from `ra_portfolio_v1` / master; each enriched with seeded velocities and financials.
2. Signal engine: raw materiality → EMA → velocity → acceleration → z-score → regime.
3. Four PD branches → consensus (weighting set by the consuming view).
4. VaR uses **acceleration** (not just level) — a momentum-sensitive tail measure; WACC isolates the ESG
   premium in bps; EL = PD·LGD·EAD; LCR stressed by an ESG multiplier.
5. `RISK_CHANNELS` (6) organises outputs by transmission channel for a radar/heatmap.

### 7.4 Worked example (velocity → regime → VaR)

Materiality series raw 62 (prev 55), Δt=1 → velocity = 7. Prev velocity 4 → acceleration = 3.
EMA(α=0.3): 0.3·62 + 0.7·58 = 18.6 + 40.6 = 59.2. With μ=50, σ=8: z = (59.2−50)/8 = 1.15 → **Elevated**.
VaR_realtime with varBase=$40M, exposure=$500M, βRep=0.0002, accelRep=3:
`40 + 500·0.0002·3 = 40 + 0.30 = $40.3M`. Branch A PD with pdBase 2%, α 0.15, velT 0.5:
`0.02·exp(0.075) = 0.02·1.0779 = 2.16%`.

### 7.5 Data provenance & limitations

- Holdings can be real (user portfolio matched to master), but velocities, acceleration, HQLA and many
  financials are **synthetic** via `sRand`, so signal dynamics are largely driven by seeded noise.
- The velocity/acceleration engine is mechanically correct finite-difference; VaR's acceleration term is
  a bespoke momentum overlay, not a standard historical/parametric VaR.
- Regime z uses fixed thresholds; without a real rolling μ/σ, "regime" is a static banding of the seeded
  z-score.
- Merton and multifactor PD are genuine but on random inputs.

**Framework alignment:** **Merton/KMV** structural PD; **IFRS 9** EL = PD·LGD·EAD; **Basel III LCR** (here
ESG-stressed); CAPM-based WACC with an ESG premium; **NGFS/EBA** transition-velocity PD conditioning. The
velocity/acceleration "materiality dynamics" framing is the platform's own signal-processing layer (EMA +
z-score regime), analogous to momentum/volatility-regime models in market risk.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A production materiality-dynamics + credit-risk engine: real-time signal velocity/acceleration, regime
detection, multi-branch PD, and climate-stressed EL/VaR/LCR for the covered book.

### 8.2 Conceptual approach
Replace fixed z-bands with a **data-driven regime model** (rolling z or Markov-switching) and calibrate PD
branches to real data (Merton/KMV anchor + logit + climate-conditioned drift). VaR moves from the ad-hoc
acceleration term to a proper historical/EVT tail. Benchmarks: Moody's EDF, RiskMetrics/FRTB VaR, EBA
climate stress test, NGFS Phase IV.

### 8.3 Mathematical specification
```
Signal: v_t = ΔS_t/Δt; a_t = Δv_t/Δt; z_t = (EMA_t − μ_roll)/σ_roll (36-window)
Regime: Markov-switching on z (states Normal/Elevated/Critical/Extreme), posterior via forward-backward
PD: Merton (de-levered σ_A, climate drift) ⊕ logit ⊕ multifactor; blend by inverse-variance
VaR_α = −quantile_α(P&L) with EVT (GPD) tail for α≥0.99
EL_life = Σ_t marginalPD_t·LGD·EAD_t·DF_t
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Rolling window | 36 | regime stability |
| Climate drift | — | NGFS Phase IV |
| σ_A | — | de-levered equity vol |
| EVT tail ξ | — | GPD fit to loss exceedances |
| LGD | — | PCAF / recoveries |

### 8.4 Data requirements
Time-series materiality signals (for velocity), issuer financials/vol, default history for logit, HQLA
schedule for LCR, NGFS scenario variables. Platform holds the calc library, `RISK_CHANNELS` taxonomy and
`climate_scenarios` tables.

### 8.5 Validation & benchmarking plan
Regime-model likelihood and stability backtest; PD calibration/Gini; VaR backtest (Kupiec/Christoffersen);
reconcile PD vs Moody's EDF and EL vs IFRS 9 provisions; confirm the acceleration-VaR is superseded by a
backtested tail measure.

### 8.6 Limitations & model risk
Finite-difference velocity is noise-sensitive on sparse signals; acceleration-driven VaR lacks a
distributional basis. Conservative fallback: require corroborated signal movement before a regime change
and use the max-of-branches PD when models disagree.

## 9 · Future Evolution

### 9.1 Evolution A — Promote the parent quant library to a versioned server-side engine (analytics ladder: rung 2 → 3)

**What.** §7 identifies this page as "the parent quant library the other DME pages port from" — velocity/acceleration signals, EMA smoothing, z-score regime classification, the four-branch PD strategy, and VaR/WACC/LCR/DMI/EL, applied to LocalStorage holdings enriched from `GLOBAL_COMPANY_MASTER`. Two problems: the library lives in frontend code (so dme-entity, dme-dashboard, and dme-pd-engine each carry divergent copies), and several scores blend real formulas with seeded noise (`impactScore = clamp(emissions·10 + transRisk·0.3 + sRand(s+60)·20)`, `pdBase` with a `sRand` term). Evolution A makes this the single, versioned, server-side DME quant engine.

**How.** (1) Port `calculations.ts` to `services/dme_quant_lib.py`, registered in the engine registry with version stamps in every response (the roadmap's engine-platform requirement — this library is its most-duplicated candidate). (2) Strip every additive `sRand` noise term; where a term was papering over a missing input (e.g. reputational beta), return honest nulls with the missing-input named. (3) Sibling DME pages consume it via API; the atlas blast-radius for this module stops being 0 and becomes real — document the new edges. (4) Rung 3: `bench_quant.py` pins for each library function (velocity, EMA recursion, regime thresholds, all four PD branches, VaR scaling) so downstream refactors can't silently drift — the exact failure mode the "exact port" history invites.

**Prerequisites.** Agreement with dme-pd-engine's Evolution A on ownership (PD branches live here; PD route consumes); real holdings via `portfolios_pg`. **Acceptance:** all sibling DME pages return engine-version headers pointing at one library; bench pins pass; grep finds zero copies of `mertonDD`/`varRealtime` in frontend code.

### 9.2 Evolution B — Model-documentation copilot for validators and supervisors (LLM tier 1)

**What.** As the quant core feeding TCFD and ECB-facing outputs, this module's LLM need isn't another analyst — it's *model validation support*: a copilot that answers "how exactly is the ESG-adjusted VaR computed, what are its assumptions, and where is it calibrated vs. asserted?" strictly from the module's Atlas record (§5 ERF formula, §7.1 signal dynamics, the library's constants) — the questions a supervisor or internal validation team asks first.

**How.** Pure tier-1 RAG per the roadmap: this Atlas page plus the engine's §8 model card embedded in `llm_corpus_chunks`, per-module system prompt, prompt-cached. Distinctive guardrail: the copilot must *distinguish calibrated from authored parameters* — it should answer "the 1.645 is the 95% normal quantile; the sector haircuts are authored assumptions pending calibration (see §9.1)" rather than lending false authority. The refusal path covers performance claims: asked "how accurate is the PD model?", it cites the bench/calibration status honestly, including "not yet backtested" while that is true.

**Prerequisites.** Evolution A's version stamps (answers must name the engine version they describe); the §8 model card kept current by the atlas builder. **Acceptance:** validation-team golden questions (10 Q&A written from §7) answered with correct formula citations; every parameter mentioned is labeled calibrated/authored consistent with the model card; zero invented accuracy statistics.