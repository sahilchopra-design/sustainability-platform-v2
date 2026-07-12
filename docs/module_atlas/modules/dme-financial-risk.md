# DME Financial Risk
**Module ID:** `dme-financial-risk` · **Route:** `/dme-financial-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantification of financial risks arising from material ESG topics identified by the Dynamic Materiality Engine. Maps material topics to balance sheet, income statement, and valuation impacts using scenario-based magnitude estimation. Outputs feed TCFD financial risk disclosures and internal stress testing.

> **Business value:** Translates abstract ESG materiality scores into quantified balance sheet and earnings impacts that financial risk managers and CFOs can act on. Provides the financial risk quantification backbone for TCFD and ESRS SBM-3 disclosures.

**How an analyst works this module:**
- Review the top material topics from the DME Entity View before using this module
- Assign financial magnitude estimates per topic using scenario data or the built-in sector benchmark library
- Run the EFRS calculation and review the waterfall chart showing contribution by topic
- Export the TCFD risk quantification table for integration into the annual financial statements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ENTITIES`, `KpiGrid`, `NGFS_DATA`, `NGFS_SC`, `PNL_HIST`, `RATE_SHOCKS`, `RATINGS`, `REGIONS`, `RISK_LIMITS`, `SECTORS`, `TABS`, `TabConcentration`, `TabECL`, `TabIRRisk`, `TabLimits`, `TabLiquidity`, `TabMarketRisk`, `TabNGFS`, `TabOperational`, `TabOverview`, `TabWACC`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RISK_LIMITS` | 16 | `current`, `limit`, `unit` |
| `TABS` | 11 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `(str) => str.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 5381);` |
| `dv01` | `(dur, price) => dur * price / 10000;` |
| `lcr` | `(hqla, netOutflows) => netOutflows > 0 ? hqla / netOutflows * 100 : 999;` |
| `nsfr` | `(asf, rsf) => rsf > 0 ? asf / rsf * 100 : 999;` |
| `eclCalc` | `(pd, lgd, ead, df) => pd * lgd * ead * (df \|\| 1);` |
| `REGIONS` | `["North America","Europe","Asia-Pacific","Emerging Markets","Middle East"];` |
| `rating` | `RATINGS[Math.floor(sr(i * 3) * RATINGS.length)];` |
| `region` | `REGIONS[Math.floor(sr(i * 5) * REGIONS.length)];` |
| `weight` | `+(0.015 + sr(i * 7) * 0.035).toFixed(4);` |
| `returns` | `Array.from({ length: 252 }, (_, d) => (sr(i * 1000 + d) - 0.5) * 0.04);` |
| `sorted` | `[...returns].sort((a, b) => a - b);` |
| `var95` | `+Math.abs(sorted[Math.floor(252 * 0.05)]).toFixed(5);` |
| `var99` | `+Math.abs(sorted[Math.floor(252 * 0.01)]).toFixed(5);` |
| `var10d` | `+(var95 * Math.sqrt(10)).toFixed(5);` |
| `cvar95` | `+Math.abs(sorted.slice(0, Math.floor(252 * 0.05)).reduce((s, v) => s + v, 0) / Math.max(1, Math.floor(252 * 0.05))).toFixed(5);` |
| `beta` | `+(0.6 + sr(i * 11) * 1.2).toFixed(3);` |
| `climPrem` | `+(0.005 + sr(i * 13) * 0.025).toFixed(4);` |
| `creditSp` | `+(0.01 + sr(i * 17) * 0.04).toFixed(4);` |
| `strandHc` | `+(sr(i * 19) * 0.015).toFixed(4);` |
| `eRatio` | `+(0.4 + sr(i * 23) * 0.4).toFixed(3);` |
| `wacc` | `+(ke * eRatio + kd * (1 - tax) * dRatio).toFixed(5);` |
| `waccBase` | `+(( rf + beta * erp) * eRatio + (creditSp * (1 - tax)) * dRatio).toFixed(5);` |
| `waccBps` | `Math.round((wacc - waccBase) * 10000);` |
| `hqla` | `+(100 + sr(i * 29) * 900).toFixed(1);` |
| `out30d` | `+(60 + sr(i * 31) * 400).toFixed(1);` |
| `asf` | `+(80 + sr(i * 37) * 800).toFixed(1);` |
| `rsf` | `+(70 + sr(i * 41) * 700).toFixed(1);` |
| `lgd` | `+(0.25 + sr(i * 47) * 0.45).toFixed(4);` |
| `ead` | `+(10 + sr(i * 53) * 490).toFixed(1);` |
| `eclLife` | `+(ecl12m * (3 + sr(i * 61) * 5)).toFixed(2);` |
| `zScore` | `+((pd - 0.02) / 0.015 + sr(i * 63) * 1.5).toFixed(3);` |
| `coupon` | `+(0.03 + sr(i * 67) * 0.05).toFixed(4);` |
| `grossInc` | `+(20 + sr(i * 71) * 180).toFixed(1);` |
| `oprCap` | `+(grossInc * 0.15).toFixed(2);` |
| `carbonInt` | `Math.round(20 + sr(i * 73) * 480);` |
| `wSum` | `ENTITIES.reduce((s, e) => s + e.weight, 0);` |
| `wNorm` | `ENTITIES.map(e => e.weight / Math.max(0.0001, wSum));` |
| `portVaR95` | `+(ENTITIES.reduce((s, e, i) => s + e.var95 * wNorm[i], 0)).toFixed(5);` |
| `portCVaR` | `+(ENTITIES.reduce((s, e, i) => s + e.cvar95 * wNorm[i], 0)).toFixed(5);` |
| `portWACC` | `+(ENTITIES.reduce((s, e, i) => s + e.wacc * wNorm[i], 0)).toFixed(5);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS_SC`, `RATE_SHOCKS`, `RATINGS`, `REGIONS`, `RISK_LIMITS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Financial Risk Exposure | — | DME financial risk engine | Aggregate financial magnitude of all material ESG risks across all topics at 70th percentile severity |
| Highest Risk Topic | — | Topic risk attribution | Material topic contributing the largest financial exposure to the aggregate EFRS |
| EBITDA at Risk (1.5°C scenario) | — | Scenario engine | Estimated EBITDA reduction under an orderly 1.5°C transition scenario over a 5-year horizon |
| Risk-Weighted Materiality Score | — | EFRS calculation | Materiality score weighted by financial exposure magnitude across all active topics |
- **DME materiality scores (financial materiality dimension per topic)** → Topic selection filter: financial material topics only → **Financial material topic list with base materiality scores**
- **Scenario-based magnitude library (sector benchmarks, NGFS data)** → Topic-to-financial-impact mapping with magnitude percentage ranges by scenario → **Magnitude estimates in $ and % EBITDA per topic per scenario**
- **Risk aggregation engine** → Monte Carlo aggregation with topic correlation adjustments → **EFRS distribution with P50, P70, P90 percentile exposures and topic waterfall**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Financial Risk Score
**Headline formula:** `EFRS = Σᵢ Materialityᵢ × Magnitudeᵢ × Likelihoodᵢ`

