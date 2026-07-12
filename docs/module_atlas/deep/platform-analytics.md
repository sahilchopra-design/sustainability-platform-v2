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
