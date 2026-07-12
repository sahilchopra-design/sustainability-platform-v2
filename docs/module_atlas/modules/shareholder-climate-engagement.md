# Shareholder Climate Engagement Analytics
**Module ID:** `shareholder-climate-engagement` · **Route:** `/shareholder-climate-engagement` · **Tier:** B (frontend-computed) · **EP code:** EP-DK5 · **Sprint:** DK

## 1 · Overview
Tracks and analyses institutional investor climate engagement — shareholder resolutions, private dialogue outcomes, escalation pathways, and voting patterns. Integrates CA100+ benchmark tracking, IIGCC net zero stewardship, and Climate Action 100+ focus company progress.

> **Business value:** Essential for responsible investment teams at asset managers and pension funds. Enables systematic CA100+ engagement programme management, vote decision-making, and reporting to beneficiaries on climate stewardship outcomes. Aligns with IIGCC, PRI, and UNPRI reporting expectations.

**How an analyst works this module:**
- Select CA100+ focus company for engagement tracking
- Review benchmark progress across 10 indicators
- Score engagement effectiveness and commitment quality
- Model escalation pathway (private dialogue → resolution → divestment)
- Generate IIGCC-aligned engagement report and voting rationale

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CAMPAIGNS`, `COUNTRIES`, `FILERS`, `KpiCard`, `MGMT_RECS`, `OUTCOMES`, `RES_TYPES`, `SECTORS`, `TABS`, `YEARS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `resolutionType` | `RES_TYPES[Math.floor(sr(i * 13) * RES_TYPES.length)];` |
| `year` | `2020 + Math.floor(sr(i * 17) * 5);` |
| `managementRecommendation` | `MGMT_RECS[Math.floor(sr(i * 19) * MGMT_RECS.length)];` |
| `supportPct` | `parseFloat(Math.min(99, Math.max(5, baseSupport + sr(i * 23) * 35)).toFixed(1));` |
| `outcome` | `supportPct >= 50 ? 'Passed' : sr(i * 29) > 0.6 ? 'Withdrawn' : sr(i * 29) > 0.3 ? 'Management Opposed' : 'Failed';` |
| `filingInvestor` | `FILERS[Math.floor(sr(i * 31) * FILERS.length)];` |
| `coFilers` | `Math.floor(sr(i * 37) * 12);` |
| `postEngagementCommitment` | `outcome === 'Passed' ? sr(i * 41) > 0.3 : sr(i * 41) > 0.7;` |
| `engagementDuration` | `2 + Math.floor(sr(i * 43) * 22);` |
| `issScore` | `Math.round(30 + sr(i * 47) * 65);` |
| `filtered` | `useMemo(() => CAMPAIGNS.filter(c => (filterSector === 'All' \|\| c.sector === filterSector) && (filterType === 'All' \|\| c.resolutionType === filterType) && (filterOutcome === 'All' \|\| c.outcome === filterOutcome) && (filterYear === 'All' \|\| c.year === +filterYear) && c.supportPct >= minSupport && c.engagementDuration >= minDuration ), [filt` |
| `avgSupport` | `(filtered.reduce((a, c) => a + c.supportPct, 0) / n).toFixed(1);` |
| `pctPassed` | `((filtered.filter(c => c.outcome === 'Passed').length / n) * 100).toFixed(0);` |
| `pctCommit` | `((filtered.filter(c => c.postEngagementCommitment).length / n) * 100).toFixed(0);` |
| `byType` | `RES_TYPES.map(t => {` |
| `outcomeData` | `OUTCOMES.map(o => ({` |
| `trendData` | `YEARS.map(yr => {` |
| `mgmtData` | `MGMT_RECS.map(rec => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `FILERS`, `MGMT_RECS`, `OUTCOMES`, `RES_TYPES`, `SECTORS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CA100+ Focus Companies | — | CA100+ 2023 | 170 focus companies representing 80% of industrial GHG emissions — subject to coordinated investor engagement |
| Climate Resolutions 2023 | — | ShareAction Voting Matters 2023 | 135 climate-related shareholder resolutions filed globally in 2023 — average support 43% |
| Net Zero Commitments from Engagement | — | CA100+ Benchmark 2023 | 61% of CA100+ focus companies now have net zero commitments vs 10% pre-CA100+ launch |
- **CA100+ benchmark data by company and indicator** → Progress tracking → **Company progress score across 10 CA100+ indicators**
- **Shareholder resolution database (SEC, Companies House)** → Resolution analysis → **Filed resolutions by topic, filer, and vote outcome**
- **Private engagement records and company responses** → Dialogue effectiveness → **Commitment rates from private engagement vs public resolution**

## 5 · Intermediate Transformation Logic
**Methodology:** Engagement Effectiveness Score
**Headline formula:** `EngagementScore = Σ [CommitmentMade_i × TargetAmbition_i × ImplementationProgress_i × VerificationRigor_i] / n; EscalationRisk = 1 - EngagementProgressRate`

