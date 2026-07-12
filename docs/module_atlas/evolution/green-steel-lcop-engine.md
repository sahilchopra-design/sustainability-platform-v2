## 9 · Future Evolution

### 9.1 Evolution A — Compute LCOP from capital and operating fundamentals (analytics ladder: rung 1 → 2)

**What.** §7 documents that the module's single live formula (`routeWithCarbon`) adds three price-driven overlays (carbon, energy, green-premium) to a fixed base LCOP per route rather than computing levelised cost from fundamentals — the guide's `LCOP = (CAPEX×CRF + OPEX + Feedstock + Energy)/Annual_Output + CBAM_exposure − Green_premium` is only partially realised, and the 22-project pipeline (LCOP scatter, capacity, country, status) is entirely `sr()`-seeded; only the 6 route archetypes (BF-BOF, DRI-EAF-NG, DRI-EAF-H₂, EAF-Scrap, Molten Oxide Electrolysis, HIsarna+CCS) carry externally-anchored parameters (§8 marked "not yet implemented"). Evolution A builds the true LCOP model: compute levelised cost per route from capex × CRF, opex, feedstock (iron ore/scrap/DRI pellets), and energy (electricity/H₂/NG) fundamentals, so the H₂ break-even price and carbon-price sensitivity emerge from real cost structure rather than overlays on a fixed base.

**How.** (1) A route-level LCOP built from capex/CRF + opex + feedstock + energy per the §5 formula, with CBAM certificate exposure from the route's carbon intensity × carbon price. (2) The H₂ break-even calculator solves the H₂ price where DRI-EAF-H₂ LCOP equals BF-BOF (a computed crossover). (3) The 22-project pipeline sourced from a real green-steel project database, replacing the seeded scatter.

**Prerequisites.** Per-route capex/opex/feedstock/energy-intensity parameters (the 6 archetypes are already anchored — extend to full cost build-up); a project database; the seeded pipeline replaced. **Acceptance:** LCOP recomputes from fundamentals reproducing §5 (not overlays on a fixed base); the H₂ break-even is a solved crossover; CBAM exposure derives from route carbon intensity; no `sr()` project feeds the scatter.

### 9.2 Evolution B — Green-steel cost-competitiveness copilot (LLM tier 1 → 2)

**What.** A copilot for steel-sector investors and offtakers: "at $3/kg green H₂ and €90/t CBAM, which route has the lowest LCOP, and what H₂ price makes DRI-EAF-H₂ beat BF-BOF?" narrates the 6-route comparison from the atlas corpus, with tier-2 computing LCOP, CBAM exposure, and H₂ break-even via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (the 6 route archetypes with anchored parameters, CBAM exposure, H₂ break-even, carbon-price sensitivity). Because the route parameters are externally anchored, an explainer over rendered comparisons ships early; the tier-2 upgrade computes fundamentals-based LCOP and the H₂ break-even goal-seek. Guardrail: the 22-project pipeline is seeded, so it must refuse project-specific claims. Every $/t figure validated against tool output.

**Prerequisites.** Evolution A for fundamentals-based LCOP; corpus embedding. **Acceptance:** post-Evolution-A, every LCOP and break-even figure traces to a tool call reproducing the fundamentals; the H₂ break-even solves the crossover; project-pipeline questions are declined until sourced.
