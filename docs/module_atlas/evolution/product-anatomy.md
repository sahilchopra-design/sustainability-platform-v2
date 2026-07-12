## 9 · Future Evolution

### 9.1 Evolution A — Live mᵢ × EFᵢ engine with stage attribution (analytics ladder: rung 1 → 2)

**What.** The module's genuine asset is unusual for tier B: 30 hand-researched product teardowns with realistic per-component carbon/water/cost and conflict-mineral flags — not `sr()`-seeded. Its documented gap (§7 flag) is methodological: the code never multiplies mass × emission factor at runtime (each component carries a pre-baked absolute `carbon_g`), and carbon is bucketed per material, never per life-cycle stage — so the guide's ISO 14067 `PCF = Σ(mᵢ × EFᵢ)` across cradle-to-grave stages, and the "Manufacturing 62%" hotspot claim, are unimplemented. Evolution A builds the calculation the page describes: a backend PCF engine computing component footprints from mass and a stage-tagged emission-factor table, enabling user-defined BOMs.

**How.** (1) `api/v1/routes/product_anatomy.py` with `POST /pcf` (BOM in, per-component and per-stage footprint out) and `GET /emission-factors` (a seeded `ref_material_emission_factors` table — material × process stage × EF, sourced from public LCA datasets and reconciled against the existing 30 teardowns as validation cases). (2) Each component gains a `stage` field (Raw Materials / Manufacturing / Use / EoL) so hotspot attribution is by stage as the guide claims. (3) The externality constants ($0.05/kg carbon — well below social-cost-of-carbon, as §7.2 notes) become user-visible parameters defaulting to a cited SCC value.

**Prerequisites.** EF dataset licensing checked (public sources: e.g. published LCA studies; no ecoinvent assumption); the 30 curated teardowns retained as bench fixtures. **Acceptance:** engine PCF for the smartphone teardown reproduces the curated total within a documented tolerance, and per-stage shares sum to 100%.

### 9.2 Evolution B — Design-for-carbon copilot over the teardown library (LLM tier 2)

**What.** Product teams' real question is comparative and material-level: "what happens to PCF and the ESG risk score if we swap the cobalt cathode for LFP?", "which components drive both carbon and child-labour risk?". Evolution B answers these as tool calls: substitution what-ifs run `POST /pcf` with the modified BOM; risk questions read the module's cost-weighted ESG score and per-component flags (Cobalt 85 "Critical DRC" style data already curated).

**How.** Tier-2 tool schemas over the Evolution-A endpoints plus a `GET /products/{id}` for the teardown library; system prompt grounded in this Atlas record's formulas (cost-weighted ESG score, the 0.4/0.3/0.3 circularity composite) so the copilot explains score movements mechanically. Substitution suggestions must come from the EF table's material list, each carrying its EF provenance; the no-fabrication validator checks every gram and dollar. The first slice can ship tier 1 (explain the current teardown) before the engine, since the curated data is real — unlike most B-tier siblings, narrating this page is legitimate today.

**Prerequisites.** Evolution A for substitution math; the EF table populated for at least the materials appearing in the 30 teardowns. **Acceptance:** a swap scenario's PCF delta equals the difference of two `/pcf` tool responses, and the copilot flags when a suggested substitute lacks an EF entry instead of estimating one.
