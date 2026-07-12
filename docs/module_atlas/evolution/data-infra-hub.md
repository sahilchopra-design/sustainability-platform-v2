## 9 · Future Evolution

### 9.1 Evolution A — Sense the platform instead of describing it (analytics ladder: rung 1 → 2)

**What.** §7's verdict: real roll-up arithmetic (total calls, error rate, avg
latency, quota %) over authored telemetry — the 11 `DATA_SOURCES` rows, 6 module
health flags, alerts, and upgrade recommendations are hard-coded/seeded, and the
guide's weighted `HealthScore = 0.35·Uptime + 0.30·QueryPerf + 0.20·Pipeline +
0.15·Storage` is never computed. The platform, meanwhile, generates real telemetry
this page ignores: 18 `audit_*` tables capture every request (the roadmap's D4
stage plans materialized views over them), ingester runs log outcomes, and
Postgres exposes `pg_stat_statements`. Evolution A wires the senses.

**How.** (1) API telemetry: materialized views over the audit tables give real
per-endpoint call counts, error rates, and latency percentiles — the D4 warehouse
work this module should be the first consumer of. (2) Database: a scheduled
`pg_stat_statements` snapshot into a metrics table covers query-latency P95 and
slow-query surfacing (Supabase exposes the extension). (3) Pipeline health from
the data-hub sync logs (real ingester outcomes). (4) Storage: table-size growth
from `pg_total_relation_size` snapshots with the 90-day projection the overview
promises (linear fit is honest here). (5) Compute the guide's weighted HealthScore
from these four real components; alerts become threshold evaluations over live
metrics. The 11-source registry stays as configuration, its metrics now measured.

**Prerequisites.** The D4 materialized-view layer (this module is its natural
first customer); metric-snapshot scheduling; seed purge. **Acceptance:** the
error-rate KPI changes when a real endpoint 500s; P95 latency matches a direct
`pg_stat_statements` query; the HealthScore decomposes into four live components
with the documented weights.

### 9.2 Evolution B — Incident-triage copilot for platform operators (LLM tier 2)

**What.** Operational dashboards answer "what"; operators need "why". Evolution B:
when a health component degrades, the copilot investigates by tool call — which
endpoints drive the error-rate spike (audit-view query), whether a slow query
correlates (statements snapshot), whether an ingester failure explains stale data
(sync logs) — and drafts the incident note: timeline, affected modules (via the
dependency map `MODULE_DATA_DEPS` maintains), suspected cause, and the evidence
trail. SOC 2-style operational evidence, generated from real telemetry.

**How.** Tier-2 read-only tools over the Evolution A metric views — deliberately no
mutating operations (an ops copilot that restarts things is a different risk
class; start with diagnosis). Grounding: the SRE/SLO conventions §5 cites plus the
platform's own architecture documentation. Every claim in an incident note cites a
metric query result; "suspected cause" language is mandatory — the copilot
correlates, humans conclude.

**Prerequisites (hard).** Evolution A's live telemetry (triage over authored
metrics would be theater); metric-view query tools. **Acceptance:** for a
synthetically induced failure (kill one ingester), the copilot's note identifies
the right component and downstream modules; every number in the note reproduces
from the views; no remediation action is executed by the copilot.
