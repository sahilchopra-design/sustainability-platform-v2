## 9 · Future Evolution

### 9.1 Evolution A — Live CSRD extraction and dps-weighted coverage (analytics ladder: rung 2 → 3)

**What.** This domain serves 10 demo analyst portfolios of 55+ real institutions (real LEIs, NZBA/
PCAF/SBTi memberships) with framework gap assessments across 18 categories — honestly hybrid: 8
entities' coverage traces to actually-processed CSRD reports in `csrd_entity_registry`, the rest
carry analyst estimates in `_ENTITY_COVERAGE_BASELINE`, each row labelled with its `data_source`.
Its §7.5 gaps: coverage baselines are **frozen snapshots** that don't refresh when new reports are
processed (unless the DB-pull path finds newer data), the entity-level `weighted_avg` is actually
*unweighted* across categories (a 4-dp TCFD category counts equal to 40-dp ESRS E1), and
`required_dps` are the platform's own decomposition, not official counts. Evolution A wires live
CSRD KPI extraction so coverage refreshes as reports are processed, and makes the entity roll-up
genuinely dps-weighted.

**How.** `GET /{id}/gap-assessment` computes each entity's coverage from live `csrd_kpi_values`
joins for all processed reports (not just the 8 baselined), falling back to estimates with the
`data_source` label preserved; the entity `weighted_avg` becomes `Σ(coverage·required_dps)/Σ
required_dps`. Rung 3: calibrate `required_dps` against EFRAG's official ESRS datapoint counts (IG3
lists ~200 for E1) with a materiality-filter note, so coverage percentages are comparable to
regulator benchmarks.

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `GET /{portfolio_id}` and
`/{portfolio_id}/gap-assessment` **failed** and `/seed` **skipped**; run `POST /seed` to
materialise portfolios into `portfolios_pg` (roadmap D0) so the detail paths resolve. **Acceptance:**
processing a new CSRD report updates that entity's coverage without a code change; the dps-weighted
entity average differs from the current unweighted mean where category sizes vary; the detail and
gap-assessment endpoints pass the harness.

### 9.2 Evolution B — Engagement-analyst copilot over the gap corpus (LLM tier 2)

**What.** A copilot for stewardship analysts answering "which NZBA banks have the weakest transition-
plan coverage?", "what are ING's top 3 disclosure gaps?" (TNFD Nature 42, ESRS E2–E5 45, Physical
Risk 65 from the baseline), and "draft an engagement brief for this portfolio" — tool-calling the
gap-assessment endpoints and narrating real, `data_source`-labelled coverage. The commitment-vs-
disclosure tension the portfolios are built to surface (an NZBA member with low transition-plan
coverage) is exactly the engagement case the copilot articulates.

**How.** Tool schemas over the 4 endpoints; the 18-category framework rubric (TCFD/ISSB/ESRS/PCAF/
TNFD required-dps) and the entity master (LEIs, memberships) are ideal RAG grounding. The
no-fabrication validator checks every coverage % and dps count against tool output; crucially, the
copilot must carry each figure's `data_source` label so an extracted-CSRD number is never conflated
with an analyst estimate. Composable into the report layer for engagement-brief artifacts.

**Prerequisites.** Evolution A (live extraction so "latest coverage" is meaningful) plus its harness
fixes; Atlas + rubric corpus embedded (roadmap D3). **Acceptance:** every coverage figure cited
carries its extracted-vs-estimate provenance; a request for an entity not in the master returns a
refusal; the top-gaps a copilot names match the gap-assessment endpoint output exactly.
