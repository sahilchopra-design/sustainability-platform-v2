# Data Source Registry
**Module ID:** `data-source-registry` · **Route:** `/data-source-registry` · **Tier:** B (frontend-computed) · **EP code:** EP-CS3 · **Sprint:** CS

## 1 · Overview
24 reference data sources with quality monitoring, coverage gap identification, and new source recommendations.

**How an analyst works this module:**
- Source Catalog shows all 24 sources with quality badges
- Coverage Gaps identifies uncovered taxonomy nodes
- New Source Identifier recommends additional public data

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DQ_COLORS`, `DQ_LABELS`, `INTEGRATION_LOG`, `RECOMMENDED_SOURCES`, `TABS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `RECOMMENDED_SOURCES` | 9 | `type`, `coverage`, `gap`, `quality` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `status` | `statuses[Math.floor(sr(i * 7) * 5)];` |
| `coverageGaps` | `useMemo(() => { return leaves.filter(l => !l.dataSources \|\| l.dataSources.length === 0 \|\| (l.quality && l.quality >= 4)).slice(0, 25).map(l => ({ code: l.code, name: l.name, quality: l.quality \|\| 5, issue: (!l.dataSources \|\| l.dataSources.length === 0) ? 'No primary source' : 'Low quality (DQ4+)', }));` |
| `refreshData` | `useMemo(() => REFERENCE_DATA_SOURCES.map((s, i) => {` |
| `freq` | `freqs[Math.floor(sr(i * 7) * 5)];` |
| `daysAgo` | `Math.floor(sr(i * 11) * 90);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `RECOMMENDED_SOURCES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sources | — | Registry | CDP, SBTi, IEA, WRI GPPD, etc. |
| Avg Quality | — | PCAF scale | 1=best, 5=worst |

## 5 · Intermediate Transformation Logic
**Methodology:** Data quality assessment
**Headline formula:** `DQ_composite = avg(completeness, timeliness, accuracy, coverage)`

24 sources assessed on 4 quality dimensions. Coverage gaps identify taxonomy L4 nodes without a primary data source.

**Standards:** ['PCAF DQ 1-5']
**Reference documents:** PCAF Data Quality Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide promises a *Data Quality assessment* `DQ_composite = avg(completeness, timeliness, accuracy,
coverage)` over "24 sources". The code implements a lighter version: it reads `REFERENCE_DATA_SOURCES`
and the `TAXONOMY_TREE` leaf nodes' pre-assigned PCAF quality scores, derives a DQ distribution, finds
uncovered/low-quality taxonomy nodes, and simulates a refresh/integration log. There is no live
4-dimension composite; DQ comes pre-baked on the taxonomy leaves. This is a governance dashboard, not
a scoring engine — no ⚠️ mismatch is raised because the guide itself is modest, but note the composite
formula is not computed here.

### 7.1 What the module computes

```js
leaves = getLeafNodes()                       // taxonomy L4 nodes, each carrying .quality (PCAF 1–5) + .dataSources
dqDistribution = count leaves by l.quality (1..5)
coverageGaps   = leaves.filter(l => !l.dataSources?.length || l.quality >= 4).slice(0,25)
refreshData    = REFERENCE_DATA_SOURCES.map(sr-driven frequency/lastRefresh/records + overdue flag)
INTEGRATION_LOG = 20 synthetic pull events (status/records/duration via sr())
```

- **DQ distribution** groups leaf nodes by their embedded PCAF quality score (1 = Reported/best …
  5 = Proxy/worst) with fixed colour + label maps (`DQ_LABELS`, `DQ_COLORS`).
- **Coverage gaps** = leaves with *no* data source OR quality ≥ 4 (DQ4 Modelled / DQ5 Proxy), capped
  at 25, tagged `HIGH` if DQ5 else `MEDIUM`.
- **Refresh status** = each source given a synthetic frequency and "days ago"; `overdue` if the lag
  exceeds the cadence (Daily>2d, Weekly>10d, Monthly>35d).

### 7.2 Parameterisation / rubric

| Element | Values | Provenance |
|---|---|---|
| PCAF DQ labels | 1 Reported · 2 Verified · 3 Estimated · 4 Modelled · 5 Proxy | PCAF Data Quality Hierarchy (financed-emissions scoring) |
| DQ colours | green→red ramp | UI convention |
| Gap trigger | `no dataSources` OR `quality ≥ 4` | code heuristic |
| Overdue rule | Daily>2d, Weekly>10d, Monthly>35d | code heuristic |
| Avg DQ KPI | hard-coded **"2.4"** | display constant (not recomputed from `leaves`) |
| Recommended sources | Climate TRACE, MSCI, Sustainalytics, S&P Trucost, NGFS, Copernicus CDS, OSM, World Bank WDI | real public/vendor catalogue, static |

The headline "Avg DQ Score 2.4" is a literal string in the KPI array, **not** derived from
`dqDistribution` — a small guide↔code inconsistency worth noting.

### 7.3 Calculation walkthrough

`getLeafNodes()` flattens the taxonomy → each leaf's pre-baked `.quality` drives the DQ bar/pie. The
same leaves feed `coverageGaps` (uncovered or ≥DQ4). `REFERENCE_DATA_SOURCES.length` populates
"Total Sources"; `coverageGaps.length` and `refreshData.filter(overdue)` populate the other KPIs.
`INTEGRATION_LOG` and `refreshData` are purely presentational, seeded by `sr()`.

