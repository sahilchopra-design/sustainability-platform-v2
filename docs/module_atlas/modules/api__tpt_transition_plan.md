# Api::Tpt_Transition_Plan
**Module ID:** `api::tpt_transition_plan` · **Route:** `/api/v1/tpt-transition-plan` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/tpt-transition-plan/assess` | `assess_tpt` | api/v1/routes/tpt_transition_plan.py |
| POST | `/api/v1/tpt-transition-plan/score-element` | `score_element` | api/v1/routes/tpt_transition_plan.py |
| POST | `/api/v1/tpt-transition-plan/gap-analysis` | `gap_analysis` | api/v1/routes/tpt_transition_plan.py |
| GET | `/api/v1/tpt-transition-plan/ref/elements` | `ref_elements` | api/v1/routes/tpt_transition_plan.py |
| GET | `/api/v1/tpt-transition-plan/ref/entity-types` | `ref_entity_types` | api/v1/routes/tpt_transition_plan.py |
| GET | `/api/v1/tpt-transition-plan/ref/quality-tiers` | `ref_quality_tiers` | api/v1/routes/tpt_transition_plan.py |
| GET | `/api/v1/tpt-transition-plan/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/tpt_transition_plan.py |
| GET | `/api/v1/tpt-transition-plan/ref/interim-targets-guidance` | `ref_interim_targets_guidance` | api/v1/routes/tpt_transition_plan.py |

### 2.3 Engine `tpt_transition_plan_engine` (services/tpt_transition_plan_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_tier_midpoint` | tier | Midpoint of a QUALITY_TIERS score range (deterministic). |
| `TPTTransitionPlanEngine.assess` | entity_id, entity_name, entity_type, plan_year, net_zero_target_year, elements_completed, interim_targets, financed_emissions_trajectory | Full TPT Disclosure Framework assessment. Scoring is disclosure-completeness based and fully deterministic. ``sub_elements_completed`` (optional) maps an element key to the list of its disclosed sub-element ids (e.g. ``{"foundations": ["1.1", "1.3"]}``); when supplied, each element score is computed from the real per-element disclosure fraction. When only ``elements_completed`` is available, each  |
| `TPTTransitionPlanEngine._get_quality_tier` | score |  |
| `TPTTransitionPlanEngine._generate_gaps` | element_scores, net_zero_year, interim_targets, capex_pct, entity_type |  |
| `TPTTransitionPlanEngine.score_element` | entity_id, element_id, sub_elements_completed, sub_element_quality | Score a single TPT element based on sub-element completion. Deterministic. When ``sub_element_quality`` maps a sub-element id to a named QUALITY_TIERS tier (initial/developing/advanced/leading), that sub-element is scored at the tier's published range midpoint (a real, caller-supplied quality signal). Otherwise the disclosure-completion flag is scored with the documented MODEL calibration constant |
| `TPTTransitionPlanEngine.generate_gap_analysis` | entity_id, assessment | Generate detailed gap analysis from a TPT assessment. |
| `TPTTransitionPlanEngine.ref_elements` |  |  |
| `TPTTransitionPlanEngine.ref_entity_types` |  |  |
| `TPTTransitionPlanEngine.ref_quality_tiers` |  |  |
| `TPTTransitionPlanEngine.ref_cross_framework` |  |  |
| `TPTTransitionPlanEngine.ref_interim_targets_guidance` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/tpt-transition-plan/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/tpt-transition-plan/ref/elements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/tpt-transition-plan/ref/entity-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/tpt-transition-plan/ref/interim-targets-guidance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/tpt-transition-plan/ref/quality-tiers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**POST /api/v1/tpt-transition-plan/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/tpt-transition-plan/gap-analysis** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/tpt-transition-plan/score-element** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `tpt_transition_plan_engine` — extracted transformation lines:**
```python
score = min(100, score + 10)
score = min(100, score + 15)
score = min(100, score + 10)
tcfd_pct = round(overall * 0.9, 1)
s2_pct = round(overall * 0.85, 1)
esrs_pct = round(overall * 0.88, 1)
completion_pct=round(sub_completed / self._TOTAL_SUB_ELEMENTS * 100, 1),
element_score = total_score / len(all_sub) if all_sub else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/tpt_transition_plan_engine.py` assesses corporate/FI transition plans against the **UK Transition Plan Taskforce (TPT) Disclosure Framework (October 2023)**, restructured here as **6 elements with 20 sub-elements**:

| Element | Sub-elements | Weight |
|---|---|---|
| 1 Foundations | 1.1 Ambition, 1.2 Current State, 1.3 Milestones | 0.20 |
| 2 Implementation Strategy | 2.1 Decarbonisation Levers, 2.2 Dependencies, 2.3 Climate Solutions, 2.4 Operations | 0.25 |
| 3 Engagement & Accountability | 3.1 Value Chain, 3.2 Industry Bodies, 3.3 Policy, 3.4 Accountability | 0.15 |
| 4 Metrics & Targets | 4.1 GHG Targets, 4.2 Financial Metrics, 4.3 Progress Tracking | 0.20 |
| 5 Governance | 5.1 Oversight, 5.2 Skills, 5.3 Incentives | 0.10 |
| 6 Finance | 6.1 CapEx/OpEx, 6.2 Financing Instruments, 6.3 Transition Finance Mobilised | 0.10 |

