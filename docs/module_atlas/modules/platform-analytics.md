# Platform Analytics
**Module ID:** `platform-analytics` · **Route:** `/platform-analytics` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks platform usage metrics, module engagement, user session patterns, and feature adoption across the ESG analytics suite.

> **Business value:** Equips product and data teams with behavioural analytics to prioritise development, measure feature adoption, and optimise platform UX.

**How an analyst works this module:**
- Review aggregate usage heatmap by module and domain.
- Filter by user cohort, date range, or department.
- Identify low-adoption modules for UX review.
- Export engagement report for stakeholder review.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API_ENDPOINTS`, `DOMAIN_PIE_COLORS`, `MODULE_USAGE`, `STATUS_COLOR`, `USAGE_90D`, `WEEKLY`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MODULE_USAGE` | 31 | `code`, `views`, `sessions`, `avgTime`, `domain` |
| `API_ENDPOINTS` | 11 | `calls`, `p50`, `p95`, `p99`, `errors`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `date` | `new Date('2026-04-01'); date.setDate(date.getDate() - (89 - i));` |
| `trend` | `i / 90 * 15;  // growing trend` |
| `slice` | `USAGE_90D.slice(w * 7, (w+1) * 7);` |
| `slicedUsage` | `useMemo(() => USAGE_90D.slice(90 - range), [range]);` |
| `totalDau` | `Math.round(slicedUsage.reduce((s,d)=>s+d.dau,0)/slicedUsage.length);` |
| `totalApi` | `slicedUsage.reduce((s,d)=>s+d.apiCalls,0);` |
| `totalErrors` | `slicedUsage.reduce((s,d)=>s+d.errors,0);` |
| `avgLatency` | `Math.round(slicedUsage.reduce((s,d)=>s+d.p95Latency,0)/slicedUsage.length);` |
| `errorRate` | `totalApi > 0 ? (totalErrors / totalApi * 100).toFixed(3) : '0.000';` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sanctions/status` | `status` | api/v1/routes/sanctions_screening.py |
| POST | `/api/v1/sanctions/screen` | `screen` | api/v1/routes/sanctions_screening.py |
| GET | `/api/v1/sanctions/uflpa-list` | `uflpa_list` | api/v1/routes/sanctions_screening.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `XUAR` *(shared)*, `__future__` *(shared)*, `datetime` *(shared)*, `dhs` *(shared)*, `fastapi` *(shared)*, `pathlib` *(shared)*, `persons` *(shared)*, `pydantic` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `API_ENDPOINTS`, `DOMAIN_PIE_COLORS`, `MODULE_USAGE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Daily Active Users | — | Auth Logs | Unique authenticated users active in last 24 hours. |
| Top Module (7d) | — | Event Tracking | Most visited module by unique page views over rolling 7-day window. |
| Avg Session Duration (min) | — | Session Analytics | Mean authenticated session length across all users. |
- **Browser event telemetry + server access logs** → Session stitching; event aggregation; cohort segmentation → **Module engagement dashboard and exportable usage reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Module Engagement Score
**Headline formula:** `E = (DAU × avg_session_depth) / total_modules`

Normalised engagement index combining daily active users with depth of module exploration per session.

**Standards:** ['Internal Analytics Telemetry']
**Reference documents:** Google Analytics 4 Measurement Protocol; Mixpanel Analytics Documentation

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **7** other module(s).

| Connected module | Shared via |
|---|---|
| `sanctions-climate-finance` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-trade-monitor` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-screening-desk` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `sanctions-watchlist` | table:XUAR, table:dhs, table:pathlib, table:persons |
| `energy-transition-credit-portal` | table:pathlib |
| `module-navigator` | table:pathlib |
| `infra-debt-portfolio-manager` | table:pathlib |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide defines a *Module Engagement Score*
> `E = (DAU × avg_session_depth) / total_modules`. **This composite is never computed in the code.**
> The page shows raw usage aggregates (mean DAU, total API calls, total errors, error rate, p95
> latency) over a synthetic 90-day series, plus a static module-adoption table and API-endpoint
> latency table. No normalised engagement index exists.

### 7.1 What the module computes

Over a rolling window `range` of the 90-day usage series (`slicedUsage = USAGE_90D.slice(90-range)`):

```js
totalDau   = round( Σ d.dau / slicedUsage.length )        // mean DAU over window
totalApi   = Σ d.apiCalls                                  // sum
totalErrors= Σ d.errors                                    // sum
avgLatency = round( Σ d.p95Latency / slicedUsage.length )  // mean p95 (ms)
errorRate  = totalApi>0 ? (totalErrors/totalApi × 100).toFixed(3) : '0.000'
```

`errorRate` is the only guarded ratio. `domainBreakdown` sums `MODULE_USAGE[].views` by `domain`.

### 7.2 Parameterisation / seed rubric

