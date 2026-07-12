## 9 · Future Evolution

### 9.1 Evolution A — Implement the WRI handprint identity with real reference products (analytics ladder: rung 1 → 2)

**What.** §7's flag is severe for a module whose entire purpose is a defensible avoided-emissions claim: the code's "baseline" is the product's own footprint times a random factor (`totalFootprint × (1.2 + sr()·0.8)`), so the handprint is fabricated by construction — there is no reference-product EF, no units sold, no use-phase differential, and the imported `GWP_VALUES, EMISSION_FACTORS` reference data goes unused. Evolution A implements the guide's actual formula, `HP = (EF_reference − EF_product) × units_sold × use_phase_factor`, over declared product pairs.

**How.** (1) Backend `api/v1/routes/carbon_handprint.py` with `POST /handprint` taking an explicit substitution scenario: product EF, named reference product EF (with source), units sold, lifetime/use-phase parameters — the WRI Scope-4 structure the §5 methodology already cites. (2) Wire the already-imported refdata emission factors into the product-side EF where BOM data exists (natural join with `product-anatomy`'s teardown library and its planned `/pcf` engine — the two modules should share the footprint layer, with this one owning the counterfactual). (3) Attribution factor becomes a documented input (contribution analysis per WRI guidance) instead of a seeded constant; the ISO_CHECKLIST (16 real items) becomes a gating rubric — no handprint reported until baseline-justification items are checked.

**Prerequisites.** The seeded product universe replaced or demo-flagged; reference-product EF sourcing convention agreed (every baseline must name its counterfactual and source). **Acceptance:** bench case (e.g. heat pump vs gas boiler) reproduces a hand-computed HP; setting reference EF = product EF yields exactly zero handprint — impossible in today's code where the multiplier guarantees a positive result.

### 9.2 Evolution B — Green-claims compliance copilot (LLM tier 1)

**What.** Handprint reporting is a greenwashing minefield; the module's highest-value LLM layer is a claims reviewer, not a number generator. The copilot takes a draft marketing or disclosure claim ("our product avoided 1.2 MtCO₂e in 2026") and audits it against the WRI Scope-4 guidance and the module's ISO checklist: is the baseline named and justified? Is attribution to this product defensible? Is handprint reported alongside footprint (the module's own documented convention)?

**How.** Tier-1 RAG over this Atlas record, the WRI comparative-emissions guidance and SolarPower Europe methodology named in §5, and the 16-item `ISO_CHECKLIST`; served via the standard copilot router. Post-Evolution-A, quantitative verification becomes a tool call to `POST /handprint` re-computing the claim from its stated inputs and diffing. The copilot's hard rule mirrors the platform's fabrication guardrail: it never estimates a handprint itself — it either verifies a computed one or lists what's missing. Before Evolution A it must state that on-page handprints are illustrative (§7 documents them as random-multiplier outputs).

**Prerequisites.** Guidance texts chunked; Evolution A for verification mode. **Acceptance:** the copilot flags a claim whose baseline is unnamed, and its verification numbers match `/handprint` output exactly.