Progress scoring tracks company commitments from baseline to verified delivery across 10 CA100+ indicators; escalation trigger based on stalled progress over 3 engagement cycles

**Standards:** ['Climate Action 100+ Net Zero Benchmark 2023', 'IIGCC Net Zero Stewardship Toolkit 2023', 'PRI Active Ownership 2.0 Framework', 'ShareAction — Voting Matters 2023']
**Reference documents:** Climate Action 100+ Net Zero Company Benchmark 2023; IIGCC Net Zero Stewardship Toolkit for Asset Managers and Asset Owners (2023); PRI Active Ownership 2.0 (2022); ShareAction Voting Matters 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

60 synthetic climate-related shareholder resolutions (`CAMPAIGNS`, seeded `sr(s)=frac(sin(s+1)×10⁴)`)
against generically-named companies (`Co. A`…`Co. Z`, `Co. A1`…), each carrying resolution type, filing
investor (8 real institutional filers: CalPERS, NBIM, APG, CDPQ, LGIM, BNP Paribas AM, Amundi, USS),
management's own recommendation, and a support-percentage outcome that is **causally linked** to that
recommendation:

```js
baseSupport = mgmtRec==='For' ? 55 : mgmtRec==='Abstain' ? 40 : 25      // management stance sets a floor
supportPct  = clamp(5, 99, baseSupport + sr()×35)                       // + up to 35pp of random variation
outcome     = supportPct>=50 ? 'Passed'
            : sr()>0.6 ? 'Withdrawn' : sr()>0.3 ? 'Management Opposed' : 'Failed'
```

This is a meaningful design choice relative to sibling modules: **support outcome is not independently
random** — it is conditioned on management's recommendation, correctly modelling the real-world dynamic
that resolutions recommended "For" by management pass far more often than those management recommends
"Against."

### 7.2 Parameterisation

| Management recommendation | Base support | Support range after +sr()×35 |
|---|---|---|
| For | 55 | 55–90% |
| Abstain | 40 | 40–75% |
| Against | 25 | 25–60% |

| Field | Range | Provenance |
|---|---|---|
| `resolutionType` | Say on Climate / Net Zero / Disclosure / Board / Exec Pay | Real, recognised categories of climate-linked shareholder resolutions |
| `coFilers` | `floor(sr()×12)` → 0–11 | Synthetic |
| `postEngagementCommitment` | `outcome==='Passed' ? sr()>0.3 : sr()>0.7` | Conditioned — passed resolutions more likely (70% base rate) to yield a company commitment than failed/withdrawn ones (30% base rate) |
| `engagementDuration` | `2 + floor(sr()×22)` → 2–23 months | Synthetic |
| `issScore` | `round(30+sr()×65)` → 30–95 | Synthetic ISS-governance-style score |

### 7.3 Calculation walkthrough

1. `filtered` applies sector/type/outcome/year/minSupport/minDuration filters.
2. Headline KPIs guarded via `n = Math.max(1, filtered.length)`: `avgSupport`, `pctPassed`, `pctCommit` —
   all safe against empty-filter division.
3. `byType`: per resolution-type breakdown (`avgSupport`, `count`, `pctPassed`), filtering out types with
   zero matches (`.filter(Boolean)`) rather than showing a spurious 0/0 row.
4. **Post-Engagement tab**: presumably cross-tabs `postEngagementCommitment` against `outcome`, testing
   whether passed resolutions actually translate to company commitments — a legitimate question given the
   conditional construction in §7.1.
5. **ISS Scoring tab**: `issScore` likely correlated visually against `supportPct` in a scatter or table,
   though the two fields are independently seeded (`sr(i×47)` vs `sr(i×23)`), so no causal relationship is
   actually encoded between an ISS-style governance score and vote support.

### 7.4 Worked example

Resolution `i=12`, `managementRecommendation = MGMT_RECS[floor(sr(19×12)×3)]`, illustrative draw =
`'Against'` → `baseSupport = 25`. `supportPct = clamp(5,99, 25 + sr(23×12)×35)`, illustrative
`sr()≈0.62` → `25+21.7=46.7%` → since `<50`, not "Passed"; `outcome` then checks `sr(29×12)` — illustrative
`0.45` → falls in the `>0.3` bracket → `'Management Opposed'`.

Contrast with a `'For'`-recommended resolution: `baseSupport=55`, same `sr()=0.62` draw pattern would give
`supportPct=55+21.7=76.7%` → `≥50` → `'Passed'`. This demonstrates the module's core, correctly-modelled
dynamic: identical random variation produces a passing vs. failing outcome purely based on whether
management supported or opposed the resolution.

### 7.5 Companion analytics on the page

