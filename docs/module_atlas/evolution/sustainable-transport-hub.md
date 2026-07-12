## 9 · Future Evolution

### 9.1 Evolution A — Real modal carbon-intensity engine under the hub dashboard (analytics ladder: rung 1 → 2)

**What.** The §7 flag is unambiguous: the guide's `Modal_CI = Lifecycle_GHG / passenger_km` is never computed — each of the 200 synthetic assets carries an `sr()`-seeded, unitless `intensity` (10–190), and `decarbScore` is independent noise that can contradict the same asset's CORSIA flag or CII rating (§7.4). Evolution A gives this tier-B, frontend-only hub its first real calculation layer: published modal CI factors, a computed CII, and internally consistent scoring.

**How.** (1) Seed ITF/OECD and UK DEFRA/BEIS well-to-wheel modal emission factors (gCO₂e/pkm and gCO₂e/tkm, free reference data) as a refdata table; `intensity` becomes a labelled lookup by mode × subsector instead of noise. (2) Compute maritime CII from the IMO formula (annual CO₂ / (capacity × distance)) with the real A–E boundary tables, so an asset's CII rating derives from its emissions and activity fields rather than being directly `sr()`-assigned. (3) Make `decarbScore` a documented function of CII/CORSIA/SAF-usage/EV-penetration inputs, eliminating the contradiction class. (4) Fix the two documented code defects: the hard-coded `$50.2bn` Board Report figure (compute from `Σ investmentExp`) and the dead identical branches in `val()`.

**Prerequisites.** Asset activity data (distance, tonnage) must be added to the synthetic generator or replaced with a seeded demo fleet — CI needs a denominator. **Acceptance:** a CORSIA-non-compliant asset can no longer outscore a compliant peer on `decarbScore` all else equal; Board Report portfolio value tracks the live asset sum; each `intensity` cell carries a unit and factor citation.

### 9.2 Evolution B — Cross-modal fleet-strategy copilot (LLM tier 1)

**What.** A copilot on the Executive Dashboard answering questions the four tabs already visualize — "which mode is furthest behind its decarbonisation target and why?", "summarise the critical alerts for the board pack" — grounded in the page's computed aggregates (`modePerformance`, `stageCounts`, the mode targets 50/45/40/35/30) and the regulatory context in this Atlas page (IMO 2023 strategy, CORSIA, FuelEU Maritime, EU 2035 ICE ban).

**How.** Tier 1 per the roadmap pattern: corpus = this Atlas record plus the live page state (the module has no backend endpoints to tool-call — its EP code is None, so tier 2 has nothing to bind to until Evolution A ships a route). The copilot narrates gaps (`avgDecarb − target` per mode), drafts the Board Report section text from computed values instead of the current static template strings, and answers framework questions ("what does a CII rating of D trigger?") from the standards corpus with citations. It must disclose the synthetic provenance of asset figures when asked about named companies (Maersk, DHL et al. carry fabricated values per §7.6).

**Prerequisites.** Alert generation should first be wired to actual asset fields (today the 25 alerts are statically authored, disconnected from the data they describe) — otherwise the copilot would summarise alerts that contradict the dashboard. **Acceptance:** board-summary drafts contain only numbers reproducible from the page's aggregate calculations; questions about real company disclosures get a synthetic-data disclaimer, not a fabricated answer.
