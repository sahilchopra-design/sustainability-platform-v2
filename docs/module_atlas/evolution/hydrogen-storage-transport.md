## 9 · Future Evolution

### 9.1 Evolution A — Corridor delivered-LCOH with voyage-integrated losses (analytics ladder: rung 2 → 3)

**What.** §7 rates the engineering core genuine — correct H₂ physical constants, real capex annuitisation for pipelines/terminals, a defensible `STORAGE_MODES` table matching IEA/DNV ranges. The gaps it lists: the per-corridor delivered-cost stack embeds ~$2.5–4.5/kg of `sr()`-seeded production cost plus a seeded storage term; boil-off is a static %/day never integrated over voyage duration; shipping is linear in distance with no vessel-size economies; and the LOHC dehydrogenation heat (320°C, 180 kWh/tH₂) is described but not costed. Evolution A completes the chain: production cost per corridor origin from the shared engine's `calculate_lcoh` with `ref/country-costs` electricity (Chile and Norway then differ for a computed reason), boil-off compounded over `distKm / vessel_speed` days, and LOHC/NH₃ reconversion costed from the page's own `lohcCycleData` energy steps × heat price.

**How.** (1) New endpoint `POST /hydrogen/corridor-cost` in `api/v1/routes/hydrogen.py` returning the full stack {production, conversion, storage, shipping (with voyage losses), reconversion, regas} per corridor and mode. (2) The 8 real corridors' hand-tagged LCOH-transport figures (Chile–EU $1.20/kg, Norway–EU $0.18/kg) become calibration targets — computed values must land within tolerance of the DNV-sourced tags. (3) The `sr()` terms in `stackData` deleted. Engine changes are additive (5-module blast radius per §6).

**Prerequisites.** Heat-price and vessel-parameter assumptions documented; sibling-module regression before the shared-engine merge. **Acceptance:** the §7.4 Norway pipeline example (€0.14/kg) still reproduces; the corridor stack contains zero seeded terms and its transport components reconcile to the corridor tags.

### 9.2 Evolution B — Export-corridor analyst over the storage/transport engines (LLM tier 2)

**What.** A tool-calling analyst for infrastructure investors and exporters: "cheapest way to move 2 Mtpa from Australia to Korea — NH₃ ship or nothing?", "at what distance does pipeline lose to shipping for a 1 m line?", "what does salt-cavern storage do to my delivered cost vs LH₂ tanks?" The module's sliders (diameter, flow, terminal capacity, load factor) already parameterise these questions; tier 2 turns them into conversational sweeps.

**How.** Tool schemas over the Evolution A `/corridor-cost` route plus the existing hydrogen route family; system prompt grounded in this page's §7.2 mode table (round-trip efficiencies, TRLs, boil-off rates) and the §5 rule-of-thumb (NH₃ wins >3,000 km, pipeline repurposing cuts 50–70%) so qualitative guidance cites curated data. Crossover questions ("pipeline vs ship break-even distance") run as bisection over tool calls with the bracket shown. The analyst must distinguish engineering-grade outputs (pipeline/terminal annuities) from screening-grade ones (until Evolution A lands, the delivered totals carry the synthetic-production caveat from §7.5).

**Prerequisites.** Phase 2 tool-calling; Evolution A for delivered-cost questions without caveats. **Acceptance:** every €/kg figure traces to a tool call; mode recommendations cite the specific constraint (TRL, boil-off, round-trip η) from the `STORAGE_MODES` row rather than generic reasoning.
