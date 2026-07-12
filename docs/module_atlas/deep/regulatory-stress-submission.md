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