Each material topic is assigned a financial magnitude (% of EBITDA or asset value at risk) and likelihood (probability within the planning horizon) derived from scenario data and sector benchmarks. The EFRS aggregates across topics, adjusting for correlation, to produce a total financial exposure estimate.

**Standards:** ['TCFD 2021 Risk Quantification', 'ESRS 2 SBM-3', 'ECB Climate Risk Taxonomy']
**Reference documents:** TCFD (2021) Guidance on Scenario Analysis â€” Financial Risk Quantification; ESRS 2 (2023) SBM-3 Material IROs and Their Interaction with Business Model; ECB (2021) Guide on Climate-related and Environmental Risks; NGFS (2023) Scenarios for Central Banks â€” Physical and Transition Risk Estimates

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **ESG Financial Risk Score**
> `EFRS = Σᵢ Materialityᵢ · Magnitudeᵢ · Likelihoodᵢ` mapping material topics to EBITDA-at-risk with a
> topic waterfall. **No EFRS, no topic-magnitude/likelihood library exists in code.** The page is a
> **bank-treasury risk console**: historical-simulation VaR/CVaR, Basel III LCR/NSFR, IFRS 9 ECL and
> staging, a climate-adjusted WACC, interest-rate risk (duration/DV01), operational risk (BIA), and
> NGFS scenario stress — over 40 synthetic entities. The maths below is genuine; the *inputs* are seeded.

