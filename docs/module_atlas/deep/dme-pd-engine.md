## 7 · Methodology Deep Dive

The DME PD Engine (EP-BE2) is the platform's most complete **probability-of-default** implementation:
four independent PD branches (Exponential, Merton distance-to-default, Sector Logit, Monte-Carlo GBM)
blended into a consensus, with IFRS 9 staging, LGD-by-collateral, ECL, term-structure hazard rate and a
conviction (model-agreement) metric. The methodology is genuine; the 40-entity universe is synthetic.
There is no guide record supplied, so no mismatch flag — the note is only on data provenance.

### 7.1 What the module computes

Per entity, four PD branches:
```js
// A — Exponential (climate transition velocity)
pdA = clamp(pdBase · exp(α · vT), 0.0001, 0.999)
// B — Merton distance-to-default (t = 3y)
dd  = [ln(A/D) + (r + 0.5σ²)·t] / (σ√t) ,  pdB = clamp(Φ(−dd), …)      (r=0.04)
// C — Sector logit regression
logit = β0 + β1·ESG + β2·(GHG/1000) + β3·revGrowth + β4    ;  pdC = σ(logit) = 1/(1+e^−logit)
// D — Monte-Carlo GBM (500 Box-Muller paths, sr()-deterministic)
z ~ √(−2 ln u1)·cos(2π u2) ;  A_t = A0·exp((μ−0.5σ²)t + σ√t·z) ;  pdD = #(A_t < K)/500
// Consensus
pdConsensus = pdA·0.25 + pdB·0.30 + pdC·0.20 + pdD·0.25
conviction  = max(0, 1 − std(pdArr)/mean(pdArr))          // model agreement 0–1
```
IFRS 9 & term structure:
```
stage   = pdConsensus>0.10 Stage3 | >0.02 Stage2 | else Stage1
pd12m   = min(pdConsensus,1) ;  pdLifetime = min(1, pdConsensus·3.2)
ecl     = pdConsensus·LGD·EAD ;  ecl12m = pd12m·LGD·EAD
λ₁      = −ln(1 − pd12m)/1                                 // 1-yr hazard rate
```

### 7.2 Parameterisation / scoring rubric

**Sector configuration** (`SECTOR_CFG`) — the real, structured parameter set:

| Sector | α (exp) | carbonSens | strandedRisk | β0 | β1(ESG) | β2(GHG) | β4(dummy) |
|---|---|---|---|---|---|---|---|
| Energy | 0.45 | 0.85 | 0.75 | −2.1 | −0.025 | 0.018 | 0.55 |
| Utilities | 0.40 | 0.80 | 0.65 | −2.2 | −0.024 | 0.017 | 0.45 |
| Materials | 0.35 | 0.72 | 0.55 | −2.4 | −0.022 | 0.015 | 0.35 |
| Finance | 0.18 | 0.30 | 0.20 | −2.6 | −0.021 | 0.012 | 0.15 |
| Technology | 0.06 | 0.10 | 0.03 | −3.8 | −0.015 | 0.004 | −0.20 |

Logit signs are economically correct: **higher ESG lowers PD** (β1<0), **higher GHG raises PD** (β2>0),
carbon-heavy sectors carry a positive dummy (β4). **LGD by collateral** (`LGD_BY_COLLATERAL`): Senior
Secured 0.25, Senior Unsecured 0.45, Subordinated 0.65, Unsecured 0.75, Equity-like 0.90 — standard
seniority ladder.

| Constant | Value | Provenance |
|---|---|---|
| Consensus weights | A .25 / B .30 / C .20 / D .25 | hand-set (Merton-anchored) |
| Merton r, t | 0.04, 3y | fixed |
| MC paths | 500 | Box-Muller GBM |
| Lifetime multiplier | ×3.2 | proxy for lifetime/12m |
| Staging thresholds | 10% / 2% | IFRS 9 policy proxy |

Seeded inputs (`sr()`): ESG 20–95, GHG 100–500, assetVal $500–5000M, debt 25–70% of assets, assetVol
0.12–0.44, μ 3–9%, vT −0.5…+1.5, pdBase 0.5–7.5%.

### 7.3 Calculation walkthrough

Each entity runs all four branches → consensus → conviction → IFRS 9 stage/ECL → hazard rate. Filters
(sector/region/stage) drive a heatmap; a calibration tab compares branch outputs; a term-structure tab
uses `λ₁` to project a hazard curve. Portfolio ECL sums `ecl` across the filtered set.

### 7.4 Worked example (Energy entity)

`pdBase = 0.02`, `α = 0.45`, `vT = 0.8`; `A = 3000`, `D = 1500`, `σ = 0.30`; ESG=40, GHG=350,
revGrowth=0.05; collateral Senior Unsecured (LGD 0.45), EAD 1400.