| Series | Formula | Provenance |
|---|---|---|
| `USAGE_90D.dau` | `max(1, round(baseUsers + trend + (sr(i·7)−0.5)·12))`, `baseUsers` 42 weekday / 12 weekend, `trend = i/90·15` | synthetic; weekday/weekend + linear-growth demo pattern |
| `apiCalls` | `(28000/8000)·(1+trend/100)·(0.85 + sr(i·7+1)·0.3)` | synthetic demo value |
| `p95Latency` | `round(180 + sr(i·7+3)·140)` → 180–320 ms | synthetic demo value |
| `errors` | `round(sr(i·7+4)·8)` → 0–8 | synthetic demo value |
| `MODULE_USAGE` | 20 rows hand-authored (`views`, `sessions`, `avgTime`, `domain`) | static curated demo table |
| `API_ENDPOINTS` | 10 rows hand-authored (calls, p50/p95/p99, errors, status) | static curated demo table |

### 7.3 Calculation walkthrough

`USAGE_90D` is built once at load with the seeded PRNG and a weekday/weekend base plus a linear
growth trend. The `range` selector re-slices the tail; KPIs recompute as window means/sums.
`MODULE_USAGE` and `API_ENDPOINTS` are static and unaffected by the window; the domain pie derives
from `MODULE_USAGE` view sums.

### 7.4 Worked example

Window = last 7 days, with dau [40,44,41,13,12,45,47] and apiCalls totalling 150 000, errors 21:

| Output | Computation | Result |
|---|---|---|
| totalDau (mean) | (40+44+41+13+12+45+47)/7 = 242/7 | 35 |
| totalErrors | Σ | 21 |
| errorRate | 21/150000×100 | 0.014 % |

The two weekend days (13, 12) pull the mean DAU down — the `getDay()` weekend branch is the intended
signal in the demo series.

### 7.5 Data provenance & limitations

- **Entirely synthetic**: `sr(seed)=frac(sin(seed+1)×10⁴)` drives the 90-day series; the module and
  endpoint tables are hand-curated static rows. No real telemetry, GA4, or server-log ingestion.
- No session-stitching, cohort segmentation, or the guide's engagement index — those are aspirational.
- This is an internal product-analytics view; it displays no financial or risk quantity, so no
  production risk-model specification is warranted (§8 not triggered).

**Framework alignment:** GA4 Measurement Protocol / Mixpanel — referenced as the conceptual model for
event aggregation and DAU/MAU, but the page implements neither; metrics here are illustrative.

## 9 · Future Evolution

### 9.1 Evolution A — Real usage telemetry from the audit layer (analytics ladder: rung 1 → 4)

**What.** This is a product-analytics/observability module, not a climate-quant tool — it tracks module engagement, DAU, API volume, and latency. §7 flags that the guide's Module Engagement Score (`E = DAU × avg_session_depth / total_modules`) is never computed; the page shows raw aggregates over a *synthetic* 90-day series (`USAGE_90D.dau = baseUsers + trend + sr()`, `MODULE_USAGE` a static 20-row table) plus a hand-authored API-latency table. (Note: the atlas endpoint listing shows sanctions-screening routes, likely a mis-association — this module's real backing would be the audit layer, not sanctions.) The platform already captures every interaction. Evolution A wires real telemetry.

**How.** (1) Source usage from the platform's 18 `audit_*` tables (project memory confirms AuditMiddleware is always on, capturing everything) — materialized views over them give real DAU, per-module views, session depth, and API volume, exactly the roadmap's D4 "analytics warehouse posture" work. (2) Implement the documented Engagement Score (`E = DAU × avg_session_depth / total_modules`) from real session data, replacing the synthetic series. (3) Rung-4: the module-adoption view becomes a real "copilot deflection / low-adoption module" signal the roadmap names as a product-analytics goal, driving UX prioritisation (§1). Latency/error metrics come from real request logs.

**Prerequisites.** Materialized views over `audit_*` (D4 work); the Engagement Score formula is simple once session data is real. Remove the synthetic 90-day generator. **Acceptance:** DAU/views/latency compute from real audit data, not `sr()`; the Engagement Score is computed per the guide; low-adoption modules are identified from real usage.

### 9.2 Evolution B — Product-analytics copilot for the platform team (LLM tier 1 → 2)

**What.** A copilot for the product/data-team users §1 targets: "which modules have the lowest adoption this month?", "what's the DAU trend for the physical-risk domain?", "which endpoints have the worst p95 latency?", "where should we focus UX investment?" — grounded in real usage telemetry (post-Evolution-A) and the platform's own module atlas.

**How.** Tier 1 summarises usage from the (post-Evolution-A) real telemetry: system prompt from this Atlas page's §5 Engagement Score definition and the audit-derived metrics; the copilot identifies low-adoption modules and latency outliers with figures cited to the telemetry. Tier 2 adds cross-referencing: joining usage data with the module atlas (§6 shows 7-module blast radius / interconnection) to recommend where adoption gaps matter most, and — as this is meta-analytics over the whole platform — feeding the roadmap's Tier-4 data-flywheel curation (which modules generate the copilot traces worth training on). Fabrication validator matches every usage figure to the telemetry; the copilot must not report the synthetic fallback as real.

**Prerequisites.** Evolution A's real telemetry (analytics on demo data is meaningless); RBAC — usage analytics is admin-scoped. **Acceptance:** every usage/latency figure traces to audit-derived data; adoption recommendations cite real numbers; the copilot flags when data is synthetic fallback rather than live.