### 7.1 What the module computes

Per entity (`ENTITIES`, 40 rows), from seed `sr(i·k)`:

**Market risk — historical simulation (252-day window):**
```js
returns = [252]: (sr(i·1000+d) − 0.5)·0.04           // ±2% daily band
sorted  = returns ascending
var95   = |sorted[⌊252·0.05⌋]| = |sorted[12]|         // 5th-percentile loss
var99   = |sorted[⌊252·0.01⌋]| = |sorted[2]|
var10d  = var95·√10                                   // √-time scaling to 10 days
cvar95  = |mean(sorted[0..12])|                       // expected shortfall (tail mean)
```
**Liquidity — Basel III:**
```
LCR  = HQLA / net30d-outflows · 100   (999 if outflows=0)
NSFR = ASF / RSF · 100                (999 if RSF=0)
```
**Credit — IFRS 9 ECL & WACC:**
```
ECL_12m  = PD·LGD·EAD·DF ;  ECL_life = ECL_12m·(3 + sr·5)     // lifetime multiplier 3–8×
WACC     = Ke·eRatio + Kd·(1−tax)·dRatio ,  Ke = Rf + β·ERP + climatePremium,
                                            Kd = creditSpread + strandedHaircut
waccBps  = (WACC − WACC_base)·10⁴    // climate premium in bps
```
**Interest-rate & operational risk:**
```
Macaulay duration = Σ t·PV(cf_t) / Σ PV(cf_t) ;  DV01 = duration·price/10⁴
OpRisk capital (BIA) = grossIncome·0.15                       // Basel Basic Indicator Approach
```
**Portfolio roll-up** uses **normalised weights** `wNorm = weight/Σweight`, then
`portVaR95 = Σ var95ᵢ·wNorm` (linear aggregation — no correlation), similarly CVaR and WACC.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance (standard) |
|---|---|---|
| VaR window | 252 trading days | historical-simulation convention |
| VaR percentiles | 95% / 99% | Basel market-risk / regulatory VaR |
| 10-day scaling | ×√10 | Basel √-time rule |
| OpRisk factor | 15% of gross income | Basel II **Basic Indicator Approach** (α=15%) |
| LCR/NSFR floor | 100% | Basel III LCR/NSFR minimum |
| Lifetime ECL mult. | 3–8× (`3 + sr·5`) | synthetic proxy for lifetime/12m |
| Seeded ranges | weight 1.5–5%, β 0.6–1.8, climPrem 0.5–3%, creditSp 1–5%, LGD 25–70%, EAD 10–500 | `sr()`-seeded demo values |

### 7.3 Calculation walkthrough

Filter/select entity → tiles show VaR95/99, CVaR, LCR, NSFR, ECL, WACC (with bps climate uplift),
duration/DV01, opRisk. `RISK_LIMITS` (16 rows current vs limit) drives a limit-utilisation dashboard.
NGFS scenario tab applies scenario shocks; a concentration tab uses Herfindahl on weights. Portfolio tab
aggregates via `wNorm`.

### 7.4 Worked example (VaR & WACC)

