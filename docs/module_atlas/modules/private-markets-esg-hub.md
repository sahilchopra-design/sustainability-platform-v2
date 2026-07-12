# Private Markets ESG Hub
**Module ID:** `private-markets-esg-hub` · **Route:** `/private-markets-esg-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Unified ESG analytics platform for private markets including private equity, real estate, infrastructure, and private credit asset classes.

> **Business value:** Provides a single platform for ESG data collection, scoring, and reporting across all private market asset classes, supporting ILPA and GRESB compliance.

**How an analyst works this module:**
- Select asset class (PE, RE, Infrastructure, Private Credit).
- Review ESG data collection completeness and quality.
- Access class-specific assessments (GRESB, ILPA, etc.).
- Generate consolidated private markets ESG report.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADOPTION_TREND`, `DD_STAGES`, `ESG_BY_STRATEGY`, `ESG_CHAMPIONS`, `EVIDENCE`, `FRAMEWORK_COMPLETION`, `KpiCard`, `LP_METRICS`, `LP_SATISFACTION`, `RADAR_DATA`, `RED_FLAGS`, `REGULATIONS`, `REG_TIMELINE`, `REPORTING_TIME`, `RISK_DIMENSIONS`, `SCORE_IMPROVEMENT`, `STRATEGY_CARDS`, `STRATEGY_RISKS`, `STRESS_SCENARIO`, `SectionTitle`, `StatusBadge`, `TABS`, `TOP_CONCENTRATIONS`, `Tab1`, `Tab2`, `Tab3`, `Tab4`, `Tab5`, `Tab6`, `VALUE_LEVERS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `STRATEGY_CARDS` | 6 | `name`, `aum`, `coverage`, `keyMetric`, `status`, `esgScore`, `color` |
| `ESG_BY_STRATEGY` | 6 | `score`, `target` |
| `ADOPTION_TREND` | 5 | `pct` |
| `STRATEGY_RISKS` | 6 | `scores` |
| `TOP_CONCENTRATIONS` | 6 | `pe`, `credit`, `infra`, `re`, `vc` |
| `STRESS_SCENARIO` | 7 | `impact`, `dir` |
| `FRAMEWORK_COMPLETION` | 4 | `pe`, `credit`, `infra`, `re`, `vc` |
| `LP_SATISFACTION` | 4 | `pct` |
| `REPORTING_TIME` | 3 | `days` |
| `DD_STAGES` | 9 | `name`, `time`, `desc`, `week` |
| `RED_FLAGS` | 4 | `sector`, `outcome`, `flag` |
| `REGULATIONS` | 7 | `applicability`, `status`, `deadline`, `detail` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `RADAR_DATA` | `RISK_DIMENSIONS.map((dim, i) => ({` |
| `BADGE_ITEMS` | `['Hub', 'PE + Credit + Infra + RE + VC', '$8.4T AUM', 'ESG DD Engine', 'LP Reporting'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADOPTION_TREND`, `BADGE_ITEMS`, `DD_STAGES`, `ESG_BY_STRATEGY`, `ESG_CHAMPIONS`, `EVIDENCE`, `FRAMEWORK_COMPLETION`, `LP_METRICS`, `LP_SATISFACTION`, `RED_FLAGS`, `REGULATIONS`, `REG_TIMELINE`, `REPORTING_TIME`, `RISK_DIMENSIONS`, `SCORE_IMPROVEMENT`, `STRATEGY_CARDS`, `STRATEGY_RISKS`, `STRESS_SCENARIO`, `TABS`, `TOP_CONCENTRATIONS`, `VALUE_LEVERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Total Private AUM Covered (£Bn) | — | Portfolio Registry | Total private market AUM for which ESG data has been collected. |
| Data Coverage (%) | — | Data Collection Workflow | Proportion of portfolio companies/assets with ESG assessment complete. |
| ESG Composite Score | — | ILPA/GRESB | Portfolio-level weighted average ESG score across private market holdings. |
- **GP ESG reports + GRESB submissions + ILPA templates** → Class-specific ESG scoring; data normalisation; aggregation → **Unified private markets ESG dashboard and disclosures**

## 5 · Intermediate Transformation Logic
**Methodology:** Private Markets ESG Composite
**Headline formula:** `ESG_pm = Σ(AUMᵢ × ESGᵢ) / ΣAUMᵢ across PE+RE+Infra+PD`

AUM-weighted ESG composite across all private market asset classes using class-specific assessment methodologies.

**Standards:** ['ILPA ESG Assessment Framework', 'GRESB Infrastructure Assessment']
**Reference documents:** ILPA ESG Assessment Framework for Private Equity; GRESB Infrastructure Assessment Reference Guide

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute the composite the guide promises, on real registers (analytics ladder: pre-rung-1 static → 2)

**What.** §7 establishes this page computes nothing: every figure (strategy AUM strings, ESG scores 61–72, coverage %, stress impacts) is a hand-authored literal, there is no `reduce` anywhere, and the file is byte-identical to `private-markets-hub` (the export is even mis-named `PrivateMarketsHubPage`). The guide's `ESG_pm = Σ(AUMᵢ × ESGᵢ)/ΣAUMᵢ` is unimplemented. Evolution A first resolves the duplication — one module keeps the qualitative playbook (the DD stages and SFDR/AIFMD/CSRD regulatory register are genuinely content-accurate per §7.2), and this hub becomes the computed aggregation layer over the platform's real private-markets registers.

**How.** (1) Aggregation endpoint `GET /api/v1/private-markets/esg-composite` that reads the persisted books its sibling modules are evolving toward (`private-credit` facilities, `private-assets-transition` PE funds, real-estate holdings) and computes the AUM-weighted composite with per-class coverage %, honestly returning nulls for classes with no data rather than demo constants. (2) `STRATEGY_CARDS` AUM fields become numbers sourced from those registers; the 5×6 `STRATEGY_RISKS` matrix becomes averages of class-level scores where they exist, hand-authored placeholders clearly flagged where they don't. (3) Deduplicate with `private-markets-hub` — one route redirects or the shared content moves to a common component.

**Prerequisites.** At least two sibling registers persisted (dependency on their Evolution A work); the dedup decision made deliberately, not by drift. **Acceptance:** the composite changes when a facility's ESG score changes in `private-credit`; classes without data render "no coverage" instead of the current literal 68–89%.

### 9.2 Evolution B — LP reporting copilot over the regulatory register (LLM tier 1)

**What.** The module's durable asset is qualitative: an 8-stage ESG DD workflow and a six-regime regulatory register (SFDR, AIFMD, ELTIF, SEC, SDR, CSRD) that §7.2 calls content-accurate. Evolution B ships a tier-1 copilot for LP-reporting teams: "which of these regimes applies to a Luxembourg ELTIF with US LPs?", "draft the ILPA ESG section using our current coverage stats", "what DD stage should flag a red-flag sector exit clause?" — answered from the register, the DD-stage narrative, and (post-Evolution A) the computed composite.

**How.** Standard `POST /api/v1/copilot/private-markets-esg-hub/ask` over pgvector chunks of this Atlas record plus the `REGULATIONS`/`DD_STAGES` content and ILPA/GRESB reference texts named in §5. Quantitative questions are answered only from Evolution-A endpoint values injected as context; before that ships, the copilot must answer "what's our composite score?" with "not yet computed — the displayed figures are illustrative", which is exactly what §7 documents. Regulatory answers cite regime and deadline from the register, never from model memory alone.

**Prerequisites.** Register content dated and maintained (stale deadlines are worse than none); corpus embedded. **Acceptance:** regime-applicability answers cite the specific `REGULATIONS` row, and pre-Evolution-A quantitative questions get the documented illustrative-data refusal.