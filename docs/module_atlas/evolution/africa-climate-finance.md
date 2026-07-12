## 9 · Future Evolution

### 9.1 Evolution A — From editorial snapshot to ingested flows with country drill-down (analytics ladder: rung 1 → 2)

**What.** This is a six-tab descriptive dashboard (EP-CJ5): per §7.1 the only live
calculation is the adaptation-matrix gap filter — everything else renders hand-typed
2022–2024 editorial tables (which are at least internally consistent: 600M electrification
sum, $220B gap, $103B minerals all reconcile, and §7.5 confirms zero PRNG). Its honest
next step is the one §7.5 itself names: ingest OECD DAC CRS climate-marker flows and
CPI Global Landscape of Climate Finance data into real tables (`africa_finance_flows`
keyed by country/year/instrument/source), replacing the 5-row regional aggregates with
computed roll-ups and per-country drill-down, plus currency-year normalisation.

**How.** A new ingester following the platform's 19-ingester scaffold pulling the OECD
CRS bulk file (climate Rio markers) filtered to African recipients; `GET
/api/v1/africa-finance/flows?country=&year=` and `/adaptation-gaps` endpoints; the
received-vs-needed chart then computes `gap = need − Σ flows` at runtime instead of
shipping it pre-typed. Rung 2 arrives with the electrification-economics scenario the
guide already promises (`LCOE_minigrid vs LCOE_grid_extension per location`): a simple
two-parameter model (population density, grid distance) sweeping the crossover frontier.

**Prerequisites.** Fix the placeholder reference URLs (`url: '#'`) with real citations;
resolve the documented GCF-overlap inconsistency in the flows table during migration;
OECD CRS bulk download is keyless but large — needs the ingestion framework's chunked
loader. **Acceptance:** the 2023 received figure is computed from ingested CRS rows (and
documented where it diverges from the old $30B editorial figure); selecting Kenya shows
country-level flows; the mini-grid/grid crossover moves when grid distance changes.

### 9.2 Evolution B — Africa finance-gap copilot over the seed tables (LLM tier 1)

**What.** A chat panel answering "why is the adaptation gap biggest in infrastructure?"
($55B need vs $8.0B current, from `ADAPTATION_MATRIX`), "how insured was Cyclone Freddy?"
($0.02–0.8B against $3.2B losses — the protection-gap flag the page colours red), and
"where does the $103B minerals number come from?" (sum of `GREEN_MINERALS.investmentOpp`).
Grounded in this Atlas page and the seed tables; the copilot must state that figures are
editorial snapshots of mostly 2022–2024 vintage from the listed AfDB/IRENA/UNEP sources,
not live data — and flag staleness once Evolution A's ingested series exists to compare.

**How.** Tier-1 roadmap pattern: §7.2's data-anchor annotations (which already map each
headline to its source and vintage) are the ideal grounding corpus — embed them with the
seed tables into `llm_corpus_chunks`; serve via `POST
/api/v1/copilot/africa-climate-finance/ask` with the standard refusal path. Because the
module computes almost nothing, the copilot's value is navigation and sourcing, not
calculation narration; it should decline any request to project or extrapolate (e.g.
"what will the gap be in 2030?") until Evolution A's computed series exists.

**Prerequisites.** Atlas corpus embedded (roadmap D3); reference URLs fixed so citations
resolve. **Acceptance:** every figure cited matches a seed-table value with its vintage
stated; asking for a 2030 projection produces a refusal naming the module's
static-snapshot scope.
