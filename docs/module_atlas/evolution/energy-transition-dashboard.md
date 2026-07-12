## 9 · Future Evolution

### 9.1 Evolution A — Executive KPIs computed from the sibling verticals, not authored tables (analytics ladder: rung 1 → 2)

**What.** The module is tier-A on paper — it shares the real `generation_transition` and `grid_ef_trajectory` engines (9 endpoints, ref data lineage-`passed`) — but the page renders authored seed tables: `ASSET_SCORES` (12 rows), `DECARB_PATHWAY` (9 hand-set actual-vs-NZE points), `PEERS` ranks, and a radar for "DemoCo," with exactly one computed value (the count-weighted `aggregateScore`). The executive dashboard is a mock over a genuine engine family. Evolution A computes each tile from its owning vertical.

**How.** (1) Portfolio CI and asset scores from `energy-asset-registry`'s real rows (its stated formula — output-weighted CI over the fleet — matches this page's §4 claim, so wire it rather than restate it). (2) Decarbonization pathway: actuals from the registry's emissions history, NZE line from `GET /ref/nze-milestones` + `_interpolate_nze` — the engine that already exists for exactly this chart. (3) Supplier risk tile from `energy-supplier-network`'s Evolution-A records; peer ranking from `energy-revenue-split`'s filings-based peer table (one peer dataset platform-wide, not three divergent editorial ones). (4) Rung 2: the dashboard gains a scenario toggle — NZE/APS/STEPS pathway comparison via `POST /grid-ef-projection` — making the "actual vs target" gap scenario-aware.

**Prerequisites.** The sibling modules' Evolutions A (registry, supplier network, revenue split) — this dashboard is pure downstream and should be sequenced last in the CU-family remediation. **Acceptance:** every KPI tile traces to a named sibling endpoint in a lineage sweep; deleting the five authored seed tables breaks nothing; the pathway chart's NZE line matches `ref/nze-milestones` interpolation.

### 9.2 Evolution B — Executive briefing copilot over live tiles (LLM tier 1)

**What.** An executive dashboard's LLM need is narrative: "summarize our transition position for the board — where are we vs NZE, what moved this quarter, what's the biggest supplier risk?" A tier-1 copilot answers from the dashboard-summary payload assembled in Evolution A, citing each figure's owning module ("portfolio CI 412 tCO₂/GWh, from the asset registry's output-weighted mean") and drafting the two-paragraph board note — explanation and composition only, no new computation.

**How.** Tier-1 RAG per the roadmap: this Atlas record plus the sibling modules' §5 formula summaries embedded as corpus (the copilot must explain *whose* methodology produced each tile); the live dashboard payload passed as structured context. Because every tile now has a provenance edge, the copilot's citations are checkable mechanically — the answer's module attributions must match the payload's source fields. Refusal path: forward-looking questions ("will we hit the 2030 target?") get the pathway-gap arithmetic and an honest "the module projects scenarios, it does not forecast compliance."

**Prerequisites (hard).** Evolution A — narrating the current authored tables would brief executives on a fictional company's fictional progress with real confidence. **Acceptance:** golden board-note draft cites every figure with its correct owning module; numbers match the payload exactly; the NZE-gap explanation reproduces the interpolation arithmetic.
