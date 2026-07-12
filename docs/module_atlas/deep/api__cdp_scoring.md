## 7 · Methodology Deep Dive

Grounded in `backend/services/cdp_scoring_engine.py` (routes: `api/v1/routes/cdp_scoring.py`,
mounted at `/api/v1/cdp`). A CDP (Carbon Disclosure Project) scoring engine for the Climate Change
(C0–C14) and Water Security (W0–W8) questionnaires, implementing CDP's four-level scoring
(Disclosure → Awareness → Management → Leadership) and A→D- letter grades, with peer benchmarking,
cross-framework mapping, gap analysis, and recommendations.

### 7.1 What the domain computes

Note the **exposed API surface is reference-data only** — the eight `GET /ref/*` endpoints in the
trace serve the static tables (module catalogues, scoring methodology, score bands, activity
groups, cross-framework map, peer benchmarks). The scoring calculators (`assess_climate`,
`assess_water`, `compare_to_peers`) are engine methods consumed internally; they define what the
reference data means.

```
module_overall = disc·w_disc + awar·w_awar + mgmt·w_mgmt + lead·w_lead   (category-specific weights)
level_avg[L]   = mean over modules of level-L score
overall_pct    = Σ level_avg[L] × 0.25                                    (four equal level weights)
grade          = highest band whose min_pct ≤ overall_pct
```

### 7.2 Parameterisation (cited to CDP Scoring Methodology 2024)

**Four scoring levels**, each weighted 0.25, with a minimum-score threshold to reach the level:
Disclosure (0), Awareness (30), Management (50), Leadership (75).

**Score bands** (letter ← min %): A ← 80 · A- ← 70 · B ← 60 · B- ← 50 · C ← 40 · C- ← 30 · D ← 10
· D- ← 0. Grade labels group into Leadership/Management/Awareness/Disclosure.

**Category scoring weights** (`_CATEGORY_SCORING_WEIGHTS`) — per module category, how the four
levels combine into the module score. Examples:

| Category | disc | awar | mgmt | lead |
|---|---|---|---|---|
| governance | 0.40 | 0.30 | 0.20 | 0.10 |
| emissions | 0.35 | 0.25 | 0.25 | 0.15 |
| targets | 0.15 | 0.20 | 0.30 | 0.35 |
| strategy | 0.20 | 0.25 | 0.30 | 0.25 |
| engagement | 0.20 | 0.25 | 0.30 | 0.25 |

Disclosure-heavy for governance/emissions (basic reporting), leadership-heavy for targets
(ambition matters most) — mirroring CDP's emphasis that higher levels require demonstrated action.

**Modules**: 15 Climate (C0 Introduction … C6 Emissions Data (10 disclosures) … C14 Signoff) and 9
Water (W0 … W5 Facility Water Accounting … W8 Targets), each with category and disclosure count.
**12 Activity Groups** (AG01 Financial Services … AG12 Mining & Metals). **Peer benchmark medians**
for 6 groups (e.g. AG08 Technology median 62% grade B; AG12 Mining 45% grade C) with avg
disclosure/verification/target-coverage. **Cross-framework map**: CDP modules → TCFD / GRI / ISSB
S2 / SASB (e.g. C6 Emissions → TCFD Metrics&Targets a, GRI 305-1..4, IFRS S2 para 29).

### 7.3 Calculation walkthrough

1. **Per module** (`_score_module`): the four level inputs (0–100) are clamped, combined with the
   category weights into `overall`; status = `not_disclosed` (all zero) / `partial` (disclosure
   < 30 or overall < 20) / `complete`.
2. **Aggregate**: each level is averaged across all modules; `overall_pct` = Σ level_avg × 0.25.
3. **Grade**: first band whose `min_pct ≤ overall_pct`.
4. **Derived flags**: verification from C10 (Scope 1/2 verified if C10 disclosure ≥ 50; ISO
   14064-3); SBTi alignment from C4 (`has_sbti_target` if C4 management ≥ 60; net-zero if C4
   leadership ≥ 75); water risk level from W1/W2 (`0.4·W1_awar + 0.3·W2_awar + 0.3·W2_mgmt` → high
   ≥ 70 / medium ≥ 40 / low). Cross-framework mappings are filtered to responded modules.
