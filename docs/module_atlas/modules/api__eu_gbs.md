# Api::Eu_Gbs
**Module ID:** `api::eu_gbs` · **Route:** `/api/v1/eu-gbs` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eu-gbs/assess/batch` | `assess_batch` | api/v1/routes/eu_gbs.py |
| GET | `/api/v1/eu-gbs/ref/bond-types` | `ref_bond_types` | api/v1/routes/eu_gbs.py |
| GET | `/api/v1/eu-gbs/ref/er-requirements` | `ref_er_requirements` | api/v1/routes/eu_gbs.py |
| GET | `/api/v1/eu-gbs/ref/standards-comparison` | `ref_standards_comparison` | api/v1/routes/eu_gbs.py |

### 2.3 Engine `eu_gbs_engine` (services/eu_gbs_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `EUGBSResult.to_dict` |  |  |
| `EUGBSEngine.assess_issuance` | inp | Full EU GBS compliance assessment for a bond issuance. Returns EUGBSResult with compliance score, blocking gaps, and priority actions. |
| `EUGBSEngine.generate_factsheet` | inp | Generate a structured GBFS (Green Bond Factsheet) covering all 5 sections as defined in GBFS_SECTIONS. |
| `EUGBSEngine.assess_allocation_report` | inp | Post-issuance allocation report compliance check. Checks: allocated_pct >= 95%, taxonomy_aligned_pct >= 100%, unallocated policy. |
| `EUGBSEngine.assess_impact_report` | inp | Post-issuance impact report compliance check. Checks: indicators populated, methodology described, alignment maintained. |
| `EUGBSEngine.compare_standards` |  | Return STANDARDS_COMPARISON with analysis notes. |
| `EUGBSEngine.get_bond_types` |  |  |
| `EUGBSEngine.get_taxonomy_objectives` |  |  |
| `EUGBSEngine.get_er_requirements` |  |  |
| `EUGBSEngine.get_timeline` |  |  |
| `EUGBSEngine._assess_taxonomy_alignment` | core_pct, pocket_pct, pocket_conditions_met, threshold_pct, is_sovereign | Evaluate proceeds allocation against the applicable EU GBS taxonomy alignment threshold, honouring the Art 5 Regulation (EU) 2023/2631 "flexibility pocket". Art 5 allows up to 15 percentage points (_FLEXIBILITY_POCKET_MAX_PCT) of proceeds to be allocated to activities that meet the Taxonomy's DNSH and minimum-safeguards requirements but lack finalized technical screening criteria (TSC). This does  |
| `EUGBSEngine._estimate_gbfs_completeness` | inp | Proxy GBFS completeness based on available issuance input fields. Each section contributes equally (20% each, 5 sections). |
| `EUGBSEngine._build_priority_actions` | blocking_gaps, warnings, inp |  |

**Engine `eu_gbs_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `_W_TAXONOMY` | `0.4` |
| `_W_DNSH` | `0.2` |
| `_W_MIN_SAFEGUARDS` | `0.15` |
| `_W_ER` | `0.15` |
| `_W_REPORTING` | `0.1` |
| `_TAXONOMY_THRESHOLD_STANDARD` | `100.0` |
| `_TAXONOMY_THRESHOLD_SOVEREIGN` | `80.0` |
| `_FLEXIBILITY_POCKET_MAX_PCT` | `15.0` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eu-gbs/ref/bond-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['senior_unsecured', 'covered_bond', 'sovereign', 'high_yield', 'green_loan_linked', 'standard_green_bond'], 'n_keys': 6}`

**GET /api/v1/eu-gbs/ref/er-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['registration', 'independence', 'methodology', 'scope', 'report'], 'n_keys': 5}`

**GET /api/v1/eu-gbs/ref/standards-comparison** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['eugbs', 'icma_gbp', 'climate_bonds_standard', '_analysis'], 'n_keys': 4}`

**GET /api/v1/eu-gbs/ref/taxonomy-objectives** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['CCM', 'CCA', 'WMR', 'CE', 'PPE', 'BIO'], 'n_keys': 6}`

