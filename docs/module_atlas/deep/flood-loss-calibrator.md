## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most platform modules, this one is **not a model at all in its data layer** — it is a
live client for a real US government open-data API (FEMA OpenFEMA, `FimaNfipClaims` v2), which
it aggregates server-side into an empirical per-claim paid-loss distribution for a chosen state.
The page then lets the user enter their *own* modelled EP-curve points (return period → modelled
per-claim loss) and computes the percentage deviation between the model and the real observed
NFIP claims history — a genuine calibration/back-test workflow, not a simulation.

### 7.2 Live data acquisition (`openfema_claims.py`)

`GET /api/v1/openfema/claims-summary?state=XX&start_year=2005&end_year=2026` (the exact call the
page makes) pages through `https://www.fema.gov/api/open/v2/FimaNfipClaims` — a free, keyless,
public-domain API — filtering on `state` and `yearOfLoss`, ordered **most-recent-loss-year
first**, up to a politeness cap (`max_records`, default 20,000 = 2 pages of the API's 10,000-row
`$top` limit). Verified live during this review: the endpoint is genuinely reachable and
returns real records (confirmed by a direct HTTP call returning FL claims with
`floodEvent: "Hurricane Helene"`, non-null `amountPaidOn*Claim` fields, etc.). Responses are
cached in-process for 6 hours (`_CACHE_TTL_S = 6*3600`) to be polite to the free API.

Per-claim paid loss is defined exactly as:
```python
amt = amountPaidOnBuildingClaim + amountPaidOnContentsClaim + amountPaidOnIncreasedCostOfComplianceClaim
```
(building + contents + Increased Cost of Compliance — the standard NFIP claim components). The
server computes: paid-claim count, zero-paid count, total/mean/min/max paid, a fixed 9-bin
severity histogram ($0-5k up to >$1M), a linearly-interpolated percentile table (P10/25/50/75/
90/95/99 via `_percentile`, standard order-statistic interpolation), a by-year series, and the
top-10 named flood events by total paid loss.

### 7.3 Worked example — Florida, live-fetched during this review

Calling the real `claims_summary` aggregation pipeline directly (`state='FL',
start_year=2005, end_year=2026, max_records=20000` — the page's exact default parameters)
against the live OpenFEMA API returned:

| Metric | Live value |
|---|---|
| Total claims matching filter | **258,204** |
| Records actually fetched (politeness cap) | 20,000 → **`sample_truncated: true`** |
| Sample years actually covered | **2024–2026 only** (not the requested 2005–2026 window) |
| Paid claims in sample | 16,926 (3,074 zero-paid/closed without payment) |
| Total paid (sample) | $1,848,528,512 |
| Mean paid per claim | $109,212 |
| Max paid claim | $3,334,016 |
| P50 / P90 / P95 / P99 (per-claim paid) | $85,000 / $240,368 / $300,000 / $500,000 |

⚠️ **Real, live-verified limitation, not a hypothetical one:** because Florida alone has
258,204 matching claims in this window and the sample is capped at 20,000 records ordered
*most-recent-year-first*, the returned sample for FL covers **only loss years 2024-2026** even
though the UI requests 2005-2026. `sample_truncated: true` and `sample_years_covered` correctly
disclose this, and the KPI row shows "sampled {fetched_records}" instead of "full population" —
but a user who doesn't read the sub-label could easily assume the P99 of $500,000 reflects
20+ years of Florida hurricane history when it actually reflects only the last ~2 years
(2024-2026, which includes Hurricane Helene and Hurricane Milton claims — Helene alone
contributes $331.1M of paid losses in the unsampled full 5,000-record test run performed
separately during this review).

### 7.4 Modelled-vs-observed deviation (client-side)

```js
observed[Pxx] = pcts[`P${xx}`]   // from the live API response
deviation_pct = (modelled - observed) / observed * 100
```

Using the page's own `DEFAULT_MODEL` placeholder points (rp=2/P50/$8,000; rp=10/P90/$45,000;
rp=20/P95/$80,000; rp=100/P99/$200,000) against the live Florida percentiles fetched above:

| Return period | Percentile | Modelled | Observed (live FL) | Deviation |
|---|---|---|---|---|
| 1-in-2 | P50 | $8,000 | $85,000.00 | **−90.6%** |
| 1-in-10 | P90 | $45,000 | $240,368.20 | **−81.3%** |
| 1-in-20 | P95 | $80,000 | $300,000.00 | **−73.3%** |
| 1-in-100 | P99 | $200,000 | $500,000.00 | **−60.0%** |

All four deviations exceed the page's own ±50% red-flag threshold — a real, live demonstration
of exactly the failure mode the tool exists to catch: the placeholder "modelled" EP curve
dramatically **understates** per-claim severity relative to actual NFIP-observed Florida claims
at every percentile tested. (These placeholder numbers are explicitly labelled "not data" on the
page — the point of the worked example is to show the comparison mechanic working correctly
against genuinely fetched live data, not to claim the defaults are a real cat-model output.)

