# Corporate Governance Analytics
**Module ID:** `corporate-governance` · **Route:** `/corporate-governance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses board quality, audit committee effectiveness, executive remuneration alignment with sustainability targets, and shareholder rights across portfolio companies. Benchmarks governance scores against ICGN principles and supports proxy voting decisions with quantitative governance risk flags.

> **Business value:** Enables governance analysts and engagement teams to identify companies with structural governance weaknesses that elevate long-term risk, support proxy voting decisions, and engage boards on remuneration alignment with climate and sustainability commitments.

**How an analyst works this module:**
- Select company from universe to view full governance scorecard
- Board Composition tab shows independence, tenure distribution, gender, and climate expertise
- Remuneration tab analyses LTI plan structure and ESG KPI weightings
- Audit Quality tab scores committee composition and auditor independence metrics
- Shareholder Rights tab reviews voting rights, AGM voting results, and D&O coverage
- Proxy Voting tab generates voting recommendations based on governance risk flags

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_INDICATORS`, `Badge`, `Btn`, `COLORS`, `COUNTRY_GOVERNANCE`, `COUNTRY_LABELS`, `DEFAULT_SECTOR`, `DIM_KEYS`, `GOV_FRAMEWORK`, `GOV_REGULATIONS`, `KpiCard`, `LS_GOV`, `LS_PORT`, `SECTOR_GOV_BASELINE`, `Section`, `SortIcon`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GOV_REGULATIONS` | 10 | `name`, `countries`, `focus`, `mandatory` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `esgBoost` | `((c.esg_score \|\| 50) - 50) * 0.3;` |
| `countryBoost` | `((cg.cpi_score \|\| 50) - 50) * 0.25;` |
| `noise` | `(sRand(s + di * 7) - 0.5) * 18;` |
| `overall` | `DIM_KEYS.reduce((acc, dk) => acc + dims[dk] * (GOV_FRAMEWORK[dk].weight / 100), 0);` |
| `boardIndep` | `clamp(Math.round(40 + sRand(s + 100) * 40), 20, 95);` |
| `ceoChairSplit` | `sRand(s + 101) > 0.35;` |
| `esgLinkedComp` | `clamp(Math.round(sRand(s + 102) * 35), 0, 40);` |
| `whistleblower` | `sRand(s + 103) > 0.2;` |
| `dataBreaches` | `Math.floor(sRand(s + 104) * 4);` |
| `taxHavens` | `Math.floor(sRand(s + 105) * 6);` |
| `corruptionIncidents` | `Math.floor(sRand(s + 106) * 3);` |
| `dualClass` | `sRand(s + 107) > 0.75;` |
| `poisonPill` | `sRand(s + 108) > 0.8;` |
| `sayOnPay` | `sRand(s + 109) > 0.25;` |
| `clawback` | `sRand(s + 110) > 0.3;` |
| `auditIndep` | `clamp(Math.round(60 + sRand(s + 111) * 40), 50, 100);` |
| `antiCorruptTrain` | `clamp(Math.round(30 + sRand(s + 112) * 60), 15, 98);` |
| `cyberOversight` | `sRand(s + 113) > 0.35;` |
| `taxTransp` | `sRand(s + 114) > 0.4;` |
| `ceoPayRatio` | `Math.round(30 + sRand(s + 115) * 350);` |
| `holdings` | `useMemo(() => { if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 40).map((c, i) => enrichGov(c, i));` |
| `agg` | `useMemo(() => { const totalW = holdings.reduce((s, h) => s + (h.weight \|\| 1), 0) \|\| 1;` |
| `wAvg` | `(fn) => holdings.reduce((s, h) => s + fn(h) * (h.weight \|\| 1), 0) / totalW;` |
| `portGovScore` | `Math.round(wAvg(h => h.overall) * 10) / 10;` |
| `boardIndepAvg` | `Math.round(wAvg(h => h.boardIndep) * 10) / 10;` |
| `ceoChairPct` | `Math.round((holdings.filter(h => h.ceoChairSplit).length / n) * 100);` |
| `antiCorruptCov` | `Math.round(wAvg(h => h.antiCorruptTrain) * 10) / 10;` |
| `esgLinkedAvg` | `Math.round(wAvg(h => h.esgLinkedComp) * 10) / 10;` |
| `whistleblowerCov` | `Math.round((holdings.filter(h => h.whistleblower).length / n) * 100);` |
| `taxTranspPct` | `Math.round((holdings.filter(h => h.taxTransp).length / n) * 100);` |
| `cyberOversightPct` | `Math.round((holdings.filter(h => h.cyberOversight).length / n) * 100);` |
| `totalBreaches` | `holdings.reduce((s, h) => s + h.dataBreaches, 0);` |
| `auditIndepAvg` | `Math.round(wAvg(h => h.auditIndep) * 10) / 10;` |
| `shareholderScore` | `Math.round(wAvg(h => h.dims.shareholder_rights) * 10) / 10;` |
| `countries` | `[...new Set(holdings.map(h => h.countryCode))];` |
| `countryGovAvg` | `countries.length ? Math.round(countries.reduce((s, cc) => s + ((COUNTRY_GOVERNANCE[cc] \|\| {}).cpi_score \|\| 50), 0) / countries.length) : 50;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `GOV_REGULATIONS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Board Independence | — | Proxy filings | Percentage of board members classified as independent; ICGN recommends majority independence |
| Gender Diversity (Board) | — | Company reports | Proportion of board seats held by women; EU targets 40% for listed companies by 2026 |
| ESG in Executive LTI | — | Remuneration report | Percentage weighting of ESG/climate KPIs in CEO/CFO long-term incentive plan |
| CEO Pay Ratio | — | Annual report | Ratio of CEO total remuneration to median employee pay; >200× raises ISS concern |
| Governance QualityScore | — | ISS | ISS Governance QualityScore decile rank; 1 = highest governance quality |
- **Proxy filing and annual report data** → Parse board bios, extract independence/tenure/diversity metrics → **Board composition scorecard per company**
- **ISS/Glass Lewis governance databases** → Extract QualityScore, voting recommendations, remuneration flags → **Governance risk flags per company**
- **Remuneration report analysis** → Extract LTI plan structure, identify ESG KPI weighting → **Remuneration sustainability alignment score**

## 5 · Intermediate Transformation Logic
**Methodology:** Governance Quality Score
**Headline formula:** `GovScore = 0.30×Board + 0.25×Audit + 0.25×Remuneration + 0.20×Shareholder`

Board sub-score incorporates independence ratio, tenure diversity (% with <9yr tenure), gender diversity (target ≥40%), and climate competence (directors with energy/climate background). Audit sub-score covers audit committee independence, non-audit fee ratio (<20% target), and auditor tenure. Remuneration score penalises absence of ESG KPIs in LTI (Long-Term Incentive) plan and excessive CEO pay ratio.

**Standards:** ['ICGN Global Governance Principles 2023', 'ISS Governance QualityScore', 'UK Corporate Governance Code']
**Reference documents:** ICGN Global Governance Principles 2023; ISS Governance QualityScore Methodology; UK Corporate Governance Code 2024; EU Gender Balance Directive 2022/2381; SASB Corporate Governance Standards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Feed the real weighting real governance facts (analytics ladder: rung 1 → 3)

**What.** §7's partial-mismatch flag: the weighted-sum architecture is legitimate,
but every input is fabricated — dimension scores are
`50 + 0.3·(ESG−50) + 0.25·(CPI−50) + noise`, so the composite "will correlate
mechanically with ESG score, not with board/audit facts" (§7.6), and individual flags
(board independence, CEO pay ratio, whistleblower) are `sRand` draws. There is also a
structural discrepancy: the code weights 8 dimensions (20/15/15/15/10/…) while the
guide specifies 4 buckets (30/25/25/20). Evolution A replaces proxy-plus-noise with
observed governance data and reconciles the weighting.

**How.** (1) Data first where the platform already has it: the `company-profiles`
80-company real dataset carries SEBI BRSR-sourced fields — board composition, gender
diversity, and remuneration disclosures are in BRSR Section A/C; wire those through
before hunting new sources. (2) For broader coverage, ingest proxy-statement-derived
facts progressively (annual-report extraction via the existing
`extract-from-reports` pipeline is the realistic path — governance data vendors are
licensed). (3) Sub-scores computed from facts per the guide's own rubrics
(independence ratio, <9yr tenure share, ≥40% gender target, <20% non-audit fee
ratio); the CPI country tilt stays but as a labelled overlay, not a score input.
(4) Weight reconciliation: publish one canonical weighting (document why 8-dim or
4-bucket), benchmark score distributions against the ISS QualityScore decile
convention §5 cites.

**Prerequisites (hard).** Purge the `sRand` flag and dimension generators; accept
partial coverage honestly — a company without proxy data gets null sub-scores, not
proxy-noise. **Acceptance:** a company's board sub-score reproduces from its stored
board facts; the composite no longer correlates ~1.0 with ESG score by construction;
coverage percentage is displayed per dimension.

### 9.2 Evolution B — Proxy-voting recommendation assistant (LLM tier 1 → 2)

**What.** The module's last promised tab — proxy-voting recommendations from
governance risk flags — is judgment-plus-policy work that suits an LLM grounded in
explicit voting policy. Evolution B: for an AGM agenda (or a standard resolution
set), the assistant applies a codified voting policy (ICGN-derived rules: vote
against remuneration reports lacking ESG-linked LTI, against chairs where CEO-chair
duality persists…) to the company's (post-Evolution A) computed flags, producing a
per-resolution recommendation with the triggering flag and policy rule cited — a
draft for the stewardship analyst, never an autonomous vote.

**How.** Tier 1: the voting policy as a structured rule document plus this Atlas
record and the ICGN/UK-Code references; the company's flag set passes as context.
The LLM's role is applying policy language to fact patterns and drafting rationales —
the flag computation stays deterministic upstream. Tier 2 adds engagement-history
context via `company-profiles`' engagement log tool calls, so recommendations note
prior commitments ("board pledged 40% by 2026 at last AGM").

**Prerequisites (hard).** Evolution A — voting recommendations derived from seeded
governance flags would be stewardship malpractice; a house voting policy document
(the codification itself is a one-time expert task). **Acceptance:** every
recommendation cites one computed flag and one policy rule; resolutions outside the
policy's scope return "no policy guidance" rather than improvised positions;
identical inputs yield identical recommendations.