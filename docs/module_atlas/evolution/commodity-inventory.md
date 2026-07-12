## 9 · Future Evolution

### 9.1 Evolution A — Add the missing inventory layer: tonnage × CI vs SBTi-FLAG/IEA benchmarks (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag cuts one way that's unusual for this platform: the page's
actual computations (stage-level ESG means, Herfindahl HHI, carbon waterfall, margin
trace) are *real math on curated reference data* — the `seed()` PRNG is barely used —
but the guide's product, `CI_relative = (CI_holding − CI_benchmark)/CI_benchmark×100`
against SBTi-FLAG/IEA pathways, doesn't exist: there is no inventory tonnage, no
benchmark pathway, no relative-intensity score. Evolution A adds that inventory layer
on top of the sound traceability base.

**How.** (1) Holdings model: an upload/entry path (the overview already promises an
ingestion panel) capturing commodity, tonnage, supplier, origin — persisted to a new
`commodity_inventory_holdings` table, this module's first vertical. (2) CI resolution
cascade per the guide: supplier-specific factor → the module's own stage-level
`carbon_intensity_kg_per_t` country data → `CARBON_FOOTPRINT_COMPARISON` cradle-to-gate
LCA fallback, with the resolution tier reported (mirroring the platform's GLEIF
pattern). (3) Benchmarks: digitise SBTi FLAG commodity pathways and IEA sectoral
intensities as a refdata table; compute CI_relative and the gap-to-target trajectory.
(4) Scope 3 Cat 1 export: tonnage × resolved CI, formatted for the CSRD/ISSB
disclosure the overview promises; document the governance-inversion convention §7.5
flags in the composite.

**Prerequisites.** SBTi FLAG pathway digitisation (public, versioned); no PRNG purge
needed — a genuine rarity. **Acceptance:** a 3-holding test book produces CI_relative
values hand-checkable against the stored factors; each holding shows its CI resolution
tier; the Scope 3 export total equals Σ(tonnage × CI) exactly.

### 9.2 Evolution B — Supplier-engagement prioritizer with regulation mapping (LLM tier 1)

**What.** The module already holds the raw material for engagement decisions — country
ESG risk by stage, HHI concentration, `SC_REGULATIONS` (CSDDD, UFLPA, EUDR, LkSG with
penalties and timelines), `SC_MATURITY` traceability scores — but leaves synthesis to
the analyst. Evolution B drafts the supplier-engagement brief: for a commodity (and,
post-Evolution A, a holding), which stage carries the concentration risk, which
regulations bite on which origin countries and when, and what the decarbonisation
potential is (`reduction` vs best practice), each claim cited to the stored dataset.

**How.** Tier-1 RAG: corpus is this Atlas record plus the curated
`SUPPLY_CHAINS`/`SC_REGULATIONS` structures themselves (they are reference data, ideal
grounding); page state supplies the selected commodity. The prompt encodes §7.5's
caveats — water intensity is a label dictionary, worker counts are estimates — so
briefs carry proportionate confidence. Tier 2 becomes meaningful only after Evolution
A creates endpoints (re-resolve a holding's CI, recompute gap-to-target as tool
calls).

**Prerequisites.** Corpus embedding (roadmap D3); Evolution A for holding-specific
briefs. **Acceptance:** a cocoa engagement brief cites the actual stage HHI and the
specific regulations (with real effective dates) from `SC_REGULATIONS`; asked about a
commodity not in `SUPPLY_CHAINS`, the copilot says the chain isn't mapped rather than
generalizing.
