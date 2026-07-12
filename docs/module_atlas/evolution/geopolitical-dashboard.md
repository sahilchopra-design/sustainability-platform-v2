## 9 · Future Evolution

### 9.1 Evolution A — Actually wire the dashboard to CV1–CV5 and a live alert feed (analytics ladder: rung 1 → 2)

**What.** §7 describes a presentation-layer aggregator: a risk heatmap, top-10 exposure table, and three dated alert feeds (sanctions/mineral/conflict) plus a board-report tab, whose only computation is colour-bucketing heatmap cells. Critically, §7.5 flags that the guide's "Aggregates outputs from EP-CV1 through CV5" is an intended data flow the code does not wire — the heatmap re-hardcodes CV1's country scores as literals that will drift from the live index, alert dates are hand-authored (not from OFAC/ACLED/USGS feeds), and `exposure_pct` reconciles to no real portfolio. Evolution A makes the aggregation real: import the composite scores from `geopolitical-risk-index` (CV1) rather than copying them, compute top-10 exposures from the actual portfolio holdings, and back the three alert feeds with real ingestion.

**How.** (1) The heatmap reads CV1's `computeScore` output live, so weight changes propagate. (2) Top-10 exposures computed from `portfolios_pg` holdings × country geo-scores. (3) Alert feeds wired to real sources — OFAC SDN/EU sanctions lists, ACLED/UCDP conflict events, USGS/IEA critical-mineral disruptions — via ingesters with de-duplication, replacing the static snapshots.

**Prerequisites.** CV1 exposing its scored output as an importable/endpoint source; alert ingestion jobs (the platform's ingester scaffold); a real portfolio to compute exposures against. **Acceptance:** changing CV1 dimension weights changes the dashboard heatmap; top-10 exposures reconcile to portfolio holdings; alerts carry ingestion timestamps and source IDs, not hand-authored dates.

### 9.2 Evolution B — Executive geopolitical-brief orchestrator (LLM tier 3)

**What.** The Board Report tab is the natural tier-3 surface: "prepare this month's geopolitical risk brief" routes across the CV-sprint modules (CV1 index, sanctions/mineral/conflict alerts, the geo-transition nexus) and drafts an executive narrative with each exposure and alert tool-sourced and cited.

**How.** Routing knowledge from the atlas interconnection graph and `module_tags.json` geopolitical grouping per the roadmap Tier-3 pattern; output renders through the report-studio layer. The orchestrator pulls top exposures from the Evolution A aggregation, the latest ingested alerts, and CV1 rankings, composing them into the board narrative with a "show work" expander listing every source module call.

**Prerequisites.** Evolution A (an orchestrator over hardcoded literals would launder stale data into board papers); tier-2 copilots proven on CV1 and the alert modules first. **Acceptance:** a generated brief's every score and alert traces to a named source-module call in the trace log; regenerating after a CV1 weight change or a new sanctions designation updates only the affected sections.
