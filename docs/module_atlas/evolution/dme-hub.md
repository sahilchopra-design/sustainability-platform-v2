## 9 · Future Evolution

### 9.1 Evolution A — Compute the health score from real platform telemetry (analytics ladder: rung 1 → 2)

**What.** The §7 note is candid: "this page is not analytical" — it's a data-ops console whose `MODULE_HEALTH` scores (85–97), `QUALITY_TREND` series, `ETL_PIPELINES` statuses, and `ACTIVE_ISSUES` log are all **authored constants**. Yet the platform actually possesses the telemetry the page pretends to display: 18 `audit_*` tables capture every request, the ingestion framework runs 19 real ingesters with per-run stats, and `lineage_output/summary.json` records endpoint pass/fail across 292 domains. Evolution A computes the guide's `DHS = Freshness × Coverage × (1 − ErrorRate)` from those real sources.

**How.** (1) New `GET /api/v1/dme/ops-health` endpoint: freshness from ingester last-run timestamps, coverage from lineage-sweep pass rates per DME module, error rate from audit-log 5xx counts — replacing the hand-authored tables. (2) `ETL_PIPELINES` becomes a live read of the ingestion framework's run registry (the seed table already names the real sources: EODHD, BRSR, World Bank, ND-GAIN, OpenFIGI). (3) `ACTIVE_ISSUES` wires to genuine data-quality checks (the "14 companies missing Scope 1" style entries become computed assertions over the company master). (4) Rung 2: DHS history persisted per module with the guide's <0.80 admin alert implemented as a real threshold rule.

**Prerequisites.** Materialized views over `audit_*` (the roadmap's D4 stage — this module is its natural first consumer); ingester run metadata standardized. **Acceptance:** killing one ingester's schedule visibly degrades the freshness component within a day; zero authored health constants remain; the DHS<0.80 alert fires in a fault-injection test.

### 9.2 Evolution B — DME desk orchestrator seated at the hub (LLM tier 3)

**What.** As the family's navigation and governance point, the hub is where a cross-module DME orchestrator belongs: "give me the full materiality picture for entity X" should route across the sub-modules — topic scores from dme-entity, alert state from dme-alerts, contagion centrality from dme-contagion, index position from dme-index, PD context from dme-pd-engine — and synthesize one memo, with the hub's ops-health data gating the answer ("entity scores are 9 days stale — refresh before relying on this").

**How.** Routing knowledge from `module_tags.json` DME tags plus the Atlas interconnection graph; tool surface = the read-only endpoints of the six DME sub-modules as they land their own §9 Evolution A backends. The freshness gate is the hub-specific contribution: every synthesized memo carries the DHS components of its input modules, so stale data is disclosed rather than laundered. Output composes through report-studio per the tier-3 pattern.

**Prerequisites (hard).** At least dme-entity and dme-alerts Evolution A shipped (topic persistence + alert archive) — orchestrating today's seeded sub-modules would synthesize fabrications at desk scale; Evolution A's ops-health endpoint for the freshness gate. **Acceptance:** a golden entity memo cites every figure to a named sub-module endpoint and displays input freshness; when a sub-module's health is red, the memo flags it instead of silently including stale numbers.
