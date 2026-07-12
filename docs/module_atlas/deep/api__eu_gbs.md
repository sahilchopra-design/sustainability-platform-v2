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
