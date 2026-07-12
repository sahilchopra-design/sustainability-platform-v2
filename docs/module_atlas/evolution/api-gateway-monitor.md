## 9 · Future Evolution

### 9.1 Evolution A — Real gateway telemetry from FastAPI middleware (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, this page performs **no monitoring**: it never calls the
backend it nominally represents, and every one of its 2,302 synthetic endpoints, latencies, error
rates, throttle events and traffic curves is a seeded PRNG draw at load (§7.5). It is a design mock
over 52 real platform domain names, with fixed latency-percentile multipliers (p50=0.6×, p95=1.8×,
p99=3.2× mean) rather than measured percentiles, and rate-limit analytics that don't close the loop
(throttle log, hit counts and client quotas are independent draws). Evolution A wires it to real
telemetry: the platform's AuditMiddleware (always on, §platform rules) already sees every request —
Evolution A aggregates those access logs into true per-endpoint request counts, sampled p50/p95/p99
latency, real 4xx/5xx breakdowns, and genuine availability `uptime/total`, over the platform's
*actual* route surface rather than a generated registry.

**How.** Materialized views (roadmap D4) over the 18 `audit_*` tables computing per-endpoint
minute-bucketed metrics; `GET /api/v1/gateway/health` and `/sla-report` serving real SLA compliance
against configured thresholds; the endpoint registry populated from the FastAPI OpenAPI spec (which
the Atlas builder already introspects) so every row maps to a real route. Rung 3: SLO burn-rate
alerting (the PagerDuty-compatible P0/P1/P2 the guide describes) computed from real error budgets,
with circuit-breaker state surfaced from actual upstream-provider health polling.

**Prerequisites (hard).** Purge the seeded endpoint/traffic/throttle generators per the
no-fabricated-random guardrail; note the §2.2 endpoint table here is polluted with other domains'
routes (adaptation-finance, ai-governance) because the module shares their engines — the real
gateway surface must be enumerated from OpenAPI, not this list. **Acceptance:** the dashboard shows
real request counts and sampled p95 from audit logs; availability is computed `uptime/total`, not
`100 − errorRate`; an induced 500 on a real endpoint appears in the error breakdown.

### 9.2 Evolution B — Ops copilot over live gateway health (LLM tier 2)

**What.** A copilot for platform operators answering "which endpoints are breaching their latency
SLO?", "what's driving the 5xx spike on the physical-risk domain?", and "which clients are near
their rate-limit quota?" — tool-calling Evolution A's health/SLA endpoints and narrating real
telemetry instead of the mock's seeded curves. It turns the console into a queryable operations
assistant grounded in audit-log truth.

**How.** Tool schemas over the gateway health, SLA-report and rate-limit endpoints; the
no-fabrication validator checks every latency, error-rate and quota figure against tool output.
Read-only queries auto-execute; any mutating action (adjust a rate-limit tier, silence an alert)
renders a confirmation. Because this module's blast radius is 87 modules (it shares
`adaptation_finance_engine` and `ai_governance_engine`), the copilot can cross-reference which
downstream disclosure modules a degraded endpoint feeds — the data-freshness contagion the guide's
business case describes.

**Prerequisites.** Evolution A (real telemetry — today there is nothing to query); Atlas corpus
embedded (roadmap D3); operator-only RBAC on the copilot route. **Acceptance:** every figure in an
answer traces to a health/SLA tool output; "what feeds off this endpoint?" resolves via the real
interconnection graph; an SLO-breach question returns endpoints ranked by actual error-budget burn.
