## 7 · Methodology Deep Dive

The guide names a *Provider Reliability Index* `PRI = (1 − ErrorRate) × AvailabilityPct ×
FreshnessScore` "computed daily from API error rates, uptime and freshness". **No PRI is computed in
the code.** This module is an operational control plane: a static registry of 21 sources (10 detailed
inline: EODHD, Alpha Vantage, Climate TRACE, World Bank, SEC EDGAR, ECB, UN PRI, CDP, MSCI, Bloomberg),
a field-mapping canvas with Levenshtein auto-match, an API request tester, pipeline templates, and
sync/error telemetry — the telemetry is `sr()`-seeded, not measured. The mismatch is that the guide
promises a reliability score that isn't there; the sections below document the real tooling.

### 7.1 What the module computes

The only genuine algorithm is **field-mapping similarity** (schema reconciliation):

```js
levenshtein(a, b)                                    // edit distance
similarity(a,b) = round((1 − levenshtein(al,bl)/maxLen) × 100)   // normalised %, case/punct-stripped
coverage = round(mappedTgt.size / tgtFields.length × 100)         // % of canonical columns mapped
```

Everything else is telemetry synthesis over the seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`:

```js
severity     = sr(base+i·7) > 0.7 ? 'ERROR' : > 0.3 ? 'WARN' : 'INFO'
statusCode   = sr(base·3) > 0.85 ? 500 : sr(base·7) > 0.9 ? 400 : 200
responseTime = 40 + sr(base·11)·350   // ms
records      = 40 + sr(i·7+…)·160 ; errors = sr(i·13)·4
qualityData  = {freshness: 80+sr·20, completeness: 85+sr·15, nullRate: sr·8}
syncHistory  = 14-day sparkline of records/errors per source
```

### 7.2 Registry & parameterisation

| Element | Value | Provenance |
|---|---|---|
| Sources (detailed) | 10 real APIs w/ baseUrl, authType, rateLimit | real vendor endpoints (`SOURCES`) |
| Sources (total) | 21 | registry count |
| Test scenarios | 11 | canned request specs (`TEST_SCENARIOS`) |
| Engine lineage | 9 engine→table→source rows | `ENGINE_LINEAGE` (real platform wiring) |
| Pipeline templates | 16 | `PIPELINE_TEMPLATES` |
| Rate limits | e.g. EODHD 1240/5000, Bloomberg 45000/100000 | plausible static values |
| Mock headers | `X-RateLimit-Remaining = sr·500`, `X-RateLimit-Limit = 1000` | synthetic |

Source records (baseUrl, authType — API Key / OAuth2 / Certificate / User-Agent / Bearer / None) are
real and correct for each provider; the live status (`active/warning/inactive`) and lastSync are
static seed values.

### 7.3 Calculation walkthrough

The **mapping canvas** is the substantive workflow: user picks a source schema and the canonical
target; for each source field the tool suggests the best target by max `similarity()`; user confirms
mappings; `coverage` reports how much of the canonical schema is filled; export produces a JSON config
`{source, target, mappings:[{source_field, target_column, transform, confidence}], created_at}`. The
**API tester** replays a `TEST_SCENARIO` and renders a synthesised response (status/latency/headers/
body, the body mutating numeric samples by `±10%` via `sr`). The **sync/error/quality** tabs render
seeded telemetry.

### 7.4 Worked example

Mapping EODHD's `General.MarketCapitalization` to canonical `market_cap_usd_mn`:
strip to `generalmarketcapitalization` (28 chars) vs `marketcapusdmn` (14). Levenshtein ≈ 18,
`maxLen = 28`, `similarity = round((1 − 18/28)×100) = round(35.7) = 36%` — a weak match, so the tool
would rank a better candidate higher or leave it for manual mapping. A tester call to a scenario with
`base·3` drawing 0.90 returns `statusCode 500`, `responseTime = 40 + sr(base·11)·350 ≈ 215 ms`.

### 7.5 Data provenance & limitations

- Source list, endpoints, auth types and the engine-lineage map are **real**; all *dynamic*
  telemetry (status codes, latency, error logs, sync sparklines, quality scores, rate-limit
  remaining) is **synthetic**, seeded by `sr()`. No live API calls are made.
- The PRI the guide describes is absent — there is no error-rate/uptime/freshness composite.
- Field-mapping similarity is a real edit-distance heuristic but semantically blind
  (`Highlights.Revenue` vs `revenue_usd_mn` scores low despite being the same concept); production
  schema-matching would use a synonym/ontology layer.

**Framework alignment:** ISO/IEC 25012 (data quality model) — the quality tab's freshness/
completeness/null-rate dimensions echo its accuracy/completeness/currentness characteristics, though
here they are seeded not measured. PCAF source hierarchy underlies the intended provider-priority
feed into reconciliation (this manager is where priority ranks *would* be set). ESMA's ESG-rating-
provider guidelines motivate the registry's licensing/credential governance framing.
