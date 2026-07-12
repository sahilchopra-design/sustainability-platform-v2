# Multi-Factor Integration
**Module ID:** `multi-factor-integration` · **Route:** `/multi-factor-integration` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Simultaneous integration of ESG quality, smart beta (value, momentum, low volatility, quality), and macroeconomic factors in portfolio construction and risk attribution. Uses Barra-style factor model frameworks to decompose portfolio active return and risk across ESG, style, sector, and macro dimensions. Enables ESG-tilted factor portfolios that control for unintended sector and style biases while preserving ESG signal integrity.

> **Business value:** Enables systematic equity managers to build ESG-integrated factor portfolios that capture proven risk premia while maintaining ESG quality standards, with full transparency into factor interaction effects and active risk sources.

**How an analyst works this module:**
- Configure the factor model by selecting ESG signal source, smart beta factors, and macro overlay signals
- Set factor signal weights using IC-based or equal-weight combination and review composite alpha signal
- Run multi-factor optimisation with ESG score floor, sector, and tracking error constraints
- Analyse factor contribution to active risk and return using the Barra-style attribution decomposition
- Rebalance portfolio quarterly and review factor drift to determine whether reoptimisation is triggered

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_COMMODITY_SCORES`, `Btn`, `CIRCULAR_METRICS`, `COMMODITIES`, `COMMODITY_META`, `CORRELATION_MATRIX`, `CROSS_COMMODITY_CORR`, `DIMENSIONS`, `KPI`, `PROJECTION_YEARS`, `REGULATIONS`, `SCENARIOS`, `STAGES`, `STAKEHOLDERS`, `STAKEHOLDER_MONETIZATION`, `Sec`, `TRUE_COST_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DIMENSIONS` | 4 | `name`, `color`, `defaultWeight`, `description` |
| `CORRELATION_MATRIX` | 11 | `correlation`, `interpretation` |
| `STAKEHOLDERS` | 7 | `financial`, `esg`, `climate` |
| `REGULATIONS` | 9 | `dimension`, `threshold`, `alignment`, `impactFactor`, `affectedDim` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `base` | `ci * 41 + 11;` |
| `ALL_COMMODITY_SCORES` | `COMMODITIES.map((name, ci) => {` |
| `preds` | `[1, 2, 3, 4, 5].map(s => decisionStump(features, dim, s * 10 + di));` |
| `data` | `allScored.map(c => [c.finAvg, c.esgAvg, c.climAvg]);` |
| `means` | `[0, 1, 2].map(j => data.reduce((s, r) => s + r[j], 0) / data.length);` |
| `centered` | `data.map(r => r.map((v, j) => v - means[j]));` |
| `cov` | `[0, 1, 2].map(i => [0, 1, 2].map(j => centered.reduce((s, r) => s + r[i] * r[j], 0) / (data.length - 1)));` |
| `eigenvalues` | `cov.map((row, i) => row[i]); // diagonal approximation` |
| `totalVar` | `eigenvalues.reduce((a, b) => a + b, 0);` |
| `explainedVar` | `eigenvalues.map(e => Math.round((e / totalVar) * 100));` |
| `projected` | `centered.map((r, i) => ({` |
| `tierNames` | `['Gold', 'Silver', 'Bronze', 'At-Risk', 'Critical'];` |
| `sorted` | `[...allScored].sort((a, b) => a.overall - b.overall);` |
| `chunkSize` | `Math.ceil(sorted.length / 5);` |
| `clustered` | `sorted.map((c, i) => ({` |
| `centroids` | `tierNames.map((tier, ti) => {` |
| `TRUE_COST_DATA` | `COMMODITIES.map((name, i) => {` |
| `marketPrice` | `Math.round(seed(base) * 8000 + 500);` |
| `envExternality` | `Math.round(seed(base + 1) * 4000 + 200);` |
| `socialExternality` | `Math.round(seed(base + 2) * 2000 + 100);` |
| `healthExternality` | `Math.round(seed(base + 3) * 1500 + 50);` |
| `trueCost` | `marketPrice + envExternality + socialExternality + healthExternality;` |
| `CIRCULAR_METRICS` | `COMMODITIES.map((name, i) => ({` |
| `corr` | `Math.round((seed(i * 37 + j * 13 + 999) * 2 - 1) * 100) / 100;` |
| `STAKEHOLDER_MONETIZATION` | `COMMODITIES.map((name, i) => ({` |
| `projections` | `SCENARIOS.map(scenario => {` |
| `impacts` | `REGULATIONS.map(reg => {` |
| `adjustedScore` | `Math.max(10, Math.min(100, base[dimKey] + magnitude));` |
| `newFinAvg` | `impacts.filter(i => i.dimension === 'finance').reduce((s, i) => s + i.impact, base.finAvg);` |
| `newEsgAvg` | `impacts.filter(i => i.dimension === 'esg').reduce((s, i) => s + i.impact, base.esgAvg);` |
| `newClimAvg` | `impacts.filter(i => i.dimension === 'climate_nature').reduce((s, i) => s + i.impact, base.climAvg);` |
| `newComposite` | `Math.round(0.35 * Math.max(10, newFinAvg) + 0.35 * Math.max(10, newEsgAvg) + 0.30 * Math.max(10, newClimAvg));` |
| `holdings` | `p.holdings.map(h => {` |
| `portfolio` | `useMemo(() => { const p = readPortfolio(); return p ? p.holdings : demoHoldings(); }, []);  // Weight normalization const totalW = wFinance + wESG + wClimate;` |
| `normF` | `totalW > 0 ? (wFinance / totalW) * 100 : 33.3;` |
| `normE` | `totalW > 0 ? (wESG / totalW) * 100 : 33.3;` |
| `normC` | `totalW > 0 ? (wClimate / totalW) * 100 : 33.3;` |
| `allScored` | `useMemo(() => { return ALL_COMMODITY_SCORES.map(c => { const scored = computeComposite(c.stages, normF, normE, normC);` |
| `overall` | `Math.round(scored.reduce((s, st) => s + st.composite, 0) / scored.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMMODITIES`, `CORRELATION_MATRIX`, `DIMENSIONS`, `PROJECTION_YEARS`, `REGULATIONS`, `SCENARIOS`, `STAGES`, `STAKEHOLDERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Factor IC (Information Coefficient) | — | Rolling 12-month backtest | Correlation between ESG signal and forward 12-month returns; positive IC validates ESG as a return factor |
| Active Factor Exposure (β vs. benchmark) | — | Barra factor model attribution | Active loading on each factor relative to benchmark; near-zero indicates unintended factor bets are neutralised |
| Factor Diversification Ratio | — | Portfolio construction analytics | Ratio of weighted average factor volatility to portfolio volatility; higher values indicate better factor diversification |
| Tracking Error (%) | — | Ex-ante risk model | Expected annualised active return volatility relative to benchmark from multi-factor risk model |
- **ESG ratings and raw pillar scores** → Z-score by sector to remove sector bias; compute ESG alpha signal → **Sector-neutralised ESG factor signal per security**
- **Financial statement and price data** → Compute smart beta factor scores: B/P, momentum, low vol, profitability, investment → **Multi-factor alpha signal matrix for optimisation input**
- **Barra factor covariance matrix** → Decompose portfolio variance into factor and specific components; compute ex-ante TE → **Factor attribution: active return and risk decomposition by factor type**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-Factor Portfolio Optimisation
**Headline formula:** `max αᵀw − λ wᵀΣw subject to constraints`

Portfolio weights (w) are optimised to maximise expected multi-factor alpha (α) minus a risk-aversion-scaled (λ) variance term using the factor covariance matrix (Σ). Factor alphas for ESG, value, momentum, quality, and macro combine via information coefficient-weighted composite signal. Constraints enforce sector, country, and single-stock limits alongside ESG minimum score floors.

**Standards:** ['MSCI Barra Global Equity Factor Model GEM3 Documentation', 'Fama & French Five-Factor Model 1993/2015', 'MSCI ESG Ratings Methodology 2023', 'Grinold & Kahn â€” Active Portfolio Management 2000']
**Reference documents:** Fama & French â€” Common Risk Factors in the Returns on Stocks and Bonds (1993); MSCI Barra Global Equity Model GEM3 Research Notes; Grinold & Kahn â€” Active Portfolio Management 2nd Edition 2000; MSCI ESG Ratings Methodology 2023; Asness, Frazzini, Pedersen â€” Quality Minus Junk (2019)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Barra-style multi-factor
> equity portfolio optimiser** — `max αᵀw − λ wᵀΣw`, ESG/value/momentum/quality/macro factor alphas,
> information-coefficient weighting, tracking-error and sector constraints, factor-covariance risk
> attribution. **None of that exists in the code.** What the page (`MultiFactorIntegrationPage.jsx`,
> 1,585 lines) actually implements is a **25-commodity lifecycle sustainability scorer**: it scores
> each commodity across 6 value-chain stages on three dimensions (Financial, ESG, Climate & Nature),
> then runs a bundle of "ML-flavoured" routines — gradient-boosted decision stumps, a diagonal-approx
> PCA, and a sort-into-quintiles "K-Means" — over *seeded synthetic* scores. There is no covariance
> optimisation, no factor alpha, no tracking error. The sections below document the code.

### 7.1 What the module computes

For 25 commodities × 6 lifecycle stages (`Extraction … End of Life`), `genScores(ci)` fabricates 14
metrics per stage from the platform PRNG, then a weighted composite:

```js
composite = round((wF/100)·financial + (wE/100)·esg + (wC/100)·climate_nature)   // per stage
overall   = mean(stage composites)                                               // per commodity
```

Dimension weights default 35/35/30 and are **renormalised** to sum to 100 (`normF = wFinance/totalW·100`).
Companion computations: a **true-cost** table (`trueCost = marketPrice + env + social + health`
externalities), circular-economy metrics, a hand-authored dimension-correlation matrix, stakeholder
monetisation, and a regulatory-impact overlay.

### 7.2 Parameterisation / scoring rubric

| Construct | Formula (from code) | Provenance |
|---|---|---|
| Stage financial | `round(seed(sb)·40 + 35)` → 35–75 | Synthetic (`seed` PRNG) |
| Stage ESG | `round(seed(sb+1)·50 + 25)` → 25–75 | Synthetic |
| Stage climate | `round(seed(sb+2)·45 + 30)` → 30–75 | Synthetic |
| True-cost externalities | env `·4000+200`, social `·2000+100`, health `·1500+50` | Synthetic (TCA framing) |
| Composite weights | 35 % / 35 % / 30 % | `DIMENSIONS[].defaultWeight` (author choice) |
| ML composite | `0.35·fin + 0.35·esg + 0.30·clim` | Hard-coded in `multiFactorML` |
| Correlation matrix | Fin↔Climate 0.68, Climate↔Biodiv 0.71, Climate↔Circular −0.62 … | Hand-authored constants |
| Regulatory impact factors | CBAM +12, EUDR −15, CSDDD −10, EU Taxonomy −8 | Author heuristics on real reg names |

`COMMODITY_META` carries **real regulatory scoping flags** (`cbamExposed`, `eudrScope`,
`euTaxAligned`, `csdddTier`) per commodity — e.g. Palm Oil/Soy/Cocoa flagged `eudrScope:true`,
matching the EU Deforestation Regulation's seven-commodity list; Iron Ore/Copper/Aluminium-family
flagged `cbamExposed:true`, matching CBAM's covered goods.

### 7.3 Calculation walkthrough

1. `ALL_COMMODITY_SCORES` seeds 25×6 stage records at module load.
2. On weight change, `allScored` recomputes composites and per-commodity averages (`finAvg`, `esgAvg`,
   `climAvg`, `extGap`, `circPot`, `waterAvg`, `biodivAvg`).
3. `kMeansCluster` **sorts by `overall` ascending and chops into 5 equal quintiles** labelled
   Gold→Critical — this is quantile binning, not k-means (no centroid iteration on the assignment;
   centroids are computed *after* the fixed quintile split, purely descriptively).
4. `computePCA` centres the 3-D `[finAvg, esgAvg, climAvg]` matrix, builds a 3×3 covariance, then
   takes the **diagonal as "eigenvalues"** (comment: `// diagonal approximation`) for explained-variance,
   and projects with **fixed loading vectors** `(0.6, 0.5, 0.4)` / `(−0.3, 0.7, −0.5)` — not derived
   from the data.
5. `multiFactorML` runs 5 `decisionStump` weak learners per dimension and averages them; each stump is
   an `if/else` threshold tree with a `seed`-jittered split and an 8-point noise term.
6. `computeRegulatoryImpact` adds the applicable regulations' `impactFactor` to the affected dimension
   average, gated by the commodity's real scoping flags, and recomputes a post-regulation composite.

### 7.4 Worked example (Copper, default weights, one stage)

Take Copper (`ci` index 2 → `base = 2·41+11 = 93`), stage 0 (`sb = 93`), weights 35/35/30:

| Step | Computation | Result |
|---|---|---|
| financial | `round(seed(93)·40 + 35)` | e.g. 61 |
| esg | `round(seed(94)·50 + 25)` | e.g. 48 |
| climate | `round(seed(95)·45 + 30)` | e.g. 55 |
| stage composite | `0.35·61 + 0.35·48 + 0.30·55` = 21.35+16.8+16.5 | **55** |

Copper is `cbamExposed:true`, so in the regulatory tab CBAM applies `+12` to `finAvg` (higher cost =
worse financial score) while EUDR is skipped (`eudrScope:false`). If `finAvg=58`, post-CBAM
`finAvg=70`, feeding `newComposite = round(0.35·70 + 0.35·esgAvg + 0.30·climAvg)`.

### 7.5 Data provenance & limitations

- **Every numeric score is synthetic**, generated by `seed(s)=frac(sin(s+1)·10⁴)` — the platform's
  standard seeded PRNG. Stable across renders, but no commodity in the table carries a real price,
  emissions factor, or ESG rating. The only real content is the regulatory scoping metadata and the
  hand-authored correlation/regulation constants.
- The "ML ensemble", "PCA" and "K-Means" are **cosmetic**: quantile binning masquerades as clustering,
  a diagonal covariance and fixed loadings masquerade as PCA, and threshold `if/else` trees with PRNG
  jitter masquerade as gradient boosting. None fit parameters to data.
- No optimisation, no covariance risk model, no factor returns — so the guide's `αᵀw − λwᵀΣw`
  headline is entirely aspirational.

**Framework alignment:** EU Taxonomy (DNSH screening, referenced) · CBAM (carbon border adjustment,
scoping flags correct) · EUDR (7-commodity deforestation list, correctly applied) · CSDDD / CSRD /
TNFD / SFDR (named in the regulatory overlay as score deltas). True-cost accounting follows the
externality-internalisation logic of TEEB / Trucost. The Barra GEM3 / Fama-French factor apparatus in
the guide is **not implemented**.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide promises a factor model; the code
delivers seeded lifecycle scores. Below is the investor-grade multi-factor equity model the route
*should* run.

### 8.1 Purpose & scope
Decompose active return and active risk of an ESG-tilted equity portfolio (300–3,000 names, global
developed + EM large/mid cap) across style, sector, country, and ESG factors, and support optimisation
of ESG-tilted portfolios subject to tracking-error and exposure constraints.

### 8.2 Conceptual approach
A cross-sectional linear factor model in the Barra GEM3 / Axioma tradition, augmented with an ESG factor
(Fama-French 5-factor + momentum as the style spine, MSCI ESG rating z-score as the sixth). Benchmarks:
**MSCI Barra GEM3** (factor structure, specific-risk model) and **Grinold-Kahn active management** (IC →
alpha, `IR = IC·√breadth`). Optimisation mirrors **Axioma / BlackRock Aladdin** mean-variance with
linear constraints.

### 8.3 Mathematical specification
Return model: `rᵢ = Σₖ Xᵢₖ fₖ + uᵢ`, where `Xᵢₖ` is exposure of stock *i* to factor *k* (standardised
descriptor z-scores), `fₖ` factor returns estimated by cross-sectional WLS regression each period
(weights `√marketcap`), `uᵢ` specific return. Factor-covariance `F = cov(f)` (EWMA, half-life 90d,
Newey-West lag 5). Portfolio risk: `σ²(w−b) = (w−b)ᵀ X F Xᵀ (w−b) + (w−b)ᵀ Δ (w−b)`, `Δ` = diagonal
specific variance. Composite alpha: `αᵢ = Σₖ ICₖ·zᵢₖ / Σ|ICₖ|`, ESG signal sector-neutralised
(`z' = z − sector-mean`). Optimise `max wᵀα − λ(w−b)ᵀΣ(w−b)` s.t. `Σw=1`, `|wᵢ−bᵢ|≤c`, sector/country
active `≤±3%`, ESG portfolio score `≥ floor`, TE `≤ target`.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Factor set | k | Fama-French 5 + WML momentum + MSCI ESG |
| Cov half-life | — | 90d (Barra GEM3 short-horizon) |
| Risk aversion | λ | Solved to hit TE target (2–4 %) |
| Factor ICs | ICₖ | Rolling 12m Spearman(signal, fwd return) |
| ESG descriptor | z | MSCI ESG letter → numeric, sector z-scored |
| Specific risk | Δ | Structural specific-risk model (Barra) |

### 8.4 Data requirements
Prices/returns, market cap, book value, gross profit, asset growth (Compustat/Refinitiv); MSCI ESG
ratings + pillar scores (already partially in platform ESG contexts); GICS sector/country; benchmark
constituent weights. Platform already carries `GLOBAL_COMPANY_MASTER` (ISIN, sector, scope1, market cap)
— a viable exposure spine.

### 8.5 Validation & benchmarking plan
Backtest: monthly rebalanced long-only tilt vs benchmark, 10y, report IR, TE realised-vs-predicted
(bias statistic 0.9–1.1), factor-return t-stats. Cross-check factor covariance against Barra GEM3 and
Axioma AXWW4; reconcile ESG-neutralised alpha decay against MSCI ESG research. Stress: sector-shock
and 2020/2022 factor-crash replays.

### 8.6 Limitations & model risk
Linear factor models miss non-linear/regime effects; ESG-as-a-factor premium is contested (weak, sector-
confounded IC); short covariance half-life over-reacts to crises. Conservative fallback: cap ESG active
exposure, widen TE band, and gate optimisation on factor-return significance.

## 9 · Future Evolution

### 9.1 Evolution A — Resolve the identity crisis: ship the actual factor optimiser (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag is total: the guide promises a Barra-style optimiser (`max αᵀw − λ wᵀΣw`, IC-weighted ESG/value/momentum/quality/macro alphas, tracking-error constraints), but `MultiFactorIntegrationPage.jsx` (1,585 lines) actually implements a 25-commodity lifecycle sustainability scorer over seeded synthetic scores, with "ML-flavoured" routines (decision stumps, diagonal-approx PCA, quintile-sort "K-Means") on fabricated inputs. Evolution A makes the module what its name and guide claim: a real multi-factor ESG portfolio optimiser as a first backend vertical.

**How.** (1) New engine `services/multi_factor_engine.py` + route: mean-variance optimisation via scipy (`scipy.optimize.minimize` with sector/single-stock/ESG-floor constraints — the roadmap names scipy optimisation as the rung-5 toolset; here it is the rung-1-done-right core). (2) Inputs from platform assets: `portfolios_pg` holdings, ESG scores from the refdata layer, and factor exposures estimated from ingested market-data history rather than invented. (3) The commodity-lifecycle content — the genuinely interesting true-cost table (`marketPrice + env + social + health`) — should be split out or explicitly renamed, not deleted; today it squats on the wrong module ID and misleads the Atlas.

**Prerequisites.** Decision on the commodity scorer's destination (rename vs migrate); the `genScores` PRNG fabrication must not survive into any renamed module — it violates the platform's purged random-as-data rule. **Acceptance:** optimiser reproduces a hand-computable 3-asset case in `bench_quant`; ESG-floor constraint binds visibly (raising the floor changes weights).

### 9.2 Evolution B — Portfolio-construction analyst over the new optimiser (LLM tier 2)

**What.** Once Evolution A exists, a tool-calling analyst that runs constrained optimisations conversationally: "tilt max 2% tracking error toward quality and ESG, cap energy at 8%", then explains the resulting weights via the optimiser's own attribution output (which constraints bound, marginal contribution to risk per factor). Until then, no LLM layer should ship — §7 shows the current page's numbers are seeded-synthetic, and a copilot narrating fabricated factor scores would launder them into apparent authority.

**How.** Tool schema over the new `POST /optimize` endpoint with the constraint set as typed parameters; system prompt from the rewritten Atlas §5 (Grinold-Kahn/Barra references are already the named standards). The analyst's explanations must derive from returned diagnostics — binding-constraint list, factor covariance contributions — with the no-fabrication validator matching every weight and risk number to the tool response. Mutating actions (saving a rebalance to `portfolios_pg`) gate behind explicit confirmation per the roadmap's Tier-2 RBAC pattern.

**Prerequisites (hard).** Evolution A in full — this is the one module in the batch where the LLM evolution has a strict dependency, because there is currently no real analytical surface to ground on. **Acceptance:** every quoted weight/TE/alpha traceable to an optimiser response; asking "what's the expected return?" when no alpha model is configured yields a refusal, not a Barra-flavoured guess.