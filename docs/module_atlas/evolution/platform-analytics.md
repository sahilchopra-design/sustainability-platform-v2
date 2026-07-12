## 9 · Future Evolution

### 9.1 Evolution A — Real usage telemetry from the audit layer (analytics ladder: rung 1 → 4)

**What.** This is a product-analytics/observability module, not a climate-quant tool — it tracks module engagement, DAU, API volume, and latency. §7 flags that the guide's Module Engagement Score (`E = DAU × avg_session_depth / total_modules`) is never computed; the page shows raw aggregates over a *synthetic* 90-day series (`USAGE_90D.dau = baseUsers + trend + sr()`, `MODULE_USAGE` a static 20-row table) plus a hand-authored API-latency table. (Note: the atlas endpoint listing shows sanctions-screening routes, likely a mis-association — this module's real backing would be the audit layer, not sanctions.) The platform already captures every interaction. Evolution A wires real telemetry.

**How.** (1) Source usage from the platform's 18 `audit_*` tables (project memory confirms AuditMiddleware is always on, capturing everything) — materialized views over them give real DAU, per-module views, session depth, and API volume, exactly the roadmap's D4 "analytics warehouse posture" work. (2) Implement the documented Engagement Score (`E = DAU × avg_session_depth / total_modules`) from real session data, replacing the synthetic series. (3) Rung-4: the module-adoption view becomes a real "copilot deflection / low-adoption module" signal the roadmap names as a product-analytics goal, driving UX prioritisation (§1). Latency/error metrics come from real request logs.

**Prerequisites.** Materialized views over `audit_*` (D4 work); the Engagement Score formula is simple once session data is real. Remove the synthetic 90-day generator. **Acceptance:** DAU/views/latency compute from real audit data, not `sr()`; the Engagement Score is computed per the guide; low-adoption modules are identified from real usage.

### 9.2 Evolution B — Product-analytics copilot for the platform team (LLM tier 1 → 2)

**What.** A copilot for the product/data-team users §1 targets: "which modules have the lowest adoption this month?", "what's the DAU trend for the physical-risk domain?", "which endpoints have the worst p95 latency?", "where should we focus UX investment?" — grounded in real usage telemetry (post-Evolution-A) and the platform's own module atlas.

**How.** Tier 1 summarises usage from the (post-Evolution-A) real telemetry: system prompt from this Atlas page's §5 Engagement Score definition and the audit-derived metrics; the copilot identifies low-adoption modules and latency outliers with figures cited to the telemetry. Tier 2 adds cross-referencing: joining usage data with the module atlas (§6 shows 7-module blast radius / interconnection) to recommend where adoption gaps matter most, and — as this is meta-analytics over the whole platform — feeding the roadmap's Tier-4 data-flywheel curation (which modules generate the copilot traces worth training on). Fabrication validator matches every usage figure to the telemetry; the copilot must not report the synthetic fallback as real.

**Prerequisites.** Evolution A's real telemetry (analytics on demo data is meaningless); RBAC — usage analytics is admin-scoped. **Acceptance:** every usage/latency figure traces to audit-derived data; adoption recommendations cite real numbers; the copilot flags when data is synthetic fallback rather than live.
