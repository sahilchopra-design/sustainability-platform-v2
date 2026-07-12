## 9 · Future Evolution

### 9.1 Evolution A — Pressure-specific MSA and evidence-based TNFD scoring (analytics ladder: rung 1 → 3)

**What.** A clean tier-A domain (E23) spanning five frameworks (TNFD v1.0, SBTN, CBD GBF Target 15,
MSA footprint, ENCORE/PBAF), and a model example of the platform's fabrication remediation — §7.5
records that TNFD maturity, SBTN steps, CBD scores and finance metrics "were previously fabricated
via `random.Random(hash(entity_id))`" and are now honest nulls. Its genuine ecological computation
is the land-use MSA footprint; §7.5 names the deepening opportunities: MSA is **land-use-only** (no
pressure-specific MSA for fragmentation, N-deposition, climate, encroachment) and unweighted by
ecosystem sensitivity/irreplaceability; TNFD maturity is a self-declared 1–5 input scoring
completeness not disclosure quality; and there is a minor inconsistency (the two MSA code paths use
25% vs 20% hotspot thresholds). Evolution A adds the pressure-specific MSA components GLOBIO defines
and an irreplaceability weighting, lifting the footprint from first-order to a fuller GLOBIO model.

**How.** `calculate_msa_footprint` gains pressure inputs (fragmentation, N-deposition, infrastructure
encroachment) combined multiplicatively per GLOBIO, plus an ecosystem-sensitivity weight; the 25/20%
hotspot threshold is unified. Rung 3: calibrate MSA factors against GLOBIO 4 regional baselines and
validate the nature-positive 40/30/30 blend (currently a platform composite) against emerging TNFD/
SBTN scoring guidance.

**Prerequisites.** The honest-null discipline is a strength to preserve — new pressure inputs must
default to null, not fabricated values; the 40/30/30 nature-positive weights and ≥70/≥40 CBD
cut-points are platform conventions to keep documented as such. **Acceptance:** the §7.4 MSA worked
example (510 km²·MSA footprint) reproduces under land-use-only inputs; adding fragmentation pressure
raises the footprint; both MSA code paths use the same hotspot threshold.

### 9.2 Evolution B — Nature-risk analyst with tool-called TNFD/MSA assessment (LLM tier 2)

**What.** A tool-calling analyst for nature-finance teams: "assess our TNFD maturity and gaps"
(calls `/assess`), "what's our MSA biodiversity footprint by land use?" (`/msa-footprint`), and
"what does CBD GBF Target 15 require?" (reads the reference endpoints) — narrating the engine's real
scores and, crucially, its honest nulls (an absent pillar maturity returns `insufficient_data`, not
a fabricated score). The copilot walks the TNFD LEAP structure and SBTN five steps the reference
data enumerates.

**How.** Tool schemas from the 2 POST + 8 GET operations (all passing the harness); the seven
reference endpoints (TNFD pillars, land-use MSA, SBTN steps, CBD Target 15, ENCORE services,
assessment types, PBAF standard) are ideal RAG grounding for "what's the MSA factor for intensive
agriculture?" questions — a tier-1 explainer over a tier-2 operator. The no-fabrication validator
checks every score and km²·MSA figure against tool output; because the engine reports
`insufficient_data` honestly, the copilot must request missing inputs rather than assume them.

**Prerequisites.** Atlas + reference corpus embedded (roadmap D3); the copilot's grounding must
carry the honest-null discipline so it never presents a null as a computed zero. **Acceptance:**
every figure cited traces to an engine tool call; a TNFD query with no pillar maturity returns the
engine's honest-null with the copilot requesting the input; the MSA footprint cited matches
`/msa-footprint` exactly.
