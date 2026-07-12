# ESG Factor Attribution
**Module ID:** `esg-factor-attribution` · **Route:** `/esg-factor-attribution` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Decomposes portfolio active returns into ESG factor contributions alongside traditional Brinson-Hood-Beebower and multi-factor attribution components. Identifies whether outperformance or underperformance is driven by ESG tilts, sector allocation effects, or security selection within ESG-screened universes. Supports performance reporting to ESG-mandated clients and strategy governance committees.

> **Business value:** Provides portfolio managers and client-facing teams with transparent, defensible attribution showing precisely how ESG integration has contributed to or detracted from performance, supporting client retention, regulatory disclosure, and strategy refinement.

**How an analyst works this module:**
- Select portfolio, benchmark, and attribution period; load ESG scores and security weights.
- Run BHB + ESG tilt attribution decomposition and review waterfall chart of return effects.
- Identify sectors or periods where ESG tilt detracted from performance and review score dynamics.
- Export client-ready attribution report in GIPS-compliant format with ESG tilt commentary narrative.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CATS`, `COLORS`, `FACTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `ret1y` | `+((sr(i*7)-0.4)*15).toFixed(2);const vol=+(sr(i*13)*12+3).toFixed(2);const sharpe=+(ret1y/(vol\|\|1)).toFixed(2);const ir=+((sr(i*17)-0.3)*2).toFixed(2);` |
| `monthly` | `Array.from({length:12},(_,m)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],ret:+((sr(i*100+m*7)-0.45)*4).toFixed(2),cum:+((m+1)*ret1y/12+sr(i*100+m*11)*2).toFixed(2)}));` |
| `filtered` | `useMemo(()=>{let d=[...FACTORS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(catF!=='All')d=d.filter(r=>r.category===catF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,catF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1)*PA` |
| `stats` | `useMemo(()=>({count:filtered.length,avgRet:(filtered.reduce((s,r)=>s+r.return1Y,0)/filtered.length\|\|0).toFixed(2),avgSharpe:(filtered.reduce((s,r)=>s+r.sharpe,0)/filtered.length\|\|0).toFixed(2),posAlpha:filtered.filter(r=` |
| `catPerf` | `useMemo(()=>{const m={};FACTORS.forEach(f=>{if(!m[f.category])m[f.category]={cat:f.category,ret:0,vol:0,sharpe:0,n:0};m[f.category].ret+=f.return1Y;m[f.category].vol+=f.volatility;m[f.category].sharpe+=f.sharpe;m[f.categ` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='monthly');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{typ` |
| `catDist` | `CATS.slice(1).map(c=>({name:c,value:FACTORS.filter(f=>f.category===c).length}));` |
| `cumData` | `Array.from({length:24},(_,m)=>({month:'M'+(m+1),esg:+((m+1)*0.4+sr(m*7)*3).toFixed(1),benchmark:+((m+1)*0.3+sr(m*11)*2).toFixed(1)}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATS`, `COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Tilt Contribution (bps) | — | Attribution Engine | Return contribution attributable to the portfolio's ESG score tilt vs. benchmark; positive = ESG tilt added value. |
| Allocation Effect (bps) | — | Brinson BHB | Return from over/under-weighting sectors vs. benchmark, independent of security selection within sectors. |
| Selection Effect (bps) | — | Brinson BHB | Return from security selection within sectors; includes the ESG quality effect within sector weights. |
| ESG Factor R² (%) | — | Factor Regression | Proportion of active return variance explained by the ESG factor; high R² validates ESG as primary active return driver. |
- **Portfolio management system (daily holdings and weights)** → Compute active weights vs. benchmark; align with ESG score time series at month-end → **Active weight and ESG score differential by security and sector**
- **ESG score provider feeds (MSCI/Sustainalytics)** → Normalise scores cross-sectionally; compute score-weighted sector averages → **Sector ESG score differential (portfolio vs. benchmark)**
- **Security and portfolio return data (Bloomberg)** → Apply BHB decomposition with ESG tilt extension; sum to portfolio level → **Attribution waterfall: allocation, selection, ESG tilt, interaction (bps)**

## 5 · Intermediate Transformation Logic
**Methodology:** Brinson-ESG Attribution
**Headline formula:** `Active_Return = Allocation + Selection + ESG_Tilt + Interaction`

Extends the classic three-effect BHB model with an explicit ESG tilt effect measuring the return contribution of over/under-weighting high vs. low ESG-scored securities within each sector. ESG tilt effect = Σ_s (w_ps − w_bs) × (ΔESG_s × β_esg). Residual interaction effect captures joint allocation-ESG signal.

**Standards:** ['Brinson-Hood-Beebower 1986', 'GIPS 2020', 'CFA Institute ESG Attestation']
**Reference documents:** Brinson, Hood & Beebower â€” Determinants of Portfolio Performance (1986); CFA Institute â€” ESG Attestation for Portfolio Managers 2021; GIPS 2020 Standards â€” Performance Attribution Guidance; Barra Open Optimizer Attribution Methodology 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes **Brinson-Hood-Beebower + ESG-tilt attribution**
> — `Active_Return = Allocation + Selection + ESG_Tilt + Interaction`, with the ESG-tilt effect
> `Σ_s (w_ps − w_bs)×(ΔESG_s × β_esg)` and a GIPS-compliant attribution waterfall. **None of the BHB
> decomposition exists in code.** The page fabricates a table of 50 "ESG factors", each with `sr()`-
> drawn `return1Y`, `volatility`, `sharpe`, `infoRatio`, `alpha`, `beta`, `correlation`, etc., and
> computes only category averages and a synthetic 24-month cumulative series. There is no portfolio,
> no benchmark, no allocation/selection split, no ESG-tilt effect. §8 specifies the missing model.

### 7.1 What the module computes

Real computation is limited to descriptive aggregates over the synthetic factor table:

```js
avgRet   = mean(return1Y)      avgSharpe = mean(sharpe)      avgIR = mean(infoRatio)
posAlpha = #(alpha > 0)        avgVol    = mean(volatility)  topFactor = argmax(return1Y)
catPerf  = mean(return1Y, volatility, sharpe) grouped by {Environmental, Social, Governance}
```

Per-factor fields (all seeded):

```js
return1Y   = (sr(i*7) − 0.4)*15                 // ≈ −6 … +9 %
volatility = sr(i*13)*12 + 3                     // 3–15 %
sharpe     = return1Y / (volatility || 1)        // ratio of two draws
infoRatio  = (sr(i*17) − 0.3)*2
tStat      = infoRatio × √12                      // display heuristic, NOT a regression t-stat
alpha      = return1Y*0.6 + sr(i*23)*2 − 1
monthly[m] = (sr(i*100+m*7) − 0.45)*4            // 12-month return path
```

Note `sharpe` *is* correctly derived as `return1Y/volatility` (both synthetic), and `tStat` is
`IR×√12` — a plausible-looking but non-statistical construction (a real t-stat needs the number of
independent observations, not a fixed √12).

### 7.2 Parameterisation

| Element | Source |
|---|---|
| 50 factor names + E/S/G category | curated label list (hand-assigned) |
| return1Y / vol / IR / alpha / beta / correlation / turnover / holdings | synthetic `sr(seed)` draws |
| 12-month `monthly` path per factor | `sr()`-jittered |
| 24-month cumulative ESG-vs-benchmark series | `(m+1)*0.4 + sr(m*7)*3` vs `(m+1)*0.3 + sr(m*11)*2` |

The cumulative-series slopes (ESG 0.4/mo > benchmark 0.3/mo) hard-code a mild ESG outperformance — a
presentational choice, not an estimated result.

### 7.3 Calculation walkthrough

1. `FACTORS` (50 rows) fabricated once from `sr(i·k)`.
2. `stats` averages return/Sharpe/IR/vol and counts positive-alpha factors over the filtered set.
3. `catPerf` groups by E/S/G and averages return/vol/Sharpe.
4. `catDist` counts factors per category; `cumData` renders the synthetic ESG-vs-benchmark cumulative
   lines.
5. Side panel shows a single factor's `monthly` path and its (synthetic) statistics.

### 7.4 Worked example — avgRet KPI

`avgRet = mean(return1Y)`, `return1Y_i = (sr(i*7) − 0.4)×15`. With `E[sr] ≈ 0.5`, `E[return1Y] ≈
(0.5 − 0.4)×15 = +1.5%`, so the dashboard's average factor return sits near +1.5% — again an artefact
of the `−0.4` offset, not a measured premium. `posAlpha` ≈ #(alpha>0) where `alpha ≈ 0.6·return1Y +
noise`, so ≈ 55–60% of factors show positive alpha by construction.

### 7.5 Data provenance & limitations

- **All factor statistics synthetic** (`sr(s)=frac(sin(s+1)×10⁴)`); factor names are labels only.
- `tStat = IR×√12` is not a valid significance test (no sample size, no residual variance).
- No BHB attribution, no portfolio/benchmark inputs, no allocation/selection/ESG-tilt decomposition —
  the module's entire stated purpose (attribution) is unimplemented.
- Hard-coded ESG-outperformance slope in the cumulative chart pre-ordains the narrative.

**Framework alignment:** the guide cites **Brinson-Hood-Beebower (1986)**, **GIPS 2020** and **CFA
ESG attestation**; the module references these as labels only. A genuine build would require holdings
and benchmark weights to run the three-effect BHB model plus an ESG-tilt extension (§8).

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Decompose a portfolio's active return vs benchmark into allocation, selection,
interaction and an explicit ESG-tilt effect, for GIPS-compliant client attribution reporting.

**8.2 Conceptual approach.** Classic **Brinson-Hood-Beebower** sector attribution extended with an
ESG-tilt term, mirroring **Barra/FactSet attribution** and CFA-Institute ESG-attestation practice.

**8.3 Mathematical specification.** Per sector s, portfolio/benchmark weights `w_p,w_b`, returns
`R_p,R_b`, benchmark total `R_B`:
- Allocation: `A_s = (w_{ps} − w_{bs})·(R_{bs} − R_B)`.
- Selection: `S_s = w_{bs}·(R_{ps} − R_{bs})`.
- Interaction: `I_s = (w_{ps} − w_{bs})·(R_{ps} − R_{bs})`.
- ESG tilt: `T_s = (w_{ps} − w_{bs})·(ΔESG_s · β_{esg})`, `ΔESG_s` = portfolio-minus-benchmark mean
  ESG z-score in s, `β_{esg}` estimated from the ESG factor regression.
- Active return `= Σ_s (A_s + S_s + I_s + T_s)`; residual folded into interaction for reconciliation.

| Parameter | Source |
|---|---|
| Weights `w_p,w_b` | portfolio management system, month-end |
| Sector returns | Bloomberg / FactSet |
| ESG z-scores | MSCI / Sustainalytics, sector-normalised |
| `β_esg` | ESG-factor regression (see esg-factor-alpha §8) |
| Sector map | GICS |

**8.4 Data requirements.** Daily/monthly holdings and benchmark constituents with weights, security
returns, ESG scores. None present; the module holds only synthetic factor rows.

**8.5 Validation & benchmarking plan.** Reconcile Σ effects to total active return (residual ≈ 0);
cross-check against FactSet/Barra attribution on the same portfolio; sensitivity of ESG-tilt to
`β_esg` estimation window.

**8.6 Limitations & model risk.** BHB is single-period (needs geometric linking across periods);
ESG-tilt depends on the separately estimated `β_esg` (compounding model risk); sector definitions
drive allocation vs selection split.

## 9 · Future Evolution

### 9.1 Evolution A — Implement Brinson-plus-ESG-tilt on real portfolio and benchmark holdings (analytics ladder: rung 1 → 2)

**What.** The §7 flag: "none of the BHB decomposition exists in code" — no portfolio, no benchmark, no allocation/selection split, no ESG-tilt effect. The page fabricates 50 "ESG factors" with seeded returns/Sharpes and computes only category averages and a synthetic cumulative series. The guide's model is precise and implementable: `Active = Allocation + Selection + ESG_Tilt + Interaction`, with `ESG_Tilt = Σ_s (w_ps − w_bs)×(ΔESG_s × β_esg)`. Notably, a correct Brinson selection/allocation/interaction implementation already exists in the platform — inside `dme-portfolio`'s page code. Evolution A builds the attribution vertical once, properly.

**How.** (1) `services/attribution_engine.py`: classic BHB from `portfolios_pg` holdings and a stored benchmark composition, extended with the ESG-tilt term using scored holdings (β_esg supplied by `esg-factor-alpha`'s engine once it exists; until then the tilt term reports honest-null rather than a placeholder beta). (2) `dme-portfolio`'s in-page Brinson consumes this engine, ending the duplication. (3) Period handling: month-end weight snapshots persisted so multi-period attribution links correctly (geometric linking, the classic pitfall — bench-pin it). (4) Rung 2: attribution across user-selected periods and screened-universe comparisons ("attribution within the ESG-screened universe vs full benchmark"), which the module's overview promises.

**Prerequisites.** Benchmark constituent data source; `esg-factor-alpha` Evolution A for the β_esg input (tilt term honest-null until then); month-end snapshot job. **Acceptance:** the four effects sum to active return exactly for a fixture period (identity check in `bench_quant.py`); multi-period linking reproduces a hand-computed two-period example; zero `sr()` anywhere.

### 9.2 Evolution B — GIPS-aware attribution narrator for client reporting (LLM tier 2)

**What.** The module's stated deliverable — "client-ready attribution report in GIPS-compliant format with ESG tilt commentary" — is a narration task over exact numbers. A tool-calling narrator pulls Evolution A's attribution output, drafts the commentary ("Q3 underperformance of −42bps was driven by the energy underweight (−31bps allocation), partially offset by selection within utilities (+18bps); the ESG tilt itself contributed −12bps as low-scored energy names rallied"), and assembles the report with the waterfall — every bps figure validator-matched to the engine.

**How.** Tools: `run_attribution(portfolio, benchmark, period)`, `get_effect_detail(effect, sector)`, `get_period_history(portfolio)`. Grounding corpus = this Atlas record's §5 (effect definitions — the narrator must describe the *implemented* interaction-term convention, since BHB variants differ) plus GIPS 2020 attribution guidance from the reference list. The commentary discipline: each causal claim maps to a specific effect cell; regime speculation ("ESG factor was out of favor") is permitted only when the tilt effect's sign supports it and is labeled interpretation. Renders through report-studio.

**Prerequisites (hard).** Evolution A — commentary over the current seeded factor table would send clients fabricated attribution, a GIPS-verification failure and worse. **Acceptance:** a golden quarter's report has every bps figure matching engine output; effects cited sum to the stated active return; the tilt-effect honest-null state (pre-β_esg) renders as "ESG tilt not yet separable" rather than a number.