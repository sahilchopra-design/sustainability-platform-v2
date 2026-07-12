# Regulatory Stress Submission
**Module ID:** `regulatory-stress-submission` · **Route:** `/regulatory-stress-submission` · **Tier:** B (frontend-computed) · **EP code:** EP-CH6 · **Sprint:** CH

## 1 · Overview
Regulatory submission workflow with ECB/BoE/APRA pre-formatted templates, data quality checks, audit trail, and approval workflow.

**How an analyst works this module:**
- Submission Tracker shows all 3 regulators with deadlines
- Template tabs pre-format data per regulator requirements
- Data Quality Check runs 8 validation rules
- Audit Trail provides timestamped evidence for every data point

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_TRAIL`, `BOE_TEMPLATE_FIELDS`, `Card`, `DATA_QUALITY_CHECKS`, `ECB_TEMPLATE_FIELDS`, `Pill`, `Ref`, `SUBMISSION_HISTORY`, `SUBMISSION_TRACKER`, `StatusBadge`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SUBMISSION_TRACKER` | 5 | `regulator`, `exercise`, `deadline`, `status`, `completeness`, `reviewer`, `approved` |
| `ECB_TEMPLATE_FIELDS` | 6 | `fields`, `completeness` |
| `BOE_TEMPLATE_FIELDS` | 4 | `fields`, `completeness` |
| `DATA_QUALITY_CHECKS` | 9 | `status`, `detail` |
| `AUDIT_TRAIL` | 8 | `user`, `action`, `module`, `version` |
| `SUBMISSION_HISTORY` | 4 | `exercise`, `date`, `status`, `version`, `findings` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `overallCompleteness` | `useMemo(() => { const total = submissions.reduce((s, sub) => s + sub.completeness, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AUDIT_TRAIL`, `BOE_TEMPLATE_FIELDS`, `DATA_QUALITY_CHECKS`, `ECB_TEMPLATE_FIELDS`, `SUBMISSION_HISTORY`, `SUBMISSION_TRACKER`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| DQ Checks | — | Validation engine | Completeness, consistency, plausibility, etc. |
| Submission Deadlines | — | Regulatory calendar | ECB Apr, BoE Jun, APRA Sep |

## 5 · Intermediate Transformation Logic
**Methodology:** Template-based submission validation
**Headline formula:** `Completeness = FilledFields / RequiredFields; DQ = pass/warning/fail per check`

8 data quality checks: completeness, consistency, plausibility, timeliness, accuracy, comparability, materiality, and reconciliation. Audit trail logs every data point with source, timestamp, and user.

**Standards:** ['ECB Reporting Templates', 'BoE CBES Data Dictionary']
**Reference documents:** ECB Reporting Templates; BoE CBES Submission Guide; APRA CPG 229 Reporting Standards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Entirely hand-curated content — **no PRNG anywhere in this file**. A workflow-tracking tool for
climate stress-test regulatory submissions across 4 regulators (ECB, BoE, APRA, and Fed — the
guide states 3, the code has 4), with genuinely computed roll-up metrics:

```js
overallCompleteness = mean(submissions[*].completeness)                    // simple average
dqPassRate = count(DATA_QUALITY_CHECKS status==='pass') / 8 × 100          // matches guide's "8 DQ checks"
```

Both formulas are simple, correctly-implemented aggregates over hand-entered data — there is no
fabrication risk here since nothing is randomly generated.

### 7.2 Parameterisation — the submission tracker (4 exercises)

| Regulator | Exercise | Deadline | Status | Completeness |
|---|---|---|---|---|
| ECB | Climate Stress Test 2025 | 2025-06-30 | In Progress | 72% |
| BoE | CBES Round 2 | 2025-09-30 | Data Collection | 35% |
| APRA | CPG 229 Compliance | 2025-12-31 | Planning | 15% |
| Fed | Climate Pilot Exercise | 2026-03-31 | Not Started | 0% |

`overallCompleteness = (72+35+15+0)/4 = 30.5% → displayed as 31%` (via `.toFixed(0)`).