**GET /api/v1/eu-gbs/ref/timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 4, 'item0_keys': ['date', 'event', 'article']}`

**POST /api/v1/eu-gbs/allocation-report** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/eu-gbs/assess-issuance** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/eu-gbs/assess/batch** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `eu_gbs_engine` — extracted transformation lines:**
```python
tax_score = min(effective_alignment_pct / tax_threshold, 1.0) * 100.0
core_min_pct = max(threshold_pct - _FLEXIBILITY_POCKET_MAX_PCT, 0.0)
effective_pct = core_pct + pocket_credited
s1_score = sum(1 for f in s1_fields if f and str(f).strip()) / len(s1_fields)
s2_score = sum(s2_fields) / len(s2_fields)
s4_score = (0.5 * int(inp.has_external_reviewer)) + (0.5 * int(inp.has_pre_issuance_review))
core_min = max(threshold - _FLEXIBILITY_POCKET_MAX_PCT, 0.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded solely in
`backend/services/eu_gbs_engine.py` (E14) and `backend/api/v1/routes/eu_gbs.py`.)*

### 7.1 What the domain computes

`EUGBSEngine` is a rules-based compliance assessor for the **European Green Bond Standard**
(Regulation (EU) 2023/2631). Four assessment services plus a factsheet generator:

1. **Issuance assessment** (`POST /assess-issuance`, `POST /assess/batch`) — five weighted
   component scores blended into a 0–100 compliance score:

```
compliance_score = 0.40·tax_score + 0.20·dnsh_score + 0.15·ms_score
                 + 0.15·er_score  + 0.10·reporting_score
overall_compliant = (compliance_score ≥ 70) AND (blocking_gaps == ∅)
```

2. **GBFS factsheet** (`POST /generate-factsheet`) — structured 5-section Green Bond Factsheet
   populated from issuance inputs (allocation timeline fixed at "Within 24 months of issuance").
3. **Allocation report check** (`POST /allocation-report`) — post-issuance gates:
   `total_allocated_pct ≥ 95` (gap), `taxonomy_aligned_pct ≥ 100` (gap), `unallocated_pct ≤ 5`
   (warning), and a ±1pp reconciliation of the per-objective breakdown against total allocated.
4. **Impact report check** (`POST /impact-report`) — gates: at least one impact indicator,
   methodology description ≥ 20 characters, `alignment_maintained == true`; a warning fires when
   fewer than 2 indicators are reported.
5. **Standards comparison** (`GET /ref/standards-comparison`) — static EU GBS vs ICMA GBP vs
   Climate Bonds Standard feature matrix plus analysis notes.

### 7.2 Parameterisation / scoring rubric

| Component | Weight | Score rule | Provenance |
|---|---|---|---|
| Taxonomy alignment | 0.40 | `min(alignment_pct / threshold, 1) × 100` | Threshold 100% (Art 3) or 80% sovereign (Art 21) — code constants |
| DNSH | 0.20 | 100 if confirmed else 0 | Taxonomy Reg. 2020/852 Art 17 cited in gap text |
| Minimum safeguards | 0.15 | 100 if confirmed else 0 | Taxonomy Art 18 (OECD Guidelines / UNGPs) |
| External reviewer | 0.15 | 100 if ER + pre-issuance review; 50 if ER only; 0 otherwise | Reg. 2023/2631 Art 22 (ESMA registration) |
| Reporting commitment | 0.10 | 80 if ER-compliant else 40 — **proxy, not a real input** (code comment: "here we proxy via er_status") | synthetic heuristic |

Weights (0.40/0.20/0.15/0.15/0.10) are platform design choices, not regulatory values. Blocking
gaps (any of: alignment below threshold, DNSH unconfirmed, safeguards unconfirmed, no ER) force
`overall_compliant = false` regardless of score.

**GBFS completeness proxy** (`_estimate_gbfs_completeness`, 5 equally weighted sections): §1 share
of {issuer, bond_type, principal, currency} populated; §2 share of {objectives listed,
alignment > 0, DNSH, safeguards}; §3 fixed 0.6 (0.4 if refinancing share negative — effectively
always 0.6 since the API validates ≥ 0); §4 = 0.5·ER + 0.5·pre-issuance review; §5 fixed 0.8.