Entity i=0: returns are `(sr(d)−0.5)·0.04` for d=0..251. After sorting, suppose `sorted[12] = −0.0185`
and `sorted[2] = −0.0262`. Then `var95 = 1.85%`, `var99 = 2.62%`, `var10d = 1.85%·√10 = 5.85%`.
CVaR95 = mean of the 13 worst returns, say −0.0208 → **2.08%**.

WACC: `Rf=0` in code's `waccBase`, `β=1.1`, `ERP` implicit, `climPrem=0.015`, `creditSp=0.03`,
`strandHc=0.008`, `eRatio=0.6`, `tax=0.25`. Ke = Rf+β·ERP+climPrem; Kd = creditSp+strandHc = 0.038.
`WACC = Ke·0.6 + 0.038·0.75·0.4`. The **climate wedge** `waccBps = (WACC − WACC_base)·10⁴` isolates the
`climatePremium + strandedHaircut` contribution in basis points.

### 7.5 Data provenance & limitations

- **All 40 entities synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`. Even the 252-day return
  series is `sr()`-generated (symmetric ±2% uniform band), so VaR reflects that band, not real markets.
- Portfolio VaR is a **weighted sum** of single-name VaRs — it ignores diversification/correlation and
  therefore overstates portfolio VaR (no sub-additivity benefit captured).
- Lifetime-ECL multiplier (3–8×) is a placeholder, not a discounted term-structure.
- LCR/NSFR/BIA/DV01 formulas are correct Basel/IRRBB definitions; only the inputs are fabricated.

**Framework alignment:** **Basel III** LCR (§ liquidity coverage), NSFR (net stable funding), market-risk
VaR + √-time scaling; **Basel II Basic Indicator Approach** for operational risk (15% of gross income);
**IFRS 9** ECL = PD·LGD·EAD and 12-month/lifetime staging; **IRRBB** duration/DV01; **NGFS** scenario
labels for transition stress. WACC uses the standard CAPM cost of equity (Rf + β·ERP) plus an ESG
premium and a stranded-asset debt spread.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
A climate-integrated treasury/credit risk engine producing regulatory-grade VaR/CVaR, LCR/NSFR, ECL and
WACC for the covered book, with NGFS/EBA scenario overlays — supporting ICAAP/ILAAP and TCFD financial
effects.

### 8.2 Conceptual approach
Replace uniform-band pseudo-returns with **filtered historical simulation** (empirical returns with
EWMA vol scaling) and add a **variance-covariance / copula** portfolio aggregation so diversification is
captured. Benchmarks: RiskMetrics (EWMA VaR), Basel FRTB (ES at 97.5%), IFRS 9 ECL practice, EBA
2022 climate stress test.

### 8.3 Mathematical specification
```
r_t observed; scaled r̃_t = r_t · σ_today/σ_t   (EWMA σ, λ=0.94)
VaR_α = −quantile_α(r̃) ; ES_97.5 = −mean(r̃ | r̃ ≤ VaR_97.5)
Portfolio: L = wᵀr ; VaR_p = −quantile_α(historical wᵀR)      (full-revaluation)
ECL_life = Σ_t (Π_{s<t}(1−PD_s))·PD_t·LGD·EAD_t·DF_t          (marginal-PD term structure)
WACC = wE(Rf+βERP+climatePrem) + wD(cD+greenSpread)(1−tax)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| EWMA decay | λ=0.94 | RiskMetrics standard |
| ES level | 97.5% | Basel FRTB |
| PD term structure | PD_t | rating-migration matrices (S&P/Moody's) |
| LGD | — | PCAF / recovery data |
| Climate premium | — | green-vs-brown bond spread evidence |

### 8.4 Data requirements
Real historical returns per position, HQLA/outflow classification (Basel LCR schedule), ASF/RSF factors,
obligor PD/LGD/EAD, cash-flow schedules for duration. Free: ECB/BIS liquidity templates; vendor:
RiskMetrics, Bloomberg. Platform holds NGFS labels and reference-data spreads.

### 8.5 Validation & benchmarking plan
VaR backtest (Kupiec POF, Christoffersen independence) at 95/99%; ES backtest (Acerbi-Székely);
reconcile ECL against audited provisions; LCR/NSFR tie-out to the regulatory templates; portfolio VaR
sub-additivity check vs the sum of standalone VaRs.

### 8.6 Limitations & model risk
Historical simulation is backward-looking and misses regime shifts; EWMA underestimates tail clustering.
Linear portfolio VaR (current code) violates sub-additivity — the spec's full-revaluation fixes this.
Conservative fallback: where correlation is unknown, use the (conservative) undiversified sum and flag it.

## 9 · Future Evolution

### 9.1 Evolution A — Real portfolio inputs for a genuinely competent risk console (analytics ladder: rung 2 → 3)

**What.** The §7 verdict: "the maths below is genuine; the *inputs* are seeded." The page is a bank-treasury console — historical-simulation VaR/CVaR over a 252-day window, Basel III LCR/NSFR, IFRS 9 ECL with staging, DV01/duration, BIA operational capital, NGFS stress — but the 40 entities' returns are `(sr(i·1000+d)−0.5)·0.04` draws, and the guide's promised EFRS topic-magnitude mapping doesn't exist. Evolution A swaps fabricated inputs for platform data and pins the math.

**How.** (1) Entities and weights come from `portfolios_pg` holdings (the platform's critical-rule table); daily returns from the real market-data seed layer ingested in EA-hybrid-v3, replacing seeded return vectors so hist-sim VaR is computed on observed series. (2) The formula set moves to `services/dme_financial_risk_engine.py` with endpoints per tab (market-risk, liquidity, ECL, WACC, NGFS) — tier-B today, so this is the module's first backend. (3) Implement the guide's `EFRS = Σ Materiality × Magnitude × Likelihood` as the bridge the module was named for: topic scores from `dme_topic_scores` (dme-entity Evolution A) × sector magnitude benchmarks (NGFS scenario deltas already tabulated in-page) → EBITDA-at-risk waterfall. (4) Calibration: pin VaR/ECL/LCR reference cases into `bench_quant.py` and backtest VaR exceptions (Basel traffic-light) against the realized series — that backtest is what earns rung 3.

**Prerequisites.** Demo portfolio seeded at realistic scale (the D0 credibility-gap item); market-data coverage audit for the chosen universe. **Acceptance:** VaR exception count over the backtest window falls in the Basel green zone for the fixture portfolio; every tab's numbers reproduce from engine endpoints; zero seeded returns.

### 9.2 Evolution B — CRO analyst that runs the console via tools (LLM tier 2)

**What.** A tool-calling analyst for the questions this console exists to answer: "which names breach their VaR limit under Delayed Transition, and what does that do to portfolio LCR?" It chains Evolution A's endpoints — NGFS stress → per-entity VaR/ECL deltas → limit comparison against the 16-row `RISK_LIMITS` register — and drafts the breach memo with each figure traced to a tool response, including the ECL staging changes that drive IFRS 9 P&L.

**How.** Tool schemas from the new engine's OpenAPI spec; grounding corpus = this Atlas record's §5/§7 formula blocks (hist-sim definition, LCR/NSFR ratios, ECL staging rules) so explanations match the implemented math rather than textbook variants. Limit-breach narration is read-only; any limit *change* is a gated mutation behind explicit confirmation per tier-2 RBAC. The no-fabrication validator covers bps and ratio figures — treasury users will quote these downstream.

**Prerequisites (hard).** Evolution A first: today there are no endpoints, and the current page would have the copilot attributing seeded Basel ratios to a synthetic book. **Acceptance:** for a golden portfolio, the analyst's stress-breach list matches a scripted endpoint replay exactly; asking for intraday liquidity (not computed) triggers refusal.