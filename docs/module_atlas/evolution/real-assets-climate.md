## 9 · Future Evolution

### 9.1 Evolution A — Implement the haircut identity by reusing platform engines (analytics ladder: rung 1 → 2)

**What.** §7 documents total disconnection between claim and code: the guide's `V_climate = V_base × (1 − δ_physical) × (1 − δ_transition)` exists nowhere — the 40 trophy assets (real building names as labels) carry 16 mutually independent `sr()` attributes, so `valuationM` bears zero mathematical relationship to the risk scores displayed beside it, stranding years are uniform draws rather than CRREM breach calculations, and the CRREM chart is a synthetic decay curve. Critically, the flag notes the fixes already exist on-platform: `real-estate-valuation` implements a genuine cap-rate climate haircut, and `re-portfolio-dashboard`'s backend engine does real CRREM pathway interpolation. Evolution A makes this module a consumer of those engines rather than a third implementation.

**How.** (1) Per asset, δ_transition from the `REPortfolioEngine` CRREM assessment (`POST /re-portfolio/crrem` — stranding year and carbon-cost drag from actual pathway files) and δ_physical from the digital-twin composite scorer at asset coordinates; `V_climate` computed by the guide's multiplicative identity, with both deltas' provenance in the payload. (2) The 40-asset demo book becomes an editable register with lat/lon and energy intensity (the inputs the engines need); real building names dropped or clearly flagged illustrative. (3) The infrastructure/agriculture asset types the RE engines don't cover get honest nulls with a documented scope note, not fabricated scores.

**Prerequisites.** Sibling engines' endpoints stable (dependency on `re-portfolio-dashboard` Evolution A wiring work); coordinates for register assets. **Acceptance:** raising an asset's energy intensity moves its stranding year and δ_transition in the same direction; assets outside engine scope show null haircuts, never random ones.

### 9.2 Evolution B — Cross-asset climate-screen copilot (LLM tier 2)

**What.** Once haircuts are real, the module's screen-and-prioritise workflow suits a copilot: "rank our logistics assets by climate-adjusted value loss and tell me which retrofit spends have positive NPV against their δ_transition", "summarize at-risk AUM under 1.5C vs 2C CRREM scenarios for the TCFD pack" — each a composition of tool calls to the valuation identity endpoint and the underlying CRREM/physical engines.

**How.** Tier-2 tool schemas over the Evolution-A endpoint plus the reused sibling engines (the Atlas interconnection map is the routing knowledge); the copilot's system prompt includes the module's scope note so infrastructure/agriculture questions get the documented "engine coverage does not extend here" response instead of an estimate. Retrofit-NPV answers use the register's `retrofitCostM` only after that field stops being a random draw — the prompt enumerates which register fields are user-supplied vs engine-derived, mirroring the §7.2 provenance table. Validator checks every $M and year against tool outputs.

**Prerequisites (hard).** Evolution A complete; field-provenance metadata exposed via the API so the copilot can distinguish user inputs from computed values. **Acceptance:** a prioritisation answer's ordering reproduces from the tool responses, and out-of-scope asset types are declined with the scope note cited.
