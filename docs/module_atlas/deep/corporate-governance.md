## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The guide states `GovScore = 0.30×Board + 0.25×Audit +
> 0.25×Remuneration + 0.20×Shareholder` with sub-scores built from *real* board independence, tenure,
> gender diversity, LTI ESG-KPI weighting, and CEO pay ratio. **The weighted-sum structure is real in
> code — but the sub-scores it aggregates are synthetic.** The eight governance dimension scores are not
> read from governance data; they are generated as `base 50 + esgBoost + countryBoost + noise`, where the
> boosts are proxies off the company's ESG score and its country's CPI (Corruption Perceptions Index) and
> the noise is `sRand`-seeded. Every individual flag (board independence, CEO-chair split, ESG-linked
> comp, whistleblower, data breaches, CEO pay ratio…) is likewise `sRand`-seeded. So the framework and the
> weighting are legitimate; the *inputs* are fabricated from an ESG/CPI heuristic. §8 specifies the real
> governance-data model.

### 7.1 What the module computes

Per company, eight dimension scores are synthesised then weighted into an overall governance score:

```js
esgBoost     = (esg_score − 50) × 0.3          // ESG-score proxy uplift
countryBoost = (cpi_score − 50) × 0.25         // country CPI proxy uplift
dims[dk]     = clamp( round( base + esgBoost + countryBoost + noise ) , 10 , 98 )
  noise      = (sRand(seed + di·7) − 0.5) × 18
