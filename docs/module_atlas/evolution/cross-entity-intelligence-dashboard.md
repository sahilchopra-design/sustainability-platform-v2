## 9 · Future Evolution

### 9.1 Evolution A — Wire the aggregator to real platform assessments (analytics ladder: rung 1 → 2)

**What.** EP-CW6 is honest about what it is — a platform-wide KPI aggregation shell,
with no guide↔code mismatch — but §7.5 states the gap plainly: it "is designed to
summarise real per-entity assessments from other platform modules but is not wired
to them", so the 15-entity roster and its 120 topic scores are seeded, the "94%
coverage" and "+1.3 improvement" KPIs are hard-coded strings, and alerts are static
narrative. Evolution A makes it the aggregation layer it claims to be: real
assessments in, real KPIs out.

**How.** (1) Assessment substrate: the platform already persists assessment runs in
several verticals (climate-risk `assessments`, insurance `insurance_climate_assessments`,
CRREM portfolios, company-profiles records) — define a thin
`entity_assessment_summary` view/table mapping each module's latest scores onto the
8 L1 topics per entity (the mapping table is the real work; the Atlas endpoint map
identifies the sources). (2) KPIs computed: coverage = entities with ≥1 real
assessment / roster size; improvement = quarter-over-quarter delta from stored
history — replacing both hard-coded values. (3) Alerts from a score-change detector
(threshold crossings, new controversy matches from `controversy-monitor`) instead of
6 static strings. (4) Board Pack renders the computed aggregates through the
report-studio layer.

**Prerequisites (hard).** The topic-mapping table across source modules (requires
those modules' assessments to be real — several are mid-remediation per their own §9
entries); seeded-roster purge. **Acceptance:** an entity with no real assessments
shows as uncovered rather than seeded-scored; re-running a source module's
assessment visibly updates the heatmap cell; the coverage KPI is reproducible as a
count.

### 9.2 Evolution B — Board-pack narrator over live aggregates (LLM tier 2 → 3)

**What.** The Board Pack tab is the natural home for the roadmap's desk-orchestration
output layer: an executive summary that a risk committee actually reads. Evolution B
drafts it from the (post-Evolution A) live matrix: the quarter's movers with the
source-module evidence behind each shift ("Shell's Climate topic fell 9 points —
driven by the stress-test module's Delayed Transition re-run"), concentration
observations from the distribution, and open alerts with their detector rationale —
every claim traced to a source module's assessment record, making this the
platform's first cross-module narrative surface.

**How.** Tier-2/3 pattern: read tools over the aggregation layer plus drill-down
calls into source-module endpoints via the Atlas interconnection map when a mover
needs explanation; the roadmap's provenance UX ("show work" with source modules and
engine versions) is essential because a board pack aggregates a dozen engines'
outputs. Rendering through report-studio; regeneration is deterministic for a frozen
assessment snapshot.

**Prerequisites (hard).** Evolution A (narrating seeded scores to a board is the
platform's nightmare scenario); source-module assessment persistence with
timestamps. **Acceptance:** every figure in a board pack traces to a named module's
stored assessment; movers' explanations cite the actual source run; entities without
data are listed as coverage gaps, not scored.
