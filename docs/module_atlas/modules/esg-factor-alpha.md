# ESG Factor Alpha
**Module ID:** `esg-factor-alpha` · **Route:** `/esg-factor-alpha` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies and decomposes alpha generation from ESG factor exposures in equity portfolios using systematic factor modelling. Integrates ESG scores as systematic factors alongside traditional risk factors (market, size, value, momentum) in a multi-factor return attribution framework. Supports quantitative ESG strategy development, factor tilting, and portfolio construction for ESG-integrated equity funds.

> **Business value:** Enables quantitative portfolio managers to build evidence-based ESG factor strategies, demonstrate that ESG integration generates statistically significant alpha in relevant market regimes, and satisfy client mandates requiring both ESG alignment and competitive risk-adjusted returns.

**How an analyst works this module:**
- Load portfolio holdings and benchmark weights; connect to ESG score provider feed.
- Construct sector-neutral long-short ESG factor and run panel regression against the selected factor model.
- Review ESG factor loading, t-statistic, and rolling alpha chart to assess signal persistence and regime sensitivity.
- Run factor tilt optimisation to maximise ESG factor exposure within tracking error and turnover constraints.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `BACKTEST`, `COMPANIES`, `FACTORS`, `KPI`, `PAGE_SIZE`, `SECTORS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FACTORS` | 8 | `factor`, `return3m`, `return12m`, `sharpe`, `ir` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ACCENT` | `'#0c4a6e';const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(2):v:v;` |
| `BACKTEST` | `Array.from({length:36},(_,i)=>({month:`${2022+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,esgAlpha:+((sr(i*7)-0.4)*3).toFixed(2),eAlpha:+((sr(i*11)-0.35)*2.5).toFixed(2),sAlpha:+((sr(i*13)-0.4)*2).toFixed(2),g` |
| `FACTORS` | `[{factor:'ESG Quality',return3m:2.4,return12m:8.7,sharpe:1.2,ir:0.85},{factor:'E - Climate',return3m:1.8,return12m:6.2,sharpe:0.9,ir:0.65},{factor:'S - Workforce',return3m:1.1,return12m:4.8,sharpe:0.7,ir:0.52},{factor:'G` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `filtered` | `useMemo(()=>{let d=[...COMPANIES];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(secF!=='All')d=d.filter(r=>r.sector===secF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,secF,sortCol,sortDir]); const paged=filtered.slice((page-1)*PAGE_SIZE,page` |
| `kpis` | `useMemo(()=>{const avg=(k)=>+(COMPANIES.reduce((s,c)=>s+c[k],0)/COMPANIES.length).toFixed(2);return{avgAlpha:avg('totalAlpha'),avgSharpe:avg('sharpe'),avgEsg:Math.round(COMPANIES.reduce((s,c)=>s+c.esgScore,0)/COMPANIES.l` |
| `sectorAlpha` | `useMemo(()=>{const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,alpha:0,n:0};m[c.sector].alpha+=c.totalAlpha;m[c.sector].n++;});return Object.values(m).map(s=>({...s,alpha:+(s.alpha/s.n).toFixe` |
| `alphaDistData` | `useMemo(()=>{const bins=[{range:'<-5%',count:0},{range:'-5 to 0%',count:0},{range:'0 to 5%',count:0},{range:'5 to 10%',count:0},{range:'>10%',count:0}];COMPANIES.forEach(c=>{if(c.totalAlpha<-5)bins[0].count++;else if(c.totalAlpha<0)bins[1].count++;else if(c.totalAlpha<5)bins[2].count++;else if(c.totalAlpha<10)bins[3].count++;else bins[4].` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FACTORS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Factor Loading (β_esg) | — | MSCI/Barra Factor Model | Portfolio sensitivity to the long-short ESG factor; positive β indicates ESG tilt contributing positively when ESG factor is in favour. |
| Annualised ESG Alpha (bps) | — | Factor Regression Output | Excess return attributable to ESG exposure after stripping traditional factor premia; statistically significant at 95% CI. |
| ESG Factor Information Ratio | — | Quant Analytics | ESG factor return divided by tracking error of ESG factor portfolio; IR >0.3 indicates exploitable systematic signal. |
| ESG Factor Sharpe Ratio | — | Factor Performance | Risk-adjusted return of long-short ESG factor portfolio; benchmark against size, value, and momentum factor Sharpe ratios. |
- **ESG score feeds (MSCI, Sustainalytics, ISS)** → Construct sector-neutral cross-sectional Z-score within each GICS sub-industry → **Normalised ESG factor scores per security**
- **Equity return data (Bloomberg/Refinitiv)** → Align monthly excess returns with factor exposures; run rolling 36-month panel regression → **ESG factor loading (β), t-stat, and annualised alpha by period**
- **Barra/FactSet factor model risk data** → Strip traditional factor contributions (mkt, size, val, mom, quality) from gross alpha → **Pure ESG alpha after multi-factor adjustment**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Alpha Model
**Headline formula:** `r_i = α + β_mkt×MKT + β_esg×ESG + β_mom×MOM + β_val×VAL + ε_i`

Panel regression of security excess returns on ESG factor and traditional systematic factors. ESG factor constructed as long-short portfolio ranked on provider consensus score within each GICS sector to neutralise sector bias. α (intercept) measures pure ESG alpha after controlling for known risk factors. Factor exposures (β) are estimated via rolling 36-month windows.

**Standards:** ['Fama-French 5-Factor Model', 'MSCI ESG Momentum Factor', 'Barra Global Equity Model GEM4']
**Reference documents:** Fama & French â€” A Five-Factor Asset Pricing Model (2015); MSCI ESG Momentum Factor Methodology 2023; Nagy et al. â€” Can ESG Add Alpha? MSCI Research 2016; Barra Global Equity Model GEM4 Handbook 2023; Friede et al. â€” ESG and Financial Performance: Aggregated Evidence (2015)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **panel factor regression**
> `r_i = α + β_mkt·MKT + β_esg·ESG + β_mom·MOM + β_val·VAL + ε_i` with rolling 36-month β estimation
> and sector-neutralised long-short ESG factor construction. **No regression runs in the code.** Each
> company's `totalAlpha`, `sharpe`, `infoRatio`, factor returns (`eReturn/sReturn/gReturn`), momentum,
> quality, value, beta, drawdown and tracking error are **independent `sr()` PRNG draws**; there is no
> ESG factor, no β estimation, no OLS. The page is a **synthetic factor-analytics dashboard** over 100
> named large-caps, computing only simple portfolio averages and bucket counts. §8 specifies the
> missing regression model.

### 7.1 What the module computes

Only aggregate statistics over the fabricated company table are real computation:

```js
avg(k)       = Σ COMPANIES[k] / 100                      // avgAlpha, avgSharpe, avgIR
avgEsg       = round(Σ esgScore / 100)
positiveAlpha= #(totalAlpha > 0)
sectorAlpha  = mean(totalAlpha) grouped by sector
alphaDist    = histogram of totalAlpha into [<−5, −5..0, 0..5, 5..10, >10]%
```

The underlying per-company fields are all seeded:

```js
esgScore   = round(20 + sr(i*7)*75)         // 20–95
totalAlpha = (sr(i*19) − 0.35)*25           // ≈ −8.75 … +16.25 %
sharpe     = (sr(i*43) − 0.2)*3             // ≈ −0.6 … +2.4
infoRatio  = (sr(i*47) − 0.3)*2.5
beta       = 0.5 + sr(i*61)*1.2
```

### 7.2 Parameterisation

| Element | Source |
|---|---|
| 100 company names + sectors | curated real S&P-100-style list (hand-assigned GICS-like sectors) |
| Per-company factor returns/alpha/Sharpe/β | synthetic `sr(seed)` draws |
| `FACTORS` table (8 factors, 3m/12m return, Sharpe, IR) | hard-coded plausible constants (ESG Momentum best +11.5%/12m IR 1.1; Controversy worst −2.4%) |
| `BACKTEST` (36 months of alphas) | `sr()`-jittered linear cumulative series |

The `FACTORS` constants are directionally sensible (ESG Quality +8.7%/12m, Carbon Intensity weak
+3.1%, Controversy negative) and consistent with the guide's cited MSCI/Nagy research, but they are
**static illustrative values**, not estimated loadings.

### 7.3 Calculation walkthrough

1. `COMPANIES` fabricated once (100 rows) from `sr(i·k)`.
2. `kpis` averages alpha/Sharpe/IR/ESG across all 100 and counts positive-alpha names.
3. Screening tab: filter by search/sector, sort by any column, paginate (15/page).
4. Alpha-decomposition tab: `sectorAlpha` (mean by sector), `alphaDistData` (5-bin histogram), a
   `radarData` view built from `|avgAlpha|`, `|avgSharpe|`, `|avgIR|` scaled to 0–100.
5. Backtesting tab: plots the `BACKTEST` cumulative ESG-strategy vs benchmark series.

### 7.4 Worked example — avgAlpha KPI

`avgAlpha = (Σ totalAlpha)/100` where `totalAlpha_i = (sr(i*19) − 0.35)×25`. Since `sr` is ≈uniform
on [0,1], `E[sr − 0.35] = 0.15`, so the expected mean alpha ≈ `0.15×25 = +3.75%` — the dashboard's
headline "+~3.8% avg alpha" is a mechanical artefact of the `−0.35` offset in the draw, not an
estimated ESG premium. `positiveAlpha` ≈ #(sr > 0.35) ≈ 65 of 100. Reproducible, but uninformative.

### 7.5 Data provenance & limitations

- **All per-company analytics are synthetic** (`sr(s)=frac(sin(s+1)×10⁴)`). The company names are
  real; every number attached to them is fabricated.
- The headline alpha is biased positive purely by the `−0.35` PRNG offset — a modelling artefact.
- No factor is actually constructed; the "factor radar" repurposes portfolio averages as radar axes.
- `FACTORS` and `BACKTEST` are static/jittered constants, not regression output.

**Framework alignment:** the guide invokes **Fama-French 5-Factor**, **MSCI ESG Momentum** and **Barra
GEM4**; the module *references* these as labels only. A true implementation would build a
sector-neutral long-short ESG factor (rank within GICS, top-minus-bottom quintile) and regress excess
returns on FF5+ESG to isolate α — none of which the code does. Information Ratio (`α/TE`) and Sharpe
are correctly *defined* in the FACTORS table but not *computed* from data.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate the pure ESG alpha and factor loadings of an equity portfolio after
controlling for market, size, value, momentum and quality, to decide whether ESG tilts add
risk-adjusted return.

**8.2 Conceptual approach.** A **FF5 + ESG panel regression** with sector-neutral long-short ESG factor
construction, mirroring **MSCI Barra GEM4** (explicit ESG/controversy factors) and **Nagy et al.
(MSCI 2016)** ESG-tilt attribution.

**8.3 Mathematical specification.**
- ESG factor: within each GICS sector, `z_{i} = (ESG_i − μ_{sector})/σ_{sector}`; factor return
  `F^{ESG}_t = Σ_i w^{+}_i r_{i,t} − Σ_j w^{-}_j r_{j,t}` (top vs bottom z-quintile, sector-neutral).
- Regression (per security or portfolio): `r_{i,t} − rf_t = α_i + β^M MKT_t + β^{SMB} SMB_t +
  β^{HML} HML_t + β^{WML} WML_t + β^{QMJ} QMJ_t + β^{ESG} F^{ESG}_t + ε_{i,t}`, rolling 36-month OLS.
- Annualised alpha `= 12·α`; `IR = α_ann / σ(ε)_ann`; Newey-West (lag 3) standard errors.

| Parameter | Source |
|---|---|
| FF5 + WML factors | Kenneth French / AQR data libraries |
| ESG scores | MSCI / Sustainalytics point-in-time |
| Returns, rf | CRSP / Bloomberg; 1-mo T-bill |
| Rolling window | 36 months (guide) |
| Sector map | GICS |

**8.4 Data requirements.** Point-in-time ESG scores (avoid look-ahead), monthly total returns, FF5+WML
series, risk-free, GICS. None currently loaded — the 100-name universe is only a label set.

**8.5 Validation & benchmarking plan.** t-stat significance of β^ESG and α; out-of-sample α stability;
reconcile factor loadings against Barra GEM4; compare ESG-factor Sharpe against size/value/momentum.

**8.6 Limitations & model risk.** Short ESG-score history; rating revisions bias backtests;
sector-neutralisation choice moves the factor materially; multicollinearity between ESG and quality
factors inflates loading variance.

## 9 · Future Evolution

### 9.1 Evolution A — Run the panel regression the §8 spec defines (analytics ladder: rung 1 → 3)

**What.** The §7 flag: "no regression runs in the code" — the promised `r_i = α + β_mkt·MKT + β_esg·ESG + β_mom·MOM + β_val·VAL + ε` with rolling 36-month betas and sector-neutral long-short ESG factor construction doesn't exist. All 100 companies' alphas, Sharpes, IRs, and factor returns are independent `sr()` draws (the "t-stat" is `infoRatio × √12`, a display heuristic); real computation is limited to averages and histogram buckets over the fabricated table. Evolution A implements the §8 model on real data, sharing infrastructure with `esg-backtesting`'s Evolution A rather than building a second factor stack.

**How.** (1) Shared foundation: the FF factor history ingester and monthly-return store from `esg-backtesting` §9.1; this module adds the ESG-specific leg — sector-neutral cross-sectional Z-scores from the platform's rating data, long-short quintile factor construction per the §5 description. (2) `services/esg_factor_engine.py`: rolling-window OLS (statsmodels) producing β_esg, genuine t-stats (HAC), and rolling alpha series — the three charts the page fakes today. (3) The 100-company table becomes real: per-security factor loadings from the regressions, not draws. (4) Rung 3: reproduce a published anchor (Nagy et al./MSCI ESG-momentum findings are the module's own citation) directionally on overlapping windows, and pin the factor-construction arithmetic in `bench_quant.py`. (5) The tilt-optimization step in the workflow waits for the factor engine — then scipy under tracking-error/turnover constraints is a natural rung-5 follow-on.

**Prerequisites (hard).** ESG score history of usable depth (same constraint as esg-backtesting — disclose coverage); return-data licensing for the security universe. **Acceptance:** regression outputs carry real t-stats and R²; a fixture window's β_esg reproduces under fixed inputs; zero `sr()` in the analytics path.

### 9.2 Evolution B — Factor-construction diagnostician (LLM tier 2)

**What.** Quant users' first question about any ESG factor is construction validity: "is my ESG factor just quality in disguise?" A tool-calling diagnostician that runs Evolution A's engine and reports the checks that answer it — factor correlation matrix against MKT/SMB/HML/MOM/quality, sector-neutrality verification (post-construction sector exposures ≈ 0), score-provider sensitivity (rebuild the factor on a second provider's scores and report rank stability) — then narrates whether the measured alpha survives each control, with every statistic from tool output.

**How.** Tools: `build_esg_factor(config)`, `run_panel_regression(factor, controls, window)`, `factor_correlations(factor)`, `provider_sensitivity(factor, providers)`. Grounding corpus = this Atlas record's §5 (the construction recipe) and the cited Friede et al. mixed-evidence framing, so conclusions stay calibrated. The diagnostician's language is bounded to evidence characterization; it inherits `esg-backtesting`'s multiple-testing disclosure for repeated configs in a session.

**Prerequisites (hard).** Evolution A — diagnosing a factor that doesn't exist is the current page's problem restated; provider-sensitivity checks need ≥2 score sources or return honest `insufficient_data`. **Acceptance:** a golden factor's diagnostic report reproduces from scripted calls; correlation and t-stat figures match engine outputs; a factor failing sector-neutrality is flagged with the actual residual exposures.