overall      = Σ_dk dims[dk] × (GOV_FRAMEWORK[dk].weight / 100)
worstDim     = argmin_dk dims[dk]
```

Portfolio aggregates are weight-averaged: `portGovScore = wAvg(overall)`, plus coverage % for boolean
flags (CEO-chair split %, whistleblower coverage %, tax transparency %…).

### 7.2 Parameterisation / scoring rubric

**Dimension weights (`GOV_FRAMEWORK`, sum = 100):**

| Dimension | Weight | Framework basis |
|---|---|---|
| Board Effectiveness | 20 | ICGN board independence/skills |
| Shareholder Rights | 15 | One-share-one-vote, say-on-pay |
| Transparency & Disclosure | 15 | Financial reporting, RPT, tax |
| Anti-Corruption | 15 | Anti-bribery, whistleblower |
| Executive Compensation | 10 | CEO pay ratio, ESG-linked LTI |
| (3 further dimensions) | 25 | Audit / cyber / other |

Note: the guide's four-bucket weighting (30/25/25/20) differs from the code's eight-dimension weighting
(20/15/15/15/10/…). **Sub-score inputs (synthetic):**

| Field | Generator | Provenance |
|---|---|---|
| `dims[dk]` | `50 + esgBoost + countryBoost + noise` | ESG/CPI proxy + seeded noise |
| `boardIndep` | `clamp(round(40 + sRand·40),20,95)` | Synthetic seeded PRNG |
| `ceoPayRatio` | `round(30 + sRand·350)` | Synthetic seeded PRNG |
| `esgLinkedComp`, `dataBreaches`, `taxHavens`, `corruptionIncidents` | `sRand`-scaled | Synthetic seeded PRNG |
| Boolean flags (`ceoChairSplit`, `whistleblower`, `dualClass`, `sayOnPay`…) | `sRand > threshold` | Synthetic seeded PRNG |

The **one real input** is `cpi_score` (country CPI, via `COUNTRY_GOVERNANCE`) and `esg_score` (from
`GLOBAL_COMPANY_MASTER`) — but these merely *tilt* the seeded base, they don't supply governance facts.

### 7.3 Calculation walkthrough

1. `enrichGov(company, idx)` seeds all dims and flags from `sRand(seed(company)+…)`, tilted by ESG/CPI.
2. `overall = Σ dims × weight/100` — a genuine weighted composite of the (synthetic) dims.
3. Portfolio view weight-averages `overall` and dim scores across holdings (or the first 40
   `GLOBAL_COMPANY_MASTER` companies if no portfolio loaded); coverage % counts boolean flags.
4. Heatmaps re-perturb each dim per indicator with more `sRand` noise for an indicator-level grid.

### 7.4 Worked example

Company with `esg_score = 70`, country `cpi_score = 60`: `esgBoost = (70−50)×0.3 = 6`;
`countryBoost = (60−50)×0.25 = 2.5`. For Board Effectiveness (di=0),
`noise = (sRand(seed)−0.5)×18` — say `sRand = 0.6` → `noise = 1.8`. Then
`dims.board = clamp(round(50 + 6 + 2.5 + 1.8)) = 60`. Repeating for all eight dims and applying weights
(20/15/15/15/10/…), the `overall` lands near `50 + esgBoost + countryBoost ≈ 58.5` plus/minus the per-dim
noise — i.e. the composite is essentially **a re-scaled ESG/CPI blend**, not a governance measurement.

### 7.5 Companion analytics on the page

Tabs: portfolio dashboard (KPIs, dimension radar vs. benchmark 65), governance scorecard table (overall +
8 dims + flags, sortable), dimension deep-dive (indicator heatmap), country-governance overlay (CPI), and
CSV export. Uses `GLOBAL_COMPANY_MASTER` + `COUNTRY_GOVERNANCE`. No backend engine or route.

### 7.6 Data provenance & limitations

- **Dimension scores and all governance flags are synthetic**, from `sRand(seed)=frac(sin(seed+1)×10⁴)`
  tilted by ESG/CPI proxies. Only `esg_score` and country `cpi_score` are real, and they only shift the base.
- The composite is therefore **not a governance measurement** — it is a deterministic function of ESG
  score + country CPI + noise, so it will correlate mechanically with ESG score, not with board/audit facts.
- The code's eight-dimension weighting differs from the guide's four-bucket (30/25/25/20) formula.

**Framework alignment:** The dimension design mirrors *ICGN Global Governance Principles 2023* (board
independence, shareholder rights, disclosure, remuneration), *ISS Governance QualityScore* (decile
benchmarking), and the *UK Corporate Governance Code* / *EU Gender Balance Directive 2022/2381* (40% board
gender target). *Transparency International CPI* supplies the real country tilt. These frameworks are
correctly named and structured; only the per-company data is fabricated.

---

## 8 · Model Specification — Data-Driven Corporate Governance Quality Score

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Score each portfolio company's governance quality from *observed* board, audit, remuneration, and
shareholder-rights data, to support proxy voting and engagement prioritisation. Coverage: listed issuers
with proxy filings / governance databases.

### 8.2 Conceptual approach
Build sub-scores from measured indicators (not proxies), weighted per **ICGN** materiality and benchmarked
against **ISS Governance QualityScore** deciles and **Glass Lewis** flags. Each indicator is scored against
a codified benchmark (e.g. board independence ≥ 66%, CEO pay ratio ≤ 150×, ESG-linked LTI present), then
rolled up — the standard governance-scorecard construction used by ISS/Sustainalytics/MSCI governance pillars.

### 8.3 Mathematical specification
```
indicator_score(x) = 100 · met(x, benchmark)       met ∈ {0, partial, 1} or linear vs benchmark
dim_score_d = Σ_j w_{d,j} · indicator_score(x_j)                       (weighted per dimension)
GovScore = Σ_d W_d · dim_score_d                                       (ICGN dimension weights)
Flag penalties: dual-class −k1, poison-pill −k2, pay-ratio>200× −k3, corruption incident −k4
GovScore_adj = clamp(GovScore − Σ penalties, 0, 100)
```
| Parameter | Source |
|---|---|
| Board indep, tenure, gender | Proxy filings / BoardEx / ISS |
| CEO pay ratio, ESG-linked LTI | Remuneration reports (SEC/DEF 14A, UK DRR) |
| Shareholder-rights flags | Company bylaws; ISS/Glass Lewis |
| Dimension weights `W_d` | ICGN materiality; align to guide's 30/25/25/20 |
| Country overlay | Transparency International CPI (already in `COUNTRY_GOVERNANCE`) |

### 8.4 Data requirements
Per issuer: independence ratio, board size/tenure/gender, audit committee independence + non-audit fee
ratio, say-on-pay result, dual-class flag, poison-pill flag, CEO pay ratio, LTI ESG-KPI weight, corruption
incidents. Vendors: ISS, Glass Lewis, BoardEx; free: proxy filings, SEC EDGAR, company reports. The
platform holds `GLOBAL_COMPANY_MASTER` (ESG score, sector, country) and `COUNTRY_GOVERNANCE` (CPI); the
missing pieces are the measured governance fields.

### 8.5 Validation & benchmarking plan
Reconcile `GovScore` deciles against ISS Governance QualityScore on overlapping issuers (target rank
correlation > 0.6); backtest whether low scores predict governance controversies, failed say-on-pay votes,
and shareholder-proposal support. Sensitivity on dimension weights and flag penalties.

### 8.6 Limitations & model risk
Governance data is disclosure-dependent and lags (annual proxy cycle) — timestamp inputs and flag stale
data. Country context matters (independence norms differ by jurisdiction) — keep the CPI overlay but avoid
double-counting. Boolean flags are high-variance for small boards. Conservative fallback: where measured
indicators are missing, mark the dimension "not assessed" rather than imputing from ESG score (the current
defect), so the composite is not silently ESG-driven.
