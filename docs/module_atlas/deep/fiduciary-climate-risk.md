## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide promises a *fiduciary risk ratio*
> (`FiduciaryRisk = PortfolioClimateRisk / BenchmarkClimateRisk × (1 + LitigationRisk + RegRisk)`) and
> a *portfolio temperature score* (`Σ w_i × CompanyITR_i`). **Neither is implemented.** There is no
> benchmark ratio, no ITR aggregation, no portfolio-vs-Paris pathway. What the code actually builds is
> an **8-factor additive fiduciary scorecard** over 55 synthetic institutional investors, plus filter
> counts and two scatter/bar views. `litigationRisk` and `carbonFootprint` exist only as seeded display
> fields; they never enter any risk-ratio formula.

### 7.1 What the module computes

For 55 synthetic investors (pension funds, insurers, SWFs, endowments) the core output is a
**fiduciary score** (0–100), a weighted sum of climate-governance attributes:

```js
fiduciaryScore = min(100, round(
    (netZeroCommitment  ? 20 : 0) +
    (tcfdAligned        ? 15 : 0) +
    (climateRiskDisclosure ? 10 : 0) +
    (engagementPolicy   ? 10 : 0) +
    (exclusionPolicy    ? 10 : 0) +
    climateRiskIntegration × 2 +          // 1–10 scale → 2–20 pts
    proxyVotingClimate × 0.1 +            // 20–95% → 2.0–9.5 pts
    sr(i×53) × 10                         // 0–10 pts random noise
))
```

Portfolio aggregates are simple filtered means/counts:

```js
avgFid  = Σ fiduciaryScore / n
pctNZ   = (#netZeroCommitment / n) × 100
avgProxy= Σ proxyVotingClimate / n
byType/byCountry: per-group avgFid, %NZ, %TCFD
```

### 7.2 Parameterisation / scoring rubric

**Fiduciary-score weights** (max ≈ 105, capped at 100):

| Factor | Points | Type | Provenance |
|---|---|---|---|
| Net-zero commitment | 20 | boolean | Author heuristic (largest single lever) |
| TCFD alignment | 15 | boolean | Author heuristic |
| Climate risk disclosure | 10 | boolean | Author heuristic |
| Engagement policy | 10 | boolean | Author heuristic |
| Exclusion policy | 10 | boolean | Author heuristic |
| Climate risk integration | ×2 (max 20) | 1–10 scale | Author heuristic |
| Proxy voting on climate | ×0.1 (max ~9.5) | 20–95% | Author heuristic |
| Random noise | ×10 | `sr()` | **Synthetic** — injects unexplained variance |

**Seeded input fields** (all `sr()`-derived):

| Field | Formula | Range |
|---|---|---|
| aum | `5 + sr(i·13)·995` | $5–1000 Bn |
| climateRiskIntegration | `1 + sr(i·17)·9` | 1–10 |
| netZeroCommitment | `sr(i·19) > 0.4` | ~60% true |
| proxyVotingClimate | `20 + sr(i·31)·75` | 20–95% |
| litigationRisk | `1 + sr(i·43)·9` | 1–10 (**display only**) |
| carbonFootprint | `20 + sr(i·47)·280` | 20–300 tCO₂/$M (scatter y) |

The 8 boolean/threshold fields map real-world fiduciary practices (net-zero pledges, TCFD reporting,
engagement/exclusion policy, proxy-voting on climate resolutions) but their *values* are random.

### 7.3 Calculation walkthrough

1. Generate 55 investors; compute each `fiduciaryScore` via the weighted sum above.
2. Filters (type, country, net-zero, min AUM, max carbon) → `filtered` array; `n = max(1, len)`.
3. KPIs: total AUM, mean fiduciary score, %NZ, mean proxy voting.
4. `byType` / `byCountry`: group means for avgFid, %NZ, %TCFD (bar charts).
5. Scatter: AUM (x) vs carbon footprint (y) coloured by type.

### 7.4 Worked example (one investor)

Take an investor with `netZero=true`, `tcfd=true`, `disclosure=false`, `engagement=true`,
`exclusion=false`, `climateRiskIntegration=7.0`, `proxyVoting=60%`, noise `sr=0.5`:

