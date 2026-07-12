# Cross-Asset Contagion
**Module ID:** `cross-asset-contagion` · **Route:** `/cross-asset-contagion` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models systemic climate risk propagation across asset classes and geographies, capturing second-round contagion effects through financial network linkages, collateral spirals, and macro-financial feedback loops. Supports macro-prudential stress testing and systemic risk assessment for climate scenarios.

> **Business value:** Enables macro-prudential risk teams and central bank stress testers to capture the full systemic impact of climate scenarios beyond individual institution losses, supporting FSAP climate modules and G20 financial stability reporting.

**How an analyst works this module:**
- Configure asset class universe and network linkage matrix in Settings
- Direct Shock tab initialises scenario-specific shocks across asset classes
- Network Propagation tab runs iterative contagion model and visualises spread
- Fire-Sale Dynamics tab models price-amplification spirals from distressed asset sales
- Systemic Risk Dashboard shows system-wide VaR, amplification factors, and sector concentrations
- Macro-Prudential Report exports findings for regulatory stress testing submissions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHANNELS`, `LINKS`, `TABS`, `TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CHANNELS` | 9 | `channel`, `weight`, `speed` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,contagionIdx:Math.round(35+sr(i*7)*25+Math.sin(i/4)*10),correlationAvg:+(0.3+sr(i*11)*0.3+Math.sin(i/3)*0.1).toFixed(2)` |
| `CHANNELS` | `[{channel:'Credit Spread Contagion',weight:22,speed:3},{channel:'Equity-Bond Correlation',weight:18,speed:1},{channel:'FX Carry Unwind',weight:14,speed:2},{channel:'Commodity Price Shock',weight:12,speed:5},{channel:'Rea` |
| `filtered` | `useMemo(()=>{let d=[...LINKS];if(search)d=d.filter(r=>r.from.toLowerCase().includes(search.toLowerCase())\|\|r.to.toLowerCase().includes(search.toLowerCase()));d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1)*PAGE_SI` |
| `stats` | `useMemo(()=>({count:filtered.length,avgContagion:(filtered.reduce((s,r)=>s+r.contagionScore,0)/filtered.length\|\|0).toFixed(0),avgCorr:(filtered.reduce((s,r)=>s+r.correlation,0)/filtered.length\|\|0).toFixed(2),crisis:filte` |
| `driverDist` | `useMemo(()=>{const m={};LINKS.forEach(r=>{m[r.esgDriver]=(m[r.esgDriver]\|\|0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v}));},[]);` |
| `strengthDist` | `useMemo(()=>{const m={};LINKS.forEach(r=>{m[r.strength]=(m[r.strength]\|\|0)+1;});return Object.entries(m).map(([k,v])=>({name:k,value:v}));},[]);` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]);const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const blob=new Blob([csv],{type:'text/csv'});const u` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHANNELS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Contagion Amplification Factor | — | BIS/ECB network models | Ratio of total system loss (including contagion) to initial direct shock loss |
| System-Wide Climate VaR (99%) | — | ECB/NGFS | Systemic financial loss as percent of GDP under severe climate scenario with contagion |
| Bank Interconnectedness (HHI) | — | BIS quarterly review | Concentration of interbank exposures; high HHI amplifies contagion speed |
| Sovereign-Bank Nexus Exposure | — | EBA transparency data | Bank holdings of sovereign debt from climate-vulnerable sovereigns |
| Contagion Network Diameter | — | Network analysis | Average shortest path for climate shock to propagate across the financial system network |
- **BIS/ECB interbank exposure data** → Build adjacency matrix w_ij from bilateral exposures → **Financial network topology**
- **NGFS scenario direct shocks per asset class** → Initialise shock vector, run iterative propagation model → **Contagion trajectory per node and time step**
- **Fire-sale price impact models** → Model asset-specific price depression from forced sales → **Amplification factor per asset class**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Contagion Network Model
**Headline formula:** `Contagion_i(t) = Direct_shock_i + Σ_j (w_ij × Contagion_j(t-1))`

Network adjacency matrix w_ij encodes cross-exposure links: bank-to-bank lending, common asset holdings, reinsurance chains, and sovereign-bank nexus. Direct shocks initialised from NGFS transition and physical risk scenarios. Contagion propagates iteratively until steady state, with amplification from fire-sale dynamics (asset sales depress prices, triggering margin calls on other holders) and credit tightening spirals.

**Standards:** ['BIS Working Paper 844', 'ECB Financial Stability Review', 'NGFS Systemic Risk Workstream']
**Reference documents:** BIS Working Paper No. 844 â€” Climate-Related Financial Risks in Finance Networks; ECB Financial Stability Review â€” Climate Risk November 2024; NGFS Systemic Risk Workstream Report 2023; Acemoglu et al. (2012) â€” The Network Origins of Aggregate Fluctuations

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a *Climate Contagion Network Model* —
> `Contagion_i(t) = Direct_shock_i + Σ_j w_ij·Contagion_j(t−1)`, an adjacency matrix from bilateral
> exposures, iterative propagation to steady state, and fire-sale amplification. **None of that
> iterative model exists.** `CrossAssetContagionPage.jsx` is a descriptive, filterable dashboard over
> 40 hard-coded asset-class link *pairs* whose contagion scores, correlations, spillovers,
> transmission speeds and amplification factors are all drawn from the PRNG `sr(s)=frac(sin(s+1)×10⁴)`.
> There is no matrix, no `t−1` recursion, no fire-sale price impact. The sections document the
> dashboard as built.

### 7.1 What the module computes

`LINKS` = 40 directed asset-class pairs (Equities↔Fixed Income, Green Bonds↔Credit, Carbon
Markets↔Commodities, Physical Risk↔Insurance, …). Each pair `i` is decorated with seeded attributes:

```js
correlation      = +(sr(i·7)·0.9 − 0.1)         // −0.10 … +0.80
contagionScore   = round(10 + sr(i·11)·85)      // 10 … 95
spilloverPct     = round(sr(i·13)·60)           // 0 … 60 %
transmissionSpeed= round(1 + sr(i·17)·30)       // 1 … 31 days
amplification    = +(sr(i·19)·3 + 0.5)          // 0.5 … 3.5×
esgDriver/regime/directionality/strength = sr()-bucketed categoricals
```

The only *aggregations* are averages over the filtered set (`stats.avgContagion`, `avgCorr`,
`avgSpeed`) and category distributions (`driverDist`, `strengthDist`). `TREND` is 24 months of
`base + sr()·range + sin(i/k)·amp` — a seeded wave, not a fitted series.

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| Correlation | `sr(i·7)·0.9 − 0.1` | synthetic seeded |
| Contagion score | `10 + sr(i·11)·85` | synthetic seeded |
| Spillover % | `sr(i·13)·60` | synthetic seeded |
| Amplification | `sr(i·19)·3 + 0.5` | synthetic seeded |
| Contagion-score badge cuts | `[30, 55, 75]` (green/gold/amber/red) | display heuristic |
| Channel weights | `CHANNELS` fixed: Credit-Spread 22, Equity-Bond 18, FX-Carry 14 … | hand-set demo weights (sum ≈ 100) |

`CHANNELS` weights and speeds are the only non-seeded numbers, but they are author-assigned, not
estimated from data. The link *pairs* themselves are a plausible, curated taxonomy of ESG/climate
transmission routes.

### 7.3 Calculation walkthrough

Search/sort/paginate `LINKS` → `filtered` → KPI strip = simple means (with `||0` fallbacks). Four
tabs re-slice the same 40 rows: Dashboard (KPIs + ESG-driver pie + correlation-vs-spillover scatter),
Linkages (contagion-vs-speed bubble sized by `amplification·30`), Channels (fixed `CHANNELS` bar),
Stress (regime pie + amplification-by-driver bar). No value produced on one tab feeds another.

### 7.4 Worked example (link `i = 5`, Fixed Income↔Credit)

| Attribute | Computation | Result |
|---|---|---|
| Correlation | `frac(sin(6)×10⁴)×0.9 − 0.10` | ≈ **0.32** |
| Contagion | `round(frac(sin(11×5+1)×10⁴)×85 + 10)` | ≈ **62** |
| Spillover | `round(frac(sin(66)×10⁴)×60)` | ≈ **28%** |
| Badge | 62 ≥ 55 (amber band) | amber |

Every figure is a deterministic function of the index only — re-selecting or reloading yields
identical numbers, but they carry no market meaning.

### 7.5 Data provenance & limitations

- **Fully synthetic** contagion metrics via `sr()`; the 40 link pairs and 9 transmission channels are
  a curated taxonomy, but their weights/scores are demo values.
- No network propagation, no `w_ij` matrix, no fire-sale feedback, no steady-state solve — the guide's
  entire mechanism is absent.
- `TREND` seasonality (`sin(i/k)`) is cosmetic, not an estimated cycle.

**Framework alignment (aspirational, per guide):** BIS WP 844 (climate risks in financial networks),
ECB FSR climate, NGFS systemic-risk workstream, Acemoglu et al. (2012) network origins of aggregate
fluctuations. The page references these but implements none of their mathematics.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Contagion scores and amplification factors
are seeded placeholders with no network model.

**8.1 Purpose & scope.** Quantify system-wide loss amplification from a climate/ESG shock propagating
across asset classes and institutions, for macro-prudential stress testing (FSAP climate module).

**8.2 Conceptual approach.** A **DebtRank / eigenvector-contagion** model on a financial network
(Battiston et al. 2012) augmented with **Greenwood-Landier-Thesmar fire-sale** price-impact, seeded
by **NGFS** scenario direct shocks. Benchmarks: ECB/BIS interbank contagion models and the IMF FSAP
network module; fire-sale layer mirrors the Fed's SCAP-style liquidity-spiral analysis.

**8.3 Mathematical specification.**
```
Direct shock:  s_i = NGFS_repricing_i (asset-class value change under scenario)
Propagation:   h_i(t) = min(1, h_i(t−1) + Σ_j W_ij · h_j(t−1))     # DebtRank, W row-normalised exposures
Fire-sale:     ΔP_a = − Λ_a · (Forced_sales_a / MktDepth_a)         # price impact per asset a
Amplification: AF = Σ_i Loss_i(with contagion) / Σ_i s_i·EAD_i
SystemVaR_99 = 99th pct of Σ_i Loss_i over Monte-Carlo shock draws
```

| Parameter | Symbol | Source |
|---|---|---|
| Exposure matrix | `W_ij` | BIS consolidated banking stats / EBA transparency |
| Price-impact coef | `Λ_a` | Amihud illiquidity / market-depth estimates |
| Direct shocks | `s_i` | NGFS Phase IV repricing by sector/asset |
| Common holdings | overlap | fund holdings (Morningstar) for fire-sale channel |

**8.4 Data requirements.** Bilateral exposure matrix (banks, sovereigns, funds); asset-class market
depth; NGFS scenario repricing; common-holding overlap. Vendors: Bloomberg, EBA data; free: NGFS,
ECB SDW. Platform holds NGFS scenario multipliers (`climate_scenarios` migration 088) reusable as
`s_i` seeds.

**8.5 Validation & benchmarking.** Reconcile amplification factor to BIS/ECB reported 1.3–3.2×
range; backtest against 2008/2011/2020 stress episodes; sensitivity to `W` sparsity and `Λ`
calibration; compare system VaR to ECB climate-stress-test loss estimates.

**8.6 Limitations & model risk.** Exposure matrices are partially confidential (proxying introduces
error); DebtRank ignores dynamic deleveraging; fire-sale impact is highly regime-dependent.
Conservative fallback: bound amplification with best/worst `Λ` and report the interval.

## 9 · Future Evolution

### 9.1 Evolution A — Build the propagation model: matrix, recursion, fire-sale loop (analytics ladder: rung 1 → 2)

**What.** §7's flag: the guide's contagion mechanism —
`Contagion_i(t) = Direct_shock_i + Σ_j w_ij·Contagion_j(t−1)` with an adjacency
matrix, steady-state iteration, and fire-sale amplification — does not exist. The
page decorates 40 curated asset-class link pairs with `sr()`-seeded correlations,
contagion scores, and amplification factors; no value on one tab feeds another; the
trend is a seeded sine wave. The curated link taxonomy and the 9 hand-set channel
weights are the only design assets. Evolution A implements the actual network model.

**How.** (1) Backend engine `contagion_network_engine`: a w_ij adjacency matrix over
the asset-class taxonomy (initially parameterized from the curated channel weights,
honestly labelled author-calibrated; upgradeable to estimated exposures later),
iterative propagation `x(t) = s + W·x(t−1)` to convergence with spectral-radius
checking (‖W‖ < 1 or explicit divergence reporting), and a fire-sale layer: price
impact proportional to distressed sales, feeding back as mark-to-market shocks —
the Greenwood-Landier-Thesmar structure, documented per the Atlas §8 convention.
(2) Direct shocks initialized from the platform's own scenario engines (NGFS
transition sector shocks, physical-risk EALs) instead of hand-typed values.
(3) Outputs: amplification factor = total/direct loss, per-node contagion paths, and
convergence diagnostics — replacing every seeded metric. (4) Numpy in the backend;
the 40-pair display becomes a view over the matrix.

**Prerequisites (hard).** Full PRNG purge; the w_ij parameterization must publish
its provenance (author-calibrated vs estimated) per cell; scenario-shock plumbing
from the stress-test engines. **Acceptance:** doubling one w_ij strictly increases
downstream contagion; the steady state satisfies the fixed-point equation to
tolerance; a zero-matrix run returns exactly the direct shocks.

### 9.2 Evolution B — Systemic-risk narrative for macro-prudential submissions (LLM tier 2)

**What.** The module's stated consumers — FSAP climate modules, G20 financial-
stability reporting — need the propagation *story*: which links carried the loss,
where fire-sale dynamics amplified, and what the second-round total means against
first-round losses. Evolution B drafts that narrative from the (post-Evolution A)
engine output: the shock initialization (traced to its source scenario), the top
contagion paths with their w_ij weights, the amplification decomposition
(network vs fire-sale), and the concentration findings — every number from the
solver payload, every mechanism claim tied to a matrix entry.

**How.** Tier-2 tool calls: run the propagation for a named scenario, retrieve path
decompositions, and iterate what-ifs ("mute the sovereign-bank link") as matrix
modifications the engine applies — sensitivity analysis as conversation. Grounding
corpus: §5's methodology block, the BIS WP-844 / ECB FSR references, and the
engine's model card. The fabrication validator covers loss figures and
amplification factors; mechanism language must match the engine's actual structure
(no invoking margin-call channels the model doesn't implement).

**Prerequisites (hard).** Evolution A in full — there is no model to narrate today,
and a systemic-risk narrative over seeded link scores would be indefensible in a
supervisory context. **Acceptance:** every figure in a draft matches solver output;
what-if deltas reproduce when re-run; the narrative names only transmission channels
present in the matrix parameterization.