## 9 · Future Evolution

### 9.1 Evolution A — Compute the missing NexusStress/CascadeRisk composite (analytics ladder: rung 1 → 2)

**What.** The module presents nexus *components* — 20 basins with `waterStress`,
`foodCalorieRisk`, `energyForWater` — but §7's flag confirms neither headline formula
(`NexusStress = w_W×Water + w_F×Food + w_E×Energy`,
`CascadeRisk = max(...) × CorrelationCoeff`) exists in code; §7.4 notes users must
mentally combine the three fields themselves. Evolution A implements both, with the
inputs made real: `waterStress` joined from the WRI Aqueduct data already wired into
the sibling `water-risk-analytics` module (the basins overlap heavily — Indus, Nile,
Mekong, Murray-Darling), `foodCalorieRisk` proxied from FAO import-dependency
indicators, and the SSP deltas re-sourced from the IIASA SSP database instead of
author-estimated constants. It also fixes the documented scale inconsistency —
`STRESS_SCENARIOS.water` reaches 7.4 against a basin scale that tops out at 5 —
by normalising both to a common 0–100 basis before any cross-referencing.

**How.** A `GET /api/v1/nexus/basins` route (module is Tier B, EP-DG5) serving the
joined per-basin records plus computed NexusStress/CascadeRisk per scenario; the
Nexus Risk tab renders the composite ranking; adaptation measures gain basin
applicability weights so `adaptData` stops being identical regardless of filter
(§7.3's observation).

**Prerequisites.** Weight vector (w_W/w_F/w_E) and correlation coefficient documented
with rationale — uncited weights would reproduce the platform's old habits; Aqueduct
basin-name mapping. **Acceptance:** each basin shows one composite score that moves
when the SSP scenario changes; Combined Stress no longer exceeds the displayed scale;
the same drought filter changes the adaptation tab's ranking.

### 9.2 Evolution B — Sovereign-desk nexus briefing copilot (LLM tier 1 → 2)

**What.** The module's stated audience is sovereign debt analysts assessing political-
stability risk in water/food-stressed markets — a briefing-note workflow. Evolution B
drafts basin/country nexus briefs: "brief me on Tigris-Euphrates under SSP3-7.0 —
which system fails first and what are the SDG 2/6/7 gaps?" Tier-1 first: grounded in
this Atlas page and current page state, with the honest caveat that basin fields are
synthetic until Evolution A lands. Tier-2 then adds `GET /basins` as the single
read-only tool, so the brief's NexusStress and CascadeRisk figures are computed, and
the copilot can compare basins ("rank my sovereign portfolio's five basins by cascade
risk under +2°C").

**How.** Standard copilot stack (`llm_corpus_chunks`, per-module system prompt from
§5/§7); the prompt encodes §7.2's provenance table — including the genuinely useful
nuance that desalination/wastewater-reuse measures carry negative energySave — so
briefs reflect the module's real content, not generic nexus talking points.

**Prerequisites.** pgvector corpus; Evolution A for any numeric claims (tier-1 output
is qualitative until then). **Acceptance:** every score in a brief traces to page
state or the basins endpoint; asked which system "fails first," the answer cites the
max-component logic of CascadeRisk rather than free-form speculation; out-of-coverage
basins get a refusal naming the 20 covered ones.
