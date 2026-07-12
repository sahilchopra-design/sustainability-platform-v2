# Copula Tail Risk
**Module ID:** `copula-tail-risk` · **Route:** `/copula-tail-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Models multivariate tail risk for correlated climate losses across asset classes and geographies using copula theory, capturing co-dependence structures that standard correlation matrices miss under extreme climate scenarios. Implements Gaussian, Student-t, Gumbel, and Clayton copulas for asymmetric tail dependence.

> **Business value:** Enables risk managers and actuaries to capture the fat-tailed, co-dependent nature of climate losses that standard correlation-based VaR models underestimate, supporting ORSA, ICAAP, and Solvency II SCR calculations under climate stress.

**How an analyst works this module:**
- Select asset universe and climate scenario in the configuration panel
- Marginal Distributions tab fits individual asset loss distributions with diagnostics
- Copula Calibration tab compares fit of Gaussian, t, Gumbel, and Clayton copulas by AIC/BIC
- Tail Dependence tab visualises λ_U heatmap across asset pairs
- Monte Carlo Simulation runs 100,000 joint loss scenarios under selected copula
- Portfolio VaR results panel shows comparison across copula families and standalone sum

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COPULAS`, `COPULA_COMPARE`, `MONTHLY`, `PAGE`, `PORTFOLIOS`, `STRATEGIES`, `STRESS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `STRESS` | 12 | `name`, `loss`, `prob`, `recovery` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `STRATEGIES` | `['Long/Short Equity','Global Macro','Market Neutral','Risk Parity','Multi-Strategy','Event Driven','Statistical Arb','Vol Arb'];` |
| `COPULAS` | `['Gaussian','Student-t','Clayton','Gumbel','Frank','Joe','BB1','BB7'];` |
| `PORTFOLIOS` | `Array.from({length:50},(_,i)=>{const st=STRATEGIES[Math.floor(sr(i*3)*STRATEGIES.length)];return{id:i+1,name:'Portfolio '+(i+1)+' '+st.split('/')[0],strategy:st,` |
| `MONTHLY` | `Array.from({length:24},(_,i)=>{const d=new Date(2024,i%12,1);return{month:d.toLocaleString('default',{month:'short'})+' '+(2024+Math.floor(i/12)),` |
| `STRESS` | `[{name:'2008 GFC',loss:22.5,prob:1.2,recovery:450},{name:'COVID-19',loss:18.3,prob:2.1,recovery:120},{name:'Taper Tantrum',loss:8.7,prob:5.4,recovery:90},{name:'Eurozone Crisis',loss:14.2,prob:2.8,recovery:280},{name:'Ch` |
| `COPULA_COMPARE` | `COPULAS.map((c,i)=>({name:c,logLik:+(sr(i*137)*50-100).toFixed(1),aic:+(sr(i*139)*100+200).toFixed(1),bic:+(sr(i*143)*100+210).toFixed(1),tailFit:+(sr(i*149)*40+50).toFixed(1),corr:+(sr(i*151)*0.5+0.2).toFixed(3)}));` |
| `filtered` | `useMemo(()=>{let d=[...PORTFOLIOS];if(search)d=d.filter(p=>p.name.toLowerCase().includes(search.toLowerCase()));if(filterStrat!=='All')d=d.filter(p=>p.strategy===filterStrat);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol])?1:-1):((a[sortCol]<b[sortCol])?1:-1));return d;},[search,sortCol,sortDir,filterStrat]); const paged=filtered.s` |
| `stressF` | `useMemo(()=>{let d=[...STRESS];if(stressSearch)d=d.filter(s=>s.name.toLowerCase().includes(stressSearch.toLowerCase()));d.sort((a,b)=>stressDir==='asc'?((a[stressSort]>b[stressSort])?1:-1):((a[stressSort]<b[stressSort])?1:-1));return d;},[stressSearch,stressSort,stressDir]);  const doSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.create` |
| `kpis` | `useMemo(()=>{const n=filtered.length\|\|1;return{count:filtered.length,avgVaR:(filtered.reduce((s,p)=>s+parseFloat(p.var95),0)/n).toFixed(2),avgCVaR:(filtered.reduce((s,p)=>s+parseFloat(p.cvar95),0)/n).toFixed(2),avgTail:(` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COPULAS`, `STRATEGIES`, `STRESS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Tail VaR (99.5%) | — | Copula simulation | Portfolio loss at 99.5th percentile accounting for tail co-dependence between assets |
| Upper Tail Dependence λ_U | — | Copula calibration | Probability of joint extreme loss; 0 = independence, 1 = perfect co-crash |
| Student-t Copula df | — | MLE calibration | Degrees of freedom parameter; lower values imply heavier joint tails and higher co-crash risk |
| Copula Diversification Benefit | — | Model output | Reduction in portfolio VaR from copula model vs simple sum of individual asset VaRs |
| Climate Co-occurrence Multiplier | — | NGFS/IPCC | Factor by which climate scenarios amplify co-dependence vs historical data |
- **Historical asset return and loss data** → Fit marginal distributions by asset class using MLE → **Marginal CDF per asset**
- **Climate co-occurrence event data (NGFS/IPCC)** → Augment historical copula calibration with scenario tail weights → **Copula parameter θ per family**
- **Monte Carlo engine** → Simulate 100k joint scenarios, compute portfolio loss distribution → **Portfolio copula VaR and λ_U metrics**

## 5 · Intermediate Transformation Logic
**Methodology:** Copula-Based Multivariate VaR
**Headline formula:** `VaR_portfolio = Q⁻¹(α, C(u₁,...,u_n; θ))`

Marginal distributions of individual asset climate losses are fitted independently (GEV or GPD for physical losses, normal for transition). Copula parameters (θ) are calibrated to historical joint loss data augmented with climate scenario co-occurrence probabilities. Tail dependence coefficient λ_U = lim P(U₂>u|U₁>u) as u→1 measures co-crash risk. Student-t copula with low df captures symmetric fat-tail co-dependence; Gumbel captures upper-tail clustering (simultaneous extreme physical events).

**Standards:** ['McNeil, Frey & Embrechts (2005)', 'Basel III Internal Models', 'EIOPA Solvency II SCR']
**Reference documents:** McNeil, Frey & Embrechts â€” Quantitative Risk Management (2005); Basel III Internal Models Approach for Market Risk (FRTB); EIOPA Solvency II SCR Standard Formula â€” Correlation Matrices; Sklar (1959) Fonctions de répartition n-dimensionnelles

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (no model behind the numbers).** The guide describes a **Copula-Based
> Multivariate VaR** engine — marginal GEV/GPD fits, copula parameter calibration (Gaussian, Student-t,
> Gumbel, Clayton), a tail-dependence coefficient `λ_U = lim P(U₂>u│U₁>u)`, and a 100,000-path Monte Carlo
> over `VaR = Q⁻¹(α, C(u₁,…,u_n; θ))`. **None of that is computed.** Every risk figure on the page — VaR
> 95/99, CVaR, tail index, tail dependence, correlation, copula log-likelihood, AIC, BIC — is a **directly
> `sr()`-seeded random number**. There is no copula, no marginal fitting, no simulation, and no
> tail-dependence estimation anywhere in the code. Additionally the guide frames this as *climate* loss
> co-dependence, but the seeded portfolios are **hedge-fund strategies** (Long/Short, Global Macro, Vol
> Arb…), not climate assets. The page is a convincing *mock-up* of a copula VaR dashboard. §8 specifies the
> real model.

### 7.1 What the module "computes"

Nothing is derived from data — the metrics are assigned:

```js
var95   = sr(i·13)·8 + 1      // 1–9 %
var99   = sr(i·17)·12 + 2     // 2–14 %
cvar95  = sr(i·19)·12 + 2     // 2–14 %
tailIndex = sr(i·31)·3 + 1
corr    = sr(i·41)·0.6 + 0.1
tailDep = sr(i·43)·0.4 + 0.05      // "tail dependence" — a random number, not λ_U
```
Copula comparison is equally synthetic:
```js
COPULA_COMPARE = COPULAS.map((c,i) ⇒ ({
  logLik: sr(i·137)·50 − 100,  aic: sr(i·139)·100 + 200,
  bic:    sr(i·143)·100 + 210, tailFit: sr(i·149)·40 + 50, corr: sr(i·151)·0.5 + 0.2 }))
```
The only *real* arithmetic is portfolio-average KPIs (`avgVaR = mean(var95)`, etc.) — averages **of
random numbers**. There is no relationship between a portfolio's `var95` and its `cvar95`, `corr`, or
`tailDep`; each is an independent draw, so e.g. CVaR < VaR can occur (a coherence violation).

### 7.2 Parameterisation / scoring rubric

| Field | Generator | Provenance |
|---|---|---|
| `var95/var99/cvar95/cvar99` | `sr(i·k)·span + floor` | Synthetic seeded PRNG (no risk model) |
| `tailIndex`, `tailDep`, `corr`, `skew`, `kurt`, `beta` | `sr()` scaled | Synthetic seeded PRNG |
| `logLik/aic/bic/tailFit` per copula | `sr()` scaled | Synthetic — no likelihood was maximised |
| `STRESS` scenarios | curated `loss/prob/recovery` + seeded `contagion/severity` | Real event names, mixed provenance |

The 8 copula families (Gaussian, Student-t, Clayton, Gumbel, Frank, Joe, BB1, BB7) are named correctly but
only as **labels** — no copula density is ever evaluated. The `STRESS` table is the one partly-real
element: named historical crises (2008 GFC −22.5%, COVID −18.3%, Tech Bubble −25.1%) with plausible
curated loss/recovery figures, augmented by seeded `contagion`/`severity`.

### 7.3 Calculation walkthrough

1. `PORTFOLIOS` (50) and `MONTHLY` (24) and `COPULA_COMPARE` (8) are all generated once from `sr()`.
2. `filtered` applies search/strategy filter and sort; `kpis` averages the seeded VaR/CVaR/tail fields.
3. Every chart (VaR trend, tail-events line, VaR-vs-return scatter, copula AIC/BIC bars, stress table)
   renders one of the pre-seeded constants. No user input changes any risk number — filters only subset.

### 7.4 Worked example

Portfolio `i = 0`: `var95 = sr(0)·8 + 1`. `sr(0) = frac(sin(1)·10⁴) = frac(8414.7) ≈ 0.71`, so
`var95 = 0.71·8 + 1 = 6.68%`. Its `cvar95 = sr(0)·12 + 2` uses the *same* `sr(0)` → `0.71·12+2 = 10.52%`
(here CVaR>VaR by luck, but for portfolios where the two seeds diverge the ordering is not guaranteed).
Its `tailDep = sr(0·43)·0.4 + 0.05 = sr(0)·0.4+0.05 = 0.334` — presented as an upper-tail-dependence
coefficient, but it is an independent random draw with no link to `corr` or the (non-existent) copula fit.

### 7.5 Companion analytics on the page

Four tabs: Risk Dashboard (KPIs, VaR/CVaR trend, strategy pie, tail-events line, VaR-return scatter),
Portfolio Analysis (sortable 50-row table + drill-down), Copula Models (AIC/BIC comparison bars,
tail-dependence display), Stress Scenarios (12 crises table with loss/prob/recovery). CSV export. No
backend engine, no route — entirely client-side seeded data.

### 7.6 Data provenance & limitations

- **All risk metrics are synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`. There is *no* copula model,
  *no* Monte Carlo, *no* marginal or tail-dependence estimation — the module is a UI shell.
- **Coherence is not guaranteed**: VaR, CVaR, correlation, and tail dependence are independent draws, so
  the usual inequalities (CVaR ≥ VaR, `λ_U` consistent with the copula family) can be violated.
- Domain mismatch: seeded portfolios are hedge-fund strategies, not the climate-loss assets the guide
  describes. The `STRESS` scenario names/losses are the only externally-grounded content.

**Framework alignment (named, not implemented):** *Sklar's theorem* and *McNeil, Frey & Embrechts (2005)*
underpin copula VaR — a copula `C` couples marginals `F_i` into a joint law; `λ_U` measures co-crash
probability (0 for Gaussian, >0 for Student-t/Gumbel). *Basel III FRTB* internal models and *EIOPA
Solvency II SCR* correlation matrices are the intended supervisory uses. The code invokes all these names
but computes none of the underlying mathematics.

---

## 8 · Model Specification — Copula-Based Multivariate Tail VaR

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Estimate portfolio tail VaR/CVaR that captures asymmetric co-dependence between asset (or climate-loss)
marginals, for ORSA/ICAAP/Solvency II SCR under stress. Coverage: any portfolio with historical marginal
losses and a definable dependence structure.

### 8.2 Conceptual approach
Two-stage **inference-functions-for-margins (IFM)** copula estimation (McNeil-Frey-Embrechts): fit heavy-
tailed marginals (GEV/GPD via peaks-over-threshold for physical losses; Student-t for financial), then fit
a copula to the probability-integral-transformed data and simulate the joint law. This is the industry
standard for tail-dependent risk (RiskMetrics, Solvency II internal models) and is what the guide describes.

### 8.3 Mathematical specification
```
Marginals:  û_{i,t} = F̂_i(x_{i,t})        (GPD tail above threshold u_i; empirical below)
Copula MLE: θ̂ = argmax Σ_t log c(û_{1,t},…,û_{n,t}; θ)      per family
Select:     min AIC/BIC across {Gaussian, t, Clayton, Gumbel, Frank, Joe, BB1, BB7}
Tail dep:   λ_U = 2 − 2^{1/θ} (Gumbel);  λ_U = 2·t_{ν+1}(−√((ν+1)(1−ρ)/(1+ρ))) (t)
Simulate:   draw U ~ Ĉ (N=100k), invert x_i = F̂_i^{-1}(U_i), L = Σ w_i x_i
VaR_α = quantile_α(L);   CVaR_α = E[L │ L > VaR_α]
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| GPD shape/scale | `ξ, β` | POT fit on historical losses (extreme-value theory) |
| Copula param | `θ` (`ρ, ν` for t) | MLE on PIT data |
| Climate co-occurrence | tail weights | NGFS/IPCC scenario joint-event probabilities |
| Simulation size | `N` | 100,000 (guide) |

### 8.4 Data requirements
Aligned marginal loss/return histories per asset; a threshold for POT; for the climate framing, NGFS/IPCC
joint hazard probabilities to augment the copula tail. The platform has none of these wired here; physical-
risk modules and NGFS scenario tables could supply climate marginals and co-occurrence weights.

### 8.5 Validation & benchmarking plan
Backtest VaR exceedances (Kupiec POF, Christoffersen independence); compare copula-selected `λ_U` against
realised joint-tail frequencies; reconcile portfolio VaR against a standalone-sum (diversification benefit
should be 15–40%, per guide). Sensitivity on threshold `u` and copula family; benchmark against RiskMetrics.

### 8.6 Limitations & model risk
Copula selection is unstable in small samples and sensitive to the marginal threshold; report a family-
ensemble VaR, not a single family. Student-t vs Gumbel choice materially changes `λ_U` — disclose it.
Climate co-occurrence weights are deeply uncertain. Conservative fallback: use the Student-t copula with a
low df (heavier joint tails) as the prudent default when family selection is ambiguous.

## 9 · Future Evolution

### 9.1 Evolution A — A real copula engine behind the convincing shell (analytics ladder: rung 1 → 3)

**What.** §7's flag is the bluntest in the slice: "no model behind the numbers" —
every VaR, CVaR, λ_U, correlation, and copula AIC/BIC is an independent `sr()` draw
(so CVaR < VaR coherence violations can occur), no copula density is ever evaluated,
and the seeded portfolios are hedge-fund strategies rather than the climate-loss
assets the guide describes. The UI structure, however, is the right shape for the
real thing. Evolution A builds the engine: marginal fitting, copula calibration by
maximum likelihood, tail-dependence estimation, and Monte Carlo joint-loss
simulation — server-side, since 100k paths do not belong in React.

**How.** (1) Backend engine `copula_tail_risk_engine` with scipy/statsmodels:
GPD/GEV marginal fits for physical-loss series, Gaussian/Student-t/Clayton/Gumbel
calibration on rank-transformed data, real AIC/BIC comparison, analytic λ_U per
family, and MC simulation returning the VaR/CVaR ladder — pinned in `bench_quant.py`
with a fixed-seed reference case. (2) Domain correction: the asset universe becomes
climate-loss series the platform can actually supply — per-peril EALs from the
physical-risk pricing engine across regions, sector transition losses from the
stress-test engine — restoring the guide's stated purpose (ORSA/Solvency II climate
co-dependence). (3) Coherence guaranteed by construction (CVaR from the same
simulated distribution as VaR). (4) The curated `STRESS` crisis table stays as
grounding context.

**Prerequisites (hard).** Full `sr()` purge of the metrics layer; joint loss series
with enough observations to fit — where history is thin, the engine must report
fit-quality warnings, not silently fit 4 parameters to 12 points. **Acceptance:**
fixed-seed simulation reproduces; CVaR ≥ VaR always; Gaussian copula reports λ_U = 0
and Gumbel λ_U > 0 as theory requires; AIC ordering is stable across re-runs.

### 9.2 Evolution B — Tail-risk translator for ORSA/ICAAP committees (LLM tier 1 → 2)

**What.** Copula results are notoriously hard to communicate — the difference between
correlation and tail dependence is exactly what ORSA reviewers probe. Evolution B is
a copilot that explains the (post-Evolution A) engine output in supervisory language:
why the Student-t was selected (AIC table), what λ_U = 0.35 between European flood
and Mediterranean wildfire losses means for simultaneous-extreme capital, how the
copula VaR differs from the standalone sum, and drafts the ORSA section with every
figure from the engine payload. What-ifs ("re-simulate with df = 3") execute as tool
calls, never as in-context math.

**How.** Tier 1 ships on engine payloads plus this Atlas record and the McNeil-Frey-
Embrechts framing §5 cites; tier 2 adds tool schemas over the calibrate/simulate
endpoints with the fabrication validator on every percentage (simulated risk numbers
are prime hallucination bait). The copilot's caveat set comes from the engine's own
fit-quality warnings — thin data propagates to hedged language automatically.

**Prerequisites (hard).** Evolution A in full — narrating the current seeded shell
would put fluent authority on numbers with no model behind them, the worst failure
mode this platform's guardrails exist to prevent. **Acceptance:** every numeric in a
generated ORSA section matches an engine response; the copilot correctly refuses to
compare copula families the engine hasn't fitted for the selected universe; asked
"is this correlation or tail dependence?", it answers with the engine's actual λ_U
versus ρ values.