## 9 · Future Evolution

### 9.1 Evolution A — Live KPI aggregation from sibling modules replacing hard-coded cards (analytics ladder: rung 1 → 2)

**What.** §7 flags two defects precisely: the "Portfolio Transition Score" is an unweighted mean despite the guide's exposure-weighted formula, and five of six executive KPIs (WACI 142, GAR 34.2%, Capital Adequacy 14.8%, Engagement 72%, all QoQ/YoY trend arrows) are hard-coded display strings; the "Climate VaR (95%)" is a flat 6.8% scalar mislabeled as a percentile. Evolution A makes this dashboard what its §5 methodology claims — a multi-module KPI aggregator: score becomes exposure-weighted, and WACI/GAR/capital KPIs are read from the sibling CT/DW modules' Evolution-A endpoints (`fi-net-zero-pathways` for WACI, `fi-taxonomy-pcaf-bridge` for GAR, `fi-regulatory-capital-overlay` for the capital stack) rather than typed in.

**How.** (1) Fix `AVG_SCORE` to `Σ(score·exposure)/Σexposure`. (2) A thin `/fi-dashboard/kpis` route that fans out to the sibling engines over the shared FI loan tape and returns each KPI with source-module provenance. (3) Trend arrows computed from stored KPI snapshots (a `fi_kpi_history` table written on each refresh) instead of hard-coded strings; the VaR card either gets a real percentile from the instrument-exposure evolution or is relabeled honestly as a stress haircut.

**Prerequisites.** The sibling FI modules' backend verticals (this dashboard is downstream by design); shared demo loan tape (D0). **Acceptance:** every KPI card displays a source-module badge and its value matches that module's API for the same book; no hard-coded KPI constants remain in the page source.

### 9.2 Evolution B — Board-report drafting orchestrator (LLM tier 3)

**What.** The Board Report tab already gestures at the right product: an executive summary across the FI desk. Evolution B makes it the FI desk's tier-3 orchestration surface — "prepare the Q3 board climate report" routes across the sibling modules (portfolio score and watchlist from fi-client-portfolio-analyzer, concentration breaches from fi-concentration-monitor, NZBA gaps from fi-net-zero-pathways, capital headroom from fi-regulatory-capital-overlay) and drafts a board-ready narrative with each figure tool-sourced and cited.

**How.** Routing knowledge comes from the atlas interconnection graph and `module_tags.json` FI grouping per the roadmap Tier-3 pattern; output renders through the report-studio layer. The `pipeline` action tracker (currently hard-coded demo items) becomes real: the orchestrator reads open actions from a persisted table and reports completion. Each report section carries a "show work" expander listing the tool calls behind it.

**Prerequisites.** Evolution A plus at least three sibling Evolution-A verticals live (an orchestrator over hard-coded strings would launder fabrication into board papers); tier-2 copilots proven on the individual modules first. **Acceptance:** a generated board report's every number is traceable to a named sibling-module endpoint call in the trace log, and regenerating after a loan-tape edit changes the affected sections only.