### 7.3 The 8 data quality checks (matches guide exactly)

| # | Check | Status | Detail |
|---|---|---|---|
| 1 | Completeness: mandatory fields populated | pass | 142/145 fields (98%) |
| 2 | Consistency: PD/LGD within regulatory bounds | pass | All within [0,1] |
| 3 | Consistency: total exposure vs balance sheet | **warning** | $45M (0.3%) diff, within tolerance |
| 4 | Plausibility: sector loss rates vs peer benchmarks | **warning** | Oil & Gas LGD 2.1 std above peer median |
| 5 | Plausibility: scenario pathway within NGFS bounds | pass | Within NGFS Phase 5 envelope |
| 6 | Temporal: YoY changes < 50% threshold | pass | Max YoY change 32% |
| 7 | Cross-check: sum of sector exposures = total | **fail** | $120M gap, needs reconciliation |
| 8 | Cross-check: provisions ≥ ECL estimates | pass | Provisions exceed ECL by 12% |

`dqPassRate = 5/8 × 100 = 62.5% → displayed as 63%`. The guide's stated 8-category taxonomy
(completeness, consistency, plausibility, timeliness, accuracy, comparability, materiality,
reconciliation) maps onto these 8 checks reasonably well, though the code's actual check *labels*
group some categories together (two "Consistency" checks, two "Cross-check" checks) rather than
having one check per named category — "timeliness," "accuracy," "comparability," and
"materiality" are not each explicitly labelled as such, though "Temporal" (#6) and "Plausibility"
(#4/#5) cover adjacent ground.

### 7.4 Calculation walkthrough

1. **Submission Tracker tab**: 4-row table + `overallCompleteness` KPI.
2. **ECB Template Filler tab**: 5 sections (Portfolio Scope 85%, Scenario Variables 90%, Credit
   Risk 65%, Market Risk 50%, Operational 40%) each with 4 named fields — realistic ECB Climate
   Stress Test template structure (NACE sector breakdown, PD migration matrices, LGD under
   stress — genuine ECB CST 2022 methodology terminology).
3. **BoE CBES Template tab**: 3 sections matching the real **BoE Biennial Exploratory Scenario**
   structure — Early Action / Late Action / No Additional Action, the three actual named BoE CBES
   policy scenarios (correctly reproduced), each with 4 fields.
4. **Data Quality Check tab**: the 8 checks above + `dqPassRate` KPI.
5. **Audit Trail tab**: 7 static timestamped entries (user, action, module, version) — illustrative
   workflow log, not connected to a real event stream.
6. **Submission History tab**: 3 prior exercises (ECB CST 2024 Accepted, BoE CBES Round 1 Accepted
   with Comments, ECB CST 2022 Accepted) with `findings` counts — plausible prior-cycle outcomes.

### 7.5 Data quality status rubric

| Status | Meaning |
|---|---|
| pass | check satisfied |
| warning | within tolerance but flagged |
| fail | requires reconciliation before submission |

### 7.6 Companion analytics

Submission Tracker (4-regulator KPI + status table), ECB Template Filler (5-section completeness
bar), BoE CBES Template (3-scenario completeness bar), Data Quality Check (8-check status list +
pass-rate KPI), Audit Trail (7-entry log), Submission History (3-cycle outcome table).

### 7.7 Data provenance & limitations

- **No fabricated/random data exists in this module** — every figure is hand-entered, which means
  it is also entirely static: `overallCompleteness` and `dqPassRate` will never change unless the
  source arrays are manually edited, i.e. this is a **mockup of a workflow tool**, not a live
  system connected to an actual submission pipeline or data-quality engine.
- The guide's "3 regulators" claim (ECB Apr, BoE Jun, APRA Sep) undercounts the code's actual 4
  (adds Fed), and the guide's deadline months don't match the code's actual dates (ECB 2025-06-30
  not "Apr," APRA 2025-12-31 not "Sep") — minor guide/code drift on specific dates.
- No actual template-field validation logic exists (e.g. checking that "Total credit exposure" is
  a populated numeric value) — the section `completeness` percentages are themselves hand-set
  constants, not computed from real field-population state.
- The 8 DQ checks are realistic in content (NGFS Phase 5 envelope reference, provisions-vs-ECL
  cross-check) but their pass/warning/fail outcomes are also hand-set, not derived from any
  underlying dataset this page has access to.

**Framework alignment:** ECB Climate Stress Test template structure (Portfolio Scope, Scenario
Variables, Credit Risk, Market Risk, Operational sections) — genuinely reflects the real ECB 2022
CST methodology · BoE CBES (Early Action / Late Action / No Additional Action) — correctly
reproduces the actual three BoE CBES 2021 policy scenarios · APRA CPG 229 — named, tracked as a
compliance exercise, no template detail implemented (only ECB and BoE have dedicated template
tabs) · NGFS Phase 5 — referenced in DQ check #5 as the plausibility bound for scenario pathways.

## 9 · Future Evolution

### 9.1 Evolution A — From workflow mockup to live submission pipeline (analytics ladder: rung 1 → 2)

**What.** §7.7 is precise: no fabrication anywhere (hand-curated, no PRNG — the honest end of tier B), but the module is a mockup of a workflow tool — section `completeness` percentages are hand-set constants rather than computed from field-population state, the 8 realistic DQ checks (NGFS Phase 5 envelope, provisions-vs-ECL consistency) have no validation logic behind them, and nothing changes unless arrays are edited. There is also minor guide drift (3 vs 4 regulators; wrong deadline months). Evolution A wires the workflow to real state: template fields persisted per submission, completeness computed, DQ checks executable.

**How.** (1) Tables `stress_submissions` and `stress_submission_fields` (org-scoped): each regulator template's sections become field schemas; `completeness = populated_required_fields / required_fields` computed live, replacing hand-set percentages. (2) The 8 DQ checks become executable rules over field values — e.g. the NGFS-envelope check compares submitted scenario losses against the platform's stored NGFS parameter ranges; the provisions-vs-ECL consistency check is an arithmetic assertion across fields — each returning pass/fail with the operands shown. (3) Where the platform already computes submission inputs (scenario-stress-test runs, regulatory-capital ratios), fields can be populated by reference to those artifacts, giving lineage from engine to submission cell. (4) Approval workflow and audit trail become timestamped rows (the module's stated purpose), and guide dates corrected.

**Prerequisites.** Template field schemas transcribed per regulator (research-grade effort; start with ECB); artifact-reference conventions with sibling modules. **Acceptance:** filling a field moves completeness; a DQ check fails when its operands actually conflict and shows them; the audit trail records who populated/approved what, when.

### 9.2 Evolution B — Submission-desk copilot with DQ triage (LLM tier 2)

**What.** Stress-test submissions are deadline-driven form-filling with cross-checks — copilot territory: "what's blocking the ECB submission — list unpopulated required fields by section and the two failing DQ checks with their operands", "explain why the provisions-vs-ECL check fails and which artifact each side came from", "draft the internal sign-off memo summarizing completeness and open exceptions".

**How.** Tier-2 tool calls over the Evolution-A endpoints (submission state, field lineage, DQ results); DQ explanations quote the rule's actual operands and the artifact references behind them — the lineage from stage (3) makes "this number came from scenario-run #214" a checkable statement. Sign-off memos are composed exclusively from stored workflow state. Guardrails: the copilot never suggests values for unpopulated fields (a submission assistant that invents regulatory data is disqualifying); it locates the platform artifact that could supply the value, or reports none exists. Mutations (approvals, status changes) stay behind confirmation-gated RBAC.

**Prerequisites (hard).** Evolution A's field/DQ machinery — there is nothing real to triage today; artifact lineage fields. **Acceptance:** the blocking-items list equals the completeness endpoint's gaps; every DQ explanation shows real operands; no field value ever originates from the copilot.