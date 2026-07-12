# ESG Portfolio Optimizer
**Module ID:** `esg-portfolio-optimizer` · **Route:** `/esg-portfolio-optimizer` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Constructs optimised equity portfolios maximising expected return per unit of risk subject to ESG score constraints, carbon budget limits, and climate tilt requirements using mean-variance optimisation. Integrates ESG scores, carbon intensity data, and factor model covariance matrices to generate efficient frontiers with and without ESG constraints. Supports passive ESG index replication, active ESG tilting, and transition pathway portfolio construction.

> **Business value:** Delivers institutional-grade ESG portfolio construction combining rigorous quantitative optimisation with integrated ESG and climate constraints, enabling fund managers to launch Paris-aligned products, rebalance existing mandates, and demonstrate systematic ESG integration to clients and regulators.

**How an analyst works this module:**
- Load benchmark universe, return forecasts, and factor covariance matrix; connect ESG score and carbon intensity feeds.
- Set ESG constraints (minimum score, carbon intensity ceiling, exclusion list) and risk aversion parameter λ.
- Review ESG-constrained efficient frontier vs. unconstrained frontier to quantify ESG constraint cost.
- Run portfolio rebalancing optimisation with turnover and liquidity constraints; export trade list.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CONSTRAINTS`, `DATA`, `NAMES`, `RISK_LEVELS`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CONSTRAINTS` | `['Min ESG 60','Max Carbon 200','Paris Aligned','Net Zero','Exclusion List','Best-in-Class','SDG Aligned','SFDR Art 8'];` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.cre` |
| `filtered` | `useMemo(()=>{let d=[...DATA];if(search){const s=search.toLowerCase();d=d.filter(r=>r.name.toLowerCase().includes(s)\|\|r.sector.toLowerCase().includes(s)\|\|r.constraint.toLowerCase().includes(s));}if(fCon!=='All')d=d.filter(r=>r.constraint===fCon);if(fSector!=='All')d=d.filter(r=>r.sector===fSector);d.sort((a,b)=>{const av=a[sortCol],bv=b[so` |
| `kpis` | `useMemo(()=>{const d=filtered;if(!d.length)return{count:0,avgSharpe:0,avgEsg:0,avgReturn:0,avgVol:0,avgCarbon:0};return{count:d.length,avgSharpe:d.reduce((a,r)=>a+r.sharpe,0)/ Math.max(1, d.length),avgEsg:d.reduce((a,r)=` |
| `conDist` | `useMemo(()=>{const m={};filtered.forEach(r=>{m[r.constraint]=(m[r.constraint]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value})).sort((a,b)=>b.value-a.value);}` |
| `sectorAlloc` | `useMemo(()=>SECTORS.map(s=>({name:s.length>10?s.slice(0,10)+'..':s,current:filtered.filter(r=>r.sector===s).reduce((a,r)=>a+r.weight,0),opt:filtered.filter(r=>r.sector===s).reduce((a,r)=>a+r.optWeight,0)})).filter(d=>d.c` |
| `radarData` | `useMemo(()=>{if(!filtered.length)return[];const avg=k=>filtered.reduce((a,r)=>a+r[k],0)/ Math.max(1, filtered.length);return[{axis:'ESG',value:avg('esgScore')},{axis:'Env',value:avg('envScore')},{axis:'Soc',value:avg('so` |
| `trendData` | `useMemo(()=>['Q1','Q2','Q3','Q4'].map((q,i)=>({quarter:q,sharpe:filtered.reduce((a,r)=>a+[r.q1,r.q2,r.q3,r.q4][i],0)/(filtered.length\|\|1)})),[filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CONSTRAINTS`, `NAMES`, `RISK_LEVELS`, `SECTORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio ESG Score (weighted avg) | — | MSCI/Sustainalytics | Portfolio-level ESG score computed as holdings-weighted average; minimum constraint typically set at index + 10 points. |
| Carbon Intensity (tCO2e/$M Rev) | — | Trucost/CDP | Portfolio-weighted carbon intensity; EU PAB requires minimum 50% reduction vs. parent index at launch. |
| ESG Constraint Cost (bps p.a.) | — | Optimiser Output | Reduction in expected return from imposing ESG/carbon constraints; typically 5â€“30 bps for broad equity universes. |
| Active Share (%) | — | Cremers & Petajisto 2009 | Proportion of portfolio differing from benchmark; key metric for ESG active portfolio differentiation. |
- **Factor model covariance matrix (Barra/Axioma)** → Update monthly; validate factor structure stability across ESG-constrained subsets → **Asset covariance matrix Σ for optimiser input**
- **Return forecasts (alpha signals from quant models)** → Align signal universe with ESG score coverage; apply shrinkage to mitigate estimation error → **Expected return vector μ per security**
- **ESG scores and carbon intensity (Trucost/MSCI)** → Normalise and align with portfolio universe; construct constraint coefficient vectors → **ESG score and CI constraint rows for QP solver**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG-Constrained Mean-Variance Optimisation
**Headline formula:** `max wᵀμ − (λ/2)wᵀΣw, s.t. wᵀ×ESG ≥ ESG_min, wᵀ×CI ≤ CI_max, Σw_i = 1`

Solves quadratic programme maximising utility (return minus risk penalty) subject to minimum portfolio-weighted ESG score, maximum portfolio carbon intensity, sector deviation constraints, and full-investment constraint. The ESG-constrained efficient frontier is derived by parametrically varying λ from 0 to ∞, quantifying the return cost of ESG constraints.

**Standards:** ['Markowitz 1952', 'MSCI ESG Tilted Index Methodology', 'EU Paris-aligned Benchmark Regulation 2020']
**Reference documents:** Markowitz â€” Portfolio Selection (1952); EU Delegated Regulation 2020/1818 â€” Paris-Aligned and Climate Transition Benchmarks; MSCI ESG Tilted Indices Methodology 2024; Cremers & Petajisto â€” How Active is Your Fund Manager? (2009); BlackRock Aladdin ESG Optimisation Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The title and guide promise **ESG-constrained portfolio
> optimisation** (mean-variance with ESG/carbon/Paris constraints, current→optimised reallocation).
> **No optimiser runs.** The page fabricates 50 pre-built "portfolios", each carrying *both* a `weight`
> and an `optWeight`, and *both* a `carbonInt` and an `optCarbonInt` — but the "optimised" figures are
> **independent `sr()` draws**, not the output of any solver. The "efficient frontier" chart is a
> scatter of the synthetic (vol, return) pairs, not a computed frontier. What the module genuinely
> does is filter/sort/aggregate a synthetic portfolio table and render current-vs-"optimised"
> comparisons. §8 specifies the real optimiser.

### 7.1 What the module computes

Only descriptive aggregation over the synthetic table is real:

```js
kpis: avgSharpe/avgEsg/avgReturn/avgVol/avgCarbon = mean over filtered set
sectorAlloc: Σ weight and Σ optWeight per sector
radarData: mean(esgScore/env/soc/gov/greenRev); "Carbon Eff" = 100 − avgCarbon/5
trendData: mean of q1..q4 (synthetic quarterly Sharpe)
```

Each portfolio's fields are seeded (`s(idx)=sr(i*idx+idx)`):

```js
esgScore    = floor(25 + s(31)*70)         // 25–95
weight      = 0.5 + s(37)*4.5              // 0.5–5.0 %   ("current")
optWeight   = 0.3 + s(41)*4.7              // 0.3–5.0 %   ("optimised" — SEPARATE draw)
expReturn   = 2 + s(43)*14                 // 2–16 %
vol         = 5 + s(47)*20                 // 5–25 %
sharpe      = 0.2 + s(53)*2.3              // 0.2–2.5     (independent, NOT return/vol)
carbonInt   = floor(10 + s(61)*490)        // "current"
optCarbonInt= floor(5  + s(67)*300)        // "optimised" — SEPARATE draw
tempAlign   = 1.2 + s(71)*2.3              // 1.2–3.5 °C
```

Crucially, `sharpe` is drawn independently of `expReturn`/`vol` — it is *not* `(return−rf)/vol` — and
`optWeight`/`optCarbonInt` bear no optimisation relationship to their "current" counterparts.

### 7.2 Parameterisation

| Element | Source |
|---|---|
| 50 portfolio names | curated label list ("Paris Aligned Core", "SFDR Art 9 Optimal", …) |
| `CONSTRAINTS` (8) | curated labels: Min ESG 60, Max Carbon 200, Paris Aligned, Net Zero, Exclusion List, Best-in-Class, SDG Aligned, SFDR Art 8 |
| All numeric fields | synthetic `sr()` draws |
| "Optimised" weight/carbon | independent `sr()` draws (not solver output) |

The constraint labels are realistic ESG-mandate types, but they are assigned randomly to portfolios
and **do not gate** any of the numbers (a "Min ESG 60" portfolio can carry a drawn ESG of 25).

### 7.3 Calculation walkthrough

1. `genData(50)` fabricates the portfolio table.
2. Filter by search/constraint/sector; sort by any column; paginate (12/page).
3. Overview: constraint distribution pie, current-vs-opt sector allocation bars, (vol,return) scatter
   labelled "efficient frontier".
4. Constraint tab: ESG radar, current-vs-opt carbon bars grouped by constraint.
5. Attribution tab: E/S/G by constraint, green-revenue distribution.
6. Frontier tab: synthetic quarterly Sharpe trend, alpha-vs-drawdown scatter.

### 7.4 Worked example — the "optimisation" illusion

Portfolio i with `s(37)=0.6 → weight = 0.5+0.6×4.5 = 3.2%` and `s(41)=0.3 → optWeight =
0.3+0.3×4.7 = 1.71%`. The UI shows "Current 3.2% → Optimised 1.71% (reduce)", implying the optimiser
trimmed the position — but `optWeight` came from `sr(i*41+41)`, entirely unrelated to `weight`. Same
for carbon: `carbonInt = 10+s(61)*490` vs `optCarbonInt = 5+s(67)*300` are independent, so "optimised
carbon" is *usually* lower only because its range ceiling (305) is below the current ceiling (500) —
a range artefact, not an optimisation.

### 7.5 Data provenance & limitations

- **Fully synthetic** (`sr(s)=frac(sin(s+1)×10⁴)`); no covariance matrix, no objective function, no
  solver. "Optimised" columns are independent draws.
- `sharpe` is not consistent with the shown `expReturn`/`vol` (independent draw).
- Constraints are labels only; they neither filter the universe nor bind the numbers.
- The "efficient frontier" is a point cloud, not a computed frontier (no upper envelope, no
  risk-return trade-off curve).

**Framework alignment:** the guide/constraints reference **SFDR Art 8/9**, **EU Taxonomy**,
**Paris alignment**, **SBTi** and **Net Zero** — real ESG-mandate constraint types. A genuine
implementation would embed these as linear constraints in a mean-variance/CVaR optimiser (min ESG,
max carbon intensity, exclusion sets, taxonomy-alignment floor). None is implemented.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Construct ESG-constrained portfolios that maximise risk-adjusted return
subject to ESG score floors, carbon-intensity ceilings, exclusion lists and tracking-error budgets,
for SFDR Art 8/9 and net-zero-aligned mandates.

**8.2 Conceptual approach.** **Mean-variance optimisation** (Markowitz) with linear ESG constraints and
a tracking-error limit, or **robust/CVaR** variants — mirroring BlackRock Aladdin ESG optimisation and
Barra Open Optimizer. Carbon-decarbonisation-path constraints per CRREM/SBTi.

**8.3 Mathematical specification.** Decision vector `w` (weights):
- Objective: `max_w  w'μ − (λ/2)·w'Σw` (or `min CVaR_α(−w'r)`), `μ` expected returns, `Σ` covariance.
- Budget: `Σ w_i = 1`, `w_i ≥ 0` (long-only) or box bounds.
- ESG floor: `w'e ≥ E_min` (`e` = security ESG scores).
- Carbon ceiling: `w'c ≤ C_max` (`c` = carbon intensity tCO₂e/$M).
- Paris/decarbonisation: `w'c ≤ C_0·(1 − r)^{t}` (annual reduction rate r, CRREM/SBTi path).
- Exclusions: `w_j = 0 ∀ j ∈ X`; Taxonomy floor: `w'a ≥ A_min`.
- Tracking error: `(w − w_b)'Σ(w − w_b) ≤ TE_max²`.

| Parameter | Source |
|---|---|
| μ, Σ | factor model / historical (Barra/FactSet) |
| ESG scores e | MSCI / Sustainalytics |
| Carbon c | PCAF financed-emissions / Trucost |
| Decarbonisation r, path | SBTi sector / CRREM 1.5°C |
| λ, TE_max | mandate risk budget |

**8.4 Data requirements.** Security-level expected returns, covariance, ESG scores, carbon intensity,
taxonomy alignment, exclusion list, benchmark weights. None present.

**8.5 Validation & benchmarking plan.** Verify constraints bind at optimum (KKT); frontier convexity;
reconcile against Aladdin/Barra optimiser on the same inputs; out-of-sample TE realised vs budget.

**8.6 Limitations & model risk.** μ estimation error dominates MV solutions (→ robust/Black-Litterman);
Σ instability; ESG-carbon constraints can force concentration; corner solutions sensitive to bounds.

## 9 · Future Evolution

### 9.1 Evolution A — Run the QP the module is named for (analytics ladder: rung 1 → 5, staged)

**What.** The §7 flag: "no optimiser runs" — the page's 50 "portfolios" carry both `weight` and `optWeight`, both `carbonInt` and `optCarbonInt`, but the "optimised" figures are independent `sr()` draws; the "efficient frontier" is a scatter of synthetic (vol, return) pairs, not a computed frontier. The guide's model is fully specified: `max wᵀμ − (λ/2)wᵀΣw` subject to `wᵀESG ≥ ESG_min`, `wᵀCI ≤ CI_max`, full investment. This is the roadmap's rung-5 rung made literal — portfolio construction via scipy is named as a natural prescriptive first mover — and the §8 spec exists.

**How.** Stage 1: `services/esg_optimizer_engine.py` solving the QP with scipy (SLSQP or a proper QP via cvxpy if dependency review clears it) over a real universe: holdings/benchmark from `portfolios_pg`, ESG scores and carbon intensities from the company master, covariance from the shared monthly-return store (sample covariance with shrinkage first; factor-model Σ later). Stage 2: the genuine efficient frontier by λ-sweep, constrained vs unconstrained, so "ESG constraint cost (bps)" becomes a computed difference — the §4 metric that today is asserted. Stage 3: turnover/liquidity constraints and trade-list export per the workflow. Bench pins: a 3-asset analytic QP case with hand-checkable solution, plus the constraint-binding identity (active constraints reported with shadow prices).

**Prerequisites (hard).** The seeded `optWeight` columns deleted at ship (displaying solver-look-alike numbers next to a real solver would be indistinguishable poison); return/covariance data from the factor-stack Evolutions A; PAB rule encoding (50% CI reduction) documented. **Acceptance:** the bench QP reproduces the analytic optimum; the frontier is monotone and the constrained frontier lies weakly below the unconstrained; the trade list sums to zero net weight change.

### 9.2 Evolution B — Mandate-design analyst over the real optimizer (LLM tier 2)

**What.** A tool-calling analyst for product/mandate design: "build a Paris-aligned version of our benchmark: what does the 50% carbon reduction cost in expected return and tracking error, which sectors get squeezed, and where does the ESG-minimum constraint start binding?" It runs Evolution A's optimizer across constraint configurations, reads shadow prices to explain *which* constraint drives each distortion, and drafts the mandate-design memo — constraint costs quoted only from computed frontier differences.

**How.** Tools: `optimize(universe, constraints, lambda)`, `compute_frontier(constraints, sweep)`, `compare_solutions(a, b)`, `get_binding_constraints(solution)`. Grounding corpus = this Atlas record's §5 QP formulation and the PAB regulation reference, so constraint semantics quoted match the implementation. The analyst's explanatory edge is shadow-price narration ("the CI ceiling binds at 41bps of expected return; the ESG floor is slack") — real optimizer outputs, not intuition. Infeasible constraint combinations are reported as such with the minimal relaxation suggested by the solver, never silently softened.

**Prerequisites (hard).** Evolution A — a mandate memo over seeded `optWeight`s would advise real product launches on fabricated optimization. **Acceptance:** a golden mandate memo's costs match frontier recomputation; binding-constraint claims match solver output; an infeasible request returns the infeasibility certificate, not a fudged portfolio.