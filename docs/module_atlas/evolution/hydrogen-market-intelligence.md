## 9 · Future Evolution

### 9.1 Evolution A — Live project-pipeline ingestion and gas-linked grey pricing (analytics ladder: rung 2 → 3)

**What.** The module is honest curation-plus-interpolation: sector demand is a two-segment linear blend of IEA anchors scaled by a flat scenario multiplier (0.65/1.0/1.45), supply pathways are linear ramps (`green = 0.5 + i×4`), grey price carries cosmetic `sr(i·11)` noise, and the 8×5 geopolitical scorecard is hand-authored. §7.5 notes the flat multiplier means sector shares never change across scenarios. Evolution A grounds all four: ingest the IEA Hydrogen Projects Database (the §4.1 lineage already names it as the pipeline source without actually ingesting it) so the pipeline tracker and supply build-up derive from real announced/FID/construction capacity; replace the grey-price jitter with a gas-price-linked SMR cost model using the platform's existing EIA ingestion; source geo-risk from World Bank WGI percentiles as §7.5 itself suggests; and make scenario multipliers sector-specific (steel and transport diverge under policy scenarios, ammonia doesn't).

**How.** (1) A `h2_projects` reference table (country, technology, stage, MW, year) refreshed by a new ingester on the existing 19-ingester scaffold. (2) `supplyData` recomputed as stage-weighted pipeline conversion (the page's own §4.1 note — only ~5% of announced reaches FID — becomes an explicit conversion-rate parameter). (3) Grey $/kg = f(gas price, SMR efficiency, carbon price). (4) Calibration: 2023 demand anchors (ammonia 31 Mt, refining 42 Mt) pinned as regression checks.

**Prerequisites.** IEA database access (public download exists); the `sr()` grey-noise term removed. **Acceptance:** the pipeline tab shows real project counts by stage with vintage stamp; changing the FID-conversion assumption visibly moves 2030 green supply.

### 9.2 Evolution B — Market-intelligence copilot with sourced-claim discipline (LLM tier 1 → 2)

**What.** A copilot for energy ministries and investors: "why does industry dominate 2023 demand?", "which exporters can serve Japan below $3/kg landed?", "what's Chile's geopolitical score based on?" Market-intelligence Q&A is the natural LLM fit here because the module's value is curated narrative — the `EXPORTERS` advantages, `VALLEYS` investments, importer strategies — which is text an LLM can ground on directly.

**How.** Tier 1: this Atlas page plus the seed tables embedded in `llm_corpus_chunks`; the scenario toggle and selected year pass as context so "demand in 2035" reads the interpolated matrix actually rendered. Two discipline rules from §7.5: geo-risk answers must state the scorecard is expert judgement, not a derived index (until Evolution A rebases it on WGI); scenario answers must note the flat-multiplier limitation when asked about sector divergence. Tier 2 adds tool calls to the live-but-unused route family (`/demand-sector`, `/cost-trajectory` — both `skipped` in the lineage sweep) for quantitative what-ifs like "abatement economics of switching Japanese refining demand to green H₂ at $2.80/kg."

**Prerequisites.** Copilot infrastructure (Phase 1); tier 2 needs only the existing hydrogen routes. **Acceptance:** every Mt/$-figure cites either a seed-table cell or a logged tool call; geo-score answers carry the provenance disclaimer verbatim.
