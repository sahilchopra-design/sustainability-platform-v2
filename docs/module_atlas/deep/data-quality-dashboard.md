## 7 · Methodology Deep Dive

The guide describes *multi-dimensional DQ scoring* `DQ_overall = 0.35·Coverage + 0.25·Timeliness +
0.25·Accuracy + 0.15·Consistency`. The code implements a **weighted multi-dimension average over data
sources**, and the dimension framework, weights and RAG thresholds are genuine — but the per-source
`completeness`/`accuracy`/`timeliness`/`consistency`/`uniqueness` values are **`sr()`-seeded**
(`completeness = min(99.5, 65 + sr(i·31)·35)`), and the 52-rule validation library is a curated
reference list, not executed against live data. So the aggregation logic is real; the inputs are
synthetic. Minor mismatch flag: seeded source metrics.

### 7.1 What the module computes

```js
overallQuality.completeness = avg(DATA_SOURCES, s => s.completeness)   // and 4 more dims
overallQuality.overall      = avg(DATA_SOURCES, s => (comp+acc+time+cons+uniq)/5)
domainHeatmap[domain]       = per-dimension averages over that domain's sources
freshnessSLA: maxLag = {Real-time:5, Hourly:60, Daily:1440, Weekly:10080, Monthly:43200, …} min
nullRate = sr(recordCount·31 + fi·17)·0.3 ;  fill = 100 − nullRate·100
```
The freshness SLA lag thresholds (5 min real-time … 525,600 min annual) are correct conversions; the
DQ dimension weights and RAG cut-offs are genuine; the source metrics feeding them are seeded.

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| DQ weights (guide) | Coverage 0.35 / Timeliness 0.25 / Accuracy 0.25 / Consistency 0.15 | curated (PCAF/ISO-informed) |
| Per-source completeness | `min(99.5, 65 + sr(i·31)·35)` | synthetic seeded |
| Per-source accuracy | `min(99.8, 70 + sr(i·37)·30)` | synthetic seeded |
| Freshness SLA lags | 5 / 60 / 1440 / 10080 / 43200 / 129600 / 525600 min | **real** unit conversions |
| Null rate | `sr(...)·0.3` (0–30%) | synthetic seeded |
| Validation rules | 52 rules (e.g. weights sum 0.99–1.01, physical risk 0–10) | **real** curated rule library |
| RAG thresholds | coverage <50% red; provider Δ >20pts amber | curated alert cuts |

### 7.3 Calculation walkthrough

`DATA_SOURCES` (seeded per-dimension metrics) → `overallQuality` averages each dimension and the
5-dimension mean → `domainHeatmap` groups by domain → `radarData` maps dimensions → `qualityAlerts`
flags sources whose 5-dim mean is below threshold → `freshnessSLA` compares each source's refresh
cadence against its SLA lag → null-rate/fill per column. All arithmetic is real averaging; the inputs
are seeded.

### 7.4 Worked example (overall DQ)

Three sources with seeded completeness 90/82/95 and accuracy 88/79/93:
```
avg completeness = (90+82+95)/3 = 89.0
avg accuracy     = (88+79+93)/3 = 86.7
overall (5-dim mean per source, then avg) ≈ mean of the per-source (comp+acc+time+cons+uniq)/5
```
A source refreshing daily (SLA 1440 min) last updated 2000 min ago → breaches freshness (2000 > 1440)
→ amber alert. The SLA arithmetic and averaging are correct; the 90/82/95 completeness figures are
`sr()`-generated.

### 7.5 Data provenance & limitations

- **DQ dimension framework, weights, SLA thresholds and the 52-rule validation library are real** and
  well-specified.
- **Per-source completeness/accuracy/timeliness/consistency/uniqueness and null rates are seeded** via
  `sr()`; the rule library is not executed against live records here.
- Provider-divergence "consistency" is a seeded number, not an actual MSCI-vs-Sustainalytics compare.

**Framework alignment:** PCAF Data Quality Scale 1–5 · ISO 8000 · DAMA DMBOK dimensions. The scoring
structure and freshness SLAs faithfully mirror these; the data feeding them is a seeded placeholder.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Source DQ metrics are seeded; the validation
library is not run against live data.

**8.1 Purpose & scope.** Platform-wide DQ visibility across coverage, timeliness, accuracy, consistency
and uniqueness for every ESG source, with RAG alerting and substitution auditing.

**8.2 Conceptual approach.** Execute the (existing) 52-rule library against live records and derive each
dimension empirically — the Great Expectations / Soda Core pattern — rolling to source, domain and
platform. PCAF tiering for GHG coverage.

**8.3 Mathematical specification.**
```
Coverage_src   = holdings_with_primary_data / total_holdings        # per metric
Accuracy_src   = 1 − rule_failures / rule_checks                    # from 52-rule library
Timeliness_src = clamp(0,1, 1 − age / SLA_lag(cadence))             # from real timestamps
Consistency    = 1 − |provider_A − provider_B| / tolerance          # cross-provider
DQ_overall = 0.35·Cov + 0.25·Time + 0.25·Acc + 0.15·Cons
```

| Parameter | Source |
|---|---|
| Rule library | module (52 rules, real) |
| Timestamps | ingestion metadata |
| Provider values | multi-source hub |
| Coverage denominator | portfolio holdings |

**8.4 Data requirements.** Live records per source, timestamps, provider tags, holdings. Rule library
and SLA thresholds already exist. Sources: data-hub ingestion.

**8.5 Validation & benchmarking.** Reconcile computed coverage to holdings; verify rule failures match
known bad records; benchmark against PCAF tier distribution.

**8.6 Limitations & model risk.** Coverage denominators depend on a defined universe; consistency
tolerances are metric-specific. Fallback: show raw rule-failure counts alongside derived scores.
