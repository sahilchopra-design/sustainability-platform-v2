## 9 · Future Evolution

### 9.1 Evolution A — Live fleet data and a real uranium price model (analytics ladder: rung 1 → 3)

**What.** §7 is candid: this module is a curated market almanac, not a calculation engine — nine static reference tables (`GLOBAL_FLEET`, `NEW_BUILD`, `EXPORT_MARKETS`, `VENDORS`, `COP28_COMMITMENTS`, `FINANCING`) carrying genuinely accurate real-world data (USA 93 reactors/95.5 GW, France 56/61.4 GW, the real COP28 triple-nuclear declaration 372→600 GW), but the guide's "Uranium Spot Price Model" (`Spot = Supply–Demand + Speculative Premium + Policy Shift`) is descriptive framing with no implemented calculation. Evolution A makes the almanac live and builds the one real model the guide names.

**How.** (1) Refresh the fleet tables from IAEA PRIS (named in §5) on a schedule rather than hand-maintaining — PRIS publishes machine-readable reactor status; a small ingester keeps `GLOBAL_FLEET`/`NEW_BUILD` current and dated, eliminating staleness. (2) Implement the supply-demand uranium balance as an actual model: reactor requirements (from the fleet data) vs mine + secondary supply, producing a structural balance the speculative/policy premia adjust — the price series that today lives only in `nuclear-fuel-cycle` should be shared, not duplicated. (3) Score `EXPORT_MARKETS` risk (currently a qualitative Low/Medium/High label) from real indicators — political-risk, financing-availability, grid-readiness — rather than hand assignment.

**Prerequisites.** IAEA PRIS ingestion; uranium supply data (WNA Nuclear Fuel Report, UxC — the latter is subscription-gated, so scope the balance to public WNA figures); the market-intelligence and fuel-cycle modules should share one uranium price source. **Acceptance:** fleet figures update from PRIS without code edits; the uranium balance responds to a fleet-growth change; export-market risk derives from named indicators.

### 9.2 Evolution B — Nuclear-market-briefing copilot (LLM tier 1 → 2)

**What.** A copilot for the analyst users §1 targets: "summarise the global new-build pipeline and its cost overruns", "which vendors dominate export markets?", "what did COP28 commit on nuclear capacity?", "compare Poland and Saudi Arabia as emerging nuclear markets" — grounded in the module's genuinely accurate reference tables and the IAEA PRIS / WNA references named in §5.

**How.** Tier 1 is strong immediately because the underlying data is real and factual: system prompt from this Atlas page plus the serialized fleet/new-build/vendor/COP28 tables; the copilot answers market-structure and project questions with citations to specific rows (Hinkley $46bn, Vogtle $35bn, Rosatom 28% export share — all real per §7.1). Tier 2, post-Evolution-A: tool calls against the live PRIS-refreshed tables and the uranium balance model for current figures, with the fabrication validator matching quoted GW/counts/prices to data. The copilot must date its fleet figures (PRIS vintage) and refuse forward price predictions the structural model does not produce.

**Prerequisites.** Tier 1 works on current curated data but must disclose the as-of date; live figures and price answers need Evolution A. **Acceptance:** every fleet/project statistic cites a table row and vintage; uranium-balance answers (post-Evolution-A) trace to the model; refusal on speculative spot-price forecasts.
