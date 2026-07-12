# DME PD Engine
**Module ID:** `dme-pd-engine` · **Route:** `/dme-pd-engine` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Probability of default adjustment model that integrates Dynamic Materiality Engine scores into credit risk assessment, producing ESG-adjusted PD estimates for loan and bond portfolios. Quantifies how material ESG topics translate into credit deterioration risk. Supports IFRS 9 staging and ECB supervisory disclosure requirements.

> **Business value:** Integrates ESG risk into credit decisions by producing defensible, model-based PD adjustments anchored to empirical data. Supports IFRS 9 staging, ECB supervisory expectations, and loan pricing adjustments for ESG-elevated credit risk.

**How an analyst works this module:**
- Ensure DME materiality scores are current for all credit obligors in the portfolio
- Review β and α calibration parameters in PD Engine Settings and update with latest empirical data
- Run the PD adjustment and review the obligor-level PD uplift table
- Flag entities with PD uplift above the IFRS 9 staging threshold for enhanced credit review

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLLATERAL_TYPES`, `ENTITIES`, `LGD_BY_COLLATERAL`, `REGIONS`, `SECTORS`, `SECTOR_CFG`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `mertonDD` | `(A,D,r,sigma,t_yrs)=>(Math.log(A/D)+(r+0.5*sigma**2)*t_yrs)/(sigma*Math.sqrt(Math.max(0.0001,t_yrs)));` |
| `logistic` | `(x)=>1/(1+Math.exp(-x));` |
| `branchA` | `(pdBase,alpha,vT)=>Math.min(0.999,Math.max(0.0001,pdBase*Math.exp(alpha*vT)));` |
| `logit` | `beta0+beta1*esg+beta2*ghg+beta3*rev+beta4;` |
| `REGIONS` | `['North America','Europe','Asia-Pacific','Latin America','Middle East'];` |
| `region` | `REGIONS[Math.floor(sr(i*7)*REGIONS.length)];` |
| `esgScore` | `Math.round(20+sr(i*11)*75);` |
| `ghgIntensity` | `+(100+sr(i*13)*400).toFixed(0);   // tCO2e/$M` |
| `revenueGrowth` | `+(sr(i*17)*0.15-0.03).toFixed(3); // -3% to +12%` |
| `assetVal` | `Math.round(500+sr(i*23)*4500);          // $M` |
| `debtFace` | `Math.round(assetVal*(0.25+sr(i*29)*0.45));` |
| `assetVol` | `+(0.12+sr(i*31)*0.32).toFixed(3);` |
| `pdBase` | `+(0.005+sr(i*43)*0.07).toFixed(5);` |
| `ead` | `Math.round(debtFace*(0.8+sr(i*47)*0.3));     // $M EAD` |
| `collateralIdx` | `Math.floor(sr(i*53)*COLLATERAL_TYPES.length);` |
| `pdC` | `+branchC(cfg.b0,cfg.b1,esgScore,cfg.b2,ghgIntensity/1000,cfg.b3,revenueGrowth,cfg.b4).toFixed(5);` |
| `pdD` | `+branchD_mc(assetVal,debtFace,mu,assetVol,3,i+1).toFixed(5);` |
| `pdConsensus` | `+((pdA*0.25+pdB*0.30+pdC*0.20+pdD*0.25)).toFixed(5);` |
| `pdMean` | `pdArr.reduce((s,v)=>s+v,0)/4;` |
| `pdStd` | `Math.sqrt(pdArr.reduce((s,v)=>s+(v-pdMean)**2,0)/4);` |
| `conviction` | `+(Math.max(0,1-pdStd/Math.max(0.0001,pdMean))).toFixed(3);` |
| `pdLifetime` | `+Math.min(1,pdConsensus*3.2).toFixed(5);` |
| `ecl` | `+(pdConsensus*lgd*ead).toFixed(2);           // $M ECL` |
| `ecl12m` | `+(pd12m*lgd*ead).toFixed(2);` |
| `lambda1` | `+(-Math.log(Math.max(0.0001,1-pd12m))/1).toFixed(5);` |
| `consensusEntities` | `useMemo(()=>{ const wSum=wA+wB+wC+wD;` |
| `pdW` | `wSum>0?(e.pdA*wA+e.pdB*wB+e.pdC*wC+e.pdD*wD)/wSum:e.pdConsensus;` |
| `elW` | `+(pdW*e.lgd*e.ead).toFixed(2);` |
| `portKPIs` | `useMemo(()=>{ const n=Math.max(1,ENTITIES.length);` |
| `avgPD` | `(ENTITIES.reduce((s,e)=>s+e.pdConsensus,0)/n);` |
| `avgDD` | `(ENTITIES.reduce((s,e)=>s+e.dd,0)/n);` |
| `totalECL` | `ENTITIES.reduce((s,e)=>s+e.ecl,0);` |
| `regimeDist` | `SECTORS.map(s=>({sector:s.slice(0,6),avgPD:+(ENTITIES.filter(e=>e.sector===s).reduce((a,e)=>a+e.pdConsensus,0)/Math.max(1,ENTITIES.filter(e=>e.sector===s).length)*100).toFixed(2)}));` |
| `alphaData` | `SECTORS.map(s=>({sector:s.slice(0,6),alpha:SECTOR_CFG[s].alpha}));` |
| `sensitivity` | `SECTORS.map(s=>{` |
| `coeffTable` | `SECTORS.map(s=>({sector:s,...SECTOR_CFG[s]}));` |
| `marginalESG` | `SECTORS.map(s=>{` |
| `avgGHG` | `es.reduce((a,e)=>a+e.ghgIntensity,0)/es.length/1000;` |
| `avgRev` | `es.reduce((a,e)=>a+e.revenueGrowth,0)/es.length;` |
| `pdGHG1` | `branchC(cfg.b0,cfg.b1,55,cfg.b2,avgGHG+0.01,cfg.b3,avgRev,cfg.b4);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg PD Uplift (Portfolio) | — | DME PD engine | Mean ESG-driven probability of default increase across the credit portfolio |
| Entities with PD Uplift > 100 bps | — | PD engine | Count of borrowers where ESG materiality drives a PD uplift exceeding 100 basis points |
| Portfolio Weighted PD (ESG-Adjusted) | — | PD aggregation | Exposure-weighted average ESG-adjusted PD across the full credit portfolio |
| β Calibration R² | — | Historical calibration | Goodness of fit of the ESG-PD relationship estimated from historical default and ESG score data |
- **DME materiality scores (all credit obligors)** → PD multiplier calculation: exp(α + β × MaterialityScore) → **ESG-adjusted PD per obligor with base vs. adjusted comparison**
- **Base credit model PD (internal ratings or external agency)** → Log-linear adjustment application and portfolio exposure weighting → **Exposure-weighted portfolio ESG-adjusted PD**
- **Historical default and ESG score dataset (calibration)** → Logistic regression to estimate β and sector α parameters → **Calibrated β/α coefficients with goodness-of-fit statistics**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG-Adjusted PD
**Headline formula:** `PDₐₛᵍ = PDᵇᵃˢᵉ × exp(α + β × MaterialityScore)`

The ESG-adjusted PD applies a log-linear multiplier to the base credit model PD, where β is calibrated to historical ESG-credit correlation data. A MaterialityScore of 80/100 with a calibrated β of 0.008 increases PD by approximately 90%. α is a sector-specific intercept controlling for base-rate differences.

**Standards:** ['ECB Guide on Climate Risks in Credit', 'NGFS Supervisory Scenario PD Adjustments', 'IFRS 9 Staging Criteria']
**Reference documents:** ECB (2022) Guide on Climate-related and Environmental Risks in Credit Risk Management; NGFS (2023) Scenarios â€” Credit Risk Calibration Technical Note; IFRS 9 (2014) Financial Instruments â€” Staging and Expected Credit Loss; EBA (2022) Guidelines on Management of ESG Risks in Credit Institutions

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Server-side engine with genuinely calibrated β/α (analytics ladder: rung 2 → 3)

**What.** The §7 assessment: "the platform's most complete probability-of-default implementation" — four branches (Exponential, Merton DD, Sector Logit, Monte-Carlo GBM with 500 Box-Muller paths) blended 0.25/0.30/0.20/0.25 into a consensus with IFRS 9 staging, LGD-by-collateral, ECL, hazard-rate term structure, and a conviction metric. "The methodology is genuine; the 40-entity universe is synthetic." Worse, the page displays a "β Calibration R²" KPI with no calibration behind it, and the `SECTOR_CFG` logit coefficients are authored, not estimated. Evolution A moves the engine server-side and makes the calibration real.

**How.** (1) Port the four branches verbatim to `services/dme_pd_engine.py` + `api/v1/routes/dme_pd.py` (this is also where dme-entity's and dme-dashboard's §9 entries relocate their duplicated Merton code — one owner, three consumers). (2) Obligors from `portfolios_pg` holdings enriched via the company master; ESG/GHG inputs from real fields, honest-null where absent instead of `sr()` ranges. (3) Calibration: estimate the sector-logit β vector on a public default dataset joined to ESG scores (e.g. rating-transition histories), report actual R²/AUC in the response — the currently-decorative calibration KPI becomes load-bearing. (4) Pin all four branches plus the consensus into `bench_quant.py` with a worked obligor; the MC branch gets a fixed-seed reproducibility test.

**Prerequisites.** A defensible default-history dataset (licensing decision); demo portfolio at D0 scale. **Acceptance:** bench pins pass; the displayed R² equals the persisted calibration run's statistic; conviction metric flags the fixture obligor where branches genuinely disagree.

### 9.2 Evolution B — Credit-review analyst for staging and pricing decisions (LLM tier 2)

**What.** A tool-calling analyst for the workflow in the overview: "which obligors crossed the IFRS 9 staging threshold this quarter and why?" It queries Evolution A's endpoints, decomposes each uplift by branch (was it Merton leverage, the sector logit's GHG term, or transition velocity?), cites the conviction score when branches disagree, and drafts the enhanced-credit-review memo with the ECL delta — every figure from tool output.

**How.** Tool schemas from the new PD route's OpenAPI spec; grounding corpus = this Atlas record's §7.1 branch formulas so the analyst explains `pdC = σ(β0 + β1·ESG + β2·GHG/1000 + β3·revGrowth + β4)` exactly as implemented. What-ifs ("PD if ESG score improves 10 points") are re-computation calls, not in-context arithmetic. Staging *decisions* remain human: the analyst drafts, the credit officer confirms — consistent with ECB expectations that model outputs inform, not replace, judgment.

**Prerequisites (hard).** Evolution A — the current page would have the copilot defending PD uplifts derived from seeded balance sheets, and its uncalibrated "R²" would be quoted as model validation, a supervisory red flag. **Acceptance:** a golden obligor's narrated decomposition matches branch outputs to 5 decimal places; asking for a PD confidence interval (not computed) refuses rather than inventing one.