- **Investor Coalitions tab** — likely aggregates by `filingInvestor` (8 real institutional investors) and
  `coFilers`, a plausible view of which large asset owners lead climate-resolution filing activity.
- **Management Response tab** — cross-tab of `managementRecommendation` vs `outcome`, directly testing the
  §7.1 causal construction.

### 7.6 Data provenance & limitations

- **All 60 campaigns are synthetic**; company names are generic placeholders (`Co. A`, `Co. B`…), unlike the
  sibling `shareholder-activism` module which uses real target names — a deliberate anonymisation choice for
  this module.
- The management-recommendation → support-percentage causal link (§7.1–7.2) is the module's strongest
  methodological feature among the shareholder-engagement family — it encodes a genuine, well-documented
  real-world dynamic rather than treating outcome as independent noise.
- `issScore` and `supportPct` are independently seeded despite ISS voting recommendations being, in reality,
  a significant driver of actual shareholder vote outcomes — a production model would condition `supportPct`
  partly on `issScore` the same way it is already conditioned on `managementRecommendation`.
- The 8 named institutional filers (CalPERS, NBIM, APG, CDPQ, LGIM, BNP Paribas AM, Amundi, USS) are real,
  well-known asset owners active in climate shareholder engagement (several are Climate Action 100+
  signatories), lending topical credibility to the filer roster even though assignment per campaign is
  random.

**Framework alignment:** the resolution-type taxonomy (Say on Climate, Net Zero, Disclosure, Board, Exec
Pay) reflects real categories used by proxy advisors and ESG resolution trackers (As You Sow's Proxy
Preview, Ceres) · the management-recommendation-conditioned support model is a genuine (if simplified)
reflection of real proxy-voting dynamics, where ISS/Glass Lewis and management recommendations are the two
dominant predictors of shareholder resolution vote outcomes.

## 9 · Future Evolution

### 9.1 Evolution A — Real CA100+ benchmark data with ISS-conditioned vote modelling (analytics ladder: rung 1 → 3)

**What.** The module's best feature is already methodological, not data: §7.1 documents that `supportPct` is causally conditioned on management's recommendation (For→55 floor, Against→25), correctly encoding a real proxy-voting dynamic — but the 60 campaigns are synthetic against anonymised `Co. A…Z` names, and §7.6 flags that `issScore` is independently seeded despite ISS recommendations being the other dominant predictor of vote outcomes in reality. The overview promises "CA100+ benchmark tracking" across 10 indicators, which no data supports. Evolution A grounds both: ingest the publicly published Climate Action 100+ Net Zero Company Benchmark assessments (per-company, per-indicator, updated annually) and real resolution vote outcomes, then extend the conditioning model to include the ISS/Glass-Lewis signal.

**How.** (1) A `ca100_benchmark_assessments` table seeded from the published CA100+ assessment releases (company × 10 indicators × criteria met), refreshed per cycle. (2) Fit the support model on real votes: support ~ f(mgmt rec, proxy-advisor rec, resolution type, year), replacing the `+sr()×35` noise term with fitted coefficients and residual bands — turning the module's already-correct causal structure into a calibrated one. (3) The escalation trigger (`EscalationRisk = 1 − progressRate` per §5) computes from actual benchmark-indicator movement over 3 cycles rather than invention.

**Prerequisites.** CA100+ publishes assessments as web tables/PDFs — an extraction pass is needed; real vote outcomes need a proxy-record source (company 8-Ks report AGM results on EDGAR, free). **Acceptance:** a named focus company's 10-indicator panel matches the published CA100+ assessment; the fitted support model's coefficients are displayed with sample size.

### 9.2 Evolution B — Engagement-report and voting-rationale drafter (LLM tier 1)

**What.** The module's own workflow list ends with "Generate IIGCC-aligned engagement report and voting rationale" — a drafting task no deterministic code can do well. Evolution B is a copilot that composes the beneficiary-facing stewardship report and per-resolution voting rationale from grounded inputs: the company's CA100+ indicator status, the engagement history recorded in the module, the escalation-pathway position, and the IIGCC Net Zero Stewardship Toolkit structure the page already cites as its framework.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/shareholder-climate-engagement/ask`, corpus = this Atlas record plus the IIGCC toolkit section headings and the module's engagement records. Rationale drafts follow a fixed skeleton (benchmark status → engagement asks → progress assessment → vote decision with escalation logic) where the vote decision itself is the user's, never the LLM's — the copilot argues the recorded decision, or flags inconsistency ("voting For management while the escalation model signals stalled progress").

**Prerequisites.** Evolution A's real benchmark data — drafting stewardship reports about `Co. A`'s synthetic progress has no use; ship after real assessments land. **Acceptance:** every benchmark claim in a draft cites a CA100+ indicator value in the DB; a draft contradicting the recorded vote decision is flagged, not silently produced.