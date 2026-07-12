## 9 · Future Evolution

### 9.1 Evolution A — Carbon-price scenarios over a live-refreshed PACE dataset (analytics ladder: rung 1 → 2)

**What.** This tier-B page is a cut above its `sr()`-seeded siblings — the 6-sector PACE data is hand-curated, internally consistent, and directionally correct (§7.6) — but it is static (updating requires editing the `SECTORS` array), the `paceComposite` is an uncited equal-25% average, and the MAC-curve cumulative sum trusts input ordering rather than sorting by cost (a latent correctness bug the deep-dive flags). Evolution A adds the scenario dimension the framework begs for: recompute Carbon Cost and Abatement pillars under user-selected carbon-price paths (NGFS scenario prices are already used elsewhere on the platform) and refresh the static anchors from live sources.

**How.** (1) Sort `abatement_curve` by `$/tCO₂` before the cumulative map — one-line fix, do it first. (2) Parameterise the MAC chart: measures below the scenario carbon price are "in the money"; the crossover point becomes a computed output per sector per scenario. (3) Replace hardcoded `sbti_aligned_pct` with the SBTi target-dashboard public export via a small refresh job, and emissions trajectories with IEA WEO sectoral series where licensing permits. (4) Make pillar weights explicit and user-adjustable with the equal-weight default labelled as convention, addressing the §7.6 caveat that no cited methodology assigns 25/25/25/25.

**Prerequisites.** SBTi export ingestion; a decision on IEA data licensing (fallback: keep curated values but stamp vintage + source per field). **Acceptance:** MAC cumulative totals are invariant to input array order; changing the carbon-price scenario visibly re-ranks in-the-money abatement measures.

### 9.2 Evolution B — Sector transition-brief writer (LLM tier 1)

**What.** The PACE scorecard's natural output is a written sector brief — "why does Utilities score 70.0 while Energy scores 65.0, and what does Energy's 3.8°C pathway imply for holdings?" Evolution B is a copilot that composes that brief strictly from the module's own data: the 4 pillar scores, SBTi alignment, stranded-risk rating, green/brown revenue split, and the MAC curve's cheapest remaining abatement options, cross-referenced against the IPCC AR6 WGIII measure taxonomy the curve already mirrors.

**How.** Tier-1 pattern: `POST /api/v1/copilot/sector-transition-scorecard/ask`, corpus = this Atlas record (§7.2 pillar table is the core grounding) plus live page state (selected sector and, post-Evolution-A, the active carbon-price scenario). Comparative questions ("rank sectors by abatement optionality") are answered by deterministic sorts the copilot narrates, not by LLM arithmetic. The brief template ends with the data-vintage stamp so readers know when the curated constants were last refreshed.

**Prerequisites.** None hard — the static data is honest enough to narrate today if every answer carries the "curated, not live" caveat from §7.6; Evolution A removes the need for that caveat. **Acceptance:** every figure in a generated brief appears in the `SECTORS` dataset or a computed sort of it; questions about sectors outside the 6 covered return a refusal naming the coverage limit.
