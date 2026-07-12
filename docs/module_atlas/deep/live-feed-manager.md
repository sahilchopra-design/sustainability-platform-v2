## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide states a weighted Feed Quality Score
> `FQS = w₁×Completeness + w₂×Timeliness + w₃×Accuracy` with z-score anomaly detection driving a
> "feed health traffic-light dashboard." **No such score, weighting scheme, or anomaly detector
> exists in the code.** There is also no live WebSocket/REST ingestion — every "refresh" and "test
> connection" action is a `setTimeout`-based simulation that writes a synthetic log row. Sections
> below document the code as it actually behaves.

### 7.1 What the module computes

An admin console for configuring (not actually executing) data-feed ingestion across 14 real stock
exchanges, backed by two real, correctly-documented external APIs — **EODHD** and **Alpha Vantage**
— plus India's BRSR (Business Responsibility & Sustainability Report) reference tables. The page's
"coverage," "freshness," and "field mapping" data are static/hand-entered; the "refresh," "bulk
refresh," and "test connection" actions are **simulated**, not real HTTP calls:

```js
simulateRefresh(exch) {
  setTimeout(() => {
    log = { records: floor(sr(_sc++)*50)+10, duration: `${(sr(_sc++)*3+0.5).toFixed(1)}s`, status:'success' }
  }, 2000);   // fixed 2s delay regardless of exchange
}
testConnection(type) {
  setTimeout(() => setter(apiKeys[type] ? 'connected' : 'error'), 1200);   // only checks key non-empty, no real API call
}
```

### 7.2 Parameterisation

| Construct | Detail | Provenance |
|---|---|---|
| `EXCHANGE_FEEDS` (14 exchanges) | NSE/BSE, NYSE/NASDAQ, LSE, XETRA, Euronext, TSE, HKEX, ASX, SGX, KRX, SSE/SZSE, B3, JSE, TSX — company counts, coverage %, field counts | Real exchange identity/codes; company counts and coverage percentages are plausible static figures, not live-measured |
| `EODHD_ENDPOINTS` / `AV_ENDPOINTS` | Real EODHD (fundamentals, EOD prices, bulk, live) and Alpha Vantage (daily, SMA, overview) API URL templates and rate limits | **Real, correctly documented** third-party API contracts |
| `FIELD_MAPPING` (24 rows) | Platform field → EODHD field → transform → availability % | Real EODHD schema field names (`Highlights.MarketCapitalization`, `ESGScores.totalEsg`, etc.) with plausible coverage percentages |
| `heatmapData` field-coverage matrix | 14 exchanges × 10 fields, hand-entered 0–100 values | Static demo values, directionally sensible (NSE/BSE highest at 95-98% reflecting BRSR mandate; JSE lowest at 10-30%) but not measured |
| `BRSR_TABLES` (6 tables) | Row counts, last sync date, status (synced/stale/sparse) | Static demo values |
| `eodhdCallsToday=47 / Max=100000`, `avCallsToday=12 / Max=500` | Hard-coded rate-limit gauge values | Static demo values, not a live API-usage counter |
| Simulated feed-log entries | `records = floor(sr(_sc++)×50)+10`, `duration = (sr(_sc++)×3+0.5)s` | Synthetic — `_sc` is a module-level auto-incrementing counter feeding the seeded PRNG, so successive simulated refreshes produce different-looking but still fabricated values |

### 7.3 Calculation walkthrough

- **Coverage %**: `coverage_pct = fields_covered / fields_total × 100`, pre-computed per exchange
  (fallback formula applied only if `coverage_pct` is missing from the static row).
- **Freshness**: `hours = (now − last_update) / 3,600,000` against a hard-coded reference time
  `2025-03-25T18:00:00Z` — meaning the "freshness" KPI is frozen relative to that fixed timestamp,
  not the browser's actual current time; `pendingUpdates = count(hours > 24)`.
- **KPI aggregates**: `totalCompanies = Σ companies`, `avgCoverage = mean(coverage_pct)`,
  `brsrCount = count(brsr_integrated)`, `avgFreshness = mean(hours)` — straightforward means/sums
  over the static 14-exchange array.
- **Simulated bulk refresh**: a `setInterval` ticks once per exchange every 400ms, updating a
  progress bar to 100% after 14×400ms=5.6s, then appends one synthetic "ALL (Bulk)" log entry with a
  hard-coded `duration:'18.4s'` regardless of how long the animation actually took.
- **API key masking**: `maskKey(k) = k.slice(0,4) + '****' + k.slice(-4)` — a real, simple masking
  utility; keys are persisted to `localStorage` (client-side only, not sent anywhere, and not
  encrypted at rest).

### 7.4 Worked example

Clicking "Refresh" on `NSE/BSE`: `simulateRefresh('NSE/BSE')` sets a 2-second loading state, then
appends `{ exchange:'NSE/BSE', records: floor(sr(1000)*50)+10, duration: (sr(1001)*3+0.5).toFixed(1)+'s', status:'success' }`.
`sr(1000) = frac(sin(1001)×10000)`; `sin(1001 rad) ≈ 0.8391` → `frac(8391.4) = 0.394` →
`records = floor(0.394×50)+10 = floor(19.7)+10 = 29`. This number has no relationship to how many
records NSE/BSE would actually return from a real EODHD bulk call.

### 7.5 Companion analytics

- **Field Mapping tab** — renders `FIELD_MAPPING` as a reference table; genuinely useful as
  documentation of the intended EODHD→platform schema crosswalk, even though no live sync uses it.
- **Error/Retry panel** — 2 hard-coded static error rows (JSE timeout, B3 rate limit); `retryFeed`
  clears the error and calls the same `simulateRefresh`, so "retrying" always succeeds after 2s
  regardless of the original (fictitious) error cause.
- **BRSR sync status table** — static reference rows with `synced`/`stale`/`sparse` status labels,
  not driven by any actual database row-count query.

### 7.6 Data provenance & limitations

- **No live data ingestion occurs anywhere in this module.** All "connection tests," "refreshes,"
  and "bulk refreshes" are client-side `setTimeout` simulations that fabricate plausible-looking
  success logs regardless of whether a real, valid API key is configured (the connection test does
  check for a non-empty key string, but never calls the actual EODHD/Alpha Vantage endpoint to
  validate it).
- Coverage percentages, field-mapping availability %, and the field-coverage heatmap are all static
  estimates, not measured from real ingested data.
- The freshness calculation anchors to a fixed historical timestamp (`2025-03-25T18:00:00Z`) rather
  than `Date.now()`, so the "freshness" KPI will silently become increasingly stale/meaningless as
  real time moves further from that fixed reference point.
- Guide-claimed anomaly detection (z-score outlier flagging) and the FQS composite score are entirely
  unimplemented.

**Framework alignment:** This module documents genuine, correctly-specified real-world API contracts
(EODHD, Alpha Vantage) and a real regulatory reporting standard (India's BRSR), which gives it
legitimate reference value as **API/schema documentation**. But it should not be read as a live data
governance or feed-quality monitoring tool — it is a UI mock-up of what such a console would look
like once real ingestion, quality scoring, and anomaly detection are wired in.
