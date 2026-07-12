# Data Quality Dashboard
**Module ID:** `data-quality-dashboard` · **Route:** `/data-quality-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Platform-wide ESG data quality monitoring. Coverage rates, timeliness scores, source reliability, substitution logic audit, and data lineage visualisation.

> **Business value:** ESG data quality is the foundation of credible sustainable investment. Poor-quality data (stale, incomplete, inconsistent) undermines investment decisions, regulatory reports, and client communications. This dashboard provides continuous visibility into data quality and drives systematic improvement.

**How an analyst works this module:**
- Coverage Overview shows metric-by-metric data availability
- Timeliness Monitor flags data points older than threshold
- Provider Comparison shows divergence heatmap across 5 ESG raters
- Substitution Audit shows where proxies were applied
- Lineage Viewer traces any metric to its original source data

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DATA_SOURCES`, `DB_TABLES`, `DOMAINS`, `MONTHS`, `QUALITY_DIMS`, `TABS`, `VALIDATION_RULES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `VALIDATION_RULES` | 52 | `id`, `name`, `field`, `condition`, `severity` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,s)=>arr[Math.floor(sr(s)*arr.length)];` |
| `rng` | `(min,max,s)=>min+sr(s)*(max-min);` |
| `rngI` | `(min,max,s)=>Math.floor(rng(min,max,s));` |
| `cols` | `Array.from({length: rngI(8,35,i*113)},(_,j)=>({` |
| `monthlyQuality` | `MONTHS.map((m,i)=>({` |
| `fmtPct` | `(v) => v.toFixed(1) + '%';` |
| `fmtK` | `(v) => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(1)+'K' : String(v);` |
| `mins` | `Math.floor((Date.now() - new Date(iso).getTime())/60000);` |
| `overallQuality` | `useMemo(()=>{ const avg = (arr, fn) => arr.reduce((s,x)=>s+fn(x),0)/arr.length;` |
| `domainHeatmap` | `useMemo(()=>{ return DOMAINS.map(domain => { const sources = DATA_SOURCES.filter(s=>s.domain===domain);` |
| `avg` | `(fn) => sources.reduce((s,x)=>s+fn(x),0)/sources.length;` |
| `radarData` | `useMemo(()=> QUALITY_DIMS.map(d=>({ dim:d, value:overallQuality[d.toLowerCase()] })),[overallQuality]);` |
| `qualityAlerts` | `useMemo(()=>{ return DATA_SOURCES.filter(s=>{ const avg = (s.completeness+s.accuracy+s.timeliness+s.consistency+s.uniqueness)/5;` |
| `aAvg` | `(a.completeness+a.accuracy+a.timeliness+a.consistency+a.uniqueness)/5;` |
| `bAvg` | `(b.completeness+b.accuracy+b.timeliness+b.consistency+b.uniqueness)/5;` |
| `freshnessSLA` | `useMemo(()=>{ const types = ['Real-time','Hourly','Daily','Weekly','Monthly','Quarterly','Annual'];` |
| `maxLag` | `t==='Real-time'?5:t==='Hourly'?60:t==='Daily'?1440:t==='Weekly'?10080:t==='Monthly'?43200:t==='Quarterly'?129600:525600;` |
| `nullR` | `sr(s.recordCount*31+fi*17)*0.3;` |
| `fill` | `100 - c.nullRate*100;` |
| `ageMins` | `Math.floor((Date.now()-new Date(s.lastRefresh).getTime())/60000);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DB_TABLES`, `DOMAINS`, `MONTHS`, `PIE_COLORS`, `QUALITY_DIMS`, `TABS`, `VALIDATION_RULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Overall DQ Score | — | Composite | Platform-wide weighted data quality score |
| Coverage Red Zone | — | Alert threshold | Metrics with below-minimum data coverage |
| Provider Disagreement | — | Amber threshold | MSCI vs Sustainalytics score difference triggering review |
- **Raw ESG data feeds** → DQ assessment algorithms → **Quality scores per metric**
- **Quality scores** → Traffic light classification → **Alert dashboard**
- **DQ monitoring** → Substitution decisions → **Best-available data selection**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-dimensional DQ scoring
**Headline formula:** `DQ_overall = 0.35×Coverage + 0.25×Timeliness + 0.25×Accuracy + 0.15×Consistency`

Coverage: % holdings with primary data per metric. Timeliness: months since last update. Accuracy: provider disagreement rate. Consistency: longitudinal stability. Red/amber/green traffic lights per data dimension.

**Standards:** ['PCAF DQ Scale', 'ISO 8000 Data Quality', 'DAMA DMBOK']
**Reference documents:** PCAF Data Quality Scale 1-5; ISO 8000 Data Quality Standard; DAMA Data Management Body of Knowledge

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Execute the rule library against live records (analytics ladder: rung 1 → 2)

**What.** §7's assessment: real aggregation machinery — genuine DQ weights, correct
freshness-SLA unit conversions, RAG thresholds, and a curated 52-rule validation
library — over seeded inputs: per-source
completeness/accuracy/timeliness/consistency/uniqueness are `sr()` draws
(`min(99.5, 65 + sr·35)`), null rates are seeded, and the rule library "is not
executed against live data". The sibling `data-quality-monitor` already proves the
pattern works — its rule engine runs on real company records. Evolution A executes
this module's 52 rules for real and senses the source metrics.

**How.** (1) Rule execution: run the 52-rule library (weights-sum bounds,
range checks, referential rules) against the platform's actual tables —
`portfolios_pg`, the company master, captured records — on a schedule, persisting
violations to a `dq_violations` table; accuracy per source becomes a violation
rate, not a seed. (2) Completeness from real field-presence queries per source
table (the `DB_TABLES` registry names them); null rates measured. (3) Timeliness
from table update timestamps against the module's already-correct SLA lags.
(4) Consistency: an actual cross-provider comparison where the platform has
overlap (BRSR vs enrichment values in `company-profiles`) — replacing the seeded
divergence. (5) Division of labor with siblings: this dashboard is the
platform-wide roll-up; `data-quality-monitor` stays the per-company engine;
`data-governance` consumes both — one violations store underneath all three.

**Prerequisites (hard).** Seed purge; the shared `dq_violations` store; scheduled
execution (the ingestion framework's scheduler pattern). **Acceptance:** inserting
a deliberately invalid record raises a violation within one cycle and moves the
source's accuracy; the freshness panel flags a genuinely stale table; the 52 rules
each show a last-executed timestamp.

### 9.2 Evolution B — DQ root-cause investigator (LLM tier 2)

**What.** A dashboard shows *which* source degraded; stewards need *why*.
Evolution B: when a dimension drops, the investigator drills by tool call — which
rules started failing (violations store), which fields drive the null-rate change,
whether an ingester run correlates (sync logs), whether one provider or one
entity-batch explains it — and drafts the root-cause note with the remediation
recommendation drawn from the module's own gap-plan conventions (e.g. "scope gaps
→ BRSR supplement"), every claim citing a query result.

**How.** Tier-2 read-only tools over the violations store, source metrics, and
sync telemetry; grounding is this Atlas record plus the rule library's definitions
(each rule's intent is documented — the investigator explains failures in the
rule's own terms). The correlational-humility rule from the ops-copilot pattern
applies: suspected cause, human confirmation. Notes feed the steward workflow in
`data-governance`.

**Prerequisites (hard).** Evolution A's live execution (root-causing seeded
metrics is meaningless); violations history depth for trend claims.
**Acceptance:** for a constructed degradation (corrupt one source's batch), the
investigator identifies the batch and the failing rules; every number in the note
reproduces from the stores; recommendations map to documented gap-plan options.