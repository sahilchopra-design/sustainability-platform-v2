## 9 · Future Evolution

### 9.1 Evolution A — True EMF MCI v1.3 in the engine, wired to the page (analytics ladder: rung 1 → 3)

**What.** §7 exposes a three-layer problem: (1) the page's advertised MCI Calculator,
utility factor, and 5-tier flow logic don't exist — the actual tabs are a 60-company
screener whose 18 metrics per company are all `sr()` draws over real corporate names
(Unilever, IKEA, Apple…), which is the worst provenance shape on the platform: fabricated
numbers attached to real entities; (2) the backend's `calculate_mci` is real but
simplified (`raw_mci = (rif+wrf)/2 × utility_factor`); (3) the guide's own LFI formula
is non-standard — EMF's published denominator is `2M + (W_F−W_C)/2`, not `2F + 0.09`.
Evolution A fixes all three: implement the actual EMF MCI v1.3 specification in
`circular_economy_engine.py` (virgin feedstock V, unrecoverable waste W with the
recycling-process waste split, utility X = (L/L_av)·(U/U_av)), correct the guide, and
rebuild the page as a client of `POST /api/v1/circular-economy/mci`.

**How.** (1) Engine upgrade with the published worked examples from the EMF technical
specification as bench pins. (2) Sector benchmarks (`MCI_BENCHMARKS`) sourced and
cited rather than asserted. (3) The named-company screener deleted or rebuilt on
disclosed data (GRI 306 waste disclosures, recycled-content reporting) — real names
demand real numbers or removal.

**Prerequisites (hard).** The fabricated-metrics-on-real-companies pattern must go
first; formula correction coordinated with the guide rewrite so §7's flag clears.
**Acceptance:** EMF spec worked examples reproduce within rounding; the page's MCI
values match engine responses; no `sr()` call remains in the file.

### 9.2 Evolution B — Circularity measurement copilot (LLM tier 2)

**What.** An assistant for MCI methodology and measurement: "why did my MCI fall when
lifetime dropped?" (utility factor mechanics), "compute MCI for 30% recycled input,
80% collection, 1.5x lifetime" (tool call to `/mci`), "how do our material flows roll
up?" (`/material-flows`), "what does GRI 306 require for the waste tab?" (standards
corpus). The engine's eight POST routes make this tier-2-capable today at the API
level, even while the page rewiring lands.

**How.** Tool schemas filtered to this module's routes via the atlas endpoint map;
every MCI/LFI/flow figure validated against tool outputs; methodology explanations
grounded in the corrected §5 formula text — which is precisely why the formula fix is
sequenced first, since RAG over the current non-standard LFI would teach users wrong
math with a confident tone.

**Prerequisites (hard).** Evolution A's formula correction and guide rewrite before
corpus embedding; company-level questions blocked until the screener is rebuilt on
disclosed data. **Acceptance:** a step-change fixture (lifetime 1.0 → 1.5) produces
the utility-factor delta the EMF spec predicts, narrated with matching numbers; asked
for IKEA's circularity score, the copilot refuses pending real disclosure data.
