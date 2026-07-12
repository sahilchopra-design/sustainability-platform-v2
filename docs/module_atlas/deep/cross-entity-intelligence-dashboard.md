## 7 · Methodology Deep Dive

The MODULE_GUIDES entry (EP-CW6) is honest and matches the code: this is a *platform-wide KPI
aggregation* dashboard — it "aggregates across all assessed entities and all taxonomy topics." No
guide↔code mismatch. The only caveat is that the 15 entities and their 8 topic scores are **seeded
synthetic data**, not live assessments pulled from the platform's other modules.

### 7.1 What the module computes

A fixed roster of 15 named entities (JPMorgan, Shell, Microsoft, …) across 3 types (FI / Energy /
Corporate). Each entity has 8 L1-topic scores generated from a type-anchored base plus seeded
jitter:

```js
base   = type==='FI' ? 68 : type==='Energy' ? 48 : 72        // Corporate highest, Energy lowest
scores = L1_TOPICS.map((_,ti) => round(base + (sr(i·23 + ti·10)·2 − 1)·18))   // base ± 18
```

Everything else is aggregation over that 15×8 matrix:

```js
avgByType[type].scores[ti] = round(Σ_ents scores[ti] / count)     // per-type topic mean
platformAvg = round(Σ_entities (Σ scores / 8) / 15)               // grand mean
distData    = histogram of per-entity mean into 0-25/26-50/51-75/76-100 buckets
comparisonRadar[topic] = {FI, Energy, Corporate} per-type topic means
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Value / formula | Provenance |
|---|---|---|
| Entity count | 15 (5 per type) | fixed demo roster |
| Type base scores | FI 68 · Energy 48 · Corporate 72 | hand-set demo anchors |
| Score jitter | `(sr(i·23+ti·10)·2 − 1)·18` → ±18 | synthetic seeded |
| L1 taxonomy | 8 topics: E, S, G, Climate, Biodiversity, Supply Chain, Human Rights, Innovation | curated taxonomy |
| Taxonomy coverage KPI | **94%** hard-coded | static demo value |
| Quarterly improvement | **+1.3** hard-coded | static demo value |
| Trend series | `FI 65+qi·1.2 · Energy 45+qi·1.8 · Corporate 70+qi·1.0` | linear synthetic ramps |
| 6 ALERTS | narrative strings with severity | hand-authored demo alerts |

The type ordering (Energy weakest on ESG, Corporate strongest) is a deliberate stylised fact but
carries no calibration.

### 7.3 Calculation walkthrough

Entities generated once at module load. `avgByType` groups by type and means each topic column;
`platformAvg` means all 15 entities' overall scores; `distData` bins entity means into 4 buckets;
`comparisonRadar` pivots type-means into a per-topic radar. The Heat Map tab renders the raw 15×8
scores; Alert Center lists the 6 static alerts (dismissible in local state); Trend tab plots the
linear `TREND_DATA`; Board Pack composes these into an executive summary.

### 7.4 Worked example (platform average)

With 15 entities of mixed type, each entity's overall = mean of its 8 topic scores (≈ its `base`
± small seeded drift). Five FIs (~68), five Energy (~48), five Corporate (~72):
```
platformAvg ≈ round((5·68 + 5·48 + 5·72) / 15) = round((340+240+360)/15) = round(62.7) = 63
```
matching the guide's stated "Avg Score ≈ 55–63" band. A single entity's topic score, e.g. entity 0
(JPMorgan, FI) topic 0: `round(68 + (frac(sin(24)×10⁴)·2 − 1)·18)` ≈ 68 ± up-to-18.

### 7.5 Data provenance & limitations

- **All 15 entities and 120 topic scores are synthetic** (`sr()` PRNG); the KPIs "94% coverage" and
  "+1.3 improvement" are hard-coded, not aggregated.
- The dashboard is designed to summarise real per-entity assessments from other platform modules but
  is **not wired to them** — it uses the internal roster instead.
- Alerts are static narrative, not generated from any score-change detector.

**Framework alignment:** references "all platform modules" only — it is an aggregation shell over the
platform's own ESG taxonomy (8 L1 topics) rather than an external standard. If wired to live data it
would surface the platform's TCFD/ISSB/CSRD scores per entity.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Entity scores, coverage and improvement KPIs
are seeded/hard-coded; no live aggregation layer exists.

**8.1 Purpose & scope.** Produce a governance-grade, cross-entity ESG scorecard by aggregating each
entity's *real* topic assessments already computed elsewhere on the platform, with drill-down,
alerting on material score changes, and a board pack export.

**8.2 Conceptual approach.** A read-only **aggregation & alerting layer** over the platform's canonical
per-entity scores — architecturally an internal "portfolio roll-up," mirroring how **MSCI ESG Manager**
and **Bloomberg ESG** roll issuer scores to portfolio dashboards. Change-detection uses a simple
statistical-process-control rule (score move > k·σ triggers an alert).

**8.3 Mathematical specification.**
```
TypeAvg_{type,topic} = (1/N_type) Σ_{e∈type} Score_{e,topic}      # weight by AUM/exposure if available
PlatformAvg = Σ_e w_e·(mean_topic Score_{e,topic}) / Σ_e w_e      # w_e = exposure weight
Coverage%   = (assessed topic-cells) / (entities × topics) × 100
Alert_e,topic if |Score_t − Score_{t−1}| > max(k·σ_topic, δ_min)  # k≈2, δ_min≈4 pts
```

| Parameter | Source |
|---|---|
| `Score_{e,topic}` | platform module outputs (TCFD/ISSB/CSRD/DME engines) |
| `w_e` (weight) | portfolio exposure / AUM (portfolio context) |
| `σ_topic` | historical score volatility per topic |
| `k, δ_min` | governance policy (alert sensitivity) |

**8.4 Data requirements.** Canonical per-entity, per-topic scores with timestamps and a coverage flag;
exposure weights; score history for σ. All already exist across platform engines and the portfolio
context; the missing piece is the aggregation query, not new data.

**8.5 Validation & benchmarking.** Reconcile roll-up means to source-module scores (no drift);
verify coverage matches actual assessed cells; backtest alert rule against known historical
deteriorations (e.g. an issuer downgrade quarter). Benchmark presentation vs MSCI ESG Manager
portfolio views.

**8.6 Limitations & model risk.** Equal-weight vs exposure-weight materially changes the headline;
alert thresholds trade false positives against missed moves; stale source data silently biases the
roll-up. Fallback: display coverage prominently and grey-out entities with stale inputs.
