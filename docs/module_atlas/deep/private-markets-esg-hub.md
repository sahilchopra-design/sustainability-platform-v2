## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an **AUM-weighted private-markets
> ESG composite**: `ESG_pm = Σ(AUMᵢ × ESGᵢ) / ΣAUMᵢ` across PE+RE+Infra+PD, a "58/100 composite",
> "71% data coverage", ILPA/GRESB class-specific scoring. **No such calculation exists in the code.**
> This module is a **static presentation dashboard** — every number (AUM figures, ESG scores,
> coverage %, GRESB averages, framework-completion %, stress impacts) is a hand-authored literal in a
> module-level constant array, mapped directly into recharts. There is no `reduce`, no weighting, no
> aggregation, no state beyond the active-tab index. (It is also byte-identical to
> `private-markets-hub` — the exported function is even mis-named `PrivateMarketsHubPage`.)

### 7.1 What the module computes

**Nothing is computed.** The page renders six tabs (Strategy Overview, Cross-Strategy Risk, LP
Reporting Suite, ESG DD Workflow, Regulatory Compliance, Value Creation Playbook) from fixed data:

- `STRATEGY_CARDS` — 5 strategies (PE/Credit/Infra/Real Assets/VC) with literal AUM ("$2.1T"),
  coverage %, ESG score, and a key-metric string. AUM values are **strings**, so no arithmetic is
  even possible on them.
- `RADAR_DATA` — built once from `STRATEGY_RISKS[i].scores[i]` (a fixed 5×6 matrix) — the only
  "derived" structure, and it is a pure re-shape of constants, not a computation.
- `ESG_BY_STRATEGY`, `ADOPTION_TREND`, `TOP_CONCENTRATIONS`, `STRESS_SCENARIO`,
  `FRAMEWORK_COMPLETION`, `LP_SATISFACTION`, `REPORTING_TIME`, `DD_STAGES`, `RED_FLAGS`,
  `REGULATIONS`, `REG_TIMELINE`, `VALUE_LEVERS`, `ESG_CHAMPIONS` — all hand-authored tables.

### 7.2 Parameterisation / provenance

| Displayed value | Source in code | Provenance |
|---|---|---|
| Strategy AUM ($2.1T … $1.0T) | `STRATEGY_CARDS[].aum` (string) | hand-authored demo |
| ESG scores (61–72) | `STRATEGY_CARDS[].esgScore` | hand-authored demo |
| Coverage % (68–89) | `STRATEGY_CARDS[].coverage` | hand-authored demo |
| Cross-strategy risk matrix | `STRATEGY_RISKS` (5×6) | hand-authored demo |
| Framework completion % | `FRAMEWORK_COMPLETION` | hand-authored demo |
| DD workflow (8 stages) | `DD_STAGES` | hand-authored (realistic ILPA/IFC-PS structure) |
| Regulatory status | `REGULATIONS` (6 regimes) | hand-authored (SFDR/AIFMD/ELTIF/SEC/SDR/CSRD) |

The DD-stage narrative and the regulatory register are **content-accurate** (real regime names,
plausible deadlines, IFC Performance Standards references) — the module's genuine value is as a
qualitative playbook, not a calculator.

### 7.3 Calculation walkthrough

Input constant → chart. E.g. `ESG_BY_STRATEGY` → grouped bar (score vs target); `ADOPTION_TREND` →
line; `RADAR_DATA` → 5-series radar; `REPORTING_TIME` → 14-day-vs-3-day comparison bar. No user
inputs alter any figure; the only interactivity is tab switching.

### 7.4 Worked example

There is no numeric pipeline to trace. The advertised composite `Σ(AUMᵢ×ESGᵢ)/ΣAUMᵢ` would, if the
AUM strings were parsed ($2.1T×68 + $1.8T×64 + $1.6T×72 + $1.9T×61 + $1.0T×67) / $8.4T ≈ **65.6**,
**not** the "58/100" the guide states — confirming the guide figure is unrelated to any code.

### 7.5 Data provenance & limitations

- **All values are hand-authored demo literals.** No `sr()` seeding, no aggregation, no real data.
- The AUM-weighted ESG composite, GRESB/ILPA class-specific scoring, and "71% coverage" pipeline
  described in the guide are absent — the page displays but does not derive them.
- Duplicate of `private-markets-hub` (identical file); the two routes serve the same static page.

**Framework alignment:** The content references **ILPA ESG Assessment Framework** (DD data
conventions; the 8-stage workflow mirrors ILPA's diligence-to-monitoring lifecycle), **GRESB
Infrastructure/RE** (benchmark scores quoted as strings), **IFC Performance Standards** (PS6
biodiversity in the red-flag examples), and **SFDR/AIFMD/ELTIF 2.0/SEC PFA/UK SDR/CSRD** (the
regulatory register). None of these frameworks' scoring math is implemented.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a single AUM-weighted private-markets ESG composite and coverage
metric across PE, Private Credit, Infrastructure, Real Assets, and VC, plus class-specific sub-scores,
to support LP reporting and cross-strategy risk oversight.

**8.2 Conceptual approach.** A **hierarchical AUM-weighted roll-up** of class-native ESG scores,
mirroring (i) ILPA's ESG data-convergence template (which normalises heterogeneous GP submissions to
a common LP view) and (ii) GRESB's asset→fund→portfolio aggregation. Class-native scores are computed
in their own methodologies (GRESB for RE/Infra, ILPA DDQ for PE/Credit) then normalised to 0–100 and
weighted by committed AUM.

**8.3 Mathematical specification.**
Per strategy s: `ESG_s = Σ_{a∈s} (AUM_a · score_a) / Σ_{a∈s} AUM_a` (asset→strategy roll-up).
Portfolio: `ESG_pm = Σ_s (AUM_s · ESG_s) / Σ_s AUM_s`.
Coverage: `cov = Σ_{a: assessed} AUM_a / Σ_a AUM_a`.
Data-quality weight (optional): down-weight self-reported vs verified via `w_a = f(DQ_a)`, giving
`ESG_pm = Σ w_a·AUM_a·score_a / Σ w_a·AUM_a`.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Class score | `score_a` | GRESB (RE/Infra), ILPA DDQ (PE/Credit), impact rubric (VC) |
| Weight | `AUM_a` | fund accounting (committed/NAV) |
| DQ weight | `w_a` | verified=1.0, GP-reported=0.7, estimated=0.4 |

**8.4 Data requirements.** Per asset/fund: committed AUM or NAV, ESG score in class methodology,
assessment date, DQ tier. Sources: GP ESG reports, GRESB submissions, ILPA templates, fund
accounting. Platform currently holds none of these as live data — only the hand-authored constants.

**8.5 Validation & benchmarking.** Reconcile portfolio composite against GRESB peer percentiles and
ILPA benchmark medians; sensitivity to coverage gaps (score under full vs assessed-only universe);
stability across reporting periods.

**8.6 Limitations & model risk.** Heterogeneous class methodologies are not truly commensurable —
normalisation to 0–100 is a modelling choice; coverage gaps bias the composite toward
better-disclosed assets. Conservative fallback: report composite only above a coverage threshold
(e.g. ≥70% AUM) and show the coverage-adjusted range.
