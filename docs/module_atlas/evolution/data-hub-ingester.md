## 9 · Future Evolution

### 9.1 Evolution A — Real pipeline telemetry on the page, real fusion in the service (analytics ladder: rung 1 → 2)

**What.** §7's mismatch: the page is a monitoring shell — 16 authored `SCHEDULES`
with seeded daily failure flags — while the real API surface (25 endpoints,
`data_hub_service`/`sync_orchestrator`, including `GET /sync-logs` and
`POST /sources/{id}/sync`) goes unsurfaced, and the guide's fusion engine
(`Fused = Σ w_p·Value_p/Σ w_p` with 1.0/0.85/0.5 quality tiers, LEI/ISIN dedup,
threshold-gated conflict flags) is implemented nowhere. With blast radius 66, this
hub's honesty matters disproportionately. Two harness failures
(`GET /comparisons/{id}`, `/scenarios/{id}`) need triage too.

**How.** (1) Telemetry wiring: the Pipeline Monitor reads `GET /sync-logs` and
`GET /sources` — the platform runs 19 real ingesters whose runs produce actual
statuses and record counts; the seeded daily series and static job registry get
deleted. (2) Fusion engine in `data_hub_service`: implement the guide's weighted
fusion with the quality-tier weights, entity resolution through the GLEIF spine
(the platform's `entity_lei` table and OpenFIGI mapping already exist — reuse, not
rebuild), and the conflict rule (spread > threshold → steward queue, never
auto-fuse). (3) Provenance ledger rows per fused value (source, weight, tier) —
the audit-trail promise made real via AuditMiddleware. (4) Fix the two failed GETs
(likely the platform's known NULL-field/500 class).

**Prerequisites (hard).** Seed purge on the monitor; a second provider source to
fuse against (single-provider fusion is a no-op — start where the platform has
overlap, e.g. emissions from BRSR vs CDP-style disclosures); steward-queue UI.
**Acceptance:** the monitor shows a real ingester run within minutes of triggering
`POST /sync-all`; a constructed two-provider conflict above threshold lands in the
steward queue un-fused; every fused value's weights reproduce its tier assignment.

### 9.2 Evolution B — Conflict-resolution steward assistant (LLM tier 2)

**What.** The Conflict Manager tab's core task — "provider disagreements awaiting
steward resolution" — is judgment work an assistant can prepare: for each flagged
conflict, summarize the disagreement (values, providers, tiers, vintage),
investigate context via tool calls (the entity's history in the hub, the providers'
track records on this metric, unit/scope mismatches — the most common real cause),
and propose a resolution with rationale ("Provider A reports location-based Scope 2,
Provider B market-based — not a true conflict; recommend storing both with scope
tags") for the steward to accept or override.

**How.** Tier-2 read tools over the fused store, sync logs, and entity history;
resolution proposals are gated writes requiring steward confirmation, logged with
the proposal rationale — building the platform's conflict-resolution corpus (the
roadmap's flywheel). The scope/unit-mismatch taxonomy comes from the GHG Protocol
data-quality guidance already cited in §5. The assistant never auto-resolves:
its value is triage speed, not authority.

**Prerequisites (hard).** Evolution A's fusion engine and steward queue (there are
no real conflicts to triage today); provider metadata (tier, methodology) stored
per source. **Acceptance:** on a constructed conflict set, ≥80% of proposals match
expert resolutions; every proposal cites the specific values and tiers involved;
unresolved-by-design cases (true disagreements) are recommended for both-stored,
not forced to a winner.
