## 9 · Future Evolution

### 9.1 Evolution A — Execute the rule library against live records (analytics ladder: rung 1 → 2)

**What.** §7's assessment: real aggregation machinery — genuine DQ weights, correct
freshness-SLA unit conversions, RAG thresholds, and a curated 52-rule validation
library — over seeded inputs: per-source
completeness/accuracy/timeliness/consistency/uniqueness are `sr()` draws
(`min(99.5, 65 + sr·35)`), null rates are seeded, and the rule library "is not
executed against live data". The sibling `data-quality-monitor` already proves the
pattern works — its rule engine runs on real company records. Evolution A executes
this module's 52 rules for real and senses the source metrics.

**How.** (1) Rule execution: run the 52-rule library (weights-sum bounds,
range checks, referential rules) against the platform's actual tables —
`portfolios_pg`, the company master, captured records — on a schedule, persisting
violations to a `dq_violations` table; accuracy per source becomes a violation
rate, not a seed. (2) Completeness from real field-presence queries per source
table (the `DB_TABLES` registry names them); null rates measured. (3) Timeliness
from table update timestamps against the module's already-correct SLA lags.
(4) Consistency: an actual cross-provider comparison where the platform has
overlap (BRSR vs enrichment values in `company-profiles`) — replacing the seeded
divergence. (5) Division of labor with siblings: this dashboard is the
platform-wide roll-up; `data-quality-monitor` stays the per-company engine;
`data-governance` consumes both — one violations store underneath all three.

**Prerequisites (hard).** Seed purge; the shared `dq_violations` store; scheduled
execution (the ingestion framework's scheduler pattern). **Acceptance:** inserting
a deliberately invalid record raises a violation within one cycle and moves the
source's accuracy; the freshness panel flags a genuinely stale table; the 52 rules
each show a last-executed timestamp.

### 9.2 Evolution B — DQ root-cause investigator (LLM tier 2)

**What.** A dashboard shows *which* source degraded; stewards need *why*.
Evolution B: when a dimension drops, the investigator drills by tool call — which
rules started failing (violations store), which fields drive the null-rate change,
whether an ingester run correlates (sync logs), whether one provider or one
entity-batch explains it — and drafts the root-cause note with the remediation
recommendation drawn from the module's own gap-plan conventions (e.g. "scope gaps
→ BRSR supplement"), every claim citing a query result.

**How.** Tier-2 read-only tools over the violations store, source metrics, and
sync telemetry; grounding is this Atlas record plus the rule library's definitions
(each rule's intent is documented — the investigator explains failures in the
rule's own terms). The correlational-humility rule from the ops-copilot pattern
applies: suspected cause, human confirmation. Notes feed the steward workflow in
`data-governance`.

**Prerequisites (hard).** Evolution A's live execution (root-causing seeded
metrics is meaningless); violations history depth for trend claims.
**Acceptance:** for a constructed degradation (corrupt one source's batch), the
investigator identifies the batch and the failing rules; every number in the note
reproduces from the stores; recommendations map to documented gap-plan options.
