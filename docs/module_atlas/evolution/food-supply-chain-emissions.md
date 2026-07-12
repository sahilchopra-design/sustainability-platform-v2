## 9 · Future Evolution

### 9.1 Evolution A — Wire the imported emission factors into a real FLAG intensity (analytics ladder: rung 1 → 2)

**What.** §7 flags a precise defect: the guide's `FLAG_intensity = Σ(commodity_i × EF_i × LUC_multiplier_i)/Revenue_USD` is not computed — each company's `intensity` is a single `sr()`-seeded field, `totalEmissions`/`scope3Cat1`/land-use-change are independent random draws, and although the module imports `EMISSION_FACTORS` from `referenceData` it never uses them for the core maths. Evolution A closes exactly that loop: take commodity procurement volumes as input, multiply by the IPCC Tier-2 emission factors already imported, apply LUC multipliers for high-deforestation commodities (soy/palm/beef/cocoa/timber per Pendrill et al.), and normalise by revenue — producing a real FLAG intensity comparable to the SBTi sector benchmark.

**How.** (1) A commodity-procurement input model (supplier × commodity × volume) feeding the real `EMISSION_FACTORS` map. (2) LUC multipliers as a documented table keyed to commodity deforestation risk. (3) FLAG intensity and the SBTi target gap computed from these, replacing the seeded `intensity`; the stage split and Scope-3 share derived from the commodity mix rather than shaped random noise.

**Prerequisites.** The 60-company `genCompanies` panel replaced by real or user-entered procurement data (all §7-flagged synthetic); an LUC-multiplier reference (Pendrill attribution) in refdata. **Acceptance:** two companies with identical revenue but different commodity mixes produce different FLAG intensities reproducing the §5 formula from the imported EFs; no seeded `intensity` field feeds the headline.

### 9.2 Evolution B — FLAG target-setting and supplier-engagement copilot (LLM tier 2)

**What.** A copilot for food/beverage/retail sustainability teams: "what FLAG intensity target does SBTi imply for our dairy sourcing, and which suppliers should we engage first?" tool-calls the Evolution A intensity endpoint, ranks suppliers by emission contribution × data-quality (the supplier risk matrix the module already frames), and drafts the CSRD ESRS E1/E4 and CDP Forests disclosure narrative.

**How.** Tier-2 tool-calling over the FLAG intensity and supplier-ranking endpoints; the grounding corpus is §5/§7, which accurately encode SBTi FLAG v1.0, GHG Protocol Scope 3 Cat 1, EUDR deforestation-free commitments, and farm-stage LCA dominance. The copilot's value is translating a computed intensity gap into a prioritised supplier action list and disclosure-ready text, every tonne and intensity figure sourced from tool output and checked by the fabrication validator.

**Prerequisites.** Evolution A (no real intensities exist today); RBAC-scoped supplier data. **Acceptance:** every FLAG intensity, target, and supplier-contribution figure in the copilot's output traces to a tool call; asked for a commodity's exact emission factor, it returns the imported reference value, not an invented one.