**Reference data:** 6 bond types (senior unsecured, covered, sovereign, high-yield,
green-loan-linked, non-GBS standard); 6 EU Taxonomy objectives (CCM/CCA per DA 2021/2139;
WMR/CE/PPE/BIO per DA 2023/2486); ER requirements (Arts 22–24); regulatory timeline
2023-10-04 (OJEU) → 2024-12-21 (entry into force) → 2025-12-21 (ESMA ER registration) →
2026-06-30 (full application).

### 7.3 Calculation walkthrough

The route validates a Pydantic `IssuanceInputModel`, builds an `IssuanceInput` dataclass, and
calls `assess_issuance`. The sovereign flag selects the 80% threshold; each component is scored
independently; gaps/warnings are accumulated as strings with article citations; priority actions
are derived from the failing checks (capped at 5). Batch assessment simply maps the same logic
over a list. All outputs are deterministic pure functions of the request — no DB, no randomness.

### 7.4 Worked example — corporate senior unsecured issuance

Inputs: alignment 92%, DNSH confirmed, safeguards confirmed, ER engaged but **no pre-issuance
review**, objectives = [CCM], non-sovereign.

| Component | Score | Weighted |
|---|---|---|
| Taxonomy | min(92/100, 1)×100 = 92.0 | 36.80 |
| DNSH | 100 | 20.00 |
| Min safeguards | 100 | 15.00 |
| ER (engaged, no review) | 50 | 7.50 |
| Reporting (not er_compliant) | 40 | 4.00 |
| **compliance_score** | | **83.30** |

Despite scoring 83.3 ≥ 70, the bond is **not compliant**: alignment 92% < 100% raises a blocking
gap ("Taxonomy alignment (92.0%) is below required 100% per Art 3"), plus a warning that the
pre-issuance review is unconfirmed. Priority action: "Increase taxonomy-aligned use of proceeds
to meet the 100% threshold." The same bond issued by a sovereign (threshold 80%) would clear the
alignment gate with tax_score = 100 → compliance_score 86.5 and `overall_compliant = true`.

### 7.5 Post-issuance gates

| Report | Blocking gap | Warning |
|---|---|---|
| Allocation | allocated < 95% (Art 7 cited); taxonomy-aligned < 100% (Art 3) | unallocated > 5%; objective breakdown ≠ total ±1pp |
| Impact | no indicators (Art 8); methodology < 20 chars (Art 8(3)); alignment not maintained | < 2 indicators |

### 7.6 Data provenance & limitations

- No synthetic PRNG data; all logic is deterministic rules over caller-supplied inputs. The
  standards-comparison matrix and timeline are static editorial content.
- **Threshold stricter than the Regulation:** the code requires 100% taxonomy alignment for
  non-sovereigns, whereas the EuGB Regulation's Art 5 "flexibility pocket" permits up to 15% of
  proceeds toward activities lacking technical screening criteria (i.e. an 85% floor in
  practice). The `STANDARDS_COMPARISON` table even sets `flexibility_provision: True` for EU GBS,
  but the scorer never applies it. The 80% sovereign figure is likewise a simplification of
  Art 21's tailored regime.
- Reporting-commitment score is an admitted proxy (constant 80/40 keyed off ER status) — the code
  comment says production would use dedicated fields.
- DNSH/minimum-safeguards are boolean attestations, not activity-level assessments; no linkage to
  the `eu_taxonomy_gar` domain's DNSH engine.
- GBFS completeness §3/§5 contain constants (0.6, 0.8) that inflate completeness for empty inputs.

### 7.7 Framework alignment

- **Regulation (EU) 2023/2631 (EuGB)** — the module's backbone: Art 3 use-of-proceeds, Art 21
  sovereign provisions, Art 22–24 external-reviewer regime, Art 7/8 allocation & impact reports,
  and the real 2023–2026 application timeline.
- **EU Taxonomy Regulation 2020/852** — Art 17 DNSH and Art 18 minimum safeguards are the second
  and third scoring pillars; the six environmental objectives mirror the two Climate (2021/2139)
  and four Environmental (2023/2486) Delegated Acts.
- **ICMA Green Bond Principles** — represented as the voluntary comparator: four core components
  (use of proceeds, evaluation/selection, management of proceeds, reporting) with *recommended*
  external review — correctly contrasted with EU GBS's mandatory regime.