Endpoints: `POST /assess` (full 6-element score + quality tier + gaps + cross-framework alignment), `POST /score-element` (per-sub-element scoring), `POST /gap-analysis`, and five `ref/*` endpoints (elements, entity-types, quality-tiers, cross-framework, interim-targets-guidance).

### 7.2 Parameterisation / scoring rubric

**Quality tiers** (`QUALITY_TIERS`): Initial 0–25, Developing 25–50, Advanced 50–75, Leading 75–100 — each with characteristics and next steps. Every sub-element additionally carries a 4-tier verbal quality ladder (e.g. 1.1 Ambition: initial "high-level commitment" → leading "1.5C-aligned, full value chain, sector pathway").

**Model calibration constants** (explicitly documented in code comments as "MODEL calibration constants … not entity measurements"):

```
_COMPLETED_ITEM_SCORE   = midpoint(advanced)  = (50+75)/2  = 62.5
_UNDISCLOSED_ITEM_SCORE = midpoint(initial)   = (0+25)/2   = 12.5
```

**Input-driven bonuses:** +10 on Foundations if a net-zero target year is supplied; +15 on Metrics & Targets if interim targets exist; +10 on Finance if green CapEx > 25% (each capped at 100).

**Cross-framework alignment ratios** (fixed model mapping, not per-requirement crosswalks): TCFD = overall × 0.90, IFRS S2 = × 0.85, ESRS E1 = × 0.88.

**Gap triggers:** any element < 50 (priority high if < 30); missing net-zero year (critical, TPT §1.1); missing 2030 interim target (high, §1.3, "-45% vs base year for 1.5C alignment"); green CapEx < 20% for non-FI entities (medium, §6.1). Top 5 gap actions become `priority_actions`.

**Entity types** (`ENTITY_TYPES`): bank / insurer / asset_manager / pension / corporate — each with priority sub-elements, financed-emissions flag, and regulatory triggers (FCA PS23/22, CSRD, NZBA/NZIA/NZAM, UK Pension Schemes Act 2021).

### 7.3 Calculation walkthrough

Per element: if the caller supplies `sub_elements_completed` (per-element list of disclosed sub-element IDs), the element score is the mean of 62.5/12.5 over its sub-elements; else a coarse element-level completion flag scores the whole element 62.5 or 12.5 (with a `notes` disclaimer that model constants were used). Bonuses apply, then `overall = Σ element_score × weight` → quality tier lookup → gaps → framework percentages. `score_element` alternatively accepts `sub_element_quality` tier names, scored at tier midpoints (initial 12.5, developing 37.5, advanced 62.5, leading 87.5).

### 7.4 Worked example

Corporate, net-zero year 2050, interim target `{2030: -45}`, green CapEx 30%, disclosures: `{"foundations": ["1.1","1.3"], "metrics_targets": ["4.1"], "governance": ["5.1"]}` (no other elements supplied → they fall back to the coarse flag path, all undisclosed).

| Element | Sub-element scores | Base | Bonus | Final × weight |
|---|---|---|---|---|
| Foundations | 62.5, 12.5, 62.5 | 45.83 | +10 (NZ year) | 55.8 × 0.20 = 11.17 |
| Implementation | flag: undisclosed | 12.5 | — | 12.5 × 0.25 = 3.13 |
| Engagement | flag: undisclosed | 12.5 | — | 12.5 × 0.15 = 1.88 |
| Metrics & Targets | 62.5, 12.5, 12.5 | 29.17 | +15 (interim) | 44.2 × 0.20 = 8.83 |
| Governance | 62.5, 12.5, 12.5 | 29.17 | — | 29.2 × 0.10 = 2.92 |
| Finance | flag: undisclosed | 12.5 | +10 (CapEx>25%) | 22.5 × 0.10 = 2.25 |

Overall = **30.2** → quality tier **Developing** (25–50). Alignment: TCFD 27.2%, IFRS S2 25.7%, ESRS E1 26.6%. Gaps: five elements < 50 (Implementation and Engagement at 12.5 → priority high), no missing-target gaps (2050 + 2030 supplied), no CapEx gap (30% ≥ 20%). Completion: 4/20 sub-elements = 20%.

### 7.5 Data provenance & limitations

- **Fully deterministic; no PRNG.** The docstring and comments emphasise "no stochastic noise"; when the coarse path is used, the output `notes` field discloses that model calibration constants were applied.
- The 62.5/12.5 constants, element weights, bonus magnitudes, and 0.90/0.85/0.88 alignment ratios are engine-authored calibration values — TPT publishes no numeric scoring scheme. The flat alignment ratios in particular are a simplification: a production crosswalk would score each mapped requirement pair (the `CROSS_FRAMEWORK_MAP` table has the pairings but is not used quantitatively).
- Scores measure disclosure presence, not substantive credibility (e.g. an implausible 2050 pledge still earns the +10 Foundations bonus).
- The official TPT framework organises disclosures as 5 elements / 19 sub-elements (Foundations; Implementation Strategy; Engagement Strategy; Metrics & Targets; Governance); this engine's 6-element variant splits **Finance** out as a standalone element with its own weight — a deliberate restructuring, flagged here so readers don't mistake the 6/20 structure for the published one.

