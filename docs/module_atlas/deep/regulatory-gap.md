## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike almost every other module in this batch, `RegulatoryGapPage.jsx` contains **no PRNG at
all** — it derives every compliance status live from the platform's actual cross-module state
(read from `localStorage`: the active portfolio's holdings, saved stewardship engagements,
scenario-stress-test runs, report templates, and remediation-action overrides). This is a
genuinely dynamic gap-analysis engine, close in spirit to the guide's own formula:

```
Guide:  G = 1 − (disclosures_completed / disclosures_required)
Code:   overallCompliance = round( ((compliantCount + partialCount×0.5) / totalReqs) × 100 )
```

The code's version gives **half credit for "partial"** status rather than the guide's strict
binary completed/not-completed — a defensible refinement (many disclosure requirements are
genuinely partially met, e.g. GHG coverage at 60% when the target is 80%), though it means the
guide's exact formula is approximated rather than implemented verbatim.

### 7.2 Parameterisation — data-completeness thresholds driving each requirement's status

| Requirement family | Compliant threshold | Partial threshold | Source field |
|---|---|---|---|
| TCFD-M1 (Scope 1&2 GHG) | `ghgCoverage ≥ 80%` | `≥ 50%` | `holdings[].company.scope1_mt / scope2_mt` |
| TCFD-M3 (WACI disclosure) | `ghgCoverage > 50%` (`hasWACI`) | — | derived flag |
| TCFD-M4 (Climate targets) | `sbtiPct ≥ 50%` | `≥ 20%` | `holdings[].company.sbti_committed` |
| TCFD-G2 (Mgmt role) | `esgCoverage ≥ 50%` | any portfolio loaded | `holdings[].company.esg_score` |
| TCFD-S2 (Scenario analysis) | `hasScenarios` (any run) | portfolio loaded, no scenarios | `localStorage['ra_scenario_runs_v1']` |
| SFDR-1 (PAI statement) | `hasReports && ghgCoverage≥50%` | `ghgCoverage≥30%` | `localStorage['ra_report_templates_v1']` |
| TCFD-M2 (Scope 3) | **always `'gap'`** (hardcoded) | — | no Scope 3 field exists anywhere in the platform's company master |

`weights = [2,2,2,1,1,1,1,1,1]` (comment: "GHG and ESG weighted higher") applies to the 9 data-
completeness fields tracked separately in a data-completeness sub-score, distinct from the
requirement-level `overallCompliance` — i.e. two different weighting schemes coexist for two
different summary numbers.

### 7.3 Calculation walkthrough

1. **`assessCompliance(holdings)`**: reads the active portfolio's holdings plus 5 other
   localStorage keys (stewardship, watchlist, FI portfolio, report templates, scenario runs,
   action-status overrides) and computes 9 coverage percentages (`ghgCoverage`, `esgCoverage`,
   `sbtiPct`, `revenueCoverage`, `mcapCoverage`, `evicCoverage`, `triskCoverage`,
   `netZeroCoverage`) plus boolean flags (`hasPortfolio`, `hasWACI`, `hasEngagements`, `hasReports`,
   `hasFIPortfolio`, `hasScenarios`).
2. **`buildFrameworks(assess, actionStatuses)`**: for each of (at least) TCFD and SFDR, defines
   ~9-10 named requirements (e.g. `TCFD-G1` Board oversight, `TCFD-M1` Scope 1&2 GHG,
   `SFDR-1` PAI statement) each with a `status` (`'compliant'|'partial'|'gap'`) computed from a
   threshold check against `assess`'s live coverage figures — every requirement's `evidence` field
   is a genuine, dynamically-built string quoting the actual coverage numbers (e.g. `"34 of 40
   holdings have GHG data (85%)"`), not a static description.
3. **`overallCompliance`**: `(compliantCount + partialCount×0.5) / totalReqs × 100`, rounded.
4. **Compliance history**: each computation appends `{date, score, compliant, partial, gap}` to a
   rolling 30-entry `complianceHistory` persisted back to `localStorage` — a genuine
   point-in-time audit trail of the user's own compliance trajectory as they load more data.