### 7.4 Worked example

Suppose 300 leaf nodes: 40 at DQ1, 90 DQ2, 80 DQ3, 60 DQ4, 30 DQ5, plus 15 with no `dataSources`.
- **DQ bars** render counts 40/90/80/60/30.
- **Coverage gaps** = the 15 source-less nodes + all DQ4/DQ5 nodes (60+30=90), min(sum,25)=**25** shown;
  DQ5 nodes get `HIGH`, DQ4 `MEDIUM`.
- A *true* PCAF-weighted average would be `(40·1+90·2+80·3+60·4+30·5)/300 = (40+180+240+240+150)/300 =
  850/300 = 2.83` — note this differs from the displayed 2.4, confirming the KPI is a static label.

### 7.5 Data provenance & limitations

- `refreshData` frequencies/last-refresh and the entire `INTEGRATION_LOG` are synthetic, seeded by
  `sr(seed) = frac(sin(seed+1)×10⁴)`. Records counts and durations are decorative.
- Leaf `.quality` scores are analyst-assigned in `taxonomyTree`, not measured — the DQ distribution is
  as good as those manual tags.
- No live 4-dimension composite (completeness/timeliness/accuracy/coverage) despite the guide formula;
  `avgQuality` per source is read from the seed object where present.

**Framework alignment:** PCAF *Data Quality Score* 1–5 — the platform's core lens; PCAF assigns DQ per
financed-emissions data point by the reliability of its source (audited emissions = DQ1 … economic-
activity proxies = DQ5), exactly the ladder this registry surfaces. The recommended-sources table maps
gaps to TCFD/ISSB IFRS S2 data needs (physical hazard layers → Copernicus; scenario params → NGFS),
reflecting IFRS S2's requirement to disclose data sources and their limitations.

## 9 · Future Evolution

### 9.1 Evolution A — Live refresh telemetry and a computed average DQ (analytics ladder: rung 1 → 2)

**What.** EP-CS3 is a modest governance dashboard the guide describes fairly — but
§7 notes three softness points: the headline "Avg DQ Score 2.4" is a literal string,
not derived from the `dqDistribution` the page itself computes; `refreshData`
frequencies and the entire 20-event `INTEGRATION_LOG` are `sr()`-seeded decoration;
and the leaf `.quality` scores are analyst-assigned tags in the taxonomy tree. The
coverage-gap logic (leaves with no source or DQ ≥ 4) is genuinely useful. Evolution
A replaces decoration with measurement.

**How.** (1) One-line honesty fix first: compute the average DQ from
`dqDistribution` instead of the hard-coded 2.4. (2) Refresh telemetry: the platform
now runs a real Tier-1 reference-data layer (~221k rows behind `/api/v1/refdata`)
and 19 ingesters — read actual last-refresh timestamps and row counts per source
from the ingestion logs and the lineage service's
`GET /lineage/reference-data-inventory`, replacing the seeded log; the overdue rule
(Daily>2d, Weekly>10d, Monthly>35d) already works, it just needs real dates.
(3) Quality-tag review workflow: leaf DQ scores stay analyst-assigned (that is the
PCAF method) but gain provenance — assessor, date, rationale — so the distribution
is auditable. (4) The `RECOMMENDED_SOURCES` table cross-references the platform's
actual integration status (several recommendations, e.g. NGFS and World Bank, are
already integrated — the registry should know).

**Prerequisites.** Ingestion-log access; coordination with `data-source-manager`
(that module owns provider operations; this one owns taxonomy coverage — keep the
split explicit). **Acceptance:** the avg-DQ KPI equals the distribution's
computed mean; an ingester run updates its source's last-refresh within a cycle;
each leaf quality tag shows its assessor and date.

### 9.2 Evolution B — Gap-to-source recommendation copilot (LLM tier 1)

**What.** The module's most decision-shaped output — "these taxonomy nodes lack a
primary source; here are candidate public datasets" — currently pairs a computed
gap list with a static recommendation table. Evolution B makes the pairing
reasoned: for a selected coverage gap, the copilot proposes candidate sources with
grounded rationale (what the dataset covers, its access model, its PCAF tier
potential, integration effort given the platform's ingester patterns), drawing on
the curated catalogue plus the platform's documented data-sources research (the
PHYSICAL_CLIMATE_RISK_SOURCES doc and wave-1 integration learnings, which corrected
several public-source assumptions).

**How.** Tier-1 RAG: the recommendation catalogue, this Atlas record, and the
platform's data-sources research docs as corpus; the selected gap's taxonomy
context passes as prompt state. Recommendations carry an honesty discipline the
wave-1 project learned empirically: access models change (UK EPC auth, UCDP
self-service), so every recommendation states its verification date and flags
unverified access assumptions.

**Prerequisites.** Corpus embedding of the research docs (D3); Evolution A's
integration-status cross-reference. **Acceptance:** recommendations for a test gap
cite catalogue entries or research-doc findings; already-integrated sources are
identified as such; access-model claims carry verification dates.