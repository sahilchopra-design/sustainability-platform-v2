## 9 · Future Evolution

### 9.1 Evolution A — Live pipeline data and calibrated readiness weights (analytics ladder: rung 1 → 2)

**What.** §7 confirms this is a curated real-data ranking tool: 21 hand-entered countries with 10 fields each (announced/operational NH₃ capacity, electrolyser pipeline GW, renewable-cost notes), attributed to IRENA/Hydrogen Council/IEA but not directly footnoted. The `Readiness = 0.30·RE_resource + 0.25·policy + 0.25·infrastructure + 0.20·financing` composite is a genuine weighted score over these editorial estimates. Evolution A moves it from static-curated to sourced-and-benchmarked: wire the pipeline capacity to a live project tracker, ground the RE-resource score in the platform's own NASA-POWER/renewable-resource data (wired in wave-1), and calibrate the readiness weights rather than asserting the 0.30/0.25/0.25/0.20 split.

**How.** (1) A backend table of green-ammonia projects (from IRENA/IEA project databases) so pipeline totals refresh rather than being hand-set. (2) The RE-resource sub-score computed from actual solar/wind resource data per country instead of a qualitative note. (3) Bilateral-deal and infrastructure-gap fields sourced with provenance badges. (4) Document the readiness weights per §8 rather than presenting them as given.

**Prerequisites.** A project-pipeline data source; renewable-resource data by country (available via the platform's climate feeds). **Acceptance:** country readiness scores recompute from sourced sub-scores reproducing the §5 weighting; pipeline totals carry source badges and refresh; the RE-resource axis derives from real resource data, not an editorial note.

### 9.2 Evolution B — Export-market intelligence copilot (LLM tier 1 → 2)

**What.** A copilot for project developers and offtake buyers: "which countries have the strongest green-ammonia export readiness for a 2030 Japan offtake, and where are the infrastructure gaps?" narrates the country rankings, bilateral-deal map, and readiness drivers from the atlas corpus, with tier-2 pulling live readiness scores and pipeline figures from the Evolution A endpoint.

**How.** Tier 1 is credible because §7 confirms the data is hand-curated to named public sources — the copilot cites real pipeline figures (Australia 35 Mt, Chile 20 Mt, Morocco 15 Mt) while flagging them as editorial estimates. Its value is cross-referencing exporter readiness against importer demand (linking to the offtake-markets sibling via the atlas interconnection graph). Tier 2 tool-calls the readiness endpoint so re-weighted rankings are computed.

**Prerequisites.** Corpus embedding; Evolution A for computed/sourced answers. **Acceptance:** every capacity and readiness figure cited traces to the curated table or (post-Evolution-A) the endpoint; the copilot labels pipeline numbers as editorial estimates until sourced.
