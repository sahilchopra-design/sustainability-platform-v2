## 9 · Future Evolution

### 9.1 Evolution A — Physically-derived cost chain and endogenous stranding risk (analytics ladder: rung 1 → 2)

**What.** The page's calculator already has scenario levers (carbon-price and fuel-price sliders) but §7.6 shows the math under them is not physical: `annualCarbonCost = carbonIntensity × fleetSize × carbonPrice × 0.001` and `fuelCostPerVessel = fuelPrice × eexi × 0.1` use unsourced scaling constants instead of a unit-consistent chain, `avgCII` treats the A–E scale as evenly spaced (IMO's real bands are non-linear and vessel-type-specific), and `stranded2030Risk` is an independent random draw despite the fleet's age, CII rating, and green-fuel-readiness sitting in the same record. Evolution A rebuilds the calculator on the physical chain and makes stranding risk a function of the module's own fields.

**How.** (1) Cost chain: fuel consumption (t/day, per ship type) × sailing days × fuel EF (tCO₂/t fuel, per `FUEL_TYPES`) → annual tCO₂ × carbon price; fuel cost = consumption × $/t. The sibling module `shipping-decarbonization-finance` already implements the genuine IMO CII formula (`attainedAER/referenceAER×100` per MEPC.354(78)) — port it here and replace the ordinal-average `avgCII` with reference-line ratios. (2) `stranded2030Risk = f(CII rating trajectory under the tightening Z-factor, fuel type, greenFuelReadiness)` — deterministic, explainable, and testable. (3) Keep the sliders; add IMO-strategy scenario presets (2030 checkpoint, 2040 indicative, levy on/off).

**Prerequisites.** Per-ship-type consumption and EF reference rows (DNV/IMO Fourth GHG Study values, citable); coordination with the sibling to share the CII helper rather than fork it. **Acceptance:** carbon-cost output is reproducible by hand from the stated unit chain; two fleets identical except CII rating get different stranding risk.

### 9.2 Evolution B — Fleet-transition copilot for ship-finance teams (LLM tier 1)

**What.** A copilot answering the Poseidon Principles questions this page is aimed at: "why is this fleet's CII trajectory misaligned?", "what does a $150 levy do to my tanker book?", "which retrofit options move a D-rated fleet to C?" — grounded in the page's computed state (post-Evolution-A: real CII ratios, derived stranding risk, scenario outputs) and this Atlas record's framework notes (IMO MEPC 79/80, EEXI, the five fuel pathways).

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/shipping-decarbonisation/ask`, corpus = this Atlas page plus live calculator state. What-if requests re-run the deterministic calculator with the requested slider values and narrate the delta — the LLM changes inputs, never invents outputs. Retrofit suggestions are constrained to the `FUEL_TYPES`/readiness options the page models, with a refusal for vessel classes outside the six ship types covered.

**Prerequisites.** Evolution A's honest unit chain — narrating the current `×0.001`-scaled dollar figures would dignify order-of-magnitude placeholders as costings. **Acceptance:** every dollar figure in an answer matches a calculator run reproducible from the stated inputs; asking about a vessel type not in `SHIP_TYPES` yields a scoped refusal.
