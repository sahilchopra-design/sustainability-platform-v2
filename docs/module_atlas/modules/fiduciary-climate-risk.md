# Fiduciary Climate Risk Analytics
**Module ID:** `fiduciary-climate-risk` · **Route:** `/fiduciary-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DK2 · **Sprint:** DK

## 1 · Overview
Analyses fiduciary duty obligations of institutional investors regarding climate risk. Covers case law analysis (McVeigh/REST, ClientEarth/Shell, Harvard Endowment), regulatory evolution (DoL ESG rule, PRI fiduciary guidance), and portfolio alignment with long-term beneficiary interests.

> **Business value:** Critical for pension fund trustees, investment managers with fiduciary obligations, and legal counsel advising institutional investors. Rising climate litigation creates material risk of breach of duty claims — proactive portfolio temperature alignment and documented climate process are primary defences.

**How an analyst works this module:**
- Review portfolio climate risk vs benchmark
- Analyse case law relevant to jurisdiction
- Score fiduciary duty climate integration compliance
- Calculate portfolio temperature score vs Paris pathway
- Generate PRI/UNEP FI fiduciary duty alignment report

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COUNTRIES`, `INVESTORS`, `KpiCard`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `TYPES[Math.floor(sr(i * 7) * TYPES.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `aum` | `parseFloat((5 + sr(i * 13) * 995).toFixed(1));` |
| `climateRiskIntegration` | `parseFloat((1 + sr(i * 17) * 9).toFixed(1));` |
| `netZeroCommitment` | `sr(i * 19) > 0.4;` |
| `engagementPolicy` | `sr(i * 23) > 0.35;` |
| `exclusionPolicy` | `sr(i * 29) > 0.4;` |
| `proxyVotingClimate` | `parseFloat((20 + sr(i * 31) * 75).toFixed(1));` |
| `climateRiskDisclosure` | `sr(i * 37) > 0.45;` |
| `tcfdAligned` | `sr(i * 41) > 0.5;` |
| `litigationRisk` | `parseFloat((1 + sr(i * 43) * 9).toFixed(1));` |
| `carbonFootprint` | `parseFloat((20 + sr(i * 47) * 280).toFixed(1));` |
| `totalAum` | `filtered.reduce((a, c) => a + c.aum, 0).toFixed(0);` |
| `avgFid` | `(filtered.reduce((a, c) => a + c.fiduciaryScore, 0) / n).toFixed(1);` |
| `pctNZ` | `((filtered.filter(c => c.netZeroCommitment).length / n) * 100).toFixed(0);` |
| `avgProxy` | `(filtered.reduce((a, c) => a + c.proxyVotingClimate, 0) / n).toFixed(1);` |
| `byType` | `TYPES.map(t => {` |
| `byCountry` | `COUNTRIES.map(cn => {` |
| `scatterData` | `filtered.map(c => ({ x: c.aum, y: c.carbonFootprint, name: c.name, type: c.type }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Litigation Cases | — | LSE Grantham/Columbia Sabin Center 2024 | Over 2,300 climate litigation cases globally — growing 30%/yr; fiduciary duty cases targeting fund managers |
| Pension Fund Fiduciary Gap | — | PRI Fiduciary Duty Report 2023 | 60% of pension funds globally not fully integrating material climate risk — potential fiduciary breach |
| Portfolio Temperature Score (Global FI) | — | MSCI Net Zero Tracker 2024 | Average portfolio temperature score for global financial institutions — 1.6°C above Paris target |
- **Portfolio holdings with ISIN/company identifiers** → Portfolio temperature score → **ITR by holding and portfolio-level temperature alignment**
- **Climate litigation case database (Sabin/Grantham)** → Jurisdiction risk analysis → **Relevant case law precedent and fiduciary risk score**
- **PRI/UNEP FI fiduciary assessment frameworks** → Compliance gap analysis → **Fiduciary duty integration score vs best practice**

## 5 · Intermediate Transformation Logic
**Methodology:** Fiduciary Climate Risk Assessment
**Headline formula:** `FiduciaryRisk = PortfolioClimateRisk / BenchmarkClimateRisk × (1 + LitigationRisk + RegRisk); PortfolioTempScore = Σ [w_i × CompanyITR_i]`

Fiduciary risk index compares portfolio climate risk against benchmark; litigation risk component reflects case law probability calibrated to jurisdiction and portfolio characteristics

**Standards:** ['PRI Fiduciary Duty in the 21st Century 2019', 'UNPRI/UNEP FI/Generation Foundation Fiduciary Duty 2019', 'ClientEarth v Shell Board (2023 dismissed)', 'DoL ESG Final Rule 2022 (US)']
**Reference documents:** PRI — Fiduciary Duty in the 21st Century: Final Report (2019); UNEP FI — Climate Change: Legal Frameworks and Fiduciary Duties (2021); UNPRI — A Legal Framework for Impact (2021); DoL Final Rule on Prudence and Loyalty in Selecting Plan Investments (2022)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Implement the promised fiduciary risk ratio and remove the noise term (analytics ladder: rung 1 → 2)

**What.** §7 documents that the guide's two headline outputs — `FiduciaryRisk = PortfolioClimateRisk/BenchmarkClimateRisk × (1 + LitigationRisk + RegRisk)` and the ITR-based portfolio temperature score — are entirely absent; the code builds an 8-factor additive scorecard over 55 `sr()`-seeded investors, and §7.5 flags a ±10-point random noise term inside the fiduciary score that "makes the headline score partly a coin-flip." Evolution A does two things: excise the noise term (a documented fabrication defect), and implement the risk ratio for real — litigation and regulatory risk components derived from jurisdiction (the module already carries `COUNTRIES` and the DoL/ClientEarth/McVeigh case-law context), applied to a user-supplied portfolio climate-risk metric vs benchmark.

**How.** (1) Delete the noise addend; keep the 8-factor scorecard, which is a defensible governance rubric once its inputs are real. (2) Build a jurisdiction table (litigation precedent count, regulatory stringency by country — curatable from the module's own case-law/regulatory content) feeding `LitigationRisk`/`RegRisk` multipliers. (3) Accept a portfolio WACI or climate-VaR from the platform's portfolio modules as the numerator, benchmark from stored sector references.

**Prerequisites.** The seeded 55-investor panel replaced by user-entered or imported investor profiles (all attributes are §7-flagged synthetic); the ITR score deferred until a real ITR source exists — say so on-page rather than fake it. **Acceptance:** identical inputs always produce identical fiduciary scores (noise gone); the risk ratio reproduces the §5 formula from inspectable jurisdiction parameters.

### 9.2 Evolution B — Trustee duty-of-care copilot grounded in case law (LLM tier 1)

**What.** The module's strongest real asset is qualitative: PRI *Fiduciary Duty in the 21st Century*, UNEP FI legal frameworks, DoL 2022 ERISA rule, and named cases (McVeigh v REST, ClientEarth v Shell). Evolution B is a tier-1 copilot for trustees and counsel: "as a UK pension trustee, what climate process do I need documented to defend a breach claim?" answered from the embedded atlas corpus and the module's jurisdiction/case-law content, with the scorecard factors used as a documented-process checklist.

**How.** RAG per the roadmap Tier-1 pattern — the corpus is this atlas record plus the module's regulatory reference texts (already in §5's reference list). Guardrails matter unusually here: the system prompt must require jurisdiction qualification, cite the specific case or rule behind every claim, and append a not-legal-advice disclaimer; questions asking for a litigation-probability number are refused because §7 shows the module computes none (litigationRisk is a seeded display field).

**Prerequisites.** Corpus embedding; case-law content structured with jurisdiction/date metadata for citation. **Acceptance:** bench_llm probes confirm every legal assertion carries a source citation from the corpus, and a request to "estimate our chance of being sued" yields a refusal with an explanation of what the module does compute.