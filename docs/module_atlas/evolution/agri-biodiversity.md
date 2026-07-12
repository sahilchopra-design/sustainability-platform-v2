## 9 · Future Evolution

### 9.1 Evolution A — Real BII/MSA from occurrence data with monetised pollinator value (analytics ladder: rung 1 → 3)

**What.** Today this is tier-B frontend-only: 60 synthetic operations whose every field is a
PRNG draw (`sr()`), with the §7 mismatch flag that the guide's headline metrics are **not
implemented** — MSA is a random 0.2–0.9 scalar (not computed from land-use response
functions), the guide's BII (`Σ observed/expected species / n`) is absent, and pollinator
"value" is never monetised. Evolution A builds the backend vertical the guide promises:
site-level BII computed by intersecting portfolio GPS centroids against GBIF/PREDICTS
occurrence data, MSA derived from GLOBIO land-use pressure functions, and a real pollinator
value-at-risk `= Crop_yield × pollination_dependency × price` using IPBES dependency
coefficients and commodity prices. The one economically meaningful existing formula
(`annualCreditPotential = hectares × msaScore × 0.5`) is preserved but fed a computed MSA.

**How.** `POST /api/v1/agri-biodiv/site-assessment` (centroid + crop + area → BII, MSA,
pollinator VaR, soil composite) and `GET /ref/dependency-coefficients`; a spatial ingester
loads GBIF occurrence counts and PREDICTS reference richness into PostGIS. Rung 3 calibration
comes from anchoring MSA against published GLOBIO regional baselines and validating BII
against the <75% planetary-boundary threshold the guide cites.

**Prerequisites (hard).** Purge the pervasive `sr()` draws per the platform no-fabricated-
random guardrail; correct the metric-substitution documented in §7.5 (state whether the
headline is MSA or BII and compute accordingly); soil-practice/MSA independence resolved so
regenerative practices actually correlate with biodiversity. **Acceptance:** two sites with
different GBIF occurrence density produce different BII; pollinator VaR responds to crop mix
and price; no random draw remains in the metric path.

### 9.2 Evolution B — TNFD LEAP copilot drafting D4 disclosures (LLM tier 1)

**What.** A chat panel that walks an analyst through the LEAP steps the page's tabs already
mirror (Locate assets → Evaluate dependencies via practices → Assess pollinator/soil risk →
Prepare D4 disclosure), answering "which holdings sit in biodiversity-sensitive areas?",
"what drives the pollinator-risk rating here?" (neonic exposure >5 → High), and drafting
narrative TNFD D4 dependency/impact statements from the page's computed site scores. Given
the module currently computes almost nothing real, tier 1 is the honest scope and the
copilot must disclose that MSA/species/pollinator figures are synthetic until Evolution A.

**How.** Tier-1 roadmap pattern: §7.1 field definitions, §7.2 rubric, §7.6 framework
alignment (TNFD LEAP, GLOBIO, IPBES, USDA NRCS) embedded as the module corpus; page state
(filtered operations, ratings) passed as context; served via `POST
/api/v1/copilot/agri-biodiversity/ask` with a refusal path for un-computed asks (e.g. "what
is this farm's real species count?"). After Evolution A, graduates to tier 2 by tool-calling
`POST /site-assessment` for what-if practice-adoption scenarios.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding must carry the §7 mismatch
note so the copilot never presents MSA as a computed BII. **Acceptance:** every metric cited
matches page state with its synthetic status stated; a request for a monetised pollinator VaR
before Evolution A returns a refusal naming the missing crop-price/dependency inputs.
