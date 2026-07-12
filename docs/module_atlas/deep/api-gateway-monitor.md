## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes *real-time* gateway
> monitoring — live access-log aggregation, provider polling, circuit breakers, PagerDuty
> alerting, monthly SLA reports. **The page performs no monitoring.** It never calls the platform
> backend (whose real FastAPI routes it nominally represents); every endpoint, latency, error
> rate, client, throttle event and traffic curve is generated client-side by the seeded PRNG at
> module load. It is a *design mock of an API operations console* — a plausible registry of 2,302
> synthetic endpoints across 52 real platform domains. The sections below document the mock as
> coded.

### 7.1 What the module computes

The centrepiece is a generated **endpoint registry**:

```js
ENDPOINTS = Array.from({length: 2302}, (_, i) => {
  domain  = API_DOMAINS[floor(sr(i·3)·52)]           // 52 real platform domain names
  path    = `/api/v1/${slug(domain)}${PATTERN[floor(sr(i·7)·24)]}${SUB[floor(sr(i·11)·8)]}`
  method  = sr(i·13) < 0.5 ? GET : < 0.8 ? POST : < 0.92 ? PUT : DELETE
  avgResp = floor(sr(i·17)·800 + 20)                 // 20–820 ms
  errorRate = sr(i·19)·5                             // 0–5 %
  calls24h  = floor(sr(i·23)·5000 + 10)
  p50 = 0.6·avgResp;  p95 = 1.8·avgResp;  p99 = 3.2·avgResp
  successRate = 100 − errorRate
  health = errorRate > 3 ? 'red' : > 1 ? 'amber' : 'green'
})
```

with `sr(s) = frac(sin(s+1)×10⁴)`. Paths are assembled from 24 REST verb patterns
(`/list`, `/detail/{id}`, `/calculate`, `/simulate` …) and 8 sub-resources, so the registry *looks*
like the platform's actual API surface (the assignment's `route_files` such as
`api/v1/routes/adaptation_finance.py` are real, but never queried). Supporting seeds: 24-hour and
7-day traffic series, an HTTP status distribution (200/201/400/401/404/500), a hardcoded
geographic split (NA 42 %, EU 31 % …), 4 rate-limit tiers, a 40-row throttle log, 20 named API
clients with quota usage, a 5-version changelog, 4 deprecation notices and 10 webhook event types.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Method mix | GET 50 % / POST 30 % / PUT 12 % / DELETE 8 % | Hardcoded cutpoints on `sr(i·13)` |
| Latency percentile ratios | p50 = 0.6×, p95 = 1.8×, p99 = 3.2× mean | Fixed multipliers — a stylised right-skewed latency shape, not measured percentiles |
| Health rubric | error > 3 % red · > 1 % amber · else green | Demo thresholds |
| Rate limits | GET ∈ {100, 500, 1000}/min; mutating ∈ {50, 200, 500}/min | Random pick per endpoint |
| Client tiers | Basic 100/min · Professional 500/min · Enterprise 2000/min · Unlimited | Hardcoded tier table with burst = 1.5× |
| Deprecation probability | `sr(i·59) > 0.95` (~5 % of endpoints) | Random flag |
| Cacheable | GET and `sr(i·53) > 0.4` (~60 % of GETs) | Random flag |
| Geo distribution | NA 42/EU 31/APAC 15/LatAm 7/MEA 3/Other 2 % | Hardcoded literals |

### 7.3 Calculation walkthrough

1. **Endpoint Registry tab** — the 2,302 rows, filterable by domain/method/health and searchable
   by path; sortable columns; `TOP_ENDPOINTS` pre-sorts by `calls24h` (spread-before-sort).
   `domainStats` aggregates per-domain endpoint count, total calls, mean latency and error rate.
2. **Traffic Dashboard** — hourly requests/errors/latency (`TRAFFIC_24H`), weekly totals
   (`TRAFFIC_7D`), status-code distribution pie, method and health distributions, geo table.
3. **Rate Limiting & Throttling** — tier cards, the throttle log (client, tier, endpoint, Rate vs
   Burst limit type, blocked count), hourly rate-limit-hit bars per tier, and the 20-client usage
   table (`quotaUsed = 10–90 %`).
4. **API Documentation** — changelog, deprecation table (usage counts random), webhook event
   catalogue and auth notes.

There are no derived analytics beyond sums/means over the seeds — no SLA availability
computation, no p95 estimation from samples, no quota-vs-limit reconciliation (a client's
`reqToday` is drawn independently of its tier's `reqPerDay`).

### 7.4 Worked example (endpoint i = 1)

| Step | Computation | Result |
|---|---|---|
| Domain | `floor(sr(3)·52)` = floor(0.2073·52) = 10 | **Quantitative ESG** |
| Pattern | `floor(sr(7)·24)` = floor(0.9894·24) = 23 | `/config` |
| Sub-resource | `floor(sr(11)·8)` = floor(0.4634·8) = 3 | `/config` |
| Path | — | `/api/v1/quantitative-esg/config/config` |
| Method | `sr(13) = 0.9563` ≥ 0.92 | **DELETE** |
| avgResp | `floor(sr(17)·800 + 20)` = floor(0.2510·800 + 20) | **220 ms** (p95 = 396, p99 = 704) |
| errorRate | `sr(19)·5` = 0.9129·5 | **4.56 %** → health **red**, successRate 95.44 % |

(The doubled `/config/config` path illustrates that pattern and sub-resource draws can collide —
a cosmetic generation artefact visible in the registry.)

### 7.5 Data provenance & limitations

- **Everything is synthetic**: the page imports nothing from the backend and issues no fetches.
  The 52 domain names are the only reality anchor — they mirror the platform's actual API domain
  taxonomy, and the endpoint count (2,302) is of the same order as the platform's real route
  surface, but no individual row corresponds to a real route.
- Latency percentiles are fixed multiples of the mean; real percentile ratios vary by endpoint
  and load. Success rate is defined as `100 − errorRate`, conflating 4xx and 5xx.
- Rate-limit analytics don't close the loop (throttle log, hit counts and client quotas are
  independent draws), so no capacity conclusion can be drawn.
- A production version would ingest gateway access logs (or FastAPI middleware metrics), compute
  true availability `uptime/total`, sample-based p50/p95/p99, and alert on SLO burn rates.

### 7.6 Framework alignment

- **SLA/SLO practice (ITIL v4 / SRE)** — the guide's `Availability = uptime/total` and p95-based
  SLOs are the industry-standard formulations; the mock displays the vocabulary (tiers, quotas,
  retry-after headers in the changelog) without the measurements.
- **OpenAPI 3.0** — the registry's method/path/payload structure mirrors an OpenAPI catalogue;
  no spec document is generated or parsed.
- **RFC 7807 (Problem Details)** — cited in the guide; the changelog's "Improved error messages
  for 422 responses" nods to it, but response bodies are not modelled.
- **Rate limiting patterns** — tiered per-minute limits with burst allowances follow common API
  gateway design (token bucket semantics implied by "Rate" vs "Burst" limit-hit types).
