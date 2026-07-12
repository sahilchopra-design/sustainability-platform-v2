## 9 · Future Evolution

### 9.1 Evolution A — Auto-harvest lineage from the platform's own harness (analytics ladder: rung 2 → 3)

**What.** §7 rates the 19-field lineage register "one of the atlas's most authentic
artefacts" — real source priorities, documented transformations, genuine
downstream-consumer maps — with three scoped gaps: the register is hand-authored
rather than harvested (§8 says so explicitly), quality/age values are authored
rather than sensed, and the audit trail's before/after values are `sr()`-seeded.
Meanwhile the platform *runs* an E2E lineage harness (`backend/lineage/`, 2,528
endpoints swept, `ledger.jsonl` + per-domain traces) whose output this module never
consumes, and three of its own endpoints fail the harness (`/module-graph`,
`/platform-health`, `/reference-data`). Evolution A connects the documentation
module to the measurement system.

**How.** (1) Fix the three failed GETs. (2) Harvest: generate register entries from
the lineage harness's trace output — source tables, provenance classes, and
call-chain transformations per endpoint are already captured in
`lineage_output/traces/`; hand-authored entries become the curated overlay
(transformation *descriptions*, source-priority logic) on harvested structure.
(3) Sense freshness and quality: `age_hours` from actual table update timestamps,
quality from the capture/validation telemetry — replacing authored plausibility
with measurement. (4) Audit trail from AuditMiddleware events (the module's own
`GET /audit-events` already passes the harness) — deleting the seeded before/after
generator. (5) Coverage then means something stronger: fields with harvested,
verified lineage vs documented-only, badged distinctly — the CSRD Art. 34
assurance distinction.

**Prerequisites.** Lineage harness output as a scheduled artifact (currently
run-on-demand); the three endpoint fixes. **Acceptance:** a new module's endpoints
appear in the register after a harness sweep without hand-authoring; freshness
reflects a real table update within the snapshot interval; zero `sr()` calls in the
audit trail.

### 9.2 Evolution B — Assurance-walkthrough copilot for auditors (LLM tier 2)

**What.** The module's stated customer — external assurers tracing disclosed
metrics to sources under CSRD limited assurance — does this work as interview plus
document request. Evolution B compresses it: "walk me through Scope 3 for entity X"
drives tool calls across the register (`POST /lineage/trace`), the harvested
call-chains, and the audit events, producing the walkthrough narrative: source
system and priority logic, each transformation with its documented formula, quality
checks applied, and the downstream disclosure mapping — with every step citing a
register entry or trace record, and gaps stated as gaps (the Gap Finder's output in
prose).

**How.** Tier-2 read-only tools over the module's 16 operations (13 already pass
the harness); grounding corpus is the register's documented transformation logic —
the copilot explains recorded lineage, never infers undocumented steps, which is
precisely the assurance boundary. Impact-analysis questions ("what breaks if this
source lags?") call `POST /impact-analysis` and narrate the dependency map.
Exported walkthroughs join the Export Lineage Package.

**Prerequisites.** Evolution A's harvested register (walkthroughs over hand-
authored-only lineage carry a disclosure); the failed-endpoint fixes.
**Acceptance:** a walkthrough for a fully-documented field cites every stage from
the register; a partially-documented field's walkthrough terminates at the gap with
the Gap Finder's task reference; no step appears that lacks a register or trace
record.