### 7.5 Data provenance & limitations

- **Fully live, no fabrication:** every KPI, histogram bar, and percentile on this page — when
  status is "Live" — comes directly from a real government API response aggregated server-side.
  There is no synthetic or seeded fallback data path in the summary itself; if the API is
  unreachable the page shows an explicit "OpenFEMA API did not respond" message and displays no
  numbers at all (verified in `FloodLossCalibratorPage.jsx` — the `status === 'demo'` branch
  renders only an error banner, never placeholder figures).
- **Per-claim, not per-portfolio:** the page's own copy and the API's own `source.note` field
  both explicitly state that these are *per-claim* paid-loss percentiles (building + contents +
  ICC), not a portfolio-level exceedance-probability curve — an important and correctly-flagged
  distinction for anyone tempted to plug P99 directly into a portfolio VaR calculation.
- **Sample-size/recency bias for high-volume states:** as demonstrated above for Florida, the
  20,000-record politeness cap combined with most-recent-first ordering means large states'
  samples can be dominated by a couple of recent catastrophic years rather than reflecting the
  full requested multi-decade window. Smaller states with fewer matching claims would not exhibit
  this truncation.
- **NFIP-specific:** paid claims reflect NFIP policy terms (coverage limits, deductibles) and
  building-code-era vintage of the insured stock — they are a real historical benchmark, but not
  a like-for-like proxy for uninsured or non-NFIP-insured flood losses.

**Framework alignment:** FEMA OpenFEMA NFIP Redacted Claims v2 dataset (public domain, OpenFEMA
Terms & Conditions, no API key) — the only "framework" here is the real, live NFIP claims
history itself, used as an empirical benchmark for cat-model calibration.

## 8 · Model Specification

**Status: implemented.** The OpenFEMA fetch/aggregation pipeline and the client-side deviation
calculator are both fully implemented and were verified live during this review (a direct call
to the FEMA API succeeded and returned real Florida claim records).

**8.1 Purpose & scope.** Give a cat-modelling or reserving team a fast, no-API-key way to sanity-
check a proprietary or vendor EP curve's per-claim severity assumptions against real historical
NFIP claims for a US state, at a handful of percentile checkpoints.

**8.2 Conceptual approach.** No modelling is performed by the platform itself — it is a
transparent aggregation of third-party public data (percentiles, histogram, top events) paired
with a simple, auditable deviation formula the user applies to their own external model outputs.

**8.3 Mathematical specification.**
```
paid_loss_per_claim = building_claim + contents_claim + ICC_claim
percentile(p) = linear-interpolated order statistic over sorted paid_loss_per_claim, p ∈ {10,25,50,75,90,95,99}
deviation_pct = (user_modelled_loss - observed_percentile) / observed_percentile × 100
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Paid-loss components | building+contents+ICC | Real OpenFEMA `FimaNfipClaims` fields |
| Percentile set | P10-P99 | Fixed by the route, standard severity checkpoints |
| Histogram bins | 9 fixed USD bands | Hand-set, $0-5k to >$1M |
| Politeness cap | 20,000 records/query | Hand-set to bound upstream API load |
| Deviation flag thresholds | ±20% amber, ±50% red | Hand-set in the frontend |

**8.4 Data requirements.** A 2-letter US state/territory code and a loss-year window — both
user-selected. No portfolio, asset, or entity data is required; this module deliberately trades
portfolio-specificity for a fast, keyless, always-real historical benchmark.

**8.5 Validation & benchmarking.** The module *is itself* a validation tool for external cat
models; there is no further validation layer on top of it. Its own correctness was verified in
this review by an independent direct call to the OpenFEMA API reproducing the exact aggregation
the backend performs.

**8.6 Limitations & model risk.** (1) Large states can return a severely time-truncated sample
under the default politeness cap (demonstrated above: FL's 20,000-record sample covered only
2024-2026 of the requested 2005-2026 window) — users should check `sample_truncated` and
`sample_years_covered` before treating the percentiles as a multi-decade benchmark. (2) NFIP paid
claims are policy-term-bound (coverage limits/deductibles) and cannot be extrapolated to
uninsured or non-NFIP flood losses without adjustment. (3) The comparison is single-metric
(percentile-to-percentile per-claim severity) — it does not calibrate claim *frequency*, spatial
distribution, or portfolio aggregation effects. (4) No retry/backoff or partial-failure handling
beyond a single try/catch is implemented for the upstream fetch; a slow or rate-limited OpenFEMA
response simply surfaces as "demo" mode with no data, which is the correct fail-safe (no
fabrication) but offers no automatic retry.