5. **Peer comparison**: `delta = entity − activity-group median`; above ≥ +5, at within ±5, else
   below. **Gaps** and **recommendations** are grade- and gap-driven (capped at 10 / 8 items).

### 7.4 Worked example (Technology entity, AG08)

Suppose module-averaged levels come out disclosure 70, awareness 55, management 48, leadership 35:

| Level | avg | × weight 0.25 |
|---|---|---|
| Disclosure | 70 | 17.5 |
| Awareness | 55 | 13.75 |
| Management | 48 | 12.0 |
| Leadership | 35 | 8.75 |
| **Overall** | | **52.0%** |

52.0 ≥ 50 → grade **B-** (Management). Peer comparison vs AG08 median 62%: delta = 52 − 62 =
−10 → **below_median**. A single governance module scored disclosure 40 / awareness 30 / management
20 / leadership 10 would give `40×0.40 + 30×0.30 + 20×0.20 + 10×0.10 = 16 + 9 + 4 + 1 = 30.0`
overall — status complete (disclosure ≥ 30). If C4 management were 65 → `has_sbti_target = True`;
if leadership < 75 → net-zero gap flagged and a recommendation to develop a net-zero transition
plan is emitted.

### 7.5 Data provenance & limitations

- **No synthetic/PRNG numeric data.** Level scores are caller-supplied (or default 0); the only
  `hashlib` use is generating a stable assessment ID from name+year — not a fabricated metric.
  Peer benchmark medians are curated reference values (labelled as activity-group medians), not
  live CDP data.
- The engine scores **self-assessed 0–100 level inputs**, not raw questionnaire responses: a
  caller (or upstream mapping) must translate actual CDP answers into per-module Disclosure/
  Awareness/Management/Leadership scores. It does not parse the CDP questionnaire itself.
- CDP's real scoring is question-and-points based with category weightings, gateway/exclusion
  criteria, and level-gating (you cannot score Management points without passing Awareness); here
  levels are simply averaged with equal 0.25 weights and the `min_score_for_level` thresholds are
  reference metadata, **not enforced** as gates in the aggregation.
- Derived flags (verification, SBTi, water risk) use single-module heuristics with fixed
  thresholds, not the multi-question logic CDP applies.
- Peer benchmarks cover only 6 of 12 activity groups; others return `benchmark_available: false`.

### 7.6 Framework alignment

- **CDP Scoring Methodology 2024 (Climate Change & Water Security)** — the four-level structure
  (Disclosure/Awareness/Management/Leadership), the A→D- band cut-offs, module structure (C0–C14,
  W0–W8) and Activity Classification System are CDP's own; the engine approximates CDP's weighted,
  gated points system with category-weighted level averaging.
- **CDP Activity Classification System (2023)** — 12 activity groups used for peer benchmarking,
  since CDP scores are only comparable within an activity group.
- **TCFD (2017/2021)** — cross-framework map ties CDP modules to the four TCFD pillars (C1↔
  Governance, C2/C3↔Strategy & Risk Management, C4/C6↔Metrics & Targets).
- **IFRS S2 / ISSB (2023)** — CDP modules mapped to S2 paragraphs (governance 5-6, risks 10-12,
  strategy 13-22, Scope 1/2/3 emissions para 29, targets 33-36), reflecting the CDP–ISSB
  interoperability.
- **GRI 305 (Emissions) / GRI 303 (Water) / GRI 302 (Energy)** and **SASB** — module-level
  mappings for disclosure interoperability.
- **SBTi** — target status inferred from C4 (approved/committed/no_target) and net-zero flag,
  reflecting CDP's Leadership-band requirement for science-based targets.
