# Quant ESG Hub
**Module ID:** `quant-esg-hub` · **Route:** `/quant-esg-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Platform for systematic ESG factor integration into quantitative investment strategies, combining signal construction, backtesting, and live monitoring.

> **Business value:** Provides the infrastructure for building, testing, and deploying ESG factors in quantitative strategies, bridging sustainability data and alpha generation.

**How an analyst works this module:**
- Define signal weighting for momentum, level, and controversy.
- Run historical backtest over 10-year period.
- Analyse IC decay and turnover profile.
- Deploy signal in live portfolio monitoring.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORIES`, `COLORS`, `DATA`, `NAMES`, `PAGE_SIZE`, `RISK_LEVELS`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `['Factor Strategies','Risk Premia','Smart Beta','Multi-Factor','Long-Short','Market Neutral'];` |
| `badgeS` | `(bg)=>({display:'inline-block',padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,fontFamily:T.mono,background:bg+'18',color:bg});` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.cre` |
| `paged` | `useMemo(()=>filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[filtered,page]);` |
| `totalPages` | `Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgSharpe:0,avgAlpha:0,avgVol:0,totalAum:0,avgEsg:0}; return{count:d.length,avgSharpe:d.reduce((a,r)=>a+r.sharpe,0)/ Math.max(1, d.length),avgAlpha:d.reduce((a,r)=>a+r.alpha,0)/ Math.max(1, d.length),avgVol:d.reduce((a,r)=>a+r.vol,0)/ Math.max(1, d.length),totalAum:d.reduce((a,r)=>` |
| `catDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.category]=(m[r.category]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value})).sort((a,b)=>b.value-a.value);},[fi` |
| `riskDist` | `useMemo(()=>RISK_LEVELS.map(l=>({name:l,value:filtered.filter(r=>r.risk===l).length})),[filtered]);` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/ Math.max(1, filtered.length);` |
| `catPerf` | `useMemo(()=>CATEGORIES.map(c=>{const items=filtered.filter(r=>r.category===c);if(!items.length)return null;return{name:c.length>14?c.slice(0,14)+'..':c,sharpe:items.reduce((a,r)=>a+r.sharpe,0)/ Math.max(1, items.length),` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,sharpe:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `COLORS`, `NAMES`, `RISK_LEVELS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Covered Securities | — | ESG Universe | Total securities with ESG signal constructed in active investment universe. |
| Signal IC (1-yr) | — | Backtest Engine | Information coefficient of composite ESG signal vs 12-month forward returns. |
| Controversy Hit Rate (%) | — | RepRisk NLP | Share of universe flagged with material controversy event in trailing 90 days. |
- **ESG time series + controversy flags + price data** → Signal construction; backtest; IC and turnover analysis → **Live signal scores, backtest results, and portfolio integration outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Signal Score
**Headline formula:** `Sᵢ = α×ΔESG_momentum + β×ESG_level + γ×controversy_penalty`

Multi-component signal combining ESG rating momentum, absolute level, and controversy-adjusted quality score.

**Standards:** ['AQR ESG Integration Research', 'MSCI Factor Research']
**Reference documents:** AQR Capital Management: Is There a Replication Crisis in Finance? (2023); MSCI ESG Ratings Factor Research Papers

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **ESG signal-construction and backtesting
> platform**: `S = α·ΔESG_momentum + β·ESG_level + γ·controversy_penalty`, signal IC 0.06, RepRisk
> NLP, 10-year backtest. **None of this exists.** The module is a **filter/sort/paginate screener**
> over 50 synthetic "strategies" whose every performance metric (Sharpe, alpha, beta, vol, ESG score,
> IC-like fields) is an **independent `sr()` draw**. There is no signal, no backtest, no information
> coefficient, no controversy pipeline. The KPI cards and charts are correct averages over fabricated
> data.

### 7.1 What the module computes

`genData(50)` builds 50 strategies; each field is a labelled random draw (`s(idx) = sr(i·idx+idx)`):

```js
sharpe    = 0.1 + s(31)·2.4        alpha  = −2 + s(37)·8        beta = 0.2 + s(41)·1.6
vol       = 3 + s(43)·22           maxDD  = −2 − s(47)·28       infoRatio = −0.5 + s(53)·2.5
esgScore  = 20 + s(59)·75          carbonInt = 10 + s(61)·490   turnover = 5 + s(67)·145
trackingError = 0.5 + s(71)·6.5    factorExp = −1 + s(73)·3     corrSP500 = 0.1 + s(79)·0.85
sortino/calmar, aum, ytdReturn, env/soc/govScore, q1..q4  — all further sr() draws
```

**Portfolio KPIs** (correct arithmetic on the seeded book): count, `avgSharpe`, `avgAlpha`, `avgVol`,
`totalAum`, `avgEsg` — simple means/sums over the filtered set. Charts: category distribution, risk
distribution, a 6-axis radar of averaged sub-scores, per-category performance, and a Q1–Q4 "trend"
(four independent draws averaged).

### 7.2 Parameterisation / provenance

| Field | Formula | Provenance |
|---|---|---|
| Strategy names | 50-name list | hand-authored (realistic ESG-strategy names) |
| category / sector / risk | `sr()` index into fixed lists | synthetic |
| sharpe / alpha / beta / vol | independent `sr()` ranges | **synthetic seeded** |
| esgScore / carbonInt | `sr()` ranges | synthetic |
| IC-like fields (infoRatio, factorExp) | `sr()` | synthetic; **no realised-return correlation** |
| q1–q4 | independent `sr()` | synthetic; not a time series |

Every metric is mutually independent — a strategy's Sharpe, alpha, beta, and vol bear no analytic
relationship (a real strategy's Sharpe ≈ (return−rf)/vol, which will not hold here).

### 7.3 Calculation walkthrough

1. `genData(50)` seeds 50 strategies from flat index.
2. Filters (search / category / sector / risk) subset; sort; paginate (12/page).
3. `kpis` averages Sharpe/alpha/vol/ESG, sums AUM over the filtered set.
4. Radar/category/trend charts re-aggregate the same seeded fields.

### 7.4 Worked example

No estimation pipeline to trace. For strategy i=1: `s(31) = sr(1·31+31) = sr(62)`. If `sr(62) ≈ 0.50`,
`sharpe = 0.1 + 0.50·2.4 = 1.30`. Independently, `s(43) = sr(86)`; if `≈0.30`, `vol = 3 + 0.30·22 =
9.6%`; `s(37)=sr(74)`; if `≈0.60`, `alpha = −2 + 0.60·8 = 2.8%`. Note that `alpha/vol = 0.29` bears no
relation to the drawn `sharpe = 1.30` — confirming the metrics are internally inconsistent noise.

### 7.5 Data provenance & limitations

- **All 50 strategies are synthetic**, seeded by `sr(seed)=frac(sin(seed+1)×10⁴)`.
- **No signal, backtest, or IC**: the guide's ESG-signal composite and information coefficient are
  absent — `infoRatio`/`factorExp` are random labels, not correlations with forward returns.
- Metrics are mutually independent, so risk-return identities (Sharpe, Calmar, Sortino) do not
  reconcile across a row.
- "Quarterly trend" is four independent draws, not a return series.
- Strategy names are real-flavoured (SFDR Art 9, Paris Aligned, Gender Lens) but attach to noise.

**Framework alignment:** The page name-checks **AQR ESG integration research** and **MSCI factor
research** as the intellectual backdrop. A real ESG factor platform (e.g. AQR/MSCI Barra) constructs a
signal, forms long-short quantile portfolios, and measures the **information coefficient** (rank
correlation of signal with forward return) and factor Sharpe over a backtest — none of which the code
performs. Genuine implementation requires §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Construct an ESG composite signal, backtest it as a long-short factor, and
report information coefficient, factor Sharpe, turnover, and IC decay, for a securities universe.

**8.2 Conceptual approach.** Standard **quant factor construction and evaluation**, mirroring (i) AQR
factor methodology and (ii) MSCI Barra factor research: z-score the signal cross-sectionally, form
quantile portfolios, and evaluate predictive power via IC and factor returns.

**8.3 Mathematical specification.**
Signal: `S_it = ωm·z(ΔESG_it) + ωl·z(ESG_it) − ωc·controversyPenalty_it`, weights ω summing to 1;
`z(·)` = cross-sectional standardisation at date t.
Factor return: `f_t = r̄_{top quintile,t+1} − r̄_{bottom quintile,t+1}` (dollar-neutral).
Information coefficient: `IC_t = rankCorr(S_·t, r_·,t+1)`; report mean IC and IC t-stat.
Factor Sharpe: `mean(f_t)/std(f_t)·√12`. Turnover: `Σ|w_{t}−w_{t−1}|/2`. IC decay: IC vs horizon h.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Signal weights | ωm,ωl,ωc | tune via CV; AQR-style priors |
| Controversy penalty | controversyPenalty | RepRisk RRI / Sustainalytics events |
| Quantiles | 5 | standard |
| Universe / horizon | – | 10-yr monthly (guide's stated design) |

**8.4 Data requirements.** ESG level + momentum (rating time series), controversy events, price
returns, sector. Sources: MSCI/Sustainalytics ratings, RepRisk, price feed. Platform holds none as
live data — only seeded constants.

**8.5 Validation & benchmarking.** Report IC, IC t-stat, factor Sharpe with confidence intervals;
compare to AQR/MSCI published ESG-factor results; guard against look-ahead (point-in-time ratings) and
data-mining (out-of-sample and multiple-testing adjustment).

**8.6 Limitations & model risk.** ESG-factor premia are weak and time-varying; ratings revisions cause
look-ahead bias. Conservative fallback: report OOS IC only, disclose universe and turnover, and never
present a Sharpe/IC without confidence bounds.

## 9 · Future Evolution

### 9.1 Evolution A — A real signal-construction and backtest engine (analytics ladder: rung 1 → 3)

**What.** §7 shows the page is a screener over 50 synthetic "strategies" whose metrics are independent `sr()` draws — internally inconsistent by construction (the §7.4 example proves a strategy's drawn Sharpe of 1.30 coexists with alpha/vol = 0.29). The guide's signal `S = α·ΔESG_momentum + β·ESG_level + γ·controversy_penalty`, IC analysis, and 10-year backtest are absent. Evolution A builds the smallest honest version: a backend signal constructor and walk-forward backtester over data the platform actually holds, replacing the fabricated strategy book.

**How.** (1) `api/v1/routes/quant_esg.py`: `POST /signal` (composite score from user-weighted momentum/level/controversy components over the platform's company master ESG scores), `POST /backtest` (quantile long-short portfolio formation, monthly rebalance, rank-IC per period, turnover) — using ingested market-data history where the platform has it, and honestly refusing horizons it doesn't (the EA-hybrid-v3 market-data seed is the starting corpus). (2) Derived metrics become internally consistent by construction: Sharpe computed from the backtest return series, never drawn. (3) The screener UI survives as the results browser for saved signal configurations (a `quant_signal_runs` table), so the workflow §1 describes — define weights, backtest, monitor — becomes real.

**Prerequisites.** Return-history coverage audit first (an ESG backtest without survivorship-clean prices is worse than none — document the universe and window); controversy component stubbed as null until a real event source exists. **Acceptance:** for any saved run, reported Sharpe equals (mean−rf)/σ of the stored return series; IC is a real cross-sectional rank correlation, reproducible from the run's stored panel.

### 9.2 Evolution B — Signal-research copilot (LLM tier 2, gated)

**What.** Once real backtests exist, the natural copilot is a research assistant over runs: "compare my 60/30/10 momentum-heavy config against equal weights — where does the IC decay differ?", "why did the long-short spread collapse in 2022 in this backtest?" — answered by tool calls to `POST /backtest` and reads of stored run panels, with the copilot narrating regime differences from the computed period-by-period ICs, never asserting market history from memory.

**How.** Tier-2 tool schemas over the Evolution-A endpoints; system prompt grounded in this Atlas record plus the AQR replication-crisis paper the guide already cites — the copilot's standing instruction is skeptical framing (in-sample vs walk-forward, multiple-testing caveats when a user sweeps many configs). A config-sweep request executes as batched backtest calls with the copilot reporting the best config *and* the number of configs tried, a deliberate anti-p-hacking disclosure. No-fabrication validator on every performance statistic.

**Prerequisites (hard).** Evolution A shipped; before it, there is nothing real to research and the copilot must not exist here — the current book is noise. Golden Q&A from a pinned reference backtest. **Acceptance:** every quoted Sharpe/IC matches a stored run; sweep answers disclose trial count; questions about live deployment (not built) are refused.