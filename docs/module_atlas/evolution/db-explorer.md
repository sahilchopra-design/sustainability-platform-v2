## 9 · Future Evolution

### 9.1 Evolution A — Introspect the live schema; execute real read-only queries (analytics ladder: rung 1 → 2)

**What.** §7's finding: no live database exists behind this explorer — the schema
is a hand-transcribed model (frozen at Alembic 001–067, while the platform chain
now runs far past that), the "query engine" regex-parses the SELECT list and
fabricates 5–44 seeded rows, and the guide's Query Performance Score
(`1/(Time × RowsScanned / IndexHitRate)`) has no `EXPLAIN` behind it. The FK
graph and domain treemap are genuinely useful orientation tools — over a schema
model that drifts from reality. Evolution A makes it real and safe.

**How.** (1) Live introspection: a backend route reading
`information_schema`/`pg_catalog` (tables, columns, PK/FK, row estimates from
`pg_class.reltuples`, sizes from `pg_total_relation_size`) — the schema tree,
treemap, and FK graph then reflect the actual 577-table state with zero manual
transcription. (2) Governed execution: a read-only query endpoint running
statements under a restricted role (SELECT-only grants, statement timeout, row
limit, RBAC + AuditMiddleware logging) — the "democratised access with governance"
the overview promises, done with database-level enforcement rather than trust.
(3) Real plans: `EXPLAIN (ANALYZE, BUFFERS)` on demand, surfacing scan types and
suggesting indexes — the QPS becomes computable from actual plan numbers.
(4) Delete the mock executor and seeded results entirely.

**Prerequisites (hard).** The restricted read-only role and RLS/org-scoping
review (an explorer is an exfiltration surface — the D2 multi-tenancy hardening
must gate this); statement-timeout and cost-limit policy. **Acceptance:** the
schema tree matches a live `information_schema` query; a real query returns real
rows with the audit log recording actor and statement; a full-scan query's plan
displays with its index suggestion.

### 9.2 Evolution B — Natural-language-to-SQL analyst with schema grounding (LLM tier 2)

**What.** The visual builder serves non-technical analysts; the LLM serves them
better: "average Scope 1 by sector for portfolio companies with SBTi commitments"
→ generated SQL against the live schema, shown for confirmation before execution,
results explained. The live introspection layer makes this grounded — the model
sees actual table/column names and FK paths, not guesses — and the read-only role
makes it safe by construction: the worst hallucinated SQL can do is return wrong
rows or time out.

**How.** Tier-2: schema context assembled from the introspection route (relevant
tables selected by embedding similarity over table/column descriptions); generated
SQL always displayed and user-confirmed before the execution tool runs it;
results paired with the executed statement for auditability. Failed queries
(errors, empty results) trigger one grounded revision attempt, then honest
failure. Query+confirmation pairs log to `llm_traces` for the flywheel; saved
queries join the shared library the overview promises.

**Prerequisites (hard).** Evolution A in full — NL-to-SQL over the stale
hand-modelled schema would generate confidently wrong queries; the restricted
role is the safety boundary that makes the feature shippable. **Acceptance:** on
a 20-question benchmark over platform tables, ≥80% of generated queries execute
and return correct results; every execution shows its SQL first; no statement
ever runs outside the read-only role.