| Branch | Computation | PD |
|---|---|---|
| A Exponential | 0.02·exp(0.45·0.8)=0.02·1.433 | 0.0287 |
| B Merton | dd=[ln2 + (0.04+0.045)·3]/(0.30·√3)=[0.693+0.255]/0.5196=1.825; Φ(−1.825) | 0.0340 |
| C Logit | −2.1 −0.025·40 +0.018·0.35 −0.012·0.05 +0.55 = −2.1−1.0+0.0063−0.0006+0.55 = −2.544; σ(−2.544) | 0.0729 |
| D MC | fraction of 500 GBM paths ending below K=1500 ≈ | 0.055 |
| **Consensus** | 0.0287·.25 + 0.0340·.30 + 0.0729·.20 + 0.055·.25 | **0.0455** |

Stage: 0.0455 ∈ (0.02,0.10] → **Stage 2**. ECL = 0.0455·0.45·1400 = **$28.7M**.
λ₁ = −ln(1−0.0455) = **0.0466**. Conviction = 1 − std([.0287,.034,.0729,.055])/mean ≈ 1 − 0.0166/0.0476 = **0.65**.

### 7.5 Data provenance & limitations

- **All 40 entities synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`. Company names are real but
  their financials are fabricated.
- The **Monte-Carlo branch is genuine Box-Muller GBM** but seeded deterministically (500 `sr()` draws),
  so `pdD` is reproducible, not a fresh random sample — variance is fixed per entity.
- Merton uses a 3-year horizon and fixed r=0.04; the logit coefficients are hand-set priors, not fit to
  a default dataset.
- Lifetime ECL is a ×3.2 scalar, not a discounted marginal-PD term structure.

**Framework alignment:** **Merton (1974)/KMV** structural PD (the basis of Moody's EDF); **logistic
default regression** (Altman/Ohlson-style scoring, here ESG-augmented); **Monte-Carlo GBM** default
simulation; **IFRS 9** three-stage staging + `ECL = PD·LGD·EAD` and 12-month/lifetime split (§5.5); the
hazard rate `λ = −ln(1−PD)` is the standard reduced-form / survival-analysis conversion. LGD-by-seniority
follows Basel/rating-agency recovery ladders.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A validated multi-model PD stack producing 12-month and lifetime PD, ECL and IFRS 9 staging for the
covered obligor book, climate-conditioned via NGFS transition/physical pathways.

### 8.2 Conceptual approach
Keep the four-branch design but **calibrate each branch to real data** and blend by **inverse-variance /
Bayesian model averaging** instead of fixed weights. Anchor on Merton/KMV, augment the logit with a
proper default panel, and condition asset drift on NGFS scenarios. Benchmarks: Moody's EDF/KMV, S&P
CreditModel, IFRS 9 practice, EBA/ECB climate stress-test PD uplift.

### 8.3 Mathematical specification
```
Merton: iterate (E,σ_E) → (A,σ_A); dd = [ln(A/D)+(r−climateDrift−0.5σ_A²)T]/(σ_A√T); PD_B=Φ(−dd)
Logit:  fit β on labelled default panel; PD_C = σ(Xβ), X = [ESG, GHG, leverage, size, macro]
GBM MC: A_t = A0·exp((μ−0.5σ²)t+σ√t Z) with climate-shocked μ; antithetic variates; PD_D=P(min A_t<K)
Blend:  PD = Σ_m PD_m/σ_m² / Σ_m 1/σ_m²  (inverse-variance)
ECL_life = Σ_t marginalPD_t·LGD·EAD_t·DF_t
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Logit β | — | historical default panel (S&P/Moody's) |
| σ_A | — | de-levered equity vol |
| climateDrift | — | NGFS Phase IV / EBA multipliers |
| LGD | — | Basel recovery / PCAF |
| Staging τ | — | IFRS 9 SICR policy |

### 8.4 Data requirements
Obligor financials, equity vol, ratings/default history for logit fit, NGFS scenario variables. Platform
holds `SECTOR_CFG`, LGD ladder and `climate_scenarios` tables; real defaults would replace the seeded
inputs.

### 8.5 Validation & benchmarking plan
Calibration curve and Brier score vs realised defaults; discriminatory power (AUC/Gini) for the logit;
reconcile Merton PD vs Moody's EDF; MC convergence and variance checks; staging tie-out vs IFRS 9
provisions; conviction metric validated as a genuine dispersion indicator.

### 8.6 Limitations & model risk
Merton is weak for financials; logit needs a large clean default set the platform lacks; MC drift under
climate shocks is highly uncertain. Conservative fallback: when branches disagree sharply (low
conviction), take the max PD and route to manual review rather than the mean.
