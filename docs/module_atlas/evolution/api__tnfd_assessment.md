## 9 · Future Evolution

### 9.1 Evolution A — Location-evidence-backed LEAP and priority-area screening (analytics ladder: rung 1 → 3)

**What.** The engine implements three assessments against TNFD Recommendations v1.0: the 14
recommended disclosures (GOV/STR/RIM/MT) rolled to a pillar-weighted compliance %, LEAP readiness
across 16 sub-components mapped to a 4-level ladder, and double materiality (financial =
dependency-driven, impact = severity × reversibility, gated at ≥60/≥60). Its reference layer is
unusually rich — 21 ENCORE ecosystem services, 8 sector packages, and 8 priority-area criteria
(KBAs, WDPA, Ramsar, UNESCO WHS, IUCN Red List habitat, Aqueduct basins, IFLs, HCS). But all three
assessments score *caller-supplied statuses* — the priority-area criteria are listed, not checked.
Evolution A makes Locate real.

**How.** (1) Wire the priority-area criteria to the platform's actual spatial layers: WDPA
proximity via `nature_data`/`spatial`, water-stressed basins via the Aqueduct-style data in
`nature_risk`, species sensitivity via `gbif_screening` — so the LEAP "Locate" sub-components
(L1–L4) are computed from asset coordinates with an evidence tier, not self-declared. (2) Feed
double-materiality dependency scores from the ENCORE sector lookups the sibling `nature_risk` and
`nature_capital` engines already hold, making the ≥60/≥60 gate evidence-anchored. (3) Persist
assessments for readiness trajectories. (4) Bench-pin the pillar weighting, LEAP ladder, and
materiality gate.

**Prerequisites.** Spatial-layer population (nature_data/spatial Evolution As); asset-coordinate
input; ENCORE linkage. **Acceptance:** Locate sub-scores derive from real WDPA/water/biodiversity
lookups with evidence tiers; the materiality gate cites ENCORE dependencies; assessments persist
with history; scoring bench-pinned.

### 9.2 Evolution B — TNFD reporting copilot orchestrating the nature stack (LLM tier 2)

**What.** A copilot that runs the three assessments and drafts the TNFD narrative — "you're LEAP
readiness level 2: Locate is strong but Evaluate lags (E2/E3 not started); disclosure compliance is
54% with RIM-B and MT-C missing; water dependency gates you into double materiality" — every score
tool-sourced, with the sector guidance shaping the recommendations.

**How.** Three POST assessments plus eight `ref/*` endpoints (14 disclosures, LEAP phases, ENCORE
services, risk categories, sector guidance, cross-framework, pillar structure, priority-area
criteria) — the most complete reference corpus in the nature domain, so definitional questions
never leave the module. This copilot is the natural *orchestrator* of the nature stack: it routes
Locate questions to `nature_data`/`gbif_screening`, valuation to `nature_capital`, and LEAP scoring
to `nature_risk`, then assembles the TNFD-structured story — a tier-3 pattern scoped to one desk.

**Prerequisites.** None hard for narrating self-asserted assessments; Evolution A before the
copilot presents Locate results as evidence-based. **Acceptance:** every disclosure status, LEAP
score, and materiality figure traces to a tool response; cross-module claims cite the module that
computed them; the copilot discloses self-declared vs location-verified inputs and refuses to
assert TNFD "alignment" beyond the computed compliance %.