| Component | Points |
|---|---|
| Net-zero | 20 |
| TCFD | 15 |
| Disclosure | 0 |
| Engagement | 10 |
| Exclusion | 0 |
| Integration 7.0×2 | 14 |
| Proxy 60×0.1 | 6.0 |
| Noise 0.5×10 | 5.0 |
| **Total** | **70** (round) |

Score 70 → upper-mid band. Note the same investor could score anywhere from 65 to 75 purely on the
±5-point random-noise term, which is a material weakness for a "fiduciary compliance" score.

### 7.5 Data provenance & limitations

- **Every investor attribute is synthetic**, from `sr(seed)=frac(sin(seed+1)×10⁴)`.
- The **±10-point random noise term** inside the fiduciary score has no methodological basis and
  should be removed in production — it makes the headline score partly a coin-flip.
- `litigationRisk`, `carbonFootprint` and `aum` are seeded but litigation risk never feeds a
  risk-ratio despite being the guide's headline driver.
- No portfolio holdings, no ITR, no benchmark — the guide's temperature-alignment and risk-ratio
  outputs are entirely absent.

**Framework alignment:** PRI *Fiduciary Duty in the 21st Century* (net-zero + integration factors) ·
UNEP FI legal-frameworks work · TCFD (the `tcfdAligned` factor) · DoL 2022 ERISA ESG rule and case law
(McVeigh/REST, ClientEarth v Shell) — referenced in the guide as context but not modelled. ITR (implied
temperature rise) is named but not computed.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's fiduciary-risk ratio and
portfolio temperature score are absent, and the scorecard contains a random noise term. Below is the
production model.

### 8.1 Purpose & scope
Support pension-fund trustees and asset-owner boards in evidencing that material climate risk has been
prudently integrated — producing (i) a defensible fiduciary-integration score, (ii) a portfolio
implied-temperature-rise (ITR) alignment metric, and (iii) a litigation-exposure index by jurisdiction.

### 8.2 Conceptual approach
Two blocks: a **weighted governance scorecard** (transparent, auditable, no noise — like PRI's
assessment methodology and the TPI Management Quality levels) and a **portfolio temperature score**
computed bottom-up from holdings, mirroring **MSCI Implied Temperature Rise** and **CDP-WWF Temperature
Rating** methodology (aggregate holding-level over/under-shoot of a 1.5–2°C carbon budget).

### 8.3 Mathematical specification
```
FiduciaryScore = Σ_k w_k · x_k            x_k ∈ {0,1} or normalised [0,1]; Σ w_k = 100; no noise
ITR_portfolio  = f( Σ_i value_i·overshoot_i / Σ value_i )    holding-level temperature aggregation
   overshoot_i = (cumEmissions_i − carbonBudget_i) mapped to °C via TCRE (0.45°C per 1000 GtCO₂)
LitigationIndex_j = baseRate_j · caseGrowth_j · (2 − FiduciaryScore/100)   per jurisdiction j
FiduciaryRisk  = (ITR_portfolio / ITR_benchmark) · (1 + λ·LitigationIndex)
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| w_k | scorecard weights | PRI/TPI assessment frameworks (peer-reviewed weighting) |
| carbonBudget_i | company 1.5°C budget | SBTi sectoral decarbonisation approach |
| TCRE | temp per cumulative CO₂ | IPCC AR6 (≈0.45°C/1000 GtCO₂) |
| baseRate_j, caseGrowth_j | litigation base + trend | LSE Grantham / Sabin Center climate case database |
| λ | litigation weighting | judgemental, ≤0.5 |

### 8.4 Data requirements
Investor governance attributes (from disclosures/PRI signatory data), portfolio holdings with ISIN +
company emissions/targets, SBTi validation status, jurisdiction. Sources: PRI reporting data, MSCI/CDP
temperature ratings (vendor), SBTi target database (public), Sabin Center litigation database (public).

### 8.5 Validation & benchmarking plan
Backtest scorecard against realised regulatory findings/engagement outcomes; reconcile ITR against
MSCI and CDP temperature ratings for the same holdings (target ±0.2°C); sensitivity-test w_k and λ;
compare litigation index against observed case filings by jurisdiction.

### 8.6 Limitations & model risk
ITR is sensitive to budget-allocation choice; litigation index is inherently forward-looking and
sparse. Conservative fallback: report the scorecard and ITR separately rather than a single composite
FiduciaryRisk, and disclose the budget methodology explicitly. Remove all random terms.
