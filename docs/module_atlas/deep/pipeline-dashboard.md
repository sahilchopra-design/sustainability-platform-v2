## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide names a "Pipeline Health Score" formula
> `H = (successful_runs/total_runs) × (1 − error_rate)`. **The code does not compute `H`.** It
> computes a plain success rate (`successCount/total×100`) with no error-rate multiplier, and
> displays it directly as "Live Success %". The rest of the guide's operational framing (data
> pipeline monitoring) matches the code closely.

### 7.1 What the module computes

This is an operations/observability tool, not a climate-risk quant module — it monitors 6 named
ETL pipelines (BRSR enrichment, IEA pathways sync, NGFS scenario seed, nature-risk loader, PCAF
WACI calc, regulatory monitor) feeding the rest of the platform.

```js
liveSuccessRate = filtHistBase.length
  ? (successCount / filtHistBase.length) × 100
  : stats.success_rate_pct                                    // fallback to seeded 94.6%
liveP95 = sortedDurations[floor(sortedDurations.length × 0.95)]  // empirical 95th percentile
slowRuns = filtHistBase.filter(r => r.duration_ms > durationThreshold).length
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `DEMO_STATS.success_rate_pct` | 94.6% | Synthetic seed, `data_source: 'memory_fallback'` |
| `DEMO_STATS.total_runs_30d` | 186 | Synthetic seed |
| Default success threshold | 90% | UI default, user-adjustable 80–100% |
| Default duration alert | 10,000ms | UI default, user-adjustable 1–30s |

### 7.3 Calculation walkthrough

1. On load, the page attempts `GET /api/v1/data-pipeline/dashboard` and `/history` — if the backend
   responds with `total_runs_30d`, it overwrites the `DEMO_STATS` seed; on failure it silently keeps
   the seed values (`catch {}`).
2. When a pipeline is manually triggered, outcome is decided by
   `sr(_sc++) > 0.15 ? 'success' : 'failed'` — an **85% simulated success rate**, independent of the
   pipeline's actual backend state, purely for UI demo purposes. A fabricated log stream
   (`genLogLines`) is typed out with `350+sr()×200`ms delays between lines.
3. `liveP95` is a genuine empirical percentile computed from whatever run-history rows are currently
   in state (real formula, applied to either live or seeded data).
4. `dayBuckets`/`trendData` group history rows by calendar day for the 14-day success/failure area
   chart — real aggregation logic over whatever `history` array is populated.

### 7.4 Worked example

20 seeded history rows, 2 marked `'failed'` at indices 2 and 9, 1 `'partial'` at index 5 → with no
filters, `filtHistBase.length=20`, `successCount=17` (indices not 2/5/9), `liveSuccessRate =
(17/20)×100 = 85.0%`. If `successThreshold=90`, the KPI renders red ("⚠ Below threshold") since
85.0 < 90.

### 7.5 Companion analytics
Regulatory-basis bar cites 3 real frameworks (RBI Data Governance Guidelines 2021, SEBI BRSR Filing
SLA, PCAF WACI Data Lineage) purely as descriptive context — no calculation ties pipeline health to
these frameworks' specific requirements.

### 7.6 Data provenance & limitations

- **Trigger outcomes and log streams are entirely fabricated** (`sr()`-seeded 85% success rate,
  scripted log lines) — clicking "Trigger" does not reflect real pipeline execution unless the
  backend `/trigger` POST succeeds and the page is later refreshed from `/history`.
- `DEMO_STATS`/`DEMO_HISTORY` fall back silently on any API error, so a broken backend connection is
  indistinguishable from a healthy one showing demo data — no error banner is shown to the user.
- P95 latency and success-rate KPIs use correct statistical formulas; the risk is entirely in the
  *inputs* (seeded vs. real), not the aggregation logic itself.

## Framework alignment

This module does not implement a climate-risk or financial-risk framework — it is an internal data
platform reliability tool. Its regulatory citations (RBI 2021, SEBI BRSR, PCAF) describe *why*
pipeline freshness matters for downstream disclosures, not a modelled requirement the page checks
against.
