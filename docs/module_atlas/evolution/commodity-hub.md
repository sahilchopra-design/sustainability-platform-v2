## 9 · Future Evolution

### 9.1 Evolution A — Make the composite a composite (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: the advertised TCFD composite
`CommodityRisk = w₁·PriceVol + w₂·SupplyDisruption + w₃·CarbonIntensity` is not
computed — `compositeRisk = 20 + seed(s·73)·60` is a single random draw, and all ~25
per-company metrics (externality cost, lifecycle GHG, CBAM exposure, ML confidence)
are independent PRNG draws. The hub's genuinely useful assets are its curated
reference tables (`CRITICAL_MINERALS`, `CARBON_MKTS`, `REGS`) and its registry of 21
child commodity modules. Evolution A builds the real composite from inputs the
platform already computes elsewhere, making the hub an aggregator instead of a
generator.

**How.** (1) PriceVol: 90-day realised vol from the EIA price series ingested for the
energy modules (wave 1). (2) SupplyDisruption: production-region concentration from
the curated `CRITICAL_MINERALS` supply-concentration fields plus hazard exposure from
the digital-twin composite scores of producing regions. (3) CarbonIntensity: the
per-commodity tCO₂e/tonne factors already living in the refdata emission-factor layer
(GHG Protocol Scope 3 Cat 1 basis, as the guide intends). (4) Documented default
weights w₁/w₂/w₃ with a UI override; delete every `seed()` company metric — portfolio
figures should come from actual holdings joined to commodity exposures, or display
honest empty states until a portfolio is loaded.

**Prerequisites (hard).** Full PRNG purge — this page is one of the heavier
fabrication surfaces in the slice (~25 seeded metrics/company); commodity exposure
mapping for portfolio companies must exist before company-level scores can be honest.
**Acceptance:** the composite decomposes into three cited sub-scores in the UI;
deleting the PRNG helpers breaks nothing rendered; a commodity's composite changes
when its underlying EIA vol series updates.

### 9.2 Evolution B — Commodity desk orchestrator across the 21 child modules (LLM tier 3)

**What.** The hub already holds a curated `MODULES` registry linking 21 specialist
commodity pages — it is architecturally the desk entry-point the roadmap's tier 3
describes. Evolution B makes it operational: "assess our copper exposure" routes to
`critical-minerals` for supply concentration, `commodity-derivatives-climate` for
hedging cost, `commodity-deforestation` for nature risk where relevant, and returns a
synthesized commodity risk memo with per-module citations — the hub's TCFD-export
promise fulfilled by composition rather than by a single page's seeds.

**How.** Routing knowledge per the roadmap: `module_tags.json` plus this hub's own
`MODULES` registry as the authoritative child list; each hop calls child-module
endpoints where they exist (several children are tier-B and contribute reference
context rather than computations — the orchestrator must distinguish, using each
child's Atlas provenance classes). Output renders through the report-studio layer as
the TCFD commodity-risk section. Every numeric carries its source module and endpoint.

**Prerequisites (hard).** Evolution A (the hub cannot orchestrate honestly while its
own composite is a random number); child-module endpoint coverage is uneven — the
orchestrator needs the Atlas endpoint map to know which children are callable versus
display-only. **Acceptance:** a copper memo whose every figure names its source
module; children without backends contribute only labelled reference facts; the
orchestrator refuses commodities absent from the registry.
