## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-CP6) describes an **FF5 + ESG regression**
> `R_portfolio = α_ESG + β_mkt·MKT + β_smb·SMB + β_hml·HML + β_rmw·RMW + β_cma·CMA + ε` extracting a
> risk-adjusted ESG alpha. **No regression runs.** The page is a **static reporting dashboard**: every
> figure — annual ESG alpha, risk-reduction metrics, PRI scores, maturity scores, asset-class coverage,
> client KPIs — is a **hard-coded constant table**. There is no PRNG *and* no calculation except a
> single average. §8 specifies the FF5+ESG attribution model the guide names.

### 7.1 What the module computes

Exactly one derived value:

```js
avgAlpha = mean(ALPHA_DATA.esgAlpha) = (1.1+1.7+2.8+2.3+1.4+1.3)/6 = 1.77 → "≈+1.2% p.a." (guide headline)
```

Everything else is displayed verbatim from constant arrays. `ALPHA_DATA` (2020–2025) carries
portfolio vs benchmark returns and a pre-computed `esgAlpha = portfolio − benchmark`:

| Year | Portfolio | Benchmark | ESG alpha |
|---|---|---|---|
| 2020 | 8.2% | 7.1% | +1.1% |
| 2021 | 18.5% | 16.8% | +1.7% |
| 2022 | −12.4% | −15.2% | +2.8% |
| 2023 | 14.8% | 12.5% | +2.3% |
| 2024 | 11.2% | 9.8% | +1.4% |
| 2025 | 6.5% | 5.2% | +1.3% |

The alpha is simply the return difference — a naïve active return, **not** the FF5 intercept the guide
claims (which would strip market/size/value/profitability/investment premia first).

### 7.2 Parameterisation (all hard-coded constants)

| Table | Content | Provenance |
|---|---|---|
| ALPHA_DATA | portfolio/benchmark/alpha 2020–25 | curated illustrative (2022 defensiveness realistic) |
| RISK_DATA | drawdown −18.2 vs −24.5, vol 14.8 vs 17.2, Sharpe 0.82 vs 0.65, Sortino 1.15 vs 0.88 | curated; ESG risk-reduction narrative |
| MATURITY | 7 dimensions 72–88 (Stewardship highest) | curated PRI-module-style maturity |
| PRI_SCORES | 72→88 (2021–25) | curated improving PRI assessment |
| ASSET_CLASS | 6 classes, depth/coverage/score | curated ESG-integration-depth by asset class |
| CLIENT_METRICS | 6 KPIs with targets, all "On Track" | curated client-report tiles |

### 7.3 Calculation walkthrough

1. Overview tab: KPI cards read constants; `avgAlpha` is the only computed value.
2. Alpha-attribution tab: plots `ALPHA_DATA` portfolio/benchmark bars and the alpha line.
3. Risk tab: renders `RISK_DATA` portfolio-vs-benchmark with the `benefit` column (the difference).
4. Reporting tab: `CLIENT_METRICS` tiles.
5. Maturity tab: `MATURITY` radar + `PRI_SCORES` trend + `ASSET_CLASS` coverage table.

### 7.4 Worked example — the alpha headline

`esgAlpha_2022 = portfolio − benchmark = −12.4 − (−15.2) = +2.8%`. This is the largest alpha, in the
worst return year — an intentionally realistic "ESG defends in drawdowns" story. `avgAlpha = 1.77%`
displayed as the guide's "+1.2% p.a." headline. Both are arithmetic on constants; no risk-factor
adjustment is performed, so the "+2.8% alpha" could be pure market beta timing, not ESG skill.

### 7.5 Data provenance & limitations

- **All tables are hard-coded constants** — no live data, no PRNG, no model. The dashboard is a
  presentation of a pre-baked narrative (consistent, defensible magnitudes, but illustrative).
- "ESG alpha" is naïve active return (portfolio − benchmark), **not** a factor-adjusted intercept;
  the guide's FF5+ESG regression is entirely absent.
- Every client KPI is "On Track" — no logic evaluates value against target.

**Framework alignment:** the guide cites **Fama-French 5-Factor** and **PRI**. The PRI-assessment
trend and maturity dimensions mirror the real **PRI Reporting Framework** module structure (Policy,
Governance, ESG incorporation across asset classes, Stewardship, Confidence-building), and PRI grades
modules A+→E on a public/private reporting basis. The FF5 attribution is named but not implemented.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Attribute a portfolio's return to a risk-adjusted ESG alpha after controlling
for the five Fama-French factors, and quantify ESG-driven risk reduction, for client ESG-integration
reporting.

**8.2 Conceptual approach.** **FF5 + ESG time-series regression** on monthly portfolio excess returns,
mirroring standard performance attribution and the guide's stated methodology; risk reduction via
paired portfolio-vs-benchmark drawdown/vol/Sharpe over the same window.

**8.3 Mathematical specification.**
- `r^p_t − rf_t = α + β_M MKT_t + β_{SMB} SMB_t + β_{HML} HML_t + β_{RMW} RMW_t + β_{CMA} CMA_t +
  β_E F^{ESG}_t + ε_t`, OLS over ≥36 months, Newey-West SEs.
- ESG alpha `= 12·α` (annualised); report t(α).
- Risk reduction: `ΔMaxDD, Δσ, ΔSharpe, ΔSortino` = benchmark − portfolio over the window (positive =
  ESG benefit), with bootstrap CIs.

| Parameter | Source |
|---|---|
| FF5 factors, rf | Kenneth French library |
| ESG factor `F^{ESG}` | sector-neutral long-short (see esg-factor-alpha §8) |
| Portfolio returns | PMS / custodian NAV |
| PRI scores | PRI assessment reports |

**8.4 Data requirements.** Monthly portfolio and benchmark returns, FF5+ESG factor series, risk-free.
Currently only hard-coded annual figures exist.

**8.5 Validation & benchmarking plan.** t-stat on α; sub-period stability; reconcile risk-reduction
metrics against an independent risk system; compare α to published ESG-integration studies.

**8.6 Limitations & model risk.** Short ESG factor history; 6 annual observations are far too few for a
6-factor regression (needs monthly); naïve active return conflates beta timing with ESG skill.
