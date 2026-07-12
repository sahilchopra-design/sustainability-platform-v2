# Cross-Entity Dashboard
**Module ID:** `cross-entity-intelligence-dashboard` · **Route:** `/cross-entity-intelligence-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CW6 · **Sprint:** CW

## 1 · Overview
Platform KPIs, entity type comparison, 15×8 risk heatmap, alert center, and board pack generator.

**How an analyst works this module:**
- Platform KPIs shows aggregate statistics
- Risk Heat Map shows 15 entities × 8 topics
- Board Pack generates executive summary

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `Badge`, `Card`, `ENTITIES`, `ENTITY_TYPES`, `KPI`, `L1_TOPICS`, `TABS`, `TREND_DATA`, `TYPE_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ALERTS` | 7 | `type`, `entity`, `message`, `severity`, `date` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TREND_DATA` | `['Q1-25','Q2-25','Q3-25','Q4-25','Q1-26'].map((q,qi) => ({` |
| `avgByType` | `useMemo(() => ENTITY_TYPES.map(type => {` |
| `avgScores` | `L1_TOPICS.map((_,ti) => Math.round(ents.reduce((a,e)=>a+e.scores[ti],0)/ Math.max(1, ents.length)));` |
| `platformAvg` | `useMemo(() => Math.round(ENTITIES.reduce((a,e)=>a+e.scores.reduce((b,c)=>b+c,0)/8,0)/ Math.max(1, ENTITIES.length)), []);` |
| `heatMapData` | `useMemo(() => ENTITIES.map(e => ({ name:e.name, type:e.type, scores: Object.fromEntries(L1_TOPICS.map((t,i)=>[t,e.scores[i]])) })), []);` |
| `distData` | `useMemo(() => { const buckets = [{ range:'0-25', count:0 },{ range:'26-50', count:0 },{ range:'51-75', count:0 },{ range:'76-100', count:0 }];` |
| `avg` | `Math.round(e.scores.reduce((a,b)=>a+b,0)/8);` |
| `comparisonRadar` | `useMemo(() => L1_TOPICS.map((t,ti) => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERTS`, `ENTITY_TYPES`, `L1_TOPICS`, `TABS`, `TREND_DATA`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Entities Assessed | — | Platform | Across 3 entity types |
| Avg Score | — | Aggregation | Platform-wide average |

## 5 · Intermediate Transformation Logic
**Methodology:** Platform-wide KPI aggregation
**Headline formula:** `Aggregates across all assessed entities and all taxonomy topics`

Platform KPIs: entities assessed, taxonomy coverage %, avg score, distribution. Entity type comparison: FI avg vs Energy avg vs Corporate avg.

**Standards:** ['All platform modules']
**Reference documents:** All platform modules

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Wire the aggregator to real platform assessments (analytics ladder: rung 1 → 2)

**What.** EP-CW6 is honest about what it is — a platform-wide KPI aggregation shell,
with no guide↔code mismatch — but §7.5 states the gap plainly: it "is designed to
summarise real per-entity assessments from other platform modules but is not wired
to them", so the 15-entity roster and its 120 topic scores are seeded, the "94%
coverage" and "+1.3 improvement" KPIs are hard-coded strings, and alerts are static
narrative. Evolution A makes it the aggregation layer it claims to be: real
assessments in, real KPIs out.

**How.** (1) Assessment substrate: the platform already persists assessment runs in
several verticals (climate-risk `assessments`, insurance `insurance_climate_assessments`,
CRREM portfolios, company-profiles records) — define a thin
`entity_assessment_summary` view/table mapping each module's latest scores onto the
8 L1 topics per entity (the mapping table is the real work; the Atlas endpoint map
identifies the sources). (2) KPIs computed: coverage = entities with ≥1 real
assessment / roster size; improvement = quarter-over-quarter delta from stored
history — replacing both hard-coded values. (3) Alerts from a score-change detector
(threshold crossings, new controversy matches from `controversy-monitor`) instead of
6 static strings. (4) Board Pack renders the computed aggregates through the
report-studio layer.

**Prerequisites (hard).** The topic-mapping table across source modules (requires
those modules' assessments to be real — several are mid-remediation per their own §9
entries); seeded-roster purge. **Acceptance:** an entity with no real assessments
shows as uncovered rather than seeded-scored; re-running a source module's
assessment visibly updates the heatmap cell; the coverage KPI is reproducible as a
count.

### 9.2 Evolution B — Board-pack narrator over live aggregates (LLM tier 2 → 3)

**What.** The Board Pack tab is the natural home for the roadmap's desk-orchestration
output layer: an executive summary that a risk committee actually reads. Evolution B
drafts it from the (post-Evolution A) live matrix: the quarter's movers with the
source-module evidence behind each shift ("Shell's Climate topic fell 9 points —
driven by the stress-test module's Delayed Transition re-run"), concentration
observations from the distribution, and open alerts with their detector rationale —
every claim traced to a source module's assessment record, making this the
platform's first cross-module narrative surface.

**How.** Tier-2/3 pattern: read tools over the aggregation layer plus drill-down
calls into source-module endpoints via the Atlas interconnection map when a mover
needs explanation; the roadmap's provenance UX ("show work" with source modules and
engine versions) is essential because a board pack aggregates a dozen engines'
outputs. Rendering through report-studio; regeneration is deterministic for a frozen
assessment snapshot.

**Prerequisites (hard).** Evolution A (narrating seeded scores to a board is the
platform's nightmare scenario); source-module assessment persistence with
timestamps. **Acceptance:** every figure in a board pack traces to a named module's
stored assessment; movers' explanations cite the actual source run; entities without
data are listed as coverage gaps, not scored.