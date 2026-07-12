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