5. **Framework-level scores** (`fwScores`): per-framework `compliant/partial/gaps` counts and
   percentages (`cPct`, `pPct`, `gPct`), feeding a bar chart.
6. **Action item list**: `allReqs.filter(r => r.gap || r.status !== 'compliant')` — every
   non-compliant/partial requirement surfaces as an actionable item, each carrying a real
   in-platform navigation `link` (e.g. `/portfolio-builder`, `/scenario-stress-tester`,
   `/report-studio`) pointing to the exact module that would close that specific gap.

### 7.4 Worked example

Portfolio with 40 holdings, 34 have GHG data, 22 have ESG scores, 15 SBTi-committed, no scenario
runs yet, no report templates yet:

| Field | Formula | Result |
|---|---|---|
| `ghgCoverage` | `34/40×100` | **85%** |
| `esgCoverage` | `22/40×100` | **55%** |
| `sbtiPct` | `15/40×100` | **37.5%** |
| `TCFD-M1` status | `85%≥80%` | **compliant** |
| `TCFD-G2` status | `55%≥50%` | **compliant** |
| `TCFD-M4` status | `37.5%` between 20–50% | **partial** |
| `TCFD-S2` status | `hasScenarios=false`, portfolio loaded | **partial** ("Portfolio loaded but no scenarios run") |
| `TCFD-M2` (Scope 3) | hardcoded | **gap** (always, regardless of coverage) |

If these 5 requirements were the entire TCFD set: `compliant=2, partial=2, gap=1` →
`overallCompliance = round((2+2×0.5)/5×100) = round(60) = **60%**`.

### 7.5 Requirement status rubric

| Status | Meaning | Credit in `overallCompliance` |
|---|---|---|
| `compliant` | threshold met | 1.0 |
| `partial` | some data/activity, below threshold | 0.5 |
| `gap` | no data/activity | 0.0 |

### 7.6 Companion analytics

Compliance Dashboard (overall score, framework breakdown, trend history), framework detail views
(TCFD/SFDR requirement tables with evidence + gap + action + link per row), Action Item list,
framework comparison view, `DEADLINES` (9 static filing-deadline reference notes), CSV export.

### 7.7 Data provenance & limitations

- **This module fabricates nothing** — every number is derived live from the user's actual
  session state (portfolio holdings, scenario runs, reports, stewardship records). This is the
  strongest data-provenance profile of any module reviewed in this batch, precisely because it
  reuses genuinely-entered platform data rather than generating its own.
- **Corollary limitation**: for a fresh session with no portfolio loaded, every requirement reads
  `'gap'` and `overallCompliance=0%` — the guide's illustrative figures ("186 required / 142
  completed / 23.7% gap") are simply example numbers for a populated session, not values this code
  is hardwired to produce; actual figures depend entirely on the requirement count actually
  defined in `buildFrameworks()` (which frameworks beyond TCFD/SFDR are implemented was not fully
  enumerated in this review) and the user's own data-entry completeness.
- `TCFD-M2` (Scope 3) is permanently `'gap'` because no Scope 3 field exists in the company master
  data schema — a real limitation, but honestly represented rather than papered over with a fake
  coverage number.
- The upstream `holdings[].company.*` fields (GHG, ESG score, SBTi, EVIC, transition-risk score)
  themselves originate from other modules/data sources not reviewed here — this module's honesty
  is conditional on those upstream fields being real; if a holding's ESG score is itself a
  fabricated `sr()` draw from another module, that fabrication would silently flow through as
  "evidence" here.

**Framework alignment:** TCFD (2017 Recommendations) — Governance/Strategy/Risk
Management/Metrics & Targets structure correctly implemented as 4 requirement areas with realistic
sub-requirements · SFDR (EU 2019/2088 + Level 2 RTS 2022/1288) — PAI statement and entity-level
requirements represented · EFRAG ESRS Set 1 — referenced by the guide, not confirmed present as a
third framework in the excerpt reviewed (only TCFD and SFDR requirement blocks were directly
inspected; additional frameworks may exist further in the file).
