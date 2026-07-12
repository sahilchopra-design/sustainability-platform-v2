## 9 · Future Evolution

### 9.1 Evolution A — EAL-based adaptation ROI on real hazard grids (analytics ladder: rung 1 → 2)

**What.** Fix the module's structurally broken headline metric, then ground the hazard
inputs. §7.3/§7.4 document that `adaptRoi` is mathematically guaranteed negative for
all 50 cities (damageAvoided is defined as 30–70% of adaptTotal), so even London shows
−39% — directly contradicting the UNEP/Global Commission on Adaptation literature the
guide itself cites (BCR of 2–10x). Evolution A redefines `damageAvoided` as an
independent expected-annual-loss estimate: per-city hazard driver values pulled from
the platform's populated digital-twin grids (`ref_*_zones`: flood, sea-level, wildfire,
cyclone, earthquake — real USGS/IBTrACS/GWIS/OpenFEMA/IPCC-AR6 sources) replace the
flat `sr()` draws for heatIsland/floodRisk/waterStress, and avoided damage becomes
`EAL_baseline − EAL_with_adaptation` over a multi-decade horizon, which can and should
exceed cost.

**How.** (1) Backend route `POST /api/v1/urban-adaptation/assess` (module is Tier B
today) doing coordinate → zone lookup per the digital-twin resolution-cascade pattern.
(2) Also fix the resilience-score bound defect §7.6 flags (raw score >100 pre-clamp
compresses top-city differentiation) by renormalising before rating thresholds.
(3) Pin a worked city case in `bench_quant`.

**Prerequisites.** The always-negative ROI and unbounded resScore defects acknowledged
as fixes, not features; water-stress layer needs a source (WRI Aqueduct) since the
twin has no drought grid yet. **Acceptance:** at least some high-hazard cities show
positive adaptation ROI consistent with a BCR >1; two cities in the same region with
different coordinates get different hazard scores.

### 9.2 Evolution B — Municipal finance-gap copilot for bond framework drafting (LLM tier 2)

**What.** The module's stated deliverable is C40/EU Mission applications and municipal
green-bond frameworks. Evolution B is a tool-calling assistant for a city finance
officer: "assess Dhaka under SSP5-8.5, size the adaptation gap against our bond
capacity, and draft the use-of-proceeds section for an Adaptation bond." It calls
Evolution A's `POST /assess` for hazard/EAL figures and the existing bond-capacity
computation (exposed as `GET /bond-capacity`), then drafts framework text mapped to
the module's real 5-type bond taxonomy (Green/Blue/Adaptation/Resilience/Municipal —
§7.7 confirms these match CBI categories), with every quantitative claim traced to a
tool response.

**How.** Tier-2 stack: tool schemas from the new OpenAPI operations; system prompt
grounded in this Atlas page including the §7.2 provenance table. Drafted bond text is
a template with engine-sourced numbers interpolated — the LLM composes narrative, the
engine supplies figures; the no-fabrication validator rejects any unverifiable
number.

**Prerequisites (hard).** Evolution A must land first: the copilot must never narrate
the current always-negative ROI or the sr()-seeded hazard scores as if real.
**Acceptance:** a drafted framework's finance-need, EAL, and bond-capacity figures all
appear verbatim in tool outputs; asked for a city outside the assessed set, the
copilot runs the tool rather than inventing values, or refuses if coordinates are
unavailable.