- **Climate Bonds Standard (CBI)** — comparator with mandatory verifier and sector criteria but
  no EU Taxonomy linkage, as the matrix states.

## 9 · Future Evolution

### 9.1 Evolution A — Apply the Art 5 flexibility pocket and real reporting/DNSH inputs (analytics ladder: rung 1 → 3)

**What.** The European Green Bond Standard compliance assessor (E14, Reg. (EU) 2023/2631) — five
weighted component scores (taxonomy 0.40 / DNSH 0.20 / safeguards 0.15 / ER 0.15 / reporting 0.10)
blended to a 0–100 score with blocking-gap logic, plus factsheet and post-issuance allocation/impact
checks. Deterministic, no PRNG. §7.6 names a real **correctness gap**: the scorer requires **100%
taxonomy alignment** for non-sovereigns, but the EuGB Regulation's Art 5 "flexibility pocket" permits
up to 15% of proceeds toward activities lacking technical screening criteria (an 85% floor) — and the
engine has the `_FLEXIBILITY_POCKET_MAX_PCT = 15.0` constant *and* an `_assess_taxonomy_alignment`
method that honours it, yet the main scorer path doesn't apply it (the `STANDARDS_COMPARISON` even sets
`flexibility_provision: True`). Also: the **reporting-commitment score is an admitted proxy** (constant
80/40 keyed off ER status, no real input), DNSH/safeguards are boolean attestations with no linkage to
the `eu_taxonomy_gar` DNSH engine, and GBFS completeness §3/§5 use inflating constants. Evolution A
applies the flexibility pocket in the scorer, wires real reporting/DNSH inputs, and links to the
taxonomy engine.

**How.** `assess_issuance` routes taxonomy scoring through `_assess_taxonomy_alignment` so the Art 5
pocket is credited (core ≥ threshold − 15% + qualifying pocket); the reporting-commitment score uses
dedicated input fields instead of the ER proxy; DNSH/safeguards attestations are cross-checked against
the `eu_taxonomy_gar` domain's activity-level DNSH engine. Rung 3: the 0.40/0.20/0.15/0.15/0.10 weights
gain a documented rationale, and post-issuance checks validate the allocation breakdown against real
proceeds data.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /assess-issuance`, `/assess/batch`
**failed** and `/allocation-report` **skipped**; the flexibility-pocket omission is a correctness fix
(the constant and method already exist — wire them). **Acceptance:** the §7.4 worked example (92%
alignment → 83.3 score but non-compliant on the 100% gate) changes correctly — a 92%-aligned bond with
a qualifying 8% pocket now clears the alignment gate under Art 5; the reporting score reflects a real
input, not the ER proxy; the failing endpoints pass the harness.

### 9.2 Evolution B — Green-bond compliance copilot with tool-called assessment (LLM tier 2)

**What.** A copilot for DCM/sustainability-finance teams: "is this green bond EuGB-compliant?"
(`/assess-issuance` → component scores, blocking gaps with article citations, priority actions), "check
our allocation report" (`/allocation-report` → 95%/100% gates), "check our impact report"
(`/impact-report`), and "how does EuGB compare to ICMA GBP?" (`/standards-comparison`) — narrating real
rule output and the canonical remediation ("increase taxonomy-aligned use of proceeds to meet the
threshold").

**How.** Tool schemas over the assessment + factsheet endpoints; the reference endpoints (bond types,
ER requirements, taxonomy objectives, standards comparison, timeline) are exceptional RAG grounding for
"what does EuGB Art 22 require of external reviewers?" questions. The no-fabrication validator checks
every score, alignment % and gate against tool output; the copilot cites the article for each gap and
distinguishes blocking gaps (alignment, DNSH, safeguards, ER) from warnings. Post-Evolution A it
correctly explains the Art 5 flexibility pocket. Composable with `esma_fund_names` and `eu_taxonomy_gar`
in a regulatory-disclosure desk.

**Prerequisites.** Evolution A's harness fixes and flexibility-pocket correction (so narrated compliance
is regulation-faithful); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every
figure/citation traces to an engine tool call; the compliance verdict matches `/assess-issuance`; the
copilot correctly applies the Art 5 pocket post-Evolution A; each gap is reported with its EuGB article.