### 7.6 Framework alignment

- **TPT Disclosure Framework (Oct 2023)** — element/sub-element architecture, quality-tier concept and §-references follow the TPT; the TPT itself defines *what* to disclose, not a scoring formula — the quantification is this engine's contribution.
- **FCA PS23/22** — cited as the regulatory trigger making TPT-style transition-plan disclosure expected for UK-listed issuers and FCA-regulated firms.
- **IFRS S2 / CSRD ESRS E1 / TCFD** — `CROSS_FRAMEWORK_MAP` gives 8 paragraph-level mappings (e.g. TPT 6.1 ↔ IFRS S2 climate CapEx; ESRS **E1-1** is the EU's explicit transition-plan disclosure requirement that TPT operationalises in most detail).
- **SBTi / GFANZ / PCAF / NZBA-NZIA-NZAM** — referenced in quality indicators and entity-type notes: SBTi validation marks the advanced tier for targets; GFANZ transition-finance guidance anchors 6.3; PCAF financed emissions are required at 1.2/4.2 for FIs. The interim-targets reference endpoint encodes the 1.5 °C convention of roughly −42…−50% Scope 1+2 by 2030 (consistent with SBTi's cross-sector pathway) through net zero with removals-only residuals by 2050.

## 9 · Future Evolution

### 9.1 Evolution A — Evidence-linked scoring and honest cross-framework mapping (analytics ladder: rung 1 → 2)

**What.** The engine assesses transition plans against the UK TPT Disclosure Framework (Oct 2023),
restructured as 6 elements / 20 sub-elements with documented weights (Implementation Strategy 0.25,
Foundations and Metrics & Targets 0.20 each, Engagement 0.15, Governance and Finance 0.10), rolling
to a quality tier with gap analysis. One §5 detail needs fixing: the cross-framework alignment is
computed as flat scalings of the overall score — `tcfd_pct = overall × 0.9`, `s2_pct = × 0.85`,
`esrs_pct = × 0.88` — synthetic constants presented as framework alignment, exactly the pattern the
platform's fabrication discipline targets. Sub-element scores are caller-asserted. Evolution A
grounds both.

**How.** (1) Replace the ×0.9/×0.85/×0.88 scalings with a real element-to-requirement mapping:
TPT sub-elements map to specific TCFD recommendations, ISSB S2 paragraphs, and ESRS E1 datapoints —
compute alignment from which mapped items are actually covered, or return honest nulls. (2)
Verify the metric-bearing sub-elements (4.1 GHG targets, 4.3 progress, 6.1 CapEx) against the
platform's `net_zero_targets`, glidepath, and emissions engines with an evidence tier. (3) Persist
assessments for plan-quality trajectories. (4) Bench-pin the 6-element weighting and tier mapping.

**Prerequisites.** A TPT→TCFD/S2/ESRS mapping table (the `/ref/cross-framework` scaffold exists);
engine linkages for metric verification. **Acceptance:** cross-framework percentages derive from
mapped-item coverage, never a scalar on overall; metric sub-elements carry evidence tiers;
weighting and tiers bench-pinned; assessments persist.

### 9.2 Evolution B — Transition-plan review copilot (LLM tier 2)

**What.** A copilot that reviews a transition plan — "your plan scores 61 (tier: emerging):
Implementation Strategy is weakest because 2.2 Dependencies and 2.4 Operations are undisclosed;
your interim targets don't meet the guidance cadence; here's the gap-closure order" — every score
and gap from `/assess` and `/gap-analysis` tool calls.

**How.** Three POST endpoints (`/assess`, `/score-element`, `/gap-analysis`) plus five reference
GETs (the 20 sub-elements, entity types, quality tiers, cross-framework, interim-targets guidance)
— a complete TPT grounding corpus, so the copilot cites the exact sub-element (e.g. "6.3 Transition
Finance Mobilised") behind each gap. The entity-type endpoint tailors the review for corporates vs
FIs. Chains naturally with `net_zero_targets` (target validation) and `tcfd_metrics`/`issb_s2`
(disclosure migration). Node for a transition-finance or stewardship desk.

**Prerequisites.** Evolution A's cross-framework fix before the copilot cites TCFD/S2/ESRS
alignment percentages — narrating the ×0.9 scalar as framework alignment would launder a synthetic
number. **Acceptance:** every element score, tier, and gap traces to a tool response; cross-
framework claims are mapping-derived or explicitly refused; the copilot discloses that sub-element
statuses are self-asserted and refuses to endorse a plan as "TPT-aligned" beyond the computed tier.