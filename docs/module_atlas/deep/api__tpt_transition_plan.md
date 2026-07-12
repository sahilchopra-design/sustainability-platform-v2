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
