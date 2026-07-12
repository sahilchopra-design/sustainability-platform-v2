# Assessment Configuration
**Module ID:** `assessment-configuration` · **Route:** `/assessment-configuration` · **Tier:** B (frontend-computed) · **EP code:** EP-CS6 · **Sprint:** CS

## 1 · Overview
Configurable weights, rating thresholds, scenario parameters, data quality rules, and full audit trail.

**How an analyst works this module:**
- Weight Editor adjusts L1 weights with sum validation
- Threshold Config sets A/B/C/D/E rating boundaries
- Scenario Setup configures NGFS multipliers
- Audit Log shows all configuration changes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_LOG`, `Card`, `NGFS_SCENARIOS`, `RATING_COLORS`, `TABS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NGFS_SCENARIOS` | 7 | `name`, `description`, `multiplier`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `actions` | `['Updated L1 weights', 'Changed A threshold to 80', 'Enabled NZE scenario', 'Set min DQ to 3', 'Updated B/C boundary', 'Added data quality rule', 'Reset to defaults', 'Changed multiplier for Delayed'];` |
| `users` | `['admin@risk-analytics.com', 'j.smith@bank.com', 'a.jones@bank.com'];` |
| `totalWeight` | `useMemo(() => Object.values(weights).reduce((a, b) => a + b, 0), [weights]);` |
| `weightData` | `useMemo(() => TAXONOMY_TREE.map(t => ({ code: t.code, name: t.name, weight: weights[t.code] })), [weights]);` |
| `ratingBands` | `useMemo(() => [ { rating: 'A', min: thresholds.A, max: 100, color: RATING_COLORS.A }, { rating: 'B', min: thresholds.B, max: thresholds.A - 1, color: RATING_COLORS.B }, { rating: 'C', min: thresholds.C, max: thresholds.B - 1, color: RATING_COLORS.C }, { rating: 'D', min: thresholds.D, max: thresholds.C - 1, color: RATING_COLORS.D }, { rat` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Weight Dimensions | — | L1 topics | Each adjustable 0-30% |
| Rating Bands | — | A-E | Configurable thresholds |

## 5 · Intermediate Transformation Logic
**Methodology:** Configuration management
**Headline formula:** `All changes logged with user, timestamp, and reason`

L1 weight sliders (must sum to 100%). A/B/C/D/E threshold boundaries adjustable. 6 NGFS scenario multipliers configurable. DQ rules: minimum quality for inclusion.

**Standards:** ['Governance']
**Reference documents:** Internal Governance Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`frontend/src/features/assessment-configuration/pages/AssessmentConfigurationPage.jsx` (EP-CS6, Sprint CS) is the **calibration console** for the platform's taxonomy-based ESG/transition scoring engine. It does not score entities — it edits the parameters that other modules score with. Six tabs:

| Tab | Editable parameter | Live validation/derivation |
|---|---|---|
| Weight Editor | L1 topic weights (0–40% each) | `totalWeight = Σ weights`; flagged red unless = 100 |
| Threshold Config | A/B/C/D min-score cut-offs | derives 5 rating bands (E = 0 … D−1) |
| Rating Scale | fixed A–E labels/actions | band ranges recomputed from thresholds |
| Scenario Setup | 6 NGFS scenario multipliers (0.1–2.0) | bar chart of live multipliers |
| Data Quality Rules | min DQ for inclusion, target DQ | 5 static rule rows parameterised by minDQ |
| Audit Log | (read-only) | 15 synthetic config-change entries |

The taxonomy itself is imported real data: `TAXONOMY_TREE` (with `getLeafNodes`, `scoreToRating`, `REFERENCE_DATA_SOURCES`) from `data/taxonomyTree`. Initial weights come from `t.weight × 100` per L1 node.

### 7.2 Parameterisation

**Rating thresholds** (default state): A ≥ 80, B ≥ 65, C ≥ 50, D ≥ 35, E < 35. Bands are derived:

```
A: [thresholds.A, 100]
B: [thresholds.B, thresholds.A − 1]
C: [thresholds.C, thresholds.B − 1]
D: [thresholds.D, thresholds.C − 1]
E: [0, thresholds.D − 1]
```

**Rating labels** (fixed): A Leader/Monitor, B Advanced/Maintain, C Transitioning/Engage, D Lagging/Escalate, E Critical/Remediate.

**`NGFS_SCENARIOS`** — 6 scenarios with default stress multipliers: Net Zero 2050 (1.5°C) 1.00, Below 2°C 0.85, Divergent Net Zero 1.15, Delayed Transition 1.30, NDCs 0.70, Current Policies 0.55. These are the 6 canonical NGFS scenario families; the multipliers are engine-authored calibration knobs (adjustable 0.1–2.0), not NGFS-published values.

**Data quality:** min DQ for inclusion (1–5, default 3) and target DQ (1–3, default 2), plus 5 static rule descriptions (min-DQ threshold, source priority, 12-month freshness, cross-validation requiring 2+ sources for DQ1-2, sector-average proxy fallback).

### 7.3 Calculation walkthrough

All logic is React state → immediate re-derivation. Weight sliders (`handleWeightChange`) clamp each to [0,100] and the header sums them, colouring the total green at exactly 100 else red — a soft validation gate (it warns but does not block). Threshold sliders feed `ratingBands` (useMemo), which both the Threshold preview strip and the Rating Scale table read (the table looks up each row's range via `ratingBands.find`). Scenario sliders update `scenarioMultipliers`, re-rendering the multiplier bar chart. No cross-parameter computation, no persistence — edits live only in component state and are lost on unmount.

### 7.4 Worked example — threshold edit propagation

Default thresholds → bands A[80–100], B[65–79], C[50–64], D[35–49], E[0–34]. A user drags B's min-score slider from 65 to 70:

- B band recomputes to [70, 79] (A unchanged at [80,100]).
- C band's max is `thresholds.B − 1` = 69, so C becomes [50, 69] — it *widens* automatically.
- The Rating Scale table's B row now shows "70-79", C shows "50-69".

So an entity scoring 67 that was rated **B** under the old config is re-rated **C** under the new one — the console is the single control point that shifts every downstream rating boundary. Weight example: if the 9 L1 sliders sum to 96, the header shows "96%" in red with "Weights must sum to 100%"; the user must reallocate 4 points before the config is valid.

### 7.5 Data provenance & limitations

- **The AUDIT_LOG (15 rows) is synthetic** — hard-coded action strings cycled with modulo indexing over 3 email addresses and arithmetic timestamps (`new Date(2026, 3, 4, 10−⌊i/2⌋, 30−i×4)`); it is **not** a real record of configuration changes. The file imports `sr(seed)=frac(sin(seed+1)×10⁴)` at line 20 but never calls it — the audit log uses deterministic index math, not the PRNG.
- **No persistence and no enforcement**: all edits are ephemeral component state; the "must sum to 100%" rule is a colour warning, not a save-blocking validation, and nothing writes the config back to a store or the scoring engines. So this console demonstrates the calibration surface but does not actually reconfigure live scoring.
- `TAXONOMY_TREE`, `scoreToRating`, and `REFERENCE_DATA_SOURCES` are genuine imported reference data (the taxonomy structure and default weights are real); only the audit log and the illustrative default numbers are synthetic.
- NGFS multipliers and DQ rules are labelled with real framework names but the specific numeric defaults are platform calibration choices.

### 7.6 Framework alignment

- **NGFS Climate Scenarios** — the 6 scenario families (Net Zero 2050, Below 2°C, Divergent Net Zero, Delayed Transition, NDCs, Current Policies) are the actual NGFS Phase III/IV scenario set, correctly ordered by transition orderliness; the module exposes them as tunable stress multipliers feeding the platform's scenario-conditioned scoring.
- **PCAF Data Quality Score (1–5)** — the min-DQ inclusion threshold and proxy-fallback rule implement PCAF's data-quality gating: nodes below the chosen DQ level fall back to sector-average proxies (PCAF's score-5 economic-activity estimate), and cross-validation requiring 2+ sources for DQ1-2 mirrors PCAF's higher-quality-tier evidence expectations.
- **A–E rating scale** — a 5-band ordinal ESG/transition-readiness scale (Leader→Critical) in the style of MSCI/ISS ESG letter ratings; boundaries are user-configurable rather than fixed to any single agency's scale.
- **Internal governance / configuration control** — the audit-log tab and "sum-to-100%" weight validation gesture at change-control governance (who changed which parameter when), the control environment SOX/ISAE 3000 would expect around a scoring model's calibration, though here it is illustrative rather than enforced.

## 9 · Future Evolution

### 9.1 Evolution A — Persisted config with enforcement and impact preview (analytics ladder: rung 1 → 2)

**What.** The console edits real calibration surfaces (L1 weights from `TAXONOMY_TREE`, A–E thresholds, 6 NGFS multipliers, DQ rules) but §7.5 documents the two gaps precisely: **no persistence and no enforcement** — edits are ephemeral component state that never reaches the scoring engines, the sum-to-100% rule is a colour warning rather than a save gate, and the 15-row audit log is hard-coded index math. Evolution A makes this the platform's actual single control point for scoring calibration.

**How.** (1) Backend `assessment_config` table with versioned config rows (weights JSON, thresholds, multipliers, DQ params, effective_from, author) plus `GET/PUT /api/v1/assessment-config`; the scoring engines read the active version instead of their local defaults. (2) Server-side validation makes the gate real: weights must sum to 100 and thresholds must be strictly decreasing (A>B>C>D) or the PUT 422s. (3) Real audit log: every accepted PUT writes a config-change event (user from session, diff, reason field) — replacing the synthetic `AUDIT_LOG`. (4) Rung 2, the high-value piece: an impact-preview endpoint that re-scores a sample portfolio under the draft config before commit, quantifying the §7.4 effect ("raising B's floor to 70 re-rates 14 of 120 entities from B to C") so calibration changes are what-if-tested, not blind.

**Prerequisites.** Identify which scoring engines consume these parameters and route them through the config service (integration inventory first); Alembic migration; RBAC — config writes should require an admin-tier role. **Acceptance:** a weight edit changes a downstream module's computed rating after save and not before; an invalid config (sum 96%) is rejected server-side; the audit log shows the real editor and diff.

### 9.2 Evolution B — Calibration copilot with governed what-ifs (LLM tier 2)

**What.** A copilot for the model-governance user: "what happens if I tighten the A threshold to 85?" answered by tool-calling the Evolution-A impact-preview endpoint and reporting the actual re-rating counts; "why is Delayed Transition's multiplier 1.30?" answered from the grounding corpus with the honest caveat §7.2 already records — the six scenario families are genuine NGFS, but the multiplier values are platform calibration choices, not NGFS-published numbers.

**How.** Tools: read config, read audit history, run impact preview (all safe); `PUT /assessment-config` gated behind explicit user confirmation with a mandatory reason string, which then lands in the real audit log attributed to the session user — the copilot can draft a config change but only the user commits it. Grounding: this Atlas record (§7.2 defaults, §7.4 worked example, §7.6 PCAF DQ-gating and NGFS notes) embedded per the Tier-1 corpus pattern. The no-fabrication validator checks every re-rating count against the preview tool output.

**Prerequisites (hard).** Evolution A — without persistence there is nothing for tools to read or write, and without the impact preview the copilot could only speculate about downstream effects, which is precisely what it must not do. **Acceptance:** every impact figure quoted matches a preview response; a commit without user confirmation is impossible by construction; the audit log entry for an LLM-drafted change names the human approver.