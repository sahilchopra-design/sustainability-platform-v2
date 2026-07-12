## 9 · Future Evolution

### 9.1 Evolution A — Real DAG execution over the live source registry (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide's DAG orchestration with retry logic, provider
failover and per-field lineage is **not implemented**: the code is an operations console over a
hand-curated registry of 10 real (mostly free-tier) sources — EODHD, Alpha Vantage, OpenFIGI, IMF,
FINRA TRACE, KAPSARC, Climate Bonds, internal Supabase BRSR — with *simulated* pipeline runs
(`runPipeline` sets status, waits `1500 + sr·3000` ms, records `50 + sr·500` and a 10%-probability
error). The registry metadata is genuine documentation of the platform's data supply chain; the
runtime telemetry is synthetic, and `last_call`/`errors_24h`/`calls_24h` are static nulls. The
platform actually *has* 19 real ingesters — Evolution A connects this console to them, turning
simulated runs into real orchestration with retry/backoff and the declared `FIELD_SOURCE_MAP`
failover chains (`bond_pricing: [cbonds, lseg, finra_trace]`) actually executing.

**How.** A backend orchestration service where `runPipeline` triggers a real ingester and records
true records-processed, latency and errors to a `pipeline_runs` table; per-field lineage captured
per DAMA DMBOK against the platform's existing `lineage_output/traces/` artifacts. The cache-refresh
formula (`100 − hoursAgo/cache_ttl·100`) — already the module's one genuine time computation —
operates on real `last_call` timestamps. Rung 3: real freshness/coverage SLOs replacing the
hardcoded 78.4% cache-hit and 82 freshness literals.

**Prerequisites (hard).** Move API keys server-side (currently plaintext in localStorage, §7.5);
purge the simulated run/latency/utilisation `sr()` draws per the no-fabricated-random guardrail;
wire retry/failover, which today exist only as a declarative array. **Acceptance:** a pipeline run
makes a real network call and records genuine records/latency/errors; a primary-source failure
triggers the declared fallback; freshness reflects actual last-call timestamps.

### 9.2 Evolution B — Data-ops copilot over pipeline health and lineage (LLM tier 2)

**What.** A copilot for operations teams answering "which feeds are stale?", "trace where the
`green_bonds` field comes from" (walking `FIELD_SOURCE_MAP` and its fallback chain), "what's my
pipeline success rate this week?" (the one genuinely computed KPI from the accumulated run log),
and "re-run the BRSR sync" — tool-calling the orchestration endpoints and narrating real telemetry
instead of the simulated runs.

**How.** Tool schemas over Evolution A's run/status/lineage endpoints; read-only queries (status,
lineage trace, coverage) auto-execute, while mutating actions (trigger run, edit failover config,
rotate keys) render a confirmation first. The no-fabrication validator checks every latency,
success-rate and coverage figure against tool output. The registry's real source metadata (quotas,
TTLs, coverage counts — 656 EODHD, 1,323 BRSR companies) is ideal RAG grounding for "which source
covers Indian companies?" questions.

**Prerequisites.** Evolution A (real telemetry to narrate — today runs never touch a network);
server-side key storage before a copilot can trigger authenticated calls; Atlas corpus embedded
(roadmap D3). **Acceptance:** every figure in an answer traces to a pipeline-run or registry tool
output; a "re-run" action requires confirmation and produces a real run log entry; a lineage trace
resolves a field to its actual supplying source and fallbacks.
